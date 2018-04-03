/*
 * Details page
 */
import express = require('express');
import download = require('../tools/download');
import cd = require('../tools/ContentDescription');
const router = express.Router();

// Get the details page for an item
router.get('/:id?', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    var id = req.params.id;

    cd.ContentDescription.getById(id, function (err, item) {
        if (err) {
            err['status'] = 500;
            err['api'] = false;
            return next(err);
        }

        // Render the 'details' template with the item and the formatted filesize
        return res.render('details', { title: "Details", item: item, file_size: download.humanFileSize(item.size, true) });
    });
});

// this handles the 'submit' and 'delete' button on the details page (this usually happens when JavaScript is disabled)
// We get an id and the name of the button that was pressed
router.post('/:id?', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    var id = req.params.id;
    cd.ContentDescription.getById(id, function (err, item) {
        if (err) {
            err['status'] = 500;
            err['api'] = false;
            return next(err);
        }
        // It is the submit button. This means that we should change the title
        if (req.body.submit !== undefined && req.body.submit != null) {
            // We can't do anything without an title
            if (req.body.title) {
                cd.ContentDescription.setTitle(item.id, req.body.title, function (err, item) {
                    if (err) {
                        err['status'] = 500;
                        err['api'] = false;
                        err.message = "Couldn't change title";
                        return next(err);
                    }
                    res.render('details', { item: item, message: "Title changed successfully", file_size: download.humanFileSize(item.size, true) });

                    // Event
                    req.app.get('socketio').emit('titlechange', { "message": "Changed title of " + id, "id": id, "newtitle": item.title });

                    // Exit this function
                    return;
                });
            } else {
                return next(new ReferenceError("You need to submit an title"));
            }
        } // User pressed the 'delete' button
        else if (req.body.delete !== undefined && req.body.delete != null) {
            cd.ContentDescription.removeContent(id, function (err) {
                if (err) {
                    err['status'] = 500;
                    err['api'] = false;
                    err.message = "Error while deleting entry";
                    return next(err);
                }

                req.app.get('socketio').emit('delete', { "message": "Deleted item \"" + id + "\"", "id": id });

                return res.redirect("/");
            });
        } else {
            // made a POST request, but didn't press the 'submit' or 'delete' button
            return next(new ReferenceError("I don't think we have that button"));
        }
    });
});

export default router;