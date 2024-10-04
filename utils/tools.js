const https = require('https');
const { bulkDiscordSender, sendWebhookMessage } = require('./discord');
const mysql = require('mysql2/promise');

const httpsAgent = new https.Agent({
  rejectUnauthorized: false, // Bypasses SSL certificate check;
});

function changeleadtoString(lead, selects, client_name, project_name, isManual) {

  const isWebhook = lead.is_webhook || false;


  let resultStrings = [];
  selects.forEach((select) => {
    if(select.name && select.value){

      if(select.name.toLocaleLowerCase().includes('phone')){
        const value = !select.value.startsWith('65')? `https://wa.me/+65${select.value}` : `https://wa.me/+${select.value}`;
        resultStrings.push(`●  Contact: ${value}`);
      }else{
        resultStrings.push(`●  ${select.name}: ${select.value}`);
      }


    }
  })
    const resultStr = resultStrings.join('\n');  

  let str = `New Lead please Take Note!\n=============================\n\nHello ${client_name}, you have a new lead for ${project_name}:\n`;

  if(lead.name && !isWebhook){
    str += `\n●  Name: ${lead.name}`;
  }

  if((lead.ph_number || lead.phone) && !isWebhook){
    str += `\n●  Contact: https://wa.me/+65${isManual?lead.phone: lead.ph_number}`;
  }

  str += lead.email && !isWebhook?`\n●  Email: ${lead.email}`:"";
  if(lead?.params?.utm_source){
    str += `\n●  Source: ${lead?.params?.utm_source}`;
  }
  
  str += `\n${resultStr}`;

  return str;
}



function contentModerationCustom(text) {
  if(!text) return true;
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
          return false;
        }
      }
      return true;
    } else {
      return false;
    }
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

async function validateEmailFromDB(email, ph_number, ip, source_url) {
  const validateUrl = email? 'http://janicez87.sg-host.com/check_time_email.php' :"http://janicez87.sg-host.com/check_time_phone.php";

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
      console.log('Error Saving lead to Master DB:');
     return false;
    }
    return
    // return await response.json();
  } catch (error) {
    console.error('Error Saving Data:', error);
    return false;
  }
}

async function saveLeadToLocalDb(lead, client_id, form_id, select) {

  const isTestName = containsTestNames(lead.name);
  const isTestEmail = containsTestEmails(lead.email);

  if (isTestName || isTestEmail) {
    lead.status = 'junk';
  }


  const is_read = lead.status == 'junk' ? 1 : 0;
  try {
    await __pool.query(
      `INSERT INTO leads (client_id, form_id, name, email, phone, ip_address, status, is_send_discord, more_fields, params, is_read, send_to_privyr) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [client_id, form_id, lead.name, lead.email?lead.email:"", lead.ph_number, lead.ip_address, lead.status, lead.is_send_discord, JSON.stringify(select), JSON.stringify(lead.params || []), is_read, lead.send_to_privyr]
    );
  } catch (error) {
    console.error('Error saving to local DB:', error);
  }
}

async function discordBulkSender(leads) {
 
  if(leads.length == 0) return;
  try {
    const formIds = leads.map(lead => lead.form_id);
    const [forms] = await __pool.query('SELECT * FROM forms WHERE id IN (?)', [formIds]);
    const leadsWithForms = leads.map(lead => ({
     ...lead,
      form: forms.find(form => form.id === lead.form_id)
    }));

    for (const { form, more_fields, ...lead } of leadsWithForms) {
      if (!form) {
        console.error("Form not found for a lead");
        continue;
      }
      try { 
        const selects = more_fields || [];
        const str = changeleadtoString(lead, selects, form.client_name, form.project_name, true);
        const botName = form.bot_name || form.name;
        const leadSent = await bulkDiscordSender(form.discord, str, botName); 
        if (leadSent) {
          console.log(`Discord lead send sucessfully of `, lead.name, " of form name: " , form.name, "of client name: ", form.client_name);
          await __pool.query('UPDATE leads SET is_send_discord = 1 WHERE id = ?', [lead.id]);
        }
      } catch (error) {
        console.error("Error sending to discord: of  ", form.name);
        continue;
      }
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve();
        }, 300000);
      });
      
    }
  } catch (error) {
    console.error("Error processing leads:", error);
    throw new Error(error.message);
  }
}



async function checkForDNC(phone, email){
  try {
    const res = await fetch(` https://janicez87.sg-host.com/check_dnc.php`, {
      method: 'POST',
      agent:httpsAgent,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ph_number: phone,
        email: email
      })
    });
  
    const data = await res.json();
    return data.status; 
  } catch (error) {
    console.error('error in checking dnc lead', error.message);
    return false;
  }
}


