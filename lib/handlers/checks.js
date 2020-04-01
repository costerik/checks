/*
 * checks handler
 *
 */

// Dependencies
let storeData = require('../data');
let helpers = require('../helpers');

function post(data, cb){
  cb(200);
}

function get(data, cb){
  cb(200);
}

function put(data, cb){
  cb(200);
}

function eliminate(data, cb){
  cb(200);
}

let handler = {
	post,
	get,
	put,
	delete: eliminate
}

module.exports = handler;
