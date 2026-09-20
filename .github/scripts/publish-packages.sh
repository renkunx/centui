#!/usr/bin/env bash
# 双 registry 发布脚本（由 .github/workflows/release.yml 的 changesets/action 调用，
# 工作目录为仓库根目录）。
#
#  1. npmjs.com        —— 认证：secret NPM_TOKEN（Automation token，绕过 2FA）
#  2. GitHub Packages  —— 认证：secret GPR_TOKEN（centui 账号的 PAT，
#                         write:packages scope）；未配置时回退内置 GITHUB_TOKEN。
#                         GPR 硬性要求包 scope 与认证账号同名，@centui/* 在
#                         renkunx 名下无法用内置 token 发布，失败仅告警不阻塞
#                         （npm 发布与 tag/GitHub Release 已先完成，见 workflow）。
#
# 幂等：目标 registry 已存在的「包名@版本」自动跳过，重复触发安全。
# dist-tag：版本号含 "-"（预发布，如 3.0.0-alpha.0）→ alpha；正式版 → latest。
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

# 发布期间用临时 .npmrc 切换 registry 认证，结束后必须还原
restore_npmrc() {
  [[ -f .npmrc.bak ]] && mv -f .npmrc.bak .npmrc
  return 0
}
trap restore_npmrc EXIT

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
//$host/:_authToken=\${$2}
always-auth=true
EOF
}

# strict 模式（npm）：任何失败都中断（set -e），
# 由 changesets/action 感知并使 Release 失败
publish_strict() { # $1 = registry, $2 = token env var
  local dir name version tag
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

# lenient 模式（GPR）：单包失败只输出 warning，保证脚本整体退出 0，
# 不阻塞 changesets/action 的 tag 推送与 GitHub Release
publish_lenient() { # $1 = registry, $2 = token env var
  local dir name version tag failed=0
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
    echo "::warning title=GPR publish failed::$name@$version 发布 GitHub Packages 失败——GPR 要求 scope 与认证账号同名，请配置 secret GPR_TOKEN（centui 账号的 PAT，write:packages），或将仓库迁移至 centui 账号/组织"
  done
  return "$failed"
}

cp .npmrc .npmrc.bak

echo '==> [1/2] 发布到 npmjs.com'
publish_strict "$NPM_REGISTRY" NPM_TOKEN

echo '==> [2/2] 发布到 GitHub Packages'
export GPR_EFFECTIVE="${GPR_TOKEN:-${GITHUB_TOKEN:-}}"
if [[ -z "${GPR_TOKEN:-}" ]]; then
  echo '::warning::未配置 secret GPR_TOKEN，GPR 发布回退内置 GITHUB_TOKEN（仅当仓库 owner 名为 centui 时可成功，否则全部告警跳过）'
fi
if ! publish_lenient "$GPR_REGISTRY" GPR_EFFECTIVE; then
  echo '::notice::GitHub Packages 存在未发布的包，原因见上方 warning；npm 发布不受影响'
fi

restore_npmrc
trap - EXIT
echo '==> 发布完成'
