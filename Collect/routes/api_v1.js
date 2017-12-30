"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * API v1
 */
const express = require("express");
const download = require("../tools/download");
const router = express.Router();
router.get('/sites/:domain?', (req, res, next) => {
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
exports.default = router;
//# sourceMappingURL=api_v1.js.map