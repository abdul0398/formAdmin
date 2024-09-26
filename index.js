((container_id) => {


    
  const siteName = "<%=sitename%>";
  const id = "<%=form.id%>";
  const parentUrl = document.referrer;
  const projectName = "<%=form.project_name%>";
  const cleanProjectName = capitalizeFirstLetterOfEachWord(projectName);
  const label = container.querySelector('label[for="privacy_checkbox"]');

  if (id == 162) {
    label.innerHTML = `By submitting this form, I consent to being contacted by the appointed sales team and associates of Union Square Residences`;
  } else if (id == 183) {
    label.innerHTML = `By submitting this form, I agree to be contacted by the ${
      siteName ? siteName : cleanProjectName
    } and its associates from ${parentUrl}`;
  } else if (id == 147) {
    label.innerHTML = `By submitting this form, I agree to be contacted by ${
      siteName ? siteName : cleanProjectName
    } appointed sales team and its associates from ${parentUrl}`;
  } else {
    label.innerHTML = `By submitting this form, I agree to be contacted by ${
      siteName ? siteName : cleanProjectName
    } appointed sales team and its associates from ${parentUrl}`;
  }

  const noemail = "<%=noemail%>";
  initializeFormValidation(
    "submitBtn1",
    "headform1",
    "<%=form.name_id%>",
    "<%=form.email_id%>",
    "<%=form.phone_id%>",
    "error_msg1"
  );

  function initializeFormValidation(
    ButtonID,
    FormID,
    NameID,
    EmailID,
    PhoneID,
    ErrorMsgID
  ) {
    // get all params in the url

    const urlParams = new URLSearchParams(window.location.search);
    const utm_source = urlParams.get("utm_source");
    const utm_medium = urlParams.get("utm_medium");
    const utm_campaign = urlParams.get("utm_campaign");
    const utm_content = urlParams.get("utm_content");
    const utm_term = urlParams.get("utm_term");
    const match_type = urlParams.get("match_type");
    const extension = urlParams.get("extension");
    const device = urlParams.get("device");
    const location = urlParams.get("location");
    const placement_category = urlParams.get("placement_category");
    const is_listing_form = urlParams.get("listings_form");
    const btn_color = urlParams.get("btn_color");
    const text_color = urlParams.get("text_color");
    const parent_url = urlParams.get("parent_url");

    if (btn_color) {
      // remove background-image property
      const btn = container.getElementById(ButtonID);
      btn.style.setProperty("background-image", "none", "important");
      btn.style.setProperty("background-color", `#${btn_color}`, "important");
    }

    if (text_color) {
      const btn = container.getElementById(ButtonID);
      const dev_info = container.getElementById("dev_info");
      const privacy_checkbox_label = container.querySelector(
        ".privacy-checkbox-label"
      );
      const dev_checkbox_label = container.querySelector(".dev-checkbox-label");
      btn.style.setProperty("color", `#${text_color}`, "important");
      dev_info?.style.setProperty("color", `#${text_color}`, "important");
      privacy_checkbox_label.style.setProperty(
        "color",
        `#${text_color}`,
        "important"
      );
      dev_checkbox_label.style.setProperty(
        "color",
        `#${text_color}`,
        "important"
      );
    }

    if (is_listing_form == "true") {
      const form = container.getElementById(FormID);
      form.setAttribute("method", "get");
      form.setAttribute("action", parent_url + "thank-you");
    } else {
      container
        .getElementById(FormID)
        .setAttribute("action", document.referrer + "thank-you");
    }

    const errors = [];

    async function checkValidity(
      formID,
      nameTextID,
      emailTextID,
      phoneTextID,
      errorID
    ) {
      const emailInput = container.getElementById(emailTextID);
      const nameInput = container.getElementById(nameTextID);
      const phoneInput = container.getElementById(phoneTextID);
      const errorElement = container.getElementById(errorID);
      const Form = container.getElementById(formID);

      try {
        const email = noemail == "true" ? "" : emailInput.value.trim();
        const phone = phoneInput.value.trim();
        const name = nameInput.value.trim();

        errors.length = 0;

        const isValidName = validateName(name);
        const isValidEmail = noemail == "true" ? true : validateEmail(email);
        const isValidPhone = validatePhone(phone);
        if (
          !validateName(name) ||
          !isValidEmail ||
          !validatePhone(phone) ||
          !validateSelect() ||
          !validateNewSelect() ||
          !validatePrivacy()
        ) {
          errorElement.innerText = errors[0];
          return false;
        } else {
          errorElement.innerText = "";
        }

        const response = await fetch(
          "https://ipinfo.io/json?token=8122b43242b7f4"
        );
        const data = await response.json();
        const ip_address = data.ip;

        if (errors.length > 0) {
          errorElement.innerText = errors.join("\n");
          return false;
        } else {
          errorElement.innerText = "";
          const dataToSave = {
            client_id: null,
            project_id: null,
            is_verified: 0,
            status: "clear",
            is_send_discord: 1,
            name: name,
            ph_number: phone.slice(3),
            ip_address: ip_address,
            source_url: document.referrer,
            params: {
              utm_source: utm_source || null,
              utm_medium: utm_medium || null,
              utm_campaign: utm_campaign || null,
              utm_content: utm_content || null,
              utm_term: utm_term || null,
              match_type: match_type || null,
              extension: extension || null,
              device: device || null,
              location: location || null,
              placement_category: placement_category || null,
            },
          };

          if (noemail == "true") {
            dataToSave.email = "";
          } else {
            dataToSave.email = email;
          }

          await sendToServer(dataToSave);
          Form.submit();

          return true;
        }
      } catch (error) {
        console.error("Error:", error);
      }
    }

    container
      .getElementById(ButtonID)
      .addEventListener("click", async function (e) {
        e.preventDefault();
        disableBtn();
        await checkValidity(FormID, NameID, EmailID, PhoneID, ErrorMsgID);
        enableBtn();
      });

    const phoneNumberInput = container.getElementById(PhoneID);

    phoneNumberInput.addEventListener("input", function () {
      let phoneNumber = this.value.replace(/\D/g, "");
      phoneNumber = "+" + phoneNumber;
      if (!phoneNumber.startsWith("+65")) {
        phoneNumber = "+65";
      }

      if (phoneNumber.length > 11) {
        phoneNumber = phoneNumber.slice(0, 11);
      }

      this.value = phoneNumber;
      // this.value = phoneNumber;
      if (phoneNumber.length === 11) {
        this.setCustomValidity("");
      } else {
        this.setCustomValidity(
          "Please enter a valid Singaporean phone number."
        );
      }
    });

    container.getElementById(FormID).addEventListener("submit", function (e) {
      container.querySelector("body").innerHTML =
        "<h1 class='text-center'>Thank you for submitting the form</h1>";
    });
    function validateEmail(email) {
      if (!email) {
        errors.push("Email cannot be empty.");
        return false;
      } else {
        const pattern = /^[\w\.-]+@[\w\.-]+\.\w+$/;
        if (!pattern.test(email)) {
          errors.push("Invalid email format.");
          return false;
        }
        return true;
      }
    }

    function validatePhone(phoneNumber) {
      phoneNumber = phoneNumber.slice(3);
      if (!phoneNumber) {
        errors.push("Phone number cannot be empty.");
        return false;
      } else {
        const phoneRegex = /^(8|9)\d{7}$/;
        if (!phoneRegex.test(phoneNumber)) {
          errors.push("Invalid phone number format.");
          return false;
        }
        return true;
      }
    }

    function validateName(name) {
      if (name === "") {
        errors.push("name cannot be empty.");
        return false;
      }
      return true;
    }

    function validateSelect() {
      // get params from the url
      const urlParams = new URLSearchParams(window.location.search);
      const reqselect1 = urlParams.get("reqselect1");
      const reqselect2 = urlParams.get("reqselect2");

      if (reqselect1 == "true") {
        const select1 = container.querySelector('select[name="Request"]');
        if (!select1) {
          return true;
        }

        if (select1.selectedIndex === 0) {
          errors.push("Please select a request.");
          return false;
        }
      }

      if (reqselect2 == "true") {
        const select2 = container.querySelector('select[name="Bedroom"]');
        if (!select2) {
          return true;
        }

        if (select2.selectedIndex === 0) {
          errors.push("Please select a bedroom.");
          return false;
        }
      }
      return true;
    }
    const devCheckboxValidation = "<%=form.dev_checkbox_validate%>";
    function validatePrivacy() {
      const privacy_checkbox = container.getElementById("privacy_checkbox");
      const dev_checkbox = container.getElementById("dev_checkbox");
      const reqPrivacy = "<%=reqprivacy%>";
      const devCheckboxValidation = "<%=form.dev_checkbox_validate%>";

      if (reqPrivacy == "true" && privacy_checkbox.checked == false) {
        errors.push("Please Agree to the privacy-policy.");
        return false;
      }

      if (devCheckboxValidation == "1" && dev_checkbox.checked == false) {
        errors.push("Please Agree to the developer policy.");
        return false;
      }

      return true;
    }

    function validateNewSelect() {
      const createdFieldContainer = container.querySelector(
        ".created-fields-container"
      );
      if (createdFieldContainer) {
        const createdFields = createdFieldContainer.children;
        for (let i = 0; i < createdFields.length; i++) {
          const field = createdFields[i];
          const fieldType = field.getAttribute("type");
          const label = field.getAttribute("question");
          const isRequired = field.getAttribute("is-req") === "true";

          if (fieldType === "input") {
            const input = field.querySelector("input");
            if (isRequired && !input.value) {
              errors.push("Please select all Fields");
              return false;
            }
          } else if (fieldType === "textarea") {
            const textarea = field.querySelector("textarea");
            if (isRequired && !textarea.value) {
              errors.push("Please select all Fields");

              return false;
            }
          } else if (fieldType === "checkbox") {
            const checkboxes = field.querySelectorAll('input[type="checkbox"]');
            const checkedValues = [];
            checkboxes.forEach((checkbox) => {
              if (checkbox.checked) {
                checkedValues.push(checkbox.value);
              }
            });
            if (isRequired && checkedValues.length === 0) {
              errors.push("Please select all Fields");

              return false;
            }
          } else if (fieldType === "radio") {
            const radios = field.querySelectorAll('input[type="radio"]');
            let checkedValue = "";
            radios.forEach((radio) => {
              if (radio.checked) {
                checkedValue = radio.value;
              }
            });
            if (isRequired && !checkedValue) {
              errors.push("Please select all Fields");

              return false;
            }
          } else if (fieldType == "select") {
            const select = field.querySelector("select");
            if (isRequired && select.value == "Please Select") {
              errors.push("Please select all Fields");
              return false;
            }
          }
        }
      }
      return true;
    }
  }

  function disableBtn() {
    const btn = container.getElementById("submitBtn1");
    btn.disabled = true;
    btn.innerText = "Sending...";
    btn.style.cursor = "not-allowed";
  }

  function enableBtn() {
    const btn = container.getElementById("submitBtn1");
    btn.disabled = false;
    btn.innerText = "Send";
    btn.style.cursor = "pointer";
  }

  async function sendToServer(data) {
    const createdFieldContainer = container.querySelector(
      ".created-fields-container"
    );
    const id = container.getElementById("formId").innerText;
    const selects = container.querySelectorAll("select");
    const selectValues = [];

    selects.forEach((select) => {
      // Check if there is a selected option and if it's not disabled
      if (
        select.selectedIndex !== -1 &&
        !select.options[select.selectedIndex].disabled
      ) {
        selectValues.push({ name: select.name, value: select.value });
      }
    });

    if (createdFieldContainer) {
      const createdFields = createdFieldContainer.children;
      for (let i = 0; i < createdFields.length; i++) {
        const field = createdFields[i];
        const fieldType = field.getAttribute("type");
        const label = field.getAttribute("question");
        if (fieldType === "input") {
          const input = field.querySelector("input");
          selectValues.push({ name: label, value: input.value });
        } else if (fieldType === "textarea") {
          const textarea = field.querySelector("textarea");
          selectValues.push({ name: label, value: textarea.value });
        } else if (fieldType === "checkbox") {
          const checkboxes = field.querySelectorAll('input[type="checkbox"]');
          const checkedValues = [];
          checkboxes.forEach((checkbox) => {
            if (checkbox.checked) {
              checkedValues.push(checkbox.value);
            }
          });
          selectValues.push({ name: label, value: checkedValues });
        } else if (fieldType === "radio") {
          const radios = field.querySelectorAll('input[type="radio"]');
          let checkedValue = "";
          radios.forEach((radio) => {
            if (radio.checked) {
              checkedValue = radio.value;
            }
          });
          selectValues.push({ name: label, value: checkedValue });
        }
      }
    }

    const reqtype = `<%-reqtype%>`;

    if (reqtype == "checkbox") {
      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      let selectedReq = "";
      checkboxes.forEach((checkbox) => {
        if (checkbox.checked) {
          selectedReq += checkbox.value + ", ";
        }
      });
      selectValues.push({ name: "Request", value: selectedReq });
    }

    const res = await fetch(`/api/form/submit/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: data, selects: selectValues }),
    });
    const response = await res.json();
    return;
  }

  function openPrivacyPolicy() {
    // Create the form element
    const form = container.createElement("form");

    // Set the form attributes
    form.setAttribute("action", document.referrer + "privacy-policy");
    form.setAttribute("method", "post");
    form.setAttribute("target", "_blank");

    // Append the form to the body
    document.body.appendChild(form);

    // Submit the form
    form.submit();
  }

  function capitalizeFirstLetterOfEachWord(str) {
    // Remove "ppc" case-insensitively, including those inside parentheses
    let cleanedStr = str.replace(/\bppc\b/gi, "").replace(/\(\s*\)/g, "");

    // Capitalize the first letter of each word
    return cleanedStr
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .filter(Boolean) // Remove empty strings resulting from removed "ppc"
      .join(" ");
  }
})("header");
