const express = require("express");
const router = express.Router();
const {verify } = require("../middlewares/verify");
const { getAccessToken, organiseDataHandler, getWebhooksInChannel, getServers, getChannelsInServer, updateAccessToken } = require("../vendors/discord");
const { validateDataOfWebhook, LeadsendtoDiscordRecFromWebhook } = require("../utils/tools");


router
.get("/discords", verify, async (req, res, next)=>{
    try {
        const [rows] = await __pool.query(`SELECT * FROM discord`);
        const organisedData = await organiseDataHandler(rows);  
        return res.render("discord.ejs", {data:organisedData,  role:req.user.role});
    } catch (error) {
        console.log("Error getting discords:", error);
    }

}).get("/auth/discord", verify, async (req, res, next)=>{
   const {code} = req.query;
    if(!code) return res.redirect("/discords");
    try {
        const data = await getAccessToken(code);
        const {refresh_token, access_token, guild} = data
        const owner_id = guild.owner_id;
        
        const [rows] = await __pool.query(`SELECT * FROM discord WHERE owner_id = ?`, [owner_id]);
        if(rows.length > 0){
            // Update the access token
            const expires_on = Date.now() + 604800;
            await __pool.query(`UPDATE discord SET access_token =?, expires_on =?, refresh_token =? WHERE owner_id =?`, [access_token, expires_on, refresh_token, owner_id]);
            return res.redirect("/discords");
        }

        const expires_on = Date.now() + 604800;
        await __pool.query(`INSERT INTO discord (access_token, owner_id, refresh_token, expires_on) VALUES (?, ?, ?, ?)`, [access_token, owner_id, refresh_token, expires_on]);
        res.redirect("/discords");
    } catch (error) {
        console.error("Error getting access token:", error);
        res.redirect("/discords?error=access_token_error");
    }
}).delete("/api/discord/delete/:id", verify, async (req, res, next)=>{
    const {id} = req.params;
    if(!id) return res.redirect("/discord");
    try {
        await __pool.query(`DELETE FROM discord WHERE id = ?`, [id]);
        res.status(200).json({message:"Deleted"});
    } catch (error) {
        console.log("Error deleting discord:", error);
        res.status(500).json({message:"Error deleting discord"});
    }
}).get("/api/discord/getServers", verify, async (req, res, next)=>{
    try {
        const [rows] = await __pool.query(`SELECT * FROM discord`);
        if(rows.length < 1) return res.status(404).json({message:"Not Found"});
        const finalData = [];
        for (let element of rows) {
            const {access_token, owner_id, refresh_token, expires_on} = element;
            if (Date.now() > expires_on) {
                const data = await updateAccessToken(owner_id, refresh_token);
                access_token = data.access_token;
              }
            const data = await getServers(access_token);
            finalData.push(...data);
        }
        res.status(200).json(finalData);
    } catch (error) {
        console.log("Error getting servers and channels:", error);
        res.status(500).json({message:"Error getting servers and channels"});
    }
}).get("/api/discord/channels/:id", verify, async (req, res, next)=>{
    const {id} = req.params;
    if(!id) return res.status(400).json({message:"Invalid ID"});
    try {
        const data = await getChannelsInServer(id);
        res.status(200).json(data);
    } catch (error) {
        console.log("Error getting servers and channels:", error);
        res.status(500).json({message:"Error getting servers and channels"});
    }

}).get(`/api/discord/webhooks/:channelId`, verify, async (req,res)=>{
    const {channelId} = req.params;
    if(!channelId) return res.status(400).json({message:"Invalid Channel ID"});
    try {
        const data = await getWebhooksInChannel(channelId);
        res.status(200).json(data);
    } catch (error) {
        console.log("Error getting servers and channels:", error);
        res.status(500).json({message:"Error getting servers and channels"});
    }
}).post('/api/google-sheet/discord', async (req, res)=>{
    const {form_response} = req.body;
    const formId = form_response?.form_id || 'dsjfldsfjslsj';
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress 
    const answers = form_response?.answers || [];
    const isValid = await validateDataOfWebhook(answers, formId, ip)

    console.log(isValid)

    if(isValid){
        LeadsendtoDiscordRecFromWebhook(isValid);
    }


    res.status(200).json({message:"Successfully recieved"})
})


module.exports = router;