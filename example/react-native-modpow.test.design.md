# react-native-modpow XTS 测试设计文档

> 测试工程位于 `example/`（对齐 react-native-fs 的 RNOH JS 白盒测试规范），
> 用例通过 `__mocks__/react-native.js` 整模块 mock 原生层，被测源码经
> `jest.global-setup.js` 预编译复制到 `.modpow-sut/`（运行产物，已 gitignore）。

## 1. 测试概述

### 1.1 测试目标

为 @react-native-ohos/react-native-modpow 生成 Jest 白盒测试用例，覆盖以下功能：

- JS 入口 `modPow()` 的入参校验全分支（null / 类型错误 / 非法十六进制 / 零模数）
- 错误契约（错误消息、校验优先级、原生异常透传）
- 合法入参向原生 TurboModule 的透传行为（参数原样、调用次数、返回值透传）
- 鸿蒙侧算法（平方-乘模幂）的数值正确性、边界行为与结果格式化

### 1.2 测试范围

- 测试平台：HarmonyOS（JS 白盒，Node 环境运行）
- 测试框架：Jest 29 + babel-jest（example 工程自带依赖，零额外安装）
- 被测库版本：1.1.0
- 被测对象路径：
  - `src/index.ts`（JS 入口，白盒分支覆盖目标）
  - `src/specs/v1/NativeModpow.ts`（TurboModule Spec，经真实加载链路覆盖）
  - `harmony/modpow/src/main/ets/ModpowTurboModule.ets`（ArkTS 实现，同构移植为原生 mock 仿真）

### 1.3 测试环境与运行方式

```bash
cd example
npm test                # 全量 31 个用例
npm run test:coverage   # 含覆盖率（全量锁定 100%，产物 example/coverage，已 gitignore）
npx jest --testNamePattern="ModpowEntryValidationTest"   # 按套件过滤
```

## 2. 测试工程结构

```
example/
├── __tests__/
│   ├── ModpowTest-test.js           # 入口白盒（校验分支 / 错误契约 / 透传）
│   └── ModpowAlgorithmTest-test.js  # 算法白盒（ArkTS 同构仿真 + 双重 oracle）
├── __mocks__/
│   └── react-native.js              # react-native 整模块 mock（TurboModuleRegistry）
├── jest.config.js                   # 内联 babel 配置，testMatch *-test.js
├── jest.setup.js                    # setupFiles 注册 react-native mock
├── jest.global-setup.js             # 每次运行将 src/ 预编译为 JS 复制到 .modpow-sut/
└── react-native-modpow.test.design.md
```

### 2.1 关键机制说明

| 机制 | 说明 |
|------|------|
| react-native 整模块 mock | `__mocks__/react-native.js` 提供 `TurboModuleRegistry.get('Modpow')` 返回共享 `modpowManager`（`modPow: jest.fn()`）；用例经 `__internals.modpowManager` 句柄配置行为。被测链路与真机一致：入口 → 真实 Spec → `TurboModuleRegistry.get` → mock 原生对象 |
| 被测源码副本（`.modpow-sut/`） | jest 仅对 rootDir（example/）内文件做覆盖率插桩。globalSetup 每次运行清空重建副本，测试经包名 `@react-native-ohos/react-native-modpow` 经 moduleNameMapper 引用，与真实消费方一致 |
| 预编译为纯 JS | babel-jest 的 istanbul 插桩在 TS 专属语法上丢计数器（codegen Spec 的 `export default XXX.get<Spec>('…')!` 实测 s-map 为空）。globalSetup 用 babel（preset-typescript + preset-env）预编译为 .js，并用 `importInterop: 'none'` 去掉 `_interopRequireDefault` 样板（其死路径无法覆盖，拖累分支阈值）——istanbul 只处理纯 JS |
| 算法仿真 | Jest 无法加载 ArkTS；算法用例将 `ModpowTurboModule.ets` 的 `isHexNumber` / `parseHex` / `squareAndMultiply` 同构移植为 `nativeModPowEmulator`，经 `mockImplementation` 注入原生 mock |

## 3. API 清单

