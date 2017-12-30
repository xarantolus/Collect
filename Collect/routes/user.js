"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * GET users listing.
 */
var express = require("express");
var router = express.Router();
router.get('/', function (req, res) {
    res.send("respond with a resource");
});
exports.default = router;
//# sourceMappingURL=user.js.map