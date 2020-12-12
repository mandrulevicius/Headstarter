const http = require('http');  // use express?
const fs = require('fs');
const PORT = 3000;
//const STATUS_OK_CODE = 200 

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
            //response.writeHead(200);
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

server.listen(PORT, function (error){
    if (error) {
        console.log('Something went wrong ', error);
    } else {
        console.log('Server is listening on port ' + PORT);
    };
});


function parseUserInput(inputText) {
    let inputTextArray = inputText.split('&');
    let inputDictionary = {};
    // Could do for (let field of text)
    inputTextArray.forEach(inputField => {
        let inputFieldArray = inputField.split("=");
        console.log(inputFieldArray);
        inputDictionary[inputFieldArray[0]] = inputFieldArray[1];
    });
    console.log(inputDictionary);
};