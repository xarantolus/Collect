"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const scrape = require("website-scraper");
const crypto = require("crypto");
const fs = require("fs");
const murl = require("url");
const mpath = require("path");
const extractor = require("unfluff");
const getFolderSize = require("get-folder-size");
const async = require("async");
var usePhantom = false;
var phantomHtml;
try {
    phantomHtml = require('website-scraper-phantom');
    usePhantom = true;
    console.log("PhantomJS will be used to process websites");
}
catch (e) {
    if (e.code !== 'MODULE_NOT_FOUND') {
        throw e;
    }
}
function website(url, depth = 0, callback) {
    if (url === null) {
        return callback(new ReferenceError("url is null"), null, null);
    }
    ContentDescription.contains(url, function (err, contains, item) {
        if (err == null && contains) {
            return callback(null, item, true);
        }
        findValidDir(url, function (dir) {
            var options = {
                urls: [
                    { url: url, filename: getFileName(url) }
                ],
                directory: mpath.join("public", "s", dir),
                recursive: depth !== 0,
                maxDepth: depth > 1 ? depth : null,
                httpResponseHandler: usePhantom ? phantomHtml : null // Use PhantomJS for processing if available
            };
            scrape(options, function (error, results) {
                if (error) {
                    return callback(error, null, null);
                }
                var result = results[0]; // Because we only download one
                if (!result.saved) {
                    return callback(new Error("Couldn't save file"), null, null);
                }
                //Check again, maybe there was a redirect 
                ContentDescription.contains(result.url, function (err, contains, item) {
                    if (err == null && contains) {
                        return callback(null, item, true);
                    }
                    getFolderSize(mpath.join("public", "s", dir), function (err, size) {
                        if (err) {
                            return callback(err, null, null);
                        }
                        var indexPath = mpath.join(dir, result.filename);
                        fs.readFile(mpath.join('public', 's', indexPath), function (err, content) {
                            var parser;
                            try {
                                parser = extractor.lazy(content, 'en');
                            }
                            catch (_a) { }
                            var title = "No title";
                            try {
                                title = parser.title();
                            }
                            catch (_b) { }
                            // Save to index file
                            var cd = new ContentDescription(result.url, indexPath, dir, murl.parse(result.url, false).hostname, new Date(), title, size);
                            ContentDescription.addContent(cd, function (err) {
                                if (err) {
                                    return callback(err, null, false);
                                }
                                return callback(null, cd, false);
                            });
                        });
                    });
                });
            });
        });
    });
}
exports.website = website;
//We assume that urls with these extensinos return html
const html_exts = [".asp", ".php", ".html", ".jsp"];
function getFileName(url) {
    // /path/asdf.jpg
    var urlpath = murl.parse(url, false).pathname;
    // asdf.jpg
    var base = mpath.basename(urlpath);
    if (base != "" && base != null) {
        // .jpg
        var ext = mpath.extname(base);
        if (ext === null || ext === "" || html_exts.some(item => ext == item)) {
            ext = "html";
        }
        else {
            ext = ext.substr(1, ext.length);
        }
        var bsplit = base.split('.');
        bsplit.pop();
        bsplit.push(ext);
        return bsplit.join('.');
    }
    else {
        return "index.html";
    }
}
function findValidDir(url, callback) {
    // 25 bytes => 50 chars
    crypto.randomBytes(25, function (err, buffer) {
        var path = murl.parse(url, false).host + "-" + buffer.toString('hex');
        fs.exists(mpath.join("public", "s", path), function (exists) {
            if (exists) {
                findValidDir(url, callback);
            }
            else {
                return callback(path);
            }
        });
    });
}
// Source: https://stackoverflow.com/a/14919494/5728357
function humanFileSize(bytes, si) {
    var thresh = si ? 1000 : 1024;
    if (Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }
    var units = si
        ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
        : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    var u = -1;
    do {
        bytes /= thresh;
        ++u;
    } while (Math.abs(bytes) >= thresh && u < units.length - 1);
    return bytes.toFixed(1) + ' ' + units[u];
}
exports.humanFileSize = humanFileSize;
// Source: https://stackoverflow.com/a/15855457/5728357
function isValidUrl(value) {
    return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(value);
}
exports.isValidUrl = isValidUrl;
// Source: https://stackoverflow.com/a/25069828/5728357
function removeFolder(location, next) {
    fs.readdir(location, function (err, files) {
        async.each(files, function (file, cb) {
            file = location + '/' + file;
            fs.stat(file, function (err, stat) {
                if (err) {
                    return cb(err);
                }
                if (stat.isDirectory()) {
                    removeFolder(file, cb);
                }
                else {
                    fs.unlink(file, function (err) {
                        if (err) {
                            return cb(err);
                        }
                        return cb();
                    });
                }
            });
        }, function (err) {
            if (err)
                return next(err);
            fs.rmdir(location, function (err) {
                return next(err);
            });
        });
    });
}
class ContentDescription {
    constructor(_url, _pagepath, _id, _domain, _date, _title, _size) {
        this.url = _url;
        this.pagepath = _pagepath || "";
        this.id = _id;
        // www.reddit.com == reddit.com, while test.reddit.com should be treated as subdomain/new domain
        if (_domain.startsWith("www."))
            _domain = _domain.substr(4, _domain.length - 4);
        this.domain = _domain;
        this.saved = _date || new Date();
        this.title = _title || "No title";
        this.size = _size;
    }
    static loadFile(callback) {
        fs.readFile(ContentDescription.CONTENT_FILE, "utf-8", function (err, file_content) {
            if (err) {
                //File doesn't exist, so we return an empty array
                if (err.errno === -4058) {
                    return callback(null, []);
                }
                else {
                    return callback(err, null);
                }
            }
            try {
                return callback(null, JSON.parse(file_content));
            }
            catch (e) {
                return callback(e, null);
            }
        });
    }
    static saveFile(data, callback) {
        fs.writeFile(ContentDescription.CONTENT_FILE, JSON.stringify(data), "utf-8", callback);
    }
    static getSaved(callback) {
        ContentDescription.loadFile(callback);
    }
    static addContent(desc, callback) {
        ContentDescription.loadFile(function (err, result) {
            if (err) {
                return callback(err);
            }
            result.push(desc);
            ContentDescription.saveFile(result, callback);
        });
    }
    static removeContent(id, callback) {
        //Remove from file
        ContentDescription.loadFile(function (err, result) {
            if (err) {
                err.message = "Error loading file";
                return callback(err);
            }
            result = result.filter(function (item) {
                return item.id !== id;
            });
            //Save list
            ContentDescription.saveFile(result, function (err) {
                if (err) {
                    err.message = "Error saving file";
                    return callback(err);
                }
                //Now we need to remove the directory
                removeFolder(mpath.join('public', 's', id), function (err) {
                    if (err) {
                        err.message = "Error while removing directory";
                        return callback(err);
                    }
                    return callback(null);
                });
            });
        });
    }
    static setTitle(id, newtitle, callback) {
        ContentDescription.loadFile(function (err, result) {
            if (err) {
                return callback(err, null);
            }
            var index = result.findIndex(item => item.id === id);
            if (index === -1) {
                return callback(new RangeError("Item not found in saved sites"), null);
            }
            result[index].title = newtitle;
            ContentDescription.saveFile(result, function (err) {
                if (err) {
                    return callback(err, null);
                }
                callback(null, result[index]);
            });
        });
    }
    static contains(url, callback) {
        ContentDescription.loadFile(function (err, result) {
            if (err) {
                return callback(err, null, null);
            }
            var index = result.findIndex(item => item.url === url);
            if (index != -1) {
                return callback(null, true, result[index]);
            }
            else {
                return callback(null, false, null);
            }
        });
    }
    static getById(id, callback) {
        if (!id) {
            return callback(new Error("No id given"), null);
        }
        ContentDescription.loadFile(function (err, result) {
            if (err) {
                return callback(err, null);
            }
            var item = null;
            if (id) {
                var index = result.findIndex(item => item.id === id);
                if (index !== -1) {
                    item = result[index];
                }
            }
            if (item) {
                return callback(null, item);
            }
            return callback(new ReferenceError("There is no item with this id"), null);
        });
    }
}
ContentDescription.CONTENT_FILE = mpath.join("public", "s", "content.json");
exports.ContentDescription = ContentDescription;
//# sourceMappingURL=download.js.map