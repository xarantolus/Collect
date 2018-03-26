# API Documentation
The API of Collect allows you to do most of the things you can do with the webinterface

## Url
The documentation assumes that you have a server running Collect.
The API can be accessed using
```
http://yourserver:port/api/v1/endpoint
```
where "endpoint" is the endpoint you want to access.

## Objects
All responses return JSON objects. There are several types of response objects.

### Site (internal `ContentDescription`)
A `site` object describes a saved page. An example object looks like this:
```json
{
  "url": "http://example.com/some/page",
  "pagepath": "example.com-4c52804bf1541a1f1ef789bf402f7112f91a066dd58c7fb1fe/html.html",
  "id": "example.com-4c52804bf1541a1f1ef789bf402f7112f91a066dd58c7fb1fe",
  "domain": "example.com",
  "saved": "2018-01-07T13:30:34.030Z",
  "title": "Example Domain",
  "size": 1416
}
```

* `url`: The original url to the saved page
* `pagepath`: The path where the index/main page is saved (starting at `Collect/public/s/`)
* `id`: An unique id for this site
* `domain`: The domain of the original url
* `saved`: The date on which the page was saved
* `title`: The title displayed in the listing
* `size`: Size of all content of this page, in bytes

---

### Error
An `Error` describes an error. An example object looks like this:
```json
{ 
    "status": 412,
    "message": "Missing parameter \"url\"" 
}
```
* `status`: The same status as in the http response
* `message`: Describes the error

Note: When the status code is in the 4xx or 5xx range, an `Error` object is returned.

---

### Processing
An `processing` object describes a started process. An example object looks like this:
```json
{ 
    "message": "Processing started",
    "target": "http://example.com/some/page"
}
```
* `message`: A message
* `target`: The url being processed/downloaded

---

## Authentication
All API requests must be authenticated either by using a cookie(webinterface) or by passing the API token.
If you do an API request, you need to pass your `api_token`(see `config.json`) as url parameter(`token`), eg
```
http://yourserver:port/api/v1/endpoint?token=my_example_token
```

Note: The token is omitted from the urls in the documentation


---

## Endpoints

### Sites (GET)
To see the sites that are saved on your Collect server, you can use the `/sites/` endpoint.

#### Url
```
http://yourserver:port/api/v1/sites/_domain_
```

###### domain(optional)
The parameter `domain` is a domain name, eg `example.com`. If don't give this parameter, all sites from all domains will be returned.

#### Result
This method returns a List of [Site](#site-internal-contentdescription) objects or an [Error](#error)


---


### Details(GET)
To get details about a saved website, you can use the `/details/` endpoint.

#### Url
```
http://yourserver:port/api/v1/details/_id_
```

###### id(required)
The parameter `id` is an id of an entry, eg `example.com-4c52804bf1541a1f1ef789bf402f7112f91a066dd58c7fb1fe`. 
If you don't give this parameter or the id doesn't exist on the server, you'll get a 404 response.

#### Result
This method returns a [Site](#site-internal-contentdescription) object or an [Error](#error)


---


### Add Site(POST)
To add a site to your saved websites, you can use the `/site/add` endpoint.

Note: This endpoint returns a status code of 202 on success.

Note: Although this is a POST endpoint, the API token must be passed in the query string.

#### Url
```
http://yourserver:port/api/v1/site/add
```

###### url(required)
The parameter `url` is the link to the site you want to save, eg `https://example.com/some/page`.

###### depth(optional)
The parameter `depth` is the number of hyperlinks to follow on the specified url. It must be a number between 0 and 5.
If omitted, `depth` is 0.

#### Result
This method returns a [Processing](#processing) object or an [Error](#error)


---


### Change Site Title(POST)
To change the displayed title of a saved site, you can use the `/site/_id_/settitle` endpoint.

Note: Although this is a POST endpoint, the API token must be passed in the query string.

#### Url
```
http://yourserver:port/api/v1/site/_id_/settitle
```

###### id(required)
The parameter `id` is the id of a saved site, eg `example.com-4c52804bf1541a1f1ef789bf402f7112f91a066dd58c7fb1fe`

###### title(required)
The parameter `title` is the new title of the site

#### Result
This method returns an [Error](#error) object.
If successful, the [Error](#error) object has a status of 200.


---


### Delete Site (POST)
To delete a saved site, you can use the `/site/_id_/delete` endpoint.

Note: Although this is a POST endpoint, the API token must be passed in the query string.

#### Url
```
http://yourserver:port/api/v1/site/_id_/delete
```

###### id(required)
The parameter `id` is the id of a saved site, eg `example.com-4c52804bf1541a1f1ef789bf402f7112f91a066dd58c7fb1fe`

#### Result
This method returns an [Error](#error) object.
If successful, the [Error](#error) object has a status of 200.



---

## Backup (GET)
To download an archive of all sites currently saved in `Collect`, visit

```
http://yourserver:port/api/v1/backup
```

The server will generate a `zip` file that can be downloaded.

Note: You can download the archive if you are logged in. If you aren't logged in, you can access it by adding your `api_token` to the url.


---

To see these API requests in action, open your browser console and enable `XHR` (Firefox) or open the "Network" tab (Chrome & Firefox).

You should see something like this (Firefox): 

![Console Screenshot (Firefox)](github/screenshot-console.png?raw=true)

If you have any questions or something doesn't work the way you expected it to, feel free to open an issue.