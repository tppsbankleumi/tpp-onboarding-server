function lambdify(statusCode, body) {
  return {
    statusCode: statusCode,
    isBase64Encoded: false,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'OPTIONS, GET, POST',
    },
    body: JSON.stringify(body),
  };
}
exports.lambdify = lambdify;
