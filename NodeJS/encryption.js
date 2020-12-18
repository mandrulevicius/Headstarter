'use strict';

const crypto = require('crypto');

exports.encryptPassword = function encryptPassword(clearText) {
    let length = 16; 
    // should be length of user_salt field in table - env variable?
    // should be hardconst?
    let salt = crypto.randomBytes(Math.ceil(length/2))
    .toString('hex')
    .slice(0, length);

    //SHA512
    let hash = crypto.createHmac('sha512', salt);
    hash.update(clearText);
    return {
        salt: salt,
        hash: hash.digest('hex')
    };
};


exports.validatePassword = function validatePassword(userPassword, hashedPassword, salt) {
    let hash = crypto.createHmac('sha512', salt);
    hash.update(userPassword);
    userPassword = hash.digest('hex');
    return userPassword == hashedPassword;
};
