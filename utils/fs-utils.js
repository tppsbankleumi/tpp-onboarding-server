const fs = require('fs');
const pem = require('pem');

function readConfig() {
  let data = fs.readFileSync(`${__dirname}/../server-conf.json`);
  return JSON.parse(data);
}
exports.readConfig = readConfig;

function readQseal() {
  let config = readConfig();
  let path = __dirname + '/../certs/' + config['QSEAL'];
  let signatureContents = fs.readFileSync(path, 'utf-8');
  return signatureContents;
}
exports.readQseal = readQseal;

async function readQwack() {
  let config = readConfig();
  let path = __dirname + '/../certs/' + config['QWACK'];
  console.log(`reading qwack  ${JSON.stringify(path)}`);
  return await new Promise((resolve, reject) => {
    let mtlsContents = fs.readFileSync(path);
    try {
      pem.readPkcs12(
        mtlsContents,
        { p12Password: 'password' },
        (err, result) => {
          console.log(`error ${err}`);
          resolve(result);
        }
      );
    } catch (error) {
      console.log(`failed parsing ${JSON.stringify(error)}`);
      reject('error');
    }
  });
}
exports.readQwack = readQwack;
