/*
 * Tokens handler
 *
 */

/* Dependencies*/
import * as storeData from '../data';
import * as helpers from '../helpers';

/* Types*/
import type { TokenType, CallbackType, DataType, UserType } from '../../index.d';

export function post(data: DataType<UserType>, cb: CallbackType<TokenType>): void {
  const {
    payload: { phone, password },
  } = data || { payload: {} };

  if (typeof phone !== 'string') {
    cb(400, { error: 'Invalid phone type' });
    return;
  }
  if (phone.trim().length !== 10) {
    cb(400, { error: 'Invalid phone value' });
    return;
  }
  if (typeof password !== 'string') {
    cb(400, { error: 'Invalid password type' });
    return;
  }
  if (!phone.trim().length) {
    cb(400, { error: 'Invalid password value' });
    return;
  }

  if (phone && password) {
    storeData.read<UserType>('users', phone, (err, fetchedData) => {
      if (err || typeof fetchedData === 'string') {
        cb(400, { error: 'Could not find the specified user' });
        return;
      }
      const { password: fetchedPassword = '' } = fetchedData as UserType;
      if (helpers.hash(password) !== fetchedPassword) {
        cb(400, { error: "Password did not match the user's specified password" });
        return;
      }

      const tokenId = helpers.createRandomString(20);
      if (typeof tokenId === 'boolean') {
        cb(500, { error: 'There was an error generating the token' });
        return;
      }
      const expires = Date.now() + 1000 * 60 * 60;
      const tokenData = {
        phone,
        id: tokenId as string,
        expires,
      };

      storeData.create<TokenType>('tokens', tokenId as string, tokenData, (createErr) => {
        if (createErr) {
          cb(500, { error: "Couldn't create the new token" });
          return;
        }
        cb(200, tokenData);
      });
    });
  } else {
    cb(400, { error: 'Invalid values' });
  }
}

export function get<T>(data: DataType<TokenType>, cb: CallbackType<T>): void {
  const {
    query: { id },
  } = data || { query: {} };
  if (typeof id === 'string' && id.length === 20) {
    storeData.read<T>('tokens', id, (err, readData) => {
      if (err) {
        cb(404, { error: "The token doesn't exists", errorMessage: { err, readData } });
        return;
      }
      cb(200, readData as T);
    });
  } else {
    cb(400, { error: 'Invalid id number' });
  }
}

export function put<T>(data: DataType<TokenType>, cb: CallbackType<T>): void {
  const {
    payload: { id, extend },
  } = data || { payload: {} };

  const tokenPayload: TokenType = {};

  if (typeof id === 'string' && id.trim().length) {
    tokenPayload.id = id;
  } else {
    cb(400, { error: 'Invalid fields' });
    return;
  }

  if (typeof extend === 'boolean' && extend) {
    tokenPayload.extend = extend;
  } else {
    cb(400, { error: 'Invalid fields' });
    return;
  }

  storeData.read<T>('tokens', id, (err, tokenData) => {
    if (err || typeof tokenData === 'string') {
      cb(400, { error: 'Specified token does not exits' });
      return;
    }

    const td: TokenType = { ...tokenData };
    const { expires } = td || {};

    if (typeof expires === 'number') {
      if (Date.now() > expires) {
        cb(400, { error: 'The token has already expires' });
        return;
      }
      const newTokenData = {
        ...tokenData,
        expires: Date.now() + 1000 * 60 * 60,
      };
      storeData.update<TokenType>('tokens', id, newTokenData, (updateErr) => {
        if (updateErr) {
          cb(500, { error: "Couldn't update the token's expiration" });
          return;
        }
        cb(200);
      });
    } else {
      cb(500, { error: 'There was an error reading a value from tokens' });
    }
  });
}

export function eliminate<T>(data: DataType<TokenType>, cb: CallbackType<T>): void {
  const {
    payload: { id },
  } = data || { payload: {} };
  if (typeof id === 'string' && id.length === 20) {
    storeData.read<T>('tokens', id, (err) => {
      if (err) {
        cb(400, { error: "The token doesn't exist" });
      } else {
        storeData.eliminate('tokens', id, (eliminateErr) => {
          if (eliminateErr) {
            cb(500, { error: 'Error deleting the token' });
            return;
          }
          cb(200);
        });
      }
    });
  } else {
    cb(400, { error: 'Invalid token value' });
  }
}

export function verifyToken(
  id: string,
  phone: string,
  cb: (value: number | boolean, err?: { error: string }) => void
): void {
  storeData.read<TokenType>('tokens', id, (err, tokenData) => {
    console.log(phone, id, tokenData, err);
    if (err) {
      cb(500, { error: 'There was an error reading the token data' });
      return;
    }
    if (typeof tokenData !== 'string') {
      if (
        tokenData.phone === phone &&
        typeof tokenData.expires === 'number' &&
        tokenData.expires > Date.now()
      ) {
        cb(true);
      } else {
        cb(false);
      }
    }
  });
}
