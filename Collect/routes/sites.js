"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Site page
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
        if (domain && domain.trim() !== "") {
            result = result.filter(item => item.domain === domain);
        }
        // Check which title we need to display ('All Sites' or domain)
        var isDomain = (domain || "").trim() === "";
        res.render('table', { title: isDomain ? "All Sites" : domain, list: result, domain: domain });
    });
});
exports.default = router;
//# sourceMappingURL=sites.js.map