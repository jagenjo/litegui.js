# Inspector Widgets

Here is some help info to use the Inspector widgets


## addCombo

This one is used to create a combobox (dropdown menu).

```js
inspector.addCombo("mycombo", value, { values: values, callback: function(v) { ... } });
```

Where values must be the possible values and value the default selected value.

The list with all the possible values could come in three forms:

* An array containing all the options in string format
* An object where the key is the option name and the value the result value
* A function that will be executed to get an array or an object with the options.

## addList

List help have a list of items that the user can select:

```js
var widget = inspector.addList("mylist", values, { callback: function(v) { ... } });
```

Where values is an array that contain all the possible values. They could be a ```String``` or an object containing the next fields:

* content: the text to show in the widget
* selected: if the element should be shown selected
* style: if you want to apply some sort of style
* icon: the url to an icon image

Here are some useful methods you can call once the widget has been created:
* __updateItems(items)__: changes the items in the list
* __removeItem(name)__: remove one item
* __getSelected()__: returns the array containing all selected elements
* __getByIndex(index)__: returns the element given an index
* __selectIndex(index, add_to_selection)__: select an element by its index (add_to_selection will select multiple elements)
* __deselectIndex(index)__: remove the index element from the selection
* __selectAll()__: mark all as selected
* __getNumberOfItems()__: returns the number of items
* __filter(callback)__: you pass a callback which that will be called for every item as (index, item, selected) and if it returns true the item is shown, otherwise is hidden. If null is passed all are set visible.
* __selectByFilter(callback)__: you pass a callback which that will be called for every item as (index, item, selected) and if it returns true the item is selecetd, if false is unselected, if undefined then state changes.
* __scrollToIndex__: scrolls the list to a given index


## AddFile

This widget allows the user to select files from the harddrive.


```js
var widget = inspector.addFile("Select File", "", { read_file: true, callback: function(v) { ... } });
```

The callback will receive one object that contains:

* __filename__ : the filename (no folders).
* __file__ : the File object.
* __files__ : Array in case the user selected several files.
* __url__ : a local URL to the local file, if you want to read it using a HTTPRequest.
* __data__ : the content of the file __only if the read_file is set in the options__.

If you want that the object contains the data, you can pass ```read_file: true``` to receive the data in String format, if you want it in ```ArrayBuffer``` format use ```read_file: "binary"``` or if you want it in data_url format then  ```read_file:"data_url"```
