/*
 * Primary file for the API
 *
 * */

// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const { StringDecoder } = require('string_decoder');
const fs = require('fs');

const config = require('./config');
const helpers = require('./lib/helpers');

const handlers = require('./lib/handlers');

function setupServer(req, res) {
  const { method, url: urlReq, headers } = req;
  const parseUrl = url.parse(urlReq, true);

  const { pathname: path, query: queryStringObject } = parseUrl;
  const trimmedPath = path.replace(/^\/+|\/+$/g, '');
  const decoder = new StringDecoder('utf-8');
  let buffer = '';

  req.on('data', (data) => {
    buffer += decoder.write(data);
  });

  req.on('end', () => {
    buffer += decoder.end();

    const data = {
      headers,
      trimmedPath,
      method,
      payload: helpers.parseJsonToObject(buffer),
      query: queryStringObject,
    };

    const handler = handlers[trimmedPath] || handlers.notFound;

    handler(data, (statusCode, response) => {
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(JSON.stringify(response || {}));

      console.log('method:', method);
      console.log('query', queryStringObject);
      console.log('payload', buffer);
      console.log('statusCode', statusCode);
      console.log('response', response);
    });
  });
}

const httpServer = http.createServer((req, res) => {
  setupServer(req, res);
});

httpServer.listen(config.httpPort, () => {
  console.log(`The server is listening on port ${config.httpPort} in ${config.env} mode`);
});

const httpsServerOptions = {
  key: fs.readFileSync('./https/key.pem'),
  cert: fs.readFileSync('./https/cert.pem'),
};

const httpsServer = https.createServer(httpsServerOptions, (req, res) => {
  setupServer(req, res);
});

httpsServer.listen(config.httpsPort, () => {
  console.log(`The server is listening on port ${config.httpsPort} in ${config.env} mode`);
});
