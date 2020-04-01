/*
 * Helpers for various tasks
 *
 * */

// Dependencies
const crypto = require("crypto");
const config = require("../config");

function hash(str){
	if(!typeof str === "string" && !str.length) return false;

	return crypto.createHmac('sha256', config.hashingSecret).update(str).digest("hex");
}

function parseJsonToObject(data){
	try{
		return JSON.parse(data);
	}catch{
		return {};
	}
}

function createRandomString(length){
	if(typeof length === "number" && length>0){
		const letters = "abcdefghijklmnopqrstuvwxyz";
		let res = "";
		for(let i = 0 ; i < length; i++){
			res+=letters.charAt(Math.floor(Math.random() * letters.length));
		}
		return res;
	}else{
		return false;
	}
}

const helpers = {
	hash,
	parseJsonToObject,
	createRandomString,
}

module.exports = helpers;