### 3.1 TurboModule 方法

| 方法名 | 参数 | 返回值 | 类型 | 实现状态 |
|--------|------|--------|------|---------|
| modPow | values: { target: string; value: string; modifier: string } | string（十六进制） | 同步 | ✅ 已实现 |

### 3.2 事件列表 / 常量列表

无。

## 4. 白盒覆盖分析（src/index.ts）

| 分支 | 代码位置 | 条件 | 覆盖用例 |
|------|---------|------|---------|
| C1 | src/index.ts:16 | `args == null` | PARAM_0001 / PARAM_0002 |
| C2 | src/index.ts:17 | `typeof args.target !== 'string'` | PARAM_0003 |
| C3 | src/index.ts:18 | `typeof args.value !== 'string'` | PARAM_0004 |
| C4 | src/index.ts:19 | `typeof args.modifier !== 'string'` | PARAM_0005 / PARAM_0006 |
| C5 | src/index.ts:20 | `!HEX_RE.test(args.target)` | ERROR_0001 / ERROR_0005 |
| C6 | src/index.ts:21 | `!HEX_RE.test(args.value)` | ERROR_0002 / ERROR_0003 |
| C7 | src/index.ts:22 | `!HEX_RE.test(args.modifier)` | ERROR_0004 |
| C8 | src/index.ts:28 | `/^0+$/.test(args.modifier)` | BOUNDARY_0001 / BOUNDARY_0002 |
| C9 | src/index.ts:31 | 合法路径透传原生 | RETURN_0001 / RETURN_0002 / BOUNDARY_0003~0005 |

覆盖率结果：入口与 Spec 双文件语句 / 分支 / 函数 / 行均为 **100%**（coverageThreshold 全局锁定 100%）。

## 5. 测试用例设计

### 5.1 入口白盒测试（`__tests__/ModpowTest-test.js`）

#### 5.1.1 参数测试（ModpowEntryValidationTest）

| 用例编号 | 用例名称 | 输入 | 预期输出 | 级别 |
|---------|---------|------|---------|------|
| SUB_RNOH_MODPOW_MODPOW_PARAM_0001 | modPow throws when args is null | `null` | 抛十六进制格式错误，原生未调用 | LEVEL2 |
| SUB_RNOH_MODPOW_MODPOW_PARAM_0002 | modPow throws when args is undefined | `undefined` | 抛十六进制格式错误，原生未调用 | LEVEL2 |
| SUB_RNOH_MODPOW_MODPOW_PARAM_0003 | modPow throws when target is not a string | `{ target: 3, value: 'a', modifier: '11' }` | 抛十六进制格式错误 | LEVEL2 |
| SUB_RNOH_MODPOW_MODPOW_PARAM_0004 | modPow throws when value is not a string | `{ target: '3', value: null, modifier: '11' }` | 抛十六进制格式错误 | LEVEL2 |
| SUB_RNOH_MODPOW_MODPOW_PARAM_0005 | modPow throws when modifier is not a string | `{ target: '3', value: 'a', modifier: undefined }` | 抛十六进制格式错误 | LEVEL2 |
| SUB_RNOH_MODPOW_MODPOW_PARAM_0006 | modPow throws when modifier key is missing | `{ target: '3', value: 'a' }` | 抛十六进制格式错误 | LEVEL2 |

#### 5.1.2 错误契约测试（ModpowEntryValidationTest）

