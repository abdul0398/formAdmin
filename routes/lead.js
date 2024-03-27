const express = require("express");
const router = express.Router();
const passport = require("passport");
const {verify } = require("../middlewares/verify");


router
.get("/leads", verify, async (req, res, next)=>{
    try {
        const [clients] = await __pool.query(`SELECT * FROM clients`);
        const [forms] = await __pool.query(`SELECT * FROM forms`);
        res.render("leads.ejs", {clients, forms})
    } catch (error) {
        console.error(error);
        next();
    }

}).get("/api/fetch/leads", verify, async (req, res, next)=>{
    try {
        const query = `
            SELECT 
                leads.id,
                leads.client_id,
                leads.form_id,
                leads.name,
                leads.email,
                leads.phone,
                leads.ip_address,
                leads.status,
                leads.is_send_discord,
                leads.created_at,
                leads.updated_at,
                clients.name AS client_name,
                forms.name AS form_name
            FROM 
                leads
            JOIN 
                clients ON leads.client_id = clients.id
            JOIN 
                forms ON leads.form_id = forms.id
        `;
        const [leads] = await __pool.query(query);
        res.status(200).json(leads);
    } catch (error) {
        console.error(error);
        next();
    }
})


module.exports = router;