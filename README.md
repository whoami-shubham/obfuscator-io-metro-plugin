# Obfuscator.io Metro Plugin

[![npm version](https://img.shields.io/npm/v/obfuscator-io-metro-plugin.svg)](https://www.npmjs.com/package/obfuscator-io-metro-plugin)
[![npm](https://img.shields.io/npm/dm/obfuscator-io-metro-plugin)](https://www.npmjs.com/package/obfuscator-io-metro-plugin)

This metro plugin obfuscate your **React Native** bundle using [javascript-obfuscator](https://github.com/javascript-obfuscator/javascript-obfuscator) <br/>
It only obfuscates your code not the code of `node_modules`, you can verify the obfuscated bundle by either extracting the `index.android.bundle` from generated apk
or you can find the file at `project_root\android\app\build\generated\assets\react\release` after `assembleRelease` process

## Installation

```bash
 npm i obfuscator-io-metro-plugin

```

## Usage

Include the plugin in your `metro.config.js`:

```js
const jsoMetroPlugin = require("obfuscator-io-metro-plugin")(
  {
    // for these option look javascript-obfuscator library options from  above url
    compact: false,
    sourceMap: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 1,
    numbersToExpressions: true,
    simplify: true,
    shuffleStringArray: true,
    splitStrings: true,
    stringArrayThreshold: 1,
  },
  {
    runInDev: false /* optional */,
    logObfuscatedFiles: true /* optional generated files will be located at ./.jso */,
    sourceMapLocation:
      "./index.android.bundle.map" /* optional  only works if sourceMap: true in obfuscation option */,
  }
);

module.exports = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false,
      },
    }),
  },
  ...jsoMetroPlugin,
};
```

For obfuscation options configuration docs see: [https://github.com/javascript-obfuscator/javascript-obfuscator](https://github.com/javascript-obfuscator/javascript-obfuscator)
