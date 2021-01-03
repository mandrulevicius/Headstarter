'use strict';

const encryption = require('./encryption');

const USER_FIELD = 'gamerid';
const PASSWORD_FIELD = 'gamerpassword';
//duplicates in input.js, maybe input should be checked in this file?

//database table and column names
const WEB_USERS = 'web_users';
const WEB_USER_NAME = 'web_user_name';
const WEB_USER_PASSWORD = 'web_user_password';
const WEB_USER_SALT = 'web_user_salt';


module.exports.userExists = async function userExists(credentials, database) {
    let sqlQuery = database.format(`SELECT * FROM ${WEB_USERS} WHERE ${WEB_USER_NAME}=?`,
        credentials[USER_FIELD]);
    try {
        let results = await database.query(sqlQuery);
        let responseString = '';
    
        results.forEach(function(data) {
            responseString += data[WEB_USER_NAME] + ' : ';
        });

        if (responseString.length == 0) {
            console.log('userExists false');
            return false;
        } else {
            console.log('userExists true');
            return true;
        };
        // this works, but i feel i might be waiting for too many things to happen
        // though if emitted event callback function is slow, that doesnt impact anything else
        // so should be fine

        // maybe this is where i should be emitting events?
        // then will have to pass response but thats ok.
        // just finish this and move on to express, maybe wont have to deal with it
    } catch (error) {
        console.error(error);
        return null;
    } finally {
        console.log('finally userExists');
        // should I be returning value here?
    };
};


module.exports.insertNewUser = async function insertNewUser(credentials, database) {
    let encryptedData = encryption.encryptPassword(credentials[PASSWORD_FIELD]);
    let sqlQuery = database.format(
        `INSERT INTO ${WEB_USERS} (${WEB_USER_NAME}, ${WEB_USER_PASSWORD}, ${WEB_USER_SALT}) VALUES(?, ?, ?)`,
        [credentials[USER_FIELD], encryptedData.hash, encryptedData.salt]);
    try {
        let results = await database.query(sqlQuery);
        console.log('insertnewuser true');
        return true;
    } catch (error) {
        console.error(error);
        return false;
    } finally {
        console.log('finally insertnewuser');
    };
};
  

module.exports.loginUser = async function loginUser(credentials, database) {
    let sqlQuery = database.format(
        `SELECT * FROM ${WEB_USERS} WHERE ${WEB_USER_NAME}=?`, credentials[USER_FIELD]);
    try {
        let results = await database.query(sqlQuery);
        // results contains an array of dictionaries
        console.log('login');
        console.log(results);
        if (Object.keys(results).length === 0) {
            return {
                'issue':`Login failed. User '${unescape(credentials[USER_FIELD])}' does not exist.`
            };
        } else {
            //let result;
            //results.forEach(function(data) {
            //    result = data;
            //});
            // array contains only a single entry. forEach might be inefficient.
            let webUser = results[0];

            if (encryption.validatePassword(credentials[PASSWORD_FIELD], 
                webUser[WEB_USER_PASSWORD], webUser[WEB_USER_SALT])) {
                return {
                    'success':`Login successful. Welcome, ${webUser[WEB_USER_NAME]}`
                };
            } else {
                return {'issue':'Login failed. Wrong password.'};
            };
        };      
    } catch (error) {
        console.error(error);
        return {'error':error};
        //could i write string into dictionary without quotes? no?
        // how come it works in config database connection options dictionary?
    };
};


module.exports.listUsers = async function listUsers(database) {
    let sqlQuery = database.format(`SELECT * FROM ${WEB_USERS}`);
    try {
        let results = await database.query(sqlQuery);
        let users = '';
        results.forEach(function(data) {
            users += unescape(data[WEB_USER_NAME]) + '<br>';
        });
        if (users.length == 0) {
            return {'issue':'No users found.'};
        };
        return {'success':users};
    } catch (error) {
        console.error(error);
        return {'error':error};
    };
};