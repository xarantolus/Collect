// Variables
var notification_count = 0;
var current_domain = "";

var n_timeout = 3500;
var n_pos = "bottom-right"
// General Methods

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
    document.title = notification_count > 0 ? '(' + notification_count + ') ' + title : title;
}

function scrollToTop() {
    if (document.body.scrollTop !== 0 || document.documentElement.scrollTop !== 0) {
        window.scrollBy(0, -50);
        requestAnimationFrame(scrollToTop);
    }
}

function setState(data, title, url, replace = false) {
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
            html = '<a href="/s/' + site["pagepath"] + '">' + site["title"] + '</a>';
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

// Method for Requesting Data
// Based on https://gist.github.com/duanckham/e5b690178b759603b81c
// usage(POST): ajax(url, data).post(function(status, obj) { });
// usage(GET): ajax(url, data).get(function(status, obj) { });
var ajax = function (url, data) {
    var wrap = function (method, cb) {
        var xhr = new XMLHttpRequest();

        xhr.open(method, url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(data ? JSON.stringify(data) : null);

        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status > 0) {
                cb(xhr.status, JSON.parse(xhr.responseText));
            }
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

function setEventListeners() {
    if (location.pathname !== "/login") {
        /*
            var str_site = location.protocol + '//' + location.host + '/site/';
            var str_details = location.protocol + '//' + location.host + '/details/';
            var str_new = location.protocol + '//' + location.host + '/new';
            var elements = document.getElementsByTagName('a');
            for (var i = 0; i < elements.length; i++) {
                // Update table for list urls
                if (elements[i].href.startsWith(str_site) || elements[i].href === location.protocol + '//' + location.host + '/') {
                    elements[i].onclick = function () {
                        var domain = getLastUrlElement(this.href);
                        LoadTable(domain);
                        return false;
                    };
                }
    
                // Update details for details urls
                if (elements[i].href.startsWith(str_details)) {
                    elements[i].onclick = function () {
                        var id = getLastUrlElement(this.href);
                        LoadDetails(id);
                        return false;
                    };
                }
    
                // "Add" Element in header
                if (elements[i].href.startsWith(str_new)) {
                    elements[i].onclick = function () {
                        LoadNew();
                        return false;
                    };
                }
            }
            */
        // Form on New Page
        if (location.pathname === "/new") {
            document.getElementById("new_form").addEventListener('submit', SubmitNewForm);
        }
    }
}

// Event Methods
function SubmitNewForm(evt) {
    var url = document.getElementById("url").value;
    var depth = document.getElementById("depth").value;

    var data = new FormData();
    data.append("url", url);
    data.append("depth", depth);

    ajax("/api/v1/site/add", data).post(function (status, obj) {
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

function LoadTable(domain = "", replace = false) {
    current_domain = domain;
    var date_start = Date.now();
    setLoading(true);
    ajax('/api/v1/sites/', null).get(function (status, sites) {
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

                //Add sites
                for (var index in sites) {
                    tbody.appendChild(createRow(sites[index]));
                }
                table.appendChild(tbody);
                content.innerHTML = "";
                content.appendChild(table);
            } else {
                content.innerHTML = '<div class="uk-placeholder uk-text-center">There are no archived sites.<br><a href="/new">Add a new site to your archive</a></div>';
            }
        } else {
            var message = "An unknown error occurred.";
            if (sites.message) {
                message = "Error: " + sites.message;
            }
            content.innerHTML = '<div class="uk-placeholder uk-text-center" style="color:red">' + message + '<br><a href="' + (domain === "" ? "/" : "/site/" + domain) + '">Try again</a></div>';
        }

        setLoading(false);
        var dm = domain === "" ? "All Sites" : domain;
        setTitle(dm + " - Collect");
        document.getElementById("title").innerText = dm;
        setState(domain, document.title, location.protocol + "//" + location.host + (domain === "" ? "/" : "/site/" + domain), replace);

        //Re-enable event listeners
        setEventListeners();
        scrollToTop();
    });
}



window.onpopstate = function (event) {
    //If we have no event, we go to the root page
    current_domain = event === null ? "" : event.state || "";
    if (current_domain.startsWith("-")) {
        // current_domain contains the details id
        LoadDetails(current_domain.substr(1, current_domain.length - 1), true);
    }
    else if (current_domain.startsWith("+")) {
        //The /new page
        LoadNew(true);
    }
    else {
        // current_domain contains the domain we had before
        LoadTable(current_domain || "", true);
    }
};


// Run this on load
current_domain = getLastUrlElement(document.location);
setEventListeners();