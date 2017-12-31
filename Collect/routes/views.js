"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Home page
 */
const express = require("express");
const download = require("../tools/download");
const router = express.Router();
router.get('/', (req, res) => {
    download.ContentDescription.getSaved(function (err, result) {
        if (err) {
            return res.render('error', { error: err });
        }
        res.render('index', { title: 'Express', list: result });
    });
});
exports.default = router;
//# sourceMappingURL=views.js.map