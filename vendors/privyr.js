const axios = require('axios');

const sendDataToPrivyrWebhook = async (form_name, webhookUrl, data, selects) => {
  const headers = {
    'Content-Type': 'application/json'
  };

  const questions = {};

  selects.forEach((select) => {
    questions[select.name] = select.value
  })



  const allData = {
    name: data.name,
    email: data.email,
    phone: `+65${data.ph_number}`,
    display_name: data.name,
    source:form_name
  }

  if(data?.params?.utm_source){
    allData.source = data.params.utm_source
  }

  allData.other_fields = questions;



  try {
    const response = await axios.post(webhookUrl, allData, { headers });
    const status = response?.data?.success || false;
    if(status){
      console.log('Data sent to Privyr Webhook for lead ',data.name, " sucessfully on ", new Date().toISOString()); 
    }
    return status;
  } catch (error) {
    console.error('Error in sending data to Privyr Webhook for lead ',data.name," ", error.message);
    return false;
  }
};

module.exports = {
    sendDataToPrivyrWebhook
}