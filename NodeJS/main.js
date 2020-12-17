'use strict';
//THIS CODE IS STILL PRETTY BAD, CONNECTIONS REGULARLY THROW ERRORS INTO CONSOLE
//BUT IT WORKS
const http = require('http');  // use express?
const https = require('https'); 
const fs = require('fs');
const mysql = require('mysql');
const encryption = require('./encryption')
const sqlString = require('sqlstring'); //mysql also has .escape
//do i need to both format and escape??
// seems like ? placeholder is enough?

const WEBSITE_PORT = process.env.PORT || 3000;
//const STATUS_OK_CODE = 200 //feels like overkill to use this

const USER_FIELD = 'gamerid';
const PASSWORD_FIELD = 'gamerpassword';
const INDEX_SITE = 'index.html';
const LOGGED_IN_SITE = 'logged-in.html';
const USER_LIST_SITE = 'user-list.html';
const WELCOME_MESSAGE = 'Welcome! Create account or login.';

const mysqlHost = process.env.MYSQL_HOST || 'localhost'; //how does this || work?
const mysqlPort = process.env.MYSQL_PORT || '3306';
const mysqlUser = process.env.MYSQL_USER || 'root';
const mysqlPassword = process.env.MYSQL_PASSWORD || 'test99rootpasses';
const mysqlDatabase = process.env.MYSQL_DATABASE || 'website_data';
//should these still be consts?
// from what I understand, there are two types of consts - the full uppercase and lowercase

const connectionOptions = {
    host: mysqlHost,
    port: mysqlPort,
    user: mysqlUser,
    password: mysqlPassword,
    database: mysqlDatabase
    //multipleStatements: true  //Do I need this?
    //connectionLimit: 10   //This is the default already
};

console.log('MySQL connection: ', connectionOptions);

//let sqlConnection = mysql.createConnection(connectionOptions);
let sqlPool = mysql.createPool(connectionOptions);
//should use .getConnection, connection.release()??

// should encrypt password before sending

const serverOptions = {
    key: fs.readFileSync('ssl/key.pem'),
    cert: fs.readFileSync('ssl/cert.pem')
};

const server = https.createServer(serverOptions, function (request, response) {
    let body = [];
    request.on('error', (error) => {
        console.log('before error');
        console.error(error);
    });
    request.on('data', (chunk) => {
        body.push(chunk);
    });
    request.on('end', () => {
        body = Buffer.concat(body).toString();  // not sure how this works exactly

        //console.log('request end');
        //console.log(request.method);
        //console.log(request.url);

        if (request.method === 'GET' && request.url === '/') {
            loadPage(response, INDEX_SITE, WELCOME_MESSAGE);
        };
    
        if (request.method === 'POST') {
            //console.log('before parse');
            parseUserInput(body, request.url, response);
            //console.log('after parse, async');
        };
    });
    
    
}).listen(WEBSITE_PORT, function (error){
    if (error) {
        console.log('Something went wrong ', error);
    } else {
        console.log('Server is listening on port ', WEBSITE_PORT);
        // why does this return yellow number with space?
        // '' + argument does not
    };
});


