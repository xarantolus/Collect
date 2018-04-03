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
// the id_length is used when generating an id
var id_length = require('../config.json').id_length;
// warn, but use default
if (id_length === null) {
    id_length = 5;
    console.log("[warn] 'id_length' is not set in config. The default of 5 will be used.");
}
if (id_length < 5) {
    console.log("[warn] 'id_length' cannot be smaller than 5. The default of 5 will be used.");
}
// Check if the 'PhantomJS' plugin is installed
var usePhantom = false;
var phantomHtml;
try {
    phantomHtml = require('website-scraper-phantom');
    usePhantom = true;
    // Let the user know
    console.log("PhantomJS will be used to process websites");
}
catch (e) {
    // Ignore only if we didn't find a module
    if (e.code !== 'MODULE_NOT_FOUND') {
        throw e;
    }
}
// This function downloads a website
// Parameters:
// url: the url to download
// depth: how many hyperlinks to follow
// samedomain: whether to only follow hyperlinks to the same domain (if depth > 0)
// title: the title that should be displayed in the listing
function website(url, depth = 0, sameDomain, title, callback) {
    // we need an url
    if (url === null) {
        return callback(new ReferenceError("url is null"), null, null);
    }
    // Do we already have it?
    ContentDescription.contains(url, function (err, contains, item) {
        if (err) {
            return callback(err, null, null);
        }
        if (contains) {
            // we already have it in our index file. the user should delete it before downloading again
            return callback(null, item, true);
        }
        // Let's grab an id & directory name for this url
        findValidDir(url, function (err, dir) {
            if (err) {
                return callback(err, null, null);
            }
            // Follow the same domain ?
            var originalUrl = murl.parse(url);
            // The urlFilter function passed to website-scraper
            var urlFilterFunc = function (filterUrl) {
                var parsed = murl.parse(filterUrl, false);
                return parsed.host === originalUrl.host;
            };
            var options = {
                urls: [
                    { url: url, filename: getFileName(url) }
                ],
                urlFilter: sameDomain ? urlFilterFunc : null,
                directory: mpath.join("public", "s", dir),
                recursive: depth !== 0,
                maxDepth: depth !== 0 ? depth : null,
                httpResponseHandler: usePhantom ? phantomHtml : null // Use PhantomJS for processing if available
            };
            // Start downloading
            scrape(options, function (error, results) {
                if (error) {
                    return callback(error, null, null);
                }
                var result = results[0]; // Because we only download one url (see 'urls' array in options)
                if (!result.saved) {
                    // website-scraper couldn't save the file
                    return callback(new Error("Couldn't save file"), null, null);
                }
                //Check again, maybe there was a redirect 
                ContentDescription.contains(result.url, function (err, contains, item) {
                    if (err == null && contains) {
                        return callback(null, item, true);
                    }
                    // Rename the directory if the domain isn't the same anymore, (e.g. http://t.co - links should not be t.co-e63f3 but actualwebsite.com-e63f3)
                    renameDir(dir, url, result.url, function (err, newId) {
                        if (err) {
                            return callback(err, null, null);
                        }
                        // Apply the new name
                        dir = newId;
                        // Start getting info about size
                        getFolderSize(mpath.join("public", "s", dir), function (err, size) {
                            if (err) {
                                return callback(err, null, null);
                            }
                            // prepare the 'pagepath'
                            var indexPath = mpath.join(dir, result.filename);
                            // This could be refactored to only read the file if the title is not set
                            fs.readFile(mpath.join('public', 's', indexPath), function (err, content) {
                                // extract the title if we don't have it
                                if ((title || "").trim() === "") {
                                    var parser;
                                    try {
                                        parser = extractor.lazy(content, 'en');
                                    }
                                    catch (_a) { }
                                    title = "No title";
                                    try {
                                        title = parser.title();
                                    }
                                    catch (_b) { }
                                }
                                // Create the item
                                var cd = new ContentDescription(result.url, indexPath, dir, murl.parse(result.url, false).hostname, new Date(), title, size);
                                // Save it to the index file
                                ContentDescription.addContent(cd, function (err) {
                                    if (err) {
                                        return callback(err, null, false);
                                    }
                                    // We did it!
                                    return callback(null, cd, false);
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}
exports.website = website;
// Renames the directory if the domain is different
function renameDir(dir, originalUrl, newUrl, callback) {
    // Same domain => It's ok, there was no redirect
    if (murl.parse(originalUrl, false).host === murl.parse(newUrl, false).host) {
        return callback(null, dir);
    }
    // Let's get a directory name for the new url
    findValidDir(newUrl, function (err, path) {
        if (err) {
            return callback(err, null);
        }
        var oldDir = mpath.join("public", "s", dir);
        var newDir = mpath.join("public", "s", path);
        // Rename
        fs.rename(oldDir, newDir, function (err) {
            if (err) {
                return callback(err, null);
            }
            return callback(null, path);
        });
    });
}
//We assume that urls with these extensions return html
const html_exts = [".asp", ".php", ".html", ".jsp", ".aspx"];
// This is the default name for the index page
const INDEX_NAME = "index.html";
// gets a file name from the url (e.g. http://example.com/test.png => test.png)
function getFileName(url) {
    if (url.endsWith("/")) {
        // Index of a directory or home page
        return INDEX_NAME;
    }
    var urlobj = murl.parse(url, false);
    if (urlobj.protocol + "//" + urlobj.host === url) {
        // Home page (without trailing slash)
        return INDEX_NAME;
    }
    // get the file name
    var base = mpath.basename(url);
    // Remove achor from url if there is one
    var remove_anchor = base.split('#');
    if (remove_anchor.length > 1) {
        remove_anchor.pop();
        base = remove_anchor.join('');
    }
    remove_anchor = null;
    // Remove query from filename
    var remove_query = base.split('?');
    if (remove_query.length > 1) {
        remove_query.pop();
        base = remove_query.join('');
    }
    remove_query = null;
    if (base === "" || base === null) {
        // In case we don't have a basename after everything was removed
        return INDEX_NAME;
    }
    var ext = mpath.extname(base);
    if (ext === null || ext === "" || html_exts.some(item => ext == item)) {
        // it's probably a html response
        ext = "html";
    }
    else {
        // remove the dot from the extension
        ext = ext.substr(1, ext.length);
    }
    // if the file name contains dots, they will be inserted again when joining
    var bsplit = base.split('.');
    // Remove extension if there was one in the url
    if (bsplit.length > 1) {
        bsplit.pop();
    }
    // Add the extension we got before
    bsplit.push(ext);
    return bsplit.join('.');
}
// Searches a directory for the url
function findValidDir(url, callback) {
    // eg 25 bytes => 50 chars ( we need the halt id length)
    crypto.randomBytes(Math.ceil(id_length / 2), function (err, buffer) {
        if (err) {
            return callback(err, null);
        }
        // get exact length of the string
        var path = murl.parse(url, false).host + "-" + buffer.toString('hex').slice(0, id_length);
        // If it exists, we just call this function again.
        // This has the risk of running thousands of times if it is always the same id
        fs.exists(mpath.join("public", "s", path), function (exists) {
            if (exists) {
                findValidDir(url, callback);
            }
            else {
                return callback(null, path);
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
// This is different from the 'rimraf' function found in 'tools/integrity.ts' because it is asynchronus
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
// This class describes a saved page
class ContentDescription {
    // Creates a new ContentDescription object
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
    // Loads the content file
    static loadFile(callback) {
        fs.readFile(ContentDescription.CONTENT_FILE, "utf-8", function (err, file_content) {
            if (err) {
                //File doesn't exist, so we return an empty array
                if (err.errno === -4058) {
                    return callback(null, []);
                }
                else {
                    // another error
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
    // Saves the specified data in the content file
    static saveFile(data, callback) {
        fs.writeFile(ContentDescription.CONTENT_FILE, JSON.stringify(data), "utf-8", callback);
    }
    // Returns all saved sites
    static getSaved(callback) {
        ContentDescription.loadFile(callback);
    }
    // Adds a site to the index file
    static addContent(desc, callback) {
        ContentDescription.loadFile(function (err, result) {
            if (err) {
                return callback(err);
            }
            result.push(desc);
            ContentDescription.saveFile(result, callback);
        });
    }
    // Removes a site from the index file
    static removeContent(id, callback) {
        //Remove from file
        ContentDescription.loadFile(function (err, result) {
            if (err) {
                err.message = "Error loading file";
                return callback(err);
            }
            var beforecount = result.length;
            // Filter all items with this id (the count of removed items should be 0 or 1)
            result = result.filter(function (item) {
                return item.id !== id;
            });
            if (result.length === beforecount) {
                // We must only continue deleting if something was removed, => the id actually existed
                return callback(new ReferenceError("There is no item with this id"));
            }
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
    // Sets the title of a saved page
    static setTitle(id, newtitle, callback) {
        ContentDescription.loadFile(function (err, result) {
            if (err) {
                return callback(err, null);
            }
            // find the item's index
            var index = result.findIndex(item => item.id === id);
            if (index === -1) {
                // it doesn't exist
                return callback(new ReferenceError("There is no item with this id"), null);
            }
            // Actually set the title
            result[index].title = newtitle;
            // Save with new title
            ContentDescription.saveFile(result, function (err) {
                if (err) {
                    return callback(err, null);
                }
                // return callback with new item
                callback(null, result[index]);
            });
        });
    }
    // Checks whether the index file contains an url
    static contains(url, callback) {
        ContentDescription.loadFile(function (err, result) {
            if (err) {
                return callback(err, null, null);
            }
            // filter by url
            var index = result.findIndex(item => item.url === url);
            if (index != -1) {
                return callback(null, true, result[index]);
            }
            else {
                return callback(null, false, null);
            }
        });
    }
    // Gets an item by its id
    static getById(id, callback) {
        if (!id) {
            return callback(new ReferenceError("No id given"), null);
        }
        ContentDescription.loadFile(function (err, result) {
            if (err) {
                return callback(err, null);
            }
            var item = null;
            if (id) {
                // filter by id
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
// This is where all information is saved
ContentDescription.CONTENT_FILE = mpath.join("public", "s", "content.json");
exports.ContentDescription = ContentDescription;
//# sourceMappingURL=download.js.map