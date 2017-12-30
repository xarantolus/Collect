/*
 * API v1
 */
import express = require('express');
import download = require('../tools/download');
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

    req.app.get('socketio').emit('url', { "message": "Started processing url", "step": 0, "url": posted_url, "result": null });

    download.website(posted_url, function (err, result, fromCache) {
        if (err) {
            return console.log(err);
        }
        req.app.get('socketio').emit('url', { "message": "Finished processing url", "step": 2, "url": posted_url, "result": result });
    });
});

export default router;