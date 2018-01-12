/*
 * Details page
 */
import express = require('express');
import download = require('../tools/download');
const router = express.Router();


router.get('/:id?', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    var id = req.params.id;

    download.ContentDescription.getById(id, function (err, item) {
        if (err) {
            err['status'] = 500;
            err['api'] = false;
            return next(err);
        }

        return res.render('details', { title: "Details", item: item, file_size: download.humanFileSize(item.size, true) });
    });
});

router.post('/:id?', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    var id = req.params.id;
    download.ContentDescription.getById(id, function (err, item) {
        if (err) {
            err['status'] = 500;
            err['api'] = false;
            return next(err);
        }
        if (req.body.submit !== undefined && req.body.submit != null) {
            if (req.body.title) {
                download.ContentDescription.setTitle(item.id, req.body.title, function (err, item) {
                    if (err) {
                        err['status'] = 500;
                        err['api'] = false;
                        err.message = "Couldn't change title";
                        return next(err);
                    }
                    return res.render('details', { item: item, message: "Title changed successfully", file_size: download.humanFileSize(item.size, true) });
                });
            }
        } else if (req.body.delete !== undefined && req.body.delete != null) {
            download.ContentDescription.removeContent(id, function (err) {
                if (err) {
                    err['status'] = 500;
                    err['api'] = false;
                    err.message = "Error while deleting entry";
                    return next(err);
                }
                return res.redirect("/");
            });
        } else {
            next();
        }
    });
});

export default router;