//TODO: Restore const utils = require('../../common/utils'); when I figure out how to reuse this properly
const utils = require('../utils/api-utils');
var URL = require('url').URL;
const { readQseal, readQwack, readConfig } = require('../utils/fs-utils');
const {
  createTppDigest,
  createTppSignature,
} = require('../utils/certificate-utils');

async function getAccounts(consentId, token) {
  let response;
  try {
    response = await callAccounts(consentId, token);
    return response;
  } catch (error) {
    return error;
  }
}

async function callAccounts(consentId, token) {
  let body = '';
  let digest = createTppDigest(body, 'sha256');
  // console.log(` digest ${digest}`);

  let request_id = '79a85ece-776f-4943-9a2d-0a24a3805762';
  let certificate = readQseal();
  // console.log(` certificate ${certificate}`);
  let configData = readConfig();

  let signature = createTppSignature(
    certificate,
    {
      'Digest': digest,
      'X-Request-ID': request_id,
      'PSU-ID': "1052107489",
    },
    'sha256'
  );
  console.log(` signature ${signature}`);

  const ENV_API = `https://${configData['Api-Enviorment']}/${configData['Api-Type']}`; // dev;

  let qwack = await readQwack();
  // console.log(`Calling CONSENT_API ${ENV_API}/v1/Accounts/`);
  let result;
  try {
    result = await utils.manageRequestResponse(
      new URL(`${ENV_API}/v1/Accounts/`),
      {
        'Authorization': `Bearer ${token}`,
        'PSU-IP-Address': '192.168.8.78',
        'PSU-IP-Port': '5000',
        'Consent-ID': consentId,
        'Signature': signature,
        'Digest': digest,
        'X-Request-ID': request_id,
        'TPP-Signature-Certificate': encodeURI(certificate),
      },
      'GET',
      JSON.stringify(body),
      qwack
    );
  } catch (error) {
    console.log('ERROR');
    return { message: error.message, status: 'FAILED' };
  }

  console.log(`result ${JSON.stringify(result)}`);
  return result;
}

exports.getAccounts = getAccounts;
