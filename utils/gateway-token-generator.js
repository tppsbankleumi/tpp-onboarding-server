process.env['NODE_CONFIG_DIR'] = __dirname + '/../config';

const config = require('config');
const { sendRequest, patchCredentials } = require('./test-utils');

async function createToken(credentials) {
  const section = 'Auth';
  var headers = config.get(`${section}.Request.headers`);
  return sendRequest(section, headers, 'POST', patchCredentials, credentials);
}

exports.createToken = createToken;
