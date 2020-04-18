/*
 * checks handler
 *
 */

/* Dependencies*/
import * as storeData from '../data';
import * as helpers from '../helpers';
import config from '../../config';
import { verifyToken } from './tokens';

/* Types*/
import type { DataType, CallbackType, UserType, CheckType, TokenType } from '../../index.d';

export function post(data: DataType<CheckType>, cb: CallbackType<CheckType>): void {
  const {
    payload: {
      protocol: pProtocol,
      url: pUrl,
      method: pMethod,
      timeoutSeconds: pTimeoutSeconds,
      successCode: pSuccessCode,
    },
    headers: { token: pToken },
  } = data || { payload: {} };

  let token;
  if (typeof pToken === 'string' && pToken.length === 20) {
    token = pToken;
  }

  if (token) {
    storeData.read<TokenType>('tokens', token, (readTokenErr, readTokenData) => {
      if (readTokenErr || typeof readTokenData === 'string') {
        cb(500, {
          error: "The token doesn't exist",
          errorMessage: { err: readTokenErr, readData: readTokenData },
        });
        return;
      }
      const protocol =
        (typeof pProtocol === 'string' && ['http', 'https'].includes(pProtocol) && pProtocol) || false;
      const url = (typeof pUrl === 'string' && pUrl.trim().length && pUrl) || false;
      const method =
        (typeof pMethod === 'string' && ['get', 'post', 'put', 'delete'].includes(pMethod) && pMethod) ||
        false;
      const timeoutSeconds =
        (typeof pTimeoutSeconds === 'number' &&
          pTimeoutSeconds > 0 &&
          pTimeoutSeconds <= 5 &&
          pTimeoutSeconds) ||
        false;
      const successCode =
        (typeof pSuccessCode === 'object' &&
          Array.isArray(pSuccessCode) &&
          pSuccessCode.length > 0 &&
          pSuccessCode) ||
        false;
      if (protocol && url && method && timeoutSeconds && successCode) {
        const { phone } = readTokenData || {};
        if (typeof phone === 'string') {
          storeData.read<UserType>('users', phone, (readUserErr, readUserData) => {
            if (readUserErr || typeof readUserData === 'string') {
              cb(500, { error: 'There was an error reading the users data' });
              return;
            }

            const checks =
              (typeof readUserData.checks === 'object' &&
                Array.isArray(readUserData.checks) &&
                readUserData.checks) ||
              [];
            if (checks.length < config.maxChecks) {
              const checkId = helpers.createRandomString(20);

              if (typeof checkId === 'boolean') {
                cb(500, { error: 'There was an error generating the checkId' });
                return;
              }

              const checkData = {
                id: checkId,
                timeoutSeconds,
                successCode,
                url,
                method,
                phone: readUserData.phone,
                protocol,
              };

              storeData.create<CheckType>('checks', checkId, checkData, (createCheckErr) => {
                if (createCheckErr) {
                  cb(500, { error: 'There was an error creating the check' });
                  return;
                }
                checks.push(checkId);
                const userDataUpdate = { ...readUserData, checks };

                storeData.update<UserType>('users', phone, userDataUpdate, (updateUserErr) => {
                  if (updateUserErr) {
                    cb(500, { error: 'There was an error updating the user' });
                    return;
                  }
                  cb(200, checkData);
                });
              });
            } else {
              cb(400);
            }
          });
        } else {
          cb(500, { error: 'There was an error reading a value from users' });
        }
      } else {
        cb(400, { error: 'Missing required fields' });
      }
    });
  } else {
    cb(400, { error: 'Missing required token or invalid token' });
  }
}

export function get<T>(data: DataType<CheckType>, cb: CallbackType<T>): void {
  const {
    query: { id },
    headers: { token },
  } = data || { payload: {} };
  const checkId = typeof id === 'string' && id.length === 20 && id;
  const myToken = typeof token === 'string' && token.length === 20 && token;
  if (checkId) {
    if (myToken) {
      storeData.read<CheckType>('checks', checkId, (readCheckErr, readCheckData) => {
        if (readCheckErr || typeof readCheckData === 'string') {
          cb(500, {
            error: "The check doesn't exists",
            errorMessage: { err: readCheckErr, readData: readCheckData },
          });
          return;
        }
        const { phone: phoneCheck } = readCheckData || {};
        if (phoneCheck) {
          verifyToken(myToken, phoneCheck, (verifyTokenErr, verifyTokenData) => {
            if (typeof verifyTokenErr === 'number' && verifyTokenData && verifyTokenData.error) {
              cb(500, { error: verifyTokenData.error });
              return;
            }
            if (!verifyTokenErr) {
              cb(403, { error: 'token is invalid' });
            } else {
              cb(200, readCheckData as T);
            }
          });
        } else {
          cb(500, { error: 'There was an error reading a value from checks' });
        }
      });
    } else {
      cb(400, { error: 'Missing required token or invalid token' });
    }
  } else {
    cb(400, { error: 'Missing id required param' });
  }
}

