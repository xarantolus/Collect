import auth = require('basic-auth');
import express = require('express');

var config = require('../config.json');

module.exports = function (req: express.Request, res: express.Response, next: express.NextFunction): any {
    var user = auth(req);
    if (!user || !(user.name === config.username && user.pass === config.password)) {
        res.set('WWW-Authenticate', 'Basic realm="auth"');
        res.status(401).send();
        return;
    } else {
        next();
    }
};