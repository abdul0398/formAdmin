require('dotenv').config()
const setMiddleWares = require("./middlewares/express.js");
const {userRouter, formRouter, clientRouter} = require("./routes");
const crypto = require("crypto");
const setupDb = require("./services/dbHandler.js");
async function start() {
    const port = process.env.PORT || 4000;
    const {app, express} = await setMiddleWares();
    await setupDb();
    app.use("/uploads", express.static("uploads"));
    app.use([userRouter, formRouter, clientRouter]);
    app.use((req,res)=>{
        res.render("error.ejs");
    })
    app.listen(port, async ()=>{
        console.log(`##### Express Server Started at port ${port} #####`);
    })
}
start();