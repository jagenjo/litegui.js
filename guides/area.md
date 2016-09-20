# LiteGUI.Area #

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

## Options ##

Some of the properties that you can pass when creating the Area

- content_id: id for the container of the area content
- height: the height of the whole container
- autoresize: if true the container will use all the space available in the parent container
- immediateResize: when dragging the splitter it will update contents immediatly
- minSplitSize: minimum size the splitter allows for one side. 

## Split ##

When you want to divide an area in two sections you can split it:

```javascript
	mainarea.split("horizontal",[null, side_panel_width], true);
```

The parameters are:
- Aligment: Could be "horizontal" or "vertical", horizontal means that the areas will be side by side in the horizontal axis (so the split line will be vertical).
- Distribution: The array passed as a second parameter contains the size of every section, it could be a number or a string containing a size. Null means that this area should fill the remaining space. 
- Editable: tells if you want to allow the user to change the split position using the mouse.


## Sections ##

When splitting an area it creates two new areas (called sections), to access them you can use:

```javascript
var section = mainarea.getSection(0);
```

This section can be split again to create more complex layouts.

## Documentation ##

For a more indepth description of the actions check the documentation.

