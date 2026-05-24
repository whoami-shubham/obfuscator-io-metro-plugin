const assert = require('node:assert/strict');
const test = require('node:test');
const vm = require('node:vm');
const JavaScriptObfuscator = require('javascript-obfuscator');
const {
  BEG_ANNOTATION,
  END_ANNOTATION
} = require('../lib/constants');
const {
  getMetroFactoryBodyRange,
  getMetroFactoryBodyRangeByScan,
  getMetroFactoryParamNames,
  getMetroFactoryParamNamesByScan,
  stripTags,
  wrapCodeWithTags
} = require('../lib/utils');

function getTaggedBody(code) {
  const start = code.indexOf(BEG_ANNOTATION) + BEG_ANNOTATION.length;
  const end = code.indexOf(END_ANNOTATION);
  return code.slice(start, end);
}

test('wrapCodeWithTags tags only the Metro factory body when metadata follows it', () => {
  const data = {
    code: '__d(function(global, require, importDefault, importAll, module, exports, dependencyMap) {\n' +
      'var value = object?.method?.(dependencyMap[0]);\n' +
      '}, 42, [7], { verboseName: "App", inverseDependencies: {} });'
  };

  wrapCodeWithTags(data);

  assert.equal(getTaggedBody(data.code), 'var value = object?.method?.(dependencyMap[0]);\n');
  assert.match(data.code, /\}, 42, \[7\], \{ verboseName: "App", inverseDependencies: \{\} \}\);$/);
  assert.equal(stripTags(data.code).includes('object?.method?.(dependencyMap[0])'), true);
});

test('wrapCodeWithTags handles braces inside the module body without moving the end tag', () => {
  const data = {
    code: '__d(function(g, r, i, a, m, e, d) {\n' +
      'const text = "}";\n' +
      'const regex = /\\}/g;\n' +
      'const value = ({ nested: true })?.nested;\n' +
      '}, 1, [], { factory: true });'
  };

  wrapCodeWithTags(data);

  assert.equal(
    getTaggedBody(data.code),
    'const text = "}";\nconst regex = /\\}/g;\nconst value = ({ nested: true })?.nested;\n'
  );
  assert.equal(stripTags(data.code).endsWith('}, 1, [], { factory: true });'), true);
});

test('getMetroFactoryBodyRange reports the block statement boundaries', () => {
  const code = '"use strict";\nglobal.__d(function(g,r,i,a,m,e,d){\nlet x = maybe?.call?.();\n},123,[]);';
  const range = getMetroFactoryBodyRange(code);

  assert.equal(code[range.start], '{');
  assert.equal(code[range.end], '}');
  assert.equal(code.slice(range.start + 1, range.end), '\nlet x = maybe?.call?.();\n');
  assert.deepEqual(getMetroFactoryParamNames(code), ['g', 'r', 'i', 'a', 'm', 'e', 'd']);
});

test('tagged Metro module can be obfuscated and keeps dependency metadata intact', () => {
  const data = {
    code: '__d(function(global, require, importDefault, importAll, module, exports, dependencyMap) {\n' +
      'module.exports = dependencyMap?.[0]?.name ?? "fallback";\n' +
      '}, 10, [{ name: "dep" }], { verboseName: "App", inverseDependencies: {} });'
  };

  wrapCodeWithTags(data);
  const beforeTag = data.code.slice(0, data.code.indexOf(BEG_ANNOTATION));
  const afterBegin = data.code.slice(data.code.indexOf(BEG_ANNOTATION) + BEG_ANNOTATION.length);
  const userCode = afterBegin.slice(0, afterBegin.indexOf(END_ANNOTATION));
  const afterTag = afterBegin.slice(afterBegin.indexOf(END_ANNOTATION) + END_ANNOTATION.length);
  const obfuscatedCode = JavaScriptObfuscator
    .obfuscate(userCode, { compact: false })
    .getObfuscatedCode();
  const finalBundle = beforeTag + obfuscatedCode + afterTag;
  const captured = [];

  vm.runInNewContext(finalBundle, {
    __d: (...args) => captured.push(args)
  });

  assert.equal(captured.length, 1);
  assert.equal(captured[0][1], 10);
  assert.equal(JSON.stringify(captured[0][2]), JSON.stringify([{ name: 'dep' }]));
  assert.equal(
    JSON.stringify(captured[0][3]),
    JSON.stringify({ verboseName: 'App', inverseDependencies: {} })
  );

  const module = { exports: undefined };
  captured[0][0](global, null, null, null, module, {}, captured[0][2]);
  assert.equal(module.exports, 'dep');
});

test('scanner fallback finds factory body without parsing the entire wrapper', () => {
  const code = '__d(function(g,r,i,a,m,e,d){const a="{not end}";const b=/\\}/g;const c=`${"{still body}"}`;return d?.[0];},5,[1],{meta:{}});';
  const range = getMetroFactoryBodyRangeByScan(code);

  assert.equal(
    code.slice(range.start + 1, range.end),
    'const a="{not end}";const b=/\\}/g;const c=`${"{still body}"}`;return d?.[0];'
  );
  assert.deepEqual(getMetroFactoryParamNamesByScan(code), ['g', 'r', 'i', 'a', 'm', 'e', 'd']);
});
