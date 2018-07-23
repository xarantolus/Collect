// Variables
var notification_count = 0;
// We need to reload if an error happened in a XMLHttpRequest
// if this is true and we reconnect to the server, we reload automatically (see socket.on('connect'... )
var needs_to_reload = false;
// This object describes the current state
var state = { data: "", isTable: false, isNew: false, isDetails: false };
// The title without notification count (needed when the notification count changes)
var titleWithoutCount = document.title;
// Prevent reloading our own page when we set the title
var t_prevent_reload = false;
// The timeout for notifications and error messages
var n_timeout = 3500;
// The position of the notification (Docs: https://getuikit.com/docs/notification#position)
var n_pos = "bottom-right";


//Socket.io, but only if not logging in
if (location.pathname !== "/login") {
    // If audio is available, we play a sound when we receive an 'download finished' event (see socket.on('url'... , step 2))
    var notif_sound = (Audio) ? new Audio("/notification_sound.ogg") : null;


    var sess_cookie = getCookie('session_id');
    var socket = io(location.protocol + "//" + location.host, { query: { session_id: sess_cookie } });

    //Url event handling
    socket.on('url', function (data) {
        if (data.url.startsWith("video:")) {
            data.url = data.url.substring(6);
        }
        var url = new URL(data.url);

        if (!isNumber(notification_count)) {
            // In case we haven't yet received the 'notifcount' event
            notification_count = 0;
        }

        var parsedurl = url.hostname + (url.pathname === "/" ? "" : url.pathname);
        switch (data.step) {
            case 0: {
                // Started
                UIkit.notification({
                    message: 'Started processing url <a href="' + data.url + '" target="_blank">' + parsedurl + '</a>',
                    status: 'primary',
                    pos: n_pos,
                    timeout: n_timeout
                });
                notification_count++;
                break;
            }
            case 1: {
                // Already existed
                // Started
                UIkit.notification({
                    message: 'The entry "<a href="/s/' + data.result.pagepath + '">' + data.result.title + '</a>" already exists',
                    status: 'primary',
                    pos: n_pos,
                    timeout: n_timeout
                });
                notification_count--;
                break;
            }
            case 2: {
                // Finished
                UIkit.notification({
                    message: '<a style="color:#32d296" href="/s/' + data.result.pagepath + '">Finished processing "' + data.result.title + '"</a>',
                    status: 'success',
                    pos: n_pos,
                    timeout: n_timeout
                });

                // Play notification sound      
                if (notif_sound && notif_sound.canPlayType("audio/ogg") && notif_sound.readyState > 3) {
                    notif_sound.onended = function () {
                        // Since audio can only be played once, we need to reload it for the next notification
                        notif_sound.src = notif_sound.src;
                    }
                    notif_sound.play();
                }

                notification_count--;
                break;
            }
            case 4: {
                // Error
                UIkit.notification({
                    message: 'Error while processing url <a href="' + data.url + '" target="_blank">' + parsedurl + '</a>',
                    status: 'danger',
                    pos: n_pos,
                    timeout: n_timeout
                });
                notification_count--;
                break;
            }
        }
        setNotifications();

        // Reload if download finished and the user is viewing a relevant table
        if (data.step === 2 && state.isTable && (data.result.domain === state.data || state.data === "")) {
            LoadTable(state.data);
        }
    });

    socket.on('titlechange', function (data) {
        // Is reloading currently prevented?
        if (!t_prevent_reload) {
            if (state.data === data.id && state.isDetails) {
                // On details page for this item
                LoadDetails(state.data, true);
            } else if (!state.isNew && state.isTable) {
                LoadTable(state.data, null);
            }
        } else {
            t_prevent_reload = false;
        }
    });

    socket.on('delete', function (data) {
        if (state.data === data.id && state.isDetails) {
            // On details page for this item, but it got deleted
            LoadTable("", null);
        } else if (!state.isNew && !state.isDetails) {
            LoadTable(state.data, null);
        }

        UIkit.notification({
            message: data.message || "Deleted an item",
            status: 'primary',
            pos: n_pos,
            timeout: n_timeout
        });
    });
    //Notification count handling
    socket.on('notifcount', function (count) {
        notification_count = count || 0;
        setNotifications();
        setTitle(titleWithoutCount);
    });
    // Display unknown notification count
    socket.on('disconnect', function () {
        notification_count = "?";
        needs_to_reload = true;
        setNotifications();
        setTitle(titleWithoutCount);
    });
    // Reload if we aren't authenticated
    socket.on('error', function (err_code) {
        if (err_code === "ERR_CONNECT_UNAUTHORIZED") {
            location.reload();
        }
    });
    // We are connected
    socket.on('connect', function () {
        if (needs_to_reload) {
            // this is not the first connect. We need to reload in case anything was changed while we didn't receive events
            resolveCurrent();
        }
    });
}

