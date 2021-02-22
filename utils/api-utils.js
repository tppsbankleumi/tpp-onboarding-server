const http = require('http');
const https = require('https');

module.exports = {
  manageRequestResponse: function manageRequestResponse(
    url,
    headers,
    method,
    data,
    certInfo
  ) {
    const client = this.resolveClient(url);
    const options = this.createOptions(url, headers, method);
    if (certInfo) {
      options.cert = certInfo.cert;
      options.ca = certInfo.ca;
      options.key = certInfo.key;
      options.passphrase = 'password';
      options.rejectUnauthorized = false;
    }

    return new Promise((resolve, reject) => {
      const req = client.request(options, res => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(
            new Error(
              `statusCode: ${res.statusCode}, options are: ${JSON.stringify(
                options
              )}`
            )
          );
        }
        var body = [];
        res.on('data', function (chunk) {
          body.push(chunk);
        });
        res.on('end', function () {
          try {
            body = Buffer.concat(body).toString()
              ? JSON.parse(Buffer.concat(body).toString())
              : {};
            if (res.statusCode < 200 || res.statusCode >= 300) {
              console.log(`EEROR FAILED REQUEST ${JSON.stringify(url.href)}`);
              resolve(
                lambdify(res.statusCode, {
                  options: options,
                  headers: headers,
                  data: data,
                  responseBody: body,
                  message: Array.isArray(body.tppMessages)
                    ? body.tppMessages[0].code
                    : body.tppMessages,
                })
              );
            }
          } catch (e) {
            reject(e);
          }
          resolve(lambdify(res.statusCode, body));
        });
      });
      req.on('error', e => {
        reject(e.message);
      });
      // send the request
      if (data !== undefined) {
        req.write(data);
      }
      req.end();
    });
  },

  createOptions: function createOptions(url, headers, method) {
    return (options = {
      host: url.hostname,
      path: url.pathname + url.search,
      port: url.port,
      method: method == undefined ? 'GET' : method,
      headers: headers == undefined ? {} : headers,
    });
  },

  resolveClient: function resolveClient(url) {
    return url.protocol.startsWith('https') ? https : http;
  },

  extractValue: function extractValue(source, key) {
    let part = source.filter(t => {
      let innerParts = t.split('=');
      return innerParts[0] == key;
    })[0];
    let value = part.split('=')[1];
    return value;
  },
};

function lambdify(statusCode, body) {
  return {
    status: statusCode,
    isBase64Encoded: false,
    headers: {},
    body: JSON.stringify(body),
  };
}
