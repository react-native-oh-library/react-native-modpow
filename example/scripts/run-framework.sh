#!/usr/bin/env bash
# 指定 RN 框架版本后安装依赖，准备运行 example。
# 用法: npm run run:harmony -- 0.72|0.77|0.82|0.84
set -euo pipefail

EXAMPLE="$(cd "$(dirname "$0")/.." && pwd)"
cd "$EXAMPLE"

VERSION="${1:-}"
if [[ "$VERSION" == "--" ]]; then
  VERSION="${2:-}"
fi
case "$VERSION" in
  0.72|0.77|0.82|0.84) ;;
  *)
    echo "用法: npm run run:harmony -- 0.72|0.77|0.82|0.84"
    exit 1
    ;;
esac

echo "==> 切换框架 $VERSION"
node ./scripts/use-framework.js "$VERSION"

echo "==> npm install"
npm install --legacy-peer-deps
node ./scripts/use-framework.js "$VERSION" --sync-har

if command -v ohpm >/dev/null 2>&1; then
  OHPM="ohpm"
elif [[ -x "/Applications/DevEco-Studio.app/Contents/tools/ohpm/bin/ohpm" ]]; then
  OHPM="/Applications/DevEco-Studio.app/Contents/tools/ohpm/bin/ohpm"
elif [[ -x "/c/Program Files/Huawei/DevEco Studio/tools/ohpm/bin/ohpm" ]]; then
  OHPM="/c/Program Files/Huawei/DevEco Studio/tools/ohpm/bin/ohpm"
else
  echo "找不到 ohpm"
  exit 1
fi

echo "==> ohpm install"
rm -rf harmony/oh_modules harmony/entry/oh_modules harmony/.ohpm
(cd harmony && "$OHPM" install)

echo "==> 完成。打包 JS 与构建 hap："
echo "    npm run dev        # 生成 harmony entry 的 JS bundle"
echo "    然后用 DevEco Studio 打开 example/harmony 构建运行"
