/*
 * Public List Page
 */
import express = require('express');
import url = require('url');
import cd = require('../tools/ContentDescription');
const router = express.Router();

// Show all archived domains
router.get('/list', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    cd.ContentDescription.getSaved(function (err, result) {
        if (err) {
            return next(err);
        }

        // Show all sites without filtering
        res.render('public_table', { title: "All Sites", list: result});
    });
});

export default router;