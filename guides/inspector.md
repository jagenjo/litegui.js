# Inspector #

The Inspector is the class in charge of creating a widgets panel. It makes it very easy to pack a bunch of widgets and their behaviour.

## Usage ##

### Creating the Inspector ###

To create the inspector you must instantiate it:

```javascript
var inspector = new LiteGUI.Inspector();
```

You can pass an options object as a parameter, this way you could specify global properties of the inspector, like width, height, name_width, or widgets_per_row.

### Attach to DOM ###

Attach it to a container (could be an LiteGUI.Area, Panel or Dialog):

```javascript
area.add( inspector );
```

Or if you have a HTMLElement then use the root:

```javascript
myelement.addChild( inspector.root );
```

### Adding widgets ###

When adding widgets you can call the method inspector.add(...) where the parameters are:
- **widget**: the name of the widget, like number, textarea, slider, combo, checkbox...
- **name**: the title that appears next to the widget, if null no title will be shown.
- **value**: the value to be shown on the widget
- **options**: an object containing all the optional parameters for the widget.

Here is an example:

```javascript
inspector.add("string", "username", user.name, { name_width: 100 } );
```

or the secondary way is by calling the method of the widget directly:

```javascript
var username_widget = inspector.addSstring( "username", user.name, { name_width: 100 } );
```

When creating a widget it will return the DOM object of the base container for that widget.

You can use that object to get or set the value at any time:

```javascript
username_widget.setValue("foo");
var value = username_widget.getValue();
```

## Widgets list ##

Here is a list of all the widgets available (although there could be more if the website has created new ones):
- **title** or ```addTitle```: to add a title to the widgets
- **info** or ```addInfo```: to add HTML code
- **number** or ```addNumber```: to edit a number (adds a dragger and allows to control precision)
- **slider** or ```addSlider```: to edit a number between a range using a slider
- **string**,**text** or ```addString```: to edit a short string
- **textarea** or ```addTextarea```: to edit a long string
- **color** or ```addColor```: to select a color
- **boolean**, **checkbox** or ```addCheckbox```: to select between on or off (true false)
- **icon** or ```addIcon```: to add a clickable icon (it allows to have two images)
- **vec2**,**vector2** or ```addVector2```: to edit two numbers
- **vec3**, **vector3** or ```addVector3```: to edit three numbers
- **vec4**,**vector4** or ```addVector4```: to edit four numbers
- **enum**, **combo** or ```addCombo```: to select between multiple choices
- **button** or ```addButton```: a clickable button
- **buttons** or ```addButtons```: several clickable buttons
- **file** or ```addFile```: to choose a file from the hard drive
- **line** or ```addLine```: to edit the points of a line
- **list** or ```addList```: to select items from a list
- **tree** or ```addTree```: to select items from a tree (it creates a LiteGUI.Tree widget)
- **datatree** or ```addDataTree```: to select items from a basic object
- **pad** or ```addPad```: like a slider but with two dimensions
- **array** or ```addArray```: to select the values of an array
- **separator** or ```addSeparator```: a separator between widgets
- **null** or ```addNull```: it does not create anything (used in some special cases)
- **default** or ```addDefault```: it guesses the best widget for this data type

