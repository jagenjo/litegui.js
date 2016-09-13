# Area #

Areas are a way to split the layout of your site in regions so it is easy to fill the content without having to specify sizes.

Areas usually are meant to be filled by Inspectors, Canvas, widgets or some specific HTML content, 
this way your interface will be adapted depending on the resolution.

To create one first instantiate the class:

```javascript
	var mainarea = new LiteGUI.Area();
```

You can pass several options as a parameter:

```javascript
	var mainarea = new LiteGUI.Area({content_id:"workarea", height: "calc(100% - 30px)", autoresize: true, inmediateResize: true, minSplitSize: 200 });
```

Then you can split it to have two areas:

```javascript
	mainarea.split("horizontal",[null, side_panel_width], true);
```



## Options ##

Some of the properties that you can pass when creating the Area

- content_id: id for the container of the area content
- height: the height of the whole container
- autoresize: if true the container will use all the space available in the parent container
- immediateResize: when dragging the splitter it will update contents immediatly
- minSplitSize: minimum size the splitter allows for one side. 

## Sections ##

When splitting an area it creates two sections, to access them you can use:

```javascript
var section = mainarea.getSection(0);
```
