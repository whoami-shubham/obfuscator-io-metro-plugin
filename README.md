# Javascript Obfuscator Metro Plugin

This metro plugin protects your **React Native** bundle using javascriptobfuscator.com.

# Usage

Include the plugin in your `metro.config.js`:

```js
const jsoMetroPlugin = require('javascript-obfuscator-metro-plugin')(
  {
    APIKey: undefined, /* required */ 
    APIPwd: undefined, /* required */ 
    Name: 'My Project', /* optional */ 
    KeepComment: false, /* optional */
    EncodeStrings: false, /* optional */
    MoveStrings: true, /* optional */
    ReplaceNames: true, /* optional */
    RenameGlobals: true, /* optional */
    DeepObfuscate: true, /* optional */
    ReorderCode: true, /* optional */
    MoveMembers: true, /* optional */
    RenameMembers: true, /* optional */
    SelfCompression: true, /* optional */
    OptimizationMode: 'Auto', /* optional */
    CompressionRatio: 'Auto', /* optional */
  },
  {
    runInDev: false, /* optional */
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
  ...jsoMetroPlugin
};
```

For configuration docs see: https://service.javascriptobfuscator.com/httpapi.asmx?op=JSOExecute and https://javascriptobfuscator.com/docs/
