import express = require('express')
import archiver = require('archiver');
const router = express.Router();

router.get('/backup', (req: express.Request, res: express.Response, next: express.NextFunction) => {

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

export default router;