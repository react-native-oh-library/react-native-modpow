# @react-native-ohos/react-native-modpow for HarmonyOS

本项目基于 [react-native-modpow](https://github.com/seald/react-native-modpow) 开发，为 React Native 鸿蒙（OpenHarmony）适配版本。

## 版本对应关系

| 鸿蒙适配包版本 | 原始库版本 | 支持 RN 版本 | Autolink | 编译 API 版本 |
| ------------ | ---------- | ------------ | -------- | ------------- |
| 1.1.0 | 1.1.0 | 0.72+ | 是 | API12+ |

## 安装

```bash
npm install @react-native-ohos/react-native-modpow
```

## 使用

```js
import modPow from 'react-native-modpow'

const result = modPow({
  target: '2',   // 底数（十六进制字符串）
  value: '2',    // 指数（十六进制字符串）
  modifier: '3'  // 模数（十六进制字符串）
})
// result = '1'（2^2 mod 3 = 1）
```

node-forge RSA 密钥生成加速（本库主要用途）：

```js
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

> import 时使用原库名 `'react-native-modpow'`，而非鸿蒙包名（由 RNOH alias 映射到 `@react-native-ohos/react-native-modpow`）。

**平台差异**：
- `modPow` 为同步阻塞调用（与 Android/iOS 原库行为一致，不返回 Promise）；RSA 2048 位级大参数计算期间会阻塞调用线程
- 非法输入（非十六进制字符 / 空串 / 零模数）以受控 `Error` 抛出（对齐 iOS 端 `RCTMakeError` 的防御式行为；Android 原库为原生抛异常）
- 返回值为小写十六进制字符串、无前导零、无 `0x` 前缀，与 `java.math.BigInteger.toString(16)` 格式一致

**权限要求**：
- 无需任何权限

## Link

| 版本 | 是否支持 Autolink |
|------|------------------|
| 当前版本 | 是 |

如使用版本支持 Autolink 且工程已接入，可跳过手动配置。

<details>
<summary>Manual Link 配置</summary>

> **说明**：本模块需要同时在 C++ 侧和 ETS 侧注册 Package。

### 1. Overrides RN SDK

在工程根目录 `oh-package.json5` 添加：

```json
{
  "overrides": {
    "@rnoh/react-native-openharmony": "./react_native_openharmony"
  }
}
```

### 2. 引入原生端依赖

打开 `entry/oh-package.json5`，添加：

```json
"dependencies": {
  "@react-native-ohos/react-native-modpow": "file:../../node_modules/@react-native-ohos/react-native-modpow/harmony/modpow.har"
}
```

执行 `ohpm install`。

### 3. 配置 CMakeLists

打开 `entry/src/main/cpp/CMakeLists.txt`，添加：

```cmake
set(OH_MODULES "${CMAKE_CURRENT_SOURCE_DIR}/../../../oh_modules")

add_subdirectory("${OH_MODULES}/@react-native-ohos/react-native-modpow/src/main/cpp" ./modpow)

target_link_libraries(rnoh_app PUBLIC modpow)
```

### 4. 注册 Package（C++ 侧）

打开 `entry/src/main/cpp/PackageProvider.cpp`，添加：

```cpp
#include "ModpowPackage.h"

std::vector<std::shared_ptr<Package>> PackageProvider::getPackages(Package::Context ctx) {
    return {
        std::make_shared<ModpowPackage>(ctx),
    };
}
```

### 5. 注册 Package（ETS 侧）

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

## 属性 / API

| API | 描述 | 参数 | 返回值 | HarmonyOS 支持 |
|-----|------|------|--------|----------------|
| modPow | 大数模幂运算：target^value mod modifier（同步阻塞） | args: `{ target: string, value: string, modifier: string }`，均为十六进制字符串 | string（十六进制，小写无前导零） | ✅ 完全支持 |

### 平台差异
- 鸿蒙端为同步 TurboModule 方法，与原库 Android（`isBlockingSynchronousMethod = true`）/ iOS（`RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD`）语义一致，不返回 Promise
- 非法入参以受控 `Error` 抛出（原库两端本不一致：Android 原生抛异常、iOS 返回错误数组；鸿蒙端取防御式一端，不让异常以不可控方式逃逸）

### 未实现功能
无。原库唯一公开能力 `modPow` 已在鸿蒙端完整实现（ArkTS `bigint` 平方-乘算法），无平台能力缺失项。

### 使用限制
- `target` / `value` / `modifier` 必须为非空十六进制字符串（`[0-9a-fA-F]+`），且 `modifier` 非零
- 大参数（RSA 2048 位级）为同步阻塞计算，调用方需自行评估阻塞时长（Example 内置大参数实测用例可验证）
- 无需任何权限声明

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

## 约束与限制

### 兼容性

- RNOH: 0.72+
- HarmonyOS SDK: API 12+
- DevEco Studio: 5.0+

## 遗留问题

无

## 开源协议

本项目基于原始库 [MIT 协议](https://github.com/seald/react-native-modpow/blob/master/LICENSE)，详见 [LICENSE](./LICENSE) 文件。