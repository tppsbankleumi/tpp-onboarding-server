//TODO: Restore const utils = require('../../common/utils'); when I figure out how to reuse this properly
const utils = require('../utils/api-utils');
var URL = require('url').URL;
const { readQseal, readQwack, readConfig } = require('../utils/fs-utils');
const {
  createTppDigest,
  createTppSignature,
} = require('../utils/certificate-utils');
const { createChallenge, createVerifier } = require('../utils/auth-utils');

async function createConsentDiscovery(psuid) {
  let response;
  try {
    console.log(`Calling PSUID ${psuid}`);
    response = await callConsentDiscovery(psuid);
    return response;
  } catch (error) {
    return error;
  }
}
exports.createConsentDiscovery = createConsentDiscovery;

async function callConsentDiscovery(psuid) {
  let body = [];
  let digest = createTppDigest(body, 'sha256');
  console.log(` digest ${digest}`);

  let request_id = '79a85ece-776f-4943-9a2d-0a24a3805762';
  let certificate = readQseal();
  console.log(` certificate ${certificate}`);
  let configData = readConfig();

  let signature = createTppSignature(
    certificate,
    {
      'Digest': digest,
      'X-Request-ID': request_id,
      'PSU-ID': psuid,
    },
    {
      'TPP-Redirect-URI': configData['"Callback-URL'],
    },
    'sha256'
  );
  console.log(` signature ${signature}`);

  const CONSENT_API = `https://${configData['Api-Enviorment']}/${configData['Api-Type']}`; // dev;

  let qwack = await readQwack();
  console.log(`Calling CONSENT_API ${CONSENT_API}/v1/Consents/discovery`);
  let result;
  try {
    result = await utils.manageRequestResponse(
      new URL(`${CONSENT_API}/v1/Consents/discovery`),
      {
        'PSU-ID': psuid,
        'Signature': signature,
        'Digest': digest,
        'X-Request-ID': request_id,
        'TPP-Signature-Certificate': encodeURI(certificate),
      },
      'GET',
      undefined,
      qwack
    );
  } catch (error) {
    return { message: error.message, status: 'FAILED' };
  }

  console.log(`result ${JSON.stringify(result)}`);
  return result;
}
