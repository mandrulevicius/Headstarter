'use strict'

const fs = require('fs');

exports.loadPage = function loadPage(response, pageName, message, previousPage) {
    response.setHeader('Content-Type', 'text/html');
    // if you try to do two writeHeads, it messes up and you end up with questions like:
    // why is length not equal? Why is it writing content length in body?
    fs.readFile(`./user-interface/${pageName}`, function(error, data){
        if (error) {
            response.writeHead(404);
            response.write('Error: File not found ', pageName);
        } else {
            let htmlString = insertMessageIntoHtml(data.toString(), message);
            if (previousPage !== '') {
                htmlString = htmlString.replace('${page}', previousPage)
            };
            response.writeHead(200, {'Content-Length': Buffer.byteLength(htmlString)})
            response.write(htmlString);
        };
        response.end();
    });
};


function insertMessageIntoHtml(htmlString, message){
    // user regex? should be fine for now
    return htmlString.replace('${message}', message)
};