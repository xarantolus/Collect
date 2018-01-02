//Socket.io events
var socket = io();
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
                message: '<a style="color:#32d296" href="/s/' + data.result.pagepath + '">Finished processing url ' + parsedurl + '</a>',
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
    if (!current_domain.startsWith("-") && !current_domain.startsWith("+")) {
        LoadTable(current_domain);
    }
});
socket.on('notifcount', function (count) {
    notification_count = count || 0;
    setNotifications();
});

var notification_count = 0;
function setNotifications() {
    notification_count = notification_count < 0 ? 0 : notification_count;
    var c_e = document.getElementById("notif_count");
    c_e.innerHTML = notification_count;
    c_e.style.backgroundColor = notification_count === 0 ? "green" : "orange";
}

function scrollToTop() {
    if (document.body.scrollTop !== 0 || document.documentElement.scrollTop !== 0) {
        window.scrollBy(0, -50);
        requestAnimationFrame(scrollToTop);
    }
}

var current_domain = getLastUrlElement(document.location);

function LoadTable(domain = "", replace = false) {
    current_domain = domain;
    var date_start = Date.now();
    setLoading(true);
    fetch('/api/v1/sites/' + domain, {
        method: 'get'
    }).then(function (response) {
        response.json().then(function (sites) {
            if (response.status === 200) {
                var content = document.getElementById("content");
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
                var content = document.getElementById("content");
                var message = "An unknown error occurred.";
                if (sites.message) {
                    message = "Error: " + sites.message;
                }
                content.innerHTML = '<div class="uk-placeholder uk-text-center" style="color:red">' + message + '<br><a href="' + (domain === "" ? "/" : "/site/" + domain) + '">Try again</a></div>';
            }

            setLoading(false);
            var dm = (domain === "" ? "All Sites" : domain);
            document.title = dm + " - Collect";
            document.getElementById("title").innerText = dm;
            setState(domain, document.title, (location.protocol + "//" + location.host) + (domain === "" ? "/" : "/site/" + domain), replace);

            //Re-enable event listeners
            setEventListeners();
            scrollToTop();
        });

    }).catch(function (err) {
        var content = document.getElementById("content");
        var message = "An unknown error occurred."
        if (err.message) {
            message = err.message;
        }
        content.innerHTML = '<div class="uk-placeholder uk-text-center" style="color:red">' + message + '<br><a href="' + (domain === "" ? "/" : "/site/" + domain) + '">Try again</a></div>';

        var title = "Collect" + (domain === "" ? "" : " - " + domain);
        document.title = title;
        document.getElementById("title").innerText = title;
        setState(domain, title, (location.protocol + "//" + location.host) + (domain === "" ? "/" : "/site/" + domain), replace);

        setLoading(false);
        setEventListeners();
        scrollToTop();
    });
}

function LoadDetails(id, replace = false) {
    //We need an id
    if (id === null || id === "" || id === undefined) {
        throw new ReferenceError("Missing parameter id");
    }
    //Details are loading, so domain is -
    current_domain = "-" + id;
    var date_start = Date.now();
    setLoading(true);
    fetch('/api/v1/details/' + id, {
        method: 'get'
    }).then(function (response) {
        response.json().then(function (item) {
            var content = document.getElementById("content");
            if (response.status === 200) {
                // Create form
                var form = document.createElement("form");
                form.className = "uk-form-horizontal uk-margin-large";

                var fields = ["Url", "Path", "Id", "Domain", "Saved", "Title"];

                for (var i = 0; i < fields.length; i++) {
                    var f = fields[i] === "Path" ? "pagepath" : fields[i].toLowerCase();

                    var container = document.createElement("div");
                    container.className = "uk-margin";

                    var label = document.createElement("label");
                    label.className = "uk-form-label";
                    label.htmlFor = "form-horizontal-text";
                    label.innerText = fields[i];

                    container.appendChild(label);


                    var input_con = document.createElement("div");
                    input_con.className = "uk-form-controls";

                    container.appendChild(input_con);

                    var input = document.createElement("input")
                    input.classList = "uk-input";
                    input.name = f;
                    input.type = "text";
                    input.placeholder = fields[i];
                    input.value = f === "saved" ? (new Date(item[f])).toString().replace(/\S+\s(\S+)\s(\d+)\s(\d+)\s.*/, '$2. $1 $3') : item[f];
                    if (f != "title") {
                        input.disabled = true;
                    }


                    input_con.appendChild(input);
                    form.appendChild(container);
                }

                content.innerHTML = "";
                content.appendChild(form);
            } else {
                var message = "An unknown error occurred.";
                if (sites.message) {
                    message = "Error: " + sites.message;
                }
                content.innerHTML = '<div class="uk-placeholder uk-text-center" style="color:red">' + message + '<br><a href="' + id + '">Try again</a></div>';
            }
            setLoading(false);

            document.title = "Details - Collect";
            document.getElementById("title").innerText = "Details";

            setState("-" + id, document.title, (location.protocol + "//" + location.host) + "/details/" + id, replace);
            //Re-enable event listeners
            setEventListeners();
            scrollToTop();
        });

    }).catch(function (err) {
        var content = document.getElementById("content");
        var message = "An unknown error occurred."
        if (err.message) {
            message = err.message;
        }
        content.innerHTML = '<div class="uk-placeholder uk-text-center" style="color:red">' + message + '<br><a href="/details/' + id + '">Try again</a></div>';

        setLoading(false);

        document.title = "Details - Collect";
        document.getElementById("title").innerText = "Details";
        setState(current_domain, document.title, (location.protocol + "//" + location.host) + "/details/" + id, replace);

        //Re-enable event listeners
        setEventListeners();
        scrollToTop();
    });
}

