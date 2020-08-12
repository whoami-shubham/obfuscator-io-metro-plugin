const glob = require('glob');
const { mkdirp, readFile, writeFile } = require('fs-extra');
const path = require('path');
const axios = require('axios').default;

module.exports = async function({ config, filesSrc, filesDest, cwd }) {
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

  const postData = Object.assign({}, config);
  postData.Items = await Promise.all(files.map(async (f) => {
    return {
      FileName: f,
      FileCode: await readFile(`${cwd}/${f}`, 'utf8'),
    };
  }));
  const res = await axios.post('https://service.javascriptobfuscator.com/HttpApi.ashx', postData, {
    headers: {
      'content-type' : 'text/json',
    },
  });
  if (res.data.Type !== "Succeed") {
    console.log(res.data);
    throw new Error("ERROR: " + res.data.Type + ":" + res.data.ErrorCode + ":" + res.data.Message);
  }

  await Promise.all(res.data.Items.map(async (item) => {
    await mkdirp(`${filesDest}/${path.dirname(item.FileName)}`)
    await writeFile(`${filesDest}/${item.FileName}`, item.FileCode);
  }));
};
