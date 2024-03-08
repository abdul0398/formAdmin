const express = require("express");
const { verify } = require("../middlewares/verify");
const router = express.Router();

const {changeleadtoString} = require("../utils/tools");
const { bulkDiscordSender } = require("../utils/discord");
const { bulkHookSender } = require("../utils/zappier");

router
.get("/form/:id/:name", verify, async (req, res, next) => {
    const { name, id } = req.params;
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
      const condoOptions = rows[0].form_fields.find((elem)=>{
        return elem.name === "condo";
      }
      )
      const requestOptions = rows[0].form_fields.find((elem)=>{
        return elem.name === "request";
      }
      )

      return res.render("form.ejs", {
        title: name,
        form: rows[0],
        bedroomOptions: bedroomOptions.options? bedroomOptions.options : [],
        condoOptions: condoOptions.options? condoOptions.options : [],
        requestOptions: requestOptions.options? requestOptions.options : [],
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
        },
        {
          name: "condo",
          options: [
            "Lentor Modern",
            "Lentor Hill Resedence",
            "Hillock Green",
            "Lentoria",
            "Lento Mansion",
          ],
        },
        {
          name: "request",
          options: [
            "Request For E-Brochure",
            "Units And Price list",
            "Arrange Showflat Viewing",
          ],
        },
      ];

      await __pool.query(
        `
            INSERT INTO forms (name, client_id, discord, zappier, text_color, form_color, btn_color, form_fields) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          name,
          clientID,
          JSON.stringify([]),
          JSON.stringify([]),
          "#000000",
          "#FFFFFF",
          "#FFFFFF",
          JSON.stringify(form_fields),
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
    const {discord, zappier, text_color, form_color, btn_color, form_fields, botName, projectName, clientName } = req.body;

    try {
      await __pool.query(
        `
            UPDATE forms 
            SET discord = ?, zappier = ?, text_color = ?, form_color = ?, btn_color = ?, client_name = ?, project_name = ?, bot_name = ?, form_fields = ?
            WHERE id = ?
        `,
        [
          JSON.stringify(discord),
          JSON.stringify(zappier),
          text_color,
          form_color,
          btn_color,
          clientName,
          projectName,
          botName,
          JSON.stringify(form_fields),
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
    const { data } = req.body;
    const { formID } = req.params;
    console.log(data);
    try {
      const [rows] = await __pool.query(`SELECT * FROM forms WHERE id = ?`, [
        formID,
      ]);
      if (rows.length === 0) {
        return res.status(404).json({ message: "Form not found" });
      }
      const form = rows[0];
      const lead = {
        ...data,
      };
      const str = changeleadtoString(lead, form.client_name, form.project_name);
      await bulkDiscordSender(form.discord, str, form.bot_name);
      await bulkHookSender(lead, form.zappier, form.project_name, form.client_name);

      res.status(200).json("Form Submitted Successfully");
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ message: error.message });
    }
  })
  

module.exports = router;
