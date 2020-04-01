/*
 * Users handler
 *
 */

// Dependencies
let storeData = require('../data');
let helpers = require('../helpers');
let { verifyToken } = require("./tokens");

function post(data, cb){
	const {payload: { firstName, lastName, phone, password, tosAgreement}={}} = data || {};
	let user ={
		firstName:
		typeof firstName==='string' && firstName.trim().length && firstName|| false,
		lastName:
		typeof lastName==='string' && lastName.trim().length && lastName || false,
		phone:
		typeof phone==='string' && phone.trim().length === 10 && phone || false,
		password:
		typeof password==='string' && password.trim().length && password || false,
		tosAgreement:
		typeof tosAgreement==='boolean' && tosAgreement
	};
	if(Object.values(user).includes(false)){
		cb(400, {error: 'missing require fields'});
		return;
	}

	storeData.read("users", phone, function(err, data){
		if(!err){
			cb(400, {
				error: 'A user with that phone number already taken',
				errorMessage: {err, data}
			});
			return;
		}
		user.tosAgreement = true;
		const hashedPassword = helpers.hash(password);
		if(!hashedPassword){
			cb(500, {error: "Error hashing the password"});
			return;
		}
		user.tosAgreement = true;
		user.password = helpers.hash(password);
		storeData.create('users', phone, user, function(err){
			if(err){
				cb(500, {error: "couldn't create the new user", errorMessage: {
					err
				}});
				return;
			}
			cb(200);
		});
	});
}

function get(data, cb){
	const {query: {phone}={}, headers:{token}={}} = data || {};
	if(typeof phone === 'string' && phone.length===10){
		if(typeof token === 'string'){
			verifyToken(token, phone, function(err, verifyData){
				if(typeof err === 'number' && verifyData.error){
					cb(500, {error: verifyData.error});
					return;
				}
				if(err){
					cb(403, {error: "token is invalid"});
				}else{
					storeData.read('users', phone, function(err, data){
						if(err){
							cb(404,{error: "The user doesn't exists", errorMessage: {err, data}});
							return;
						}
						delete data.password
						cb(200, data);

					})
				}
			})
		}else{
			cb(403,{error: "Missing required token in header"})
		}
	}else{
		cb(400, {error: "Invalid phone number"});
	}
}

function put(data, cb){
	const { payload: {phone, firstName, lastName, tosAgreement, password}={}} = data || {};
	const qPhone =
		typeof phone === 'string' && phone.length===10 && phone || false;
	const qFirstName =
		typeof firstName==='string' && firstName.trim().length && firstName || false;
	const qLastName =
		typeof lastName==='string' && lastName.trim().length && lastName || false;
	const qPassword =
		typeof password==='string' && password.trim().length && password || false;
	const qTosAgreement =
		typeof tosAgreement==='boolean' && tosAgreement;

	if(qPhone){
		if(qFirstName || qLastName || qTosAgreement || qPassword){

			if(typeof token === 'string'){

				verifyToken(token, phone, function(err, verifyData){
					if(typeof err === 'number' && verifyData.error){
						cb(500, {error: verifyData.error});
						return;
					}
					if(err){
						cb(403, {error: "token is invalid"});
					}else{
						storeData.read('users', phone, function(err, data){
							if(err){
								cb(400, {error: "The user doesn't exist"});
								return;
							}
							if(qFirstName) data.firstName = qFirstName;
							if(qLastName) data.lastName = qLastName;
							if(qTosAgreement) data.tosAgreement = qTosAgreement;
							if(qPassword) data.password = qPassword;
							storeData.update('users', phone, data, function(err){
								if(err){
									cb(500, "Error updating the file");
									return;
								}
								cb(200);
							})

						});
					}
				});
			}else{
				cb(403,{error: "Missing required token in header"})
			}
		}else{
			cb(400, {error: 'Missing fields to update'});
		}
	}else{
		cb(400, {error: "Invalid phone number"});
	}
}

function eliminate(data, cb){
	const { payload: {phone}={} } = data || {};
	const qPhone = typeof phone === 'string' && phone.length===10 && phone || false;
	if(!qPhone){
		cb(400, {error: 'Invalid phone value'});
		return;
	}
  if(typeof token === 'string'){
    verifyToken(token, phone, function(err, verifyData){
      if(typeof err === 'number' && verifyData.error){
        cb(500, {error: verifyData.error});
        return;
      }
      if(err){
        cb(403, {error: "token is invalid"});
      }else{
        storeData.read('users', phone, function(err){
          if(err){
            cb(400, {error: "The user doesn't exist"});
            return;
          }
          storeData.eliminate('users', phone, function(err){
            if(err){
              cb(500, {error: "Error deleting the user"});
              return;
            }
            cb(200);
          });
	})
      }
    });
  }else{
    cb(403,{error: "Missing required token in header"});
  }
}

let handler = {
	post,
	get,
	put,
	delete: eliminate
}

module.exports = handler;
