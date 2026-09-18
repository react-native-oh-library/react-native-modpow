/**
 * 具名导出 barrel：宿主侧可从 '@react-native-ohos/react-native-modpow/ts'
 * 具名导入 ModpowPackage（与 index.ets 的默认导出指向同一个类）。
 * 与其他 RNOH 三方库 index.ets + ts.ets 双入口约定保持一致。
 */
export { ModpowPackage } from './src/main/ets/ModpowTurboModulesFactory';
