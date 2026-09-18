/**
 * react-native-modpow HarmonyOS Example
 *
 * 覆盖核心 API：modPow({ target, value, modifier }) —— 同步大数模幂运算。
 * 分区展示：
 *   1. 小参数快速验证（README 示例：2^2 mod 3 = 1）
 *   2. 边界用例（模数 1 / 指数 0 / 底数大于模数）
 *   3. RSA 2048 位级大参数性能实测
 *   4. 非法输入错误处理（非十六进制 / 零模数 / 空串）
 *   5. 自定义输入
 * 所有结果均来自库的真实同步调用（返回值 / 抛出的错误 / 耗时）。
 */

import React, { useState } from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
} from 'react-native';
import modPow from '@react-native-ohos/react-native-modpow';

// RSA-2048 量级确定性测试向量（重复模式构造，512+ 个十六进制字符）
const RSA_MODULUS = 'e8a14f27c3b9'.repeat(43); // 516 个十六进制字符（约 2064 bit 模数）
const RSA_BASE = '5f3b8d2e71a6'.repeat(43);
const RSA_PRIVATE_EXP = '9d6742c05e13'.repeat(43);
const RSA_PUBLIC_EXP = '10001'; // 65537

interface LogEntry {
  key: number;
  label: string;
  ok: boolean;
  output: string;
  ms: number | null;
}

let logKey = 0;

