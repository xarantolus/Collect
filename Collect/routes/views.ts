/*
 * Home page
 */
import express = require('express');
import download = require('../tools/download');
const router = express.Router();

//Show all archived domains
router.get('/', (req: express.Request, res: express.Response) => {
    download.ContentDescription.getSaved(function (err, result) {
        if (err) {
            return res.render('error', { error: err });
        }
        res.render('table', { title: "Collect", list: result });
    });
});

export default router;