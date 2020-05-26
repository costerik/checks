/*
 * Primary file for the API
 *
 * */

import serversInit from './lib/servers';
import workersInit from './lib/workers';

export default function init(): void {
  serversInit();
  workersInit();
}

init();
