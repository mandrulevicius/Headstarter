'use strict';
const http = require('http');  // use express?
const fs = require('fs');
const mysql = require('mysql');
const sqlString = require('sqlstring');
const WEBSITE_PORT = process.env.PORT || 3000;
//const STATUS_OK_CODE = 200 //feels like overkill to use this
const CREATION_INPUT_FIELD_NAME = 'gameridnew'
const LOGIN_INPUT_FIELD_NAME = 'gamerid'
const CREATION_INPUT_PASSWORD_FIELD_NAME = 'gamerpasswordnew'
const LOGIN_INPUT_PASSWORD_FIELD_NAME = 'gamerpassword'
// This just might be too much... Consider a different naming approach

const mysqlHost = process.env.MYSQL_HOST || 'localhost'; //how does this || work?
const mysqlPort = process.env.MYSQL_PORT || '3306';
const mysqlUser = process.env.MYSQL_USER || 'root';
const mysqlPassword = process.env.MYSQL_PASSWORD || 'test99passes';
const mysqlDatabase = process.env.MYSQL_DATABASE || 'website_data';

const connectionOptions = {
    host: mysqlHost,
    port: mysqlPort,
    user: mysqlUser,
    password: mysqlPassword,
    database: mysqlDatabase
};

console.log('MySQL connection: ', connectionOptions)

let sqlConnection = mysql.createConnection(connectionOptions);

sqlConnection.connect();

// for some reason this is called before the db is ready?
// depends_on should have solved this?
// try to move this code to where it is supposed to be, after accepting a request from website
sqlConnection.query('SELECT * FROM web_users', function (error, results, fields) {
    if (error) throw error;
    responseString = '';

    results.forEach(function(data) {
        responseString += data.ITEM_NAME + ' : ';
        console.log(data)
    })

    if (responseString.length == 0) {
        responseString = 'No records found'
    }

    console.log(responseString);

    results.status(200).send(responseString);
});

sqlConnection.end()

const server = http.createServer(function (request, response) {
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
            //response.end();
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
});

server.listen(WEBSITE_PORT, function (error){
    if (error) {
        console.log('Something went wrong ', error);
    } else {
        console.log('Server is listening on port ', WEBSITE_PORT);
        // why does this return yellow number with space?
        // '' + argument does not
    };
});


//dont like this function, consider structuring this code differently
// first write sql part
// second figure out how logged in page is going to be called
function parseUserInput(inputString) {
    let credentials = storeUserInput(inputString);
    let new_user;
    for (key in credentials) {
        if (key.search(LOGIN_INPUT_FIELD_NAME) !== -1) {
            new_user = is_new_user(key);
            break;
        };
    };
    if (new_user === null) {
        console.log('unindetified user input ', inputString);
    } else if (new_user) {
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
};


function storeUserInput(inputString) {
    let inputTextArray = inputString.split('&');
    let inputDictionary = {};
    // Could do for (let field of text)
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
    //Will not mess up passwords?
    //Prob should do a lot more. 
    //what is whitelist mapping?
    return sqlString.escape(userInput);
};


function is_new_user(inputName) {
    if (inputName === CREATION_INPUT_FIELD_NAME) {
        return true;
    } else if (inputName === LOGIN_INPUT_FIELD_NAME) {
        return false;
    };
    return null
};


// might be too many seperate calls to db, should use less?
// then would have unnecessary data
function user_exists(userName) {
    //check if user exists in db
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