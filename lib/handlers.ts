/*
 * Handlers
 *
 * */

import * as usersHandler from './handlers/users';
import * as tokensHandler from './handlers/tokens';
import * as checksHandler from './handlers/checks';

/* Types*/
import type { DataType, CallbackType, UserType, TokenType } from '../index.d';

export function notFound(callback: CallbackType<UserType>): void {
  callback(404);
}

/* Users */
export function users(data: DataType<UserType>, cb: CallbackType<UserType>): void {
  let { method } = data;
  method = (method && method.toLowerCase()) || '';

  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (!acceptableMethods.includes(method)) {
    cb(405);
    return;
  }

  switch (method) {
    case 'post':
      usersHandler.post<UserType>(data, (statusCode, response): void => {
        console.log('users->args', statusCode, response);
        cb(statusCode, response);
      });
      break;
    case 'get':
      usersHandler.get<UserType>(data, (statusCode, response): void => {
        console.log('users->args', statusCode, response);
        cb(statusCode, response);
      });

      break;
    case 'put':
      usersHandler.put<UserType>(data, (statusCode, response): void => {
        console.log('users->args', statusCode, response);
        cb(statusCode, response);
      });
      break;
    case 'delete':
      usersHandler.eliminate<UserType>(data, (statusCode, response): void => {
        console.log('users->args', statusCode, response);
        cb(statusCode, response);
      });

      break;
    default:
  }
}
/* End Users */

/* Tokens */
export function tokens(data: DataType<TokenType>, cb: CallbackType<TokenType>): void {
  let { method } = data;
  method = (method && method.toLowerCase()) || '';

  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (!acceptableMethods.includes(method)) {
    cb(405);
    return;
  }

  switch (method) {
    case 'post':
      tokensHandler.post(data, (statusCode, response): void => {
        console.log('tokens->args', statusCode, response);
        cb(statusCode, response);
      });
      break;
    case 'get':
      tokensHandler.get<TokenType>(data, (statusCode, response): void => {
        console.log('tokens->args', statusCode, response);
        cb(statusCode, response);
      });

      break;
    case 'put':
      tokensHandler.put<TokenType>(data, (statusCode, response): void => {
        console.log('tokens->args', statusCode, response);
        cb(statusCode, response);
      });
      break;
    case 'delete':
      tokensHandler.eliminate<TokenType>(data, (statusCode, response): void => {
        console.log('tokens->args', statusCode, response);
        cb(statusCode, response);
      });

      break;
    default:
  }
}
/* End Tokens */

/* Checks */
export function checks(data, cb): void {
  let { method } = data;
  method = method.toLowerCase();

  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (!acceptableMethods.includes(method)) {
    cb(405);
    return;
  }

  checksHandler[method](data, (statusCode, response): void => {
    console.log('checks->args', statusCode, response);
    cb(statusCode, response);
  });
}
/* End checks */
