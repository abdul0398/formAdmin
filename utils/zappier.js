async function bulkHookSender(lead, hooklinks, projectName, clientName){
   for (let i = 0; i < hooklinks.length; i++) {
         const hooklink = hooklinks[i];
         sendToHooks(lead, hooklink, projectName, clientName);
   }

}







async function sendToHooks(lead, hooklink, projectName, clientName, selects){
    const cleanLead = {
        name: lead.name,
        email:lead.email,
        phone:lead.ph_number,
        ip:lead.ip_address,
        projectName:projectName,
        clientName:clientName
    }
    
    selects.forEach(element => {
        cleanLead[element.name] = element.value;
    });

    

        const res = await fetch(hooklink, {
            method: "POST",
            body: JSON.stringify(cleanLead)
        })
        const data = await res.json();
       
}


module.exports = {sendToHooks, bulkHookSender};