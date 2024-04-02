const express = require("express");
const { verify } = require("../middlewares/verify");
const producer = require("../queue/producer");
const startWorker = require("../queue/workers");
const router = express.Router();

router
.get("/form/:id", async (req, res, next) => {
    const { id } = req.params;
    const {formtype, reqtype, devtext, label} = req.query;
    if(!['chatbot','registration','header','footer'].includes(formtype)){
      return next();
    }
    try {
      const [rows] = await __pool.query(`SELECT * FROM forms WHERE id = ?`, [
        id,
      ]);
      if (rows.length === 0) {
        return next();
      }
      const bedroomOptions = rows[0].form_fields.find((elem)=>{
        return elem.name === "bedroom";
      })

      const requestOptions = rows[0].form_fields.find((elem)=>{
        return elem.name === "request";
      })

      const inputLable = rows[0].form_fields.filter((elem)=>{
        return elem.name == 'name';
      })

      const emailLable = rows[0].form_fields.filter((elem)=>{
        return elem.name == 'email';
      })

      const phoneLable = rows[0].form_fields.filter((elem)=>{
        return elem.name == 'phone';
      });


      return res.render("form.ejs", {
        form: rows[0],
        inputLabel: inputLable[0].label,
        emailLabel: emailLable[0].label,
        phoneLabel: phoneLable[0].label,
        bedroomOptions: bedroomOptions.options? bedroomOptions.options : [],
        requestOptions: requestOptions.options? requestOptions.options : [],
        bedroomLabel: bedroomOptions.label,
        requestLabel: requestOptions.label,
        formType: formtype,
        reqtype:reqtype,
        devtext:devtext,
        label:label
      });
    } catch (error) {
      console.log(error.message);
      next();
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
      await __pool.query(`DELETE FROM forms WHERE id = ?`, [id]);
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

`

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
        }
      
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
          .styled-form {
            max-width: 400px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f0f0f0; /* Default background color */
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          }
          
          /* Background color customization */
          .styled-form.blue-bg {
            background-color: #3498db; /* Blue background color */
          }
          
          /* Button styling with shimmer effect */
          .styled-form button {
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            background-color: #4CAF50; /* Default button color */
            color: white;
            font-size: 16px;
            cursor: pointer;
            position: relative;
            overflow: hidden;
          }
          
          .styled-form button::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: rgba(255, 255, 255, 0.13);
            transform: rotate(45deg);
            transition: transform 1s ease-in-out;
            animation: shimmer 2s infinite;
          }
          
          @keyframes shimmer {
            0% {
              transform: rotate(45deg) translate(-50%, -50%);
            }
            100% {
              transform: rotate(45deg) translate(100%, 100%);
            }
          }
          
          /* Button hover effect */
          .styled-form button:hover::before {
            transition: transform 1s ease-in-out;
            transform: rotate(45deg) translate(100%, 100%);
          }`,
          dev_info
        ]
      );

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
      css
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
           dev_info = ?
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
           dev_info,
           formID
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
    const { formID } = req.params;
    try {
      await producer(data, selects, formID);
      await startWorker();
      res.status(200).json("Form Submitted Successfully");
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ message: error.message });
    }
}).get("/api/fetch/forms", verify, async (req, res, next)=>{
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

  

module.exports = router;
