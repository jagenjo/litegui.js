# LiteGUI namespace

There are several methods provided by the LiteGUI baseclass that are helpful when creating interfaces.

## Modal windows

You can create modal windows like alert, prompt or confirm to show an interface popup.
It wont block the execution like in regular JS but it can have the CSS edited.

```javascript
LiteGUI.alert("File uploaded");

LiteGUI.prompt("Enter name", function(v) {
  if(!v) //the user pressed cancel
    return; 
  //...
});

LiteGUI.confirm("Are you sure?", function(v) {
  //...
});
```

Or if you want to show a message you can use the LiteGUI.showMessage passing the HTML code.

## Events

Sometimes you want to use addEventListener or dispatchEvent in objects that do not belong to the DOM.
To solve that you can use the methods LiteGUI.bind and LiteGUI.trigger:

```javascript
var myobject = {};

function sayHigh(e){ console.log("high!") 

LiteGUI.bind( myobject, "jump", sayHigh });
//...
LiteGUI.trigger( myobject, "jump" ); //will show "high!" in the console

LiteGUI.unbind( myobject, "jump", sayHigh });

```

The bind function attaches a new property to the object called __events which is a HTMLElement, non-enumerable to handle all the bindings.

The function bind can also be used with regular DOM selectors, like ```LiteGUI.bind("#main","jump", callback );``` even if the selector returns many nodes.
Or you can pass an array of object to bind to all of them.

##  Helpers

If you want to manipulate the DOM easily without having to use the standard long syntax you can use some of the functions provided (similar to the ones in jQuery):

### DOM

- ```createElement( tag, id_class, content, style, events )```: create a HTMLElement of type tag, with id and class, content, style and binded events.
- ```remove```: removes all the elements that matches the selector

### Cursor

- ```isCursorOverElement```: this function helps to know if the mouse is over one DOM element

### Clipboard

- ```toClipboard```: stores the string in the system clipboard (using a hack, so it is not guaranteed that will work in all conditions).

### CSS
- ```addCSS```: adds some CSS code to the DOM
- ```requireCSS```: requires a new CSS file and attachs it to the DOM

### Script

- ```requireScript```: requires a script (or several) and attachs them to the DOM

### HTTP
- ```request( object )```: wrapper for XMLHttpRequest. Params are { url: String, data: Object, dataType: String, success: callback, error: callback }
- ```requestText( url, callback )```: requires a text file 
- ```requestJSON( url, callback )```: requires JSON and passes the object
- ```requestBinary( url, callback )```: requires a binary file and passes the ArrayBuffer

### Files
- ```downloadFile( filename, data, dataType )```: Forces the system to show the download dialog to download the file with that filename.
- ```downloadURL( url )```: Forces the system to show the download dialog for a file somewhere else

### URL
- ```getUrlVars```: returns an object with all the url vars

### Actions
- ```draggable( container, dragger_element, on_start, on_finish, on_is_draggable )```: makes a DOM element draggable.
- ```createDropArea( element, callback_drop, callback_enter, callback_exit )```: makes an HTMLElement ready to drop items

### Objects
- ```clone```: tries to clone the object

### HTML Entities
- ```htmlEncode```: given an HTML entity string (```&gt;```), it returns its unicode character.
- ```htmlDecode```: given a string it returns the string with all the HTML elements escaped.

