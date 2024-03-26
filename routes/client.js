const express = require("express");
const { verify } = require("../middlewares/verify");

const router = express.Router();

router.get("/clients", verify, async (req, res, next)=>{
    try {
        const [rows] = await __pool.query(`SELECT * FROM clients`);
        res.render("clients.ejs", {clients:rows, admin:req.user.role === "admin"});
    } catch (error) {
        console.log(error.message);
        next();
    }

}).post("/api/client/create", verify, async (req, res)=>{
    const {name} = req.body;
    try {
        const [rows] = await __pool.query(`SELECT * FROM clients WHERE name = ?`, [name]);
        if(rows.length > 0){
            return res.status(401).json({message:"Client with this name already exists"});
        }
        const [row] = await __pool.query(`INSERT INTO clients (name) VALUES(?)`, [name]);
        res.status(200).json({id:row.insertId});
    } catch (error) {
        
        console.log(error.message);
        res.status(500).json({message:error.message});
    }
}).get("/api/client/fetch/:id", verify, async (req, res)=>{
    const {id} = req.params;
    try {
        const [rows] = await __pool.query(`SELECT * FROM clients WHERE id = ?`, [id]);
        const [forms] = await __pool.query(`SELECT * FROM forms WHERE client_id = ?`, [id]);
        if(rows.length === 0){
            return res.status(404).json({message:"Client not found"});
        }
        res.status(200).json({client:rows[0], forms:forms});
    } catch (error) {
        console.log(error.message);
        res.status(500).json({message:error.message});
    }
}).post("/api/client/update/:id", verify, async (req, res)=>{
    const {id} = req.params;
    const {name} = req.body;
    try {
        const [rows] = await __pool.query(`SELECT * FROM clients WHERE id = ?`, [id]);
        if(rows.length === 0){
            return res.status(404).json({message:"Client not found"});
        }
        // check existing client with same name
        const [row] = await __pool.query(`SELECT * FROM clients WHERE name = ? AND id != ?`, [name, id]);
        if(row.length > 0){
            return res.status(400).json({message:"Client with this name already exists"});
        }
        await __pool.query(`UPDATE clients SET name = ? WHERE id = ?`, [name, id]);
        res.status(200).json("Client Updated Successfully with name "+ name);
    } catch (error) {
        console.log(error.message);
        res.status(400).json({message:error.message});
    }
}).get("/api/client/delete/:id", verify, async (req, res)=>{
    const {id} = req.params;
    try {
        const [rows] = await __pool.query(`SELECT * FROM clients WHERE id = ?`, [id]);
        if(rows.length === 0){
            return res.status(404).json({message:"Client not found"});
        }
        await __pool.query(`DELETE FROM clients WHERE id = ?`, [id]);
        res.status(200).json("Client Deleted Successfully");
    } catch (error) {
        console.log(error.message);
        res.status(500).json({message:error.message});
    }

})
module.exports = router;