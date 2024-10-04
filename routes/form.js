const express = require("express");
const { verify } = require("../middlewares/verify");
const producer = require("../queue/producer");
const startWorker = require("../queue/workers");
const { createSheet, renameSheet } = require("../services/googleSheets");
const router = express.Router();
const ejs = require('ejs');
const path = require('path');

router
  .get("/form/:id", async (req, res, next) => {
    const { id } = req.params;
    const { formtype, reqtype, devtext, label, newfield, noemail, noselect1, noselect2, reqselect1, reqselect2, placeselect1, placeselect2, showselect1, showselect2, noconsent, sitename, noplaceholder1, noplaceholder2, reqprivacy } = req.query;
    if (!["chatbot", "registration", "header", "footer"].includes(formtype)) {
      return next();
    }
    try {
      const [rows] = await __pool.query(`SELECT * FROM forms WHERE id = ?`, [
        id,
      ]);
      if (rows.length === 0) {
        return next();
      }
      const bedroomOptions = rows[0].form_fields.find((elem) => {
        return elem.name === "bedroom";
      });

      const requestOptions = rows[0].form_fields.find((elem) => {
        return elem.name === "request";
      });

      const inputLable = rows[0].form_fields.filter((elem) => {
        return elem.name == "name";
      });

      const emailLable = rows[0].form_fields.filter((elem) => {
        return elem.name == "email";
      });

      const phoneLable = rows[0].form_fields.filter((elem) => {
        return elem.name == "phone";
      });



      return res.render("form.ejs", {
        form: rows[0],
        createdFields: rows[0].created_form_fields,
        inputLabel: inputLable[0].label,
        emailLabel: emailLable[0].label,
        phoneLabel: phoneLable[0].label,
        bedroomOptions: bedroomOptions.options ? bedroomOptions.options : [],
        requestOptions: requestOptions.options ? requestOptions.options : [],
        bedroomLabel: bedroomOptions.label,
        requestLabel: requestOptions.label,
        formType: formtype,
        reqtype: reqtype,
        devtext: devtext,
        label: label,
        noemail:noemail,
        noselect1:noselect1,
        noselect2:noselect2,
        reqselect1:reqselect1,
        reqselect2:reqselect2,
        placeselect1:placeselect1,
        placeselect2:placeselect2,
        showselect1: showselect1,
        showselect2: showselect2,
        noconsent:noconsent,
        sitename:sitename,
        reqprivacy:reqprivacy,
        createdFieldsFlag: newfield,
        noplaceholder1,
        noplaceholder2,
      });
    } catch (error) {
      console.log(error.message);
      next();
    }
  }).get("/api/form/:id", async (req, res, next) => {
  
  const { id } = req.params;
  const { formtype, reqtype, devtext, label, newfield, noemail, noselect1, noselect2, reqselect1, reqselect2, placeselect1, placeselect2, showselect1, showselect2, noconsent, sitename, noplaceholder1, noplaceholder2, reqprivacy } = req.query;
  if (!["chatbot", "registration", "header", "footer"].includes(formtype)) {
    return next();
  }
  try {
    const [rows] = await __pool.query(`SELECT * FROM forms WHERE id = ?`, [
      id,
    ]);
    if (rows.length === 0) {
      return next();
    }
    const bedroomOptions = rows[0].form_fields.find((elem) => {
      return elem.name === "bedroom";
    });

    const requestOptions = rows[0].form_fields.find((elem) => {
      return elem.name === "request";
    });

    const inputLable = rows[0].form_fields.filter((elem) => {
      return elem.name == "name";
    });

    const emailLable = rows[0].form_fields.filter((elem) => {
      return elem.name == "email";
    });

    const phoneLable = rows[0].form_fields.filter((elem) => {
      return elem.name == "phone";
    });



    return res.render("tempForm.ejs", {
      form: rows[0],
      createdFields: rows[0].created_form_fields,
      inputLabel: inputLable[0].label,
      emailLabel: emailLable[0].label,
      phoneLabel: phoneLable[0].label,
      bedroomOptions: bedroomOptions.options ? bedroomOptions.options : [],
      requestOptions: requestOptions.options ? requestOptions.options : [],
      bedroomLabel: bedroomOptions.label,
      requestLabel: requestOptions.label,
      formType: formtype,
      reqtype: reqtype,
      devtext: devtext,
      label: label,
      noemail:noemail,
      noselect1:noselect1,
      noselect2:noselect2,
      reqselect1:reqselect1,
      reqselect2:reqselect2,
      placeselect1:placeselect1,
      placeselect2:placeselect2,
      showselect1: showselect1,
      showselect2: showselect2,
      noconsent:noconsent,
      sitename:sitename,
      reqprivacy:reqprivacy,
      createdFieldsFlag: newfield,
      noplaceholder1,
      noplaceholder2,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: "Internal server error" });
  }
})
  .get("/api/form/fetch/:id", verify, async (req, res) => {
    const { id } = req.params;
    try {
      const [rows] = await __pool.query(`SELECT * FROM forms WHERE id = ?`, [
        id,
      ]);
      res.status(200).json({ form: rows[0] });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ message: error.message });
    }
  })
  .get("/api/form/delete/:id", verify, async (req, res) => {
    const { id } = req.params;
    try {


      const [rows] = await __pool.query(`SELECT * FROM forms WHERE id = ?`, [id]);
      await __pool.query(`DELETE FROM forms WHERE id = ?`, [id]);

      const clientID = rows[0].client_id;
      const formName = rows[0].name;

      if(clientID == process.env.CLIENT_ID){
        await renameSheet(process.env.SHEET_ID, formName, `${formName} (Deleted)` );
      }


      res.redirect("/clients");
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ message: error.message });
    }
  })
  .post("/api/form/create", verify, async (req, res) => {
    const { name, clientID } = req.body;
    try {
      const [rows] = await __pool.query(`SELECT * FROM forms WHERE name = ?`, [
        name,
      ]);
      if (rows.length > 0) {
        return res
          .status(401)
          .json({ message: "Form with this name already exists" });
      }

      const dev_info = `
      Your information is secure with us! Register now to secure your spot at 19 Nassim

      Follow the official booking process for a smooth experience. Brought to you by Keppel Land Limited a trusted developer

`;

      const form_fields = [
        {
          name: "bedroom",
          options: [
            "1 bedroom",
            "2 bedroom",
            "3 bedroom",
            "4 bedroom",
            "4 bedroom Premium",
            "5 bedroom Premium",
          ],
          label: "Bedroom",
        },
        {
          name: "request",
          options: [
            "Request For E-Brochure",
            "Units And Price list",
            "Arrange Showflat Viewing",
          ],
          label: "Request",
        },

        {
          name: "name",
          label: "Name",
        },
        {
          name: "email",
          label: "Email",
        },
        {
          name: "phone",
          label: "Phone",
        },
      ];

      await __pool.query(
        `
            INSERT INTO forms (
              name,
              client_id,
              discord,
              zappier,
              form_fields,
              name_id,
              email_id,
              phone_id,
              bedroom_select_id,
              request_select_id,
              css,
              dev_info
            ) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          name,
          clientID,
          JSON.stringify([]),
          JSON.stringify([]),
          JSON.stringify(form_fields),
          "name",
          "email",
          "phone",
          "bedroom",
          "request",
          `/* Form styling */
          .chatbot
           {
          background-color: #DFA57D;
          }        
           .registration {
                 
                  
                      background-color: #f0f0f0; /* Default background color */
                 
                    }
                 
                    /* Background color customization */
                    .registration {
                      background-color: #F2E6CE; /* Blue background color */
                    }
          
                    /* Keyframes for shimmer animation */
          @keyframes shimmer {
            0% {
              background-position: -200px 0;
            }
            100% {
              background-position: 200px 0;
            }
          }
          
          /* Apply shimmer animation to button */
          button {
            background-image: linear-gradient(to right, #AA7551 0%, #e0e0e0 20%, #AA7551 40%, #AA7551 100%);
            background-size: 200% auto;
            animation: shimmer 1.9s infinite linear;
            border-radius: 10px;
            
          }
           .custom-input-bg {
              background-color: white !important;
          border-radius:10px !important;
          border: solid 1px #A9A9A9 !important;
          }
          .phone-div {
             background-color: white !important;
          border-radius:10px !important;
          border: solid 1px #A9A9A9 !important;
          padding-left:3px !important;
          }
          .phone-div input {
             background-color: white !important;
          border-radius:0px;
          border: none !important;
          }
          
          .mb-3 {
          margin-top:5px ;
              margin-bottom: 5px !important;
          }
          .btn{
          color:#ffff;
          margin-top:5px !important;
          }
          
          .w40{
          margin:5px 0px 5px 0px;
          }`,
          dev_info,
        ]
      );
      if(clientID == process.env.CLIENT_ID){
        await createSheet(process.env.SHEET_ID, name);
      }

      res.status(200).json("Form Created Successfully with name " + name);
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ message: error.message });
    }
  })
  .post("/api/form/update/:formID", verify, async (req, res) => {
    const { formID } = req.params;
    const {
      discord,
      zappier,
      form_fields,
      botName,
      projectName,
      clientName,
      name_id,
      email_id,
      phone_id,
      bedroom_select_id,
      request_select_id,
      dev_info,
      dev_name,
      dev_checkbox,
      dev_checkbox_validation,
      css,
      email,
      createdFields,
      privyr
    } = req.body;


    try {
      await __pool.query(
        `
           UPDATE forms 
           SET 
           discord = ?,
           zappier = ?,
           client_name = ?,
           project_name = ?,
           bot_name = ?,
           form_fields = ?,
           name_id = ?,
           email_id = ?,
           phone_id = ?,
           bedroom_select_id = ?,
           request_select_id = ?,
           css = ?,
           created_form_fields = ?,
           dev_info = ?,
           email = ?,
           dev_name = ?,
           dev_checkbox = ?,
           dev_checkbox_validate = ?,
           privyr = ?
           WHERE id = ?
        `,
        [
          JSON.stringify(discord),
          JSON.stringify(zappier),
          clientName,
          projectName,
          botName,
          JSON.stringify(form_fields),
          name_id,
          email_id,
          phone_id,
          bedroom_select_id,
          request_select_id,
          css,
          JSON.stringify(createdFields),
          dev_info,
          email,
          dev_name,
          dev_checkbox,
          dev_checkbox_validation,
          privyr,
          formID,
        ]
      );
      res.status(200).json("Form Updated Successfully");
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ message: error.message });
    }
  })
  .post("/api/form/submit/:formID", async (req, res) => {
    const { data, selects } = req.body;

    console.log(data, selects);
    const { formID } = req.params;
    try {
      await producer(data, selects, formID);
      await startWorker();
      res.status(200).json("Form Submitted Successfully");
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ message: error.message });
    }
  })
  .get("/api/fetch/forms", verify, async (req, res, next) => {
    try {
      const query = `
          SELECT 
              forms.id,
              forms.name,
              forms.client_id,
              clients.name AS client_name
          FROM 
              forms
          JOIN 
              clients ON forms.client_id = clients.id
      `;
      const [forms] = await __pool.query(query);
      res.status(200).json(forms);
    } catch (error) {
      console.error(error);
      next();
    }
  })
  .post("/api/wp-form/submit/:formID", async (req, res) => {
    const data = req.body;
    const formID = req.params.formID;

    
    
    let name = "";
    let email = "";
    let phone = "";



    let cleanData = {
      ...data
    }



    delete cleanData['Date'];
    delete cleanData['Time'];
    delete cleanData['Page URL'];
    delete cleanData['Remote IP'];
    delete cleanData['User Agent'];
    delete cleanData['Powered by'];
    delete cleanData['Form_id'];
    delete cleanData['Form_name'];
    delete cleanData.querystring;



    const selects = []

    for(let key in cleanData){



      if(cleanData[key]){
        const fieldName = key.charAt(0).toUpperCase() + key.slice(1);
        const fieldValue = cleanData[key] ? cleanData[key].charAt(0).toUpperCase() + cleanData[key].slice(1) : "";


        selects.push({name:fieldName, value:fieldValue});
      
      }

      if(key.toLocaleLowerCase().includes('name')){
        name = cleanData[key];
      }
      if(key.toLocaleLowerCase().includes('email')){
        email = cleanData[key];
      }
      if(key.toLocaleLowerCase().includes('phone') || key.toLocaleLowerCase().includes('contact') || key.toLocaleLowerCase().includes('mobile')){
        phone = cleanData[key];

        if(phone.startsWith('65')){
          phone = phone.slice(2);
        }


      }

    }
    

    let dataToSave = {
      client_id: null,
      project_id: null,
      is_verified: 0,
      status: 'clear',
      is_send_discord: 0,
      name: name,
      is_webhook: true,
      ph_number: phone,
      ip_address: data['Remote IP'],
      source_url:data['Page URL'],
      params:{
        utm_source: data.utm_source || null,
        utm_medium: data.utm_medium || null,
        utm_campaign: data.utm_campaign || null,
        utm_content: data.utm_content || null,
        utm_term: data.utm_term || null,
        match_type: data.match_type || null,
        extension: data.extension || null,
        device: data.device || null,
        location: data.location || null,
        placement_category: data.placement_category || null
      },
      email: email,
    };

    try {
      await producer(dataToSave, selects, formID);
      await startWorker();
      res.status(200).json({message:"Form Submitted Successfully"});
    } catch (error) {
      console.log(error.message);
      res.status(500).json({message:error.message});
    }


  
  })

module.exports = router;


