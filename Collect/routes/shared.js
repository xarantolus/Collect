"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const router = express.Router();
const cd = require("../tools/ContentDescription");
// Redirect to index page path
router.get("/details/:id/index", (req, res, next) => {
    var id = req.params.id;
    cd.ContentDescription.getById(id, function (err, item) {
        if (err) {
            err['status'] = 500;
            err['api'] = false;
            return next(err);
        }
        return res.redirect("/s/" + item.pagepath);
    });
});
exports.default = router;
//# sourceMappingURL=shared.js.map