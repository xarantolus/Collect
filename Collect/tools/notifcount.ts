import express = require('express');

var app = express();

export function setNotificationCount(count: number): void {
    global["notif_count"] = count;
}

export function increaseNotificationCount(): void {
    setNotificationCount(global["notif_count"] + 1);
}

export function decreaseNotificationCount(): void {
    var current = global["notif_count"];
    setNotificationCount(current > 0 ? current - 1 : 0);
}