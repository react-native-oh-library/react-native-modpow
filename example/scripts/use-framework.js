#!/usr/bin/env node
/**
 * 把 example 切到指定 RN 鸿蒙框架版本。
 * 用法: node ./scripts/use-framework.js 0.72|0.77|0.82|0.84 [--sync-har]
 */
const fs = require('fs');
const path = require('path');

const EXAMPLE = path.resolve(__dirname, '..');
const HARMONY_PKG = '@react-native-oh/react-native-harmony';
const HAR_DIR = path.join(EXAMPLE, 'node_modules', '@react-native-oh', 'react-native-harmony');

const VERSIONS = {
  '0.72': {
    harmony: '0.72.139',
    react: '18.2.0',
    reactNative: '0.72.5',
    har: 'react_native_openharmony_release.har',
    babelPreset: 'module:metro-react-native-babel-preset',
    dependencies: {},
    devDependencies: {
      '@babel/core': '^7.20.0',
      '@babel/preset-env': '^7.20.0',
      '@babel/runtime': '^7.20.0',
      '@react-native/eslint-config': '^0.72.2',
      '@react-native/metro-config': '^0.72.11',
      '@tsconfig/react-native': '^3.0.0',
      '@types/react': '^18.0.24',
      '@types/react-test-renderer': '^18.0.0',
      'babel-jest': '^29.2.1',
      eslint: '^8.19.0',
      jest: '^29.2.1',
      'metro-react-native-babel-preset': '0.76.8',
      prettier: '^2.4.1',
      'react-test-renderer': '18.2.0',
      typescript: '^5.0.0',
    },
    overrides: {
      '@react-native-community/cli': '11.3.6',
      '@react-native/codegen': '0.74.0',
    },
    resolutions: {
      '@react-native-community/cli': '11.3.6',
    },
  },
  '0.77': {
    harmony: '0.77.75',
    react: '18.3.1',
    reactNative: '0.77.1',
    har: 'react_native_openharmony.har',
    babelPreset: 'module:@react-native/babel-preset',
    dependencies: {
      '@react-native/codegen': '0.77.1',
    },
    devDependencies: {
      '@babel/core': '^7.25.2',
      '@babel/preset-env': '^7.25.3',
      '@babel/runtime': '^7.25.0',
      '@react-native-community/cli': '15.0.1',
      '@react-native-community/cli-platform-android': '15.0.1',
      '@react-native-community/cli-platform-ios': '15.0.1',
      '@react-native-oh/react-native-harmony-cli': '0.77.75',
      '@react-native/babel-preset': '0.77.1',
      '@react-native/eslint-config': '0.77.1',
      '@react-native/metro-config': '0.77.1',
      '@react-native/typescript-config': '0.77.1',
      '@types/react': '^18.2.6',
      '@types/react-test-renderer': '^18.2.0',
      'babel-jest': '^29.6.3',
      eslint: '^8.19.0',
      jest: '^29.6.3',
      prettier: '2.8.8',
      'react-test-renderer': '18.3.1',
      typescript: '^5.0.4',
    },
    overrides: {
      '@react-native-community/cli': '15.0.1',
    },
    resolutions: {},
  },
  '0.82': {
    harmony: '0.82.31',
    react: '19.1.1',
    reactNative: '0.82.1',
    har: 'react_native_openharmony.har',
    babelPreset: 'module:@react-native/babel-preset',
    dependencies: {
      '@react-native/codegen': '0.82.1',
    },
    devDependencies: {
      '@babel/core': '^7.25.2',
      '@babel/preset-env': '^7.25.3',
      '@babel/runtime': '^7.25.0',
      '@react-native-community/cli': '20.0.0',
      '@react-native-community/cli-platform-android': '20.0.0',
      '@react-native-community/cli-platform-ios': '20.0.0',
      '@react-native-oh/react-native-harmony-cli': '0.82.31',
      '@react-native/babel-preset': '0.82.1',
      '@react-native/eslint-config': '0.82.1',
      '@react-native/metro-config': '0.82.1',
      '@react-native/typescript-config': '0.82.1',
      '@types/react': '^19.1.1',
      '@types/react-test-renderer': '^19.1.0',
      'babel-jest': '^29.6.3',
      eslint: '^8.19.0',
      jest: '^29.6.3',
      prettier: '2.8.8',
      'react-test-renderer': '19.1.1',
      typescript: '^5.8.3',
    },
    overrides: {
      '@react-native-community/cli': '20.0.0',
    },
    resolutions: {},
  },
  '0.84': {
    harmony: '0.84.3',
    react: '19.2.3',
    reactNative: '0.84.1',
    har: 'react_native_openharmony.har',
    babelPreset: 'module:@react-native/babel-preset',
    dependencies: {
      '@react-native/codegen': '0.84.1',
    },
    devDependencies: {
      '@babel/core': '^7.25.2',
      '@babel/preset-env': '^7.25.3',
      '@babel/runtime': '^7.25.0',
      '@react-native-community/cli': '20.1.0',
      '@react-native-community/cli-platform-android': '20.1.0',
      '@react-native-community/cli-platform-ios': '20.1.0',
      '@react-native-oh/react-native-harmony-cli': '0.84.3',
      '@react-native/babel-preset': '0.84.1',
      '@react-native/eslint-config': '0.84.1',
      '@react-native/metro-config': '0.84.1',
      '@react-native/typescript-config': '0.84.1',
      '@types/react': '^19.1.1',
      '@types/react-test-renderer': '^19.1.0',
      'babel-jest': '^29.6.3',
      eslint: '^8.19.0',
      jest: '^29.6.3',
      prettier: '2.8.8',
      'react-test-renderer': '19.2.3',
      typescript: '^5.8.3',
    },
    overrides: {
      '@react-native-community/cli': '20.1.0',
    },
    resolutions: {},
  },
};

