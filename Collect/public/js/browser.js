//Socket.io events
var socket = io();
var notification_count = 0;
function setNotifications() {
    var c_e = document.getElementById("notif_count");
    c_e.innerHTML = notification_count;
    c_e.style.backgroundColor = notification_count === 0 ? "green" : "orange";

}
setNotifications();

var current_domain = domain(document.location);
function UpdateTable(domain = "") {
    current_domain = domain;
    var date_start = Date.now();
    var spinner = document.getElementById("notif_spinner");
    spinner.style.visibility = "visible";
    fetch('/api/v1/sites/' + domain, {
        method: 'get'
    }).then(function (response) {
        response.json().then(function (sites) {
            var content = document.getElementById("content");
            if (sites.length > 0) {
                // Create table
                var table = document.createElement("table");
                table.className = "uk-table uk-table-striped uk-table-hover uk-table-responsive";

                // Create thead
                var thead = document.createElement("thead");
                var tr = document.createElement("tr");
                tr.appendChild(tableElement("th", "Titel"));
                tr.appendChild(tableElement("th", "Datum"));
                tr.appendChild(tableElement("th", "Domain"));

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
                content.innerHTML = '<div class="uk-placeholder uk-text-center">Es sind zurzeit keine Seiten archiviert</div>';
            }

            // Have the spinner displayed at least one second
            setTimeout(function () {
                spinner.style.visibility = "hidden";
            }, Math.max(1000, Date.now() - date_start))

            var title = "Collect" + (domain === "" ? "" : " - " + domain);
            document.title = title;
            document.getElementById("title").innerText = title;
            window.history.pushState(domain, title, (domain === "" ? "/" : "/site/" + domain));

            //Re-enable event listeners            
            setEventListeners();
        });
    }).catch(function (err) {
        console.log(err);
    });
}

const fields = ["title", "saved", "domain"];
function createRow(site) {
    var container = document.createElement("tr");
    for (var i in fields) {
        var html = "";
        if (fields[i] === "title") {
            html = '<a href="/s/' + site["pagepath"] + '">' + site["title"] + '</a>';
        }
        else if (fields[i] === "domain") {
            html = '<a href="/site/' + site["domain"] + '">' + site["domain"] + '</a>';
        }
        else {
            html = site[fields[i]];
        }
        container.appendChild(tableElement("td", html));
    }
    return container;
}

function tableElement(tag, html) {
    var elem = document.createElement(tag);
    elem.innerHTML = html;
    return elem;
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
    UpdateTable(current_domain);
});

function domain(str) {
    var domain = "";
    var url = new URL(str);
    if (url.pathname != "/") {
        var split = url.pathname.split("/");
        domain = split[split.length - 1]
    }
    return domain;
}

function setEventListeners() {
    var str_start = location.protocol + '//' + location.host + '/site/';
    var elements = document.getElementsByTagName('a');
    for (var i = 0; i < elements.length; i++) {
        if (elements[i].href.startsWith(str_start) || elements[i].href === location.protocol + '//' + location.host + '/') {
            elements[i].onclick = function () {
                var domain = domain(this.href);
                UpdateTable(domain);
                return false;
            }
        }
    }
}
setEventListeners();

window.onpopstate = function (event) {
    // event.state contains the domain we had before
    UpdateTable(event.state || "");
}