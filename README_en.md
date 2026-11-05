> Document Template: v0.4.2

<p align="center">
  <h1 align="center"> <code>react-native-modpow</code> </h1>
</p>

This project is based on [react-native-modpow](https://github.com/seald/react-native-modpow) and is its adaptation for React Native on OpenHarmony. The new package name is: `@react-native-ohos/react-native-modpow`, the version correspondence details are as follows:

| Name | Version(Npm Address) | Release Information | Supported RN Version | Supported Autolink | Compile API Version | Community Baseline Version | Source code address |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @react-native-ohos/react-native-modpow | [~ 1.1.0](https://www.npmjs.com/package/@react-native-ohos/react-native-modpow) | [GitHub Releases](https://github.com/react-native-oh-library/react-native-modpow/releases) | 0.84.* / 0.82.* / 0.77.* / 0.72.* | Yes | API12+ | 1.1.0 | [master](https://github.com/react-native-oh-library/react-native-modpow) |

## Introduction

Exports the native `BigInteger.modPow()` capability to accelerate big-integer modular exponentiation for JS cryptography libraries such as node-forge, preventing RSA key generation from blocking the UI for over a minute.<br/>
On the OpenHarmony side it implements the square-and-multiply algorithm on top of ArkTS `bigint` and exports it as a synchronous TurboModule method, with semantics identical to the Android / iOS original library.

## Installation

Go to the project directory and execute the following instruction:

**npm**

```bash
npm install @react-native-ohos/react-native-modpow
```

**yarn**

```bash
yarn add @react-native-ohos/react-native-modpow
```

## Link

|                                      | Supported Autolink | Supported RN Version |
|--------------------------------------|--------------------|----------------------|
| ~ 1.1.0                              | Yes                | 0.84 / 0.82 / 0.77 / 0.72 |

Projects using Autolink need to be configured according to the [Autolink framework guide](https://atomgit.com/CPF-RN/ohos_react_native/blob/main/docs/en/02-development/02-development-guide/autolinking.md).

### Running

Click the `sync` button in the upper right corner.

Alternatively, run the following instruction on the terminal:

```bash
cd entry
ohpm install
```

Then build and run the code.

<details>
  <summary>ManualLink: Guidance for manually configuring native dependencies (when Autolink is unavailable)</summary>

  > **Note**: This module requires registering the Package on both the C++ side and the ArkTS side.

  #### 1. Overrides RN SDK

  Add the following to the root `oh-package.json5` of your project:

  ```json
  {
    "overrides": {
      "@rnoh/react-native-openharmony": "./react_native_openharmony"
    }
  }
  ```

  #### 2. Introduce the native dependency

  Open `entry/oh-package.json5` and add:

  ```json
  "dependencies": {
    "@react-native-ohos/react-native-modpow": "file:../../node_modules/@react-native-ohos/react-native-modpow/harmony/modpow.har"
  }
  ```

  Run `ohpm install`.

  #### 3. Configure CMakeLists

  Open `entry/src/main/cpp/CMakeLists.txt` and add:

  ```cmake
  set(OH_MODULES "${CMAKE_CURRENT_SOURCE_DIR}/../../../oh_modules")

  add_subdirectory("${OH_MODULES}/@react-native-ohos/react-native-modpow/src/main/cpp" ./modpow)

  target_link_libraries(rnoh_app PUBLIC modpow)
  ```

  #### 4. Register the Package (C++ side)

  Open `entry/src/main/cpp/PackageProvider.cpp` and add:

  ```cpp
  #include "ModpowPackage.h"

  std::vector<std::shared_ptr<Package>> PackageProvider::getPackages(Package::Context ctx) {
      return {
          std::make_shared<ModpowPackage>(ctx),
      };
  }
  ```

  #### 5. Register the Package (ArkTS side)

  Open `entry/src/main/ets/RNPackagesFactory.ets` and add:

  ```typescript
  import { ModpowPackage } from '@react-native-ohos/react-native-modpow/ts';

  export function createRNPackages(ctx: RNPackageContext): RNPackage[] {
    return [
      new ModpowPackage(ctx),
    ];
  }
  ```

</details>

## Constraints

### Compatibility

This document is verified based on the following versions:

1. RNOH: 0.72.139; SDK: HarmonyOS API 12+; DevEco Studio: 5.0+.

The example has been adapted to four framework versions (0.72 / 0.77 / 0.82 / 0.84) and can be switched with a single `npm run framework` command (see [Quick Verification](#quick-verification-running-the-example)).

### Permission Requirements

No `ohos.permission` declarations are required, and no runtime permission requests are needed.

### API requirements

> [!TIP] The current library supports compilation in `API12+` projects.

> [!TIP] This library performs pure ArkTS `bigint` computation with no cloud services and no system-capability version dependencies; all APIs behave consistently across supported RNOH versions.

## Example

The following code shows the basic use scenario of the library:

> [!WARNING] The imported package name stays unchanged: `import modPow from 'react-native-modpow'` (mapped to `@react-native-ohos/react-native-modpow` via an RNOH alias).

```javascript
import modPow from 'react-native-modpow'

const result = modPow({
  target: '2',   // base (hex string)
  value: '2',    // exponent (hex string)
  modifier: '3'  // modulus (hex string)
})
// result = '1' (2^2 mod 3 = 1)
```

Accelerating node-forge RSA key generation (the main use case of this library):

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

## How to Use

- `modPow` is a synchronous blocking call, consistent with the original library on both platforms (Android `isBlockingSynchronousMethod = true` / iOS `RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD`), and does not return a Promise; large parameters at the RSA-2048 scale will block the calling thread, so callers must evaluate the blocking duration themselves (the example includes a built-in large-parameter test case for verification).
- `target` / `value` / `modifier` must be non-empty hexadecimal strings (`[0-9a-fA-F]+`) and `modifier` must be non-zero; invalid input (non-hex characters / empty strings / zero modulus) throws a controlled `Error`, aligned with the defensive behavior of the iOS side `RCTMakeError` (the Android original library throws a native exception).
- The return value is a lowercase hexadecimal string without leading zeros or the `0x` prefix, consistent with the format of `java.math.BigInteger.toString(16)`.

## Available APIs

> [!TIP] The **Platform** column indicates the platform where the property is supported in the original third-party library.

> [!TIP] If the value of **OpenHarmony Platform Support** is **Yes**, it means the OpenHarmony platform supports this property; **No** means the opposite; **Partially** means some capabilities are supported. The usage method is the same across platforms and the effect matches that of iOS or Android.

### API

| Name | Type | Parameter Type | Return Value | Required | Platform | OpenHarmony Platform Support | Description |
| --- | --- | --- | --- | --- | --- | --- | --- |
| modPow | function | args: `{ target: string, value: string, modifier: string }` | string | Yes | All | Yes | Big-integer modular exponentiation `target^value mod modifier`, synchronous and blocking. All three parameters are hexadecimal strings; returns a lowercase hexadecimal string (no leading zeros, no `0x` prefix). |

### Unimplemented Features

None. The original library's only public capability, `modPow`, has been fully implemented on OpenHarmony, with no platform capability gaps.

## Quick Verification (Running the Example)

### Prerequisites

| Dependency | Version Requirement |
|------------|---------------------|
| Node.js | >= 18 |
| DevEco Studio | 5.0+ / 6.0+ |
| HarmonyOS SDK | API 12+ |

### Steps

**1. Clone the repository**

```bash
git clone <repository url>
cd <repository directory>
```

**2. Install dependencies and build**

```bash
npm install --legacy-peer-deps
npm pack           # generate the tgz package (automatically triggers the prepare script to build the JS artifacts)
```

**3. Enter the example directory and install dependencies**

```bash
cd example
npm install --legacy-peer-deps
```

**4. Generate the JS bundle**

```bash
npm run dev
```

Artifact: `harmony/entry/src/main/resources/rawfile/bundle.harmony.js`

**5. Open the OpenHarmony project in DevEco Studio**

- Open DevEco Studio
- Select the `example/harmony` directory
- Wait for the sync to complete

**6. Build and run the HAP**

Click the run button in DevEco Studio to install the HAP on a device/emulator.

> **Note**: The example already includes the plugin dependency and the Package registration; no manual Link configuration is needed.

### Switching the RN Framework Version

The example supports switching the RNOH framework version between `0.72` / `0.77` / `0.82` / `0.84` with a single command:

```bash
cd example
npm run framework -- 0.77              # switch the version (rewrites package.json / babel / oh-package)
npm install --legacy-peer-deps         # reinstall dependencies
npm run framework -- 0.77 --sync-har   # correct the HAR reference based on the actual HAR file in node_modules
```

Or complete "switch + npm install + ohpm install" in one command:

```bash
npm run run:harmony -- 0.77
```

When switching, the script automatically:

- Rewrites the `react` / `react-native` / `@react-native-oh/react-native-harmony` versions and all devDependencies/overrides
- Updates the babel preset (0.72 uses `metro-react-native-babel-preset`, 0.77+ uses `@react-native/babel-preset`)
- Syncs the `@rnoh/react-native-openharmony` HAR references in `harmony/oh-package.json5` and `harmony/entry/oh-package.json5` (0.72 uses `react_native_openharmony_release.har`, 0.77+ uses `react_native_openharmony.har`)
- Cleans the stale `node_modules` / `oh_modules` / lock files when the version changes

The framework version currently in use is recorded in `example/.framework-version` (not committed to git).

## Known Issues

None

## Other

None

## Directory Structure

```
/react-native-modpow                       # Project root directory
├── harmony/                               # OpenHarmony adaptation code
│   ├── modpow.har                         # HAR package
│   └── modpow/                            # OpenHarmony module source
│       ├── index.ets                      # Module entry
│       ├── ts.ets                         # TS declaration entry
│       ├── oh-package.json5
│       └── src/main/
│           ├── ets/                       # ArkTS implementation
│           │   ├── ModpowTurboModule.ets
│           │   ├── ModpowTurboModulesFactory.ets
│           │   └── generated/             # Codegen output
│           └── cpp/                       # C++ bridge
│               ├── CMakeLists.txt
│               ├── ModpowPackage.h
│               └── generated/             # Codegen output
├── src/                                   # RN JS / Spec
│   ├── index.ts                           # JS entry
│   └── specs/v1/NativeModpow.ts           # TurboModule Spec
├── example/                               # example for gate check
│   └── scripts/use-framework.js           # RNOH framework version switching script
├── package.json
├── README.md                              # Chinese document
├── README_en.md                           # English document
└── LICENSE
```

## How to Contribute

If you find any problem when using react-native-modpow, submit an [issue](https://github.com/react-native-oh-library/react-native-modpow/issues) or a [PR](https://github.com/react-native-oh-library/react-native-modpow/pulls).

## License

This project is based on [The MIT License (MIT)](./LICENSE); feel free to enjoy and contribute to open source. Thanks to the original library [react-native-modpow](https://github.com/seald/react-native-modpow).
