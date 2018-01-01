"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Home page
 */
const express = require("express");
const download = require("../tools/download");
const router = express.Router();
//Show all archived pages of one domain
router.get('/:domain?', (req, res, next) => {
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
exports.default = router;
//# sourceMappingURL=sites.js.map