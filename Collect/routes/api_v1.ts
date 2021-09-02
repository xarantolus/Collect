/*
 * API v1
 */
import express = require('express');
import download = require('../tools/download');
import notif = require('../tools/notifcount');
import cd = require('../tools/ContentDescription');
import url = require('url');
const router = express.Router();

// Get all sites by domain (if domain is null / "", we return all sites)
router.get('/sites/:domain?', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    var domain = req.params.domain;

    cd.ContentDescription.getSitesByDomain(domain, function (err, domains, result) {
        if (err) {
            err['status'] = 500;
            err['api'] = true;
            err.message = "Can't read data file";
            delete err.stack;
            return next(err);
        }

        return res.status(200).json(result);
    });
});

// Get the details for an item
router.get('/details/:id', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    var id = req.params.id;

    // Load item with the specified id
    cd.ContentDescription.getById(id, function (err, item) {
        if (err) {
            err['status'] = (err instanceof ReferenceError) ? 404 : 500;
            err['api'] = true;
            return next(err);
        }

        res.status(200).json(item);
    });
});

// Set the title for an item
router.post('/site/:id/settitle', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    var id: string = req.params.id;
    var newtitle: string = null;

    // We need a title that is not empty
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


    cd.ContentDescription.setTitle(id, newtitle, function (err, item) {
        if (err) {
            err['api'] = true;
            return next(err);
        }

        res.status(200).send({
            "status": 200,
            "message": "Title changed successfully"
        });

        // Send an event to all connected clients so they know that the title was changed
        req.app.get('socketio').emit('titlechange', { "message": "Changed title of " + id, "id": id, "newtitle": newtitle });
    });
});

// Delete an item
router.post('/site/:id/delete', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    var id: string = req.params.id;

    // we don't need to check for null because the removeContent function checks if it removed anything
    cd.ContentDescription.removeContent(id, function (err) {
        if (err) {
            err['api'] = true;
            return next(err);
        }

        res.status(200).send({
            "status": 200,
            "message": "Item deleted successfully"
        });

        // Send an event that we deleted an item
        req.app.get('socketio').emit('delete', { "message": "Deleted item \"" + id + "\"", "id": id });
    });
});

// Post an url that the server can process
// Parameters (req.body)
// url(string): the url to process
// depth(int): how many hyperlinks to follow
// title(string): the displayed title in the listing (optional)
// samedomain(bool): whether to only follow hyperlinks to the same domain (if depth > 0)
router.post('/site/add', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    var posted_url: string = "";
    try {
        posted_url = req.body.url;

        // we cannot proceed without an url
        if (posted_url === null || posted_url === undefined || posted_url == "") {
            throw new Error();
        }
    } catch (err) {
        var err = new Error();
        err['status'] = 412; // Precondition failed (we need an url)
        err['api'] = true;
        err.message = "Missing parameter \"url\"";
        delete err.stack;
        return next(err);
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
        var err = new Error();
        err['status'] = 412;
        err['api'] = true;
        err.message = errr.message
        delete err.stack;
        return next(err);
    }

    var title: string = req.body.title; // If this is null, the download.website function will figure out an title

    // is samedomain set to true? anything else results in false
    var sameDomain: boolean = (req.body.samedomain || "").toUpperCase() === "TRUE";

    // let's check if we even have a valid url (this excludes e.g. localhost)
    try {
        if (!download.isValidUrl(posted_url))
            throw new Error("Not a valid url");
    } catch (err) {
        err['status'] = 422;
        err['api'] = true;
        err.message = "Malformed parameter \"url\"";
        delete err.stack;
        return next(err);
    }

    // We made it
    res.status(202) // Accepted for processing
        .json({ "message": "Processing started", "target": posted_url });

    console.log("Processing url " + posted_url);

    // Keep track of the notification count
    notif.increaseNotificationCount();

    // Let the clients know that we're doing something
    req.app.get('socketio').emit('url', { "message": "Started processing url", "step": 0, "url": posted_url, "result": null });

    // Now let's start the process (cookies & useragent might be null)
    download.resolveDownload(posted_url, depth, sameDomain, title, req.body.cookies, req.body.useragent, function (err, result, fromCache) {
        // decrease when we're ready
        notif.decreaseNotificationCount();
        if (err) {
            console.log("Error while processing url " + posted_url + ":\n" + err.stack);
            // Send socket.io event
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