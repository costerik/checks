/*
 *
 * Logs taks
 *
 * */
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const baseDir = path.join(__dirname, '/../.logs/');

type AppendCallbackType = (flag: boolean, message?: string) => void;
type ListCallbacktype = (flag: boolean | NodeJS.ErrnoException, data: Array<string>) => void;
type CompressCallbackType = (flag: boolean, err?: NodeJS.ErrnoException | null) => void;
type DecompressCallbackType = (flag: boolean, data: string | NodeJS.ErrnoException | null) => void;
type TruncateCallbackType = CompressCallbackType;

export function append(file: string, str: string, callback: AppendCallbackType): void {
  fs.open(baseDir + file + '.log', 'a', function (err, fileDescriptor) {
    if (!err && fileDescriptor) {
      fs.appendFile(fileDescriptor, str + '\n', function (err) {
        if (!err) {
          fs.close(fileDescriptor, function (err) {
            if (!err) {
              callback(false);
            } else {
              callback(true, 'Error closing filethat was being appended');
            }
          });
        } else {
          callback(true, 'Error appending to file');
        }
      });
    } else {
      callback(true, 'Could open file for appending');
    }
  });
}

export function list(includeCompressedLogs: boolean, callback: ListCallbacktype): void {
  fs.readdir(baseDir, function (err, data) {
    if (!err && data) {
      const trimmedFileNames: Array<string> = [];
      data.forEach(function (fileName) {
        if (fileName.indexOf('.log') > -1) {
          trimmedFileNames.push(fileName.replace('.log', ''));
        }

        if (fileName.indexOf('.gz.b64') > -1 && includeCompressedLogs) {
          trimmedFileNames.push(fileName.replace('.gz.b64', ''));
        }
      });
      callback(false, trimmedFileNames);
    } else {
      callback(err as NodeJS.ErrnoException, data);
    }
  });
}

export function compress(logId: string, newFileId: string, callback: CompressCallbackType): void {
  const sourceFile = logId + '.log';
  const destFile = newFileId + '.gz.b64';

  fs.readFile(baseDir + sourceFile, 'utf8', function (err, inputString) {
    if (!err && inputString) {
      zlib.gzip(inputString, function (err, buffer) {
        if (!err && buffer) {
          fs.open(baseDir + destFile, 'wx', function (err, fileDescriptor) {
            if (!err && fileDescriptor) {
              fs.writeFile(fileDescriptor, buffer.toString('base64'), function (err) {
                if (!err) {
                  fs.close(fileDescriptor, function (err) {
                    if (!err) {
                      callback(false);
                    } else {
                      callback(true, err);
                    }
                  });
                } else {
                  callback(true, err);
                }
              });
            } else {
              callback(true, err);
            }
          });
        } else {
          callback(true, err);
        }
      });
    } else {
      callback(true, err);
    }
  });
}

export function decompress(fileId: string, callback: DecompressCallbackType): void {
  const fileName = fileId + '.gz.b64';
  fs.readFile(baseDir + fileName, 'utf8', function (err, str) {
    if (!err && str) {
      const inputBuffer = Buffer.from(str, 'base64');
      zlib.unzip(inputBuffer, function (err, outputBuffer) {
        if (!err && outputBuffer) {
          const str = outputBuffer.toString();
          callback(false, str);
        } else {
          callback(true, err);
        }
      });
    } else {
      callback(true, err);
    }
  });
}

export function truncate(logId: string, callback: TruncateCallbackType): void {
  fs.truncate(baseDir + logId + '.log', 0, function (err) {
    if (!err) {
      callback(false);
    } else {
      callback(true, err);
    }
  });
}
