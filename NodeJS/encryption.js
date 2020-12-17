'use strict';

const crypto = require('crypto');

exports.encryptPassword = function(clearText) {
    //generate random salt
    let length = 16;  // should be length of user_salt field in table - env variable?
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


exports.validatePassword = function(userPassword, hashedPassword, salt) {
    let hash = crypto.createHmac('sha512', salt);
    hash.update(userPassword);
    userPassword = hash.digest('hex');
    return userPassword == hashedPassword;
};


/*
EXAMPLE CODE
// create password hash
var creepy = function (clear) {
    //generate random salt
    let length = 16;  // should be length of user_salt field in table
    let salt = crypto.randomBytes(Math.ceil(length/2))
    .toString('hex')
    .slice(0, length);

    //SHA512
    let hash = crypto.createHmac('sha512', salt);
    hash.update(clear);
    return {
        salt: salt,
        hash: hash.digest('hex')
    };
};

//test encrypt
var clearpass = 'He110Wor!d';
var creeped = creepy(clearpass);
console.log('hashed pass + salt');
console.log(creeped);

// validate
var validate = function (userpass, hashedpass, salt) {
    let hash = crypto.createHmac('sha512', salt);
    hash.update(userpass);
    userpass = hash.digest('hex');
    return userpass == hashedpass;
}

// test validate
clearpass = 'not hello wolrd';
console.log(creeped.hash);
console.log(creeped['hash']);
var validated = validate(clearpass, creeped.hash, creeped.salt);
console.log('validation');
console.log('clear pass: ' + clearpass);
console.log('validation status: ' + validated);

var secondCreeped = creepy('second pass');
console.log('second creeped ', secondCreeped);

console.log('is second valid: ', 
    validate('second pass', secondCreeped.hash, secondCreeped.salt));
*/
