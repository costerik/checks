/*
 * Users handler
 *
 */

/* Dependencies*/
import * as storeData from '../data';
import * as helpers from '../helpers';
import { verifyToken } from './tokens';

/* Types*/
import type { DataType, CallbackType, UserType } from '../../index.d';

export function post<T>(data: DataType<UserType>, cb: CallbackType<T>): void {
  const {
    payload: { firstName, lastName, phone, password, tosAgreement },
  } = data || { payload: {} };

  const user: UserType = {};
  if (typeof firstName === 'string' && firstName.trim().length) {
    user.firstName = firstName;
  } else {
    cb(400, { error: 'missing required field: firstName' });
    return;
  }
  if (typeof lastName === 'string' && lastName.trim().length && lastName) {
    user.lastName = lastName;
  } else {
    cb(400, { error: 'missing required field: lastName' });
    return;
  }
  if (typeof phone === 'string' && phone.trim().length === 10) {
    user.phone = phone;
  } else {
    cb(400, { error: 'missing required field: phone' });
    return;
  }
  if (typeof password === 'string' && password.trim().length) {
    user.password = password;
  } else {
    cb(400, { error: 'missing required field: password' });
    return;
  }
  if (typeof tosAgreement === 'boolean') {
    user.tosAgreement = tosAgreement;
  } else {
    cb(400, { error: 'missing required field: tosAgreement' });
    return;
  }

  storeData.read<T>('users', user.phone, (err, readData) => {
    if (!err) {
      cb(400, {
        error: 'A user with that phone number already taken',
        errorMessage: { err, readData },
      });
      return;
    }
    user.tosAgreement = true;
    const hashedPassword = helpers.hash(password);
    if (typeof hashedPassword === 'boolean') {
      cb(500, { error: 'Error hashing the password' });
      return;
    }
    user.tosAgreement = true;
    user.password = hashedPassword;
    storeData.create<UserType>('users', phone, user, (createErr) => {
      if (createErr) {
        cb(500, {
          error: "couldn't create the new user",
          errorMessage: {
            err: createErr,
          },
        });
        return;
      }
      cb(200);
    });
  });
}

export function get<T>(data: DataType<UserType>, cb: CallbackType<T>): void {
  const {
    query: { phone },
    headers: { token },
  } = data || { query: {} };
  if (typeof phone === 'string' && phone.length === 10) {
    if (typeof token === 'string') {
      verifyToken(token, phone, (err, verifyData) => {
        if (typeof err === 'number' && verifyData) {
          cb(500, { error: verifyData.error });
          return;
        }
        if (!err) {
          cb(403, { error: 'token is invalid' });
        } else {
          storeData.read<T>('users', phone, (readErr, readData) => {
            if (readErr) {
              cb(404, {
                error: "The user doesn't exists",
                errorMessage: { err: readErr, readData },
              });
              return;
            }
            let newReadData: UserType = {};
            if (typeof readData !== 'string') {
              newReadData = { ...readData };
            }
            delete newReadData.password;
            cb(200, newReadData as T);
          });
        }
      });
    } else {
      cb(403, { error: 'Missing required token in header' });
    }
  } else {
    cb(400, { error: 'Missing required phone in params' });
  }
}

export function put<T>(data: DataType<UserType>, cb: CallbackType<T>): void {
  const {
    payload: { phone, firstName, lastName, tosAgreement, password },
    headers: { token },
  } = data || { payload: {} };
  const user: UserType = {};
  if (typeof firstName === 'string' && firstName.trim().length) {
    user.firstName = firstName;
  }
  if (typeof lastName === 'string' && lastName.trim().length && lastName) {
    user.lastName = lastName;
  }
  if (typeof phone === 'string' && phone.trim().length === 10) {
    user.phone = phone;
  }
  if (typeof password === 'string' && password.trim().length) {
    user.password = password;
  }
  if (typeof tosAgreement === 'boolean') {
    user.tosAgreement = tosAgreement;
  }

  if (user && user.phone) {
    if (user.firstName || user.lastName || user.tosAgreement || user.password) {
      if (typeof token === 'string') {
        verifyToken(token, user.phone, (err, verifyData) => {
          if (typeof err === 'number' && verifyData) {
            cb(500, { error: verifyData.error });
            return;
          }
          if (!err) {
            cb(403, { error: 'token is invalid' });
          } else {
            storeData.read<T>('users', (user && user.phone) || '', (errData, readData) => {
              if (errData) {
                cb(400, { error: "The user doesn't exist" });
                return;
              }
              let newReadData: UserType = {};
              if (typeof readData !== 'string') {
                newReadData = { ...readData };
              }

              if (user.firstName) newReadData.firstName = user.firstName;
              if (user.lastName) newReadData.lastName = user.lastName;
              if (user.tosAgreement) newReadData.tosAgreement = user.tosAgreement;
              if (user.password) newReadData.password = user.password;
              storeData.update('users', (user && user.phone) || '', newReadData, (updateErr) => {
                if (updateErr) {
                  cb(500, { error: 'Error updating the file' });
                  return;
                }
                cb(200);
              });
            });
          }
        });
      } else {
        cb(403, { error: 'Missing required token in header' });
      }
    } else {
      cb(400, { error: 'Missing fields to update' });
    }
  } else {
    cb(400, { error: 'Invalid phone number' });
  }
}

export function eliminate<T>(data: DataType<UserType>, cb: CallbackType<T>): void {
  const {
    payload: { phone },
    headers: { token },
  } = data || { payload: {} };

  if (typeof phone !== 'string') {
    cb(400, { error: 'Invalid phone type' });
    return;
  }
  if (phone.length !== 10) {
    cb(400, { error: 'Invalid phone value' });
    return;
  }
  if (typeof token === 'string') {
    verifyToken(token, phone, (err, verifyData) => {
      if (typeof err === 'number' && verifyData) {
        cb(500, { error: verifyData.error });
        return;
      }
      if (!err) {
        cb(403, { error: 'token is invalid' });
      } else {
        storeData.read<T>('users', phone, (readErr, readUser) => {
          if (readErr) {
            cb(400, { error: "The user doesn't exist" });
            return;
          }

          storeData.eliminate('users', phone, (eliminateErr) => {
            if (eliminateErr) {
              cb(500, { error: 'Error deleting the user' });
              return;
            }
            const { checks = [] } = readUser as UserType;
            let errors = false;
            let deleted = 0;
            checks.forEach((check) => {
              storeData.eliminate('checks', check, (eliminateCheckErr) => {
                if (eliminateCheckErr) {
                  errors = true;
                }
                deleted += 1;
                if (deleted === checks.length) {
                  if (errors) {
                    cb(500, { error: 'There was an error attempting to delete some checks' });
                  } else {
                    cb(200);
                  }
                }
              });
            });
          });
        });
      }
    });
  } else {
    cb(403, { error: 'Missing required token in header' });
  }
}
