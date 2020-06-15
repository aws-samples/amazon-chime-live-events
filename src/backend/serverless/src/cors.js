const {
    DOMAIN_NAME,
} = process.env;

const HEADER_ACAO = 'Access-Control-Allow-Origin';
const EXPECTED_ORIGIN = `https://${DOMAIN_NAME}`;

function addCORSHeaders(headers) {
  headers[HEADER_ACAO] = EXPECTED_ORIGIN;
}

function makeCORSHeaders() {
    return {
        [HEADER_ACAO]: EXPECTED_ORIGIN,
    };
}

function makeResponse(statusCode, body) {
    const headers = makeCORSHeaders();
    return {
        body,
        headers,
        statusCode,
    };
}

module.exports = {
  addCORSHeaders,
  makeCORSHeaders,
  makeResponse,
};