# LiteGUI Starter Guide #

LiteGUI allows to create powerful and customizable interfaces from Javascript without the need of using HTML.
It has a desktop application look and field so it is not meant to be used in mobile applications.

It is meant to be used in web-apps where the interface could be changed dynamically according to modules or data, and the user can have lots of widgets on the screen.

It comes with the lots of helpful components (like Inspector, Dialog, Area, ContextMenu), that could be combined to create the final interface.

To create specific widgets (like buttons, sliders, etc) you must use the Inspector class, [check the guide about Inspector](inspector.md).

## Common things between widgets ##

Every component is a class that contains the next things:

- a **root** property: this is the DOM element root for this component in the DOM Tree.
- a **add** method: this will attach the widget passed in the parameter to the content of this widget

## Areas ##

To distribute the space in the web you can create areas, and split the areas so it can be arranged dynamically.

To know more about Areas check the [LiteGUI.Area](area.md) guide.

## Inspector ##

This is the class used to arrange several widgets, like sliders, buttons, text-areas, etc.

To know more about Areas check the [LiteGUI.Inspector](inspector.md) guide.

## Panels and Dialog ##

When you want to create a panel containing a titlebar and some content you can use the panel class, or if you want to be floating you can use the Dialog class.

To know more about Dialogs check the [LiteGUI.Dialog](dialog.md) guide.


## LiteGUI base class ##

The LiteGUI class comes with several methods that could be useful when working with interfaces, like to bind and trigger events, to handle the clipboard, to import CSSs, to do HTTP Requests, to create elements, to launch alerts, confirm and prompt box dialogs.

To know more about Areas check the [LiteGUI](litegui.md) guide.

