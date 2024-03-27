const Lead = `
    CREATE TABLE IF NOT EXISTS leads(
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        form_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(255) NOT NULL,
        ip_address VARCHAR(255) NOT NULL,
        status ENUM('junk', 'clear') DEFAULT 'clear',
        is_send_discord BOOLEAN DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        Foreign Key (client_id) REFERENCES clients(id),
        Foreign Key (form_id) REFERENCES forms(id)
    )
`;

module.exports = Lead;
