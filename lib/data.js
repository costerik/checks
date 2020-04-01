/*
 * Data Managing
 *
 */

// Dependencies
const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

let baseDir = path.join(__dirname, "/../.data/");

function create(dir, file, data, cb){
	fs.open(`${baseDir}${dir}/${file}.json`,'wx', function(err, openFileDescriptor){
		if(err){
			cb(err, "Couldn't create new file, It may already exist");
			return;
		}

		let dataStringified = JSON.stringify(data);

		fs.writeFile(openFileDescriptor, dataStringified, function(err2){

			if(err2){
				cb(err2, "Error writing to new file");
				return;
			}

			fs.close(openFileDescriptor, function(err3){

				if(err3){
					cb(err3, "Error closing the new file");
					return;
				}

				cb(false);
			});
		});

	})
}

function read(dir, file, cb){
	fs.readFile(`${baseDir}${dir}/${file}.json`, 'utf8',function(err, data){
		if(err){
			cb(err, "There was an error reading the file");
			return;
		}
		cb(false, helpers.parseJsonToObject(data));
	});
}

function update(dir, file, data, cb ){
	fs.writeFile(`${baseDir}${dir}/${file}.json`,JSON.stringify(data),function(err){
		if(err){
			cb(err, "There was an error updating the file");
			return;
		}
		cb(false);
	});
}

function eliminate(dir, file, cb){
	fs.unlink(`${baseDir}${dir}/${file}.json`, function(err){
		if(err){
			cb(err, "Error deleting file");
			return;
		}
		cb(false);
	})
}

let data = {
	baseDir,
	create,
	update,
	eliminate,
	read
};

module.exports = data;
