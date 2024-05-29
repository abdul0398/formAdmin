const express = require("express");
const router = express.Router();
const {verify } = require("../middlewares/verify");
const { getAccessToken } = require("../vendors/discord");


router
.get("/discords", verify, async (req, res, next)=>{
    res.render("discord.ejs");
}).get("/auth/discord", verify, async (req, res, next)=>{
   const {code} = req.query;
    if(!code) return res.redirect("/discord");
    try {
        const data = await getAccessToken(code);
        console.log(data);
    } catch (error) {
        console.log(error.message);
    }
})

module.exports = router;

// https://discord.com/oauth2/authorize?client_id=1245224296142344192&permissions=8&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A4000%2Fauth%2Fdiscord%2F&scope=bot+applications.commands+guilds
// MTI0NTIyNDI5NjE0MjM0NDE5Mg.GcJn1S.J0g8ZMVRvUxIyw65Fz-dCJ7ZYKKQYhgdfQki8g
// 8