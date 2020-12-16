'use strict';
//THIS CODE IS HORRIBLE, CONNECTIONS REGULARLY THROW ERRORS INTO CONSOLE
//BUT IT WORKS
const http = require('http');  // use express?
const fs = require('fs');
const mysql = require('mysql');
const sqlString = require('sqlstring'); //mysql also has .escape
//do i need to both format and escape??
// seems like ? placeholder is enough?

const WEBSITE_PORT = process.env.PORT || 3000;
//const STATUS_OK_CODE = 200 //feels like overkill to use this

const USER_FIELD = 'gamerid';
const PASSWORD_FIELD = 'gamerpassword';
const INDEX_SITE = 'index.html';
const LOGGED_IN_SITE = 'logged_in.html';
const USER_LIST_SITE = 'user_list.html';
const WELCOME_MESSAGE = 'Welcome. Create account or login.';

const mysqlHost = process.env.MYSQL_HOST || 'localhost'; //how does this || work?
const mysqlPort = process.env.MYSQL_PORT || '3306';
const mysqlUser = process.env.MYSQL_USER || 'root';
const mysqlPassword = process.env.MYSQL_PASSWORD || 'test99rootpasses';
const mysqlDatabase = process.env.MYSQL_DATABASE || 'website_data';
//should these still be consts?
// from what i understand, there are two types of consts - the full uppercase and lowercase

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
let sqlConnection = mysql.createPool(connectionOptions);
//should rename to sqlPool? should use .getConnection, connection.release()??

/*
// depends_on doesnt solve calling db before ready because it doesnt wait for dependants to be ready
// can restart after mysql is finished booting up

// also seems to be an authentication issue. nodejs doesnt support mysql8
// solved with initialization sql script
sqlConnection.query('SELECT * FROM web_users', function (error, results, fields) {
    if (error) throw error;
    let responseString = '';

    results.forEach(function(data) {
        responseString += data.ITEM_NAME + ' : ';
        console.log(data);
    });

    if (responseString.length == 0) {
        responseString = 'No records found';
    };

    console.log(responseString);

    //response.status(200).send(responseString); this is for express
});
*/

// should encrypt password before sending

