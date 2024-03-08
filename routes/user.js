const express = require("express");
const router = express.Router();
const passport = require("passport");
const {verify } = require("../middlewares/verify");


router
.get("/", verify, (req,res)=>{
    res.redirect("/clients")
})
.get("/login", (req,res)=>{
    res.render("login.ejs");
})
.post("/login", passport.authenticate('user', {
    failureRedirect: '/login',
    failureFlash: true
}), (req, res)=>{
    res.redirect("/");
}).get("/logout", async (req,res)=>{
    req.logOut((done)=>{
        res.redirect('/login');
    });
})

module.exports = router;