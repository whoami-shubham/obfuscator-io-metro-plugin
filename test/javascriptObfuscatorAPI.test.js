const assert = require('node:assert/strict');
const test = require('node:test');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { mkdirp, readFile, remove, writeFile } = require('fs-extra');
const obfuscate = require('../lib/javascriptObfuscatorAPI');
const { buildSafeConfig } = require('../lib/javascriptObfuscatorAPI');

test('obfuscates optional chaining without changing runtime behavior', async () => {
  const root = path.join(os.tmpdir(), `jso-metro-${Date.now()}-${process.pid}`);
  const srcDir = path.join(root, 'src');
  const distDir = path.join(root, 'dist');
  const fileName = 'App.js';

  await mkdirp(srcDir);
  await writeFile(
    path.join(srcDir, fileName),
    'module.exports = function readValue(input) {\n' +
      '  return input?.service?.getValue?.() ?? "fallback";\n' +
      '};\n'
  );

  try {
    await obfuscate({
      config: {
        compact: false,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 1,
        stringArray: true
      },
      filesSrc: '**/*.js',
      filesDest: distDir,
      cwd: srcDir,
      runConfig: {}
    });

    const code = await readFile(path.join(distDir, fileName), 'utf8');
    const sandbox = { module: { exports: {} }, exports: {} };
    vm.runInNewContext(code, sandbox);

    assert.equal(sandbox.module.exports(undefined), 'fallback');
    assert.equal(sandbox.module.exports({ service: {} }), 'fallback');
    assert.equal(
      sandbox.module.exports({ service: { getValue: () => 'value' } }),
      'value'
    );
  } finally {
    await remove(root);
  }
});

test('reserves Metro wrapper parameters when using mangled identifiers', () => {
  const config = buildSafeConfig(
    {
      compact: false,
      identifierNamesGenerator: 'mangled',
      stringArray: true
    },
    {
      reservedNames: ['g', 'r', 'i', 'a', 'm', 'e', 'd']
    }
  );

  const code = require('javascript-obfuscator')
    .obfuscate(
      'var React = i(r(d[0]));\n' +
        'm.exports = React?.default?.createElement?.("View") ?? "fallback";\n',
      config
    )
    .getObfuscatedCode();

  const module = { exports: null };
  const importDefault = value => ({ default: value });
  const requireMock = id => ({
    createElement: type => ({ type, id })
  });

  vm.runInNewContext(
    `(function(g,r,i,a,m,e,d){${code}\n})(globalThis, requireMock, importDefault, null, module, {}, [0]);`,
    { requireMock, importDefault, module }
  );

  assert.deepEqual(module.exports, { type: 'View', id: 0 });
  assert.equal(/\b(function|var|let|const)\s+i\b/.test(code), false);
  assert.equal(/\b(function|var|let|const)\s+r\b/.test(code), false);
  assert.equal(/\b(function|var|let|const)\s+d\b/.test(code), false);
});