function usage() {
  console.error('用法: node ./scripts/use-framework.js 0.72|0.77|0.82|0.84 [--sync-har]');
  process.exit(1);
}

function resolveHar(preferred) {
  const names = [preferred, 'react_native_openharmony.har', 'react_native_openharmony_release.har'];
  const seen = new Set();
  for (const name of names) {
    if (seen.has(name)) continue;
    seen.add(name);
    if (fs.existsSync(path.join(HAR_DIR, name))) return name;
  }
  return null;
}

const STALE_PATHS = [
  'node_modules',
  'package-lock.json',
  'harmony/oh_modules',
  'harmony/entry/oh_modules',
  'harmony/.ohpm',
  'harmony/oh-package-lock.json5',
  'harmony/entry/oh-package-lock.json5',
  'harmony/entry/.cxx',
  'harmony/entry/build',
];

function readFrameworkVersion() {
  const file = path.join(EXAMPLE, '.framework-version');
  if (!fs.existsSync(file)) return '';
  return fs.readFileSync(file, 'utf8').trim();
}

function cleanStaleInstall(previous, next) {
  if (previous === next) {
    console.log(`已是 ${next}，保留现有依赖`);
    return;
  }
  for (const rel of STALE_PATHS) {
    const abs = path.join(EXAMPLE, rel);
    if (!fs.existsSync(abs)) continue;
    fs.rmSync(abs, { recursive: true, force: true });
    console.log(`已清理 ${rel}`);
  }
}

function writeOhPackages(harName) {
  const pairs = [
    [
      path.join(EXAMPLE, 'harmony', 'oh-package.json5'),
      `../node_modules/@react-native-oh/react-native-harmony/${harName}`,
    ],
    [
      path.join(EXAMPLE, 'harmony', 'entry', 'oh-package.json5'),
      `../../node_modules/@react-native-oh/react-native-harmony/${harName}`,
    ],
  ];
  for (const [file, rel] of pairs) {
    const text = fs.readFileSync(file, 'utf8');
    const pattern = /"@rnoh\/react-native-openharmony":\s*"file:[^"]+"/;
    if (!pattern.test(text)) {
      console.error(`未找到 RNOH 依赖声明: ${file}`);
      process.exit(1);
    }
    const next = text.replace(
      pattern,
      `"@rnoh/react-native-openharmony": "file:${rel}"`,
    );
    fs.writeFileSync(file, next);
  }
}

function main() {
  const args = process.argv.slice(2).filter((arg) => arg !== '--');
  const syncHar = args.includes('--sync-har');
  const version = args.find((arg) => !arg.startsWith('--'));
  const profile = version ? VERSIONS[version] : null;
  if (!profile) usage();

  const previous = readFrameworkVersion();
  const installed = resolveHar(profile.har);
  if (syncHar && !installed) {
    console.error(`未在 ${HAR_DIR} 找到 RNOH HAR，请先 npm install`);
    process.exit(1);
  }
  const harName = installed || profile.har;

  const pkgPath = path.join(EXAMPLE, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const modpow = pkg.dependencies['@react-native-ohos/react-native-modpow'];
  pkg.dependencies = {
    [HARMONY_PKG]: profile.harmony,
    react: profile.react,
    'react-native': profile.reactNative,
    '@react-native-ohos/react-native-modpow': modpow,
    ...profile.dependencies,
  };
  pkg.devDependencies = profile.devDependencies;
  const engines = pkg.engines;
  delete pkg.engines;
  pkg.overrides = profile.overrides;
  if (Object.keys(profile.resolutions).length > 0) {
    pkg.resolutions = profile.resolutions;
  } else {
    delete pkg.resolutions;
  }
  if (engines) pkg.engines = engines;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

  fs.writeFileSync(
    path.join(EXAMPLE, 'babel.config.js'),
    `module.exports = {\n  presets: ['${profile.babelPreset}'],\n};\n`,
  );
  writeOhPackages(harName);
  if (!syncHar) cleanStaleInstall(previous, version);
  fs.writeFileSync(path.join(EXAMPLE, '.framework-version'), version + '\n');

  console.log(
    `framework ${version}: react-native ${profile.reactNative}, ${HARMONY_PKG}@${profile.harmony}, HAR ${harName}`,
  );
}

main();
