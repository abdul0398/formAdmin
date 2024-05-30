require('dotenv').config()
const setMiddleWares = require("./middlewares/express.js");
const {userRouter, formRouter, clientRouter, leadRouter, discordsRouter} = require("./routes");
const setupDb = require("./services/dbHandler.js");
const { getServersAndChannels } = require('./vendors/discord.js');
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

}
start();