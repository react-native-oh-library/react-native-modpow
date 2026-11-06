/**
 * Jest 配置 —— react-native-modpow 鸿蒙化库 JS 白盒用例
 *
 * 遵循 RNOH JS 白盒测试规范（对齐 react-native-fs 的 example 工程形态）：
 * - testMatch 用 *-test.js 连字符命名，与被测源码目录解耦
 * - .js 统一走内联 babel 配置（preset-env 按当前 Node 转 CommonJS），
 *   自包含、不读取 example/babel.config.js（其为 Metro/RN 打包配置）
 * - 被测源码经 globalSetup 预编译为纯 JS 复制到 .modpow-sut/（见
 *   jest.global-setup.js），用例经包名 moduleNameMapper 引用副本，
 *   与真实消费方 import 路径一致；istanbul 只插桩纯 JS，规避
 *   babel-jest 对 TS 专属语法丢计数器的问题
 * - 覆盖率对准被测库 JS 层全量源码，阈值锁定 100%
 */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/__tests__/*-test.js'],
  // 避免快照解析器扫描 harmony 原生工程（oh_modules 内含上游 .snap 文件）
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/harmony/'],
  // 指向每次运行预编译的源码副本（内容即 ../src 编译产物）
  moduleNameMapper: {
    '^@react-native-ohos/react-native-modpow$':
      '<rootDir>/.modpow-sut/index.js',
  },
  transform: {
    '^.+\\.js$': [
      'babel-jest',
      {
        babelrc: false,
        configFile: false,
        presets: [
          [
            '@babel/preset-env',
            {targets: {node: 'current'}, modules: 'commonjs'},
          ],
        ],
      },
    ],
  },
  // 被测副本与 mock 均在 node_modules 之外
  transformIgnorePatterns: ['node_modules/'],
  setupFiles: ['<rootDir>/jest.setup.js'],
  globalSetup: '<rootDir>/jest.global-setup.js',
  // 覆盖率对准被测源码副本（rootDir 相对路径），全量锁定 100%
  collectCoverageFrom: ['.modpow-sut/**/*.js'],
  coverageThreshold: {
    global: {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
  },
};
