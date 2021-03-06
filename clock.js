/*
 Author: Ansel Colby
 Description: clocks in and out with google spreadsheets for DOSE HEALTH
 Date: 08/13/2018 V 1.0
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

const todaysDate = moment().format('M/D/YYYY');

const spreadsheetId = ''; // TODO Put your spreadsheet Id here -> in the url: ...spreadsheets/d/SPREADSHEETID/edit
const sheetId = ''; // TODO Put your sheet Id here -> in the url: .../edit#gid=SHEETID
const sheetName = ''; // TODO Put your sheet name here -> the name of the sheet on the tab in the bottom left


main();

/*
 * The main async handler
 */
async function main() {
  console.log('>>>> authenticating . . .');
  try {
    let auth = await authentication.authenticate();
    let input = await getUserInput();

    if (input.inOrOut === 'i') {
      await clockIn(auth, input);
    } else if (input.inOrOut === 'o') {
      let rows = await getRows(auth);
      rows = await updateRows(rows, input);
      await clockOut(auth, rows);
    }
    console.log('done');
  } catch (e) {
    console.log(e);
  }
}

/**
 * Gets input from the user from the console
 * @returns an object containing the clock method and the time
 */
async function getUserInput() {
  console.log('>>>> valid authentication');
  let inOrOut = readline.question('>>> Would you like to clock in or out? (i/o) ');
  if (inOrOut !== 'i' && inOrOut !== 'o') {
    console.log(inOrOut);
    throw new Error('invalid input');
  }
  let timeclock = readline.question('>>> What time are you clocking in? ');
  let input = {
    inOrOut,
    timeclock
  }
  return input;
}

/**
 * Appends a row at the bottom of the spreadsheet
 * @param auth the Google auth
 * @param input the input object returned from getUserInput()
 */
async function clockIn(auth, input) {
  console.log('>>> clocking in . . .');

  const request = {
    spreadsheetId,
    range: `${sheetName}!A:F`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'OVERWRITE',

    resource: {
      values: [
      [
        '',
        todaysDate,
        input.timeclock
      ],
    ]
  },
    auth
  };

  try {
    let res = await append(request);
  } catch (e) {
    throw(e);
  }
  console.log('>>> clocked in!');
}

/**
 * Retrieves the rows from the sheet in order to modify and append
 * @param auth the Google auth
 * @returns the rows retrieved
 */
async function getRows(auth) {
  console.log('>>>> retrieving row data . . .');
  const params = {
    auth: auth,
    spreadsheetId: spreadsheetId,
    ranges: `${sheetName}!A:F`,
    includeGridData: true
  }

  try {
    const response = await getSheet(params);
    let rows = response.sheets[0].data[0].rowData;
    console.log(rows)

    if (rows.length  > 0) {
      console.log('>>>> retrieved row data');
      return rows;
    } else {
      throw new Error('NO DATA FOUND');
    }

  } catch (e) {
    throw(e);
  }
}

/**
 * Modifies the rows to be appended later
 * @param rows the rows object returned from getRows()
 * @param input the input object returned from getUserInput()
 * @returns the updated rows object
 */
async function updateRows(rows, input) {
  try {
    let index = false;
    for (let i = 0; i < rows.length; i++) {
      let row = rows[i].values;
      if (row) {
        for (var j = 0; j < row.length; j++) {
          let cell = row[j];
          if (cell.formattedValue && (cell.formattedValue === todaysDate)) {
            index = true;
            row[j+2].userEnteredValue = {stringValue: input.timeclock};
            row[j+2].userEnteredFormat.horizontalAlignment = 'RIGHT';

            let start = moment(row[j+1].formattedValue, 'h:mm A');
            let end = moment(input.timeclock, 'h:mm A');
            let diff = Math.abs(start.diff(end, 'hours', 'minutes'));
            row[j+3].userEnteredValue = {numberValue: diff};

            // console.log(rows[i-1]);

            if (rows[i-1].values[j+4].effectiveFormat.textFormat.bold) {
              row[j+4].userEnteredValue = {numberValue: parseFloat(diff.toString()).toFixed(2)};
            } else {
              row[j+4].userEnteredValue = {numberValue: Number(rows[i-1].values[j+4].formattedValue) + diff};
            }
          }
        }
      }
    }
    if (!index) throw new Error("NO CLOCK IN FOUND FOR TODAY'S DATE");

    return rows;
  } catch (e) {
    throw(e);
  }
}

/**
 * Takes in the modified rows and appends them to the sheet
 * @param auth the Google auth
 * @param rows the modified rows from updateRows()
 */
async function clockOut(auth, rows) {
  console.log('>>>> updating rows . . .');
  const request = {
    auth: auth,
    spreadsheetId: spreadsheetId,
    resource: {
      requests: [{
        updateCells: {
          start: {
            sheetId: sheetId,
            rowIndex: 4,
            columnIndex: 0
          },
          'fields': '*',
          rows: rows
        }
      }]
    }
  };

  try {
    let res = await batchUpdate(request);
    console.log('>>>> updated the sheet');
  } catch (e) {
    throw(e);
  }
}
