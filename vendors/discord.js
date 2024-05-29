const axios = require("axios");
// async function getAccessToken(code){
//     const data = {
//         client_id: ,
//         client_secret: ,
//         grant_type: "authorization_code",
//         code: code,
//         redirect_uri: "",
//         scope: "bot applications.commands guilds"
//     }
//     const response = await axios.post("https://discord.com/api/oauth2/token", data);
//     return response.data;
// }
async function getAccessToken(code) {
    console.log(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_CLIENT_SECRET);
    try {
      const data = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: 'http://localhost:4000/auth/discord/'
      });
  
      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
      };
  
      const response = await axios.post(`https://discord.com/api/v10/oauth2/token`, data, {
        headers: headers,
        auth: {
          username: process.env.DISCORD_CLIENT_ID,
          password: process.env.DISCORD_CLIENT_SECRET
        }
      });
  
      return response.data;
    } catch (error) {
      console.error('Error exchanging code:', error.response ? error.response.data : error.message);
      throw error;
    }
  }

module.exports = {
    getAccessToken
}