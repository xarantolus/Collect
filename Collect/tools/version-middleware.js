"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// This middleware enables the views to show the <meta generator...> tag
const version = require('../package.json').version || "Unspecified Version";
// This version string to be displayed
var version_string = "Collect-Server(" + version + (global["RUN_MODE"].toUpperCase() === "PRODUCTION" ? "-production" : "-development") + ")";
// This function is used as middleware to inject the middleware in the 'layout' view
function globals(req, res, next) {
    res.locals.version = version_string;
    next();
}
exports.globals = globals;
//# sourceMappingURL=version-middleware.js.map