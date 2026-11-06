/*
 * Copyright (c) 2026 Huawei Device Co., Ltd. All rights reserved
 * Use of this source code is governed by a MIT license that can be
 * found in the LICENSE file.
 */

/**
 * react-native 原生模块 Mock（react-native-modpow XTS 用例专用）
 *
 * 与鸿蒙端 ModpowTurboModule.ets 的 TurboModule 注册方式对齐：
 * 仅注册 'Modpow' 模块，modPow 为同步 jest.fn，默认不配置返回值，
 * 由用例侧 mockReturnValue / mockImplementation 注入行为
 * （算法用例以同构仿真实现注入，见 ModpowAlgorithmTest-test.js）。
 *
 * 说明：react-native 是 node_modules 包，此 Mock 位于 example 根
 * __mocks__ 目录，会被 Jest 自动注册为手动 mock；jest.setup.js 中
 * 再显式 jest.mock + requireActual 加载，保证用例侧
 * require('react-native') 与被测库 src/specs/v1/NativeModpow.ts 内部
 * require('react-native') 拿到的是同一个 Mock 实例。
 */

'use strict';

/** Modpow TurboModule Mock：modPow 同步方法，行为由用例配置 */
const modpowManager = {
  modPow: jest.fn(),
};

module.exports = {
  Platform: {
    OS: 'harmony',
    select: obj => obj && obj.harmony,
  },
  NativeModules: {},
  TurboModuleRegistry: {
    get: jest.fn(name => (name === 'Modpow' ? modpowManager : undefined)),
    getEnforcing: jest.fn(name => {
      if (name !== 'Modpow') {
        throw new Error(`TurboModuleRegistry.getEnforcing('${name}') 未注册`);
      }
      return modpowManager;
    }),
  },
  NativeEventEmitter: jest.fn().mockImplementation(() => ({
    addListener: jest.fn(),
    removeListeners: jest.fn(),
  })),
  // 测试内部句柄：用于配置 Mock 行为
  __internals: {
    modpowManager,
  },
};
