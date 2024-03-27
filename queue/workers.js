const { Worker } = require("bullmq");
const { validateEmailFromDB, contentModeratorationAPI, contentModerationCustom, saveDataToMasterDb, changeleadtoString, saveLeadToLocalDb } = require("../utils/tools");
const { bulkDiscordSender } = require("../utils/discord");
const { bulkHookSender } = require("../utils/zappier");

let workerInstance; // Singleton worker instance

async function startWorker() {
 if (!workerInstance) {
    workerInstance = new Worker(
      "FormQueue",
      async (job) => {
        const {
            data,
            selects,
            formID
        } = job.data;
        try {
            const [rows] = await __pool.query(`SELECT * FROM forms WHERE id = ?`, [formID]);
            if (rows.length === 0) {
                throw new Error("Form not found");
            }
            const form = rows[0];
            
            const {isValid} = await validateEmailFromDB(data.email, data.ph_number, data.ip_address, job.data.referer);
            const isClean = await contentModeratorationAPI({name: data.name, email: data.email, ph_number: data.ph_number});
    
            if(contentModerationCustom(data.name) === false || contentModerationCustom(data.email) === false || contentModerationCustom(data.ph_number) === false || isValid == false || isClean == false){
                data.status = "junk";
                data.is_send_discord = 0;
                await saveDataToMasterDb(data);
                await saveLeadToLocalDb(data, form.client_id, form.id);
                console.log("Junk Lead detected. Not sending to discord or zappier." + data.email + " " + data.ph_number + " " + data.name + " " + data.ip_address);
                return ;
            }
            await saveLeadToLocalDb(data, form.client_id, form.id);
            await saveDataToMasterDb(data);
            const lead = {
                ...data,
            };
    
            const str = changeleadtoString(lead, selects, form.client_name, form.project_name);
            
            const bot_name = form.bot_name || form.name ;

            await bulkDiscordSender(form.discord, str, bot_name);
            await bulkHookSender(lead, form.zappier, form.project_name, form.client_name);            
        } catch (error) {
            console.log(error.message);
            throw error; // Rethrow the error to mark the job as failed
        }
      },
      {
        connection: {
          host: process.env.REDIS_HOST || "localhost",
          port: process.env.REDIS_PORT || 6379,
        },
      }
    );
 }
}

module.exports = startWorker;
