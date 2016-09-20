//enclose in a scope
(function(){


function Table( options )
{
	options = options || {};

	this.root = document.createElement("table");
	this.root.classList.add("litetable");

	this.columns = [];
	this.column_fields = [];
	this.rows = [];
	this.data = [];

	this._must_update_header = true;

	if(options.colums)
		this.setColumns(options.colums);

	if(options.scrollable)
		this.root.style.overflow = "auto";

	if(options.height)
		this.root.style.height = LiteGUI.sizeToCSS( options.height );

	if(options.columns)
		this.setColumns( options.columns );

	if(options.rows)
		this.setRows( options.data );
}

Table.prototype.setRows = function( data, reuse )
{
	this.data = data;
	this.updateContent( reuse );
}

Table.prototype.addRow = function( row, skip_add )
{
	var tr = document.createElement("tr");

	//create cells
	for(var j = 0; j < this.column_fields.length; ++j)
	{
		var td = document.createElement("td");

		var value = null;

		if(row.constructor === Array )
			value = row[ j ];
		else //object
			value = row[ this.column_fields[j] ];
		if(value === undefined)
			value = "";

		td.innerHTML = value;

		var column = this.columns[j];
		if(column === undefined)
			break;

		if(column.className)
			td.className = column.className;
		if(column.width)
			td.style.width = column.width;
		tr.appendChild( td );
	}

	this.root.appendChild( tr );
	this.rows.push( tr );
	if(!skip_add)
		this.data.push( row );

	return tr;
}

Table.prototype.updateRow = function( index, row )
{
	this.data[ index ] = row;

	var tr = this.rows[index];
	if(!tr)
		return;

	var cells = tr.querySelectorAll("td");
	for(var j = 0; j < cells.length; ++j)
	{
		var column = this.columns[j];

		var value = null;

		if(row.constructor === Array )
			value = row[ j ];
		else
			value = row[ column.field ];

		if(value === undefined)
			value = "";

		cells[j].innerHTML = value;
	}
	return tr;
}

Table.prototype.updateCell = function( row, cell, data )
{
	var tr = this.rows[ row ];
	if(!tr)
		return;
	var cell = tr.childNodes[cell];
	if(!cell)
		return;
	cell.innerHTML = data;
	return cell;
}


Table.prototype.setColumns = function( columns )
{
	this.columns.length = 0;
	this.column_fields.length = 0;

	var avg_width = ((Math.floor(100 / columns.length)).toFixed(1)) + "%";

	var rest = [];

	for(var i = 0; i < columns.length; ++i)
	{
		var c = columns[i];

		if( c === null || c === undefined )
			continue;

		//allow to pass just strings or numbers instead of objects
		if( c.constructor === String || c.constructor === Number )
			c = { name: String(c) };

		var column = {
			name: c.name || "",
			width: LiteGUI.sizeToCSS(c.width || avg_width),
			field: (c.field || c.name || "").toLowerCase(),
			className: c.className
		};

		//last
		if(i == columns.length - 1)
			column.width = " calc( 100% - ( " + rest.join(" + ") + " ) )";
		else
			rest.push( column.width );

		this.columns.push( column );
		this.column_fields.push( column.field );
	}

	this._must_update_header = true;
	this.updateContent();
}

Table.prototype.updateContent = function( reuse )
{
	this.root.innerHTML = "";

	//update header
	if(this._must_update_header)
	{
		this.header = document.createElement("tr");
		for(var i = 0; i < this.columns.length; ++i)
		{
			var column = this.columns[i];
			var th = document.createElement("th");
			th.innerHTML = column.name;
			if(column.width)
				th.style.width = column.width;
			column.th = th;
			this.header.appendChild( th );
		}
		this._must_update_header = false;
	}
	this.root.appendChild( this.header );

	if(!this.data)
		return;

	if(this.data.length != this.rows.length)
		reuse = false;

	if(reuse)
	{
		for(var i = 0; i < this.rows.length; ++i)
		{
			var data_row = this.data[i];
			var tr = this.updateRow( i, data_row );
			this.root.appendChild( tr );
		}
	}
	else
	{
		this.rows.length = 0;

		//create rows
		for(var i = 0; i < this.data.length; ++i)
		{
			var row = this.data[i];
			this.addRow( row, true );
		}
	}
}



LiteGUI.Table = Table;


})();