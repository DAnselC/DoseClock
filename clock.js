/*
 Author: Ansel Colby
 Description:
 Date:
*/

const google = require('googleapis');
const async = require('async');
const readline = require('readline-sync');

const { promisify } = require('es6-promisify');

const authentication = require('./authentication');
const sheets = google.sheets('v4');
const spreadsheetId = '1op-sACqhT7QiT_5y2rZd_4nAY3gTxPIPJvEjSDQ3Kv0';
const sheetId = '1215706000'; // test
const sheetName = 'testing'
const getSheet = promisify(sheets.spreadsheets.get);
const batchUpdate = promisify(sheets.spreadsheets.batchUpdate);


main();

async function main() {
  console.log('>>>> authenticating . . .');
  try {
    let auth = await authentication.authenticate();
    let input = await getUserInput();
    await appendTime(auth, input);
    let rows = await getRows(auth);
    console.log(rows);
    if (input.inOrOut === 'i') rows = await clockIn(rows, input);
    else if (input.inOrOut === 'o') rows = await clockOut(rows, input);
    let res = await updateSheet(auth, rows);
  } catch (e) {
    console.log('uh oh there was an error ', e);
    throw new Error('SHIT');
  } finally {
    console.log('d o n e');
  }

}

/**
 *
 */
async function getUserInput() {
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
 *
 */
async function appendTime(auth, input) {
  
}

/**
 *
 */
async function getRows(auth) {
  console.log('>>>> valid authentication');
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
