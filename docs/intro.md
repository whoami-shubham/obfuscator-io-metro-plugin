---
sidebar_position: 1
---

# Intro

Let's discover **obfuscator-io-metro-plugin in less than 5 minutes**.

## Inro video

<iframe width="100%" height="315" src="https://www.youtube.com/embed/8zG4mlmDMlU" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

## Getting Started

Get started by **installing npm package**.

```bash
 npm i -D obfuscator-io-metro-plugin
```

## Usage

Include the plugin in your `metro.config.js`:

```js
const jsoMetroPlugin = require("obfuscator-io-metro-plugin")(
  {
    compact: false,
    sourceMap: false, // source Map generated after obfuscation is not useful right now so use default value i.e. false
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

### Options

For obfuscation options configuration docs see: [https://github.com/javascript-obfuscator/javascript-obfuscator](https://github.com/javascript-obfuscator/javascript-obfuscator)
