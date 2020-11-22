const { emptyDir, mkdirp, readFile, writeFile,remove } = require('fs-extra');
const obfuscate = require('./javascriptObfuscatorAPI');
const fs = require('fs');
const path = require('path');
const {
  TEMP_FOLDER,
  DIST_TEMP_FOLDER,
  SRC_TEMP_FOLDER,
  BEG_ANNOTATION,
  END_ANNOTATION,
  EXTS
} = require('./constants');
const {
  buildNormalizePath,
  wrapCodeWithTags,
  getBundlePath,
  skipObfuscation,
  stripTags
} = require('./utils');

const debug = !!process.env.DEBUG;

async function obfuscateBundle(
  {bundlePath, bundleSourceMapPath},
  fileNames,
  config,
  runConfig
) {
  await emptyDir(TEMP_FOLDER);

  const metroBundle = await readFile(bundlePath, 'utf8');
  const metroBundleChunks = metroBundle.split(BEG_ANNOTATION);
  const metroUserFilesOnly = metroBundleChunks
    .filter((c, i) => i > 0)
    .map((c, i) => {
      return c.split(END_ANNOTATION)[0];
    });

  // build tmp src folders structure
  await Promise.all(
    fileNames.map(n =>
      mkdirp(`${SRC_TEMP_FOLDER}/${path.dirname(n)}`)
    )
  );

  // write user files to tmp folder
  await Promise.all(
    metroUserFilesOnly.map((c, i) =>
      writeFile(`${SRC_TEMP_FOLDER}/${fileNames[i]}`, c)
    )
  )

  const filesSrc = `**/*.js?(.map)`;
  const filesDest = DIST_TEMP_FOLDER;
  const cwd = SRC_TEMP_FOLDER;

  if (bundleSourceMapPath) {
    console.warn(`Metro is generating source maps that won't be useful after obfuscation.`);
  }

  // Loop through filesSrc and obfuscate files and save to filesDest.
  await obfuscate({ config, filesSrc, filesDest, cwd, runConfig });

  // read obfuscated user files
  const obfusctedUserFiles = await Promise.all(metroUserFilesOnly.map((c, i) =>
    readFile(`${DIST_TEMP_FOLDER}/${fileNames[i]}`, 'utf8')
  ));

  // build final bundle (with JSO TAGS still)
  const finalBundle = metroBundleChunks.reduce((acc, c, i) => {
    if (i === 0) {
      return c;
    }

    const obfuscatedCode = obfusctedUserFiles[i - 1];
    const tillCodeEnd = c.substr(
      c.indexOf(END_ANNOTATION),
      c.length
    );
    return acc + BEG_ANNOTATION + obfuscatedCode + tillCodeEnd;
  }, '');

  await writeFile(bundlePath, stripTags(finalBundle));
}

/**
 * Add serialize.processModuleFilter option to metro and attach listener to beforeExit event.
 * *config.fileSrc* and *config.filesDest* will be ignored.
 * @param {object} _config
 * @param {object} runConfig
 * @param {string} [projectRoot=process.cwd()]
 * @returns {{serializer: {processModuleFilter(*): boolean}}}
 */
module.exports = function (_config = {}, runConfig = {}, projectRoot = process.cwd()) {
  const skipReason = skipObfuscation(runConfig);
  if (skipReason) {
    console.log(`warning:  Obfuscation SKIPPED [${skipReason}]`);
    return {};
  }

  const config = _config;
  const bundlePath = getBundlePath();
  const fileNames = new Set();

  process.on('beforeExit', async function (exitCode) {
    try{
      console.log('info: Obfuscating Code');
      // start obfuscation
      await obfuscateBundle(bundlePath, Array.from(fileNames), config, runConfig);
      if(!runConfig || !runConfig.logObfuscatedFiles){
        await remove(TEMP_FOLDER); // clear temp folder 
      }
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
       * {@BEG_ANNOTATION} and {@END_ANNOTATION}.
       * @param {{output: Array<*>, path: string, getSource: function():Buffer}} _module
       * @returns {boolean}
       */
      processModuleFilter(_module) {
        if (
          _module.path.indexOf('node_modules') !== -1 ||
          typeof _module.path !== 'string' ||
          !fs.existsSync(_module.path) ||
          !path.extname(_module.path).match(EXTS)
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
