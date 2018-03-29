const version = require('../package.json').version || "Unspecified Version";

var version_string: string = "Collect-Server(" + version + (global["RUN_MODE"].toUpperCase() === "PRODUCTION" ? "-production" : "-development") + ")";

export function globals(req, res, next) {
    res.locals.version = version_string;

    next();
}