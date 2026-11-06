/*
 * Copyright (c) 2026 Huawei Device Co., Ltd. All rights reserved
 * Use of this source code is governed by a MIT license that can be
 * found in the LICENSE file.
 */

/**
 * @title react-native-modpow 鸿蒙化库算法白盒用例
 * @module modPow 平方-乘模幂算法
 * @brief 将鸿蒙侧 ModpowTurboModule.ets 的实现（isHexNumber /
 *        parseHex / squareAndMultiply）同构移植为原生 Mock 注入，
 *        验证全链路（入口 → Spec → TurboModuleRegistry → 原生）的
 *        数值正确性、边界行为与结果格式化
 * @tier Tier 3（依赖 react-native 整模块 mock + 同构算法仿真）
 *
 * 预期值采用双重 oracle，避免"仿真即断言"的同义反复：
 *   1. 数学事实（Fermat 小定理、(m-1)^2 ≡ 1 等恒等式）预推导字面量；
 *   2. JS 内建 BigInt 幂取模（按位展开的另一种实现），独立交叉验证。
 */

'use strict';

const modPow = require('@react-native-ohos/react-native-modpow').default;
const rnMock = require('react-native');
const modpowManager = rnMock.__internals.modpowManager;

// —— 与 ModpowTurboModule.ets 同构的算法仿真（平方-乘模幂） ——
const ZERO = BigInt(0);
const ONE = BigInt(1);
const TWO = BigInt(2);
const HEX_PATTERN = /^[0-9a-fA-F]+$/;

function isHexNumber(candidate) {
  if (typeof candidate !== 'string' || candidate.length === 0) {
    return false;
  }
  return HEX_PATTERN.test(candidate);
}

// BigInt 解析十六进制需要 0x 前缀，而库契约的入参不带前缀，统一补上
function parseHex(hex) {
  return BigInt(`0x${hex}`);
}

function squareAndMultiply(target, value, modifier) {
  let result = ONE % modifier;
  let base = target % modifier;
  let exponent = value;
  while (exponent > ZERO) {
    if (exponent % TWO === ONE) {
      result = (result * base) % modifier;
    }
    base = (base * base) % modifier;
    exponent = exponent / TWO;
  }
  return result;
}

/** 原生 modPow 仿真：校验与错误信息与 ArkTS 实现一致，结果经 toString(16) 格式化 */
function nativeModPowEmulator(values) {
  if (values === null || values === undefined) {
    throw new Error(
      'modPow: "values" must be an object with target, value and modifier',
    );
  }
  if (
    !isHexNumber(values.target) ||
    !isHexNumber(values.value) ||
    !isHexNumber(values.modifier)
  ) {
    throw new Error(
      'modPow: target, value and modifier must be non-empty hexadecimal strings',
    );
  }
  const modifier = parseHex(values.modifier);
  if (modifier === ZERO) {
    throw new Error('modPow: modifier must be non-zero');
  }
  return squareAndMultiply(
    parseHex(values.target),
    parseHex(values.value),
    modifier,
  ).toString(16);
}

/** 独立 oracle：JS 内建大数幂取模，与被测平方-乘实现互为交叉验证 */
const oracle = (target, value, modifier) =>
  (
    BigInt(`0x${target}`) ** BigInt(`0x${value}`) % BigInt(`0x${modifier}`)
  ).toString(16);

describe('ModpowAlgorithmBasicTest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    modpowManager.modPow.mockImplementation(nativeModPowEmulator);
  });

  it('SUB_RNOH_MODPOW_MODPOW_RETURN_0010 modPow computes 3^10 mod 17 as 8', () => {
    const result = modPow({target: '3', value: 'a', modifier: '11'});
    expect(result).toBe('8');
    expect(result).toBe(oracle('3', 'a', '11'));
  });

  it('SUB_RNOH_MODPOW_MODPOW_RETURN_0011 modPow parses uppercase hex operands', () => {
    // 255^14 mod 31 = 9
    const result = modPow({target: 'FF', value: 'E', modifier: '1F'});
    expect(result).toBe('9');
    expect(result).toBe(oracle('FF', 'E', '1F'));
  });

  it('SUB_RNOH_MODPOW_MODPOW_RETURN_0012 modPow computes with 128-bit base and 16-bit modulus', () => {
    const target = '1234567890abcdef0011223344556677';
    const result = modPow({target, value: 'ff', modifier: '10001'});
    expect(result).toBe('399b');
    expect(result).toBe(oracle(target, 'ff', '10001'));
  });
});

