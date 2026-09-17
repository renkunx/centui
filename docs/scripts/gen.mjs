#!/usr/bin/env node
/**
 * 文档站内容生成器（M5）：
 * 1. 从 packages/vue/src/components/<name>/index.ts 定位主组件 SFC
 * 2. 用 @vue/compiler-sfc + TypeScript AST 提取 props / emits / slots（JSDoc 与默认值）
 * 3. 生成 src/data/api/<name>.json（API 数据，供 mdx 页面渲染 API 表）
 * 4. 生成组件内容页 mdx（zh-CN 默认 / en 双语），每页含 demo 岛 + API 表
 *
 * 运行：pnpm --filter @mand-mobile/docs gen（dev/build 前自动执行）
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from '@vue/compiler-sfc'
import ts from 'typescript'

const DOCS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const VUE_SRC = path.resolve(DOCS_ROOT, '..', 'packages', 'vue', 'src')
const CONTENT_ROOT = path.join(DOCS_ROOT, 'src', 'content', 'docs')
const DATA_ROOT = path.join(DOCS_ROOT, 'src', 'data', 'api')

const { COMPONENTS } = await import(path.join(DOCS_ROOT, 'src', 'lib', 'registry.ts'))

fs.mkdirSync(CONTENT_ROOT, { recursive: true })
fs.mkdirSync(DATA_ROOT, { recursive: true })

/* ============ TS AST helpers ============ */

function findCalls(sourceFile, name) {
  const calls = []
  const visit = (n) => {
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === name) {
      calls.push(n)
    }
    ts.forEachChild(n, visit)
  }
  visit(sourceFile)
  return calls
}

/** 解析 props 类型节点 → 成员列表（对象字面量 / 类型引用[interface/type/class] / 交叉类型） */
function typeMembers(typeNode, sourceFile, depth = 0) {
  if (depth > 6 || !typeNode) return []

  if (ts.isTypeLiteralNode(typeNode)) {
    return typeNode.members
  }
  if (ts.isTypeReferenceNode(typeNode) && ts.isIdentifier(typeNode.typeName)) {
    const name = typeNode.typeName.text
    const decls = findTypeDecls(sourceFile, name)
    return decls.flatMap((d) => {
      if (ts.isInterfaceDeclaration(d) || ts.isClassDeclaration(d)) return d.members
      if (ts.isTypeAliasDeclaration(d)) return typeMembers(d.type, sourceFile, depth + 1)
      return []
    })
  }
  if (ts.isIntersectionTypeNode(typeNode)) {
    return typeNode.types.flatMap((t) => typeMembers(t, sourceFile, depth + 1))
  }
  return []
}

function findTypeDecls(sourceFile, name) {
  const out = []
  const scan = (n) => {
    if (
      (ts.isInterfaceDeclaration(n) || ts.isTypeAliasDeclaration(n) || ts.isClassDeclaration(n)) &&
      n.name?.text === name
    ) {
      out.push(n)
    }
    ts.forEachChild(n, scan)
  }
  scan(sourceFile)
  return out
}

/** JSDoc 描述（保持单行） */
function jsdocText(node) {
  const tags = ts.getJSDocCommentsAndTags?.(node) ?? []
  const doc = tags.find((t) => t.kind === ts.SyntaxKind.JSDoc)
  if (!doc) return ''
  return doc
    .getText()
    .replace(/^\/\*\*/, '')
    .replace(/\*\/$/, '')
    .split('\n')
    .map((l) => l.replace(/^\s*\*\s?/, '').trim())
    .filter(Boolean)
    .join(' ')
}

function typeText(node) {
  try {
    return node.getText().replace(/\s+/g, ' ')
  } catch {
    return 'unknown'
  }
}

function literalValue(node) {
  if (!node) return ''
  switch (node.kind) {
    case ts.SyntaxKind.StringLiteral:
      return `'${node.text}'`
    case ts.SyntaxKind.NumericLiteral:
    case ts.SyntaxKind.BigIntLiteral:
    case ts.SyntaxKind.TrueKeyword:
    case ts.SyntaxKind.FalseKeyword:
    case ts.SyntaxKind.NullKeyword:
      return node.getText()
    default:
      try {
        return node.getText().replace(/\s+/g, ' ')
      } catch {
        return ''
      }
  }
}

/* ============ SFC API 提取 ============ */

