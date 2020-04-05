/*
 * checks handler
 *
 */

// Dependencies
const storeData = require('../data');
const helpers = require('../helpers');
const config = require('../../config');
const { verifyToken } = require('./tokens');

function post(data, cb) {
  const {
    payload: {
      protocol: pProtocol,
      url: pUrl,
      method: pMethod,
      timeoutSeconds: pTimeoutSeconds,
      successCode: pSuccessCode,
    } = {},
    headers: { token: pToken } = {},
  } = data || {};

  const token = (typeof pToken === 'string' && pToken.length === 20 && pToken) || false;

  if (token) {
    storeData.read('tokens', token, (readTokenErr, readTokenData) => {
      if (readTokenErr) {
        cb(500, {
          error: "The token doesn't exist",
          errorMessage: { err: readTokenErr, data: readTokenData },
        });
        return;
      }
      const protocol = (typeof pProtocol === 'string' && ['http', 'https'].includes(pProtocol) && pProtocol) || false;
      const url = (typeof pUrl === 'string' && pUrl.trim().length && pUrl) || false;
      const method = (typeof pMethod === 'string' && ['get', 'post', 'put', 'delete'].includes(pMethod) && pMethod)
        || false;
      const timeoutSeconds = (typeof pTimeoutSeconds === 'number'
          && pTimeoutSeconds > 0
          && pTimeoutSeconds <= 5
          && pTimeoutSeconds)
        || false;
      const successCode = (typeof pSuccessCode === 'object'
          && Array.isArray(pSuccessCode)
          && pSuccessCode.length > 0
          && pSuccessCode)
        || false;
      if (protocol && url && method && timeoutSeconds && successCode) {
        const { phone } = readTokenData || {};
        storeData.read('users', phone, (readUserErr, readUserData) => {
          if (readUserErr) {
            cb(500, { error: 'There was an error reading the users data' });
            return;
          }

          const checks = (typeof readUserData.checks === 'object'
              && Array.isArray(readUserData.checks)
              && readUserData.checks)
            || [];
          if (checks.length < config.maxChecks) {
            const checkId = helpers.createRandomString(20);
            const checkData = {
              id: checkId,
              timeoutSeconds,
              successCode,
              url,
              method,
              phone: readUserData.phone,
              protocol,
            };
            storeData.create('checks', checkId, checkData, (createCheckErr) => {
              if (createCheckErr) {
                cb(500, { error: 'There was an error creating the check' });
                return;
              }
              checks.push(checkId);
              const userDataUpdate = { ...readUserData, checks };

              storeData.update('users', phone, userDataUpdate, (updateUserErr) => {
                if (updateUserErr) {
                  cb(500, { error: 'There was an error updating the user' });
                  return;
                }
                cb(200, checkData);
              });
            });
          } else {
            cb('400');
          }
        });
      } else {
        cb(400, { error: 'Missing required fields' });
      }
    });
  } else {
    cb(400, { error: 'Missing required token or invalid token' });
  }
}

function get(data, cb) {
  const { query: { id } = {}, headers: { token } = {} } = data || {};
  const checkId = (typeof id === 'string' && id.length === 20 && id) || false;
  const myToken = (typeof token === 'string' && token.length === 20 && token) || false;
  if (checkId) {
    if (myToken) {
      storeData.read('checks', id, (readCheckErr, readCheckData) => {
        if (readCheckErr) {
          cb(500, {
            error: "The check doesn't exists",
            errorMessage: { err: readCheckErr, data: readCheckData },
          });
          return;
        }
        const { phone: phoneCheck } = readCheckData || {};
        verifyToken(token, phoneCheck, (verifyTokenErr, verifyTokenData) => {
          if (typeof verifyTokenErr === 'number' && verifyTokenData.error) {
            cb(500, { error: verifyTokenData.error });
            return;
          }
          if (!verifyTokenErr) {
            cb(403, { error: 'token is invalid' });
          } else {
            cb(200, readCheckData);
          }
        });
      });
    } else {
      cb(400, { error: 'Missing required token or invalid token' });
    }
  } else {
    cb(400, { error: 'Missing id required param' });
  }
}

