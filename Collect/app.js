"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const path = require("path");
var bodyParser = require('body-parser');
var app = express();
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());
const views_1 = require("./routes/views");
const api_v1_1 = require("./routes/api_v1");
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', views_1.default);
app.use('/api/v1/', api_v1_1.default);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err['status'] = 404;
    next(err);
});
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use((err, req, res, next) => {
        res.status(err['status'] || 500);
        if (err['api'] || false) {
            delete err.api;
            res.json(err);
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
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});
var port = app.get('port') || 3000;
console.log("Server listening on port " + port);
var server = app.listen(port);
var io = require('socket.io')(server);
app.set('socketio', io);
//# sourceMappingURL=app.js.map