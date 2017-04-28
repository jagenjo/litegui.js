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


