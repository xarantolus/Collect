import debug = require('debug');
import express = require('express');
import path = require('path');
import auth = require('./tools/auth');
import io = require('socket.io');
import fs = require('fs');
import cookieParser = require('cookie-parser');
import compression = require('compression');

// Check all directories & the index file
require('./tools/integrity').checkIntegrity();

var app = express()

var version = require('./package.json').version || "Unspecified Version";
global["RUN_MODE"] = (process.argv.some(arg => arg.toUpperCase() === "PRODUCTION") ? "production" : null) || app.get('env') || "development";

// this middleware needs the RUN_MODE to be set
import version_mw = require('./tools/version-middleware');

var config = require('./config.json')
var bodyParser = require('body-parser')


// Compress responses
app.use(compression());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false, defer: true }))

// parse cookies
app.use(cookieParser());

// Display version on pages
app.use(version_mw.globals)

// Check authentication
app.use(auth as express.RequestHandler);

import backup from './routes/backup';
import views from './routes/views';
import site from './routes/sites';
import details from './routes/details';
import api from './routes/api_v1';


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.set('view cache', true);


// All routes are authorized
app.use("/api/v1/", backup)
app.use('/api/v1/', api);
app.use('/', views);
app.use('/details/', details);
app.use('/site/', site);
app.use(express.static(path.join(__dirname, 'public')));





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
    app.locals.pretty = true;
    app.use((err: any, req, res, next) => {

        if (err instanceof ReferenceError) { err["status"] = 404 };

        err['status'] = err['status'] || 500;
        err['message'] = err['message'] || "Unknown error";

        res.status(err['status']);

        if (err['api'] || false) {
            res.json({ status: err.status, message: err.message});
        } else {
            res.render('error', {
                message: err.message,
                error: err
            });
        }
    });
}

// production error handler
// no stacktraces leaked to user
app.use((err: any, req, res, next) => {

    if (err instanceof ReferenceError) { err["status"] = 404 };

    err['status'] = err['status'] || 500;
    err['message'] = err['message'] || "Unknown error";

    res.status(err['status']);

    if (err['api'] || false) {
        res.json({ status: err.status, message: err.message });
    } else {
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

global["notif_count"] = 0;

//Socket.io response
io.sockets.on('connection', function (socket) {
    socket.emit('notifcount', global["notif_count"])
});