const https = require('https');
const httpsAgent = new https.Agent({
  rejectUnauthorized: false, // Bypasses SSL certificate check;
});

function changeleadtoString(lead, selects, client_name, project_name) {
  let resultStrings = [];
  selects.forEach((select) => {
    resultStrings.push(`●  ${select.name}: ${select.value}`);
  })
    const resultStr = resultStrings.join('\n');  

  const result = resultStrings.join('\n');
  const str = `New Lead please Take Note!\n=============================\n\nHello ${client_name}, you have a new lead :\n\n●  Name: ${lead.name}\n●  Contact: https://wa.me/${lead.ph_number}\n●  Email: ${lead.email}\n${resultStr}`;
  return str;
}


function contentModerationCustom(text) {
  const blacklistWords = [
    'chee bye',
    'chao chee bye',
    'fucking',
    'agent',
    'mama',
    'fuck',
    'stupid',
    'demo',
  ];

  for (let i = 0; i < blacklistWords.length; i++) {
    if (text.toLowerCase().includes(blacklistWords[i].toLowerCase())) {
      errors.push(`Text contains forbidden word: "${blacklistWords[i]}"`);
      return false;
    }
  }
  return true;
}

 
async function contentModeratorationAPI(props) {
  const subscriptionKey = '453fe3c404554800bc2c22d7ef681542';
  const url = 'https://jomejourney.cognitiveservices.azure.com/contentmoderator/moderate/v1.0/ProcessText/Screen';

  try {
    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      agent:httpsAgent,
      headers: {
        'Content-Type': 'text/plain',
        'Ocp-Apim-Subscription-Key': subscriptionKey,
      },
      body: JSON.stringify(props),
    });

    if (response.ok) {
      const responseBody = await response.json();
      if (responseBody.hasOwnProperty('Terms')) {
        if (responseBody.Terms && responseBody.Terms.length > 0) {
          errors.push("Content contains forbidden terms.");
          return false;
        }
      }
      return true;
    } else {
      errors.push("Error, Please try submitting again !");
      return false;
    }
  } catch (error) {
    console.error('Error:', error);
    errors.push("Error accessing moderation API.")
    return false;
  }
}

async function validateEmailFromDB(email, ph_number, ip, source_url) {
  const validateUrl = 'http://janicez87.sg-host.com/check_time_email.php';

  try {
    const response = await fetch(validateUrl, {
      method: 'POST',
      // mode: 'cors',
      agent:httpsAgent,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        source_url: source_url,
        ip: ip,
        ph_number:ph_number
      })
    });

    if (response.ok) {
      const validationData = await response.json();
      return validationData;
    } else {
      console.error('Error fetching validation URL:', response.statusText);
      return false;
    }
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

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

async function saveLeadToLocalDb(lead, client_id, form_id) {
  try {
    await __pool.query(
      `INSERT INTO leads (client_id, form_id, name, email, phone, ip_address, status, is_send_discord) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [client_id, form_id, lead.name, lead.email, lead.ph_number, lead.ip_address, lead.status, lead.is_send_discord]
    );
  } catch (error) {
    console.error('Error saving to local DB:', error);
  }
}

module.exports = {
  changeleadtoString,
  contentModerationCustom,
  contentModeratorationAPI,
  validateEmailFromDB,
  saveDataToMasterDb,
  saveLeadToLocalDb
};