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

When creating a widget it will return the DOM object of the base container for that widget. You can use that object later to change the content.

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

## Capturing the user actions ##

When the user interactues with the widget you want to perform some actions probably. There are two ways to capture the action:

Using the callback in the options:

```javascript
inspector.addString( "Username", user.name, { callback: my_callback });

function my_callback( value, event )
{
  user.name = value;
}
```

Or using an event:

```javascript
inspector.addString( "Username", user.name ).addEventListener("wchange", my_callback );

function my_callback(event)
{
  user.name = event.detail;
}

```

## Widgets common options ##

Every widget function allows to pass an object containing parameters for the widget. All widgets support a base set of parameters, and some widget have some special parameters. Here is a list of the base parameters:

- **width**: to select the widgets total width, this is used mostly in horizontal inspectors.
- **height**: the height of the widget
- **name_width**: the width of the name part of the widget
- **callback**: the function to call when the user interacts with the widget
- **disabled**: if you want the widget to be disabled (not allow to interact)
- **pretitle**: some HTML code to put before the name of the widget (used for special icons)
- **title**: used to show info when the user do a mouse over
- **id**: to set an id to the container


## Manipulating a widget ##

Once the widget is created it will return an object that you can keep to do changes in the future. Here are some examples:

```javascript
username_widget.setValue("foo");
var value = username_widget.getValue();
```

When changing the value of a widget you can pass a secondary parameter of false if you dont want to trigger any event.

```javascript
username_widget.setValue("foo",false);
```

## Clearing ##

You can clear the inspector at any time to remove all the widgets:

```javascript
inspector.clear();
```

It wont generate any garbage so you can use it as much as you want.

## Inspecting an instance ##

In case you want to edit the content of an instance but do not want to create the widgets manually you can use the ```inspectInstance```, but keep in mind that it only works for basic types or with object that contain info about the widgets to use with every property of the instance.

```javascript
inspector.inspectInstance( my_instance );
```

To add info about the widget to use in one property of the instance there are several ways:

```javascript
//if the object is of one specyfic class create by yourself
my_instance.constructor["@property_name"] = { widget: "slider" };

//or if it is a regular object
my_instance["@property_name"] = { widget: "slider" };
```

## Adding custom widgets ##

To add new custom widgets you must follow the next steps:
1. Create the function that creates the widget ```function MyWidgetFunction()```
  1. Call the function ```options = this.processOptions(options);``` to process the options
  2. Assign the current value to the values container: ```this.values[name] = value;```
  3. Create the HTML element: ```var element = this.createWidget(name, widget_html_code, options);```
  4. Add the setValue method to the element: ```element.setValue = function(v) { ... }```
  5. Add the getValue method to the element: ```element.getValue = function() { return ... }```
  6. Attach to inspector: 	```this.append(element,options);```
  7. Process element: ```this.processElement(element, options);```
  8. Return it: ```return element;```
1. Attach it to the inspector prototype: ```LiteGUI.Inspector.prototype.addMyWidget = MyWidgetFunction;```
2. Add to widgets list: ```Inspector.widget_constructors["mytype"] = "addMyWidget";```

