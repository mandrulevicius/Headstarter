'use strict';

const EventEmitter = require('events');
const input = require('./services/input.js');
const user = require('./services/user.js');
const html = require('./frontend/html');

const INDEX_SITE = 'index.html';
const LOGGED_IN_SITE = 'logged-in.html';
const WELCOME_MESSAGE = 'Welcome! Create account or login.';


const responseEvents = new EventEmitter();


responseEvents.on('/', function(inputString, response, sqlPool) {
    html.loadPage(response, INDEX_SITE, WELCOME_MESSAGE);
});

responseEvents.on('/create', function(inputString, response, sqlPool) {
    let credentials = input.handleInput(inputString);
    if ('error' in credentials) {
        html.loadPage(response, INDEX_SITE, credentials.error);
        //should this crash/reset connection instead?
    } else if ('issue' in credentials) {
        html.loadPage(response, INDEX_SITE, credentials.issue);
    } else {
        user.createNewUser(credentials, response, sqlPool);
    };
});

responseEvents.on('/login', function(inputString, response, sqlPool) {
    let credentials = input.handleInput(inputString);
    if ('error' in credentials) {
        html.loadPage(response, INDEX_SITE, credentials.error);
        //should this crash/reset connection instead?
    } else if ('issue' in credentials) {
        html.loadPage(response, INDEX_SITE, credentials.issue);
    } else {
        user.loginUser(credentials, response, sqlPool);
        //same code except this line. move to function?
        //should it be in input handling file? then pass html dependency
    };
});

responseEvents.on('/list?', function(inputString, response, sqlPool) {
    // when input button has no name
    user.listUsers(response, false, sqlPool);
});

responseEvents.on('/list_logged_in?list=User+List', function(inputString, response, sqlPool) {
    // when input button has a name and value
    user.listUsers(response, true, sqlPool);
});

responseEvents.on('/back_to_index?', function(inputString, response, sqlPool) {
    html.loadPage(response, INDEX_SITE, WELCOME_MESSAGE);
});

responseEvents.on('/back_to_logged_in?', function(inputString, response, sqlPool) {
    html.loadPage(response, LOGGED_IN_SITE, 'welcome back from the list');
});

responseEvents.on('/logout?', function(inputString, response, sqlPool) {
    html.loadPage(response, INDEX_SITE, WELCOME_MESSAGE);
});

//what else to catch? what url do i get when the error happens? I dont cause it happens in response?

module.exports.responseEvents = responseEvents;