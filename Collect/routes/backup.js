"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const archiver = require("archiver");
const router = express.Router();
// Backup route. Possible paths: 'backup.zip', 'backup.tar' or 'backup.tar.gz'
router.get(/\/backup\.(.*?)$/i, (req, res, next) => {
    var ext = (req.params || [""])[0].toLowerCase();
    var archive = null;
    // let's see which file we need to create
    // archiver.create calls are taken from the files in https://github.com/archiverjs/node-archiver/tree/master/examples (MIT License)
    switch (ext) {
        case 'zip': {
            archive = archiver.create('zip', {});
            break;
        }
        case 'tar': {
            archive = archiver.create('tar', {});
            break;
        }
        case 'tar.gz': {
            archive = archiver.create('tar', {
                gzip: true,
                gzipOptions: {
                    level: 1
                }
            });
            break;
        }
        default: {
            var err = new Error("The extension for backup must be \"zip\", \"tar\" or \"tar.gz\"");
            err["api"] = true;
            err["status"] = 412;
            return next(err);
        }
    }
    archive.on('error', function (err) {
        return next(err);
    });
    res.attachment("backup." + ext);
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