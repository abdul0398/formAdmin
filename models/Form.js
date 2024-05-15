const Form = `
    CREATE TABLE IF NOT EXISTS forms(
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        discord JSON,
        zappier JSON,
        email VARCHAR(255),
        name_id VARCHAR(255),
        email_id VARCHAR(255),
        phone_id VARCHAR(255),
        bedroom_select_id VARCHAR(255),
        request_select_id VARCHAR(255),
        css text,
        dev_info text,
        client_name VARCHAR(255),
        bot_name VARCHAR(255),
        project_name VARCHAR(255),
        form_fields JSON,
        created_form_fields JSON,
        client_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY fk_client_id (client_id) REFERENCES clients(id)
    )
`;

module.exports = Form;
