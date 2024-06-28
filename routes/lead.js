const express = require("express");
const router = express.Router();
const passport = require("passport");
const {verify } = require("../middlewares/verify");
const { discordBulkSender } = require("../utils/tools");


router
.get("/leads", verify, async (req, res, next)=>{
    try {
        const [clients] = await __pool.query(`SELECT * FROM clients ORDER BY name ASC`);
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
                leads.is_read,
                leads.params,
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
            WHERE 
                leads.email NOT LIKE '%jome%' 
                AND leads.email NOT LIKE '%test%'
                AND leads.name NOT LIKE '%test%'
                AND leads.name NOT LIKE '%jome%'
            ORDER BY 
                leads.created_at DESC;
        `;

        
        
        const [leads] = await __pool.query(query);
        res.status(200).json(leads);
    } catch (error) {
        console.error(error);
        next();
    }
}).post("/api/leads/status/:status", verify, async (req,res)=>{
    const { ids } = req.body;
    const { status } = req.params;  
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Invalid input' });
    }
    try {

        let field = 'status';
        let value = status;
        if(status == "read"){
            field = 'is_read';
            value = 1;
        }

        const query = `
        UPDATE leads
        SET ${field} = ?
        WHERE id IN (?)
    `;
        await __pool.query(query, [value, ids]);
        res.status(200).json({ message: `Leads marked as ${status} successfully`});
    } catch (error) {
        console.error('Error marking leads as junk:', error);
        res.status(500).json({ error: 'An error occurred while updating the leads' });
    }

}).post("/api/leads/sendTodiscord/", verify, async (req, res, next)=>{
    const {ids} = req.body;
    try {
        // get all leads with the ids
        const [leads] = await __pool.query(`SELECT * FROM leads WHERE id IN (?)`, [ids]);
        await discordBulkSender(leads);
        res.status(200).json({message: "Leads sent to discord successfully"});
    } catch (error) {
        console.log(error);
        res.status(500).json({error: error.message});
    }
})


module.exports = router;