function LoadNew(replace = false) {
    current_domain = "+";
    document.getElementById("content").innerHTML = `<form class="uk-form-horizontal uk-margin-large" id="new_form" method="POST" action="/new"> 
        <div class="uk-alert-danger" uk-alert id="error_field" style="visibility:hidden;"></div>
        <!-- Url-->
        <div class="uk-margin">
          <label class="uk-form-label" for="form-horizontal-text">Url</label>
          <div class="uk-form-controls">
            <input class="uk-input" id="url" type="url" name="url" placeholder="Url" value="">
          </div>
        </div>
        <!-- Depth-->
        <div class="uk-margin">
          <label class="uk-form-label" for="form-horizontal-text">Depth</label>
          <div class="uk-form-controls">
            <input class="uk-input" id="depth" type="number" step="1" min="0" max="5" name="depth" placeholder="Depth" value="0">
          </div>
        </div>
        <div class="uk-margin">
          <button class="uk-button uk-button-primary button-submit" type="submit">Submit</button>
          <button class="uk-button uk-button-default button-reset" type="reset">Reset</button>
        </div>
      </form>`;


    document.title = "New Entry - Collect";
    document.getElementById("title").innerText = "New Entry";
    setState(current_domain, document.title, (location.protocol + "//" + location.host) + "/new", replace);

    //Re-enable event listeners
    setEventListeners();
    scrollToTop();
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
            html = (new Date(site["saved"])).toString().replace(/\S+\s(\S+)\s(\d+)\s(\d+)\s.*/, '$2. $1 $3');
        }
        container.appendChild(tableElement("td", html));
    }
    return container;
}

function setState(data, title, url, replace = false) {
    if (replace) {
        window.history.replaceState(data, title, url);
    } else {
        window.history.pushState(data, title, url);
    }
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

function tableElement(tag, html) {
    var elem = document.createElement(tag);
    elem.innerHTML = html;
    return elem;
}

function getLastUrlElement(str) {
    var elem = "";
    var url = new URL(str);
    if (url.pathname != "/") {
        var split = url.pathname.split("/");
        elem = split[split.length - 1]
    }
    return elem;
}

function setEventListeners() {
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
            }
        }

        // Update details for details urls
        if (elements[i].href.startsWith(str_details)) {
            elements[i].onclick = function () {
                var id = getLastUrlElement(this.href);
                LoadDetails(id);
                return false;
            }
        }

        // New Page
        if (elements[i].href.startsWith(str_new)) {
            elements[i].onclick = function () {
                LoadNew();
                return false;
            }
        }
    }

    try {
        document.getElementById("new_form").onsubmit = function (event) {
            var url = document.getElementById("url").value;
            var depth = document.getElementById("depth").value;

            var data = new URLSearchParams();
            data.append("url", url);
            data.append("depth", depth);
            
            fetch("/api/v1/site/add",
                {
                    method: "POST",
                    body: data
                })
                .then(function (response) {
                    response.json().then(function (data) {
                        var e_f = document.getElementById("error_field");
                        if (response.status === 202) {
                            e_f.style.visibility = "hidden";
                            return LoadTable();
                        } else {
                            e_f.innerHTML = '<p class="uk-text-center">' + data.message + '</p>';
                            e_f.style.visibility = "visible";
                        }
                    })
                })
                .catch(function () {
                    var e_f = document.getElementById("error_field");
                    e_f.innerHTML = '<p class="uk-text-center">Failed to load, please try again.</p>';
                    e_f.style.visibility = "visible";
                    setLoading(false);
                    setEventListeners();
                });
            return false;
        };
    } catch{ }
}

window.onpopstate = function (event) {
    //If we have no event, we go to the root page
    current_domain = event === null ? "" : (event.state || "");
    if (current_domain.startsWith("-")) {
        // current_domain contains the details id
        LoadDetails(current_domain.substr(1, current_domain.length - 1), true)
    }
    else if (current_domain.startsWith("+")) {
        //The /new page
        LoadNew(true)
    }
    else {
        // current_domain contains the domain we had before
        LoadTable(current_domain || "", true);
    }
}

setEventListeners();