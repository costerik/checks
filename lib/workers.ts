/*
 *
 * Workers tasks
 *
 * */
import http from 'http';
import https from 'https';
import url from 'url';

import * as data from './data';
import * as helpers from './helpers';

import type { CheckType, OutcomeType } from '../index.d';

function alertUserToStatusChange(dataArg: CheckType): void {
  const msg = `Alert: Your check for ${dataArg.method && dataArg.method.toUpperCase()} ${
    dataArg.protocol
  }://${dataArg.url} is currently ${dataArg.state}`;
  if (typeof dataArg.phone === 'string') {
    helpers.sendTwilioSms(dataArg.phone, msg, (err) => {
      if (err) {
        console.log('Success: User was alerted to a status change in their check, via sms: ', msg);
      } else {
        console.log('Error: Could not send sms alert to user who had a state change in their check', err);
      }
    });
  }
}

function processCheckOutcome(dataArg: CheckType, checkOutcome: OutcomeType): void {
  const state =
    !checkOutcome.error &&
    checkOutcome.responseCode &&
    dataArg.successCode &&
    dataArg.successCode.includes(checkOutcome.responseCode)
      ? 'up'
      : 'down';

  const alertWarranted = dataArg.lastChecked && dataArg.state !== state ? true : false;

  const newCheckData = dataArg;
  newCheckData.state = state;
  newCheckData.lastChecked = Date.now();

  data.update('checks', newCheckData.id || '', newCheckData, (err) => {
    if (!err) {
      if (alertWarranted) {
        alertUserToStatusChange(newCheckData);
      } else {
        console.log('Check outcome has not changed, no alert needed');
      }
    } else {
      console.log('Error trying to save updates to one of the checks');
    }
  });
}

function performCheck(dataArg: CheckType): void {
  const checkOutcome: OutcomeType = {
    error: false,
    responseCode: 0,
  };

  let outcomeSent = false;

  const parseUrl = url.parse(`${dataArg.protocol}://${dataArg.url}, true`);
  const hostname = parseUrl.hostname;
  const path = parseUrl.path;

  const rd = {
    protocol: `${dataArg.protocol}:`,
    hostname: hostname,
    method: dataArg.method && dataArg.method.toUpperCase(),
    path: path,
    timeout: dataArg.timeoutSeconds ? dataArg.timeoutSeconds * 1000 : 1000,
  };

  const protocol = dataArg.protocol === 'http' ? http : https;
  const req = protocol.request(rd, (res) => {
    const { statusCode } = res;
    checkOutcome.responseCode = statusCode || 0;

    if (!outcomeSent) {
      processCheckOutcome(dataArg, checkOutcome);
      outcomeSent = true;
    }
  });

  req.on('error', () => {
    checkOutcome.error = { error: true, value: 'error' };
    if (!outcomeSent) {
      processCheckOutcome(dataArg, checkOutcome);
      outcomeSent = true;
    }
  });

  req.on('timeout', () => {
    checkOutcome.error = { error: true, value: 'timeout' };
    if (!outcomeSent) {
      processCheckOutcome(dataArg, checkOutcome);
      outcomeSent = true;
    }
  });

  req.end();
}

function validateCheckData(data: CheckType): void {
  const { id, phone, protocol, url, method, successCode, timeoutSeconds, state, lastChecked } = data;
  if (!(typeof id === 'string' && id.trim().length === 20)) {
    console.log('Error: id is not properly formatted. Skipping.');
    return;
  }

  if (!(typeof phone === 'string' && phone.trim().length === 10)) {
    console.log('Error: phone is not properly formatted. Skipping.');
    return;
  }

  if (!(typeof protocol === 'string' && ['http', 'https'].includes(protocol))) {
    console.log('Error: protocol is not properly formatted. Skipping.');
    return;
  }

  if (!(typeof url === 'string' && url.trim().length > 0)) {
    console.log('Error: url is not properly formatted. Skipping.');
    return;
  }

  if (!(typeof method === 'string' && ['post', 'get', 'put', 'delete'].includes(method))) {
    console.log('Error: method is not properly formatted. Skipping.');
    return;
  }

  if (!(Array.isArray(successCode) && successCode.length > 0)) {
    console.log('Error: successCode is not properly formatted. Skipping.');
    return;
  }

  if (
    !(
      typeof timeoutSeconds === 'number' &&
      timeoutSeconds % 1 === 0 &&
      timeoutSeconds >= 1 &&
      timeoutSeconds <= 5
    )
  ) {
    console.log('Error: timeoutSeconds is not properly formatted. Skipping.');
    return;
  }

  const checkData: CheckType = {
    id: id.trim(),
    phone: phone.trim(),
    protocol: protocol.trim(),
    url: url.trim(),
    method: method.trim(),
    successCode: successCode,
    timeoutSeconds: timeoutSeconds,
    state: typeof state === 'string' && ['up', 'down'].includes(state) ? state : 'down',
    lastChecked: typeof lastChecked === 'number' && lastChecked > 0 ? lastChecked : 0,
  };

  performCheck(checkData);
}

function gatherAllChecks(): void {
  data.list('checks', (flag, res) => {
    if (!flag) {
      const checkLists = res as Array<string>;
      console.log('checklist', checkLists);
      checkLists.forEach((cl) => {
        data.read<CheckType>('checks', cl, (err, response) => {
          if (!err) {
            const checkData = response as CheckType;
            validateCheckData(checkData);
          } else {
            console.log('There was an error reading the file', err);
          }
        });
      });
    } else {
      console.log('Error gathering all checks', res);
    }
  });
}

function loop(): void {
  setInterval(() => {
    gatherAllChecks();
  }, 2 * 1000);
}

export default function init(): void {
  console.log('@@INIT workers');
  gatherAllChecks();
  loop();
}
