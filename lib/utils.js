const readline = require('readline');
const acorn = require('acorn');
const {Command} = require('commander');
const {Readable} = require('stream');
const {
  EXTS,
  END_ANNOTATION,
  BEG_ANNOTATION,
  BUNDLE_OUTPUT_CLI_ARG,
  BUNDLE_SOURCEMAP_OUTPUT_CLI_ARG,
  BUNDLE_DEV_CLI_ARG,
  BUNDLE_CMD
} = require('./constants');

/**
 * Only 'bundle' command triggers obfuscation.
 * Development bundles will be ignored (--dev true). Use JSO_METRO_DEV to override this behaviour.
 * @returns {string} skip reason. If falsy value dont skip obfuscation
 */
function skipObfuscation({ runInDev }) {
  let isBundleCmd = false;
  const command = new Command();
  command
    .command(BUNDLE_CMD)
    .allowUnknownOption()
    .action(() => (isBundleCmd = true));
  command.option(`${BUNDLE_DEV_CLI_ARG} <boolean>`).parse(process.argv);
  if (!isBundleCmd) {
    return 'Not a *bundle* command';
  }
  if (command.dev === 'true') {
    return (
      !runInDev &&
      'Development mode. Override with JSO_METRO_DEV=true environment variable'
    );
  }
  return null;
}

/**
 * Get bundle path based CLI arguments
 * @returns {{bundlePath: string, bundleSourceMapPath: string}}
 * @throws {Error} when bundle output was not found
 */
function getBundlePath() {
  const command = new Command();
  command
    .option(`${BUNDLE_OUTPUT_CLI_ARG} <string>`)
    .option(`${BUNDLE_SOURCEMAP_OUTPUT_CLI_ARG} <string>`)
    .parse(process.argv);
  if (command.bundleOutput) {
    return {
      bundlePath: command.bundleOutput,
      bundleSourceMapPath: command.sourcemapOutput
    };
  }
  console.error('Bundle output path not found.');
  return process.exit(-1);
}

/**
 * Strip all  tags from code
 * @param {string} code
 * @returns {string}
 */
function stripTags(code) {
  return code.replace(new RegExp(BEG_ANNOTATION, 'g'), '')
    .replace(new RegExp(END_ANNOTATION, 'g'), '')
}

/**
 * When next character is a new line (\n or \r\n),
 * we should increment startIndex to avoid user code starting with a new line.
 * @param {string} startIndex
 * @param {string} code
 * @returns {number}
 * @example
 *    __d(function(g,r,i,a,m,e,d){(detect new line here and start below)
 *      // user code
 *      ...
 *    }
 */
function shiftStartIndexOnNewLine(startIndex, code) {
  switch (code[startIndex + 1]) {
    case '\r':
      startIndex++;
      return shiftStartIndexOnNewLine(startIndex, code);
    case '\n':
      startIndex++;
      break;
  }
  return startIndex;
}

function getMetroFactoryBodyRange(code) {
  const factory = getMetroFactoryNode(code);
  if (factory && factory.body && factory.body.type === 'BlockStatement') {
    return {
      start: factory.body.start,
      end: factory.body.end - 1
    };
  }

  return getMetroFactoryBodyRangeByScan(code);
}

function getMetroFactoryParamNames(code) {
  const factory = getMetroFactoryNode(code);
  if (factory && Array.isArray(factory.params)) {
    return factory.params
      .filter(param => param.type === 'Identifier')
      .map(param => param.name);
  }

  return getMetroFactoryParamNamesByScan(code);
}

function getMetroFactoryNode(code) {
  try {
    const ast = acorn.parse(code, {
      ecmaVersion: 'latest',
      sourceType: 'script'
    });
    const statement = ast.body.find(node =>
      node.type === 'ExpressionStatement' &&
      node.expression.type === 'CallExpression' &&
      node.expression.arguments[0] &&
      (
        node.expression.arguments[0].type === 'FunctionExpression' ||
        node.expression.arguments[0].type === 'ArrowFunctionExpression'
      )
    );
    const callExpression = statement && statement.expression;
    const factory = callExpression &&
      callExpression.type === 'CallExpression' &&
      callExpression.arguments[0];

    return factory || null;
  } catch (error) {
    if (process.env.DEBUG) {
      console.warn('warning: Falling back to scanner for Metro module body:', error.message);
    }
  }

  return null;
}

function getMetroFactoryBodyRangeByScan(code) {
  const wrapperStart = code.indexOf('__d');
  const functionStart = code.indexOf('function', wrapperStart === -1 ? 0 : wrapperStart);
  const start = code.indexOf('{', functionStart === -1 ? 0 : functionStart);
  if (start === -1) {
    throw new Error('Unable to locate Metro module factory body for obfuscation.');
  }

  const end = findMatchingBrace(code, start);
  return { start, end };
}

function getMetroFactoryParamNamesByScan(code) {
  const wrapperStart = code.indexOf('__d');
  const functionStart = code.indexOf('function', wrapperStart === -1 ? 0 : wrapperStart);
  if (functionStart === -1) {
    return [];
  }

  const paramsStart = code.indexOf('(', functionStart);
  if (paramsStart === -1) {
    return [];
  }

  const paramsEnd = findMatchingParen(code, paramsStart);
  return code
    .slice(paramsStart + 1, paramsEnd)
    .split(',')
    .map(param => param.trim())
    .filter(param => /^[A-Za-z_$][0-9A-Za-z_$]*$/.test(param));
}

