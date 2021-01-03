'use strict';

const EventEmitter = require('events');
const input = require('./services/input.js');
const user = require('./services/user.js');
const html = require('./user-interface/html');

const INDEX_SITE = 'index.html';
const LOGGED_IN_SITE = 'logged-in.html';
const WELCOME_MESSAGE = 'Welcome! Create account or login.';
const USER_LIST_SITE = 'user-list.html';


const responseEvents = new EventEmitter();


responseEvents.on('/', function(inputString, response, database) {
    html.loadPage(response, INDEX_SITE, WELCOME_MESSAGE);
});


responseEvents.on('/create', async function(inputString, response, database) {
    let credentials = input.handleInput(inputString);
    if ('error' in credentials) {
        html.loadPage(response, INDEX_SITE, credentials.error);
        //should this crash/reset connection instead?
    } else if ('issue' in credentials) {
        html.loadPage(response, INDEX_SITE, credentials.issue);
    } else {
        let userExists = await user.userExists(credentials, database);
        if (userExists) {
            html.loadPage(response, INDEX_SITE, 'User name taken. Choose a different one.');
        } else if (!userExists) {
            let insertSuccess = await user.insertNewUser(credentials, database);
            if (insertSuccess) {
                html.loadPage(response, INDEX_SITE, 'Account created succesfully. Can login now.');
            } else {
                html.loadPage(response, INDEX_SITE, 'User creation failed.');
            };
        } else {
            html.loadPage(response, INDEX_SITE, 'User exists check failed.');
        }
    };
    // feels like too much nesting, but not sure how to improve
});


responseEvents.on('/login', async function(inputString, response, database) {
    let credentials = input.handleInput(inputString);
    if ('error' in credentials) {
        html.loadPage(response, INDEX_SITE, credentials.error);
        //should this crash/reset connection instead?
    } else if ('issue' in credentials) {
        html.loadPage(response, INDEX_SITE, credentials.issue);
    } else {
    //same code as previous event. move to function in input handling?
    //might mess up responsibilities. Should prob stay here.
    //move to function in this file? feels like i shouldnt have non event functions here
    //but then maybe i shouldnt have routes here either.
        let loginResult = await user.loginUser(credentials, database);
        if ('error' in loginResult) {
            html.loadPage(response, INDEX_SITE, 'login failed');
        } else if ('issue' in loginResult) {
            html.loadPage(response, INDEX_SITE, loginResult.issue);
        } else {
            html.loadPage(response, LOGGED_IN_SITE, loginResult.success);
        };
    };
});


responseEvents.on('/list?', async function(inputString, response, database) {
    // when input button has no name
    let listResult = await user.listUsers(database);
    if ('error' in listResult) {
        html.loadPage(response, INDEX_SITE, 'listing users failed');
    } else if ('issue' in listResult) {
        html.loadPage(response, INDEX_SITE, listResult.issue);
    } else {
        html.loadPage(response, USER_LIST_SITE, listResult.success, 'index');
    };
});


responseEvents.on('/list_logged_in?list=User+List', async function(inputString, response, database) {
    // when input button has a name and value
    let listResult = await user.listUsers(database);
    if ('error' in listResult) {
        html.loadPage(response, LOGGED_IN_SITE, 'listing users failed');
    } else if ('issue' in listResult) {
        html.loadPage(response, LOGGED_IN_SITE, listResult.issue);
        // cannot be empty if user logged in
        // if this is called something is very wrong, should log.
    } else {
        html.loadPage(response, USER_LIST_SITE, listResult.success, 'logged_in');
    };
});


responseEvents.on('/back_to_index?', function(inputString, response, database) {
    html.loadPage(response, INDEX_SITE, WELCOME_MESSAGE);
});


responseEvents.on('/back_to_logged_in?', function(inputString, response, database) {
    html.loadPage(response, LOGGED_IN_SITE, 'welcome back from the list');
});


responseEvents.on('/logout?', function(inputString, response, database) {
    html.loadPage(response, INDEX_SITE, WELCOME_MESSAGE);
});


//what else to catch? what url do i get when the error happens? I dont cause it happens in response?

module.exports.responseEvents = responseEvents;