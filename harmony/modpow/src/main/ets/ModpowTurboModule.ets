/**
 * react-native-modpow HarmonyOS 实现
 *
 * 大数模幂运算 TurboModule（同步方法）：
 *   modPow({ target, value, modifier }): string
 *   - 三个入参均为十六进制字符串（无前缀、无符号），返回 target^value mod modifier
 *     的十六进制字符串（小写、无前导零，与 java.math.BigInteger.toString(16) 一致）。
 *   - 使用 ArkTS bigint（运行时原生实现）+ 平方-乘（square-and-multiply）算法，
 *     不依赖任何第三方大数库。
 *   - 防御式校验：空串 / 非十六进制字符 / 零模数 / 参数缺失均抛出受控 Error，
 *     与 iOS 端（RCTMakeError）的防御式行为对齐，不让异常以不可控方式逃逸。
 */

import { EtsUITurboModule } from '@rnoh/react-native-openharmony/ets';
import { TM } from './generated/ts';

const ZERO = BigInt(0);
const ONE = BigInt(1);
const TWO = BigInt(2);
const HEX_PATTERN = new RegExp('^[0-9a-fA-F]+$');

export class ModpowTurboModule extends EtsUITurboModule implements TM.Modpow.Spec {
  public static readonly NAME = TM.Modpow.NAME;

  modPow(values: TM.Modpow.ModpowArgs): string {
    if (values === null || values === undefined) {
      throw new Error('modPow: "values" must be an object with target, value and modifier');
    }
    const targetStr = values.target;
    const valueStr = values.value;
    const modifierStr = values.modifier;
    if (!this.isHexNumber(targetStr) || !this.isHexNumber(valueStr) || !this.isHexNumber(modifierStr)) {
      throw new Error('modPow: target, value and modifier must be non-empty hexadecimal strings');
    }
    const target = this.parseHex(targetStr);
    const value = this.parseHex(valueStr);
    const modifier = this.parseHex(modifierStr);
    if (modifier === ZERO) {
      throw new Error('modPow: modifier must be non-zero');
    }
    const result = this.squareAndMultiply(target, value, modifier);
    return result.toString(16);
  }

  private isHexNumber(candidate: string | undefined): boolean {
    if (typeof candidate !== 'string' || candidate.length === 0) {
      return false;
    }
    return HEX_PATTERN.test(candidate);
  }

  private parseHex(hex: string): bigint {
    // BigInt 解析十六进制需要 0x 前缀，而库契约的入参不带前缀，此处统一补上。
    return BigInt(`0x${hex}`);
  }

  /**
   * 平方-乘模幂：result = target^value mod modifier。
   * 输入保证非负（isHexNumber 已排除 '-'），结果落在 [0, modifier)。
   * modifier === 1 时结果为 0（与 java.math.BigInteger.modPow 一致）。
   */
  private squareAndMultiply(target: bigint, value: bigint, modifier: bigint): bigint {
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
}
