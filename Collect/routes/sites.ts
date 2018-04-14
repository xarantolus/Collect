/*
 * Site page
 */
import express = require('express');
import download = require('../tools/download');
import cd = require('../tools/ContentDescription');
const router = express.Router();


//Show all archived pages of one domain
router.get('/:domain?', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    var domain = req.params.domain;

    cd.ContentDescription.getSaved(function (err, result) {
        if (err) {
            return res.render('error', { error: err });
        }

        if (domain && domain.trim() !== "") {
            result = result.filter(item => item.domain === domain);
        }

        // Check which title we need to display ('All Sites' or domain)
        var isDomain = (domain || "").trim() === "";

        res.render('table', { title: isDomain ? "All Sites" : domain, list: result, domain: domain, humanFileSize: download.humanFileSize });
    });
});

export default router;