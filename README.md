# trello-todo-uploader

This node script parses files for any lines containing comments in the format 

```//TODO some comment here```

or 

```//TODO (username) some comment here```

and uploads a summary of the todo, who submitted it, and where it is to a new card in a trello list

##Configuration

This plugin gets trello api configuration options from a file called ```todo.json``` which must be placed in the project's root directory

This file must contain an object with three properties as strings
* "appKey": any valid app key
*	"userToken": the valid token of a user with correct permissions to modify the given list
*	"listid": the api identifier of the trello list that you want new todos uploaded to
