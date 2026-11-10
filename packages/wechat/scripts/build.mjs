/** @centui/wechat 构建编排：js（会清空 dist/components 重建）→ styles → verify */
import { buildStyles } from './build-styles.mjs'
import { buildJs } from './build-js.mjs'

await buildJs()
await buildStyles()

if (!process.exitCode) {
  const { spawnSync } = await import('node:child_process')
  const r = spawnSync('node', [new URL('./verify.mjs', import.meta.url).pathname], { stdio: 'inherit' })
  process.exitCode = r.status
}
