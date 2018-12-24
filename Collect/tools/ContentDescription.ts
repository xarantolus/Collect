import mpath = require('path')
import fs = require('fs')
import download = require('../tools/download')

// This class describes a saved page
export class ContentDescription {
    // The url we downloaded
    public url: string;
    // The title of this item
    public title: string;
    // The id (same to directory name in 'public/s/')
    public id: string;
    // The pagepath (usually something like 'public/s/_id_/index.html')
    public pagepath: string;
    // The domain of the url
    public domain: string;
    // The date when we saved the page
    public saved: Date;
    // The size of the directory in bytes
    public size: number;

    // Creates a new ContentDescription object
    constructor(_url: string, _pagepath: string, _id: string, _domain: string, _date: Date, _title: string, _size: number) {
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

    // This is where all information is saved
    static readonly CONTENT_FILE = mpath.join("public", "s", "content.json");

    // Loads the content file
    private static loadFile(callback: (err: Error, result: Array<ContentDescription>) => void): void {
        fs.readFile(ContentDescription.CONTENT_FILE, "utf-8", function (err, file_content) {
            if (err) {
                // If the file doesn't exist, we pretend it contains an empty array
                // Don't check err.errno as it might be platform specific
                if (err.code === 'ENOENT') {
                    return callback(null, []);
                } else {
                    // another error
                    return callback(err, null);
                }
            }

            try {
                return callback(null,
                    JSON.parse(file_content));
            } catch (e) {
                return callback(e, null);
            }
        });
    }

    // Saves the specified data in the content file
    private static saveFile(data: Array<ContentDescription>, callback: (err: Error) => void): void {
        fs.writeFile(ContentDescription.CONTENT_FILE, JSON.stringify(data), "utf-8", callback);
    }

    // Returns all saved sites
    public static getSaved(callback: (err: Error, result: Array<ContentDescription>) => void): void {
        ContentDescription.loadFile(callback);
    }

    // Adds a site to the index file
    public static addContent(desc: ContentDescription, callback: (err: Error) => void): void {
        ContentDescription.loadFile(function (err, result) {
            if (err) {
                return callback(err);
            }
            result.push(desc);
            ContentDescription.saveFile(result, callback);
        });
    }

    // Removes a site from the index file
    public static removeContent(id: string, callback: (err: Error) => void): void {
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
    public static setTitle(id: string, newtitle: string, callback: (err: Error, item: ContentDescription) => void): void {
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

    static readonly URL_PREFIXES = ["video:"];

    // Checks whether the index file contains an url
    public static contains(url: string, callback: (err: Error, result: boolean, item: ContentDescription) => void): void {
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
            } else {
                return callback(null, false, null);
            }
        });
    }

    // Gets an item by its id
    public static getById(id: string, callback: (err: Error, result: ContentDescription) => void): void {
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