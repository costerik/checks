/*
 * Handlers
 *
 * */

const usersHandler = require('./handlers/users');
const tokensHandler = require('./handlers/tokens');
const checksHandler = require('./handlers/checks');

function notFound(data, callback) {
  callback(404, {});
}

function ping(data, callback) {
  callback(200);
}

function hello(data, callback) {
  callback(200, { message: 'hey buddy...' });
}

/* Users */
function users(data, cb) {
  let { method } = data;
  method = method.toLowerCase();

  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (!acceptableMethods.includes(method)) {
    cb(405);
    return;
  }

  usersHandler[method](data, (statusCode, response) => {
    console.log('users->args', statusCode, response);
    cb(statusCode, response);
  });
}
/* End Users */

/* Tokens */
function tokens(data, cb) {
  let { method } = data;
  method = method.toLowerCase();

  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (!acceptableMethods.includes(method)) {
    cb(405);
    return;
  }

  tokensHandler[method](data, (statusCode, response) => {
    console.log('tokens->args', statusCode, response);
    cb(statusCode, response);
  });
}
/* End Tokens */

/* Checks */
function checks(data, cb) {
  let { method } = data;
  method = method.toLowerCase();

  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (!acceptableMethods.includes(method)) {
    cb(405);
    return;
  }

  checksHandler[method](data, (statusCode, response) => {
    console.log('checks->args', statusCode, response);
    cb(statusCode, response);
  });
}
/* End checks */

const handlers = {
  ping,
  hello,
  notFound,
  users,
  tokens,
  checks,
};
module.exports = handlers;
