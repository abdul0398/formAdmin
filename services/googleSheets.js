const {google} =  require("googleapis");
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const sheets = google.sheets("v4");

async function getAuthToken() {
  const auth = new google.auth.GoogleAuth({
    scopes: SCOPES,
  });
  const authToken = await auth.getClient();
  return authToken;
}

async function getSpreadSheet({ spreadsheetId, auth }) {
  const res = await sheets.spreadsheets.get({
    spreadsheetId,
    auth,
  });
  return res;
}

async function getSpreadSheetValues({ spreadsheetId, auth, sheetName }) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    auth,
    range: sheetName,
  });
  return res;
}

async function GetSpreadSheet(spreadsheetId) {
  try {
    const auth = await getAuthToken();
    const response = await getSpreadSheet({
      spreadsheetId,
      auth,
    });
    return JSON.stringify(response.data, null, 2);
  } catch (error) {
    console.log(error.message);
    return false;
  }
}

async function GetSpreadSheetValues(spreadsheetId, sheetName) {
  try {
    const auth = await getAuthToken();
    console.log(auth);
    const response = await getSpreadSheetValues({
      spreadsheetId,
      sheetName,
      auth,
    });
    return response.data;
  } catch (error) {
    console.log(error.message);
    return false;
  }
}


async function createSheet(spreadsheetId, sheetName) {
  const defaultColumns = ["Name", "Email", "Phone", "IP", "Discord", "Status", "Additional Data"];
  const auth = await getAuthToken();
  const sheets = google.sheets({ version: "v4", auth });

  const request = {
    spreadsheetId: spreadsheetId,
    resource: {
      requests: [
        {
          addSheet: {
            properties: {
              title: sheetName,
            },
          },
        }
        ],
      },
    }

  try {
    const response = await sheets.spreadsheets.batchUpdate(request);
    console.log(`Sheet "${sheetName}" created successfully.`);
    const sheetId = response.data.replies[0].addSheet.properties.sheetId;
    const range = `${sheetName}!A1:${String.fromCharCode(65 + defaultColumns.length - 1)}1`;
    const valueRange = {
      values: [defaultColumns],
    };

    const updateResponse = await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: range,
      valueInputOption: "RAW",
      resource: valueRange,
    });

    console.log("Default columns added to the sheet.");
    return updateResponse.data;
  } catch (error) {
    console.error("Error creating sheet:", error);
    return false;
  }
}
  
async function renameSheet(spreadsheetId, currentSheetName, newSheetName) {
  const auth = await getAuthToken();
  const sheets = google.sheets({ version: "v4", auth });

  try {
    // Get the spreadsheet details
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId,
    });

    // Find the sheet ID based on the current sheet name
    const sheet = spreadsheet.data.sheets.find(
      (s) => s.properties.title === currentSheetName
    );

    if (!sheet) {
      throw new Error(`Sheet with name "${currentSheetName}" not found.`);
    }

    const sheetId = sheet.properties.sheetId;

    // Prepare the request to rename the sheet
    const request = {
      spreadsheetId: spreadsheetId,
      resource: {
        requests: [
          {
            updateSheetProperties: {
              properties: {
                sheetId: sheetId,
                title: newSheetName,
              },
              fields: "title",
            },
          },
        ],
      },
    };

    // Execute the request
    const response = await sheets.spreadsheets.batchUpdate(request);
    console.log(`Sheet renamed from "${currentSheetName}" to "${newSheetName}".`);
    return response.data;
  } catch (error) {
    console.error("Error renaming sheet:", error);
    return false;
  }
}


async function addRow(spreadsheetId, sheetName, data, selects) {
  const auth = await getAuthToken();
  const sheets = google.sheets({ version: "v4", auth });

  // Prepare the additional data string
  let additionalDataString = '';
  selects.forEach((select) => {
    additionalDataString += `${select.name}: ${select.value}\n`;
  });

  // Prepare the row data
  const row = [
    data.name || '',
    data.email || '',
    data.ph_number || '',
    data.ip_address || '',
    data.is_send_discord == 0? 'Not Sent': 'Sent',
    data.status || '',
    additionalDataString.trim() || '',
  ];

  // Prepare the request to append the new row
  const request = {
    spreadsheetId: spreadsheetId,
    range: `${sheetName}!A:A`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    resource: {
      values: [row],
    },
  };

  try {
    const response = await sheets.spreadsheets.values.append(request);
    console.log(`Row added to sheet "${sheetName}".`);
    return response.data;
  } catch (error) {
    console.error("Error adding row:", error);
    return false;
  }
}





module.exports =  {
  getAuthToken,
  getSpreadSheet,
  getSpreadSheetValues,
  GetSpreadSheetValues,
  GetSpreadSheet,
  createSheet,
  renameSheet,
  addRow
};