| 用例编号 | 用例名称 | 输入 | 预期输出 | 级别 |
|---------|---------|------|---------|------|
| SUB_RNOH_MODPOW_MODPOW_ERROR_0001 | modPow throws hex error when target is an empty string | `{ target: '', ... }` | 精确错误消息 `...must be non-empty hexadecimal strings` | LEVEL3 |
| SUB_RNOH_MODPOW_MODPOW_ERROR_0002 | modPow throws hex error when value contains 0x prefix | `{ target: '3', value: '0xa', ... }` | 抛十六进制格式错误 | LEVEL3 |
| SUB_RNOH_MODPOW_MODPOW_ERROR_0003 | modPow throws hex error when value contains non-hex characters | `{ target: '3', value: 'gg', ... }` | 抛十六进制格式错误 | LEVEL3 |
| SUB_RNOH_MODPOW_MODPOW_ERROR_0004 | modPow throws hex error when modifier contains a negative sign | `{ ..., modifier: '-10' }` | 抛十六进制格式错误 | LEVEL3 |
| SUB_RNOH_MODPOW_MODPOW_ERROR_0005 | modPow prioritizes hex error over non-zero error | `{ target: 'zz', value: '2', modifier: '0' }` | 十六进制格式错误优先（C5 先于 C8） | LEVEL3 |
| SUB_RNOH_MODPOW_MODPOW_ERROR_0006 | modPow propagates native exceptions unchanged | 合法入参 + 原生 mock 抛错 | 原生异常原样透传，不吞错 | LEVEL3 |

#### 5.1.3 边界值测试（ModpowEntryBoundaryTest）

| 用例编号 | 用例名称 | 输入 | 预期输出 | 级别 |
|---------|---------|------|---------|------|
| SUB_RNOH_MODPOW_MODPOW_BOUNDARY_0001 | modPow throws non-zero error when modifier is 0 | `{ ..., modifier: '0' }` | 精确错误消息 `modifier must be non-zero` | LEVEL2 |
| SUB_RNOH_MODPOW_MODPOW_BOUNDARY_0002 | modPow throws non-zero error when modifier is 0000 | `{ ..., modifier: '0000' }` | 非零模数错误 | LEVEL2 |
| SUB_RNOH_MODPOW_MODPOW_BOUNDARY_0003 | modPow accepts modifier with leading zeros when value is non-zero | `{ ..., modifier: '0011' }` | 不抛错，原生收到原样参数 | LEVEL2 |
| SUB_RNOH_MODPOW_MODPOW_BOUNDARY_0004 | modPow accepts zero target and zero value | `{ target: '0', value: '0', modifier: 'f' }` | 不抛错，原生被调用一次 | LEVEL2 |
| SUB_RNOH_MODPOW_MODPOW_BOUNDARY_0005 | modPow accepts uppercase hexadecimal digits | `{ target: 'FF', value: 'A', modifier: '1F' }` | 不抛错，参数原样透传（不做大小写归一） | LEVEL2 |

#### 5.1.4 返回值测试（ModpowEntryPassthroughTest）

| 用例编号 | 用例名称 | 输入 | 预期输出 | 级别 |
|---------|---------|------|---------|------|
| SUB_RNOH_MODPOW_MODPOW_RETURN_0001 | modPow returns native result verbatim and passes args unchanged | 合法入参 + mock 返回 `'deadbeef'` | 返回 `'deadbeef'`；原生调用 1 次、参数一致 | LEVEL1 |
| SUB_RNOH_MODPOW_MODPOW_RETURN_0002 | modPow returns successive native results on repeated calls | 连续两次调用 + mockReturnValueOnce | 逐次透传 `'8'`、`'1'`，调用 2 次 | LEVEL1 |
| SUB_RNOH_MODPOW_MODPOW_RETURN_0003 | modPow is exported as the default function | 模块默认导出 | `typeof === 'function'`（冒烟） | LEVEL0 |

### 5.2 算法白盒测试（`__tests__/ModpowAlgorithmTest-test.js`）

> 原生 mock 注入与 `ModpowTurboModule.ets` 同构的平方-乘仿真；预期值双重 oracle：
> 数学事实字面量 + JS 内建 BigInt 幂取模（独立实现交叉验证），避免同义反复。

#### 5.2.1 基础运算测试（ModpowAlgorithmBasicTest）

| 用例编号 | 用例名称 | 输入（target/value/modifier） | 预期输出 | 级别 |
|---------|---------|------|---------|------|
| SUB_RNOH_MODPOW_MODPOW_RETURN_0010 | modPow computes 3^10 mod 17 as 8 | `3` / `a` / `11` | `'8'`（+oracle） | LEVEL0 |
| SUB_RNOH_MODPOW_MODPOW_RETURN_0011 | modPow parses uppercase hex operands | `FF` / `E` / `1F` | `'9'`（+oracle） | LEVEL1 |
| SUB_RNOH_MODPOW_MODPOW_RETURN_0012 | modPow computes with 128-bit base and 16-bit modulus | `1234567890abcdef0011223344556677` / `ff` / `10001` | `'399b'`（+oracle） | LEVEL1 |

