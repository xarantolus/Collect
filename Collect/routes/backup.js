"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const archiver = require("archiver");
const router = express.Router();
router.get('/backup', (req, res, next) => {
    var archive = archiver.create('zip', {});
    archive.on('error', function (err) {
        return next(err);
    });
    res.attachment("backup.zip");
    archive.on('data', function (chunk) {
        res.write(chunk);
    });
    archive.on('end', function () {
        res.end();
    });
    archive
        .directory('./public/s', false) // Add 's' directory recursively
        .finalize();
});
exports.default = router;
//# sourceMappingURL=backup.js.map