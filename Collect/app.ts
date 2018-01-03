﻿import debug = require('debug');
import express = require('express');
import path = require('path');
import auth = require('./tools/auth');
import io = require('socket.io');
import fs = require('fs');

var config = require('./config.json')

const user_file: string = "users.json";

var bodyParser = require('body-parser')
var app = express()

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

import api from './routes/api_v1';
import views from './routes/views';
import site from './routes/sites';
import details from './routes/details';

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Unauthorized routes
// We leave the api unauthorized because we don't have an implementation in browser.js
app.use('/api/v1/', api);
app.use(express.static(path.join(__dirname, 'public')));

app.use(auth as express.RequestHandler);

// Authorized routes
app.use('/', views);
app.use('/details/', details);
app.use('/site/', site);





// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err['status'] = 404;
    next(err);
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.locals.pretty = true;
    app.use((err: any, req, res, next) => {
        res.status(err['status'] || 500);
        if (err['api'] || false) {
            delete err.api;
            res.json(err);
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
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

var port = app.get('port') || config.port;
console.log("Server listening on port " + port);
var server = app.listen(port);

//Set variables
var io = require('socket.io')(server);
app.set('socketio', io);

global["notif_count"] = 0;

//Socket.io response
io.sockets.on('connection', function (socket) {
    socket.emit('notifcount', global["notif_count"])
});