const server = http.createServer(function (request, response) {
    let body = [];
    request.on('error', (error) => {
        console.error(error);
    });
    request.on('data', (chunk) => {
        body.push(chunk);
    });
    request.on('end', () => {
        body = Buffer.concat(body).toString();  // not sure how this works exactly

        if (request.method === 'GET' && request.url === '/') {
            loadPage(response, INDEX_SITE, WELCOME_MESSAGE);
            //sqlConnection.connect();
        };
    
        if (request.method === 'POST') {
            console.log('!!POST REQUEST BODY: ', body);
            parseUserInput(body, response, request.url);
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
function parseUserInput(inputString, response, userAction) {
    let credentials = storeUserInput(inputString);

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
    // Could do for (let <field> of <text>)
    inputTextArray.forEach(inputField => {
        let inputFieldArray = inputField.split('=');
        console.log(inputFieldArray);
        inputDictionary[inputFieldArray[0]] = 
            sanitizeUserInput(inputFieldArray[1]);
    });
    console.log(inputDictionary);
    return inputDictionary;   
};


function sanitizeUserInput(userInput) {
    //Should sanitize before spliting? Need to deal with & and = symbols
    // Dont need to, http request is already escaped for & and =

    //Will not mess up passwords? - No
    //Prob should do a lot more. - No
    //what is whitelist mapping? - Dont think about it
    return sqlString.escape(userInput);
};


function loadPage(response, pageName) {
    response.writeHead(200, { 'Content-Type' : 'text/html'});
    fs.readFile(pageName, function(error, data){
        if (error) {
            response.writeHead(404);
            response.write('Error: File not found');
        } else {
            response.write(data);
        }
        response.end();
    });
};


//same name function is ok as long as it has different parameters?
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


function loadPage(response, pageName, message, previousPage) {
    response.writeHead(200, { 'Content-Type' : 'text/html'});
    fs.readFile(pageName, function(error, data){
        if (error) {
            response.writeHead(404);
            response.write('Error: File not found');
        } else {
            console.log('MESSAGE ', message);
            console.log('RPEVIOUS PAGE ', previousPage);
            let htmlString = insertMessageIntoHtml(data.toString(), message);
            if (pageName === USER_LIST_SITE) {
                // if unnecessary, but this is still a mess so might as well leave it
                htmlString = htmlString.replace('${page}', previousPage)
            };
            console.log(htmlString);
            response.write(htmlString);
        }
        response.end();
    });
};


function insertMessageIntoHtml(htmlString, message){
    // user regex?
    return htmlString.replace('${message}', message)
};


function createNewUser(credentials, response) {
    //sqlConnection.connect();
    let sqlQuery = mysql.format('SELECT * FROM web_users WHERE web_user_name=?',
        credentials[USER_FIELD]);
    sqlConnection.query(sqlQuery, function (error, results, fields) {
        if (error) throw error;
        let responseString = '';
    
        results.forEach(function(data) {
            responseString += data.ITEM_NAME + ' : ';
            //this prob results in undefined responseString
            console.log(data);
        });
    
        console.log('!!CREATE NEW ', responseString);

        if (responseString.length == 0) {
            insertNewUser(credentials, response);
        } else {
            loadPage(response, INDEX_SITE, 'User name taken. Choose a different one.');
            //sqlConnection.end();
        };
    });
};


function insertNewUser(credentials, response) {
    // I might be triple escaping with format function here, ? placeholders and sqlstring.escape
    let sqlQuery = mysql.format(
        'INSERT INTO web_users (web_user_name, web_user_password) VALUES(?, ?)',
        [credentials[USER_FIELD], credentials[PASSWORD_FIELD]]);
    sqlConnection.query(sqlQuery, function (error, results, fields) {
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
    sqlConnection.query(sqlQuery, function (error, results, fields) {
        if (error) throw error;
        let responseString = '';
        let responseDict

        results.forEach(function(data) {
            responseString += data.ITEM_NAME + ' : ';
            responseDict = data
        });
    
        // how to get password from responseString?
        // why is responseString undefined?
        // because callback function is still doing its thing when console.log is called?
        // or because data.ITEM_NAME is not the right call?
        // - because data.ITEM_NAME is wrong.
        // but still, why is callback not an issue here?

        // this relies on responseString being empty instead of containing undefined value..
        if (responseString.length == 0) {
            loadPage(response, INDEX_SITE, `Login failed. User ${credentials[USER_FIELD]} does not exist.`);
        } else {
            if (passwordMatch(credentials[PASSWORD_FIELD], 
                responseDict['web_user_password'])) {
                loadPage(response, LOGGED_IN_SITE, 'Login successful.');
            } else {
                loadPage(response, INDEX_SITE, 'Login failed. Wrong password.');
            };
        };
    });    
};


function passwordMatch(inputPassword, dbPassword) {
    if (inputPassword === dbPassword) {
        return true;
    };
    return false;
};


function listUsers(response, loggedIn) {
    let sqlQuery = mysql.format('SELECT * FROM web_users');
    sqlConnection.query(sqlQuery, function (error, results, fields) {
        if (error) throw error;
        let responseString = '';
    
        results.forEach(function(data) {
            responseString += data['web_user_name'] + '\n';
            console.log(data);
        });
    
        console.log('!!LIST ', responseString);

        if (responseString.length == 0) {
            loadPage(response, INDEX_SITE, 'No users found.');
            // cannot be empty if user logged in
        } else {
            // load user list here
            // if logged in, load with backtologgin
            // else load with backtoindex
            if (loggedIn) {
                loadPage(response, USER_LIST_SITE, responseString, 'logged_in')
            } else {
                loadPage(response, USER_LIST_SITE, responseString, 'index')
            }
        };
    }); 
}