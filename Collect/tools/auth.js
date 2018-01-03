"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth = require("basic-auth");
var admins = {
    'user': { password: 'example' },
};
module.exports = function (req, res, next) {
    var user = auth(req);
    if (!user || !admins[user.name] || admins[user.name].password !== user.pass) {
        res.set('WWW-Authenticate', 'Basic realm="auth"');
        res.status(401).send();
        return;
    }
    else {
        next();
    }
};
//# sourceMappingURL=auth.js.map