'use strict';
//THIS CODE IS STILL PRETTY BAD, CONNECTIONS REGULARLY THROW ERRORS INTO CONSOLE
//BUT IT WORKS
const https = require('https'); 
const fs = require('fs');
const responseHandler = require('./response-handler');

const INTERNAL_EXPOSED_PORT = 3000;
const EXTERNAL_EXPOSED_PORT = process.env.PORT || 3000;
//const STATUS_OK_CODE = 200 //feels like overkill to use this

const serverOptions = {
    key: fs.readFileSync('ssl/key.pem'),
    cert: fs.readFileSync('ssl/cert.pem')
};

responseHandler.initMySQLPool();

// might need to use promises to make it better structured
const server = https.createServer(serverOptions, function (request, response) {
    // this is same as server.on('request')
    let body = [];
    request.on('error', (error) => {
        //console.error(error);
        // for now lets just pretend this error is not happening...
        console.log('error that we are ignoring');
    });
    request.on('data', (chunk) => {
        body.push(chunk);
    });
    request.on('end', () => {
        body = Buffer.concat(body).toString();  // not sure how this works exactly

        if (request.method === 'GET' && request.url === '/') {
            //html.loadPage(response, INDEX_SITE, WELCOME_MESSAGE);
            responseHandler.loadIndexPage(response);
        };
    
        if (request.method === 'POST') {
            //parseUserInput(body, request.url, response);
            responseHandler.handleInput(body, request.url, response);
        };
    });

}).listen(INTERNAL_EXPOSED_PORT, function (error){
    if (error) {
        console.log('Something went wrong ', error);
    } else {
        console.log('Server is listening on port', EXTERNAL_EXPOSED_PORT);
        // why does this return yellow number with space?
        // -I guess thats just how log function works with optional parameters
        // '' + argument does not
        // -maybe because + just turns argument to string and concatenates
    };
});

/*
// might need to use promises to make it better structured
function parseUserInput(inputString, userAction, response) {
    let credentials = storeUserInput(inputString);
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
    if (userAction === '/create') {
        createNewUser(credentials, response);
    } else if (userAction === '/login') {
        loginUser(credentials, response);
    } else if (userAction === '/list') {
        listUsers(response, false);
    } else if (userAction === '/list_logged_in') {
        listUsers(response, true);
    } else if (userAction === '/back_to_index') {
        html.loadPage(response, INDEX_SITE, WELCOME_MESSAGE);
    } else if (userAction === '/back_to_logged_in') {
        html.loadPage(response, LOGGED_IN_SITE, 'welcome back from the list');
    } else if (userAction === '/logout') {
        html.loadPage(response, INDEX_SITE, WELCOME_MESSAGE);
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
    let sqlQuery = mysql.format('SELECT * FROM web_users WHERE web_user_name=?',
        credentials[USER_FIELD]);
    sqlPool.query(sqlQuery, function (error, results, fields) {
        if (error) throw error;
        let responseString = '';
    
        results.forEach(function(data) {
            responseString += data['web_user_name'] + ' : ';
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
        'INSERT INTO web_users (web_user_name, web_user_password, web_user_salt) VALUES(?, ?, ?)',
        [credentials[USER_FIELD], encryptedData.hash, encryptedData.salt]);
    sqlPool.query(sqlQuery, function (error, results, fields) {
        if (error) {
            html.loadPage(response, INDEX_SITE, 'User creation failed.');
            throw error; // dont want to just throw, should just print error and move on
        }
        html.loadPage(response, INDEX_SITE, 'Account created succesfully. Can login now.');
    });
};
  

function loginUser(credentials, response) {
    let sqlQuery = mysql.format(
        'SELECT * FROM web_users WHERE web_user_name=?', credentials[USER_FIELD]);
    sqlPool.query(sqlQuery, function (error, results, fields) {
        if (error) throw error;
        let responseString = '';
        let responseDict

        results.forEach(function(data) {
            responseString += data['web_user_name'];
            responseDict = data
        });
        // why is callback not an issue here for responseString or responseDict?

        if (responseString.length == 0) {
            html.loadPage(response, INDEX_SITE, 
                `Login failed. User '${credentials[USER_FIELD]}' does not exist.`);
        } else {
            if (encryption.validatePassword(credentials[PASSWORD_FIELD], 
                responseDict['web_user_password'], responseDict['web_user_salt'])) {
                html.loadPage(response, LOGGED_IN_SITE, 'Login successful.');
            } else {
                html.loadPage(response, INDEX_SITE, 'Login failed. Wrong password.');
            };
        };
    });    
};


function listUsers(response, loggedIn) {
    let sqlQuery = mysql.format('SELECT * FROM web_users');
    sqlPool.query(sqlQuery, function (error, results, fields) {
        if (error) throw error;
        let responseString = '';
    
        results.forEach(function(data) {
            responseString += unescape(data['web_user_name']) + '<br>';
        });

        if (responseString.length == 0) {
            html.loadPage(response, INDEX_SITE, 'No users found.');
            // cannot be empty if user logged in
        } else {
            if (loggedIn) {
                html.loadPage(response, USER_LIST_SITE, responseString, 'logged_in')
            } else {
                html.loadPage(response, USER_LIST_SITE, responseString, 'index')
            }
        };
    }); 
}
*/