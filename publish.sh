#!/usr/bin/env sh

# 确保脚本抛出遇到的错误
set -e

# build 生成 lib文件
npm run build

# ncc 生成 dist文件
npm run ncc

# 删除lib文件
rm -rf lib

# 将dist文件移入lib文件
mv dist lib

# 发布
npm publish


