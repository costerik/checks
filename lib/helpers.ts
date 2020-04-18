/*
 * Helpers for various tasks
 *
 * */

// Dependencies
import crypto from 'crypto';
import config from '../config';

export function hash(str: string): string | boolean {
  if (typeof str === 'string' && !str.length)
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
