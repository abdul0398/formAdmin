const { Worker } = require("bullmq");
const { validateEmailFromDB, contentModeratorationAPI, contentModerationCustom, saveDataToMasterDb, changeleadtoString, saveLeadToLocalDb } = require("../utils/tools");
const { bulkDiscordSender } = require("../utils/discord");
const {sendToHooks } = require("../utils/zappier");
const { sendMail } = require("../services/mailHandler");
const { addRow } = require("../services/googleSheets");

let workerInstance;

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
            const {isValid} = data.email? await validateEmailFromDB(data.email, data.ph_number, data.ip_address, data.source_url) : {isValid: true};
            const isClean = await contentModeratorationAPI({name: data.name, email: data.email, ph_number: data.ph_number});

            const isTestingDetails =  data.email && data.email.toLowerCase() == "jometesting@gmail.com" && data.ph_number == "91111111";
    
            if((contentModerationCustom(data.name) === false || (data.email && contentModerationCustom(data.email) === false) || contentModerationCustom(data.ph_number) === false || isValid == false || isClean == false) && isTestingDetails == false){
                data.status = "junk";
                data.is_send_discord = 0;
                await saveDataToMasterDb(data);
                await saveLeadToLocalDb(data, form.client_id, form.id, selects);
                console.log("Junk Lead detected. Not sending to discord or zappier." + data.email + " " + data.ph_number + " " + data.name + " " + data.ip_address);
                return ;
            }
            const lead = {
                ...data,
            };
    
            const str = changeleadtoString(lead, selects, form.client_name, form.project_name);  
            const bot_name = form.bot_name || form.name ;
            const leadSent = await bulkDiscordSender(form.discord, str, bot_name);
            await sendToHooks(lead, form.zappier, form.project_name, form.client_name, selects);  
            await sendMail(str, form.email);        
            if(!leadSent){
              data.is_send_discord = 0;
            }
            await saveLeadToLocalDb(data, form.client_id, form.id, selects);
            await saveDataToMasterDb(data);
            if(form.client_id == process.env.CLIENT_ID){
              await addRow(process.env.SHEET_ID, form.name, data, selects);
            }
          } catch (error) {
            console.log(error.message);
            throw error;
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
