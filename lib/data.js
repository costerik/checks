/*
 * Data Managing
 *
 */

// Dependencies
const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

const baseDir = path.join(__dirname, '/../.data/');

function create(dir, file, data, cb) {
  fs.open(`${baseDir}${dir}/${file}.json`, 'wx', (err, openFileDescriptor) => {
    if (err) {
      cb(err, "Couldn't create new file, It may already exist");
      return;
    }

    const dataStringified = JSON.stringify(data);

    fs.writeFile(openFileDescriptor, dataStringified, (err2) => {
      if (err2) {
        cb(err2, 'Error writing to new file');
        return;
      }

      fs.close(openFileDescriptor, (err3) => {
        if (err3) {
          cb(err3, 'Error closing the new file');
          return;
        }

        cb(false);
      });
    });
  });
}

function read(dir, file, cb) {
  fs.readFile(`${baseDir}${dir}/${file}.json`, 'utf8', (err, data) => {
    if (err) {
      cb(err, 'There was an error reading the file');
      return;
    }
    cb(false, helpers.parseJsonToObject(data));
  });
}

function update(dir, file, data, cb) {
  fs.writeFile(`${baseDir}${dir}/${file}.json`, JSON.stringify(data), (err) => {
    if (err) {
      cb(err, 'There was an error updating the file');
      return;
    }
    cb(false);
  });
}

function eliminate(dir, file, cb) {
  fs.unlink(`${baseDir}${dir}/${file}.json`, (err) => {
    if (err) {
      cb(err, 'Error deleting file');
      return;
    }
    cb(false);
  });
}

const data = {
  baseDir,
  create,
  update,
  eliminate,
  read,
};

module.exports = data;
