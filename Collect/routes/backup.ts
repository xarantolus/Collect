import express = require('express')
import archiver = require('archiver');
const router = express.Router();

// Backup route. Possible paths: 'backup.zip', 'backup.tar' or 'backup.tar.gz'
router.get(/\/backup\.(.*?)$/i, (req: express.Request, res: express.Response, next: express.NextFunction) => {

    // Get the extension that was matched by the regular expression
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
            // Not a valid extension
            var err = new Error("The extension for backup must be \"zip\", \"tar\" or \"tar.gz\"");
            err["api"] = true;
            err["status"] = 412;
            return next(err);
        }
    }

    // Redirect to the error handler
    archive.on('error', function (err) {
        err['api'] = true;
        return next(err);
    });

    // Set the right headers
    res.attachment("backup." + ext);

    // We could also use pipe
    archive.on('data', function (chunk) {
        res.write(chunk);
    });

    archive.on('end', function () {
        res.end();
    });


    // Create the archive
    archive
        .directory('./public/s', false) // Add 's' directory recursively
        .finalize();
});

export default router;