// General Methods

// Source: https://stackoverflow.com/a/15724300
function getCookie(name) {
    var value = "; " + document.cookie;
    var parts = value.split("; " + name + "=");
    if (parts.length === 2) return parts.pop().split(";").shift();
}

// Source: https://stackoverflow.com/a/9716515/5728357
function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

// Source for next 5 methods: https://gist.github.com/james2doyle/5694700

// easing functions http://goo.gl/5HLl8
Math.easeInOutQuad = function (t, b, c, d) {
    t /= d / 2;
    if (t < 1) {
        return c / 2 * t * t + b
    }
    t--;
    return -c / 2 * (t * (t - 2) - 1) + b;
};

Math.easeInCubic = function (t, b, c, d) {
    var tc = (t /= d) * t * t;
    return b + c * (tc);
};

Math.inOutQuintic = function (t, b, c, d) {
    var ts = (t /= d) * t,
        tc = ts * t;
    return b + c * (6 * tc * ts + -15 * ts * ts + 10 * tc);
};

// requestAnimationFrame for Smart Animating http://goo.gl/sx5sts
var requestAnimFrame = (function () {
    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function (callback) { window.setTimeout(callback, 1000 / 60); };
})();

function scrollTo(to, callback, duration) {
    // because it's so fucking difficult to detect the scrolling element, just move them all
    function move(amount) {
        document.documentElement.scrollTop = amount;
        document.body.parentNode.scrollTop = amount;
        document.body.scrollTop = amount;
    }
    function position() {
        return document.documentElement.scrollTop || document.body.parentNode.scrollTop || document.body.scrollTop;
    }
    var start = position(),
        change = to - start,
        currentTime = 0,
        increment = 20;
    duration = (typeof (duration) === 'undefined') ? 500 : duration;
    var animateScroll = function () {
        // increment the time
        currentTime += increment;
        // find the value with the quadratic in-out easing function
        var val = Math.easeInOutQuad(currentTime, start, change, duration);
        // move the document.body
        move(val);
        // do the animation unless its over
        if (currentTime < duration) {
            requestAnimFrame(animateScroll);
        } else {
            if (callback && typeof (callback) === 'function') {
                // the animation is done so lets callback
                callback();
            }
        }
    };
    animateScroll();
}

// Scroll to top if on bottom of page, else it scrolls to bottom
function scrollBottomTop(evt) {

    // https://stackoverflow.com/a/8028584
    var h = document.documentElement,
        b = document.body,
        st = 'scrollTop',
        sh = 'scrollHeight';

    var percent = (h[st] || b[st]) / ((h[sh] || b[sh]) - h.clientHeight);

    if (percent > 0.8) {
        // We are at the end of the page, scroll up
        scrollTo(0);
    }
    else {
        // Scroll down
        var height = Math.max(b.scrollHeight || 0, b.clientHeight || 0, h.clientHeight || 0, h.scrollHeight || 0, h.clientHeight || 0);
        scrollTo(height);
    }

    evt.preventDefault();
}

