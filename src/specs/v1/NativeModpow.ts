import type { TurboModule } from 'react-native/Libraries/TurboModule/RCTExport';
import { TurboModuleRegistry } from 'react-native';

/**
 * modPow 参数：三个十六进制字符串（无前缀、无符号）。
 * target   —— 底数
 * value    —— 指数（非负）
 * modifier —— 模数（非零）
 */
export interface ModpowArgs {
  target: string;
  value: string;
  modifier: string;
}

export interface Spec extends TurboModule {
  /**
   * 同步计算 target^value mod modifier，返回结果的十六进制字符串
   * （小写、无前导零，与 java.math.BigInteger.toString(16) 格式一致）。
   */
  modPow(values: ModpowArgs): string;
}

export default TurboModuleRegistry.get<Spec>('Modpow')!;
