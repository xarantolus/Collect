"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Details page
 */
const express = require("express");
const download = require("../tools/download");
const router = express.Router();
router.get('/:id?', (req, res, next) => {
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
router.post('/:id?', (req, res, next) => {
    var id = req.params.id;
    if (id === undefined || id === null || id == "") {
        var err = new Error();
        err['status'] = 412;
        err['api'] = false;
        err.message = "No id specified";
        return next(err);
    }
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
            if (req.body.title) {
                var item_id = result[index].id;
                download.ContentDescription.setTitle(item_id, req.body.title, function (err, item) {
                    if (err) {
                        console.log(err);
                        err['status'] = 500;
                        err['api'] = false;
                        err.message = "Couldn't change title";
                        return next(err);
                    }
                    res.render('details', { item: item, message: "Title changed successfully" });
                });
            }
        }
        if (req.body.delete !== undefined && req.body.delete != null) {
            download.ContentDescription.removeContent(id, function (err) {
                if (err) {
                    err['status'] = 500;
                    err['api'] = false;
                    err.message = "Error while deleting entry";
                    return next(err);
                }
                res.redirect("/");
            });
        }
        next();
    });
});
exports.default = router;
//# sourceMappingURL=details.js.map