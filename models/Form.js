const Form = `
    CREATE TABLE IF NOT EXISTS forms(
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        discord JSON,
        zappier JSON,
        text_color VARCHAR(255),
        form_color VARCHAR(255),
        client_name VARCHAR(255),
        bot_name VARCHAR(255),
        project_name VARCHAR(255),
        btn_color VARCHAR(255),
        form_fields JSON,
        client_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY fk_client_id (client_id) REFERENCES clients(id)
    )
`;

module.exports = Form;
