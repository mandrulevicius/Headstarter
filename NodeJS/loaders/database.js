'use strict'

const ATTEMPTS = 5
const DELAY = 15000

//class + DI + promise
class MySQLDatabase {
    constructor(mysql, config) {
        this.config = config;
        this.sqlPool = mysql.createPool(config);
        this.mysql = mysql;
        console.log('constructed');
    };


    async testConnection() {
        let connected = false;
        let tries = 1;
        while (!connected && tries <= ATTEMPTS) {
            try {
                console.log('attempting to connect to database, try number', tries);
                let connection = await this.getConnection();
                //can log the connection
                console.log('connection successful');
                connected = true;
            } catch (error) {
                tries += 1;
                if (tries <= ATTEMPTS) {
                    console.log(`failed to connect to database, waiting ${DELAY/1000} seconds`);
                    await promiseTimeout(DELAY);
                } else {
                    console.error(`failed to connect after ${ATTEMPTS} tries`);
                    console.error(error);
                };
            };
        };
        return connected;
    };

    // could use promisify for this
    query(sql, args) {
        console.log('query');
        return new Promise ((resolve, reject) => {
            this.sqlPool.query(sql, args, (error, results) => {
                if (error) {
                    return reject(error);
                };
                resolve(results);
            });
        });
    };


    getConnection() {
        console.log('getting connection');
        return new Promise((resolve, reject) => {
            this.sqlPool.getConnection((error, connection) => {
                if (error) {
                    return reject(error);
                };
                resolve(connection);
            });
        });
    };


    format(sql, args) {
        return this.mysql.format(sql, args);
    };
};


// where should this kind of function be? maybe in helper file?
function promiseTimeout(delayms) {
    return new Promise(function (resolve, reject) {
        setTimeout(resolve, delayms);
    });
};


module.exports = MySQLDatabase;


/*
OLD

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

*/