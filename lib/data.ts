/*
 * Data Managing
 *
 */

/*Dependencies*/
import fs from 'fs';
import path from 'path';
import * as helpers from './helpers';

const baseDir = path.join(__dirname, '/../.data/');

export function create<T>(
  dir: string,
  file: string,
  data: T,
  cb: (err: NodeJS.ErrnoException | boolean, message?: string) => void
): void {
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

export function read<T>(
  dir: string,
  file: string,
  cb: (err: NodeJS.ErrnoException | boolean, response: string | T | { [key: string]: string }) => void
): void {
  fs.readFile(`${baseDir}${dir}/${file}.json`, 'utf8', (err, data) => {
    if (err) {
      cb(err, 'There was an error reading the file');
      return;
    }
    cb(false, helpers.parseJsonToObject<T>(data));
  });
}

export function update<T>(
  dir: string,
  file: string,
  data: T,
  cb: (err: NodeJS.ErrnoException | boolean, message?: string) => void
): void {
  fs.writeFile(`${baseDir}${dir}/${file}.json`, JSON.stringify(data), (err) => {
    if (err) {
      cb(err, 'There was an error updating the file');
      return;
    }
    cb(false);
  });
}

export function eliminate(
  dir: string,
  file: string,
  cb: (err: NodeJS.ErrnoException | boolean, message?: string) => void
): void {
  fs.unlink(`${baseDir}${dir}/${file}.json`, (err) => {
    if (err) {
      cb(err, 'Error deleting file');
      return;
    }
    cb(false);
  });
}
