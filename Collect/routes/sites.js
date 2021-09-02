"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Site page
 */
const express = require("express");
const download = require("../tools/download");
const cd = require("../tools/ContentDescription");
const router = express.Router();
//Show all archived pages of one domain
router.get('/:domain', (req, res, next) => {
    var domain = req.params.domain;
    cd.ContentDescription.getSitesByDomain(domain, function (err, domains, result) {
        if (err) {
            return next(err);
        }
        // Check which title we need to display ('All Sites' or domain)
        return res.render('table', { title: domains.join("+"), list: result, domain: domain, humanFileSize: download.humanFileSize });
    });
});
exports.default = router;
//# sourceMappingURL=sites.js.map