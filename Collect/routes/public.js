"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Public List Page
 */
const express = require("express");
const cd = require("../tools/ContentDescription");
const router = express.Router();
// Show all archived domains
router.get('/list', (req, res, next) => {
    cd.ContentDescription.getSaved(function (err, result) {
        if (err) {
            return next(err);
        }
        // Show all sites without filtering
        res.render('public_table', { title: "All Sites", list: result });
    });
});
exports.default = router;
//# sourceMappingURL=public.js.map