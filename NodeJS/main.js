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

//const CREATION_INPUT_FIELD_NAME = 'gameridnew'
const USER_FIELD = 'gamerid';
//const CREATION_INPUT_PASSWORD_FIELD_NAME = 'gamerpasswordnew'
// This just might be too much... Consider a different naming approach
const PASSWORD_FIELD = 'gamerpassword';

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
    //multipleStatements: true
    //connectionLimit: 10
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
    /*
    let body = '';
    request.on('data', function (chunk){
        body += chunk;
    });
    request.on('end', function(){
        if ( body !== '') {
            //console.log(typeof userInput)
            console.log('POSTed: ' + body);
            parseUserInput(body);
            response.writeHead(200); //Why do I need this?
            // send a response?
            //response.end();
    
            // deal with response in .end(callback)? THIS is .end already
        };
    });
    response.writeHead(200, { 'Content-Type' : 'text/html'});
    fs.readFile('main.html', function(error, data){
        if (error) {
            response.writeHead(404);
            response.write('Error: File not found');
        } else {
            response.write(data);
        }
        response.end();
    });
    */
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
            loadPage(response, 'index.html');
            //sqlConnection.connect();
        };
    
        if (request.method === 'POST') {
            //try to create user
            //send response - account created, login
            console.log('!!POST REQUEST BODY: ', body);
            parseUserInput(body, response, request.url);
            //parse user input
            //loadPage(response, 'user_created.html');
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


function createNewUser(credentials, response) {
    //sqlConnection.connect();
    let sqlQuery = mysql.format('SELECT * FROM web_users WHERE web_user_name=?',
        credentials[USER_FIELD]);
    sqlConnection.query(sqlQuery, function (error, results, fields) {
        if (error) throw error;
        let responseString = '';
    
        results.forEach(function(data) {
            responseString += data.ITEM_NAME + ' : ';
            console.log(data);
        });
    
        console.log('!!CREATE NEW ', responseString);

        if (responseString.length == 0) {
            insertNewUser(credentials, response);
        } else {
            loadPage(response, 'user_exists.html');
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
            loadPage(response, 'user_creation_failed.html');
            throw error; // dont want to just throw, should just print error and move on
        }
        loadPage(response, 'user_created.html');
        //sqlConnection.end();
        //sqlPool.release();??

        /*
        let responseString = '';
        //bad, rewrite for insert
        // is there data in my db now? yes
        results.forEach(function(data) {
            responseString += data.ITEM_NAME + ' : ';
            console.log(data);
        });

        //results.affectedRows for multiple line inserts

        // should i just catch error, and otherwise go to user_created?

        console.log(responseString);
        */


        /*
        if (responseString.length == 0) { // check if created
            loadPage(response, 'user_created.html');
            
        } else {
            loadPage(response, 'user_creation_failed.html');
        };
        */
    });
};
  

function loginUser(credentials, response) {
    let sqlQuery = mysql.format(
        'SELECT * FROM web_users WHERE web_user_name=?', credentials[USER_FIELD]);
    sqlConnection.query(sqlQuery, function (error, results, fields) {
        if (error) throw error;
        let responseString = '';
        let responseDict

        //console.log('!!SQL DATA');
        results.forEach(function(data) {
            responseString += data.ITEM_NAME + ' : ';
            //console.log(data);
            //console.log(data.ITEM_NAME);
            responseDict = data
        });
    
        //console.log('!!LOGIN ', responseString);
        //console.log('!!DATA ', responseDict);
        //console.log('!!CREDENTIALS PASS ', credentials[PASSWORD_FIELD]);
        //console.log('!!DATABASE PASS ', responseDict['web_user_password']);

        // how to get password from responseString?
        // why is responseString undefined?
        // because callback function is still doing its thing when console.log is called?
        // or because data.ITEM_NAME is not the right call?
        // - because data.ITEM_NAME is wrong.
        // but still, why is callback not an issue here?

        if (responseString.length == 0) {
            loadPage(response, 'user_not_exists.html');
        } else {
            if (passwordMatch(credentials[PASSWORD_FIELD], 
                responseDict['web_user_password'])) {
                loadPage(response, 'login_successful.html');
            } else {
                loadPage(response, 'wrong_password.html');
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


function listUsers(response) {
    let sqlQuery = mysql.format('SELECT * FROM web_users');
    sqlConnection.query(sqlQuery, function (error, results, fields) {
        if (error) throw error;
        let responseString = '';
    
        results.forEach(function(data) {
            responseString += data.ITEM_NAME + ' : ';
            console.log(data);
        });
    
        console.log('!!LIST ', responseString);

        if (responseString.length == 0) {
            // load message that table is empty
        } else {
            // load user list here
        };
    }); 
}


// might need to use promises to make it better structured
function parseUserInput(inputString, response, userAction) {
    let credentials = storeUserInput(inputString);

    if (userAction === '/create') {
        createNewUser(credentials, response);
    } else if (userAction === '/login') {
        loginUser(credentials, response);
    } else if (userAction === '/list') {
        listUsers(response); //how to pass response into html file?
    };
    /*
    let new_user;
    for (let key in credentials) {
        if (key.search(LOGIN_INPUT_FIELD_NAME) !== -1) {
            new_user = is_new_user(key);
            break;
        };
    };
    if (new_user === null) {
        console.log('unindetified user input ', inputString);
    } else if (new_user) {

    if (newUser) {
        if (user_exists(credentials[CREATION_INPUT_FIELD_NAME])) {
            console.log('user already exists: ', 
                credentials[CREATION_INPUT_FIELD_NAME]);
        } else {
            //validate_password
            create_new_user(credentials[CREATION_INPUT_FIELD_NAME], 
                credentials[CREATION_INPUT_PASSWORD_FIELD_NAME]);
        };
    } else {
        if (user_exists(credentials[LOGIN_INPUT_FIELD_NAME])) {
                let can_login = is_password_ok(credentials[CREATION_INPUT_FIELD_NAME], 
                    credentials[CREATION_INPUT_PASSWORD_FIELD_NAME])
                if (can_login) {
                    //proceed to logged in page
                    //but NOT IN PARSE FUNCTION
                } else {
                    console.log('incorrect password');
                };
        } else {
            console.log('user not found',
                credentials[LOGIN_INPUT_FIELD_NAME]);
        };
    };
    */
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

/*
// solved by checking action url
function is_new_user(inputName) { 
    // change this to receive action value
    // <input type="hidden" name="action" value="login" />
    if (inputName === CREATION_INPUT_FIELD_NAME) {
        return true;
    } else if (inputName === LOGIN_INPUT_FIELD_NAME) {
        return false;
    };
    return null
};
*/

/*
OLD CODE
// might be too many seperate calls to db, should use less?
// then would have unnecessary data
function user_exists(userName) {
    //check if user exists in db
    sqlQuery = mysql.format('SELECT * FROM web_users WHERE web_user_name=?', userName)
    sqlConnection.query(sqlQuery, function (error, results, fields) {
        if (error) throw error;
        let responseString = '';
    
        results.forEach(function(data) {
            responseString += data.ITEM_NAME + ' : ';
            console.log(data);
        });
    
        //if (responseString.length == 0) {
        //    responseString = 'No records found';
        //};
    
        console.log(responseString);
    });
    // how to get data out of callback function?

    // im really structuring the code wrong

    // could use promises

    // first lets make it simple please
};


function create_new_user(userName, userPassword) {
    //creates new user
};


function is_password_ok(userName, userPassword) {
    //check if password is ok
};


function validate_password(password) {
    //check if password meets minimum requirements
}
*/