const utils = require('../utils/api-utils');
var URL = require('url').URL;
const { readQseal, readQwack, readConfig } = require('../utils/fs-utils');
const {
  createTppDigest,
  createTppSignature,
} = require('../utils/certificate-utils');

const BODY_TEMPLATE =
  'grant_type=authorization_code&client_id=${CLIENTID}&redirect_uri=https://tpp-callback-url.com&code=${CODE}&code_verifier=${CODE_VERFIIER}';

async function createToken(clientId, code, code_verifier) {
  let response;
  try {
    response = await callToken(clientId, code, code_verifier);
    return response;
  } catch (error) {
    return error;
  }
}

async function callToken(clientId, code, code_verifier) {
  let body = BODY_TEMPLATE.replace('${CLIENTID}', clientId)
    .replace('${CODE}', code)
    .replace('${CODE_VERFIIER}', code_verifier);
  console.log(`Sending Body ${body}`);
  let digest = createTppDigest(body, 'sha256');
  console.log(` digest ${digest}`);

  let certificate = readQseal();
  console.log(` certificate ${certificate}`);
  let configData = readConfig();

  let signature = createTppSignature(
    certificate,
    {
      Digest: digest,
    },
    {
      'TPP-Redirect-URI': configData['"Callback-URL'],
    },
    'sha256'
  );
  console.log(` signature ${signature}`);

  const ENV_API = `https://${configData['Api-Enviorment']}/${configData['Api-Type']}`; // dev;

  let qwack = await readQwack();
  console.log(`Calling Token ${ENV_API}/v1/Token/`);
  let result;
  try {
    result = await utils.manageRequestResponse(
      new URL(`${ENV_API}/v1/Token/`),
      {
        'Signature': signature,
        'Digest': digest,
        'TPP-Signature-Certificate': encodeURI(certificate),
      },
      'POST',
      body,
      qwack
    );
  } catch (error) {
    console.log('FALIED ');
    return { message: error.message, status: 'FAILED' };
  }

  console.log(`result ${JSON.stringify(result)}`);
  return result;
}

exports.createToken = createToken;
