import NativeModpow from './specs/v1/NativeModpow';

/**
 * 鸿蒙入口，与上游 index.js 对外形态一致：
 *   const { Modpow } = NativeModules; export default Modpow.modPow;
 * 默认导出 modPow 函数（同步返回十六进制字符串结果）。
 *
 * 错误契约（与 iOS 端 RCTMakeError 的防御式行为对齐）：
 * target / value / modifier 必须为非空十六进制字符串且 modifier 非零，
 * 非法入参在此处直接抛出受控 Error，不把非法输入送过同步桥接层。
 */
const HEX_RE = /^[0-9a-fA-F]+$/;

function modPow(args: { target: string; value: string; modifier: string }): string {
  if (
    args == null ||
    typeof args.target !== 'string' ||
    typeof args.value !== 'string' ||
    typeof args.modifier !== 'string' ||
    !HEX_RE.test(args.target) ||
    !HEX_RE.test(args.value) ||
    !HEX_RE.test(args.modifier)
  ) {
    throw new Error(
      'modPow: target, value and modifier must be non-empty hexadecimal strings',
    );
  }
  if (/^0+$/.test(args.modifier)) {
    throw new Error('modPow: modifier must be non-zero');
  }
  return NativeModpow!.modPow(args);
}

export default modPow;
