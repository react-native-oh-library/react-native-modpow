> 文档模板：v0.4.2

<p align="center">
  <h1 align="center"> <code>react-native-modpow</code> </h1>
</p>

本项目基于 [react-native-modpow](https://github.com/seald/react-native-modpow) 开发，是其在 React Native 鸿蒙（OpenHarmony）平台的适配版本，新的包名为：`@react-native-ohos/react-native-modpow`，版本所属关系如下：

| 三方库名称 | 三方库版本（npm地址） | 发布信息 | 支持RN版本 | Autolink | 编译API版本 | 社区基线版本 | 源码地址 |
| ------------ | ------------ | ------------------------------ | ------------- | ------------- |------------------------ | ------------- | ------------- |
| @react-native-ohos/react-native-modpow | [~ 1.1.0](https://www.npmjs.com/package/@react-native-ohos/react-native-modpow) | [GitHub Releases](https://github.com/xiayukun1111/react-native-modpow/releases) | 0.84.* / 0.82.* / 0.77.* / 0.72.* | 是 | API12+ | 1.1.0 | [master](https://github.com/xiayukun1111/react-native-modpow) |

## 简介

导出原生 `BigInteger.modPow()` 能力，为 node-forge 等 JS 密码学库提供大数模幂运算加速，避免 RSA 密钥生成把 UI 阻塞一分钟以上。<br/>
鸿蒙端基于 ArkTS `bigint` 实现平方-乘算法，以同步 TurboModule 方法导出，语义与 Android / iOS 原库一致。

## 下载安装

进入到工程目录并输入以下命令：

**npm**

```bash
npm install @react-native-ohos/react-native-modpow
```

**yarn**

```bash
yarn add @react-native-ohos/react-native-modpow
```

## Link

|                                      | 是否支持autolink | RN框架版本 |
|--------------------------------------|----------------|-----------|
| ~ 1.1.0                              | 是             |  0.84 / 0.82 / 0.77 / 0.72     |

使用 AutoLink 的工程需要根据 [Autolink 框架指导文档](https://gitcode.com/CPF-RN/ohos_react_native/blob/master/docs/zh-cn/Autolinking.md) 配置。

### 运行

点击右上角的 `sync` 按钮

或者在命令行终端执行：

```bash
cd entry
ohpm install
```

然后编译、运行即可。

<details>
<summary>Manual Link 配置（Autolink 不可用时）</summary>

> **说明**：本模块需要同时在 C++ 侧和 ETS 侧注册 Package。

#### 1. Overrides RN SDK

在工程根目录 `oh-package.json5` 添加：

```json
{
  "overrides": {
    "@rnoh/react-native-openharmony": "./react_native_openharmony"
  }
}
```

#### 2. 引入原生端依赖

打开 `entry/oh-package.json5`，添加：

```json
"dependencies": {
  "@react-native-ohos/react-native-modpow": "file:../../node_modules/@react-native-ohos/react-native-modpow/harmony/modpow.har"
}
```

执行 `ohpm install`。

#### 3. 配置 CMakeLists

打开 `entry/src/main/cpp/CMakeLists.txt`，添加：

```cmake
set(OH_MODULES "${CMAKE_CURRENT_SOURCE_DIR}/../../../oh_modules")

add_subdirectory("${OH_MODULES}/@react-native-ohos/react-native-modpow/src/main/cpp" ./modpow)

target_link_libraries(rnoh_app PUBLIC modpow)
```

#### 4. 注册 Package（C++ 侧）

打开 `entry/src/main/cpp/PackageProvider.cpp`，添加：

```cpp
#include "ModpowPackage.h"

std::vector<std::shared_ptr<Package>> PackageProvider::getPackages(Package::Context ctx) {
    return {
        std::make_shared<ModpowPackage>(ctx),
    };
}
```

#### 5. 注册 Package（ETS 侧）

打开 `entry/src/main/ets/RNPackagesFactory.ets`，添加：

```typescript
import { ModpowPackage } from '@react-native-ohos/react-native-modpow/ts';

export function createRNPackages(ctx: RNPackageContext): RNPackage[] {
  return [
    new ModpowPackage(ctx),
  ];
}
```

</details>

## 约束与限制

### 兼容性

本文档内容基于以下版本验证通过：

1. RNOH: 0.72.139; SDK: HarmonyOS API 12+; DevEco Studio: 5.0+。

Example 已适配 0.72 / 0.77 / 0.82 / 0.84 四个框架版本，可用 `npm run framework` 一键切换（见[快速验证](#快速验证运行-example)）。

### 权限要求

无需声明 `ohos.permission`，也无需运行时动态申请权限。

### 编译运行API要求（如有）

> [!TIP] 当前三方库已支持在 `API12+` 工程编译。

> [!TIP] 本库为纯 ArkTS `bigint` 计算，无云端服务、无系统能力版本依赖，所有 API 在支持的 RNOH 版本上行为一致。

## 使用示例

下面的代码展示了这个库的基本使用场景：

> [!WARNING] 使用时 import 的库名不变：`import modPow from 'react-native-modpow'`（由 RNOH alias 映射到 `@react-native-ohos/react-native-modpow`）。

```javascript
import modPow from 'react-native-modpow'

const result = modPow({
  target: '2',   // 底数（十六进制字符串）
  value: '2',    // 指数（十六进制字符串）
  modifier: '3'  // 模数（十六进制字符串）
})
// result = '1'（2^2 mod 3 = 1）
```

node-forge RSA 密钥生成加速（本库主要用途）：

```javascript
import Forge from 'node-forge'
import modPow from 'react-native-modpow'

Forge.jsbn.BigInteger.prototype.modPow = function nativeModPow (e, m) {
  const result = modPow({
    target: this.toString(16),
    value: e.toString(16),
    modifier: m.toString(16)
  })
  return new Forge.jsbn.BigInteger(result, 16)
}
```

## 使用说明

- `modPow` 为同步阻塞调用，与原库两端语义一致（Android `isBlockingSynchronousMethod = true` / iOS `RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD`），不返回 Promise；RSA 2048 位级大参数计算期间会阻塞调用线程，调用方需自行评估阻塞时长（Example 内置大参数实测用例可验证）。
- `target` / `value` / `modifier` 必须为非空十六进制字符串（`[0-9a-fA-F]+`），且 `modifier` 非零；非法输入（非十六进制字符 / 空串 / 零模数）以受控 `Error` 抛出，对齐 iOS 端 `RCTMakeError` 的防御式行为（Android 原库为原生抛异常）。
- 返回值为小写十六进制字符串、无前导零、无 `0x` 前缀，与 `java.math.BigInteger.toString(16)` 格式一致。

## 接口说明

> [!TIP] "Platform"列表示该属性在原三方库上支持的平台。

> [!TIP] "OpenHarmony Support"列为 yes 表示 OpenHarmony平台支持 该属性；no 则表示不支持；partially 表示部分支持。使用方法跨平台一致，效果对标 iOS 或 Android 的效果。

### API

| 名称 | 类型 | 参数类型 | 返回值 | 必填 | 平台 | OpenHarmony平台支持 | 描述 |
|--------|---------|-----|-------|-------|--------|-----|-----------------|
| modPow | function | args: `{ target: string, value: string, modifier: string }` | string | Yes | All | yes | 大数模幂运算 `target^value mod modifier`，同步阻塞。三个参数均为十六进制字符串，返回小写十六进制字符串（无前导零、无 `0x` 前缀）。 |

### 未实现功能

无。原库唯一公开能力 `modPow` 已在鸿蒙端完整实现，无平台能力缺失项。

## 快速验证（运行 Example）

### 前置条件

| 依赖 | 版本要求 |
|------|----------|
| Node.js | >= 18 |
| DevEco Studio | 5.0+ / 6.0+ |
| HarmonyOS SDK | API 12+ |

### 运行步骤

**1. 克隆仓库**

```bash
git clone <仓库地址>
cd <仓库目录>
```

**2. 安装依赖并构建**

```bash
npm install --legacy-peer-deps
npm pack           # 生成 tgz 包（会自动触发 prepare 构建 JS 产物）
```

**3. 进入 example 目录，安装依赖**

```bash
cd example
npm install --legacy-peer-deps
```

**4. 生成 JS Bundle**

```bash
npm run dev
```

产物：`harmony/entry/src/main/resources/rawfile/bundle.harmony.js`

**5. 用 DevEco Studio 打开鸿蒙工程**

- 打开 DevEco Studio
- 选择 `example/harmony` 目录
- 等待 Sync 完成

**6. 编译并运行 HAP**

在 DevEco Studio 中点击运行按钮，将 HAP 安装到设备/模拟器。

> **注意**：Example 中已预置插件依赖和 Package 注册，无需手动配置 Link。

### 切换 RN 框架版本

Example 支持在 `0.72` / `0.77` / `0.82` / `0.84` 之间一键切换 RNOH 框架版本：

```bash
cd example
npm run framework -- 0.77              # 切换版本（改写 package.json / babel / oh-package）
npm install --legacy-peer-deps         # 重装依赖
npm run framework -- 0.77 --sync-har   # 按 node_modules 实际 HAR 文件校正指向
```

或一条命令完成「切换 + npm install + ohpm install」：

```bash
npm run run:harmony -- 0.77
```

切换时脚本会自动：

- 改写 `react` / `react-native` / `@react-native-oh/react-native-harmony` 版本及全部 devDependencies/overrides
- 更新 babel preset（0.72 用 `metro-react-native-babel-preset`，0.77+ 用 `@react-native/babel-preset`）
- 同步 `harmony/oh-package.json5` 与 `harmony/entry/oh-package.json5` 中 `@rnoh/react-native-openharmony` 的 HAR 指向（0.72 为 `react_native_openharmony_release.har`，0.77+ 为 `react_native_openharmony.har`）
- 版本变化时清理旧的 `node_modules` / `oh_modules` / lock 文件

当前使用的框架版本记录在 `example/.framework-version`（不入库）。

## 遗留问题

无

## 其他

无

## 目录结构

```
/react-native-modpow                       # 项目根目录
├── harmony/                               # 鸿蒙适配代码
│   ├── modpow.har                         # HAR 包
│   └── modpow/                            # 鸿蒙模块源码
│       ├── index.ets                      # 模块入口
│       ├── ts.ets                         # TS 声明入口
│       ├── oh-package.json5
│       └── src/main/
│           ├── ets/                       # ArkTS 实现
│           │   ├── ModpowTurboModule.ets
│           │   ├── ModpowTurboModulesFactory.ets
│           │   └── generated/             # Codegen 产物
│           └── cpp/                       # C++ 桥接
│               ├── CMakeLists.txt
│               ├── ModpowPackage.h
│               └── generated/             # Codegen 产物
├── src/                                   # RN JS / Spec
│   ├── index.ts                           # JS 入口
│   └── specs/v1/NativeModpow.ts           # TurboModule Spec
├── example/                               # 门禁 example
│   └── scripts/use-framework.js           # RNOH 框架版本切换脚本
├── package.json
├── README.md
└── LICENSE
```

## 贡献代码

使用过程中发现任何问题都可以提交 [Issue](https://github.com/xiayukun1111/react-native-modpow/issues)，当然，也非常欢迎提交 [PR](https://github.com/xiayukun1111/react-native-modpow/pulls)。

## 开源协议

本项目基于 [The MIT License (MIT)](./LICENSE)，请自由地享受和参与开源。感谢原始库 [react-native-modpow](https://github.com/seald/react-native-modpow)。
