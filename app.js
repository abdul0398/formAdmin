require('dotenv').config()
const setMiddleWares = require("./middlewares/express.js");
const {userRouter, formRouter, clientRouter, leadRouter, discordsRouter} = require("./routes");
const setupDb = require("./services/dbHandler.js");
const schedule = require('node-schedule');

const { getServersAndChannels } = require('./vendors/discord.js');
const { discordBulkSender } = require('./utils/tools.js');
const { GetSpreadSheet, createSheet, addRow } = require('./services/googleSheets.js');
const { modifyTable } = require('./script.js');
async function start() {
    const port = process.env.PORT || 4000;
    const {app, express} = await setMiddleWares();
    await setupDb();
    app.use("/uploads", express.static("uploads"));
    app.use([userRouter, formRouter, clientRouter, leadRouter, discordsRouter]);
    app.use((req,res)=>{
        res.render("error.ejs");
    })
    app.listen(port, async ()=>{
        console.log(`##### Express Server Started at port ${port} #####`);
    })

    const rule = new schedule.RecurrenceRule();
    // rule.hour = 2;
    rule.minute = 0;
    // const job = schedule.scheduleJob(rule, async function(){
    //     console.log('Checking the pending leads and trying to send on discord ',new Date().toLocaleString());
    // const [leads] = await __pool.query(`
    //          SELECT * FROM leads 
    //          WHERE is_send_discord = 0 
    //         AND DATE(created_at) = CURDATE()
    //         AND status = 'clear'
    //          `);
    //     await discordBulkSender(leads)
    // });

    // const data = await GetSpreadSheet('1ggIHUaTjIX1jw6Aol1Vb2I56VEEOXKbyJPaGcRHvkTE');
    // await modifyTable()
}
start();