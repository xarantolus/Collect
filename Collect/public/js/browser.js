//Socket.io events
var socket = io();
var notification_count = 0;

function setNotifications() {
    var c_e = document.getElementById("notif_count");
    var s_e = document.getElementById("notif_spinner");
    c_e.innerHTML = notification_count;
    if (notification_count === 0) {
        c_e.style.backgroundColor = "green";
        s_e.style.visibility = "hidden";
    } else {
        c_e.style.backgroundColor = "orange";
        s_e.style.visibility = "visible";
    }
}

socket.on('url', function (data) {
    var url = new URL(data.url);
    var parsedurl = url.hostname + (url.pathname == "/" ? "" : url.pathname);
    switch (data.step) {
        case 0: {
            UIkit.notification({
                message: 'Started processing url <a href="' + data.url + '" target="_blank">' + parsedurl + '</a>',
                status: 'primary',
                pos: 'bottom-right',
                timeout: 3000
            });
            notification_count++;
            break;
        }
        case 2: {
            UIkit.notification({
                message: '<a style="color:#32d296" href="/' + data.result.pagepath + '">Finished processing url ' + parsedurl + '</a>',
                status: 'success',
                pos: 'bottom-right',
                timeout: 3000
            });
            notification_count--;
            break;
        }
        case 4: {
            UIkit.notification({
                message: 'Error while processing url <a href="' + data.url + '" target="_blank">' + parsedurl + '</a>',
                status: 'danger',
                pos: 'bottom-right',
                timeout: 3000
            });
            notification_count--;
            break;
        }
    }
    setNotifications();
});

