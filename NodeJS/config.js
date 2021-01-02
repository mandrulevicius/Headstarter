'use strict';

const fs = require('fs');

module.exports.serverConfig = {
    internalPort: 3000,
    externalPort: process.env.PORT || 3000,
    
    serverOptions: {
        key: fs.readFileSync('ssl/key.pem'),
        cert: fs.readFileSync('ssl/cert.pem')
    }
};

module.exports.mySQLConfig = {
    host: process.env.MYSQL_HOST || 'localhost', //how does this || work?
    port: process.env.MYSQL_PORT || '3306',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'test99rootpasses',
    database: process.env.MYSQL_DATABASE || 'website_data'
};
