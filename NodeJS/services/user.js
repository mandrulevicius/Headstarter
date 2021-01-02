'use strict';

const html = require('../frontend/html');
const encryption = require('../encryption');
const mysql = require('mysql');

const USER_LIST_SITE = 'user-list.html';
const INDEX_SITE = 'index.html';
const LOGGED_IN_SITE = 'logged-in.html';
//duplicates

const USER_FIELD = 'gamerid';
const PASSWORD_FIELD = 'gamerpassword';
//duplicates

const WEB_USERS = 'web_users';
const WEB_USER_NAME = 'web_user_name';
const WEB_USER_PASSWORD = 'web_user_password';
const WEB_USER_SALT = 'web_user_salt';


module.exports.createNewUser = function createNewUser(credentials, response, sqlPool) {
    let sqlQuery = mysql.format(`SELECT * FROM ${WEB_USERS} WHERE ${WEB_USER_NAME}=?`,
        credentials[USER_FIELD]);
    sqlPool.query(sqlQuery, function (error, results, fields) {
        if (error) throw error;
        let responseString = '';
    
        results.forEach(function(data) {
            responseString += data[WEB_USER_NAME] + ' : ';
        });

        if (responseString.length == 0) {
            insertNewUser(credentials, response, sqlPool);
        } else {
            html.loadPage(response, INDEX_SITE, 'User name taken. Choose a different one.');
        };
    });
};


function insertNewUser(credentials, response, sqlPool) {
    let encryptedData = encryption.encryptPassword(credentials[PASSWORD_FIELD]);
    let sqlQuery = mysql.format(
        `INSERT INTO ${WEB_USERS} (${WEB_USER_NAME}, ${WEB_USER_PASSWORD}, ${WEB_USER_SALT}) VALUES(?, ?, ?)`,
        [credentials[USER_FIELD], encryptedData.hash, encryptedData.salt]);
    sqlPool.query(sqlQuery, function (error, results, fields) {
        if (error) {
            html.loadPage(response, INDEX_SITE, 'User creation failed.');
            throw error; // dont want to just throw, should just print error and move on
        };
        html.loadPage(response, INDEX_SITE, 'Account created succesfully. Can login now.');
    });
};
  

module.exports.loginUser = function loginUser(credentials, response, sqlPool) {
    let sqlQuery = mysql.format(
        `SELECT * FROM ${WEB_USERS} WHERE ${WEB_USER_NAME}=?`, credentials[USER_FIELD]);
    sqlPool.query(sqlQuery, function (error, results, fields) {
        if (error) throw error;
        let responseString = '';
        let responseDict;

        results.forEach(function(data) {
            responseString += data[WEB_USER_NAME];
            responseDict = data;
        });
        // why is callback not an issue here for responseString or responseDict?

        if (responseString.length == 0) {
            html.loadPage(response, INDEX_SITE, 
                `Login failed. User '${unescape(credentials[USER_FIELD])}' does not exist.`);
        } else {
            if (encryption.validatePassword(credentials[PASSWORD_FIELD], 
                responseDict[WEB_USER_PASSWORD], responseDict[WEB_USER_SALT])) {
                html.loadPage(response, LOGGED_IN_SITE, 'Login successful.');
            } else {
                html.loadPage(response, INDEX_SITE, 'Login failed. Wrong password.');
            };
        };
    });    
};


module.exports.listUsers = function listUsers(response, loggedIn, sqlPool) {
    let sqlQuery = mysql.format(`SELECT * FROM ${WEB_USERS}`);
    sqlPool.query(sqlQuery, function (error, results, fields) {
        if (error) throw error;
        let responseString = '';
    
        results.forEach(function(data) {
            responseString += unescape(data[WEB_USER_NAME]) + '<br>';
        });

        if (responseString.length == 0) {
            html.loadPage(response, INDEX_SITE, 'No users found.');
            // cannot be empty if user logged in
        } else {
            if (loggedIn) {
                html.loadPage(response, USER_LIST_SITE, responseString, 'logged_in');
            } else {
                html.loadPage(response, USER_LIST_SITE, responseString, 'index');
            };
        };
    }); 
};