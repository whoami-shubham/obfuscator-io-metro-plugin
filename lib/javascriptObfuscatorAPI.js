const glob = require('glob');
const { mkdirp, readFile, writeFile } = require('fs-extra');
const path = require('path');
const axios = require('axios').default;

module.exports = async function({ config, filesSrc, filesDest, cwd }) {
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
      FileCode: await readFile(f, 'utf8'),
    };
  }));

  try {
    const res = await axios.post('https://service.javascriptobfuscator.com/HttpApi.ashx', postData);
    if (res.data.Type !== "Succeed") {
      console.warn("ERROR: " + res.data.Type + ":" + res.data.ErrorCode + ":" + res.data.Message);
      return;
    }

    await Promise.all(res.data.Items.map(async (item) => {
      await mkdirp(`${filesDest}/${path.dirname(item.FileName)}`)
      await writeFile(`${filesDest}/${item.FileName}`, item.FileCode);
    }));
  } catch (e) {
    console.warn(e.response.data);
  }
};
