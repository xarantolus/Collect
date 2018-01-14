"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require("crypto");
const fs = require("fs");
const api_path = "/api/v1/";
var config = require('../config.json');
var cookies = require('../cookies.json');
class Cookie {
    constructor(_value) {
        this.value = _value || "random_str";
        this.expires = new Date(Number(new Date()) + cookie_maxage);
        ;
    }
}
// cookies last one week
const cookie_maxage = 7 * 24 * 60 * 60 * 1000;
function isValidCookie(cookie_value) {
    var index = cookies.findIndex(item => item.value === cookie_value);
    if (index === -1) {
        return false;
    }
    var is_expired = cookies[index].expires < new Date();
    if (is_expired) {
        cookies.splice(index, 1);
        return false;
    }
    else {
        return true;
    }
}
function generateCookie(cb) {
    crypto.randomBytes(25, function (err, buffer) {
        if (err) {
            cb(err, null);
            return;
        }
        var cookie = new Cookie(buffer.toString('hex'));
        cb(null, cookie);
        // Save the cookies!
        cookies.push(cookie);
        fs.writeFile('cookies.json', JSON.stringify(cookies));
    });
}
module.exports = function (req, res, next) {
    var user = null;
    if (req.body && req.body.username && req.body.password) {
        user = { name: req.body.username, pass: req.body.password };
    }
    var session_cookie = req.cookies["session_id"];
    if (!session_cookie) {
        if (!user || !(user.name === config.username && user.pass === config.password)) {
            // We don't have a user or wrong info
            if (req.path.startsWith(api_path)) {
                // This is an api request
                if (req.param("token") === config.api_token) {
                    // It is authorized
                    return next();
                }
                else {
                    return res.status(401).json({ "message": "Access denied. Set a valid \"token\" in your parameters" });
                }
            }
            // Send the login page
            res.set('WWW-Authenticate', 'Basic realm="auth"');
            res.status(401).send();
            return;
        }
        else {
            // User can log in
            // We need to generate a cookie for the user
            generateCookie(function (err, c) {
                if (err) {
                    return next(err);
                }
                res.cookie("session_id", c.value, { expires: c.expires });
                next();
            });
        }
    }
    else {
        // We have user info
        if (isValidCookie(session_cookie)) {
            // this info is valid, continue
            next();
        }
        else {
            // wrong info, create a new one one
            res.clearCookie("session_id");
            res.set('WWW-Authenticate', 'Basic realm="auth"');
            res.status(401).send();
            return;
        }
    }
};
//# sourceMappingURL=auth.js.map