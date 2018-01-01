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
setNotifications();

function UpdateTable(domain = "") {
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

            document.getElementById("title").innerText = "Collect" + (domain === "" ? "" : " - " + domain);
        });
    }).catch(function (err) {
        console.log(err);
    });
}

const fields = ["title", "saved", "domain"];
function createRow(site) {
    var container = document.createElement("tr");
    for (var i in fields) {
        container.appendChild(tableElement("td", fields[i] === "title" ? '<a href="/s/' + site["pagepath"] + '">' + site["title"] + '</a>' : site[fields[i]]));
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
    UpdateTable();
});
