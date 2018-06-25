/*
 * Home page
 */
import express = require('express');
import download = require('../tools/download');
import cd = require('../tools/ContentDescription');
import notif = require('../tools/notifcount');
import url = require('url');
const router = express.Router();

// Show all archived domains
router.get('/', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    cd.ContentDescription.getSaved(function (err, result) {
        if (err) {
            return next(err);
        }

        // Show all sites without filtering
        res.render('table', { title: "All Sites", list: result, humanFileSize: download.humanFileSize });
    });
});

// Show the 'New Entry' page
router.get('/new', (req: express.Request, res: express.Response) => {
    res.render('new', { title: "New Entry" });
});

// Accept an url for processing. (This happens when JavaScript is disabled)
router.post('/new', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    var posted_url: string = "";
    try {
        posted_url = req.body.url;

        // we cannot proceed without an url
        if (posted_url === null || posted_url === undefined || posted_url == "") {
            throw new Error("Missing parameter \"url\"");
        }
    } catch (err) {
        // Don't render the error page, but the 'new' page with an message
        return res.render('new', { title: "New Entry", error_message: err.message });
    }

    var depth: number = 0;
    try {
        depth = parseInt(req.body.depth || "0");

        // depth must be a number (isNaN("string") === true)
        if (isNaN(depth)) {
            throw new Error("Malformed parameter \"depth\"");
        }
        // the number must be between (including) 0 and 5
        if (depth > 5) {
            throw new Error("Parameter \"depth\" is too big");
        }

        // Use default of 0 if depth is negative
        if (depth < 0) {
            depth = 0;
        }
    } catch (errr) {
        // Again, show the error on the new page
        return res.render('new', { title: "New Entry", error_message: errr.message });
    }

    // title can be null
    var title: string = req.body.title;

    // Since this is is an <select> element we need to check for different values than in api_v1.ts
    var followSameDomain = (req.body.samedomain || "").toUpperCase() === "FOLLOWSAME";

    // let's check if we even have a valid url (this excludes e.g. localhost)
    try {
        if (!download.isValidUrl(posted_url))
            throw new Error("Not a valid url");
    } catch (err) {
        return res.render('new', { title: "New Entry", error_message: "Parameter \"url\" is not an url" });
    }

    // We don't need the user anymore.
    res.redirect('/');

    // Let's start the actual work
    console.log("Processing url " + posted_url);

    // Keep track of the notification count
    notif.increaseNotificationCount();

    // Let the clients know that we're doing something
    req.app.get('socketio').emit('url', { "message": "Started processing url", "step": 0, "url": posted_url, "result": null });

    // Now let's start the process
    download.resolveDownload(posted_url, depth, followSameDomain, title, req.body.cookies, req.body.useragent, function (err, result, fromCache) {
        // Finished, decrease the notification count
        notif.decreaseNotificationCount();
        if (err) {
            console.log("Error while processing url " + posted_url + ":\n" + err.stack);
            req.app.get('socketio').emit('url', { "message": "Error while processing url", "step": 4, "url": posted_url, "result": null });
            return console.log(err);
        }

        console.log("Finished url " + posted_url)

        // Let's see if it already existed in the index
        if (fromCache) {
            req.app.get('socketio').emit('url', { "message": "This item already exists", "step": 1, "url": posted_url, "result": result });
        } else {
            req.app.get('socketio').emit('url', { "message": "Finished processing url", "step": 2, "url": posted_url, "result": result });
        }
    });
});

export default router;