function findMatchingParen(code, start) {
  let depth = 0;

  for (let i = start; i < code.length; i++) {
    const char = code[i];
    const next = code[i + 1];

    if (char === '\'' || char === '"') {
      i = skipQuotedString(code, i, char);
      continue;
    }

    if (char === '`') {
      i = skipTemplateString(code, i);
      continue;
    }

    if (char === '/' && next === '/') {
      i = skipLineComment(code, i);
      continue;
    }

    if (char === '/' && next === '*') {
      i = skipBlockComment(code, i);
      continue;
    }

    if (char === '(') {
      depth++;
      continue;
    }

    if (char === ')') {
      depth--;
      if (depth === 0) {
        return i;
      }
    }
  }

  return code.length - 1;
}

function findMatchingBrace(code, start) {
  let depth = 0;

  for (let i = start; i < code.length; i++) {
    const char = code[i];
    const next = code[i + 1];

    if (char === '\'' || char === '"') {
      i = skipQuotedString(code, i, char);
      continue;
    }

    if (char === '`') {
      i = skipTemplateString(code, i);
      continue;
    }

    if (char === '/' && next === '/') {
      i = skipLineComment(code, i);
      continue;
    }

    if (char === '/' && next === '*') {
      i = skipBlockComment(code, i);
      continue;
    }

    if (char === '/' && isRegexStart(code, i)) {
      i = skipRegex(code, i);
      continue;
    }

    if (char === '{') {
      depth++;
      continue;
    }

    if (char === '}') {
      depth--;
      if (depth === 0) {
        return i;
      }
    }
  }

  throw new Error('Unable to locate Metro module factory body for obfuscation.');
}

function skipQuotedString(code, start, quote) {
  for (let i = start + 1; i < code.length; i++) {
    if (code[i] === '\\') {
      i++;
      continue;
    }
    if (code[i] === quote) {
      return i;
    }
  }
  return code.length - 1;
}

function skipTemplateString(code, start) {
  for (let i = start + 1; i < code.length; i++) {
    if (code[i] === '\\') {
      i++;
      continue;
    }
    if (code[i] === '`') {
      return i;
    }
  }
  return code.length - 1;
}

function skipLineComment(code, start) {
  const end = code.indexOf('\n', start + 2);
  return end === -1 ? code.length - 1 : end;
}

function skipBlockComment(code, start) {
  const end = code.indexOf('*/', start + 2);
  return end === -1 ? code.length - 1 : end + 1;
}

function skipRegex(code, start) {
  let inCharacterClass = false;
  for (let i = start + 1; i < code.length; i++) {
    if (code[i] === '\\') {
      i++;
      continue;
    }
    if (code[i] === '[') {
      inCharacterClass = true;
      continue;
    }
    if (code[i] === ']') {
      inCharacterClass = false;
      continue;
    }
    if (code[i] === '/' && !inCharacterClass) {
      return i;
    }
  }
  return code.length - 1;
}

function isRegexStart(code, slashIndex) {
  for (let i = slashIndex - 1; i >= 0; i--) {
    const char = code[i];
    if (/\s/.test(char)) {
      continue;
    }
    return '({[=,:;!&|?+-*~^<>'.indexOf(char) !== -1;
  }
  return true;
}

/**
 * Wrap user code with  TAGS {BEG_ANNOTATION and END_ANNOTATION}
 * @param {{code: string}} data
 */
function wrapCodeWithTags(data) {
  const reservedNames = getMetroFactoryParamNames(data.code);
  const bodyRange = getMetroFactoryBodyRange(data.code);
  let startIndex = bodyRange.start;
  const endIndex = bodyRange.end;
  startIndex = shiftStartIndexOnNewLine(startIndex, data.code);
  const init = data.code.substring(0, startIndex + 1);
  const clientCode = data.code.substring(startIndex + 1, endIndex);
  const end = data.code.substr(endIndex, data.code.length);
  data.code = init + BEG_ANNOTATION + clientCode + END_ANNOTATION + end;
  return { reservedNames };
}

/**
 * @param {string} path
 * @param {string} projectRoot
 * @returns {string} undefined if path is empty or invalid
 *
 * @example
 *    <project_root>/react-native0.59-grocery-list/App/index.js -> App/index.js
 *    <project_root>/react-native0.59-grocery-list/App/index.ts -> App/index.js
 */
function buildNormalizePath(path, projectRoot) {
  if (typeof path !== 'string' || path.trim().length === 0) {
    return;
  }
  const relativePath = path.replace(projectRoot, '');
  return relativePath.replace(EXTS, '.js').substring(1 /* remove '/' */);
}

module.exports = {
  skipObfuscation,
  getBundlePath,
  stripTags,
  wrapCodeWithTags,
  getMetroFactoryBodyRange,
  getMetroFactoryBodyRangeByScan,
  getMetroFactoryParamNames,
  getMetroFactoryParamNamesByScan,
  buildNormalizePath
}
