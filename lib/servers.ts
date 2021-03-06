/*
 *
 * Servers tasks
 *
 * */

import http from 'http';
import https from 'https';
import url from 'url';
import { StringDecoder } from 'string_decoder';
import fs from 'fs';
import path from 'path';

/*
 *Types
 *
 * */
import type { IncomingMessage, ServerResponse } from 'http';
import type { DataType, UserType, TokenType } from '../index.d';

import config from '../config';
import * as helpers from './helpers';
import * as handlers from './handlers';

function setupServer(req: IncomingMessage, res: ServerResponse): void {
  const { method, url: urlReq, headers } = req;
  const parseUrl = url.parse(urlReq || '', true);

  const { pathname: path, query: queryStringObject } = parseUrl;
  const trimmedPath = (path && path.replace(/^\/+|\/+$/g, '')) || '';
  const decoder = new StringDecoder('utf-8');
  let buffer = '';

  req.on('data', (data) => {
    buffer += decoder.write(data);
  });

  req.on('end', () => {
    buffer += decoder.end();

    const data: DataType<UserType | TokenType> = {
      headers,
      trimmedPath,
      method,
      payload: helpers.parseJsonToObject(buffer),
      query: queryStringObject,
    };

    switch (trimmedPath) {
      case 'users':
        handlers.users(data, (statusCode, response) => {
          res.setHeader('Content-Type', 'application/json');
          res.writeHead(statusCode);
          res.end(JSON.stringify(response || {}));

          console.log('method:', method);
          console.log('query', queryStringObject);
          console.log('payload', buffer);
          console.log('statusCode', statusCode);
          console.log('response', response);
        });
        break;
      case 'checks':
        handlers.checks(data, (statusCode, response) => {
          res.setHeader('Content-Type', 'application/json');
          res.writeHead(statusCode);
          res.end(JSON.stringify(response || {}));

          console.log('method:', method);
          console.log('query', queryStringObject);
          console.log('payload', buffer);
          console.log('statusCode', statusCode);
          console.log('response', response);
        });

        break;
      case 'tokens':
        handlers.tokens(data, (statusCode, response) => {
          res.setHeader('Content-Type', 'application/json');
          res.writeHead(statusCode);
          res.end(JSON.stringify(response || {}));

          console.log('method:', method);
          console.log('query', queryStringObject);
          console.log('payload', buffer);
          console.log('statusCode', statusCode);
          console.log('response', response);
        });
        break;
      default:
        handlers.notFound((statusCode, response) => {
          res.setHeader('Content-Type', 'application/json');
          res.writeHead(statusCode);
          res.end(JSON.stringify(response || {}));

          console.log('method:', method);
          console.log('query', queryStringObject);
          console.log('payload', buffer);
          console.log('statusCode', statusCode);
          console.log('response', response);
        });
    }
  });
}

const httpServer = http.createServer((req, res) => {
  setupServer(req, res);
});

const httpsServerOptions = {
  key: fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '/../https/cert.pem')),
};

const httpsServer = https.createServer(httpsServerOptions, (req, res) => {
  setupServer(req, res);
});

export default function init(): void {
  httpServer.listen(config.httpPort, () => {
    console.log(
      '\x1b[36m%s\x1b[0m',
      `The server is listening on port ${config.httpPort} in ${config.env} mode`
    );
  });
  httpsServer.listen(config.httpsPort, () => {
    console.log(
      '\x1b[35m%s\x1b[0m',
      `The server is listening on port ${config.httpsPort} in ${config.env} mode`
    );
  });
}
