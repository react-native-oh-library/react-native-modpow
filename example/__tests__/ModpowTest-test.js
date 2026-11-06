/*
 * Copyright (c) 2026 Huawei Device Co., Ltd. All rights reserved
 * Use of this source code is governed by a MIT license that can be
 * found in the LICENSE file.
 */

/**
 * @title react-native-modpow 鸿蒙化库入口白盒用例
 * @module modPow 入参校验与原生透传
 * @brief 验证 JS 入口（src/index.ts）的防御式校验全分支与透传行为：
 *        null / 类型错误 / 空串 / 非法十六进制 / 零模数均抛受控 Error
 *        且不触达原生层；合法入参原样透传 NativeModpow.modPow 并返回
 *        其结果，原生异常原样透传不吞错
 * @tier Tier 3（依赖 react-native 整模块 mock）
 *
 * 白盒分支对照（src/index.ts:14-32）：
 *   C1 args == null                       → 十六进制格式错误
 *   C2/C3/C4 target/value/modifier 非字符串 → 十六进制格式错误
 *   C5/C6/C7 HEX_RE 不匹配                 → 十六进制格式错误
 *   C8 modifier 全零（/^0+$/）             → 非零模数错误
 *   C9 合法入参                            → 透传原生并返回结果
 */

'use strict';

const modPow = require('@react-native-ohos/react-native-modpow').default;
const rnMock = require('react-native');
const modpowManager = rnMock.__internals.modpowManager;

const HEX_ERROR =
  'modPow: target, value and modifier must be non-empty hexadecimal strings';
const NONZERO_ERROR = 'modPow: modifier must be non-zero';

describe('ModpowEntryValidationTest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('SUB_RNOH_MODPOW_MODPOW_PARAM_0001 modPow throws when args is null', () => {
    expect(() => modPow(null)).toThrow(HEX_ERROR);
    expect(modpowManager.modPow).not.toHaveBeenCalled();
  });

  it('SUB_RNOH_MODPOW_MODPOW_PARAM_0002 modPow throws when args is undefined', () => {
    expect(() => modPow(undefined)).toThrow(HEX_ERROR);
    expect(modpowManager.modPow).not.toHaveBeenCalled();
  });

  it('SUB_RNOH_MODPOW_MODPOW_PARAM_0003 modPow throws when target is not a string', () => {
    expect(() => modPow({target: 3, value: 'a', modifier: '11'})).toThrow(
      HEX_ERROR,
    );
    expect(modpowManager.modPow).not.toHaveBeenCalled();
  });

  it('SUB_RNOH_MODPOW_MODPOW_PARAM_0004 modPow throws when value is not a string', () => {
    expect(() => modPow({target: '3', value: null, modifier: '11'})).toThrow(
      HEX_ERROR,
    );
    expect(modpowManager.modPow).not.toHaveBeenCalled();
  });

  it('SUB_RNOH_MODPOW_MODPOW_PARAM_0005 modPow throws when modifier is not a string', () => {
    expect(() =>
      modPow({target: '3', value: 'a', modifier: undefined}),
    ).toThrow(HEX_ERROR);
    expect(modpowManager.modPow).not.toHaveBeenCalled();
  });

  it('SUB_RNOH_MODPOW_MODPOW_PARAM_0006 modPow throws when modifier key is missing', () => {
    expect(() => modPow({target: '3', value: 'a'})).toThrow(HEX_ERROR);
    expect(modpowManager.modPow).not.toHaveBeenCalled();
  });

  it('SUB_RNOH_MODPOW_MODPOW_ERROR_0001 modPow throws hex error when target is an empty string', () => {
    expect(() => modPow({target: '', value: 'a', modifier: '11'})).toThrow(
      HEX_ERROR,
    );
    expect(modpowManager.modPow).not.toHaveBeenCalled();
  });

  it('SUB_RNOH_MODPOW_MODPOW_ERROR_0002 modPow throws hex error when value contains 0x prefix', () => {
    expect(() => modPow({target: '3', value: '0xa', modifier: '11'})).toThrow(
      HEX_ERROR,
    );
    expect(modpowManager.modPow).not.toHaveBeenCalled();
  });

  it('SUB_RNOH_MODPOW_MODPOW_ERROR_0003 modPow throws hex error when value contains non-hex characters', () => {
    expect(() => modPow({target: '3', value: 'gg', modifier: '11'})).toThrow(
      HEX_ERROR,
    );
    expect(modpowManager.modPow).not.toHaveBeenCalled();
  });

  it('SUB_RNOH_MODPOW_MODPOW_ERROR_0004 modPow throws hex error when modifier contains a negative sign', () => {
    expect(() => modPow({target: '3', value: 'a', modifier: '-10'})).toThrow(
      HEX_ERROR,
    );
    expect(modpowManager.modPow).not.toHaveBeenCalled();
  });

  it('SUB_RNOH_MODPOW_MODPOW_ERROR_0005 modPow prioritizes hex error over non-zero error', () => {
    // 白盒断言：src/index.ts 先执行 C5（HEX_RE 校验）再执行 C8（非零校验），
    // target 非法 + modifier 为零时必须命中十六进制格式错误
    expect(() => modPow({target: 'zz', value: '2', modifier: '0'})).toThrow(
      HEX_ERROR,
    );
    expect(modpowManager.modPow).not.toHaveBeenCalled();
  });

  it('SUB_RNOH_MODPOW_MODPOW_ERROR_0006 modPow propagates native exceptions unchanged', () => {
    modpowManager.modPow.mockImplementation(() => {
      throw new Error('native bridge failure');
    });
    expect(() => modPow({target: '3', value: 'a', modifier: '11'})).toThrow(
      'native bridge failure',
    );
    expect(modpowManager.modPow).toHaveBeenCalledTimes(1);
  });
});

