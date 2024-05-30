const axios = require('axios');

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_API_ENDPOINT = 'https://discord.com/api/v10';

// Utility function to create URL-encoded form data
function createFormData(data) {
  return Object.keys(data).map(key => key + '=' + encodeURIComponent(data[key])).join('&');
}

async function getAccessToken(code) {
  const data = createFormData({
    grant_type: 'authorization_code',
    code,
    redirect_uri: 'http://localhost:4000/auth/discord/'
  });

  const response = await axios.post(`${DISCORD_API_ENDPOINT}/oauth2/token`, data, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    auth: { username: DISCORD_CLIENT_ID, password: DISCORD_CLIENT_SECRET }
  });

  return response.data;
}

async function getNewAccessToken(refresh_token) {
  const data = createFormData({ grant_type: 'refresh_token', refresh_token });

  const response = await axios.post(`${DISCORD_API_ENDPOINT}/oauth2/token`, data, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    auth: { username: DISCORD_CLIENT_ID, password: DISCORD_CLIENT_SECRET }
  });

  return response.data;
}

async function getUserInfo(access_token) {
  const response = await axios.get(`${DISCORD_API_ENDPOINT}/users/@me`, {
    headers: { Authorization: `Bearer ${access_token}` }
  });

  return response.data;
}

async function updateAccessToken(owner_id, refresh_token) {
  const data = await getNewAccessToken(refresh_token);
  const { access_token: newAccess_token, expires_in, refresh_token: newRefresh_token } = data;

  // Assuming __pool is a MySQL connection pool instance
  await __pool.query(
    `UPDATE discord SET access_token =?, expires_on =?, refresh_token =? WHERE owner_id =?`,
    [newAccess_token, Date.now() + expires_in * 1000, newRefresh_token, owner_id]
  );

  console.log(`Updated access token for owner_id ${owner_id}`);
  return data;
}

async function organiseDataHandler(rows) {
  const finalData = [];

  for (let element of rows) {
    let { access_token, owner_id, refresh_token, expires_on } = element;
    if (Date.now() > expires_on) {
      const data = await updateAccessToken(owner_id, refresh_token);
      access_token = data.access_token;
    }
    const userInfo = await getUserInfo(access_token);
    finalData.push({ email: userInfo.email, id: element.id });
  }

  return finalData;
}


async function getServers(access_token) {
  try {
    const response = await axios.get(`${DISCORD_API_ENDPOINT}/users/@me/guilds`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    if (response.status!== 200) {
      throw new Error(`Failed to fetch guilds: ${response.statusText}`);
    }

    const servers = response.data;
    console.log(servers);
    let owned_servers = [];
    for (let server of servers) {
      if(server.owner){
        owned_servers.push(server)
      }
      // const res = await getChannelsInServer(server.id);
      // if(server.owner && res.status == 200){
        // owned_servers.push(server)
      // }
    }
    return owned_servers;
  } catch (error) {
    console.error("Error fetching servers and channels:", error.message);
    return [];
  }
}


async function getChannelsInServer(serverId) {
  try {
    const response = await axios.get(`${DISCORD_API_ENDPOINT}/guilds/${serverId}/channels`, {
      headers: { Authorization: `Bot MTI0NTIyNDI5NjE0MjM0NDE5Mg.GcJn1S.J0g8ZMVRvUxIyw65Fz-dCJ7ZYKKQYhgdfQki8g` }
    });

    if (response.status !== 200) {
      throw new Error(`Failed to fetch channels for guild ${serverId}: ${response.statusText}`);
    }

    return response.data;
  } catch (error) {
    console.error(`Error fetching channels for guild ${serverId}:`, error.message);
    return [];
  }
}




async function getWebhooksInChannel(channelId) {
  try {
    const response = await axios.get(`${DISCORD_API_ENDPOINT}/channels/${channelId}/webhooks`, {
      headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` }
    });

    if (response.status!== 200) {
      throw new Error(`Failed to fetch webhooks: ${response.statusText}`);
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching webhooks:", error.message);
    return [];
  }
}


module.exports = {
  getAccessToken,
  organiseDataHandler,
  getUserInfo,
  updateAccessToken,
  getServers,
  getWebhooksInChannel,
  getChannelsInServer
};
