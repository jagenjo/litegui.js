# LiteGUI.Dialog

Dialogs are floating windows that can be dragged around or closed.

Technically the behave like a ```LiteGUI.Panel``` but with a frame that makes it a floating window.

Here is an example of how to create a Dialog:

```js
  //create the dialog
	var dialog = new LiteGUI.Dialog({title:"Editor", close: true, width: 300, height: 120, scroll: false, draggable: true});
  
  //add some widgets
	var widgets = new LiteGUI.Inspector();
	dialog.add(widgets);
  
  //fill the widgets
	widgets.addButton("My button","Click", function(){ console.log("clicked"); });
  
  //show and ensure the content fits
	dialog.show();
	dialog.adjustSize();
```

