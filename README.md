# Collect
Collect is a server to collect & archive websites written for NodeJS.

It is intended for people who want to archive individual websites, eg

```
http://example.com/some/site
```

Collect stores a static copy of the url on your disk

## Features
   * General
      * Website archiving
      * Website viewing
   * Webinterface
      * Add sites to the archive
      * Browse your archive by domain
      * Edit title of a saved page
	  * Delete sites
	  * Update current page if something changed
   * API
      * Get all sites / sites by domain
      * Get details of saved content
      * Add a site to the archive
	  * Delete a site
      * Edit title of a saved page
	  * For more, see [the API documentation](API_doc.md)


### Screenshots

##### Main Page
  ![Main Page Screenshot](github/screenshot-main.png?raw=true)

##### New Page
  ![New Page Screenshot](github/screenshot-new.png?raw=true)

##### Details Page
  ![Details Page Screenshot](github/screenshot-details.png?raw=true)


### Installation
Before installing Collect, please make sure that `git`, `node` and `npm` are installed.

*Note*: This server was tested on `NodeJS v7.7.3` and `NodeJS v6.13.1`.

Start by cloning the repository to your computer/server:
```
git clone https://github.com/xarantolus/Collect.git
```

Go in the `Collect` directory
```
cd Collect/Collect
```

Install dependencies
```
npm install
```

To start, type
```
npm start
```
or 
```
node app
```

When you open the website in your browser, you will notice that you need to authenticate.

#### Settings
To change settings, edit `Collect/config.json`. There, you can set a `port`, `username`, `password` and `api_token`.

Please don't use a password you use somewhere else. 

### Plugins
It is recommended to use [`PhantomJS`](http://phantomjs.org/) to process the websites after downloading.
This ensures that dynamically loaded content is also saved.


To use this, install the [`node-website-scraper-phantom` module](https://github.com/website-scraper/node-website-scraper-phantom).
```
npm install website-scraper-phantom
```

After installing, the server should output `PhantomJS will be used to process websites` when started.

If the install fails, you cannot use the module and __*Collect*__ will fall back to the normal way of saving pages.

If you cannot save any pages after installing, remove the module by running 
```
npm uninstall website-scraper-phantom
```

## Security considerations
   * The login system uses plain text

## Warning
You're using this tool at your own risk. I am not responsible for any lost data like passwords or websites.

## Credits
   [Website Scraper Module](https://github.com/website-scraper/node-website-scraper): MIT license. I really want to thank the creators. This server is mostly a user interface to this module and would never have been possible without their work.
   
   [Website Scraper Module PhantomJS Plugin](https://github.com/website-scraper/node-website-scraper-phantom): MIT license. Makes processing dynamic pages as easy as pie.

   [The UIkit library](https://github.com/uikit/uikit): Copyright YOOtheme GmbH under the MIT license. I really love this UI framework.

   [Ionicons](https://github.com/ionic-team/ionicons): MIT license. The icons are really nice. I used the `ion-ios-cloudy-outline` icon.

## License
See the [License file](LICENSE)
