const crypto = require('crypto');

function createVerifier() {
  return base64URLEncode(crypto.randomBytes(32));
}
exports.createVerifier = createVerifier;

function createChallenge(verifier) {
  return base64URLEncode(sha256(verifier));
}
exports.createChallenge = createChallenge;

function base64URLEncode(str) {
  return str
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest();
}

function base64Encode(str) {
  Buffer.from(str).toString('base64');
}
