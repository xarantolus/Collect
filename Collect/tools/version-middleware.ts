const version = require('../package.json').version || "Unspecified Version";

export function globals(req, res, next) {
    res.locals.version = "Collect-Server(v" + version + ")";

    next();
}