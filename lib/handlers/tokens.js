/*
 * Tokens handler
 *
 */

// Dependencies
const storeData = require('../data');
const helpers = require('../helpers');

function post(data, cb) {
  const { payload: { phone, password } = {} } = data || {};
  const localData = {
    phone: (typeof phone === 'string' && phone.trim().length === 10 && phone) || false,
    password: (typeof password === 'string' && password.trim().length && password) || false,
  };
  if (localData.phone && localData.password) {
    storeData.read('users', phone, (err, fetchedData) => {
      if (err) {
        cb(400, { error: 'Could not find the specified user' });
        return;
      }
      const { password: fetchedPassword = '' } = fetchedData || {};
      if (helpers.hash(password) !== fetchedPassword) {
        cb(400, { error: "Password did not match the user's specified password" });
        return;
      }

      const tokenId = helpers.createRandomString(20);
      if (!tokenId) {
        cb(500, { error: 'There was an error generating the token' });
        return;
      }
      const expires = Date.now() + 1000 * 60 * 60;
      const tokenData = {
        phone,
        id: tokenId,
        expires,
      };

      storeData.create('tokens', tokenId, tokenData, (createErr) => {
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

function get(data, cb) {
  const { query: { id } = {} } = data || {};
  if (typeof id === 'string' && id.length === 20) {
    storeData.read('tokens', id, (err, tokenData) => {
      if (err) {
        cb(404, { error: "The token doesn't exists", errorMessage: { err, tokenData } });
        return;
      }
      cb(200, data);
    });
  } else {
    cb(400, { error: 'Invalid id number' });
  }
}

function put(data, cb) {
  const { payload: { id, extend } = {} } = data || {};
  const localData = {
    id: (typeof id === 'string' && id.trim().length && id) || false,
    extend: typeof extend === 'boolean' && extend,
  };
  if (!(localData.id && localData.extend)) {
    cb(400, { error: 'Invalid fields' });
    return;
  }
  storeData.read('tokens', id, (err, tokenData) => {
    if (err) {
      cb(400, { error: 'Specified token does not exits' });
      return;
    }
    const { expires } = tokenData || {};
    if (Date.now() > expires) {
      cb(400, { error: 'The token has already expires' });
      return;
    }
    const newTokenData = {
      ...tokenData,
      expires: Date.now() + 1000 * 60 * 60,
    };
    storeData.update('tokens', id, newTokenData, (updateErr) => {
      if (updateErr) {
        cb(500, { error: "Couldn't update the token's expiration" });
        return;
      }
      cb(200);
    });
  });
}

function eliminate(data, cb) {
  const { payload: { id } = {} } = data || {};
  const qId = (typeof id === 'string' && id.length === 20 && id) || false;
  if (!qId) {
    cb(400, { error: 'Invalid token value' });
    return;
  }
  storeData.read('tokens', id, (err) => {
    if (err) {
      cb(400, { error: "The token doesn't exist" });
      return;
    }
    storeData.eliminate('tokens', id, (eliminateErr) => {
      if (eliminateErr) {
        cb(500, { error: 'Error deleting the token' });
        return;
      }
      cb(200);
    });
  });
}

function verifyToken(id, phone, cb) {
  storeData.read('tokens', id, (err, tokenData) => {
    if (err) {
      cb(500, { error: 'There was an error reading the token data' });
      return;
    }
    const { phone: tkPhone, expires } = tokenData || {};
    if (tkPhone === phone && expires > Date.now()) {
      cb(true);
    } else {
      cb(false);
    }
  });
}

const handler = {
  post,
  get,
  put,
  delete: eliminate,
  verifyToken,
};

module.exports = handler;
