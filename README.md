# Collect
Collect is a server to collect & archive websites written for NodeJS.

It is intended for people who want to archive individual websites, eg

```
https://example.com/some/page
```

Collect stores a static copy of the url on your disk

## Features
   * General
      * Website archiving
      * Website viewing
   * Webinterface
      * Add sites to the archive
      * Browse your archive by domain
      * Edit titles of saved pages
	  * Delete sites
	  * Updates changes on the server in real time
   * API
      * Get all sites / sites by domain
      * Get details of saved content
      * Add a site to the archive
	  * Delete a site
      * Edit title of a saved page
	  * Download all saved pages as zip archive (See [Backup](API_doc.md#backup-get))
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
To change settings, edit `Collect/config.json`. There, you can set a `port`, `username`, `password`, `id_length` and `api_token`.

<details><summary>Settings documentation</summary>

###### Port
The port the server should listen on. If another program uses this port, the server will not be able to start.

###### Username
The username that should be used to log in.

###### Password
The password for this user. [Please don't use a password you use somewhere else.](#security-considerations)

###### ID length
The length of the ids the server should generate. If you save **a lot** of websites from the same domain (> ~1 million / 16<sup>length</sup>) you should change this number.

###### API token
If you like to play around with the API, you can set an API token. It is implemented so integrating apps like [Workflow](https://workflow.is) is easy.

If you don't want to use the API, it is recommended to set the token to a long random string.
</p></details>
 

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

   [Notification Sound](https://freesound.org/people/philitup321/sounds/204369/): CC0 1.0 Universal License

   
## License
See the [License file](LICENSE)
