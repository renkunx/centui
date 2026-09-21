#!/usr/bin/env bash
# 双 registry 发布脚本（由 .github/workflows/release.yml 的 changesets/action 调用，
# 工作目录为仓库根目录）。
#
#  1. npmjs.com（正式渠道，包名保持 @centui/* 与 centui）
#     —— 认证：secret NPM_TOKEN（Automation token，绕过 2FA）。
#  2. GitHub Packages（镜像渠道）
#     —— GPR 硬性要求 npm scope 与认证账号同名，而 GitHub 的 centui 用户名已被
#        占用（2022 年注册的闲置账号，已可按 Name Squatting Policy 申请释放）。
#        因此镜像发布前把 4 个包的 name 与内部依赖统一改写为 @renkunx/*，
#        用内置 GITHUB_TOKEN（packages: write）发布，结束后还原工作区。
#        消费者安装 GPR 镜像时需配置 @renkunx 指向 npm.pkg.github.com。
#
# 两个 pass 均幂等：目标 registry 已存在的「包名@版本」自动跳过，重复触发安全。
# dist-tag：版本号含 "-"（预发布，如 3.0.0-alpha.0）→ alpha；正式版 → latest。
# NPM_TOKEN 未配置时整体跳过发布（npmjs 与 GPR 镜像同步门控），不阻塞流水线。
set -euo pipefail
cd "$(dirname "$0")/../.."

readonly -a PACKAGE_DIRS=(
  packages/core
  packages/styles
  packages/vue
  packages/react
)

readonly NPM_REGISTRY='https://registry.npmjs.org/'
readonly GPR_REGISTRY='https://npm.pkg.github.com'
# GPR 镜像 scope：必须与运行仓库的 owner 一致（GPR 硬性规则）
readonly GPR_SCOPE='@renkunx'

cleanup() {
  restore_npmrc
  restore_package_jsons
  return 0
}
trap cleanup EXIT

version_of() { node -p "require('./$1/package.json').version"; }
name_of() { node -p "require('./$1/package.json').name"; }

dist_tag_of() {
  if [[ "$1" == *-* ]]; then echo alpha; else echo latest; fi
}

write_npmrc() { # $1 = registry, $2 = 持 token 的环境变量名
  local host="${1#https://}"
  cat >.npmrc <<EOF
registry=$1
@centui:registry=$1
${GPR_SCOPE}:registry=$1
//$host/:_authToken=\${$2}
always-auth=true
EOF
}

restore_npmrc() {
  [[ -f .npmrc.bak ]] && mv -f .npmrc.bak .npmrc
  return 0
}

# ---- GPR 镜像改名：@centui/* → @renkunx/*，无 scope 的 centui → @renkunx/centui
#（含 dependencies/devDependencies 键）；仅作用于临时 manifest，发布后还原 ----
mirror_package_jsons() {
  local dir
  for dir in "${PACKAGE_DIRS[@]}"; do
    cp "$dir/package.json" "$dir/package.json.mirror-bak"
    node -e '
      const fs = require("fs");
      const f = process.argv[1];
      let s = fs.readFileSync(f, "utf8").replaceAll("@centui/", "@renkunx/");
      const p = JSON.parse(s);
      if (p.name === "centui") p.name = "@renkunx/centui";
      fs.writeFileSync(f, JSON.stringify(p, null, 2) + "\n");
    ' "$dir/package.json"
  done
}

restore_package_jsons() {
  local dir
  for dir in "${PACKAGE_DIRS[@]}"; do
    [[ -f "$dir/package.json.mirror-bak" ]] && mv -f "$dir/package.json.mirror-bak" "$dir/package.json"
  done
  return 0
}

publish_strict() { # $1 = registry, $2 = token env var；任何失败中断脚本
  local dir name version
  write_npmrc "$1" "$2"
  for dir in "${PACKAGE_DIRS[@]}"; do
    name=$(name_of "$dir")
    version=$(version_of "$dir")
    if npm view "$name@$version" version --registry "$1" >/dev/null 2>&1; then
      echo "⏭  $name@$version 已存在于 $1，跳过"
      continue
    fi
    echo "🚀 $name@$version → $1 (tag: $(dist_tag_of "$version"))"
    (
      cd "$dir" &&
        pnpm publish --access public --no-git-checks --tag "$(dist_tag_of "$version")"
    )
  done
}

# lenient：单包失败只输出 warning，保证脚本整体退出 0，
# 不阻塞 changesets/action 的 tag 推送与 GitHub Release
publish_lenient() { # $1 = registry, $2 = token env var
  local dir name version failed=0
  write_npmrc "$1" "$2"
  for dir in "${PACKAGE_DIRS[@]}"; do
    name=$(name_of "$dir")
    version=$(version_of "$dir")
    if npm view "$name@$version" version --registry "$1" >/dev/null 2>&1; then
      echo "⏭  $name@$version 已存在于 $1，跳过"
      continue
    fi
    echo "🚀 $name@$version → $1 (tag: $(dist_tag_of "$version"))"
    if (
      cd "$dir" &&
        pnpm publish --access public --no-git-checks --tag "$(dist_tag_of "$version")"
    ); then
      continue
    fi
    failed=1
    echo "::warning title=GPR mirror publish failed::$name@$version 发布 GPR 失败（镜像名 ${GPR_SCOPE}/*），原因见上方日志"
  done
  return "$failed"
}

cp .npmrc .npmrc.bak

# npmjs 与 GPR 镜像绑定在同一开关（NPM_TOKEN）后：两渠道同步发布，
# 避免镜像先于正式渠道出现未发布版本造成脱节
if [[ -z "${NPM_TOKEN:-}" ]]; then
  echo '::warning::未配置 secret NPM_TOKEN，跳过本次发布（npmjs 与 GPR 镜像；配置后合并 Version PR 或重跑本 workflow 即可）'
else
  echo '==> [1/2] 发布到 npmjs.com'
  publish_strict "$NPM_REGISTRY" NPM_TOKEN

  echo '==> [2/2] 发布 GPR 镜像（'"${GPR_SCOPE}"'/*，内置 GITHUB_TOKEN）'
  mirror_package_jsons
  if ! publish_lenient "$GPR_REGISTRY" GITHUB_TOKEN; then
    echo "::notice::GPR 镜像存在未发布的包，原因见上方 warning；npmjs 发布不受影响"
  fi
  restore_package_jsons
fi

cleanup
trap - EXIT
echo '==> 发布完成'
