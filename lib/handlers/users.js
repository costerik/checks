/*
 * Users handler
 *
 */

// Dependencies
const storeData = require('../data');
const helpers = require('../helpers');
const { verifyToken } = require('./tokens');

function post(data, cb) {
  const {
    payload: {
      firstName, lastName, phone, password, tosAgreement,
    } = {},
  } = data || {};
  const user = {
    firstName: (typeof firstName === 'string' && firstName.trim().length && firstName) || false,
    lastName: (typeof lastName === 'string' && lastName.trim().length && lastName) || false,
    phone: (typeof phone === 'string' && phone.trim().length === 10 && phone) || false,
    password: (typeof password === 'string' && password.trim().length && password) || false,
    tosAgreement: typeof tosAgreement === 'boolean' && tosAgreement,
  };
  if (Object.values(user).includes(false)) {
    cb(400, { error: 'missing require fields' });
    return;
  }

  storeData.read('users', phone, (err, readData) => {
    if (!err) {
      cb(400, {
        error: 'A user with that phone number already taken',
        errorMessage: { err, readData },
      });
      return;
    }
    user.tosAgreement = true;
    const hashedPassword = helpers.hash(password);
    if (!hashedPassword) {
      cb(500, { error: 'Error hashing the password' });
      return;
    }
    user.tosAgreement = true;
    user.password = helpers.hash(password);
    storeData.create('users', phone, user, (createErr) => {
      if (createErr) {
        cb(500, {
          error: "couldn't create the new user",
          errorMessage: {
            createErr,
          },
        });
        return;
      }
      cb(200);
    });
  });
}

function get(data, cb) {
  const { query: { phone } = {}, headers: { token } = {} } = data || {};
  if (typeof phone === 'string' && phone.length === 10) {
    if (typeof token === 'string') {
      verifyToken(token, phone, (err, verifyData) => {
        if (typeof err === 'number' && verifyData.error) {
          cb(500, { error: verifyData.error });
          return;
        }
        if (!err) {
          cb(403, { error: 'token is invalid' });
        } else {
          storeData.read('users', phone, (readErr, readData) => {
            if (readErr) {
              cb(404, {
                error: "The user doesn't exists",
                errorMessage: { err: readErr, data: readData },
              });
              return;
            }
            const newReadData = { ...readData };
            delete newReadData.password;
            cb(200, newReadData);
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

function put(data, cb) {
  const {
    payload: {
      phone, firstName, lastName, tosAgreement, password,
    } = {}, headers: { token } = {},
  } = data || {};
  const qPhone = (typeof phone === 'string' && phone.length === 10 && phone) || false;
  const qFirstName = (typeof firstName === 'string' && firstName.trim().length && firstName) || false;
  const qLastName = (typeof lastName === 'string' && lastName.trim().length && lastName) || false;
  const qPassword = (typeof password === 'string' && password.trim().length && password) || false;
  const qTosAgreement = typeof tosAgreement === 'boolean' && tosAgreement;

  if (qPhone) {
    if (qFirstName || qLastName || qTosAgreement || qPassword) {
      if (typeof token === 'string') {
        verifyToken(token, phone, (err, verifyData) => {
          if (typeof err === 'number' && verifyData.error) {
            cb(500, { error: verifyData.error });
            return;
          }
          if (!err) {
            cb(403, { error: 'token is invalid' });
          } else {
            storeData.read('users', phone, (errData, readData) => {
              if (errData) {
                cb(400, { error: "The user doesn't exist" });
                return;
              }
              const newReadData = { ...readData };
              if (qFirstName) newReadData.firstName = qFirstName;
              if (qLastName) newReadData.lastName = qLastName;
              if (qTosAgreement) newReadData.tosAgreement = qTosAgreement;
              if (qPassword) newReadData.password = qPassword;
              storeData.update('users', phone, newReadData, (updateErr) => {
                if (updateErr) {
                  cb(500, 'Error updating the file');
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

function eliminate(data, cb) {
  const { payload: { phone } = {}, headers: { token } = {} } = data || {};
  const qPhone = (typeof phone === 'string' && phone.length === 10 && phone) || false;
  if (!qPhone) {
    cb(400, { error: 'Invalid phone value' });
    return;
  }
  if (typeof token === 'string') {
    verifyToken(token, phone, (err, verifyData) => {
      if (typeof err === 'number' && verifyData.error) {
        cb(500, { error: verifyData.error });
        return;
      }
      if (!err) {
        cb(403, { error: 'token is invalid' });
      } else {
        storeData.read('users', phone, (readErr, readUser) => {
          if (readErr) {
            cb(400, { error: "The user doesn't exist" });
            return;
          }

          storeData.eliminate('users', phone, (eliminateErr) => {
            if (eliminateErr) {
              cb(500, { error: 'Error deleting the user' });
              return;
            }
            const { checks = [] } = readUser || {};
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

const handler = {
  post,
  get,
  put,
  delete: eliminate,
};

module.exports = handler;