#### 5.2.2 边界值测试（ModpowAlgorithmBoundaryTest）

| 用例编号 | 用例名称 | 输入 | 预期输出 | 级别 |
|---------|---------|------|---------|------|
| SUB_RNOH_MODPOW_MODPOW_BOUNDARY_0006 | modPow returns 1 when exponent is 0 | `5` / `0` / `7` | `'1'`（`ONE % m` 初始化路径） | LEVEL2 |
| SUB_RNOH_MODPOW_MODPOW_BOUNDARY_0007 | modPow returns 0 when modulus is 1 | `2` / `a` / `1` | `'0'`（与 BigInteger.modPow 一致） | LEVEL2 |
| SUB_RNOH_MODPOW_MODPOW_BOUNDARY_0008 | modPow returns 0 when base is 0 | `0` / `5` / `3` | `'0'` | LEVEL2 |
| SUB_RNOH_MODPOW_MODPOW_BOUNDARY_0009 | modPow returns 0 when base equals modulus | `f×64` / `2` / `f×64` | `'0'`（基值先归约） | LEVEL2 |
| SUB_RNOH_MODPOW_MODPOW_BOUNDARY_0010 | modPow returns 1 or m-1 when base is m-1 | `f×63+e` / `2`、`3` / `f×64` | 偶指数 `'1'`，奇指数 `'f×63+e'` | LEVEL2 |

#### 5.2.3 大数测试（ModpowAlgorithmLargeTest）

| 用例编号 | 用例名称 | 输入 | 预期输出 | 级别 |
|---------|---------|------|---------|------|
| SUB_RNOH_MODPOW_MODPOW_RETURN_0013 | modPow returns 1 by Fermat little theorem (2^65536 mod 65537) | `2` / `10000` / `10001` | `'1'`（+oracle） | LEVEL1 |
| SUB_RNOH_MODPOW_MODPOW_RETURN_0014 | modPow completes an RSA encrypt-decrypt round trip | `7b`/`11`/`ca1`；`357`/`ac1`/`ca1` | `'357'`；`'7b'`（n=3233, e=17, d=2753） | LEVEL1 |
| SUB_RNOH_MODPOW_MODPOW_RETURN_0015 | modPow formats result as lowercase hex without leading zeros | `FF` / `1` / `fff` | `'ff'`（非 `FF`/`0ff`） | LEVEL2 |

## 6. 平台兼容性说明

### 6.1 HarmonyOS 可用 API

- `modPow(values: ModpowArgs): string`（同步，TurboModule `'Modpow'`）

### 6.2 HarmonyOS 不可用 API（不测试）

- 无。本库仅暴露单一同步方法，无平台分支差异。

### 6.3 需要特殊处理的 API

- `src/specs/v1/NativeModpow.ts` 为 codegen 边界：经真实加载链路（react-native mock 的 `TurboModuleRegistry`）参与覆盖；C++ codegen 层（`harmony/modpow/src/main/cpp/generated`）不在 JS 白盒测试范围内。

## 7. 权限需求

无（纯计算库，不涉及系统权限）。

## 8. 已知限制

1. Jest（Node 环境）无法直接加载 ArkTS：鸿蒙侧 `ModpowTurboModule.ets` 以同构移植的仿真参与测试；其真实行为需在 DevEco/XTS 设备侧用例回归。仿真与 ArkTS 实现的逐行等价性由 `RETURN_0010`~`RETURN_0015` 的双重 oracle 缓解，但非直接验证。
2. 入参透传断言依赖 react-native 整模块 mock；原生桥接的真实序列化行为（ArkTS 对象接收）需依赖设备侧测试。
3. `.modpow-sut/` 与 `coverage/` 为运行产物，已加入 `example/.gitignore`。
