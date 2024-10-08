const express = require("express");
const router = express.Router();
const passport = require("passport");
const {verify } = require("../middlewares/verify");
const { discordBulkSender, checkDncMulti } = require("../utils/tools");


router
.get("/leads", verify, async (req, res, next)=>{
    if(req?.user?.role == "user_2"){
        next();
        return;
    }
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
        discordBulkSender(leads);
        res.status(200).json({message: "Leads started sending to Discord"});
    } catch (error) {
        console.log(error);
        res.status(500).json({error: error.message});
    }
}).get("/api/status/dnc", verify, async (req, res)=>{

    try {
        // Fetch distinct phone numbers
        const [rows] = await __pool.query('SELECT DISTINCT phone FROM leads');
        const phones = rows.map(row => row.phone);
    

        // // Check DNC status
        const result = await checkDncMulti(phones);    
        const phoneWithDNC = result.filter(phone => phone.status === 'DNC Registry').map(phone => phone.phone);
        

        if (phoneWithDNC.length === 0) {
          return res.status(200).json({ msg: 'Successfully Synced the DNC status' });
        }
    
        // Update the DNC status
        await __pool.query('UPDATE leads SET status = ? WHERE phone IN (?)', ['dnc', phoneWithDNC]);
    
        return res.status(200).json({ msg: 'Successfully Synced the DNC status' });
    
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'An error occurred while syncing the DNC status' });
      }

})


module.exports = router;