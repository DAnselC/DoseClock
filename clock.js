/*
 Author: Ansel Colby
 Description:
 Date:
*/

const google = require('googleapis');
const async = require('async');
const readline = require('readline-sync');
const moment = require('moment');
const { promisify } = require('es6-promisify');

const authentication = require('./authentication');

const sheets = google.sheets('v4');
const getSheet = promisify(sheets.spreadsheets.get);
const batchUpdate = promisify(sheets.spreadsheets.batchUpdate);
const append = promisify(sheets.spreadsheets.values.append);
const spreadsheetId = '1op-sACqhT7QiT_5y2rZd_4nAY3gTxPIPJvEjSDQ3Kv0';
const sheetId = '1215706000'; // test
const sheetName = 'testing'


main();

async function main() {
  console.log('>>>> authenticating . . .');
  try {
    let auth = await authentication.authenticate();
    let input = await getUserInput();
    let rows;

    if (input.inOrOut === 'i') {
      await appendTime(auth, input);
      // rows = await clockIn(rows, input);
    } else if (input.inOrOut === 'o') {
      rows = await getRows(auth);
      // console.log(rows);
      rows = await clockOut(rows, input);
      let res = await updateSheet(auth, rows);
    }
  } catch (e) {
    console.log('uh oh there was an error ', e);
    throw new Error('SHIT');
  } finally {
    console.log('d o n e');
  }

}

/**
 * Gets input from the user from the console
 * Returns an object of clock (in or out) and time
 */
async function getUserInput() {
  console.log('>>>> valid authentication');
  let inOrOut = readline.question('>>> Would you like to clock in or out? (i/o) ');
  if (inOrOut !== 'i' && inOrOut !== 'o') {
    console.log(inOrOut);
    throw new Error('invalid input!!!!!');
  }
  let timeclock = readline.question('>>> What time are you clocking in? ');
  let input = {
    inOrOut,
    timeclock
  }
  return input;
}

/**
 * Appends a rows at the bottom of the new time clock
 * (for clocking in only)
 */
async function appendTime(auth, input) {
  console.log('>>> clocking in . . .');

  const request = {
    spreadsheetId,
    range: `${sheetName}!A:F`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',

    resource: {
      values: [
      [
        '',
        moment().format('M/D/YYYY'),
        input.timeclock
      ],
    ]
  },
    auth
  };

  try {
    let res = await append(request);
  } catch (e) {
    throw new Error('The API returned an error: ', e);
  }
  console.log('>>> clocked in!');
}

/**
 *
 */
async function getRows(auth) {
  console.log('>>>> retrieving row data . . .');
  const params = {
    auth: auth,
    spreadsheetId: spreadsheetId,
    ranges: `${sheetName}!A5:F`,
    includeGridData: true
  }

  try {
    const response = await getSheet(params);
    let rows = response.sheets[0].data[0].rowData;

    if (rows.length  > 0) {
      console.log('>>>> retrieved row data');
      return rows;
    } else {
      console.log('No data found');
    }

  } catch (e) {
    console.error('>>>> The API returned n error: ');
    console.log(e);
    return null;
  }
}

/**
 *
 */
async function clockIn(rows, input) {

  return rows;
}

async function clockOut(rows, input) {
  return rows;
}

/**
 *
 */
async function updateSheet(auth, rows) {
  let response = null;
  return response;
}
