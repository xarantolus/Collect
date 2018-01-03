"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth = require("basic-auth");
var config = require('../config.json');
module.exports = function (req, res, next) {
    var user = auth(req);
    if (!user || !(user.name === config.username && user.pass === config.password)) {
        res.set('WWW-Authenticate', 'Basic realm="auth"');
        res.status(401).send();
        return;
    }
    else {
        next();
    }
};
//# sourceMappingURL=auth.js.map