'use strict';

const USER_FIELD = 'gamerid';
const PASSWORD_FIELD = 'gamerpassword';
const MAX_FIELD_LENGTH = 150 // after escaping


module.exports.handleInput = function handleInput(inputString) {
    //TODO: test empty inputs
    if (inputString === '') {
        return {'error':'Input string empty'};
    };
    let inputDictionary = parseUserInput(inputString);
    switch (findOutOfBoundsInput(inputDictionary)) {
        case USER_FIELD:
            return {'issue':'Username too long'};
        case PASSWORD_FIELD:
            return {'issue':'Password too long'};
        case null:
            return inputDictionary;
    };
};


function parseUserInput(inputString) {
    let inputTextArray = inputString.split('&');
    let inputDictionary = {};
    inputTextArray.forEach(inputField => {
        let inputFieldArray = inputField.split('=');
        inputDictionary[inputFieldArray[0]] = inputFieldArray[1];
    });
    return inputDictionary;   
};


function findOutOfBoundsInput(inputDictionary) {
    for (let [key, value] of Object.entries(inputDictionary)) {
        if (value.length > MAX_FIELD_LENGTH) {
            return key;
            // user field should never be too long because of maxlength of input field
            // input might be circumvented by a direct request
            // could set a higher length ceiling for pass, since it gets hashed into 128 anyway
        };
    };
    return null;
};