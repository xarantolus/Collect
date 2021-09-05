"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * Home page
 */
const express = require("express");
const path = require("path");
const router = express.Router();
const vueIndexFilePath = path.join(__dirname, "../public/frontend/dist/index.html");
var routeIndexFunc = (req, res, next) => {
    res.sendFile(vueIndexFilePath);
};
// We always handle the same routes as in the old frontend.
// Here we only serve the HTML file, then the vue frontend will handle the rest
// like views.ts
router.get('/', routeIndexFunc);
router.get('/new', routeIndexFunc);
// routes from details.ts
router.get('/details/:id?', routeIndexFunc);
// sites.ts
router.get('/site/:domain', routeIndexFunc);
exports.default = router;
//# sourceMappingURL=views-vue.js.map