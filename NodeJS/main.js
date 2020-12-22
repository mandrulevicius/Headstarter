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

// might need to use promises, await/async to make it better structured
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
        body = Buffer.concat(body).toString();

        responseHandler.handleInput(body, request.url, response);
    });

}).listen(INTERNAL_EXPOSED_PORT, function (error){
    // this is same as server.listen();
    if (error) {
        console.log('Something went wrong ', error);
    } else {
        console.log('Server is listening on port', EXTERNAL_EXPOSED_PORT);
        // why does this return yellow number with space (in local cmd console)?
        // -I guess thats just how log function works with optional parameters
        // '' + argument does not
        // -maybe because + just turns argument to string and concatenates
    };
});