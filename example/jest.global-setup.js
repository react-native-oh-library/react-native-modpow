/*
 * Copyright (c) 2026 Huawei Device Co., Ltd. All rights reserved
 * Use of this source code is governed by a MIT license that can be
 * found in the LICENSE file.
 */

/**
 * Jest globalSetup：每次运行前将仓库根源码 src/ 预编译为纯 JS，
 * 输出到 example/.modpow-sut/ 下。
 *
 * 为什么需要复制：jest 仅对 rootDir（example/）内的普通文件做覆盖率
 * 插桩，仓库根源码（rootDir 之外）与 node_modules 内的安装副本
 * （file:../…*.tgz）均不产生覆盖率数据。每次运行都清空重建，
 * 保证测的始终是当前源码，不存在版本漂移。
 *
 * 为什么要预编译为 JS（对齐 react-native-fs 的 .rnfs-sut 形态）：
 * babel-jest 注入的 istanbul 插桩在 TS 专属语法上会丢失计数器
 * （如 codegen Spec 的 `export default XXX.get<Spec>('…')!` 语句，
 * 实测该文件 s-map 为空）。预先用与 jest transform 相同的
 * babel 配置（preset-typescript + preset-env/commonjs）把 src 目录下
 * 全部 .ts 编译为 .js，istanbul 只处理纯 JS，插桩稳定可靠。
 */

'use strict';

const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

module.exports = function globalSetup() {
  const rootDir = path.resolve(__dirname);
  const srcDir = path.join(rootDir, '..', 'src');
  const destDir = path.join(rootDir, '.modpow-sut');

  fs.rmSync(destDir, {recursive: true, force: true});

  const walk = dir =>
    fs.readdirSync(dir, {withFileTypes: true}).flatMap(entry => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return walk(full);
      }
      return full.endsWith('.ts') ? [full] : [];
    });

  for (const file of walk(srcDir)) {
    const rel = path.relative(srcDir, file);
    const result = babel.transformFileSync(file, {
      babelrc: false,
      configFile: false,
      presets: [
        ['@babel/preset-env', {targets: {node: 'current'}}],
        '@babel/preset-typescript',
      ],
      // importInterop: 'none' —— 不生成 _interopRequireDefault 样板
      // （其死路径无法被用例覆盖，会拖累分支覆盖率阈值）
      plugins: [
        [
          '@babel/plugin-transform-modules-commonjs',
          {importInterop: 'none'},
        ],
      ],
    });
    const dest = path.join(destDir, rel.replace(/\.ts$/, '.js'));
    fs.mkdirSync(path.dirname(dest), {recursive: true});
    fs.writeFileSync(dest, result.code);
  }
};
