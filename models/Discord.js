const Discord = `
    CREATE TABLE IF NOT EXISTS discord(
        id INT AUTO_INCREMENT PRIMARY KEY,
        access_token VARCHAR(255) NOT NULL,
        owner_id VARCHAR(255) NOT NULL,
        refresh_token VARCHAR(255) NOT NULL,
        expires_on VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`;

module.exports = Discord;
