﻿/*
 * API v1
 */
import express = require('express');
import download = require('../tools/download');
import notif = require('../tools/notifcount');
import url = require('url');
const router = express.Router();

router.get('/sites/:domain?', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    var domain = req.params.domain;

    download.ContentDescription.getSaved(function (err, result) {
        if (err) {
            err['status'] = 500;
            err['api'] = true;
            err.message = "Can't read data file";
            delete err.stack;
            return next(err);
        }

        if (domain) {
            result = result.filter(item => item.domain === domain);
        }

        res.status(200).json(result);
    });
});

router.get('/details/:id', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    var id = req.params.id;

    download.ContentDescription.getById(id, function (err, item) {
        if (err) {
            err['status'] = 500;
            err['api'] = true;
            return next(err);
        }
        res.status(200).json(item);
    });

});

router.post('/site/:id/settitle', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    var id: string = req.params.id;
    var newtitle: string = null;

    if (req.body && req.body.title && (req.body.title).length > 0) {
        newtitle = req.body.title;
    } else {
        var err = new Error();
        err['status'] = 412;
        err['api'] = true;
        err.message = "Missing parameter \"title\"";
        delete err.stack;
        return next(err);
    }

    download.ContentDescription.setTitle(id, newtitle, function (err, item) {
        if (err) {
            err['status'] = 500;
            err['api'] = true;
            return next(err);
        }

        res.status(200).send({
            "status": 200,
            "message": "Title changed successfully"
        });
    });
});

router.post('/site/:id/delete', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    var id: string = req.params.id;


    download.ContentDescription.removeContent(id, function (err) {
        if (err) {
            err['status'] = 500;
            err['api'] = true;
            return next(err);
        }

        res.status(200).send({
            "status": 200,
            "message": "Item deleted successfully"
        });
    });
});

router.post('/site/add', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    var posted_url: string = "";
    try {
        posted_url = req.body.url;
        if (posted_url === null || posted_url === undefined || posted_url == "") {
            throw new Error();
        }
    } catch (err) {
        var err = new Error();
        err['status'] = 412;
        err['api'] = true;
        err.message = "Missing parameter \"url\"";
        delete err.stack;
        return next(err);
    }

    var depth: number = 0;
    try {
        depth = parseInt(req.body.depth || "0");
        if (isNaN(depth)) {
            throw new Error("Malformed parameter \"depth\"");
        }
        if (depth > 5) {
            throw new Error("Parameter \"depth\" is too big");
        }
    } catch (errr) {
        var err = new Error();
        err['status'] = 412;
        err['api'] = true;
        err.message = errr.message
        delete err.stack;
        return next(err);
    }

    var parsed: url.Url;
    try {
        parsed = url.parse(posted_url);
    } catch (err) {
        err['status'] = 422;
        err['api'] = true;
        err.message = "Malformed parameter \"url\"";
        delete err.stack;
        return next(err);
    }

    res.status(202)
        .json({ "message": "Processing started", "target": posted_url });

    console.log("Processing url " + posted_url);
    notif.increaseNotificationCount();
    req.app.get('socketio').emit('url', { "message": "Started processing url", "step": 0, "url": posted_url, "result": null });

    download.website(posted_url, depth, function (err, result, fromCache) {
        notif.decreaseNotificationCount();
        if (err) {
            console.log("Error while processing url " + posted_url + ":\n" + err.stack);
            req.app.get('socketio').emit('url', { "message": "Error while processing url", "step": 4, "url": posted_url, "result": null });
            return console.log(err);
        }
        console.log("Finished url " + posted_url)
        req.app.get('socketio').emit('url', { "message": "Finished processing url", "step": 2, "url": posted_url, "result": result });
    });
});

export default router;