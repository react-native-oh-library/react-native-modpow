# 更新日志

本文件记录 `@react-native-ohos/react-native-modpow`（react-native-modpow 鸿蒙化适配版本）的显著变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循[语义化版本](https://semver.org/lang/zh-CN/)。上游原库 [seald/react-native-modpow](https://github.com/seald/react-native-modpow) 的历史变更请参阅其仓库。

## [Unreleased]

## [1.1.0] - 2026-11-05

基于上游 [seald/react-native-modpow](https://github.com/seald/react-native-modpow) v1.1.0 完成鸿蒙（OpenHarmony）平台适配，社区基线版本 1.1.0。

### 新增

- **TurboModule 架构**：新增 Codegen Spec（`src/specs/v1/NativeModpow.ts`）并生成 C++ / ArkTS 桥接代码，`modPow` 以同步 TurboModule（`EtsUITurboModule`）方式导出，对齐 RN 新架构，支持 Autolink。
- **ArkTS `bigint` 原生实现**：大数模幂运算基于 ArkTS 运行时原生 `bigint` 与平方-乘（square-and-multiply）算法实现，不依赖任何第三方大数库；返回格式与 `java.math.BigInteger.toString(16)` 一致。
- **防御式校验**：空串 / 非十六进制字符 / 零模数 / 参数缺失等非法输入统一以受控 `Error` 抛出，对齐 iOS 端 `RCTMakeError` 的防御行为，避免异常以不可控方式逃逸。
- **Example 框架版本切换**：示例工程支持在 RNOH `0.72` / `0.77` / `0.82` / `0.84` 间一键切换（`npm run framework`），自动同步依赖版本、babel preset 与 `@rnoh/react-native-openharmony` 的 HAR 指向。
- **Example 签名配置模板化**：签名配置改由模板生成，避免个人签名材料入库。
- **中英双语文档**：新增英文文档 `README_en.md`。

### 兼容性

- RNOH：0.72 / 0.77 / 0.82 / 0.84（已验证 0.72.139）
- HarmonyOS SDK：API 12+