// might need to use promises to make it better structured
function parseUserInput(inputString, userAction, response) {
    let credentials = storeUserInput(inputString);
    for (let [key, value] of Object.entries(credentials)) {
        if (value.length > 50) {
            if (key === USER_FIELD) {
                loadPage(response, INDEX_SITE, 'User name too long');
                return ;
            } else if (key === PASSWORD_FIELD) {
                loadPage(response, INDEX_SITE, 'Password too long');
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
        loadPage(response, INDEX_SITE, WELCOME_MESSAGE);
    } else if (userAction === '/back_to_logged_in') {
        loadPage(response, LOGGED_IN_SITE, 'welcome back from the list');
    } else if (userAction === '/logout') {
        loadPage(response, INDEX_SITE, WELCOME_MESSAGE);
    };
};


function storeUserInput(inputString) {
    let inputTextArray = inputString.split('&');
    let inputDictionary = {};
    // Could do for (let <field> of <text>)?
    inputTextArray.forEach(inputField => {
        let inputFieldArray = inputField.split('=');
        inputDictionary[inputFieldArray[0]] = 
            sanitizeUserInput(inputFieldArray[1]);
    });
    return inputDictionary;   
};


function sanitizeUserInput(userInput) {
    //Should sanitize before spliting? Need to deal with & and = symbols
    // -Dont need to, http request is already escaped for & and =

    //Will not mess up passwords? - No
    //Prob should do a lot more. - No
    //what is whitelist mapping? - Dont think about it
    return sqlString.escape(userInput);
};


/*
//same name function is ok as long as it has different parameters
function loadPage(response, pageName, message) {
    response.writeHead(200, { 'Content-Type' : 'text/html'});
    fs.readFile(pageName, function(error, data){
        if (error) {
            response.writeHead(404);
            response.write('Error: File not found');
        } else {
            let htmlString = insertMessageIntoHtml(data.toString(), message);
            response.write(htmlString);
        }
        response.end();
    });
};
*/


function loadPage(response, pageName, message, previousPage) {
    //response.writeHead(200, { 'Content-Type' : 'text/html'});
    response.setHeader('Content-Type', 'text/html');
    // if you try to do two writeHeads, it messes up and you end up with questions like:
    // why is length not equal. Why is it sending 61b? thats content length
    fs.readFile(pageName, function(error, data){
        if (error) {
            response.writeHead(404);
            response.write('Error: File not found');
        } else {
            let htmlString = insertMessageIntoHtml(data.toString(), message);
            if (pageName === USER_LIST_SITE) {
                htmlString = htmlString.replace('${page}', previousPage)
            };
            //console.log('before write')
            //console.log(htmlString)
            response.writeHead(200, {'Content-Length': Buffer.byteLength(htmlString)})
            // might fix the premature socket closing issue
            // might also need to add connection: 'Close' to header for multiple connections
            //console.log('content length ', Buffer.byteLength(htmlString))
            response.write(htmlString);
            console.log('after write')
        };
        console.log('before response end')
        response.end(function () {
            console.log('on response end')
        });
        console.log('after response end, async');
    });
};


function insertMessageIntoHtml(htmlString, message){
    // user regex?
    return htmlString.replace('${message}', message)
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
            loadPage(response, INDEX_SITE, 'User name taken. Choose a different one.');
        };
    });
};


function insertNewUser(credentials, response) {
    // I might be triple escaping with format function here, ? placeholders and sqlstring.escape
    let encryptedData = encryption.encryptPassword(credentials[PASSWORD_FIELD]);

    let sqlQuery = mysql.format(
        'INSERT INTO web_users (web_user_name, web_user_password, web_user_salt) VALUES(?, ?, ?)',
        [credentials[USER_FIELD], encryptedData.hash, encryptedData.salt]);
    sqlPool.query(sqlQuery, function (error, results, fields) {
        if (error) {
            loadPage(response, INDEX_SITE, 'User creation failed.');
            throw error; // dont want to just throw, should just print error and move on
        }
        loadPage(response, INDEX_SITE, 'Account created succesfully. Can login now.');
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
    
        // why is callback not an issue here?

        // what was data.ITEM_NAME supposed to do? - it was table name in example

        if (responseString.length == 0) {
            loadPage(response, INDEX_SITE, `Login failed. User ${credentials[USER_FIELD]} does not exist.`);
        } else {
            if (encryption.validatePassword(credentials[PASSWORD_FIELD], 
                responseDict['web_user_password'], responseDict['web_user_salt'])) {
                loadPage(response, LOGGED_IN_SITE, 'Login successful.');
            } else {
                loadPage(response, INDEX_SITE, 'Login failed. Wrong password.');
            };
        };
    });    
};


/*
OLD CODE
function passwordMatch(inputPassword, dbPassword) {
    if (inputPassword === dbPassword) {
        return true;
    };
    return false;
};
*/

function listUsers(response, loggedIn) {
    let sqlQuery = mysql.format('SELECT * FROM web_users');
    sqlPool.query(sqlQuery, function (error, results, fields) {
        if (error) throw error;
        let responseString = '';
    
        results.forEach(function(data) {
            responseString += data['web_user_name'] + '<br>';
        });

        if (responseString.length == 0) {
            loadPage(response, INDEX_SITE, 'No users found.');
            // cannot be empty if user logged in
        } else {
            if (loggedIn) {
                loadPage(response, USER_LIST_SITE, responseString, 'logged_in')
            } else {
                loadPage(response, USER_LIST_SITE, responseString, 'index')
            }
        };
    }); 
}