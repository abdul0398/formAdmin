const nodemailer = require('nodemailer');
async function initializeNodemailer(sender_email, app_pass) {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true, // use SSL
            auth: {
                user: sender_email,
                pass: app_pass
            }
        })
        return transporter;
    } catch (error) {
        console.log(error.message);
    }
}

async function sendMail(lead, receive_email) {

    const sender_email = process.env.SENDER_EMAIL;
    const app_pass = process.env.APP_PASS;
    console.log(sender_email, app_pass, receive_email);
    try {
        const transporter = await initializeNodemailer(sender_email, app_pass);
        const info = await transporter.sendMail({
            from: `${sender_email}`,
            to: `${receive_email}`,
            subject: "Got a New Lead",
            text: `\n${lead} `
        });
        return info;
    } catch (error) {
        console.error(error.message);
    }
}

module.exports = {
    sendMail
}
