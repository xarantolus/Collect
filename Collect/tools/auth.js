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
        fs.writeFile('cookies.json', JSON.stringify(cookies), function (err) {
            if (err) {
                console.log(err);
            }
        });
    });
}
const resWhitelist = ["/android-icon-144x144.png", "/android-icon-192x192.png", "/android-icon-36x36.png", "/android-icon-48x48.png", "/android-icon-72x72.png", "/android-icon-96x96.png", "/apple-icon-114x114.png", "/apple-icon-120x120.png", "/apple-icon-144x144.png", "/apple-icon-152x152.png", "/apple-icon-180x180.png", "/apple-icon-57x57.png", "/apple-icon-60x60.png", "/apple-icon-72x72.png", "/apple-icon-76x76.png", "/apple-icon-precomposed.png", "/apple-icon.png", "/browserconfig.xml", "/css", "/css/main.css", "/css/uikit-rtl.css", "/css/uikit-rtl.min.css", "/css/uikit.css", "/css/uikit.min.css", "/favicon-16x16.png", "/favicon-32x32.png", "/favicon-96x96.png", "/favicon.ico", "/icon.svg", "/js", "/js/browser.js", "/js/fetch.min.js", "/js/fetch.min.js.map", "/js/promise-7.0.4.min.js", "/js/promise-7.0.4.min.js.map", "/js/socket.io.js", "/js/socket.io.js.map", "/js/uikit-icons.js", "/js/uikit-icons.min.js", "/js/uikit.js", "/js/uikit.min.js", "/manifest.json", "/ms-icon-144x144.png", "/ms-icon-150x150.png", "/ms-icon-310x310.png", "/ms-icon-70x70.png"];
function isResourceRequest(path) {
    return resWhitelist.some(item => path === item);
}
module.exports = function (req, res, next) {
    var user = null;
    if (req.body && req.body.username && req.body.password) {
        user = { name: req.body.username, pass: req.body.password };
    }
    var session_cookie = req.cookies["session_id"];
    var redirect = req.body.redirect || req.query.redirect || "/";
    if (!session_cookie) {
        if (!user || !(user.name === config.username && user.pass === config.password)) {
            // We don't have a user or wrong info
            if (req.path.startsWith(api_path)) {
                // This is an api request
                if (req.params && req.query.token === config.api_token) {
                    // It is authorized
                    return next();
                }
                else {
                    return res.status(401).json({ "message": "Access denied. Set a valid \"token\" in your parameters" });
                }
            }
            // Send the login page
            if (isResourceRequest(req.path)) {
                return next();
            }
            else {
                if (req.path === "/login") {
                    if (!user) {
                        return res.status(401).render('login', { title: "Login", redirect: redirect });
                    }
                    else {
                        //it was wrong info
                        return res.status(401).render('login', { title: "Login", redirect: redirect, error_message: 'The username/password you provided is wrong' });
                    }
                }
                else {
                    return res.redirect("/login?redirect=" + encodeURIComponent(req.url));
                }
            }
        }
        else {
            // User can log in
            // We need to generate a cookie for the user
            generateCookie(function (err, c) {
                if (err) {
                    return next(err);
                }
                res.cookie("session_id", c.value, { expires: c.expires });
                return res.redirect(redirect);
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
            // Send the login page
            if (isResourceRequest(req.path)) {
                return next();
            }
            else {
                if (req.path === "/login") {
                    return res.status(401).render('login', { title: "Login", redirect: redirect, error_message: 'Your cookie expired. Please log in again.' });
                }
                else {
                    return res.redirect("/login?redirect=" + encodeURIComponent(req.url));
                }
            }
        }
    }
};
//# sourceMappingURL=auth.js.map