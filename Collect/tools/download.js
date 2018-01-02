"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const scrape = require("website-scraper");
const crypto = require("crypto");
const fs = require("fs");
const murl = require("url");
const mpath = require("path");
const extractor = require("unfluff");
const getFolderSize = require("get-folder-size");
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
                maxRecursiveDepth: 1,
                recursive: depth !== 0,
                maxDepth: depth > 1 ? depth : null
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
}
ContentDescription.CONTENT_FILE = mpath.join("public", "s", "content.json");
exports.ContentDescription = ContentDescription;
//# sourceMappingURL=download.js.map