process.env['NODE_CONFIG_DIR'] = __dirname + '/../config';

const config = require('config');
const utils = require('../../../common/utils');

function patchHeaders(section, token, headers) {
  let sectionHeaders = getCopy(section, 'Request.headers');
  let allHeaders = headers ? { ...headers, ...sectionHeaders } : sectionHeaders;
  if (allHeaders['Authorization'] !== undefined && token !== undefined) {
    allHeaders['Authorization'] = allHeaders['Authorization'].replace(
      '${token}',
      token
    );
  }
  return allHeaders;
}
exports.patchHeaders = patchHeaders;

async function sendRequest(
  section,
  headers,
  method,
  patchData,
  data,
  certInfo
) {
  let href = getValue(section, 'Request.href');
  if (patchData !== undefined) {
    href = patchHref(href, patchData);
  }
  var URL = require('url').URL;
  const url = new URL(href);
  return utils.manageRequestResponse(url, headers, method, data, certInfo);
}
exports.sendRequest = sendRequest;

function patchResourceId(href, resourceId) {
  return patchHref(href, { resourceId: resourceId });
}
exports.patchResourceId = patchResourceId;

function patchCredentials(href, credentials) {
  if (
    credentials !== undefined &&
    credentials.user !== undefined &&
    credentials.secret !== undefined
  ) {
    return patchHref(href, credentials);
  }
  return href;
}
exports.patchCredentials = patchCredentials;

function patchHref(href, values) {
  Object.keys(values).forEach(key => {
    href = href.replace('${' + key + '}', values[key]);
  });
  return href;
}
exports.patchHref = patchHref;

function getValue(section, key) {
  const value = `${section === undefined ? '' : `${section}.`}${key}`;
  return config.has(value) ? config.get(value) : undefined;
}
exports.getValue = getValue;

function getCopy(section, key) {
  let source = getValue(section, key);
  return clone(source);
}
exports.getCopy = getCopy;

function clone(source) {
  return Object.assign({}, source);
}

async function evalResponseData(data) {
  if (data.body && data.body.accounts && data.body.accounts.length > 0) {
    let link = getCopy('Sandbox-Accounts', 'Request');
    data.body.accounts.map(account => {
      if (account['_links']) {
        account['_links']['balances']['href'] = account['_links']['balances'][
          'href'
        ].replace('$computed', link.href);
      }
    });
  }
}
exports.evalResponseData = evalResponseData;

async function evalResponseDataTransactions(data) {
  if (data.body.transactions && data.body.transactions['_links']) {
    let link = getCopy('Sandbox-Accounts', 'Request');

    data.body.transactions['_links']['account'][
      'href'
    ] = data.body.transactions['_links']['account']['href'].replace(
      '$computed',
      link.href
    );
  }
}
exports.evalResponseDataTransactions = evalResponseDataTransactions;
