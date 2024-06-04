const https = require('https');
const { createSheet, addRow } = require('./services/googleSheets');
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});
async function modifyTable() {
  const [forms] = await __pool.query(`
    SELECT * FROM forms
    WHERE client_id = ?
  `, [process.env.CLIENT_ID]);

  for (let i = 0; i < forms.length; i++) {
    await createSheet(process.env.SHEET_ID, forms[i].name);
    const [leads] = await __pool.query(`
      SELECT * FROM leads
      WHERE form_id = ?
    `, [forms[i].id]);
    for (let j = 0; j < leads.length; j++) {


      const data = {
        client_id: null,
        project_id: null,
        is_verified: 0,
        status: leads[j].status,
        is_send_discord: leads[j].is_send_discord,
        name: leads[j].name,
        ph_number: leads[j].phone,
        ip_address: leads[j].ip_address,
        source_url: '',
        email: leads[j].email,
      }



      new Promise((resolve, reject) => setTimeout(resolve, 2000));
      await addRow(process.env.SHEET_ID, forms[i].name, data, leads[j].more_fields || []);
    }
  }


}


module.exports = {
  modifyTable,
}



  