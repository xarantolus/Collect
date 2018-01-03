/*
 * Details page
 */
import express = require('express');
import download = require('../tools/download');
const router = express.Router();


router.get('/:id?', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    var id = req.params.id;

    download.ContentDescription.getSaved(function (err, result) {
        if (err) {
            err['status'] = 500;
            err['api'] = false;
            err.message = "Can't read data file";
            return next(err);
        }

        var index = -1;
        if (id) {
            index = result.findIndex(item => item.id === id);
        }

        if (index === -1 || index >= result.length) {
            var err = new Error();
            err['status'] = 404;
            err['api'] = false;
            err.message = "Id not found in saved sites";
            return next(err);
        }

        var item = result[index];

        res.render('details', { title: "Details", item: item, file_size: download.humanFileSize(item.size, true) });
    });
});

router.post('/:id?', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    var id = req.params.id;

    download.ContentDescription.getSaved(function (err, result) {
        if (err) {
            err['status'] = 500;
            err['api'] = false;
            err.message = "Can't read data file";
            return next(err);
        }

        var index = -1;
        if (id) {
            index = result.findIndex(item => item.id === id);
        }

        if (index === -1 || index >= result.length) {
            var err = new Error();
            err['status'] = 404;
            err['api'] = false;
            err.message = "Id not found in saved sites";
            return next(err);
        }

        if (req.body.submit !== undefined && req.body.submit != null) {
            console.log("Submit");
        }
        if (req.body.delete !== undefined && req.body.delete != null) {
            console.log("Delete");
        }


        var item = result[index];

        res.status(200).json({ body: req.body, item: item });
    });
});

export default router;