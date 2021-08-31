import scrape = require('website-scraper');
import crypto = require('crypto');
import fs = require('fs');
import murl = require('url');
import mpath = require('path')
import extractor = require('unfluff');
import getFolderSize = require('get-folder-size');
import async = require('async');
import cd = require('../tools/ContentDescription');
import ytdl = require('ytdl-run');

// the id_length is used when generating an id
var id_length: number = require('../config.json').id_length;

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
var PhantomPlugin;
try {
    PhantomPlugin = require('website-scraper-phantom');
    usePhantom = true;
    // Let the user know
    console.log("PhantomJS will be used to process websites");
} catch (e) {
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
function website(url: string, depth: number = 0, sameDomain: boolean, title: string, cookies: string, useragent: string, callback: (err: Error, result: cd.ContentDescription, fromCache: boolean) => void): void {
    // Let's grab an id & directory name for this url
    findValidDir(url, function (err: Error, dir: string): void {
        if (err) {
            return callback(err, null, null);
        }

        // Follow the same domain ?
        var originalUrl = murl.parse(url);

        // The urlFilter function passed to website-scraper
        var urlFilterFunc = function (filterUrl) {
            var parsed = murl.parse(filterUrl, false);

            return parsed.host === originalUrl.host;
        }

        // Build request options (see https://github.com/website-scraper/node-website-scraper#request)
        var requestOptions = {
            headers: {}
        }

        if (useragent) {
            requestOptions.headers["User-Agent"] = useragent;
        }

        if (cookies) {
            requestOptions.headers["Cookie"] = cookies;
        }

        var options = {
            urls: [
                { url: url, filename: getFileName(url) }
            ],
            urlFilter: sameDomain ? urlFilterFunc : null, // don't pass anything if we should download all hyperlinks
            directory: mpath.join("public", "s", dir), // the directory name we generated
            recursive: depth !== 0, // Download other hyperlinks in html files if we follow any (depth)
            maxDepth: depth !== 0 ? depth : null, // null == No limit (only if depth === 0)
            request: requestOptions, // Cookies and User-Agent
            plugins: usePhantom ? [new PhantomPlugin()] : null
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
            cd.ContentDescription.contains(result.url, function (err, contains, item) {
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
                        var indexPath = mpath.join(dir,
                            result.filename);

                        // Get a title
                        extractTitle(mpath.join('public', 's', indexPath), title, function (extractedTitle) {
                            // Create the item
                            var item = new cd.ContentDescription(result.url,
                                indexPath,
                                dir,
                                murl.parse(result.url, false).hostname,
                                new Date(),
                                extractedTitle,
                                size
                            );

                            // Save it to the index file
                            cd.ContentDescription.addContent(item, function (err) {
                                if (err) {
                                    return callback(err, null, false);
                                }

                                // We did it!
                                return callback(null, item, false);
                            });
                        });
                    });
                });
            });
        });
    });
}

// This function downloads a video
// Parameters:
// url: the url to the video or site that contains the video
// title: the title to give the video
function video(url: string, title: string, callback: (err: Error, result: cd.ContentDescription, fromCache: boolean) => void): void {
    // Let's grab an id & directory name for this url
    findValidDir(url, async function (err: Error, id: string) {
        if (err) {
            return callback(err, null, null);
        }
        var dir = mpath.join("public", "s", id);
        // create dir 
        fs.mkdir(dir, async function (err): Promise<void> {
            if (err) {
                return callback(err, null, null);
            }

            const videoDlOptions = [
                url,
                '-o', mpath.join(dir, '%(title)s-%(id)s.%(ext)s'),
                // Basically try to get an mp4 video, else choose the "best" format that already
                // contains both audio and video, so no remuxing
                '-f', "bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4/best",
            ]

            var info = null;
            try {
                // Get the info
                info = await ytdl.getInfo(videoDlOptions);
            } catch (err) {
                // When we can't get info, it shouldn't terminate. We might be able to get a video without info
                console.log(err)
            }

            if (info === undefined || info === null) {
                info = { title: "No title", webpage_url: url } // Default values in case getInfo() throws
            }

            // See if the object provides a better url
            var betterUrl = info.webpage_url || url;

            // Sort out which title to use
            if (title && title.trim() !== "") {
                // Use the supplied one
                title = title.trim();
            } else {
                // Use the one youtube-dl suggests
                title = (info.title || "").trim();
            }

            // Rename the directory in case we got redirected
            renameDir(id, url, betterUrl, async function (err, newId) {
                if (err) {
                    return callback(err, null, null);
                }

                id = newId;
                dir = mpath.join("public", "s", id);

                try {
                    await ytdl(videoDlOptions);
                } catch (err) {
                    return callback(err, null, null);
                }

                // Start getting info about size
                getFolderSize(dir, function (err, size) {
                    if (err) {
                        return callback(err, null, null);
                    }

                    fs.readdir(dir, function (err, files) {
                        if (err) {
                            return callback(err, null, null);
                        }
                        if (files.length !== 1) {
                            return callback(new Error("expected exactly one output file when downloading video, but got " + files.length), null, null);
                        }

                        var indexPath = mpath.join(id, mpath.basename(files[0]));

                        var result = new cd.ContentDescription(betterUrl, indexPath, id, murl.parse(betterUrl, false).hostname, new Date(), title, size);

                        // Save 
                        cd.ContentDescription.addContent(result, function (err) {
                            if (err) {
                                return callback(err, null, false);
                            }

                            // We did it!
                            return callback(null, result, false);
                        });
                    })
                });
            });
        });
    });
}

