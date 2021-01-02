'use strict'

const mysql = require('mysql');
const mySQLConfig = require('../config').mySQLConfig;

const WEB_USERS = 'web_users';

let mySQLPool

console.log('initializing database file');

function initMySQLPool() {
    console.log('>>>MySQL connection: ', mySQLConfig);
    mySQLPool = mysql.createPool(mySQLConfig);
    //TODO promisify pool creation

    //mySQLPool.getConnection(function (error, connection) {
    //    //if (error) throw error;
    //    if (error) {
    //        console.log('MySQL connection state: ', connection.state);
    //        //wait 5 secs, try again
    //    }
    //    console.log('MySQL connection state: ', connection.state);
    //    connection.release();
    //});
    //try {
    //    await mySQLPool.getConnection();
   //     console.log('connection');
    //} catch (error) {
    //    console.log('!!ERROR!! ', error);
    //} finally {
    //    console.log('finally');
    //};
    
    console.log('<<<end of MySQLPool initialization');
};

initMySQLPool();

console.log('exporting mysqlpool: ', mySQLPool)
module.exports.mySQLPool = mySQLPool;