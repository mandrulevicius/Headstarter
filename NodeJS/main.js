'use strict';

const serverConfig = require('./config').serverConfig;

const https = require('https'); 
const controller = require('./controller');

const mysql = require('mysql');
const mySQLConfig = require('./config').mySQLConfig;
const MySQLDatabase = require('./loaders/database');


async function startServer() {
    let database = new MySQLDatabase(mysql, mySQLConfig);

    const server = https.createServer(serverConfig.serverOptions, function (request, response) {
        // this callback function is same as server.on('request')
        controller.handleRequest(request, response, database);
    });
    
    // promise
    //database.query('SHOW DATABASES;').then(results => {
    //    console.log(results);
    //});

    if (await database.testConnection()) {
        server.listen(serverConfig.internalPort, function (error){
            if (error) {
                console.log('Something went wrong while listening to server:', error);
            } else {
                console.log('Server is listening on port', serverConfig.externalPort);
            };
        });
    } else {
        server.close();
        // not sure if this is doing anything, docker closes the app when its done anyway
    };
};


startServer();