describe('ModpowAlgorithmBoundaryTest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    modpowManager.modPow.mockImplementation(nativeModPowEmulator);
  });

  it('SUB_RNOH_MODPOW_MODPOW_BOUNDARY_0006 modPow returns 1 when exponent is 0', () => {
    // 循环不执行，返回初始化值 ONE % modifier = 1
    const result = modPow({target: '5', value: '0', modifier: '7'});
    expect(result).toBe('1');
    expect(result).toBe(oracle('5', '0', '7'));
  });

  it('SUB_RNOH_MODPOW_MODPOW_BOUNDARY_0007 modPow returns 0 when modulus is 1', () => {
    // 2^10 mod 1 = 0，与 java.math.BigInteger.modPow 一致
    const result = modPow({target: '2', value: 'a', modifier: '1'});
    expect(result).toBe('0');
  });

  it('SUB_RNOH_MODPOW_MODPOW_BOUNDARY_0008 modPow returns 0 when base is 0', () => {
    const result = modPow({target: '0', value: '5', modifier: '3'});
    expect(result).toBe('0');
    expect(result).toBe(oracle('0', '5', '3'));
  });

  it('SUB_RNOH_MODPOW_MODPOW_BOUNDARY_0009 modPow returns 0 when base equals modulus', () => {
    // 底数先被归约到 0：m^2 mod m = 0
    const modulus = 'f'.repeat(64);
    const result = modPow({target: modulus, value: '2', modifier: modulus});
    expect(result).toBe('0');
  });

  it('SUB_RNOH_MODPOW_MODPOW_BOUNDARY_0010 modPow returns 1 or m-1 when base is m-1', () => {
    const modulus = 'f'.repeat(64); // m = 2^256 - 1
    const base = 'f'.repeat(63) + 'e'; // m - 1

    // 偶指数：(m-1)^2 ≡ 1 (mod m)
    expect(modPow({target: base, value: '2', modifier: modulus})).toBe('1');
    // 奇指数：(m-1)^3 ≡ m-1 (mod m)，结果应为 256 位全 f 尾 e 且小写
    expect(modPow({target: base, value: '3', modifier: modulus})).toBe(base);
  });
});

describe('ModpowAlgorithmLargeTest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    modpowManager.modPow.mockImplementation(nativeModPowEmulator);
  });

  it('SUB_RNOH_MODPOW_MODPOW_RETURN_0013 modPow returns 1 by Fermat little theorem (2^65536 mod 65537)', () => {
    // 65537 为素数，2^65536 ≡ 1 (mod 65537)
    const result = modPow({target: '2', value: '10000', modifier: '10001'});
    expect(result).toBe('1');
    expect(result).toBe(oracle('2', '10000', '10001'));
  });

  it('SUB_RNOH_MODPOW_MODPOW_RETURN_0014 modPow completes an RSA encrypt-decrypt round trip', () => {
    // 经典 RSA 示例：p=61, q=53, n=3233(0xca1), e=17(0x11), d=2753(0xac1)
    // 加密：123(0x7b)^17 mod 3233 = 855(0x357)；解密：855^2753 mod 3233 = 123
    expect(modPow({target: '7b', value: '11', modifier: 'ca1'})).toBe('357');
    expect(modPow({target: '357', value: 'ac1', modifier: 'ca1'})).toBe('7b');
    expect(oracle('7b', '11', 'ca1')).toBe('357');
    expect(oracle('357', 'ac1', 'ca1')).toBe('7b');
  });

  it('SUB_RNOH_MODPOW_MODPOW_RETURN_0015 modPow formats result as lowercase hex without leading zeros', () => {
    // 255^1 mod 4095 = 255：大写入参，输出必须为小写 'ff' 而非 'FF'/'0ff'
    const result = modPow({target: 'FF', value: '1', modifier: 'fff'});
    expect(result).toBe('ff');
    expect(result).toBe(oracle('FF', '1', 'fff'));
  });
});