function extractApi(sfcPath, componentName) {
  const content = fs.readFileSync(sfcPath, 'utf8')
  const { descriptor, errors } = parse(content, { filename: sfcPath })
  if (errors.length) {
    console.warn(`  [gen] ⚠ ${path.basename(sfcPath)}: ${errors[0].message}`)
  }

  const api = { component: componentName, props: [], emits: [], slots: [] }

  const script = descriptor.scriptSetup || descriptor.script
  if (script) {
    const sourceFile = ts.createSourceFile(
      sfcPath + '.ts',
      script.content,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS,
    )

    // --- props ---
    const propCall = findCalls(sourceFile, 'defineProps')[0]
    if (propCall) {
      const typeArg = propCall.typeArguments?.[0]
      const members = typeMembers(typeArg, sourceFile)

      // withDefaults 默认值
      const defaults = {}
      const wd = findCalls(sourceFile, 'withDefaults')[0]
      if (wd && wd.arguments.length > 1 && ts.isObjectLiteralExpression(wd.arguments[1])) {
        for (const p of wd.arguments[1].properties) {
          if (ts.isPropertyAssignment(p) && ts.isIdentifier(p.name)) {
            defaults[p.name.text] = literalValue(p.initializer)
          }
        }
      }

      for (const m of members) {
        if (!ts.isPropertySignature(m)) continue
        const name = m.name?.getText?.() ?? ''
        if (!name) continue
        api.props.push({
          name,
          type: m.type ? typeText(m.type) : 'any',
          default: defaults[name] ?? undefined,
          desc: jsdocText(m),
          required: !m.questionToken,
        })
      }
    }

    // --- emits ---
    const emitCall = findCalls(sourceFile, 'defineEmits')[0]
    if (emitCall) {
      const typeArg = emitCall.typeArguments?.[0]
      const collect = (t) => {
        if (ts.isTypeLiteralNode(t)) {
          for (const m of t.members) {
            if (!ts.isPropertySignature(m)) continue
            const ev = m.name?.getText?.() ?? ''
            if (!ev) continue
            const payload = m.type ? typeText(m.type).replace(/^\[(.*)\]$/s, '$1').trim() : ''
            api.emits.push({ name: ev, payload })
          }
        } else if (ts.isUnionTypeNode(t)) {
          for (const u of t.types) {
            if (ts.isLiteralTypeNode(u) && u.literal.kind === ts.SyntaxKind.StringLiteral) {
              api.emits.push({ name: u.literal.text, payload: '' })
            }
          }
        } else {
          api.emits.push({ name: typeText(t), payload: '' })
        }
      }
      if (typeArg) collect(typeArg)
    }
  }

  // --- slots：template 静态扫描 ---
  const templateContent = descriptor.template?.content ?? ''
  const seen = new Set()
  const slotRe = /<slot(?:\s+[^>]*?name\s*=\s*["']([^"']+)["'])?/g
  let m
  while ((m = slotRe.exec(templateContent))) {
    const name = m[1] || 'default'
    if (seen.has(name)) continue
    seen.add(name)
    api.slots.push({ name, desc: name === 'default' ? '默认插槽' : '具名插槽' })
  }

  return api
}

/** 从组件目录 index.ts 定位主 SFC 文件名 */
function findMainSfc(compDir) {
  const indexPath = path.join(compDir, 'index.ts')
  if (fs.existsSync(indexPath)) {
    const idx = fs.readFileSync(indexPath, 'utf8')
    const m = idx.match(/from\s+['"]\.\/([A-Za-z0-9-]+\.vue)['"]/)
    if (m) return m[1]
  }
  const files = fs.readdirSync(compDir).filter((f) => f.endsWith('.vue'))
  const pascal = compDir
    .split(path.sep)
    .pop()
    .split('-')
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join('')
  if (files.includes(pascal + '.vue')) return pascal + '.vue'
  return files.find((f) => /^[A-Z][A-Za-z]+\.vue$/.test(f) && !['Icon.vue'].includes(f)) || files[0]
}

/* ============ mdx 生成 ============ */

function mdxFor(meta, locale) {
  const isEn = locale === 'en'
  const pageTitle = meta.en === meta.zh ? meta.zh : `${meta.zh} ${meta.en}`
  const desc = isEn ? meta.enDesc : meta.zhDesc
  const intro = isEn
    ? `Interactive preview and API reference for **${meta.en}**.`
    : `**${meta.zh}** 组件交互预览与 API 说明。`
  return `---
title: ${pageTitle}
description: ${desc}
---

import ComponentDemo from '@/components/demos/${meta.name}/index.vue'
import ApiTable from '@/components/ApiTable.astro'
import api from '@/data/api/${meta.name}.json'

${intro}

<ComponentDemo client:visible />

## ${isEn ? 'Props' : '属性 Props'}

<ApiTable title="${isEn ? 'Props' : '属性'}" kind="props" rows={api.props} />

## ${isEn ? 'Events' : '事件 Events'}

<ApiTable title="${isEn ? 'Events' : '事件'}" kind="emits" rows={api.emits} />

## ${isEn ? 'Slots' : '插槽 Slots'}

<ApiTable title="${isEn ? 'Slots' : '插槽'}" kind="slots" rows={api.slots} />
`
}

/* ============ main ============ */

let generated = 0
for (const meta of COMPONENTS) {
  const compDir = path.join(VUE_SRC, 'components', meta.name)
  if (!fs.existsSync(compDir)) {
    console.warn(`[gen] ⚠ 组件目录不存在: ${compDir}`)
    continue
  }
  const sfcFile = findMainSfc(compDir)
  if (!sfcFile) {
    console.warn(`[gen] ⚠ 未找到主 SFC: ${meta.name}`)
    continue
  }
  const api = extractApi(path.join(compDir, sfcFile), meta.name)

  fs.writeFileSync(path.join(DATA_ROOT, `${meta.name}.json`), JSON.stringify(api, null, 2))

  for (const locale of ['zh-CN', 'en']) {
    const dir = locale === 'en' ? 'en/components' : 'components'
    const file = path.join(CONTENT_ROOT, dir, `${meta.name}.mdx`)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, mdxFor(meta, locale))
  }
  generated++
}

console.log(`[gen] ✔ ${generated} 个组件 → API JSON + 双语页面已生成`)
console.log(`     API: ${path.relative(DOCS_ROOT, DATA_ROOT)}`)
console.log(`     页面: ${path.relative(DOCS_ROOT, path.join(CONTENT_ROOT, 'components'))} (+ en/)`)