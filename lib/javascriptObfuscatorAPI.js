const glob = require('glob');
const { mkdirp, readFile, writeFile } = require('fs-extra');
const path = require('path');
var JavaScriptObfuscator = require('javascript-obfuscator');
var convert = require('convert-source-map');
var combine = require('combine-source-map');
var generatedSourceMapLocation = "index.android.bundle.map";

module.exports = async function({ config, filesSrc, filesDest, cwd, runConfig, fileConfigs = {} }) {
  console.log({ config, filesSrc, filesDest, cwd });
  const files = await (new Promise((resolve, reject) => {
    glob(filesSrc, { cwd }, function (er, files) {
      if (er) {
        reject(er);
      } else {
        resolve(files);
      }
    })
  }));

  const postData = {};
  postData.Items = await Promise.all(files.map(async (f) => {
    return {
      FileName: f,
      FileCode: await readFile(`${cwd}/${f}`, 'utf8'),
    };
  }));
  
 var sourceMaps = combine.create('index.android.bundle.map');
 var offset = { line: 2 };

  postData.Items.map((item)=>
  {
    sourceMaps = sourceMaps.addFile({source:`${item.FileCode}`,sourceFile:item.FileName},offset);
    try{
      const safeConfig = buildSafeConfig(config, fileConfigs[item.FileName]);
      const obfuscationResult = JavaScriptObfuscator.obfuscate(`${item.FileCode}`, safeConfig);
      item.FileCode= obfuscationResult.getObfuscatedCode();
      // item.SourceMap = obfuscationResult.getSourceMap();
    }
    catch(error){
      console.log("Error while obfuscating, Error : ",error);
      process.exit(-1);
   }
  })

  sourceMaps  = sourceMaps.base64();
  var sm = convert.fromBase64(sourceMaps).toJSON();
  
  await Promise.all(postData.Items.map(async (item) => {
    await mkdirp(`${filesDest}/${path.dirname(item.FileName)}`)
    await writeFile(`${filesDest}/${item.FileName}`, item.FileCode);
  }));
  if(config && config.sourceMap){
    generatedSourceMapLocation = runConfig && runConfig.sourceMapLocation ? runConfig.sourceMapLocation : generatedSourceMapLocation;
    console.log("generating source map .....");
    await writeFile(`${generatedSourceMapLocation}`, sm); // generated source map of unobfuscated code 
    console.log(`generated source map file located at ${generatedSourceMapLocation}`);
  }
};

function buildSafeConfig(config = {}, fileConfig = {}) {
  config = config || {};
  fileConfig = fileConfig || {};
  const reservedNames = [
    ...toArray(config.reservedNames),
    ...toExactNamePatterns(fileConfig.reservedNames || [])
  ];

  return {
    ...config,
    reservedNames: unique(reservedNames)
  };
}

function toExactNamePatterns(names) {
  return names
    .filter(name => typeof name === 'string' && name.length > 0)
    .map(name => `^${escapeRegExp(name)}$`);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function unique(values) {
  return Array.from(new Set(values));
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

module.exports.buildSafeConfig = buildSafeConfig;
