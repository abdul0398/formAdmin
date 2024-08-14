const axios = require("axios");

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_API_ENDPOINT = "https://discord.com/api/v10";

// Utility function to create URL-encoded form data
function createFormData(data) {
  return Object.keys(data)
    .map((key) => key + "=" + encodeURIComponent(data[key]))
    .join("&");
}
async function getAccessToken(code) {
  try {
    const data = createFormData({
      grant_type: "authorization_code",
      code,
      redirect_uri: "https://form.jomejourney-portal.com/auth/discord",
    });

    const response = await axios.post(
      `${DISCORD_API_ENDPOINT}/oauth2/token`,
      data,
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        auth: { username: DISCORD_CLIENT_ID, password: DISCORD_CLIENT_SECRET },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error getting access token:", error.message);
    throw error;
  }
}

async function getNewAccessToken(refresh_token) {
  try {
    const data = createFormData({ grant_type: "refresh_token", refresh_token });

    const response = await axios.post(
      `${DISCORD_API_ENDPOINT}/oauth2/token`,
      data,
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        auth: { username: DISCORD_CLIENT_ID, password: DISCORD_CLIENT_SECRET },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error getting new access token:", error.message);
    throw error;
  }
}

async function getUserInfo(access_token) {
  try {
    const response = await axios.get(`${DISCORD_API_ENDPOINT}/users/@me`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    return response.data;
  } catch (error) {
    console.error("Error getting user info:", error.message);
    throw error;
  }
}

async function updateAccessToken(owner_id, refresh_token) {
  try {
    const data = await getNewAccessToken(refresh_token);
    const {
      access_token: newAccess_token,
      expires_in,
      refresh_token: newRefresh_token,
    } = data;

    // Assuming __pool is a MySQL connection pool instance
    await __pool.query(
      `UPDATE discord SET access_token =?, expires_on =?, refresh_token =? WHERE owner_id =?`,
      [
        newAccess_token,
        Date.now() + expires_in * 1000,
        newRefresh_token,
        owner_id,
      ]
    );

    console.log(`Updated access token for owner_id ${owner_id}`);
    return data;
  } catch (error) {
    console.error(`Error updating access token for owner_id ${owner_id}:`, error.message);
    throw error.message;
  }
}

async function organiseDataHandler(rows) {
  const finalData = [];

  for (let element of rows) {
    let { access_token, owner_id, refresh_token, expires_on } = element;
    try {
      if (Date.now() > expires_on) {
        const data = await updateAccessToken(owner_id, refresh_token);
        access_token = data.access_token;
      }
      const userInfo = await getUserInfo(access_token);
      finalData.push({ email: userInfo.email, id: element.id });
    } catch (error) {
      console.error(`Error processing owner_id ${owner_id}:`, error.message);
      // Optionally, you can continue processing other rows or handle this differently
    }
  }

  return finalData;
}
async function getServers(access_token) {
  try {
    const response = await axios.get(
      `${DISCORD_API_ENDPOINT}/users/@me/guilds`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );

    if (response.status !== 200) {
      throw new Error(`Failed to fetch guilds: ${response.statusText}`);
    }

    const servers = response.data;
    let owned_servers = [];
    for (let server of servers) {
        const res = await getChannelsInServer(server.id);
        if (res.length > 0) {
          owned_servers.push(server);
        }
    }
    return owned_servers;
  } catch (error) {
    console.error("Error fetching servers and channels:", error.message);
    return [];
  }
}

async function getChannelsInServer(serverId) {
  try {
    let config = {
      method: "get",
      maxBodyLength: Infinity,
      url: `https://discord.com/api/v10/guilds/${serverId}/channels`,
      headers: {
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
      },
    };

    const res = await axios.request(config);

    if (res.status !== 200) {
      throw new Error(
        `Failed to fetch channels for guild ${serverId}: ${res.statusText}`
      );
    }

    return res.data;
  } catch (error) {
    console.error(
      `Error fetching channels for guild ${serverId}:`,
      error.message
    );
    return [];
  }
}

async function getWebhooksInChannel(channelId) {
  try {
    const response = await axios.get(
      `${DISCORD_API_ENDPOINT}/channels/${channelId}/webhooks`,
      {
        headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
      }
    );

    if (response.status !== 200) {
      throw new Error(`Failed to fetch webhooks: ${response.statusText}`);
    }

    if(!response.data || response.data.length == 0){
      const data = await createWebhooksInChannel(channelId);
      return [data]
    }
    return response.data;
  } catch (error) {
    console.error("Error fetching webhooks:", error.message);
    return [];
  }
}

async function createWebhooksInChannel(channelId) {


  try {
    const response = await axios.post(
      `${DISCORD_API_ENDPOINT}/channels/${channelId}/webhooks`,
      {name:"new_webhook"},
      {
        headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
      }
    );

    if (response.status !== 200) {
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
  getChannelsInServer,
};



