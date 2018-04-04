# Socket.io Events

## General
If you want to connect to the `Socket.IO` server, you need to authenticate with your `api_token` or a session id.
You need to set the `api_token` in the `query` object when you are connecting to the server.

---

## Events
These events can be listened for:

#### Processing
Event name: `url`

Data:
```json
{ 
  "message": *string*,
  "step": *int*,
  "url": *string*,
  "result": *ContentDescription*
}
```

###### message
A message that describes the object.

###### step
A number that describes the current progress.
- `0`: Started downloading the url.
- `1`: The url was already downloaded before and will not be downloaded again.
- `2`: The download finished successfully. This event also includes the result.
- `4`: There was an error while downloading the url.

###### url
The target url.

######  result
The result will be `null` for all steps except `2`. If it is not `null`, it is of the type [`ContentDescription`](API_doc.md#site-internal-contentdescription)

---

#### Notification count
Event name: `notifcount`

Data: 
```json
*number*
```

###### data
Integer that indicates the current notification count.

---

#### Deletion 
Event name: `delete`

Data: 
```json
{
  "message": *string*,
  "id": *string* 
}
```
###### message
A message that describes the object.

###### id
The id of the deleted item.

---

#### Title Change
Event name: `titlechange`

Data: 
```json
{ 
  "message": *string*, 
  "id": *string*, 
  "newtitle": *string*
}
```

###### message
A message that describes the object.

###### id
The id of the page whose title has been changed.

###### newtitle
The new title.