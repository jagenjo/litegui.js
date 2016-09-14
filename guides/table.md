# Table #

You can create tables with data using LiteGUI.Table

First create the table:

```javascript
	var table = new LiteGUI.Table({scrollable:true});
```

Valid options are:
- height: the height of the table
- scrollable: will show the scroll bar
- columns: an array with the name of the rows
- rows: an array with the data for every row

Set the columns to display in the table:

```javascript
	table.setColumns(["Name",{ name: "Age", width: 50, field: "age" },"Address"]);
```

Every column could be a simple string or an object containing additional info like the name of the column, the width or the field to use when fetching the data.

Add all the rows:

```javascript
	table.addRow({ name:"...", age:"...", address:"..."});
	table.addRow({ name:"...", age:"...", address:"..."});
	table.addRow({ name:"...", age:"...", address:"..."});
```

Or if you want you can add them all at the same time:

```javascript
	table.setRows([{ name:"...", age:"...", address:"..."},
	              { name:"...", age:"...", address:"..."},
	              { name:"...", age:"...", address:"..."}]);
```

And if you want to update an existing row:

```javascript
	table.updateRow(3, { name:"...", age:"...", address:"..."});
```

