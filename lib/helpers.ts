/*
 * Helpers for various tasks
 *
 * */

// Dependencies
import crypto from 'crypto';
import queryString from 'querystring';
import https from 'https';
import config from '../config';

export function hash(str: string): string | boolean {
  console.log(config.hashingSecret, str);
  if (typeof str === 'string' && str.length)
    return crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
  return false;
}

export function parseJsonToObject<T>(data: string): T | { [key: string]: string } {
  try {
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
}

export function createRandomString(length: number): string | boolean {
  if (typeof length === 'number' && length > 0) {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    let res = '';
    for (let i = 0; i < length; i += 1) {
      res += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    return res;
  }
  return false;
}

export function sendTwilioSms(
  phone: string,
  message: string,
  cb: (
    result: boolean,
    error?: {
      message: string;
      error?: Error;
    }
  ) => void
): void {
  if (
    typeof phone === 'string' &&
    phone.trim().length === 10 &&
    typeof message === 'string' &&
    message.trim().length <= 1600
  ) {
    const localPhone = phone.trim();
    const localMsg = message.trim();

    const payload = {
      From: config.twilio.fromPhone,
      To: `+57 ${localPhone}`,
      Body: localMsg,
    };

    const stringPayload = queryString.stringify(payload);

    const requestDetails = {
      protocol: 'https:',
      hostname: 'api.twilio.com',
      method: 'POST',
      path: `/2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`,
      auth: `${config.twilio.accountSid}:${config.twilio.authToken}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(stringPayload),
      },
    };

    const req = https.request(requestDetails, (res): void => {
      const { statusCode } = res;
      if (statusCode === 200 || statusCode === 201) {
        cb(true);
      } else {
        cb(false);
      }
    });

    req.on('error', (e) => {
      cb(false, { message: e.message, error: e });
    });

    req.write(stringPayload);

    req.end();
  } else {
    cb(false, { message: 'Invalid fields' });
  }
}
