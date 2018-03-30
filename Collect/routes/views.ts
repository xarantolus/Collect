﻿/*
 * Home page
 */
import express = require('express');
import download = require('../tools/download');
import notif = require('../tools/notifcount');
import url = require('url');
const router = express.Router();

//Show all archived domains
router.get('/', (req: express.Request, res: express.Response) => {
    download.ContentDescription.getSaved(function (err, result) {
        if (err) {
            return res.render('error', { error: err });
        }
        res.render('table', { title: "All Sites", list: result });
    });
});

router.get('/new', (req: express.Request, res: express.Response) => {
    res.render('new', { title: "New Entry" });
});

router.post('/new', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    var posted_url: string = "";
    try {
        posted_url = req.body.url;
        if (posted_url === null || posted_url === undefined || posted_url == "") {
            throw new Error();
        }
    } catch (err) {
        return res.render('new', { title: "New Entry", error_message: err.message });
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
        return res.render('new', { title: "New Entry", error_message: errr.message });
    }

    var title: string = req.body.title;

    var followSameDomain = (req.body.samedomain || "").toUpperCase() === "FOLLOWSAME";

    try {
        if (!download.isValidUrl(posted_url))
            throw new Error("Not a valid url");
    } catch (err) {
        return res.render('new', { title: "New Entry", error_message: "Parameter \"url\" is not an url" });
    }

    res.redirect('/');

    console.log("Processing url " + posted_url);
    notif.increaseNotificationCount();
    req.app.get('socketio').emit('url', { "message": "Started processing url", "step": 0, "url": posted_url, "result": null });

    download.website(posted_url, depth, followSameDomain, title, function (err, result, fromCache) {
        notif.decreaseNotificationCount();
        if (err) {
            console.log("Error while processing url " + posted_url + ":\n" + err.stack);
            req.app.get('socketio').emit('url', { "message": "Error while processing url", "step": 4, "url": posted_url, "result": null });
            return console.log(err);
        }
        console.log("Finished url " + posted_url)

        if (fromCache) {
            req.app.get('socketio').emit('url', { "message": "This item already exists", "step": 1, "url": posted_url, "result": result });
        } else {
            req.app.get('socketio').emit('url', { "message": "Finished processing url", "step": 2, "url": posted_url, "result": result });
        }
    });
});

export default router;