const https = require('https');
const httpsAgent = new https.Agent({
  rejectUnauthorized: false, // Bypasses SSL certificate check;
});
async function saveDataToMasterDb(data) {
    try { 
      let headers = new Headers([
        ["Content-Type", "application/json"],
        ["Authorization", `Basic am9tZWpvdXJuZXl3ZWJzaXRlQGdtYWlsLmNvbTpQQCQkd29yZDA5MDIxOGxlYWRzISM=`]
      ]);
      let options = {
        method: "Post",
        body: JSON.stringify(data),
        mode: 'cors',
        agent:httpsAgent,
        headers: headers
      };
      const response = await fetch('http://janicez87.sg-host.com/savedata.php', options);
  
      if (!response.ok) {
        throw new Error('Failed to send data');
      }
      return
      // return await response.json();
    } catch (error) {
      console.error('Error Saving Data:', error);
      throw error;
    }
  }




  saveDataToMasterDb({
    client_id: null,
    project_id: null,
    is_verified: 0,
    status: 'clear',
    is_send_discord: 1,
    name: "name",
    ph_number: 989809809,
    ip_address: "",
    email:"email",
})