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
- **left**: pixels from left
- **top**: pixels from top

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