function containsTestNames(str) {
  if(!str) return false;
  const substrings = ["Aprit", "shivam", "Jome", "Test"];
  return substrings.some(substring => str.includes(substring));
}

function containsTestEmails(str) {
  if(!str) return false;
  const substrings = ["minato", "your.email", "jome", "test"];
  return substrings.some(substring => str.includes(substring));
}


async function checkDncMulti(data) {
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");


  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify(data),
    redirect: "follow"
  };

  try {
    const response = await fetch("http://janicez87.sg-host.com/check_dnc_multi.php", requestOptions);
    const result = await response.json()
    return result;
  } catch (error) {
    console.error(error);
  }
}




async function LeadsendtoDiscordRecFromWebhook(data){

  console.log(data);

  try {
    await sendWebhookMessage("https://discord.com/api/webhooks/1233668577450528808/4XCCetLSt7lPg9jrwOekVgca8grIx3zQjLhcDrRzvfoyZBgP97i4eucKBzCWe6u5oiZx", "NORWOOD GRAND PPC", data);
    return true;
  } catch (error) {
    console.log(error)
    return false
    
  }
}

async function validateDataOfWebhook(data, formId, ip){
  if (!data || !Array.isArray(data) || data.length === 0) {
    return false;
  }
  let str = `New Lead please Take Note!\n=============================\n\nHello Jovel , you have a new lead from NORWOOD GRAND PPC:\n`;

  try {
    const result = {
      email: null,
      phone: null,
      "Request for": null,
      name: null
    };
  
    data.forEach(item => {
      switch(item.type) {
        case 'email':
          result.email = item.email;
          break;
        case 'phone_number':
          result.phone = item.phone_number;
          break;
        case 'choice':
          result['Request for'] = item.choice.label;
          break;
        case 'text':
          result.name = item.text;
          break;
      }
    });

    // __pool.query(`INSERT INTO typeform_lead `)
  
    
    str += result.name?`\n●  Name: ${result.name}`:"";
    
    str += result.phone?`\n●  Contact: https://wa.me/${result.phone}`:"";

    str += result.email?`\n●  Email: ${result.email}`:"";

    str += result['Request for']?`\n●  Request for: ${result['Request for']}`:"";





    if(!result.email && ! result.phone){
      return false;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if(!emailRegex.test(result.email)){
      return false;
    }



    const promises = [
      validateEmailFromDB(result.email, result.phone, ip, `www.typeform.com/${formId}`),
      contentModeratorationAPI(result),                     
      checkForDNC(result.phone, result.email)                  
    ];

    const results = await Promise.allSettled(promises);

    console.log(results)

    const [dbValidation, customValidation, dncCheck] = results;

    const isValidFromMasterDB = dbValidation.status === 'fulfilled' && dbValidation.value;
    const isValidFromCustom = customValidation.status === 'fulfilled' && customValidation.value;
    const isDNC = dncCheck.status === 'fulfilled' && dncCheck.value;

    if (isDNC || !isValidFromCustom || !isValidFromMasterDB) {
      return false;
    }
    return str;

  } catch (error) {
    return str;
  }
}



module.exports = {
  changeleadtoString,
  contentModerationCustom,
  contentModeratorationAPI,
  validateEmailFromDB,
  saveDataToMasterDb,
  saveLeadToLocalDb,
  discordBulkSender,
  checkForDNC,
  containsTestEmails,
  containsTestNames,
  checkDncMulti,
  validateDataOfWebhook,
  LeadsendtoDiscordRecFromWebhook
};