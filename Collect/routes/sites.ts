/*
 * Site page
 */
import express = require('express');
import download = require('../tools/download');
const router = express.Router();


//Show all archived pages of one domain
router.get('/:domain?', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    var domain = req.params.domain;

    download.ContentDescription.getSaved(function (err, result) {
        if (err) {
            return res.render('error', { error: err });
        }

        if (domain) {
            result = result.filter(item => item.domain === domain);
        }

        var title = "Collect" + (domain === "" ? "" : " - " + domain);
        res.render('table', { title: title, list: result });
    });
});

export default router;