function humanFileSize(bytes, si) {
    // Source: https://stackoverflow.com/a/14919494/5728357
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

function setLoading(bool) {
    var spinner = document.getElementById("load_spinner");
    var logo = document.getElementById("logo");
    if (bool) {
        spinner.style.display = "inline";
        logo.style.display = "none";
    } else {
        spinner.style.display = "none";
        logo.style.display = "inline";
    }
}

function setTitle(title) {
    titleWithoutCount = title;
    if (isNumber(notification_count)) {
        document.title = notification_count > 0 ? '(' + notification_count + ') ' + title : title;
    } else {
        document.title = '(' + notification_count + ') ' + title; // It is the 'unknown' character
    }
}

function setNotifications() {
    notification_count = notification_count < 0 ? 0 : notification_count;
    var c_e = document.getElementById("notif_count");
    c_e.innerHTML = notification_count;
    if (isNumber(notification_count)) {
        c_e.style.backgroundColor = notification_count === 0 ? "green" : "orange";
    } else {
        c_e.style.backgroundColor = "red";
    }
    setTitle(titleWithoutCount);
}

function setState(data, title, url, replace) {
    if (replace) {
        window.history.replaceState(data, title, url);
    } else {
        window.history.pushState(data, title, url);
    }
}

function getLastUrlElement(str) {
    var elem = "";
    var url = new URL(str);
    if (url.pathname !== "/") {
        var split = url.pathname.split("/");
        elem = split[split.length - 1];
    }
    return elem;
}

function tableElement(tag, html) {
    var elem = document.createElement(tag);
    elem.innerHTML = html;
    return elem;
}

function formatDate(date) {
    return (new Date(date)).toString().replace(/\S+\s(\S+)\s(\d+)\s(\d+)\s.*/, '$2. $1 $3')
}

function createRow(site) {
    var container = document.createElement("tr");
    const fields = ["title", "saved", "domain", "details"];
    for (var i in fields) {
        var html = "";
        if (fields[i] === "title") {
            // This escapes the title
            var t = document.createElement('a');
            t.href = "/s/" + ((site.pagepath.endsWith("/index.html") || site.pagepath.endsWith("\index.html")) ? (site.id + "/") : site.pagepath);
            t.innerText = site["title"];

            html = t.outerHTML;
        }
        else if (fields[i] === "domain") {
            html = '<a href="/site/' + site["domain"] + '">' + site["domain"] + '</a>';
        }
        else if (fields[i] === "details") {
            html = '<a href="/details/' + site["id"] + '">Details</a>';
        }
        else if (fields[i] === "saved") {
            html = formatDate(site["saved"]);
        }
        container.appendChild(tableElement("td", html));
    }
    return container;
}

function DisplayError(message) {
    message = message || "An unknown error occured.";

    var href = "/";

    if (state.isDetails) {
        href = "/details/" + state.data;
    }
    else if (state.isNew) {
        href = "/new";
    }
    else if (state.isTable && state.data !== "") {
        href = "/site/" + state.data;
    }

    document.getElementById("content").innerHTML = '<div class="uk-placeholder uk-text-center" style="color: red">' + message + '<br><a href="' + href + '">Try again</a></div>';

    setTitle("Error - Collect");
    document.getElementById("title").innerText = "Error";

    setState(state, document.title, location.protocol + "//" + location.host + href, true);
    //Re-enable event listeners
    setEventListeners();
}

// Source: https://stackoverflow.com/a/1714899/5728357
function urlencodeFormData(obj) {
    var str = [];
    for (var p in obj) {
        if (obj.hasOwnProperty(p)) {
            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
        }
    }
    return str.join("&");
}

// Method for Requesting Data
// Based on https://gist.github.com/duanckham/e5b690178b759603b81c
// usage(POST): ajax(url, data).post(function(status, obj) { });
// usage(GET): ajax(url, data).get(function(status, obj) { });
var ajax = function (url, data) {
    var wrap = function (method, cb) {
        needs_to_reload = false; // don't reload automatically if the user submitted another request
        var sendstr = null;
        var xhr = new XMLHttpRequest();
        xhr.open(method, url, true);

        if (method === 'POST' && data) {
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            sendstr = urlencodeFormData(data);
        }

        xhr.send(sendstr);

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status > 0) {
                if (xhr.status === 401) {
                    window.location.reload();
                }

                try {
                    cb(xhr.status, JSON.parse(xhr.responseText));
                } catch (e) {
                    cb(422, { message: "Error while processing data." })
                }
            }
        }

        xhr.onerror = function (ev) {
            DisplayError("The connection to the server timed out.");
            setEventListeners();
            setLoading(false);
            needs_to_reload = true;
        }

        return xhr;
    };

    return {
        get: function (cb) {
            return wrap('GET', cb);
        },
        post: function (cb) {
            return wrap('POST', cb);
        }
    };
};

