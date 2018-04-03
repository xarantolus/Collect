// This middleware enables the views to show the <meta generator...> tag
const version = require('../package.json').version || "Unspecified Version";

// This version string to be displayed
var version_string: string = "Collect-Server(" + version + (global["RUN_MODE"].toUpperCase() === "PRODUCTION" ? "-production" : "-development") + ")";

// This function is used as middleware to inject the middleware in the 'layout' view
export function globals(req, res, next) {
    res.locals.version = version_string;

    next();
}