export function put<T>(data: DataType<CheckType>, cb: CallbackType<T>): void {
  const {
    payload: {
      id: pId,
      protocol: pProtocol,
      url: pUrl,
      method: pMethod,
      timeoutSeconds: pTimeoutSeconds,
      successCode: pSuccessCode,
    },
    headers: { token: pToken },
  } = data || { payload: {} };

  const id = typeof pId === 'string' && pId.length === 20 && pId;
  const token = typeof pToken === 'string' && pToken.length === 20 && pToken;

  if (id) {
    if (token) {
      storeData.read<CheckType>('checks', id, (readCheckErr, readCheckData) => {
        if (readCheckErr || typeof readCheckData === 'string') {
          cb(500, {
            error: "The check doesn't exists",
            errorMessage: { err: readCheckErr, readData: readCheckData },
          });
          return;
        }

        if (readCheckData.phone) {
          verifyToken(token, readCheckData.phone, (verifyTokenErr, verifyTokenData) => {
            if (typeof verifyTokenErr === 'number' && verifyTokenData && verifyTokenData.error) {
              cb(500, { error: verifyTokenData.error });
              return;
            }
            if (!verifyTokenErr) {
              cb(403, { error: 'token is invalid' });
            } else {
              const protocol =
                (typeof pProtocol === 'string' && ['http', 'https'].includes(pProtocol) && pProtocol) ||
                false;
              const url = (typeof pUrl === 'string' && pUrl.trim().length && pUrl) || false;
              const method =
                (typeof pMethod === 'string' &&
                  ['get', 'post', 'put', 'delete'].includes(pMethod) &&
                  pMethod) ||
                false;
              const timeoutSeconds =
                (typeof pTimeoutSeconds === 'number' &&
                  pTimeoutSeconds > 0 &&
                  pTimeoutSeconds <= 5 &&
                  pTimeoutSeconds) ||
                false;
              const successCode =
                (typeof pSuccessCode === 'object' &&
                  Array.isArray(pSuccessCode) &&
                  pSuccessCode.length > 0 &&
                  pSuccessCode) ||
                false;
              const updatedCheckData = { ...readCheckData };
              if (protocol || url || method || timeoutSeconds || successCode) {
                if (protocol) updatedCheckData.protocol = protocol;
                if (url) updatedCheckData.url = url;
                if (method) updatedCheckData.method = method;
                if (timeoutSeconds) updatedCheckData.timeoutSeconds = timeoutSeconds;
                if (successCode) updatedCheckData.successCode = successCode;
                storeData.update('checks', id, updatedCheckData, (updateCheckErr) => {
                  if (updateCheckErr) {
                    cb(500, { error: 'There was an error updating the check' });
                    return;
                  }
                  cb(200);
                });
              } else {
                cb(400, { error: 'Missing fields to update' });
              }
            }
          });
        } else {
          cb(500, { error: 'There was an error reading the users' });
        }
      });
    } else {
      cb(400, { error: 'Missing required token or invalid token' });
    }
  } else {
    cb(400, { error: 'Invalid Check' });
  }
}

export function eliminate<T>(data: DataType<CheckType>, cb: CallbackType<T>): void {
  const {
    payload: { id: pId },
    headers: { token: pToken },
  } = data || { payload: {} };

  const id = typeof pId === 'string' && pId.length === 20 && pId;
  const token = typeof pToken === 'string' && pToken.length === 20 && pToken;

  if (id) {
    if (token) {
      storeData.read<CheckType>('checks', id, (readCheckErr, readCheckData) => {
        if (readCheckErr || typeof readCheckData === 'string') {
          cb(500, {
            error: "The check doesn't exists",
            errorMessage: { err: readCheckErr, readData: readCheckData },
          });
          return;
        }
        if (typeof readCheckData.phone === 'string') {
          const phone = readCheckData.phone;
          verifyToken(token, phone, (verifyTokenErr, verifyTokenData) => {
            if (typeof verifyTokenErr === 'number' && verifyTokenData && verifyTokenData.error) {
              cb(500, { error: verifyTokenData.error });
              return;
            }
            if (!verifyTokenErr) {
              cb(403, { error: 'token is invalid' });
            } else {
              storeData.read<UserType>('users', phone, (readUserErr, readUserData) => {
                if (readUserErr || typeof readUserData === 'string') {
                  cb(500, {
                    error: 'There was an error reading the user data',
                    errorMessage: { err: readUserErr, readData: readUserData },
                  });
                  return;
                }
                const { checks = [] } = readUserData as UserType;
                if (checks.includes(id)) {
                  const userUpdated = {
                    ...readUserData,
                    checks: checks.filter((c) => c !== id),
                  };
                  storeData.update<UserType>('users', phone, userUpdated, (updateUserErr) => {
                    if (updateUserErr) {
                      cb(500, { error: 'There was an error updating the user' });
                      return;
                    }
                    storeData.eliminate('checks', id, (eliminateCheckErr) => {
                      if (eliminateCheckErr) {
                        cb(500, { error: 'There was an error deleting the check' });
                      } else {
                        cb(200);
                      }
                    });
                  });
                } else {
                  cb(500, { error: "Couldn't find the check on the users's checks" });
                }
              });
            }
          });
        } else {
          cb(500, { error: 'There was an error reading the users' });
        }
      });
    } else {
      cb(400, { error: 'Missing required token or invalid token' });
    }
  } else {
    cb(400, { error: 'Invalid check' });
  }
}