// Resolves what to do based on the prefix
export function resolveDownload(url: string, depth: number = 0, sameDomain: boolean, title: string, cookies: string, useragent: string, callback: (err: Error, result: cd.ContentDescription, fromCache: boolean) => void): void {
    // we need an url
    if (url === null) {
        return callback(new ReferenceError("url is null"), null, null);
    }

    // Do we already have it?
    cd.ContentDescription.contains(url, function (err, contains, item) {
        if (err) {
            return callback(err, null, null);
        }

        if (contains) {
            // we already have it in our index file. the user should delete it before downloading again
            return callback(null, item, true);
        }

        // Check the prefix
        var prefix = url.split(':')[0].toLowerCase();

        switch (prefix) {
            case "video": {
                // Download the video on the website, strip the prefix
                return video(url.slice(6, url.length), title, callback);
            }
            default: { // This will match the protocol name (http, https etc.) that should be ignored.
                // Downloads a website
                return website(url, depth, sameDomain, title, cookies, useragent, callback);
            }
        }
    });
}

// Renames the directory if the domain is different
function renameDir(dir: string, originalUrl: string, newUrl: string, callback: (err: Error, newId: string) => any): void {
    // Same domain => It's ok, there was no redirect
    if (murl.parse(originalUrl, false).host === murl.parse(newUrl, false).host) {
        return callback(null, dir);
    }

    // Let's get a directory name for the new url
    findValidDir(newUrl, function (err, path) {
        if (err) {
            return callback(err, null);
        }

        var oldDir = mpath.join("public", "s", dir)
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

// Extracts the title from a file if we don't get one
function extractTitle(indexFile: string, providedTitle: string, callback: (title: string) => any): void {
    // We don't need to extract anything
    if ((providedTitle || "").toString().trim().length > 0) {
        return callback(providedTitle);
    }

    // Read the file
    fs.readFile(indexFile, 'utf-8', function (err, content) {
        if (err) {
            return callback("No title");
        }
        // extract the title 
        try {
            var parser = extractor.lazy(content);
            var title = parser.title();

            return callback(title);
        } catch (err) {
            // The catched error should be ignored because the file might not have html content
            return callback("No title");
        }
    });
}

// We assume that urls with these extensions return html, see issue #33
// While this might not be optimal, it is better than being prompted to download when you just want to view a file
// Note that these extensions have dots in front of them
export const html_extensions = [".asp", ".php", ".html", ".jsp", ".aspx", ".md"]
// This is the default name for the index page
const INDEX_NAME = "index.html";

// gets a file name from the url (e.g. http://example.com/test.png => test.png)
function getFileName(url: string): string {

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

    // If the last part of the  url contained any escape sequences (e.g. '%20') they are converted here (=> ' ')
    base = decodeURIComponent(base); // Need to use component as we don't use the full url, but only the basename: https://stackoverflow.com/a/747700

    var ext = mpath.extname(base);

    if (ext === null || ext === "" || html_extensions.some(item => ext == item)) {
        // it's probably a html response
        ext = "html";
    } else {
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
function findValidDir(url: string, callback: (err: Error, path: string) => void) {
    // eg 25 bytes => 50 chars ( we need the halt id length)
    crypto.randomBytes(Math.ceil(id_length / 2), function (err, buffer) {
        if (err) {
            return callback(err, null);
        }
        // get exact length of the string
        var path = murl.parse(url, false).host + "-" + buffer.toString('hex').slice(0, id_length);

        // If it exists, we just call this function again.
        // This has the risk of running thousands of times if it is always the same id
        fs.exists(mpath.join("public", "s", path), function (exists: boolean) {
            if (exists) {
                findValidDir(url, callback);
            } else {
                return callback(null, path);
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

// Source: https://stackoverflow.com/a/15855457, but i added the first part so it also accepts video:http://....
export function isValidUrl(value): boolean {
    return /(\w+?\:)(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(value);
}

// Source: https://stackoverflow.com/a/25069828/5728357
// This is different from the 'rimraf' function found in 'tools/integrity.ts' because it is asynchronus
export function removeFolder(location: string, next: (err: Error) => void): void {
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
