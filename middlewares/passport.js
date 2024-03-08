const crypto = require('crypto');

async function verifyForUser(email, password, cb) {
    try {
        const [rows, field] = await __pool.query('SELECT * FROM users WHERE email = ?', [ email ]);
        if (rows.length == 0) { return cb(null, false, { message: 'Incorrect email or password.' })}
        const hashedPassword = crypto.pbkdf2Sync(password, rows[0].salt, 310000, 32, 'sha256');
        if (!crypto.timingSafeEqual(rows[0].hashed_password, hashedPassword)) {
            return cb(null, false, { message: 'Incorrect username or password.' });
        }
        return cb(null, rows[0]);
    } catch (error) {
        console.log(error);
        return cb(error);
    }
}

function serializeUser(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.email})
    })
}


function deserializeUser(user, cb) {
    process.nextTick(function() {
        return cb(null, user)
    })
}

module.exports = {verifyForUser, serializeUser, deserializeUser};