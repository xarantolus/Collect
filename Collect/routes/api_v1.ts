/*
 * API v1
 */
import express = require('express');
import download = require('../tools/download');
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

export default router;