# Obfuscator.io Metro Plugin

This metro plugin obfuscate your **React Native** bundle using [javascript-obfuscator](https://github.com/javascript-obfuscator/javascript-obfuscator)

# Usage

Include the plugin in your `metro.config.js`:

```js
const jsoMetroPlugin = require("javascript-obfuscator-metro-plugin")(
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
    logObfuscatedFiles: true /* optional */, // to log obfuscated files seperately , it is located at ./.jso
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
