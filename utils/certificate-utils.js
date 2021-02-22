const forge = require('node-forge');
const crypto = require('crypto');
const { EOL } = require('os');

function createTppSignature(
  tppCertificate,
  mandatoryHeaders,
  optionalHeaders,
  hashAlgorithm
) {
  const cert = parseCertificate(tppCertificate);
  let serialNumber = cert.serialNumber;
  console.log(`parsed cert serialNumber ${JSON.stringify(serialNumber)}`);
  let caOrgName = cert.issuer.attributes.filter(
    att => att.name === 'organizationName'
  )[0].value;

  console.log(`parsed cert caOrgName ${JSON.stringify(caOrgName)}`);

  let signHeaders =
    buildKeysPresentation(mandatoryHeaders) +
    (hasData(optionalHeaders)
      ? ' ' + buildKeysPresentation(optionalHeaders)
      : '');
  let keyId = `SN=${serialNumber},CA=${caOrgName}`;

  console.log(`parsed cert keyId ${JSON.stringify(keyId)}`);

  hashAlgorithm = hashAlgorithm || 'sha256';
  console.log(`parsed cert hashAlgorithm ${JSON.stringify(hashAlgorithm)}`);
  console.log(
    `parsed cert mandatoryHeaders ${JSON.stringify(mandatoryHeaders)}`
  );

  let signingString =
    buildHeadersPresentation(mandatoryHeaders) +
    (hasData(optionalHeaders)
      ? EOL + buildHeadersPresentation(optionalHeaders)
      : '');
  console.log(`parsed cert signingString ${JSON.stringify(signingString)}`);

  let signatureField = crypto
    .createHash(hashAlgorithm)
    .update(JSON.stringify(signingString))
    .digest('base64');
  let signature = `keyId=${keyId},algorithm=rsa-${hashAlgorithm},headers=${signHeaders},signature=${signatureField}`;
  console.log(signature);
  return signature;
}

function buildKeysPresentation(headers) {
  return Object.keys(headers).join(' ');
}

function buildHeadersPresentation(headers) {
  return Object.entries(headers)
    .map(x => `${x.key}: ${x.value}`)
    .join(EOL);
}

function hasData(headers) {
  return (
    headers !== undefined &&
    Object.entries(headers).filter(t => t.value !== undefined && t.value !== '')
      .length > 0
  );
}

exports.createTppSignature = createTppSignature;

function parseCertificate(tppCertificate) {
  const certPrefix = '-----BEGIN CERTIFICATE-----';
  let certStart = certPrefix;
  if (tppCertificate.startsWith(certPrefix)) {
    certStart = '';
  }
  const certPostfix = '-----END CERTIFICATE-----';
  let certEnd = certPostfix;
  if (tppCertificate.endsWith(certPostfix)) {
    certEnd = '';
  }
  const cert = forge.pki.certificateFromPem(
    `${certStart}${tppCertificate}${certEnd}`
  );
  return cert;
}

function createTppDigest(body, hashAlgorithm) {
  let hashAlgorithmOutputRepresentation =
    hashAlgorithm === 'sha256' ? 'SHA-256' : 'SHA-512';
  if (!body) {
    body = [];
  }
  let digest = crypto
    .createHash(hashAlgorithm)
    .update(JSON.stringify(body))
    .digest('base64');
  return `${hashAlgorithmOutputRepresentation}=${digest}`;
}
exports.createTppDigest = createTppDigest;

function getTppId(headers) {
  let key = 'X-SSL-SUBJECT-DN';
  let subjectDN = headers.getValueCaseInsensitive(key);
  let subjectDNParts = subjectDN.split(',');
  console.log(`subjectDNParts ${JSON.stringify(subjectDNParts)}`);
  let parsing = subjectDNParts
    .map(subject => {
      let parsedSub = subject.split('=');
      return { att: parsedSub[0], value: parsedSub[1] };
    })
    .filter(sub => sub.att === 'organizationIdentifier')[0];

  return parsing.value.replace(':', '');
}
exports.getTppId = getTppId;
