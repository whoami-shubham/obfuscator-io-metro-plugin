# Obfuscator.io Metro Plugin

[![npm version](https://img.shields.io/npm/v/obfuscator-io-metro-plugin.svg)](https://www.npmjs.com/package/obfuscator-io-metro-plugin)
[![npm](https://img.shields.io/npm/dt/obfuscator-io-metro-plugin)](https://www.npmjs.com/package/obfuscator-io-metro-plugin)
<img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs welcome!" />

This metro plugin obfuscate your **React Native** bundle using [javascript-obfuscator](https://github.com/javascript-obfuscator/javascript-obfuscator) <br/>
It only obfuscates your code not the code of `node_modules`, you can verify the obfuscated bundle by either extracting the `index.android.bundle` from generated apk
or you can find the file at `project_root\android\app\build\generated\assets\react\release` after `assembleRelease` process

#### for iOS if you’re facing any issue check this [comment](https://github.com/whoami-shubham/obfuscator-io-metro-plugin/issues/2#issuecomment-932389379) by [@andresarezo](https://github.com/andresarezo)

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
    sourceMap: false,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 1,
    numbersToExpressions: true,
    simplify: true,
    stringArrayShuffle: true,
    splitStrings: true,
    stringArrayThreshold: 1,
  },
  {
    runInDev: false /* optional */,
    logObfuscatedFiles: true /* optional generated files will be located at ./.jso */,
    exts: "(.(j|t)s(x)?$|.json$)" /* optional */,
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
