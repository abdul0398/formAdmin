const {Queue}  =  require("bullmq")


const myQueue = new Queue("FormQueue", {
    connection:{
        host:process.env.REDIS_HOST || "localhost",
        port:process.env.REDIS_PORT || 6379
    }
});
async function producer(data, selects, formID){
    const res = await myQueue.add('validateAndPush',
    { 
        data,
        selects,
        formID
    });
    return res;
}


module.exports = producer;