import auth = require('basic-auth');
import express = require('express');


var admins: any = {
    'user': { password: 'example' },
};


module.exports = function(req: express.Request, res: express.Response, next: express.NextFunction): any {
    var user = auth(req);
    if (!user || !admins[user.name] || admins[user.name].password !== user.pass) {
        res.set('WWW-Authenticate', 'Basic realm="auth"');
        res.status(401).send();
        return;
    } else {
        next();
    }
};