/**
 * react-native-modpow HarmonyOS RNPackage 注册入口。
 *
 * index.ets 将本文件的 ModpowPackage 作为 HAR 默认导出，
 * 供 example 侧 autolinking（RNOHPackagesFactory）/手动注册使用。
 * 模块名 TM.Modpow.NAME === 'Modpow'，与 JS 侧 TurboModuleRegistry.get('Modpow') 一致。
 */

import {
  RNOHPackage,
  UITurboModule,
  UITurboModuleContext,
} from '@rnoh/react-native-openharmony';
import { ModpowTurboModule } from './ModpowTurboModule';

export class ModpowPackage extends RNOHPackage {
  override getUITurboModuleFactoryByNameMap(): Map<string, (ctx: UITurboModuleContext) => UITurboModule | null> {
    return new Map<string, ((ctx: UITurboModuleContext) => UITurboModule)>()
      .set(ModpowTurboModule.NAME, (ctx: UITurboModuleContext) => new ModpowTurboModule(ctx));
  }
}
