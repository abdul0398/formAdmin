const axios = require('axios');

async function sendWebhookMessage(hookURL, projectName, msg) {
  try {
    const response = await axios.post(hookURL, {
      content: msg,
      username:projectName
    });
    return response
  } catch (error) {
    throw new Error(error.message);
  }
}

async function bulkDiscordSender(discords, leadStr, botName){
  if(!discords || !Array.isArray(discords) || discords.length === 0 || discords[0] === "") return false;
  console.log(discords);
  let leadSent = false;
try {
  for(let dsLink of discords){
    try {
      await sendWebhookMessage(dsLink, botName , leadStr);
      leadSent = true;
    } catch (error) {
      console.log("Error sending to discord: on", dsLink, "of Form ", botName);
      continue;
      
    }
  }
  return leadSent;
} catch (error) {
  console.log("Error sending lead to discord");
  return false
}
  
}
module.exports = {sendWebhookMessage, bulkDiscordSender};