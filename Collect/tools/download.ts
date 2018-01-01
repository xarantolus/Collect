import scrape = require('website-scraper');
import crypto = require('crypto');
import fs = require('fs');
import murl = require('url');
import mpath = require('path')
import extractor = require('unfluff');

export function website(url: string, callback: (err: Error, result: ContentDescription, fromCache: boolean) => void): void {
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
                directory: mpath.join("public", "s", dir)
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

                    var indexPath = mpath.join(dir,
                        result.filename);

                    fs.readFile(mpath.join('public', indexPath), function (err, content) {
                        var parser: any;
                        try {
                            parser = extractor.lazy(content, 'en');
                        } catch{ }

                        var title: string = "No title";
                        try {
                            title = parser.title();
                        } catch{ }

                        var favicon: string = "";
                        try {
                            favicon = parser.favicon();
                        } catch{ }

                        var cd = new ContentDescription(result.url,
                            indexPath,
                            murl.parse(result.url, false).hostname,
                            new Date(),
                            title,
                            favicon
                        );

                        // Save to index file
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
}

function getFileName(url: string): string {
    // /path/asdf.jpg
    var urlpath = murl.parse(url, false).pathname;

    // asdf.jpg
    var base = mpath.basename(urlpath)

    if (base != "" && base != null) {
        // .jpg
        var ext = mpath.extname(base);

        if (ext === null || ext === "") {
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

export class ContentDescription {
    public url: string;
    public faviconpath: string;
    public title: string;
    public pagepath: string;
    public domain: string;
    public saved: Date;
    constructor(_url: string, _path: string, _domain: string, _date: Date, _title: string, _faviconpath: string) {
        this.url = _url;
        this.pagepath = _path || "";
        // www.reddit.com == reddit.com, while test.reddit.com should be treated as subdomain/new domain
        if (_domain.startsWith("www."))
            _domain = _domain.substr(4, _domain.length - 4);
        this.domain = _domain;
        this.saved = _date || new Date();
        this.title = _title || "No title";
        this.faviconpath = _faviconpath || "";
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
}