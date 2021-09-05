import express = require('express');

const router = express.Router();

import cd = require('../tools/ContentDescription');

// Redirect to index page path
router.get("/details/:id/index", (req: express.Request, res: express.Response, next: express.NextFunction) => {
    var id = req.params.id;

    cd.ContentDescription.getById(id, function (err, item) {
        if (err) {
            err['status'] = 500;
            err['api'] = false;
            return next(err);
        }

        return res.redirect("/s/" + item.pagepath);
    })
});

export default router;