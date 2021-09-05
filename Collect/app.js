"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Run the integrity check before importing anything
require('./tools/integrity').checkIntegrity();
const express = require("express");
const path = require("path");
const auth = require("./tools/auth");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const download_1 = require("./tools/download");
var app = express();
var version = require('./package.json').version || "Unspecified Version";
global["RUN_MODE"] = (process.argv.some(arg => arg.toUpperCase() === "PRODUCTION") ? "production" : null) || app.get('env') || "development";
// this middleware needs the RUN_MODE to be set
const version_mw = require("./tools/version-middleware");
var config = require('./config.json');
var bodyParser = require('body-parser');
// We assume that some file extensions contain html 
express.static.mime.define({ 'text/html': download_1.html_extensions.map(/* Remove dots in front of extensions */ /* Remove dots in front of extensions */ item => item.slice(1)) });
// Compress responses
app.use(compression());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false, defer: true }));
// parse cookies
app.use(cookieParser());
// Display version on pages
app.use(version_mw.globals);
const backup_1 = require("./routes/backup");
const views_1 = require("./routes/views");
const sites_1 = require("./routes/sites");
const details_1 = require("./routes/details");
const api_v1_1 = require("./routes/api_v1");
const public_1 = require("./routes/public");
const shared_1 = require("./routes/shared");
const views_vue_1 = require("./routes/views-vue");
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.set('view cache', true);
// Check authentication for all route depending on config
if (!config.allow_public_view) {
    app.use(auth.middleware);
}
else {
    app.use('/public', public_1.default);
}
// Static routes (including archived sites)
app.use(express.static(path.join(__dirname, 'public')));
// Check authentication for other non public route depending on config
if (!config.allow_public_all && config.allow_public_view) {
    app.use(auth.middleware);
}
var frontend_version = config.frontend_version || 2;
if (frontend_version == 1) {
    app.use('/', views_1.default);
    app.use('/details/', details_1.default);
    app.use('/site/', sites_1.default);
}
else if (frontend_version == 2) {
    app.use('/', views_vue_1.default);
    app.use('/assets/', express.static(path.join(__dirname, 'public/frontend/dist/assets')));
}
else {
    throw new Error("config: frontend_version must be either 1 or 2, but got unexpected " + frontend_version);
}
app.use('/', shared_1.default);
// All other routes
app.use("/api/v1/", backup_1.default);
app.use('/api/v1/', api_v1_1.default);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    if (req.path.startsWith("/api/v1/")) {
        err['api'] = true;
    }
    err['status'] = 404;
    next(err);
});
// development error handler
// will print stacktrace
if (global["RUN_MODE"].toUpperCase() !== 'PRODUCTION') {
    app.set('view cache', false);
    app.locals.pretty = true;
    app.use((err, req, res, next) => {
        if (err instanceof ReferenceError) {
            err["status"] = 404;
        }
        ;
        err['status'] = err['status'] || 500;
        err['message'] = err['message'] || "Unknown error";
        res.status(err['status']);
        if (err['api'] || false) {
            res.json({ status: err.status, message: err.message });
        }
        else {
            res.render('error', {
                message: err.message,
                error: err
            });
        }
    });
}
// production error handler
// no stacktraces leaked to user
app.use((err, req, res, next) => {
    if (err instanceof ReferenceError) {
        err["status"] = 404;
    }
    ;
    err['status'] = err['status'] || 500;
    err['message'] = err['message'] || "Unknown error";
    res.status(err['status']);
    if (err['api'] || false) {
        res.json({ status: err.status, message: err.message });
    }
    else {
        res.render('error', {
            message: err.message,
            status: err.status
        });
    }
});
var port = app.get('port') || process.env.PORT || config.port;
console.log("Collect-Server(" + version + (global["RUN_MODE"].toUpperCase() === "PRODUCTION" ? "-production" : "-development") + ") listening on port " + port);
var server = app.listen(port);
//Set variables
var io = require('socket.io')(server);
app.set('socketio', io);
// Middleware for authorization
io.use(function (socket, next) {
    var session_id = ((socket.handshake || {}).query || {}).session_id;
    var api_token = ((socket.handshake || {}).query || {}).api_token;
    // Accept either a valid session cookie or the api_token
    if (auth.isValidCookie(session_id) || api_token === config.api_token || config.allow_public_all) {
        next();
    }
    else {
        next(new Error('ERR_CONNECT_UNAUTHORIZED'));
    }
    return;
});
global["notif_count"] = 0;
//Socket.io: Respond with notification count on connect
io.sockets.on('connection', function (socket) {
    socket.emit('notifcount', global["notif_count"]);
});
//# sourceMappingURL=app.js.map