const {emptyDir, mkdirp, readFile, writeFile} = require('fs-extra');
const jscrambler = require('jscrambler').default;
const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');
const {
  JSCRAMBLER_CLIENT_ID,
  JSCRAMBLER_TEMP_FOLDER,
  JSCRAMBLER_DIST_TEMP_FOLDER,
  JSCRAMBLER_SRC_TEMP_FOLDER,
  JSCRAMBLER_PROTECTION_ID_FILE,
  JSCRAMBLER_BEG_ANNOTATION,
  JSCRAMBLER_END_ANNOTATION,
  JSCRAMBLER_EXTS
} = require('./constants');
const {
  buildNormalizePath,
  wrapCodeWithTags,
  getBundlePath,
  skipObfuscation,
  stripJscramblerTags
} = require('./utils');

const debug = !!process.env.DEBUG;

async function obfuscateBundle(
  {bundlePath, bundleSourceMapPath},
  fileNames,
  config,
) {
  await emptyDir(JSCRAMBLER_TEMP_FOLDER);

  const metroBundle = await readFile(bundlePath, 'utf8');
  const metroBundleChunks = metroBundle.split(JSCRAMBLER_BEG_ANNOTATION);
  const metroUserFilesOnly = metroBundleChunks
    .filter((c, i) => i > 0)
    .map((c, i) => {
      return c.split(JSCRAMBLER_END_ANNOTATION)[0];
    });

  // build tmp src folders structure
  await Promise.all(
    fileNames.map(n =>
      mkdirp(`${JSCRAMBLER_SRC_TEMP_FOLDER}/${path.dirname(n)}`)
    )
  );

  // write user files to tmp folder
  await Promise.all(
    metroUserFilesOnly.map((c, i) =>
      writeFile(`${JSCRAMBLER_SRC_TEMP_FOLDER}/${fileNames[i]}`, c)
    )
  )

  // adapt configs for react-native
  const filesSrc = [`${JSCRAMBLER_SRC_TEMP_FOLDER}/**/*.js?(.map)`];
  const filesDest = JSCRAMBLER_DIST_TEMP_FOLDER;
  const cwd = JSCRAMBLER_SRC_TEMP_FOLDER;

  if (bundleSourceMapPath) {
    console.warn(`error Metro is generating source maps that won't be useful after obfuscation.`);
  }

  // TODO: Loop through filesSrc and obfuscate files and save to filesDest.

  // read obfuscated user files
  const obfusctedUserFiles = await Promise.all(metroUserFilesOnly.map((c, i) =>
    readFile(`${JSCRAMBLER_DIST_TEMP_FOLDER}/${fileNames[i]}`, 'utf8')
  ));

  // build final bundle (with JSCRAMBLER TAGS still)
  const finalBundle = metroBundleChunks.reduce((acc, c, i) => {
    if (i === 0) {
      return c;
    }

    const obfuscatedCode = obfusctedUserFiles[i - 1];
    const tillCodeEnd = c.substr(
      c.indexOf(JSCRAMBLER_END_ANNOTATION),
      c.length
    );
    return acc + JSCRAMBLER_BEG_ANNOTATION + obfuscatedCode + tillCodeEnd;
  }, '');

  await writeFile(bundlePath, stripJscramblerTags(finalBundle));
}

/**
 * Add serialize.processModuleFilter option to metro and attach listener to beforeExit event.
 * *config.fileSrc* and *config.filesDest* will be ignored.
 * @param {object} _config
 * @param {string} [projectRoot=process.cwd()]
 * @returns {{serializer: {processModuleFilter(*): boolean}}}
 */
module.exports = function (_config = {}, projectRoot = process.cwd()) {
  const skipReason = skipObfuscation();
  if (skipReason) {
    console.log(`warning: Jscrambler Obfuscation SKIPPED [${skipReason}]`);
    return {};
  }

  const bundlePath = getBundlePath();
  const fileNames = new Set();
  const config = Object.assign({}, jscrambler.config, _config);

  if(config.filesDest || config.filesSrc) {
    console.warn('warning: Jscrambler fields filesDest and fileSrc were ignored. Using input/output values of the metro bundler.')
  }

  process.on('beforeExit', async function (exitCode) {
    try{
      console.log('info: Obfuscating Code');
      // start obfuscation
      await obfuscateBundle(bundlePath, Array.from(fileNames), config);
    } catch(err) {
      console.error(err);
      process.exit(1);
    } finally {
      process.exit(exitCode)
    }
  });

  return {
    serializer: {
      /**
       * Select user files ONLY (no vendor) to be obfuscated. That code should be tagged with
       * {@JSCRAMBLER_BEG_ANNOTATION} and {@JSCRAMBLER_END_ANNOTATION}.
       * @param {{output: Array<*>, path: string, getSource: function():Buffer}} _module
       * @returns {boolean}
       */
      processModuleFilter(_module) {
        if (
          _module.path.indexOf('node_modules') !== -1 ||
          typeof _module.path !== 'string' ||
          !fs.existsSync(_module.path) ||
          !path.extname(_module.path).match(JSCRAMBLER_EXTS)
        ) {
          return true;
        }

        const normalizePath = buildNormalizePath(_module.path, projectRoot);
        fileNames.add(normalizePath);
        _module.output.forEach(({data}) => {
          wrapCodeWithTags(data);
        });
        return true;
      }
    }
  };
};
