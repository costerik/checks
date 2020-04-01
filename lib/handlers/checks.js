/*
 * checks handler
 *
 */

// Dependencies

function post(data, cb) {
  cb(200);
}

function get(data, cb) {
  cb(200);
}

function put(data, cb) {
  cb(200);
}

function eliminate(data, cb) {
  cb(200);
}

const handler = {
  post,
  get,
  put,
  delete: eliminate,
};

module.exports = handler;
