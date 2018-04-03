"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cd = require("./ContentDescription");
const fs = require("fs");
const path = require("path");
// Checks for file integrity
// WARNING: this function deletes everything it doesn't know from the 'public/s/' directory
// Errors in this function don't necessarily say if the server can start correctly
function checkIntegrity() {
    console.log("Preparing integrity check...");
    // Get the index file
    try {
        var content = fs.readFileSync(cd.ContentDescription.CONTENT_FILE, 'utf-8');
    }
    catch (e) {
        console.error("Failed loading the content file. If you are starting for the first time, this is no problem.");
        return;
    }
    try {
        // Load lists
        var list = JSON.parse(content);
        var newlist = [];
        console.log("Checking if folders for ids exist...");
        // If folder exists, the item can stay (In case the folder was deleted but the item wasn't)
        for (var i = 0; i < list.length; i++) {
            var dirname = path.join('public', 's', list[i].id);
            if (fs.existsSync(dirname)) {
                newlist.push(list[i]);
            }
            else {
                console.log("\"" + list[i].id + "\" - \"" + list[i].title + "\" does not exist and will be removed from the index.");
            }
        }
        if (list.length > newlist.length) {
            // Save without old items
            fs.writeFileSync(cd.ContentDescription.CONTENT_FILE, JSON.stringify(newlist), 'utf-8');
            var delcount = list.length - newlist.length;
            console.log("Deleted " + delcount.toString() + " entry" + (delcount === 1 ? "" : "s") + " from the index because " + (delcount === 1 ? "its directory does" : "their directories do") + " not exist.");
        }
        else {
            console.log("All folders exist.");
        }
        // Clean up
        list = null;
        // Now the same thing, but in reverse
        console.log("Checking if ids for folders exist...");
        // If item exists, the folder can stay (In case the item was deleted/not saved but the folder is on disk)
        var content_dirs = dirs(path.join('public', 's'));
        var deleted_count = 0;
        for (var i = 0; i < content_dirs.length; i++) {
            if (!newlist.some(item => item.id === content_dirs[i])) {
                console.log(content_dirs[i], "is not in list");
                // we need to delete this directory
                rimraf(path.join('public', 's', content_dirs[i]));
                deleted_count++;
            }
        }
        if (deleted_count > 0) {
            console.log("Deleted " + deleted_count.toString() + " director" + (deleted_count === 1 ? "y that wasn't" : "ies that weren't") + " in the index.");
        }
        else {
            console.log("All entrys exist.");
        }
        console.log("Finished integrity check.");
    }
    catch (e) {
        console.log("Failed integrity check, starting anyways.");
    }
}
exports.checkIntegrity = checkIntegrity;
// https://stackoverflow.com/a/35759360/5728357
const { readdirSync, statSync } = require('fs');
const { join } = require('path');
const dirs = p => readdirSync(p).filter(f => statSync(join(p, f)).isDirectory());
// Source: https://stackoverflow.com/a/42505874/5728357
function rimraf(dir_path) {
    if (fs.existsSync(dir_path)) {
        fs.readdirSync(dir_path).forEach(function (entry) {
            var entry_path = path.join(dir_path, entry);
            if (fs.lstatSync(entry_path).isDirectory()) {
                rimraf(entry_path);
            }
            else {
                fs.unlinkSync(entry_path);
            }
        });
        fs.rmdirSync(dir_path);
    }
}
//# sourceMappingURL=integrity.js.map