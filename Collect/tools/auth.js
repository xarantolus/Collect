"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.middleware = exports.isValidCookie = void 0;
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
// Check if a cookie is in the cookies array
function isValidCookie(cookie_value) {
    var index = cookies.findIndex(item => item.value === cookie_value);
    if (index === -1) {
        // The list doesn't contain the cookie
        return false;
    }
    var is_expired = cookies[index].expires < new Date();
    if (is_expired) {
        // remove the cookie
        cookies.splice(index, 1);
        return false;
    }
    else {
        // valid
        return true;
    }
}
exports.isValidCookie = isValidCookie;
// generates a 50 chars long cookie and adds it to the cookie array & file
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
        // The path for the cookies.json file is correct because node is started in the Collect directory
        // it seems like 'require()' and 'writeFile()' use different paths(relative to file & relative to working dir)
        fs.writeFile('cookies.json', JSON.stringify(cookies), function (err) {
            if (err) {
                console.log(err);
            }
        });
    });
}
// These routes can be accessed if you are not logged in (resources for login screen)
const resWhitelist = ["/android-icon-144x144.png", "/android-icon-192x192.png", "/android-icon-36x36.png", "/android-icon-48x48.png", "/android-icon-72x72.png", "/android-icon-96x96.png", "/apple-icon-114x114.png", "/apple-icon-120x120.png", "/apple-icon-144x144.png", "/apple-icon-152x152.png", "/apple-icon-180x180.png", "/apple-icon-57x57.png", "/apple-icon-60x60.png", "/apple-icon-72x72.png", "/apple-icon-76x76.png", "/apple-icon-precomposed.png", "/apple-icon.png", "/browserconfig.xml", "/css/main.min.css", "/css/main.css", "/css/uikit-rtl.css", "/css/uikit-rtl.min.css", "/css/uikit.css", "/css/uikit.min.css", "/favicon-16x16.png", "/favicon-32x32.png", "/favicon-96x96.png", "/favicon.ico", "/icon.svg", "/js/browser.min.js", "/js/browser.js", "/js/socket.io.js", "/js/socket.io.js.map", "/js/uikit-icons.js", "/js/uikit-icons.min.js", "/js/uikit.js", "/js/uikit.min.js", "/manifest.json", "/ms-icon-144x144.png", "/ms-icon-150x150.png", "/ms-icon-310x310.png", "/ms-icon-70x70.png"];
function isResourceRequest(path) {
    return resWhitelist.some(item => path === item);
}
// Auth middleware
function middleware(req, res, next) {
    var user = null;
    if (req.body && req.body.username && req.body.password) {
        user = { name: req.body.username, pass: req.body.password };
    }
    if (req.cookies) {
        var session_cookie = req.cookies["session_id"];
    }
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
                        return res.status(401).render('login', { title: "Login", redirect: redirect, public_access: config.allow_public_view });
                    }
                    else {
                        //it was wrong info
                        return res.status(401).render('login', { title: "Login", redirect: redirect, error_message: 'The username/password you provided is wrong', public_access: config.allow_public_view });
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
            // Redirect to home page if the user goes to the login site(usually while using back buttons)
            if (req.path === "/login") {
                return res.redirect("/");
            }
            else {
                // this info is valid, continue
                return next();
            }
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
                    return res.status(401).render('login', { title: "Login", redirect: redirect, error_message: 'Your cookie expired. Please log in again.', public_access: config.allow_public_view });
                }
                else {
                    return res.redirect("/login?redirect=" + encodeURIComponent(req.url));
                }
            }
        }
    }
}
exports.middleware = middleware;
;
//# sourceMappingURL=auth.js.map
