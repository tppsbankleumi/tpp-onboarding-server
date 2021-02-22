//TODO: Restore const utils = require('../../common/utils'); when I figure out how to reuse this properly
const utils = require('../utils/api-utils');
var URL = require('url').URL;
const { readQseal, readQwack, readConfig } = require('../utils/fs-utils');
const {
  createTppDigest,
  createTppSignature,
} = require('../utils/certificate-utils');
const { createChallenge, createVerifier } = require('../utils/auth-utils');

async function createConsent(psuid) {
  let response;
  try {
    console.log(`Calling PSUID ${psuid}`);
    response = await callConsent(psuid);
    return response;
  } catch (error) {
    return error;
  }
}
exports.createConsent = createConsent;

async function callConsent(psuid) {
  // let body = {
  //   access: {
  //     balances: [],
  //     transactions: [],
  //     accounts: [],
  //   },
  //   combinedServiceIndicator: false,
  //   recurringIndicator: true,
  //   validUntil: '2021-07-01',
  //   frequencyPerDay: 1,
  // };
  let body = {
    access: {
      balances: [
        {
          iban: 'IL750109490000019519055',
          currency: 'ILS',
          cashAccountType: 'CASH',
        },
      ],
      accounts: [
        {
          iban: 'IL750109490000019519066',
          currency: 'ILS',
          cashAccountType: 'CASH',
        },
      ],
      transactions: [
        {
          iban: 'IL750109490000019519055',
          currency: 'ILS',
          cashAccountType: 'CASH',
        },
      ],
    },
    combinedServiceIndicator: false,
    recurringIndicator: true,
    validUntil: '2021-07-01',
    frequencyPerDay: 100,
  };
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
  console.log(`Calling CONSENT_API ${CONSENT_API}/v1/Consents/`);
  let result;
  try {
    result = await utils.manageRequestResponse(
      new URL(`${CONSENT_API}/v1/Consents/`),
      {
        'PSU-ID': psuid,
        'Signature': signature,
        'Digest': digest,
        'X-Request-ID': request_id,
        'TPP-Signature-Certificate': encodeURI(certificate),
      },
      'POST',
      JSON.stringify(body),
      qwack
    );
  } catch (error) {
    return { message: error.message, status: 'FAILED' };
  }

  console.log(`result ${JSON.stringify(result)}`);
  return result;
}

async function approveConsent(psuId, consentId, tppId) {
  let response;
  try {
    console.log(`Calling PSUID And  consentId ${psuId} ${consentId}`);
    response = await callApproveConsent(psuId, consentId, tppId);
    return response;
  } catch (error) {
    return error;
  }
}
exports.approveConsent = approveConsent;

async function callApproveConsent(psuId, consentId, tppId) {
  let body = {
    codeChallengeMethod: 'S256',
    tpp_id: tppId,
    psu_id: psuId,
  };

  let codeVerifier = createVerifier();
  console.log('CODEVERYFIER', codeVerifier);
  let codeChallenge = createChallenge(codeVerifier);
  body.codeChallenge = codeChallenge;

  let digest = createTppDigest(body, 'sha256');

  let request_id = '79a85ece-776f-4943-9a2d-0a24a3805762';
  let certificate = readQseal();
  // console.log(` certificate ${certificate}`);
  let configData = readConfig();

  let signature = createTppSignature(
    certificate,
    {
      'Digest': digest,
      'X-Request-ID': request_id,
      'PSU-ID': psuId,
    },
    {},
    'sha256'
  );
  // console.log(` signature ${signature}`);

  const CONSENT_API = `https://${configData['Api-Enviorment']}/${configData['Api-Type']}`; // dev;

  let qwack = await readQwack();
  console.log(`Calling CONSENT_API ${CONSENT_API}/v1/Consents/approve`);
  let result;

  try {
    result = await utils.manageRequestResponse(
      new URL(`${CONSENT_API}/v1/Consents/approve`),
      {
        'X-SSL-SUBJECT-DN':
          'businessCategory=Business Entity,serialNumber=990098,OU=RevokedFintech_u1,organizationIdentifier=NTR-IL:1234567890,O=RevokedFintech,L=IL,C=IL',
        'Signature': signature,
        'Digest': digest,
        'TPP-Signature-Certificate': encodeURI(certificate),
        'CONSENT-ID': consentId,
      },
      'POST',
      JSON.stringify(body),
      qwack
    );
  } catch (error) {
    return { message: error.message, status: 'FAILED' };
  }

  console.log(`result ${JSON.stringify(result)}`);
  result.codeVerifier = codeVerifier;
  return result;
}
