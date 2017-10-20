# LiteGUI.ContextMenu #

If you want to show a context menu when the users does an action use the LiteGUI.ContextMenu class.

To create a context menu:

```javascript
var contextmenu = new LiteGUI.ContextMenu( actions, { callback: function(v){...} );
```

The callback will be called once an action has been choosen.

Actions is an array containig a list of actions in the next form:

You can pass just strings:

```javascript
var actions = ["Copy","Paste",null,"Delete"];
```

nulls are used to create separators.

Or if you want to have more info then pass an object with the next properties:

```javascript
var actions = [{
       title: "Copy", //text to show
       disabled: true, //option will be disabled
       callback: my_copy_callback, //callback to call when the option is clicked
       submenu: {...} //object containing info of a secondary menu to show 
    },{...}]
```

The available options for the context menu are (all are optional):

- **parentMenu**: the previous ContextMenu in case you want to chain this menu with an existing one
- **title**: text to show on top
- **callback**: function to call once an option has been selected
- **ignore_item_callbacks**: if true no item callbacks will be executed
- **event**: the event of the mouse that triggered to show this menu, used to position the menu right below the mouse
- **autoopen**: if the menu should be auto opened when the mouse passed over
- **left**: pixels from left
- **top**: pixels from top

## Items

Every item in the menu could have several options:

- **title**: text to show
- **disabled**: if the user can click it
- **submenu**: the info about the submenu of this option, check the chaining chapter to know more
- **has_submenu**: to show that this option has more suboptions
- **callback**: a callback to call when this option is clicked


## Item callback

Once an item is clicked the callback will receive the next info:

```js
function option_callback( value, options, event, parent_context_menu )
{
	//...
}
```

## Chaining context menus

You can open a new context menu when an option is called, to do that:

```js
function option_callback( value, options, event, parent_context_menu )
{
	var new_menu = new LiteGUI.ContextMenu( ["option1","option2"], { event: event, parentMenu: parent_context_menu, callback: my_callback });
}
```

Or when defining the properties of the main item that opens this submenu, using the next syntax:

```js
[ "regular_option", 
  { title: "extra options", submenu: { options: ["action1","action2"] } } ];
```

## Capturing the right mouse click ##

To capture the right mouse click and show the context menu I suggest this example:

```javascript
	element.addEventListener("contextmenu", function(e) { 
		if(e.button != 2) //right button
			return false;
	  //create the context menu
	  var contextmenu = new LiteGUI.ContextMenu( actions, { callback: function(v){...}});
		e.preventDefault(); 
		return false;
	});
```
