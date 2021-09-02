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

    cd.ContentDescription.getSitesByDomain(domain, function (err, domains, result) {
        if (err) {
            return next(err);
        }

        // Check which title we need to display ('All Sites' or domain)
        var isMultiple = domains.length > 1;

        return res.render('table', { title: isMultiple ? "All Sites" : domain, list: result, domain: domain, humanFileSize: download.humanFileSize });
    });
});

export default router;