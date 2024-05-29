const express = require("express");
const router = express.Router();
const {verify } = require("../middlewares/verify");
const { getAccessToken, organiseDataHandler } = require("../vendors/discord");


router
.get("/discords", verify, async (req, res, next)=>{
    try {
        const [rows] = await __pool.query(`SELECT * FROM discord`);
        const organisedData = await organiseDataHandler(rows);  
        return res.render("discord.ejs", {data:organisedData});
    } catch (error) {
        console.log("Error getting discords:", error);
    }

}).get("/auth/discord", verify, async (req, res, next)=>{
   const {code} = req.query;
    if(!code) return res.redirect("/discord");
    try {
        const data = await getAccessToken(code);
        const {refresh_token, access_token, guild} = data
        const owner_id = guild.owner_id;
        
        const [rows] = await __pool.query(`SELECT * FROM discord WHERE owner_id = ?`, [owner_id]);
        if(rows.length > 0){
            return res.redirect("/discord?error=already_exists");
        }

        const expires_on = Date.now() + 604800;
        await __pool.query(`INSERT INTO discord (access_token, owner_id, refresh_token, expires_on) VALUES (?, ?, ?, ?)`, [access_token, owner_id, refresh_token, expires_on]);
        res.redirect("/discord");
    } catch (error) {
        console.error("Error getting access token:", error);
        res.redirect("/discord?error=access_token_error");
    }
}).post("/discord/webhook", verify, async (req, res, next)=>{
    
});

module.exports = router;

// https://discord.com/oauth2/authorize?client_id=1245224296142344192&permissions=8&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A4000%2Fauth%2Fdiscord%2F&scope=bot+applications.commands+guilds
// MTI0NTIyNDI5NjE0MjM0NDE5Mg.GcJn1S.J0g8ZMVRvUxIyw65Fz-dCJ7ZYKKQYhgdfQki8g
// 8