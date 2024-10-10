const express = require('express');
const axios = require('axios');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const app = express();

// Use body-parser to parse incoming form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Create a MySQL database connection
const dbConfig = {
    host: 'localhost',
    user: 'uhjdojqel1xrp',
    password: '3yfrehsrblkl',
    database: 'dbmudbaf00gr1e'
};

// POST route to handle the form submission
app.post('/submit', async (req, res) => {
    let commonData = {
        name: req.body.Name || '',
        mobile_number: req.body.Phone_Number || '',
        email: req.body.Email || '',
        source_url: 'https://lor1toapayoh.homes/',
        additional_data: []
    };

    let webhookData = {
        is_send_discord: 1,
        status: 'clear'
    };

    // Process additional fields
    for (let key in req.body) {
        if (key === 'Name') {
            webhookData.firstname = req.body.Name;
        }
        if (key === 'Email') {
            webhookData.email = req.body.Email;
        }
        if (key === 'Phone_Number') {
            webhookData.ph_number = req.body.Phone_Number;
        }
        if (key === 'Bedroom_Type' || key === 'Request_For_E-Brochure') {
            commonData.additional_data.push({
                key: key === 'Bedroom_Type' ? 'Bedroom Type' : 'Req Info',
                value: req.body[key]
            });
        }
    }

    try {
        const connection = await mysql.createConnection(dbConfig);

        // Check for junk and duplicate emails
        if (req.body.Email) {
            const checkEmail = req.body.Email;
            const [junkEmailRows] = await connection.execute(
                'SELECT COUNT(*) as count FROM leads WHERE email = ? AND status = "junk"', [checkEmail]
            );
            const [duplicateEmailRows] = await connection.execute(
                'SELECT COUNT(*) as count FROM leads WHERE email = ? AND source_url = ?', [checkEmail, commonData.source_url]
            );

            if (junkEmailRows[0].count > 0 || duplicateEmailRows[0].count > 0) {
                webhookData.status = 'junk';
                webhookData.is_send_discord = 0;
            }
        }

        // Check for junk and duplicate phone numbers
        if (req.body.Phone_Number) {
            const checkNumber = req.body.Phone_Number;
            const [junkNumberRows] = await connection.execute(
                'SELECT COUNT(*) as count FROM leads WHERE phone_number = ? AND status = "junk"', [checkNumber]
            );
            const [duplicateNumberRows] = await connection.execute(
                'SELECT COUNT(*) as count FROM leads WHERE phone_number = ? AND source_url = ?', [checkNumber, commonData.source_url]
            );

            if (junkNumberRows[0].count > 0 || duplicateNumberRows[0].count > 0) {
                webhookData.status = 'junk';
                webhookData.is_send_discord = 0;
            }
        }

        // Combine commonData into webhook data and send the requests
        webhookData = { ...webhookData, ...req.body };

        await sendFrequencyLead(commonData);
        await sendData(webhookData);

        res.status(200).send('Data submitted successfully.');
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).send('Error submitting data.');
    }
});

// Function to send lead data via axios
async function sendData(data) {
    try {
        await axios.post('http://janicez87.sg-host.com/wordpress_endpoint.php', data, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic am9tZWpvdXJuZXl3ZWJzaXRlQGdtYWlsLmNvbTpQQCQkd29yZDA5MDIxOGxlYWRzISM='
            }
        });
    } catch (error) {
        console.error('Error sending data:', error.message);
    }
}

// Function to send data to frequency lead
async function sendFrequencyLead(data) {
    try {
        await axios.post('https://roundrobin.datapoco.ai/api/lead_frequency/add_lead', data, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ' + Buffer.from('Client Management Portal:123456').toString('base64')
            }
        });
    } catch (error) {
        console.error('Error sending frequency lead:', error.message);
    }
}

// Start the Express server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

