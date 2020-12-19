'use strict'

const mysql = require('mysql');
const encryption = require('./encryption');
const html = require('./html');

const USER_FIELD = 'gamerid';
const PASSWORD_FIELD = 'gamerpassword';

const INDEX_SITE = 'index.html';
const LOGGED_IN_SITE = 'logged-in.html';
const USER_LIST_SITE = 'user-list.html';
const WELCOME_MESSAGE = 'Welcome! Create account or login.';

const WEB_USERS = 'web_users';
const WEB_USER_NAME = 'web_user_name';
const WEB_USER_PASSWORD = 'web_user_password';
const WEB_USER_SALT = 'web_user_salt';

const mysqlHost = process.env['MYSQL_HOST'] || 'localhost'; //how does this || work?
//const mysqlHost = process.env.MYSQL_HOST || 'localhost';
//dictionary can be called with . too, but it is a bit confusing
// but it does look cleaner... 
//TODO: Look up best practices and conventions
const mysqlPort = process.env['MYSQL_PORT'] || '3306';
const mysqlUser = process.env['MYSQL_USER'] || 'root';
const mysqlPassword = process.env['MYSQL_PASSWORD'] || 'test99rootpasses';
const mysqlDatabase = process.env['MYSQL_DATABASE'] || 'website_data';
//should these still be consts? I think yes, because from what I understand,
//there are two types of consts - the full uppercase and lowercamelcase

const connectionOptions = {
    host: mysqlHost,
    port: mysqlPort,
    user: mysqlUser,
    password: mysqlPassword,
    database: mysqlDatabase
    //multipleStatements: true  //Do I need this?
    //connectionLimit: 10   //This is the default already
};

let sqlPool;

exports.initMySQLPool = function initMySQLPool() {
    console.log('MySQL connection: ', connectionOptions);
    sqlPool = mysql.createPool(connectionOptions);
    //should use .getConnection, connection.release()??
};


exports.loadIndexPage = function loadIndexPage(response) {
    html.loadPage(response, INDEX_SITE, WELCOME_MESSAGE);
};


exports.handleInput = function handleInput(inputString, userAction, response) {
    // too much nesting, refactor
    let credentials;
    if (inputString !== '') {
        credentials = storeUserInput(inputString);
        for (let [key, value] of Object.entries(credentials)) {
            if (value.length > 150) {
                if (key === USER_FIELD) {
                    html.loadPage(response, INDEX_SITE, 'User name too long');
                    return ; // should never go here due to maxlength of input field
                } else if (key === PASSWORD_FIELD) {
                    html.loadPage(response, INDEX_SITE, 'Password too long');
                    return ;
                };
            };
        };
    };
    if (userAction === '/create') {
        createNewUser(credentials, response);
    } else if (userAction === '/login') {
        loginUser(credentials, response);
    } else if (userAction === '/list') {
        listUsers(response, false);
    } else if (userAction === '/list_logged_in') {
        listUsers(response, true);
    } else if (userAction === '/back_to_index') {
        //html.loadPage(response, INDEX_SITE, WELCOME_MESSAGE);
        module.exports.loadIndexPage(response);
    } else if (userAction === '/back_to_logged_in') {
        html.loadPage(response, LOGGED_IN_SITE, 'welcome back from the list');
    } else if (userAction === '/logout') {
        //html.loadPage(response, INDEX_SITE, WELCOME_MESSAGE);
        module.exports.loadIndexPage(response);
    };
};

function storeUserInput(inputString) {
    let inputTextArray = inputString.split('&');
    let inputDictionary = {};
    // Could do for (let <field> of <text>)?
    inputTextArray.forEach(inputField => {
        let inputFieldArray = inputField.split('=');
        inputDictionary[inputFieldArray[0]] = inputFieldArray[1];
    });
    return inputDictionary;   
};


function createNewUser(credentials, response) {
    let sqlQuery = mysql.format(`SELECT * FROM ${WEB_USERS} WHERE ${WEB_USER_NAME}=?`,
        credentials[USER_FIELD]);
    sqlPool.query(sqlQuery, function (error, results, fields) {
        if (error) throw error;
        let responseString = '';
    
        results.forEach(function(data) {
            responseString += data[WEB_USER_NAME] + ' : ';
        });

        if (responseString.length == 0) {
            insertNewUser(credentials, response);
        } else {
            html.loadPage(response, INDEX_SITE, 'User name taken. Choose a different one.');
        };
    });
};


function insertNewUser(credentials, response) {
    let encryptedData = encryption.encryptPassword(credentials[PASSWORD_FIELD]);
    let sqlQuery = mysql.format(
        `INSERT INTO ${WEB_USERS} (${WEB_USER_NAME}, ${WEB_USER_PASSWORD}, ${WEB_USER_SALT}) VALUES(?, ?, ?)`,
        [credentials[USER_FIELD], encryptedData['hash'], encryptedData['salt']]);
    sqlPool.query(sqlQuery, function (error, results, fields) {
        if (error) {
            html.loadPage(response, INDEX_SITE, 'User creation failed.');
            throw error; // dont want to just throw, should just print error and move on
        };
        html.loadPage(response, INDEX_SITE, 'Account created succesfully. Can login now.');
    });
};
  

function loginUser(credentials, response) {
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
                `Login failed. User '${credentials[USER_FIELD]}' does not exist.`);
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


function listUsers(response, loggedIn) {
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