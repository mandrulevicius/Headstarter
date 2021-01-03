'use strict';

const responseEvents = require('./subscribers').responseEvents;


module.exports.handleRequest = function handleRequest(request, response, database) {
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

        responseEvents.emit(request.url, body, response, database);
        // what happens if unknown url is requested?
        // should not crash the whole thing.

        // should check request.urls here and direct to appropriate events?
        // probably
    });
};