// Sets event listeners
// This method is only called when `state` is initialized
function setEventListeners() {
    if (location.pathname === "/login") {
        // We don't do anyting on the login page
        return;
    }


    // Loads a table for a given domain
    // This happens on listings and details
    var loadTableHandler = function (evt) {
        var domain = getLastUrlElement(this.href);
        LoadTable(domain);
        evt.preventDefault();
    };


    // General events that happen on every page

    // All links to the home/main page
    var homeButtons = document.querySelectorAll('a[href="/"]')
    for (var i = 0; i < homeButtons.length; i++) {
        homeButtons[i].onclick = loadTableHandler;
    }

    // Add title click scrolling (in header)
    document.getElementById('title').onclick = scrollBottomTop;

    // New: Loads the new page
    // This should be used by the 'Add' button & the link that is there when you don't have any pages
    var loadNewHandler = function (evt) {
        LoadNew();
        evt.preventDefault();
    };

    var newButtons = document.querySelectorAll('a[href="/new"]');
    for (var i = 0; i < newButtons.length; i++) {
        newButtons[i].onclick = loadNewHandler;
    }

    // Register `details` event listeners
    if (state.isTable) {
        // Loads the details of a page
        // This is used in all table listings, aka when `state.isTable` === true
        var loadDetailsHandler = function (evt) {
            var id = getLastUrlElement(this.href);
            LoadDetails(id);
            evt.preventDefault();
        };

        var detailButtons = document.querySelectorAll('a[href^="/details/"]');
        for (var i = 0; i < detailButtons.length; i++) {
            detailButtons[i].onclick = loadDetailsHandler;
        }
    }


    // Form on Details Page
    if (state.isDetails) {
        var del_button = document.getElementById("delete");
        if (del_button) { del_button.onclick = SubmitDeleteEntry; }

        var sub_button = document.getElementById("submit");
        if (sub_button) { sub_button.onclick = SubmitChangeTitle; }
    }

    // Register `table` event listeners
    if (state.isTable || state.isDetails) {

        // All links that point to a site listing (also all sites)
        // We need to convert these NodeLists to arrays to join them
        var siteButtons = document.querySelectorAll('a[href^="/site/"]');
        for (var i = 0; i < siteButtons.length; i++) {
            siteButtons[i].onclick = loadTableHandler;
        }
    }




    // Register listeners for the form on the new page
    if (state.isNew) {
        var new_form = document.getElementById("new_form")
        if (new_form) {
            new_form.onsubmit = SubmitNewForm;
        }

        // Add "video:" text in front of the url if we click on it below the form
        document.getElementById("new-video").onclick = function () {
            var urlelem = document.getElementById("url");

            // Add "video:" to the url if clicked
            if (!urlelem.value.startsWith("video:")) {
                urlelem.value = "video:" + urlelem.value;
            }

            urlelem.focus();
        };

        // onchange function for depth
        var depth_elem = document.getElementById('depth');
        var samedomain_elem = document.getElementById('samedomain');

        // Disabled element in select
        var followNone = document.createElement("option");
        followNone.hidden = true;
        followNone.disabled = true;
        followNone.value = "followNone";
        followNone.innerText = "Don't follow any hyperlinks";

        var changeDepthHandler = function () {
            // Enable the sameDomain element if there is a depth
            // 5 is the max allowed depth
            var is_disabled = !(isNumber(depth_elem.value) && (depth_elem.value <= 5 && depth_elem.value > 0));

            if (is_disabled) {
                if (samedomain_elem.children.length === 2) {
                    samedomain_elem.appendChild(followNone);
                    samedomain_elem.value = "followNone";
                }
            } else if (samedomain_elem.children.length === 3) {
                samedomain_elem.removeChild(followNone);
            }

            samedomain_elem.disabled = is_disabled;
        };

        // Initialize the page by running the handler: Now the `samedomain` element should be disabled
        changeDepthHandler();

        depth_elem.onchange = changeDepthHandler;
        depth_elem.oninput = changeDepthHandler;
    }
}

