# Collect
Collect is a server to collect & archive websites written in NodeJS.

It is intended for people who want to archive individual websites, eg

```
https://github.com/some/repo
```

Collect stores a static copy of the url on your disk

## Features
   * General
      * Website archiving
      * Website viewing
   * Webinterface
      * Add sites
      * Browse your archive by domain
      * Add sites to the archive
      * Edit title of a saved page
   * API (incomplete)
      * Get all sites / sites by domain
      * Get details of saved content
      * Add a site to the archive

### Installation
Before installing Collect, please make sure that `git`, `node` and `npm` are installed.

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
Since the module for authentication isn't completed yet, you need to set your password in `tools/auth.ts (line 6)` or `tools/auth.js (line 5)` (depending on whether you compile the TypeScript file or not).

Please don't use a password you use somewhere else. The login system is insecure(no hashing, password is in plain text), but works for a simple self-hosted webinterface.

## Security considerations
   * The login system uses plain text
   * The API can be accessed without any kind of authorization

## Warning
You're using this tool at your own risk. I am not responsible for any lost data like passwords or websites.