export default function App(): React.JSX.Element {
  const [log, setLog] = useState<LogEntry[]>([]);
  const [target, setTarget] = useState('deadbeef');
  const [value, setValue] = useState('20');
  const [modifier, setModifier] = useState('cafe');

  const runCase = (label: string, args: { target: string; value: string; modifier: string }) => {
    const t0 = Date.now();
    try {
      const result: string = modPow(args);
      const ms = Date.now() - t0;
      setLog(prev => [
        {
          key: logKey++,
          label,
          ok: true,
          output: `${args.target}^${args.value} mod ${args.modifier}\n= ${result}\n(${result.length} 个十六进制位)`,
          ms,
        },
        ...prev,
      ]);
    } catch (e) {
      const ms = Date.now() - t0;
      // 防御：Hermes/RNOH 同步桥接可能把异常以非 Error 形态（甚至 undefined）传回，
      // 直接读 (e as Error).message 会在此处二次抛 TypeError，且发生在 onPress 触发的
      // 同步 re-render 链路中，会被当作渲染期致命错误 → surface 停止渲染（整页白屏）。
      const err = e as { message?: unknown } | null | undefined;
      const msg =
        e instanceof Error
          ? e.message
          : err != null && typeof err.message === 'string'
            ? err.message
            : `非 Error 异常 (typeof ${typeof e}): ${String(e)}`;
      console.log('runCase error:', typeof e, String(e), JSON.stringify(err ?? null));
      setLog(prev => [
        {
          key: logKey++,
          label,
          ok: false,
          output: `输入 target=${args.target} value=${args.value} modifier=${args.modifier}\n抛出错误: ${msg}`,
          ms,
        },
        ...prev,
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>react-native-modpow</Text>
        <Text style={styles.subtitle}>
          大数模幂同步计算 Example · Platform.OS = {Platform.OS}
        </Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. 小参数快速验证</Text>
          <Text style={styles.sectionDesc}>
            README 示例：2^2 mod 3 = 1（README 注释的 result = 0 为笔误，4 mod 3 实际为 1）
          </Text>
          <View style={styles.buttonRow}>
            <Pressable
              style={styles.button}
              onPress={() => runCase('README 用例 2^2 mod 3（期望 1）', { target: '2', value: '2', modifier: '3' })}>
              <Text style={styles.buttonText}>2^2 mod 3</Text>
            </Pressable>
            <Pressable
              style={styles.button}
              onPress={() => runCase('较大底数 ff^11 mod 23', { target: 'ff', value: '11', modifier: '23' })}>
              <Text style={styles.buttonText}>ff^11 mod 23</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. 边界用例</Text>
          <View style={styles.buttonRow}>
            <Pressable
              style={styles.button}
              onPress={() => runCase('模数 1（期望 0，与 Java modPow 一致）', { target: 'abcdef', value: '10', modifier: '1' })}>
              <Text style={styles.buttonText}>x^y mod 1</Text>
            </Pressable>
            <Pressable
              style={styles.button}
              onPress={() => runCase('指数 0（期望 1）', { target: 'abcdef', value: '0', modifier: '23' })}>
              <Text style={styles.buttonText}>x^0 mod m</Text>
            </Pressable>
            <Pressable
              style={styles.button}
              onPress={() => runCase('底数大于模数 ff^3 mod a', { target: 'ff', value: '3', modifier: 'a' })}>
              <Text style={styles.buttonText}>ff^3 mod a</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. RSA 2048 位级性能实测</Text>
          <Text style={styles.sectionDesc}>
            模数 {RSA_MODULUS.length} 个十六进制字符（约 {RSA_MODULUS.length * 4} bit）。同步调用会阻塞直至计算完成，耗时在日志中如实显示。
          </Text>
          <View style={styles.buttonRow}>
            <Pressable
              style={styles.button}
              onPress={() =>
                runCase('私钥级运算（2064bit 指数）', { target: RSA_BASE, value: RSA_PRIVATE_EXP, modifier: RSA_MODULUS })
              }>
              <Text style={styles.buttonText}>私钥级 modPow</Text>
            </Pressable>
            <Pressable
              style={styles.button}
              onPress={() =>
                runCase('公钥级运算（指数 10001）', { target: RSA_BASE, value: RSA_PUBLIC_EXP, modifier: RSA_MODULUS })
              }>
              <Text style={styles.buttonText}>公钥级 modPow</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. 非法输入错误处理</Text>
          <Text style={styles.sectionDesc}>
            非十六进制字符 / 零模数 / 空串会以受控 Error 抛出（与 iOS 端 RCTMakeError 防御式行为对齐）
          </Text>
          <View style={styles.buttonRow}>
            <Pressable
              style={[styles.button, styles.dangerButton]}
              onPress={() => runCase('非十六进制 target', { target: 'xyz!', value: '2', modifier: '3' })}>
              <Text style={styles.buttonText}>target = "xyz!"</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.dangerButton]}
              onPress={() => runCase('零模数 modifier = 0', { target: '2', value: '2', modifier: '0' })}>
              <Text style={styles.buttonText}>modifier = "0"</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.dangerButton]}
              onPress={() => runCase('空串 value', { target: '2', value: '', modifier: '3' })}>
              <Text style={styles.buttonText}>value = ""</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. 自定义输入</Text>
          <TextInput
            style={styles.input}
            value={target}
            onChangeText={setTarget}
            placeholder="target（十六进制）"
            placeholderTextColor="#999"
          />
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={setValue}
            placeholder="value（十六进制）"
            placeholderTextColor="#999"
          />
          <TextInput
            style={styles.input}
            value={modifier}
            onChangeText={setModifier}
            placeholder="modifier（十六进制）"
            placeholderTextColor="#999"
          />
          <Pressable
            style={styles.primaryButton}
            onPress={() => runCase('自定义输入', { target: target.trim(), value: value.trim(), modifier: modifier.trim() })}>
            <Text style={styles.primaryButtonText}>运行 modPow</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <View style={styles.logHeaderRow}>
            <Text style={styles.sectionTitle}>运行日志（真实返回值 / 错误 / 耗时）</Text>
            <Pressable style={styles.smallButton} onPress={() => setLog([])}>
              <Text style={styles.smallButtonText}>清空</Text>
            </Pressable>
          </View>
          {log.length === 0 ? (
            <Text style={styles.emptyLog}>尚无记录，点击上方按钮开始</Text>
          ) : (
            log.map(entry => (
              <View key={entry.key} style={[styles.logEntry, entry.ok ? styles.logOk : styles.logErr]}>
                <Text style={styles.logLabel}>
                  {entry.ok ? '✓ ' : '✗ '}
                  {entry.label}
                  {entry.ms !== null ? ` · ${entry.ms} ms` : ''}
                </Text>
                <Text style={styles.logOutput} selectable={true} numberOfLines={4}>
                  {entry.output}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f5f6f8',
  },
  header: {
    padding: 16,
    backgroundColor: '#2469f6',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 12,
    color: '#dbe6ff',
    marginTop: 4,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 12,
    paddingBottom: 32,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2329',
  },
  sectionDesc: {
    fontSize: 12,
    color: '#646a73',
    marginTop: 4,
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  button: {
    backgroundColor: '#2469f6',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  dangerButton: {
    backgroundColor: '#d54941',
  },
  primaryButton: {
    backgroundColor: '#2469f6',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 13,
  },
  smallButton: {
    backgroundColor: '#eef1f6',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  smallButtonText: {
    color: '#383c42',
    fontSize: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#dcdfe6',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
    fontSize: 13,
    color: '#1f2329',
  },
  logHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emptyLog: {
    fontSize: 12,
    color: '#8f959e',
    marginTop: 8,
  },
  logEntry: {
    borderRadius: 6,
    padding: 10,
    marginTop: 8,
  },
  logOk: {
    backgroundColor: '#f0f9eb',
  },
  logErr: {
    backgroundColor: '#fdf0ef',
  },
  logLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2329',
  },
  logOutput: {
    fontSize: 12,
    color: '#383c42',
    marginTop: 4,
    lineHeight: 17,
  },
});
