"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentDescription = void 0;
const mpath = require("path");
const fs = require("fs");
const rwlock = require("rwlock");
const download = require("../tools/download");
// This class describes a saved page
class ContentDescription {
    // Creates a new ContentDescription object
    constructor(_url, _pagepath, _id, _domain, _date, _title, _size) {
        this.url = _url;
        this.pagepath = (_pagepath || "").replace("\\", "/");
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
        this.mutex.readLock(function (release) {
            fs.readFile(ContentDescription.CONTENT_FILE, "utf-8", function (err, file_content) {
                release();
                if (err) {
                    // If the file doesn't exist, we pretend it contains an empty array
                    // Don't check err.errno as it might be platform specific
                    if (err.code === 'ENOENT') {
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
        });
    }
    // Saves the specified data in the content file
    static saveFile(data, callback) {
        this.mutex.writeLock(function (release) {
            fs.writeFile(ContentDescription.CONTENT_FILE, JSON.stringify(data), "utf-8", function (err) {
                release();
                callback(err);
            });
        });
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
    static getSitesByDomain(domain, callback) {
        var domains = domain ? domain.split("+").map(d => d.trim()) : [];
        ContentDescription.loadFile(function (err, items) {
            if (err) {
                return callback(err, null, null);
            }
            if (domains.length > 0) {
                items = items.filter(cd => domains.includes(cd.domain));
            }
            return callback(null, domains, items);
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
                download.removeFolder(mpath.join('public', 's', id), function (err) {
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
        // If the url begins with a prefix, we cut it out before checking
        for (var i in this.URL_PREFIXES) {
            if (url.startsWith(this.URL_PREFIXES[i])) {
                url = url.substring(this.URL_PREFIXES[i].length);
            }
        }
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
exports.ContentDescription = ContentDescription;
ContentDescription.mutex = new rwlock();
// This is where all information is saved
ContentDescription.CONTENT_FILE = mpath.join("public", "s", "content.json");
ContentDescription.URL_PREFIXES = ["video:"];
//# sourceMappingURL=ContentDescription.js.map