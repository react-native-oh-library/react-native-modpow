/*
 * Copyright (c) 2026 Huawei Device Co., Ltd. All rights reserved
 * Use of this source code is governed by a MIT license that can be
 * found in the LICENSE file.
 */

/**
 * Jest 全局 setup
 *
 * 将 react-native 替换为 Mock：通过 jest.mock 工厂注册，保证用例侧
 * require('react-native') 与被测库 src/specs/v1/NativeModpow.ts 内部
 * require('react-native') 拿到的是同一个 Mock 实例。setupFiles 在每个
 * 测试文件的模块图加载前执行，对全局 require 生效。
 *
 * 注意：工厂内必须用 jest.requireActual 加载 mock 文件。
 * __mocks__/react-native.js 与 node_modules 相邻，会被 Jest 自动注册为
 * react-native 的手动 mock；若用普通 require 加载该路径，runtime 会将其
 * 重定向回 react-native 的 mock，导致工厂递归调用自身（栈溢出）。
 */

'use strict';

jest.mock('react-native', () =>
  jest.requireActual('./__mocks__/react-native'),
);