describe('ModpowEntryBoundaryTest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    modpowManager.modPow.mockReturnValue('8');
  });

  it('SUB_RNOH_MODPOW_MODPOW_BOUNDARY_0001 modPow throws non-zero error when modifier is 0', () => {
    expect(() => modPow({target: '3', value: 'a', modifier: '0'})).toThrow(
      NONZERO_ERROR,
    );
    expect(modpowManager.modPow).not.toHaveBeenCalled();
  });

  it('SUB_RNOH_MODPOW_MODPOW_BOUNDARY_0002 modPow throws non-zero error when modifier is 0000', () => {
    expect(() => modPow({target: '3', value: 'a', modifier: '0000'})).toThrow(
      NONZERO_ERROR,
    );
    expect(modpowManager.modPow).not.toHaveBeenCalled();
  });

  it('SUB_RNOH_MODPOW_MODPOW_BOUNDARY_0003 modPow accepts modifier with leading zeros when value is non-zero', () => {
    const args = {target: '3', value: 'a', modifier: '0011'};
    expect(() => modPow(args)).not.toThrow();
    expect(modpowManager.modPow).toHaveBeenCalledTimes(1);
    expect(modpowManager.modPow).toHaveBeenCalledWith(args);
  });

  it('SUB_RNOH_MODPOW_MODPOW_BOUNDARY_0004 modPow accepts zero target and zero value', () => {
    const args = {target: '0', value: '0', modifier: 'f'};
    expect(() => modPow(args)).not.toThrow();
    expect(modpowManager.modPow).toHaveBeenCalledTimes(1);
    expect(modpowManager.modPow).toHaveBeenCalledWith(args);
  });

  it('SUB_RNOH_MODPOW_MODPOW_BOUNDARY_0005 modPow accepts uppercase hexadecimal digits', () => {
    const args = {target: 'FF', value: 'A', modifier: '1F'};
    expect(() => modPow(args)).not.toThrow();
    expect(modpowManager.modPow).toHaveBeenCalledTimes(1);
    // 入参原样透传，不做大小写归一
    expect(modpowManager.modPow).toHaveBeenCalledWith(args);
  });
});

describe('ModpowEntryPassthroughTest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('SUB_RNOH_MODPOW_MODPOW_RETURN_0001 modPow returns native result verbatim and passes args unchanged', () => {
    modpowManager.modPow.mockReturnValue('deadbeef');
    const args = {target: '3', value: 'a', modifier: '11'};

    const result = modPow(args);

    expect(result).toBe('deadbeef');
    expect(modpowManager.modPow).toHaveBeenCalledTimes(1);
    expect(modpowManager.modPow).toHaveBeenCalledWith(args);
    expect(modpowManager.modPow).toHaveBeenCalledWith({
      target: '3',
      value: 'a',
      modifier: '11',
    });
  });

  it('SUB_RNOH_MODPOW_MODPOW_RETURN_0002 modPow returns successive native results on repeated calls', () => {
    modpowManager.modPow
      .mockReturnValueOnce('8')
      .mockReturnValueOnce('1');

    expect(modPow({target: '3', value: 'a', modifier: '11'})).toBe('8');
    expect(
      modPow({target: '2', value: '10000', modifier: '10001'}),
    ).toBe('1');
    expect(modpowManager.modPow).toHaveBeenCalledTimes(2);
  });

  it('SUB_RNOH_MODPOW_MODPOW_RETURN_0003 modPow is exported as the default function', () => {
    expect(typeof modPow).toBe('function');
  });
});
