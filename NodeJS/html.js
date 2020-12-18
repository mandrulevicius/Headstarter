'use strict'

const fs = require('fs');

exports.loadPage = function loadPage(response, pageName, message, previousPage) {
    //response.writeHead(200, { 'Content-Type' : 'text/html'});
    response.setHeader('Content-Type', 'text/html');
    response.setHeader('CONNECTION', 'Close'); //this doesnt seem to be helping
    // if you try to do two writeHeads, it messes up and you end up with questions like:
    // why is length not equal? Why is it writing content length in body?
    fs.readFile(pageName, function(error, data){
        if (error) {
            response.writeHead(404);
            response.write('Error: File not found');
        } else {
            let htmlString = insertMessageIntoHtml(data.toString(), message);
            if (previousPage !== '') {
                htmlString = htmlString.replace('${page}', previousPage)
            };
            response.writeHead(200, {'Content-Length': Buffer.byteLength(htmlString)})
            //response.writeHead(200, {'Content-Length': htmlString.length})
            // might fix the premature socket closing issue
            // might also need to add connection: 'Close' to header for multiple connections
            // doesnt help. First request-response ok, every other not.
            response.write(htmlString);
        };
        response.end();
    });
};


function insertMessageIntoHtml(htmlString, message){
    // user regex? should be fine for now
    return htmlString.replace('${message}', message)
};