function put(data, cb) {
  const {
    payload: {
      id: pId,
      protocol: pProtocol,
      url: pUrl,
      method: pMethod,
      timeoutSeconds: pTimeoutSeconds,
      successCode: pSuccessCode,
    } = {},
    headers: { token: pToken } = {},
  } = data || {};

  const id = (typeof pId === 'string' && pId.length === 20 && pId) || false;
  const token = (typeof pToken === 'string' && pToken.length === 20 && pToken) || false;

  if (id) {
    if (token) {
      storeData.read('checks', id, (readCheckErr, readCheckData) => {
        if (readCheckErr) {
          cb(500, {
            error: "The check doesn't exists",
            errorMessage: { err: readCheckErr, data: readCheckData },
          });
          return;
        }
        verifyToken(token, readCheckData.phone, (verifyTokenErr, verifyTokenData) => {
          if (typeof verifyTokenErr === 'number' && verifyTokenData.error) {
            cb(500, { error: verifyTokenData.error });
            return;
          }
          if (!verifyTokenErr) {
            cb(403, { error: 'token is invalid' });
          } else {
            const protocol = (typeof pProtocol === 'string' && ['http', 'https'].includes(pProtocol) && pProtocol) || false;
            const url = (typeof pUrl === 'string' && pUrl.trim().length && pUrl) || false;
            const method = (typeof pMethod === 'string'
                && ['get', 'post', 'put', 'delete'].includes(pMethod)
                && pMethod)
              || false;
            const timeoutSeconds = (typeof pTimeoutSeconds === 'number'
                && pTimeoutSeconds > 0
                && pTimeoutSeconds <= 5
                && pTimeoutSeconds)
              || false;
            const successCode = (typeof pSuccessCode === 'object'
                && Array.isArray(pSuccessCode)
                && pSuccessCode.length > 0
                && pSuccessCode)
              || false;
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
      });
    } else {
      cb(400, { error: 'Missing required token or invalid token' });
    }
  } else {
    cb(400, { error: 'Invalid Check' });
  }
}

function eliminate(data, cb) {
  const { payload: { id: pId } = {}, headers: { token: pToken } = {} } = data || {};

  const id = (typeof pId === 'string' && pId.length === 20 && pId) || false;
  const token = (typeof pToken === 'string' && pToken.length === 20 && pToken) || false;

  if (id) {
    if (token) {
      storeData.read('checks', id, (readCheckErr, readCheckData) => {
        if (readCheckErr) {
          cb(500, {
            error: "The check doesn't exists",
            errorMessage: { err: readCheckErr, data: readCheckData },
          });
          return;
        }
        verifyToken(token, readCheckData.phone, (verifyTokenErr, verifyTokenData) => {
          if (typeof verifyTokenErr === 'number' && verifyTokenData.error) {
            cb(500, { error: verifyTokenData.error });
            return;
          }
          if (!verifyTokenErr) {
            cb(403, { error: 'token is invalid' });
          } else {
            storeData.read('users', readCheckData.phone, (readUserErr, readUserData) => {
              if (readUserErr) {
                cb(500, {
                  error: 'There was an error reading the user data',
                  errorMessage: { err: readUserErr, data: readUserData },
                });
                return;
              }
              const { checks = [] } = readUserData || {};
              if (checks.includes(id)) {
                const userUpdated = {
                  ...readUserData,
                  checks: checks.filter((c) => c !== id),
                };
                storeData.update('users', readCheckData.phone, userUpdated, (updateUserErr) => {
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
      });
    } else {
      cb(400, { error: 'Missing required token or invalid token' });
    }
  } else {
    cb(400, { error: 'Invalid check' });
  }
}

const handler = {
  post,
  get,
  put,
  delete: eliminate,
};

module.exports = handler;
