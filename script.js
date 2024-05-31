const https = require('https');
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});
async function modifyTable() {
    // UPDATE TABLE LEADS TO ADD ADDTION FIELDS
    const updateQuery = `ALTER TABLE leads ADD COLUMN more_fields JSON`;
    await __pool.query(updateQuery);
}


module.exports = {
  modifyTable,
}



  