# Inspector Widgets

Here is some help info to use the Inspector widgets


## addCombo

This one is used to create a combobox (dropdown menu).

```
inspector.addCombo("mycombo", value, { values: values, callback: function(v) { ... } });
```

Where values must be the possible values and value the default selected value.

The list with all the possible values could come in three forms:

* An array containing all the options in string format
* An object where the key is the option name and the value the result value
* A function that will be executed to get an array or an object with the options.

## addList

List help have a list of items that the user can select:

```
var widget_list = inspector.addList("mylist", values, { callback: function(v) { ... } });
```

Where values is an array that contain all the possible values. They could be a ```String``` or an object containing the next fields:

* content: the text to show in the widget
* selected: if the element should be shown selected
* style: if you want to apply some sort of style
* icon: the url to an icon image

Here are some useful methods you can call once the widget has been created:
* updateItems: changes the items in the list
* removeItem: remove one item
* getSelected: returns the selected item
* getIndex: returns the element given an index
* selectIndex: select an element by its index
* scrollToIndex: scrolls the list to a given index





