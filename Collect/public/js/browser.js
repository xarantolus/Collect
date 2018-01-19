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
setEventListeners();