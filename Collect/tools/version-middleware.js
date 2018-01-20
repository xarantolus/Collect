"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const version = require('../package.json').version || "Unspecified Version";
function globals(req, res, next) {
    res.locals.version = "Collect-Server(v" + version + ")";
    next();
}
exports.globals = globals;
//# sourceMappingURL=version-middleware.js.map