// Event Methods
function SubmitNewForm(evt) {
    // Get required data
    var f = {
        "title": document.getElementById("n_title").value,
        "url": document.getElementById("url").value,
        "depth": document.getElementById("depth").value,
        "samedomain": document.getElementById("samedomain").value === "followSame",
        "cookies": document.getElementById("cookies").value,
        "useragent": document.getElementById("useragent").value
    };

    setLoading(true);

    ajax("/api/v1/site/add", f).post(function (status, obj) {
        var e_f = document.getElementById("error_field");
        if (status === 202) {
            e_f.style.visibility = "hidden";
            return LoadTable();
        } else {
            e_f.innerHTML = '<p class="uk-text-center">' + obj.message + '</p>';
            e_f.style.visibility = "visible";
            setLoading(false);
        }
    });
    evt.preventDefault();
}

function SubmitDeleteEntry(evt) {
    var id = state.data;

    setLoading(true);

    ajax("/api/v1/site/" + id + "/delete", null).post(function (status, obj) {
        if (status === 200) {
            // There should be a notification coming from the server
            return LoadTable();
        } else {
            var error_field = document.getElementById("d_err");
            var error_message_elem = document.getElementById("d_err_mess");

            error_field.className = "uk-alert-danger";
            error_field.style.display = "block";
            error_message_elem = obj.message || "Unknown error";

            setLoading(false);
        }
    });

    evt.preventDefault();
}

function SubmitChangeTitle(evt) {
    var id = state.data;
    // Prevent reloading the current page after the title changes
    t_prevent_reload = true;

    setLoading(true);

    var f = { "title": document.getElementById("d_title").value };

    ajax("/api/v1/site/" + id + "/settitle", f).post(function (status, obj) {
        var error_field = document.getElementById("d_err");
        var error_message_elem = document.getElementById("d_err_mess");

        if (status === 200) {
            error_field.className = "uk-alert-success uk-alert";
        } else {
            error_field.className = "uk-alert-danger uk-alert";
        }

        error_message_elem.innerText = obj.message || "Unknown error";
        error_field.style.display = "block";
        setLoading(false);

        setTimeout(function () {
            error_field.style.display = "none";
        }, n_timeout);
    });

    evt.preventDefault();
}

function LoadTable(domain, replace) {
    domain = domain || "";
    replace = replace || false;

    state.data = domain;
    state.isDetails = false;
    state.isNew = false;
    state.isTable = true;

    setLoading(true);
    ajax('/api/v1/sites/' + domain, null).get(function (status, sites) {
        var content = document.getElementById("content");
        if (status === 200) {
            if (sites.length > 0) {
                // Create table
                var table = document.createElement("table");
                table.className = "uk-table uk-table-striped uk-table-hover uk-table-responsive";

                // Create thead
                var thead = document.createElement("thead");
                var tr = document.createElement("tr");
                tr.appendChild(tableElement("th", "Title"));
                tr.appendChild(tableElement("th", "Date"));
                tr.appendChild(tableElement("th", "Domain"));
                tr.appendChild(tableElement("th", "Details"));

                thead.appendChild(tr);
                table.appendChild(thead);

                //Create tbody
                var tbody = document.createElement("tbody");

                var size = 0;
                //Add sites
                for (var index in sites) {
                    tbody.appendChild(createRow(sites[index]));
                    size += sites[index].size;
                }
                table.appendChild(tbody);
                content.innerHTML = "";
                content.appendChild(table);

                // Add Counter
                var count_label = "There " + (sites.length === 1 ? "is" : "are") + " " + sites.length + " item" + (sites.length === 1 ? "" : "s") + (((domain || "") === "") ? "" : " for this domain") + " with a size of about " + humanFileSize(size, true);

                var c_l = document.createElement("div");
                c_l.className = "uk-text-center uk-margin-small uk-text-muted uk-text-small";
                c_l.innerText = count_label;

                content.appendChild(c_l);

            } else {
                content.innerHTML = '<div class="uk-placeholder uk-text-center">There are no archived sites.<br><a href="/new">Add a new site to your archive</a></div>';
            }
        } else {
            var message = "An unknown error occurred.";
            if ((sites || {}).message) {
                message = "Error: " + sites.message;
            }
            content.innerHTML = '<div class="uk-placeholder uk-text-center" style="color:red">' + message + '<br><a href="' + (domain === "" ? "/" : "/site/" + domain) + '">Try again</a></div>';
        }

        setLoading(false);
        var dm = domain === "" ? "All Sites" : domain;
        setTitle(dm + " - Collect");
        document.getElementById("title").innerText = dm;
        setState(state, document.title, location.protocol + "//" + location.host + (domain === "" ? "/" : "/site/" + domain), replace);

        //Re-enable event listeners
        setEventListeners();
    });
}

