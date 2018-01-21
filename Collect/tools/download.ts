import scrape = require('website-scraper');
import crypto = require('crypto');
import fs = require('fs');
import murl = require('url');
import mpath = require('path')
import extractor = require('unfluff');
import getFolderSize = require('get-folder-size');
import async = require('async');

export function website(url: string, depth: number = 0, callback: (err: Error, result: ContentDescription, fromCache: boolean) => void): void {
    if (url === null) {
        return callback(new ReferenceError("url is null"), null, null);
    }
    ContentDescription.contains(url, function (err, contains, item) {
        if (err == null && contains) {
            return callback(null, item, true);
        }

        findValidDir(url, function (dir: string): void {
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

                var result = results[0];// Because we only download one

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

                        var indexPath = mpath.join(dir,
                            result.filename);

                        fs.readFile(mpath.join('public', 's', indexPath), function (err, content) {
                            var parser: any;
                            try {
                                parser = extractor.lazy(content, 'en');
                            } catch{ }

                            var title: string = "No title";
                            try {
                                title = parser.title();
                            } catch{ }

                            // Save to index file
                            var cd = new ContentDescription(result.url,
                                indexPath,
                                dir,
                                murl.parse(result.url, false).hostname,
                                new Date(),
                                title,
                                size
                            );

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

//We assume that urls with these extensinos return html
const html_exts = [".asp", ".php", ".html", ".jsp"]

function getFileName(url: string): string {
    // /path/asdf.jpg
    var urlpath = murl.parse(url, false).pathname;

    // asdf.jpg
    var base = mpath.basename(urlpath)

    if (base != "" && base != null) {
        // .jpg
        var ext = mpath.extname(base);
        if (ext === null || ext === "" || html_exts.some(item => ext == item)) {
            ext = "html";
        } else {
            ext = ext.substr(1, ext.length);
        }

        var bsplit = base.split('.');

        bsplit.pop();
        bsplit.push(ext);

        return bsplit.join('.');
    } else {
        return "index.html";
    }

}

function findValidDir(url: string, callback: (path: string) => void) {
    // 25 bytes => 50 chars
    crypto.randomBytes(25, function (err, buffer) {
        var path = murl.parse(url, false).host + "-" + buffer.toString('hex');
        fs.exists(mpath.join("public", "s", path), function (exists: boolean) {
            if (exists) {
                findValidDir(url, callback);
            } else {
                return callback(path);
            }
        });
    });
}

// Source: https://stackoverflow.com/a/14919494/5728357
export function humanFileSize(bytes, si) {
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

// Source: https://stackoverflow.com/a/15855457/5728357
export function isValidUrl(value): boolean {
    return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(value);
}

// Source: https://stackoverflow.com/a/25069828/5728357
function removeFolder(location: string, next: (err: Error) => void): void {
    fs.readdir(location, function (err, files) {
        async.each(files, function (file, cb) {
            file = location + '/' + file
            fs.stat(file, function (err, stat) {
                if (err) {
                    return cb(err);
                }
                if (stat.isDirectory()) {
                    removeFolder(file, cb);
                } else {
                    fs.unlink(file, function (err) {
                        if (err) {
                            return cb(err);
                        }
                        return cb();
                    })
                }
            })
        }, function (err) {
            if (err) return next(err)
            fs.rmdir(location, function (err) {
                return next(err)
            })
        })
    })
}

export class ContentDescription {
    public url: string;
    public title: string;
    public id: string;
    public pagepath: string;
    public domain: string;
    public saved: Date;
    public size: number;
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

    static readonly CONTENT_FILE = mpath.join("public", "s", "content.json");

    private static loadFile(callback: (err: Error, result: Array<ContentDescription>) => void): void {
        fs.readFile(ContentDescription.CONTENT_FILE, "utf-8", function (err, file_content) {
            if (err) {
                //File doesn't exist, so we return an empty array
                if (err.errno === -4058) {
                    return callback(null, []);
                } else {
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

    private static saveFile(data: Array<ContentDescription>, callback: (err: Error) => void): void {
        fs.writeFile(ContentDescription.CONTENT_FILE, JSON.stringify(data), "utf-8", callback);
    }

    public static getSaved(callback: (err: Error, result: Array<ContentDescription>) => void): void {
        ContentDescription.loadFile(callback);
    }

    public static addContent(desc: ContentDescription, callback: (err: Error) => void): void {
        ContentDescription.loadFile(function (err, result) {
            if (err) {
                return callback(err);
            }
            result.push(desc);
            ContentDescription.saveFile(result, callback);
        });
    }

    public static removeContent(id: string, callback: (err: Error) => void): void {
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

    public static setTitle(id: string, newtitle: string, callback: (err: Error, item: ContentDescription) => void): void {
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

    public static contains(url: string, callback: (err: Error, result: boolean, item: ContentDescription) => void): void {
        ContentDescription.loadFile(function (err, result) {
            if (err) {
                return callback(err, null, null);
            }
            var index = result.findIndex(item => item.url === url);
            if (index != -1) {
                return callback(null, true, result[index]);
            } else {
                return callback(null, false, null);
            }
        });
    }

    public static getById(id: string, callback: (err: Error, result: ContentDescription) => void): void {
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