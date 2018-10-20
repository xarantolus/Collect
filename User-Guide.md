# Collect User Guide

Read this after you set up the server as described in the [README](README.md#installation).

# Login

Start by opening your browser and navigating to the url of your server. 
It is usually the machine name the server is running on and the port set in the config file, e.g. `http://machinename:100`.

You should now see the login page:
  ![Login Page Screenshot](img/screenshot-login.png?raw=true)

Put in the username & password you set in the config and press enter.

Note: Modern browsers will tell you that the connection is insecure, and they are correct. 
Anyone (e.g. your router) in your network might be able to see the traffic between this server and your browser using a [Man-in-the-middle attack](https://en.wikipedia.org/wiki/Man-in-the-middle_attack).

After logging in, you can see an empty page:
  ![Empty Front Page Screenshot](img/screenshot-empty-front.png?raw=true)


# Add a page

Click the link on the empty page or use the one in the upper right corner to navigate to the page where you can add sites.
  ![Add Page Screenshot](img/screenshot-new.png?raw=true)
    
<details><summary>Click here to see an explanation of all options.</summary>

###### Url
The url the server should download & save. It can be any url the server can access from its network. Make sure to prefix the url with `http://`, `https://` or other protocols.

###### Depth
The depth defines how many hyperlinks to follow on the original page given by the url. 
If you only need the linked page without any additional pages, you can leave it blank.

Warning: This is a recursive operation. It can lead to large ram usage depending on the size of the pages that are linked.

###### Following Behaviour
If the depth is more than zero, the server will follow links and download their pages. 
The following behaviour defines how the server will follow links, e.g. by only following links to the same domain or to all domains.

###### Title
The title that should be displayed once the page is downloaded. If the title is not set, the server will try to extract a title from the downloaded content.

###### Cookies
The cookies to send with the request. If you want to download pages that you need to log in to, add the cookie string here.

How to obtain cookies?

Go to the page you want to download, open the browser console (most browsers can do this with `F12` or using the right-click context menu) and type `document.cookie`.
Copy the output you get without quotes and paste it to the cookie option input.

###### User Agent
The user agent is your browsers' identifier that gets sent to the server. By default, _Collect_ doesn't send a user-agent with its requests. 
Since some sites block users with no user agent, you can specify it here. You can use DuckDuckGo to find [your user agent](https://duckduckgo.com/?q=user+agent&ia=answer).

### Video downloads
You can write "video:" (or click the blue link below the buttons) before the url to download only the video on the page. 
This will start [youtube-dl](https://github.com/rg3/youtube-dl) to get the relevant video.

Note/Warning: If you use video downloads, all options except for url and title will be ignored. 
It is currently not possible to download videos with different user-agents or cookies. If you want this, open an issue.

</p></details>

# Details

The details page shows all details the server knows about the saved page. The url, path and domain fields provide links to other pages.
  ![Details Page Screenshot](img/screenshot-details.png?raw=true)

The title can be changed by typing in a new title pressing enter or by clicking the submit button. 
After loading, the page should display a bar that shows if changing the title was successful.

You can also delete the page by clicking the delete button. This will delete the page __without asking__ and redirect you to the main page.

# Shortcuts
You can click the title of the page in the upper middle to scroll up/down depending on your current scroll height.

## Keyboard
All pages, except for the ones you download, offer keyboard shortcuts.

#### General
 - `ESC` to return to the main page
 - N to go to the 'new' page to add an url
 - Space to scroll up/down depending on the current scroll height
#### Specific
 - Shift + V (while focusing the url input) to fill in the 'video:' text in the url field when adding an entry on the 'new' page

# Notifications

When an url is added, there will be a notification in the bottom-right corner. 
There will also be notifications when the download finishes, the url was already saved or when the download fails.

If a download was successful, a notification sound will be played. If you keep the tab open, you will hear when the download is finished.

If JavaScript is disabled in your browser, notifications will not be available.

# JavaScript

If JavaScript is enabled, you can use the following features:
 - Better navigation: The page will use the servers' API to access information. This is usually faster since the server doesn't have to generate a full page.
 - Better form submissions: Stay on the page when requests get sent (e.g. when adding an url or updating a title).
 - Notifications & live updates: Pages will update if their content changes. This happens if a page gets added, deleted or you change a title.


All other features(the core features) should work without JavaScript.

If you have any requests, suggestions or questions feel free to open an issue.