function LoadDetails(id, replace) {
    replace = replace || false;
    //We need an id
    if (id === null || id === "") {
        throw new ReferenceError("Missing parameter id");
    }

    state.data = id;
    state.isDetails = true;
    state.isNew = false;
    state.isTable = false;

    setLoading(true);

    ajax('/api/v1/details/' + id, null).get(function (status, item) {
        var content = document.getElementById("content");
        if (status === 200) {
            var err_con = document.createElement("div");
            err_con.className = "uk-alert-success";
            err_con.id = "d_err";
            err_con["uk-alert"] = "";
            err_con.style.display = "none";

            var err_mess = document.createElement("p");
            err_mess.className = "uk-text-center";
            err_mess.id = "d_err_mess";
            err_mess.innerText = "";

            err_con.appendChild(err_mess);

            // Create form
            var form = document.createElement("form");

            form.appendChild(err_con);

            form.id = 'details_form';
            form.action = '/details/' + item.id;
            form.method = "POST";

            form.className = "uk-form-horizontal uk-margin-large";

            var fields = ["Url", "Path", "Size", "Id", "Domain", "Saved", "Title"];

            for (var i = 0; i < fields.length; i++) {
                var f = fields[i] === "Path" ? "pagepath" : fields[i].toLowerCase();

                var container = document.createElement("div");
                container.className = "uk-margin";

                var label = document.createElement("label");
                label.className = "uk-form-label";
                label.htmlFor = "form-horizontal-text";
                label.innerText = fields[i] === "Size" ? "Size on disk" : fields[i];

                container.appendChild(label);


                var input_con = document.createElement("div");
                input_con.className = "uk-form-controls";

                container.appendChild(input_con);

                var input = null;
                if (["url", "pagepath", "domain"].some(function (item) { return item === f; })) {
                    input = document.createElement("a");
                    switch (f) {
                        case "url": {
                            input.href = item.url;
                            input.innerText = item.url;
                            input.target = "_blank";
                            break;
                        }
                        case "pagepath": {
                            var displaypath = (item.pagepath.endsWith("/index.html") || item.pagepath.endsWith("\index.html")) ? (item.id + "/") : item.pagepath;
                            input.href = '/s/' + displaypath;
                            input.innerText = displaypath;
                            break;
                        }
                        case "domain": {
                            input.href = '/site/' + item.domain;
                            input.innerText = item.domain;
                            break;
                        }
                    }
                    input.id = f;
                } else {
                    input = document.createElement("input");
                    input.name = f;
                    input.type = "text";
                    input.placeholder = fields[i];
                    input.value = f === "saved" ?
                        formatDate(item[f])
                        : f === "size" ? humanFileSize(item["size"], true) : item[f];
                    if (f !== "title") {
                        input.disabled = true;
                        input.id = f;
                    } else {
                        input.id = "d_title";
                    }
                }
                input.classList = "uk-input";


                input_con.appendChild(input);
                form.appendChild(container);
            }

            var butcon = document.createElement("div");
            butcon.className = "uk-margin";

            // Submit button
            var buts = document.createElement("button");
            buts.innerText = "Submit";
            buts.name = "submit";
            buts.className = "uk-button uk-button-primary button-submit";
            buts.type = "submit";
            buts.id = "submit";

            butcon.appendChild(buts);

            // Delete button
            var butd = document.createElement("button");
            butd.innerText = "Delete";
            butd.name = "delete";
            butd.className = "uk-button uk-button-danger button-reset";
            butd.type = "submit";
            butd.id = "delete";

            butcon.appendChild(butd);

            form.appendChild(butcon);

            content.innerHTML = "";
            content.appendChild(form);
        } else {
            DisplayError((item || {}).message);
        }
        setLoading(false);

        setTitle("Details - Collect");
        document.getElementById("title").innerText = "Details";

        setState(state, document.title, location.protocol + "//" + location.host + "/details/" + id, replace);
        //Re-enable event listeners
        setEventListeners();
    });
}

