"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const version = require('../package.json').version || "Unspecified Version";
var version_string = "Collect-Server(" + version + (global["RUN_MODE"].toUpperCase() === "PRODUCTION" ? "-production" : "-development") + ")";
function globals(req, res, next) {
    res.locals.version = version_string;
    next();
}
exports.globals = globals;
//# sourceMappingURL=version-middleware.js.map