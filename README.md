# Collect
Collect is a server to collect & archive websites written for NodeJS.

It does not download entire sites, but rather single pages and all content needed to display them. This means that Collect stores a static copy of the website (and its assets) on your disk. It also hosts these pages so you can access them over the network.

<details><summary>Table of contents</summary>

  * [Features](#features)
  * [Screenshots](#screenshots)
  * [Installation](#installation)
      - [Settings](#settings)
      - [Plugins](#plugins)
    + [Updating](#updating)
  * [Contributing](#contributing)
  * [Security considerations](#security-considerations)
  * [Warning](#warning)
  * [Credits](#credits)
  * [License](#license)

</details>

## Features
   * General
      * Archive web pages and videos
      * View all archived pages and videos
   * Web interface
      * Simply add sites and videos via their URL
      * Browse your archive by domain
  	  * Manage/Delete downloaded content
  	  * Any change on the server side will by sent to clients in real time
   * API
      * Get all sites / list sites by domain
      * Get details of saved content
      * Add a site to the archive
  	  * Delete a site
      * Edit title of a saved page
  	  * Download all saved pages as an archive (See [Backup](API_doc.md#backup-get))
  	  * For more, see [the API documentation](API_doc.md)

### Screenshots

##### Main Page
  ![Main Page Screenshot](img/screenshot-main.png?raw=true)

##### New Page
  ![New Page Screenshot](img/screenshot-new.png?raw=true)

##### Details Page
  ![Details Page Screenshot](img/screenshot-details.png?raw=true)


### Installation
Before installing Collect, please make sure that `git`, `node` and `npm` are installed.

*Note*: This install process is tested with Node version 12, 14 and 16. The test status can be read from the "Test" badge: [![Test](https://github.com/xarantolus/Collect/actions/workflows/test-serverstart.yml/badge.svg)](https://github.com/xarantolus/Collect/actions/workflows/test-serverstart.yml). If this is green, then everything should work!

Start by cloning the repository to your computer/server:
```
git clone https://github.com/xarantolus/Collect.git
```

Switch to the `Collect` directory:
```
cd Collect/Collect
```

Install dependencies:
```
npm install
```

Start the server in `production` mode (recommended):
```
npm start production
```
or 
```
node app production
```

Expected output:

```
Preparing integrity check...
Checking cookie file...
Checking if folders for ids exist...
All folders exist.
Checking if ids for folders exist...
All entrys exist.
Finished integrity check.
Collect-Server(1.17.0-production) listening on port 80
```

Now open the website in your browser by visiting http://localhost:80 if running on the same computer or http://yourserver:80, where `yourserver` is the network name of your server. 

You will notice that you need to authenticate with a username and password. That can be set up as shown in the next section.

#### Settings
To change settings, edit `Collect/config.json`. There, you can set a `port`, `username`, `password`, `id_length`, `api_token`, `allow_public_view` and `allow_public_all`. Note that you need to restart the server to apply changes.

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

###### Allow Public View
Disable authentification for viewing sites and enable a /public/list url.

###### Allow Public All
Completly disable access control. Use at your own risk !
</p></details>
 
#### User Guide
After setting up the server, you can read the [user guide](User-Guide.md) to find out more about general usage, keyboard shortcuts and download options.

#### Optional Plugins
<details><summary>There is one plugin available for Collect. Open to get more info.</summary>

The server can use [`PhantomJS`](http://phantomjs.org/) to process websites after downloading. This ensures that dynamically loaded content is also saved.

**Note**: This is no longer recommended as [PhantomJS is not actively maintained](https://github.com/ariya/phantomjs/issues/15344). I'm not stopping you though.

To use this, install the [`node-website-scraper-phantom` module](https://github.com/website-scraper/node-website-scraper-phantom).
```
npm install website-scraper-phantom
```

This command must be run in the directory that contains the `package.json` file.

After installing, the server should output `PhantomJS will be used to process websites` when started.

If the install fails, you cannot use the module and __*Collect*__ will fall back to the normal way of saving pages.

If you cannot save any pages after installing, remove the module by running 
```
npm uninstall website-scraper-phantom
```
</details>

### Updating
If you already have Collect installed on your computer/server and want to update to the latest version, follow these steps.

Go in the directory where Collect is installed.
```
cd /path/to/Collect
```

You might want to back up your settings file.

Windows:
```
move Collect\config.json ..\
```

Linux/Unix:
```
mv Collect/config.json ../config.json
```

Download the latest version:
```
git fetch --all
```

Apply all changes (this usually overwrites your cookies file, but not the directory where your sites are saved.)
```
git reset --hard origin/master
```

Restore the settings file.

Windows:
```
move ..\config.json Collect\
```

Linux/Unix:
```
mv ../config.json Collect/config.json
```

Go to the directory that contains `package.json`.
```
cd Collect
```

Install all required packages.
```
npm install
```

After restarting your server, the new version should be up & running.

If it doesn't start, delete the `node_modules` directory and re-run `npm install`.

## Contributing
See the [contributing file](.github/CONTRIBUTING.md).

## Thanks to :heart:

* [@TeoGoddet](https://github.com/TeoGoddet) for [#41](https://github.com/xarantolus/Collect/pull/41): Add public access 

## Security considerations
 * The login system uses plain text. Anyone with access to your server (e.g. `SSH` or any malicious program) can read your credentials.
 * Any site you download can read & set cookies. A downloaded website could send your login cookie to another server. If you host this software in your private network without outside access, everything should be fine even if a cookie gets stolen, but don't take my word for it.
 * The connection does by default not use `HTTPS`.


## Warning
You're using this tool at your own risk. I am not responsible for any lost data like passwords or websites.

## Credits
   [Website Scraper Module](https://github.com/website-scraper/node-website-scraper): MIT License. This server is mostly a user interface to this module and would never have been possible without their work.
   
   [Website Scraper Module PhantomJS Plugin](https://github.com/website-scraper/node-website-scraper-phantom): MIT License. Makes processing dynamic pages as easy as pie.

   [The UIkit library](https://github.com/uikit/uikit): Copyright YOOtheme GmbH under the MIT License. I really love this UI framework.

   [ArchiverJS](https://github.com/archiverjs/node-archiver): Mit License. `node-archiver` is a nice module for generating all kind of archive files. It is used to [create backups](API_doc.md#backup-get).

   [Ionicons](https://github.com/ionic-team/ionicons): MIT License. The icons are really nice. I used the `ion-ios-cloudy-outline` icon.

   [Notification Sound](https://freesound.org/people/philitup321/sounds/204369/): CC0 1.0 Universal License

   
## License
See the [License file](LICENSE)
