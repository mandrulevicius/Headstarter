'use strict';

const serverConfig = require('./config').serverConfig;

const https = require('https'); 
const controller = require('./controller');
const mySQLLoader = require('./loaders/database');


async function startServer() {
    let mySQLPool = await mySQLLoader.mySQLPool;
    console.log('waited for MySQLPool', mySQLPool);

    const server = https.createServer(serverConfig.serverOptions, function (request, response) {
        // this callback function is same as server.on('request')
        controller.handleRequest(request, response, mySQLPool);
    });
    
    // init sql pool, make a proxy call. if ok, done. if not, wait 5 seconds, try again
    // after 3 tries, throw error. 
    // (this will make sure the server only starts listening when the database is ready)
    
    server.listen(serverConfig.internalPort, function (error){
        if (error) {
            console.log('Something went wrong while listening to server:', error);
        } else {
            console.log('Server is listening on port', serverConfig.externalPort);
        };
    });
};

startServer();