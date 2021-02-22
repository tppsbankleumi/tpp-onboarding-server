const express = require('express');
var cors = require('cors');
const app = express();
app.use(cors());
const port = 3000;
const { createConsent, approveConsent } = require('./api/consentApi');
const { createToken } = require('./api/tokenApi');
const { getAccounts } = require('./api/accountsApi');
const { getBalances } = require('./api/balancesApi');
const { createConsentDiscovery } = require('./api/consentDiscoveryApi');
const { getTransactions } = require('./api/transactionsApi');
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// 1
app.get('/consents/:psuId', async (req, res) => {
  let psuid = req.params.psuId;
  let consent = await createConsent(psuid);
  res.setHeader('Content-Type', 'application/json');
  res.send(consent.body);
});

// 2
app.post('/approve', async (req, res) => {
  const { psuId, consentId, tppId } = req.body;
  const approveResponse = await approveConsent(psuId, consentId, tppId);
  res.send(approveResponse);
});

// 3
app.get('/consents/discovery/:psuId', async (req, res) => {
  let psuid = req.params.psuId;
  const approveResponse = await createConsentDiscovery(psuid);
  res.send(approveResponse);
});

// 4
app.get('/token/:verifier/:code/:clientId', async (req, res) => {
  let verifier = req.params.verifier;
  let code = req.params.code;
  let clientId = req.params.clientId;
  console.log(`verifier ${verifier} clientId ${clientId} code ${code} `);
  let token = await createToken(clientId, code, verifier);
  res.setHeader('Content-Type', 'application/json');
  res.send(token.body);
});

// 5
app.get('/accounts/:token/:consentId', async (req, res) => {
  let token = req.params.token;
  let consentId = req.params.consentId;
  // console.log(`TOKEN ${token} CONSENTID ${consentId}  `);
  let accounts = await getAccounts(consentId, token);
  res.setHeader('Content-Type', 'application/json');
  res.send(accounts.body);
});

// 6
app.get('/balances/:token/:consentId', async (req, res) => {
  let token = req.params.token;
  let consentId = req.params.consentId;
  console.log(`TOKEN ${token} CONSENTID ${consentId}  `);
  let balances = await getBalances(consentId, token);
  res.setHeader('Content-Type', 'application/json');
  res.send(balances.body);
});

// 7
app.get('/transacrtions/:token/:consentId/:resourceId', async (req, res) => {
  let token = req.params.token;
  let consentId = req.params.consentId;
  let resourceId = req.params.resourceId;
  console.log(
    `TOKEN ${token} CONSENTID ${consentId}  RESOURCE ID: ${resourceId}`
  );
  let transacrtions = await getTransactions(consentId, token, resourceId);
  res.setHeader('Content-Type', 'application/json');
  console.log(transacrtions);
  res.send(transacrtions.body);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
