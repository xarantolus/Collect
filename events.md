# Socket.io Events

#### Processing
Event name: `url`

Data:
{ "message": *string*, "step": *int*, "url": *string*, "result": *ContentDescription* }



#### Notification count
Event name: `notifcount`

Data: *number*



#### Deletion 
Event name: `delete`

Data: 
{ "message": *string*, "id": *string* }



#### Title Change
Event name: `titlechange`

Data: 
{ "message": *string*, "id": *string*, "newtitle": *string* }