function LoadNew(replace) {
    replace = replace || false;

    state.data = null;
    state.isDetails = false;
    state.isNew = true;
    state.isTable = false;

    document.getElementById("content").innerHTML = '<form class="uk-form-horizontal uk-margin-large" id="new_form" method="POST" action="/new"> <div class="uk-alert-danger" uk-alert id="error_field" style="visibility:hidden;"></div><!-- Url--><div class="uk-margin"><label class="uk-form-label" for="form-horizontal-text">Url</label><div class="uk-form-controls"><input class="uk-input" id="url" type="url" name="url" autofocus placeholder="Url" value=""></div></div><!-- Depth--><div class="uk-margin"><label class="uk-form-label" for="form-horizontal-text">Depth<span class="uk-text-muted" title="If you don\'t set a depth, the default of zero will be used"> (optional)</span></label><div class="uk-form-controls"><input class="uk-input" id="depth" type="number" step="1" min="0" max="5" name="depth" placeholder="Depth" value=""></div></div><!-- SameDomain--><div class="uk-margin"><label class="uk-form-label" for="form-horizontal-text">Following Behaviour</label><div class="uk-form-controls"><select class="uk-select" name="samedomain" id="samedomain" placeholder="Following Behaviour"><option value="followAll">Follow all hyperlinks</option><option value="followSame">Only follow hyperlinks to the same domain</option></select></div></div><!-- Advanced options--><details><summary style="cursor: pointer;">Advanced options</summary><!-- Title--><div class="uk-margin"><label class="uk-form-label" for="form-horizontal-text">Title<span class="uk-text-muted" title="If you don\'t enter anything here, the title will be detected automatically"> (optional)</span></label><div class="uk-form-controls"><input class="uk-input" id="n_title" type="text" name="title" placeholder="Title" value=""></div></div><!-- Cookies--><div class="uk-margin"><label class="uk-form-label" for="form-horizontal-text">Cookies<span class="uk-text-muted" title="If you don\'t enter anything here, the request will be sent without any cookies"> (optional)</span></label><div class="uk-form-controls"><input class="uk-input" id="cookies" type="text" name="cookies" placeholder="cookie1=value1;cookie2=value2" value=""></div></div><!-- User-Agent--><div class="uk-margin"><label class="uk-form-label" for="form-horizontal-text">User-Agent<span class="uk-text-muted" title="If you don\'t enter anything here, the default user agent will be used"> (optional)</span></label><div class="uk-form-controls"><!-- By default the requests module doesn\'t send a user agent--><input class="uk-input" id="useragent" type="text" name="useragent" placeholder="Mozilla/5.0 (Windows NT 6.1; WOW64; rv:40.0) Gecko/20100101 Firefox/40.1" value=""></div></div></details><div class="uk-margin"><button class="uk-button uk-button-primary button-submit" type="submit">Submit</button><button class="uk-button uk-button-default button-reset" type="reset">Reset</button></div></form><br class="uk-margin-remove"><div class="uk-text-center uk-margin-small uk-text-muted ">Hint: You can write <span class="uk-text-primary" id="new-video">"video:"</span> before an url to download only the video.</div></div>';

    document.getElementById("url").focus();

    setTitle("New Entry - Collect");
    document.getElementById("title").innerText = "New Entry";
    setState(state, document.title, location.protocol + "//" + location.host + "/new", replace);

    //Re-enable event listeners
    setEventListeners();
}

function resolveCurrent(replace) {
    replace = replace || false;

    if (state.isDetails) {
        // data contains the details id
        LoadDetails(state.data, replace);
    }
    else if (state.isNew) {
        //The /new page
        LoadNew(replace);
    }
    else {
        // data contains the domain we had before
        LoadTable(state.data || "", replace);
    }
}

// This happens when the user presses the 'back' / 'next' button in their browser
window.onpopstate = function (event) {
    // we should get a state
    if (event && event.state) {
        state = event.state;
    }
    // Else: default state (line 5)

    resolveCurrent(true);
};

// Run this on load
state.data = getLastUrlElement(document.location);

if (window.location.pathname.startsWith("/new")) {
    // New page
    state.isNew = true;
    state.data = null;
} else if (window.location.pathname.startsWith("/details/")) {
    //Details page
    state.isDetails = true;
} else {
    // Must be table
    state.isTable = true;
}

// Set the initial state of the page
setState(state, document.title, location, true);

setEventListeners();