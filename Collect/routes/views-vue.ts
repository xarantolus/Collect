/*
 * Home page
 */
import express = require('express');
import path = require('path');

const router = express.Router();

const vueIndexFilePath = path.join(__dirname, "../public/frontend/dist/index.html");

var routeIndexFunc = (req: express.Request, res: express.Response, next: express.NextFunction) => {
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

export default router;