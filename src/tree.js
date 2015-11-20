//enclose in a scope
(function(){


/**
* To create interactive trees (useful for folders or hierarchies).
* Options are:
*	+ allow_multiselection: allow to select multiple elements using the shift key
*	+ allow_rename: double click to rename items in the tree
*	+ allow_drag: drag elements around
*	+ height
* Item data should be in the next format:
* {
*    id: unique_identifier,
*    content: what to show in the HTML (if omited id will be shown)
*	 children: []  array with another object with the same structure
*	 className: class
*    precontent: HTML inserted before the content
*	 visible: boolean, to hide it
*	 dataset: dataset for the element
*	 onDragData: callback in case the user drags this item somewhere else
* }
*
* @class Tree
* @constructor
*/

	/*********** LiteTree *****************************/
	function Tree( id, data, options )
	{
		var root = document.createElement("div");
		this.root = root;
		if(id)
			root.id = id;

		root.className = "litetree";
		this.tree = data;
		var that = this;
		options = options || {allow_rename: false, allow_drag: true, allow_multiselection: false};
		this.options = options;

		if(options.height)
			this.root.style.height = typeof(options.height) == "string" ? options.height : Math.round(options.height) + "px";

		//bg click
		root.addEventListener("click", function(e){
			if(e.srcElement != that.root)
				return;

			if(that.onBackgroundClicked)
				that.onBackgroundClicked(e,that);
		});

		//bg click right mouse
		root.addEventListener("contextmenu", function(e) { 
			if(e.button != 2) //right button
				return false;

			if(that.onContextMenu) 
				that.onContextMenu(e);
			e.preventDefault(); 
			return false;
		});


		var root_item = this.createAndInsert(data, options, null);
		root_item.className += " root_item";
		//this.root.appendChild(root_item);
		this.root_item = root_item;
	}

	Tree.INDENT = 20;


	/**
	* update tree with new data (old data will be thrown away)
	* @method updateTree
	* @param {object} data
	*/
	Tree.prototype.updateTree = function(data)
	{
		this.root.innerHTML = "";
		var root_item = this.createAndInsert( data, this.options, null);
		root_item.className += " root_item";
		//this.root.appendChild(root_item);
		this.root_item = root_item;
	}

	/**
	* update tree with new data (old data will be thrown away)
	* @method insertItem
	* @param {object} data
	* @param {string} parent_id
	* @param {number} position index in case you want to add it before the last position
	* @param {object} options
	* @return {DIVElement}
	*/
	Tree.prototype.insertItem = function(data, parent_id, position, options)
	{
		options = options || {};
		if(!parent_id)
		{
			var root = this.root.childNodes[0];
			if(root)
				parent_id = root.dataset["item_id"];
		}

		var element = this.createAndInsert( data, options, parent_id, position );

		if(parent_id)
			this._updateListBox( this._findElement(parent_id) );


		return element;
	}

	Tree.prototype.createAndInsert = function(data, options, parent_id, element_index )
	{
		//find parent
		var parent_element_index = -1;
		if(parent_id)
			parent_element_index = this._findElementIndex( parent_id );
		else if(parent_id === undefined)
			parent_element_index = 0; //root

		var parent = null;
		var child_level = 0;

		//find level
		if(parent_element_index != -1)
		{
			parent = this.root.childNodes[ parent_element_index ];
			child_level = parseInt( parent.dataset["level"] ) + 1;
		}

		//create
		var element = this.createTreeItem( data, options, child_level );
		element.parent_id = parent_id;

		//insert
		if(parent_element_index == -1)
			this.root.appendChild( element );
		else
			this._insertInside( element, parent_element_index, element_index );

		//children
		if(data.children)
		{
			for(var i = 0; i < data.children.length; ++i)
			{
				this.createAndInsert( data.children[i], options, data.id );
			}
		}

		this._updateListBox( element );

		if(options && options.selected)
			this.markAsSelected( element, true );

		return element;
	}

	//element to add, position of the parent node, position inside children, the depth level
	Tree.prototype._insertInside = function(element, parent_index, offset_index, level )
	{
		var parent = this.root.childNodes[ parent_index ];
		if(!parent)
			throw("No parent node found, index: " + parent_index +", nodes: " + this.root.childNodes.length );

		var parent_level = parseInt( parent.dataset["level"] );
		var child_level = level !== undefined ? level : parent_level + 1;

		var indent = element.querySelector(".indentblock");
		if(indent)
			indent.style.paddingLeft = (child_level * Tree.INDENT ) + "px"; //inner padding
		
		element.dataset["level"] = child_level;

		//under level nodes
		for( var j = parent_index+1; j < this.root.childNodes.length; ++j )
		{
			var new_childNode = this.root.childNodes[j];
			if( !new_childNode.classList || !new_childNode.classList.contains("ltreeitem") )
				continue;
			var current_level = parseInt( new_childNode.dataset["level"] );

			if( current_level == child_level && offset_index)
			{
				offset_index--;
				continue;
			}

			//last position
			if( current_level < child_level || (offset_index === 0 && current_level === child_level) )
			{
				this.root.insertBefore( element, new_childNode );
				return;
			}
		}

		//ended
		this.root.appendChild( element );
	}

	Tree.prototype._findElement = function( id )
	{
		for(var i = 0; i < this.root.childNodes.length; ++i)
		{
			var childNode = this.root.childNodes[i];
			if( !childNode.classList || !childNode.classList.contains("ltreeitem") )
				continue;
			if( childNode.classList.contains("ltreeitem-" + id) )
				return childNode;
		}

		return null;
	}

	Tree.prototype._findElementIndex = function( id )
	{
		for(var i = 0; i < this.root.childNodes.length; ++i)
		{
			var childNode = this.root.childNodes[i];
			if( !childNode.classList || !childNode.classList.contains("ltreeitem") )
				continue;

			if(typeof(id) === "string")
			{
				if(childNode.dataset["item_id"] === id)
					return i;
			}
			else if( childNode === id )
				return i;
		}

		return -1;
	}

	Tree.prototype._findElementLastChildIndex = function( start_index )
	{
		var level = parseInt( this.root.childNodes[ start_index ].dataset["level"] );

		for(var i = start_index+1; i < this.root.childNodes.length; ++i)
		{
			var childNode = this.root.childNodes[i];
			if( !childNode.classList || !childNode.classList.contains("ltreeitem") )
				continue;

			var current_level = parseInt( childNode.dataset["level"] );
			if( current_level == level )
				return i;
		}

		return -1;
	}

	//returns child elements (you can control levels)
	Tree.prototype._findChildElements = function( id, only_direct )
	{
		var parent_index = this._findElementIndex( id );
		if(parent_index == -1)
			return;

		var parent = this.root.childNodes[ parent_index ];
		var parent_level = parseInt( parent.dataset["level"] );

		var result = [];

		for(var i = parent_index + 1; i < this.root.childNodes.length; ++i)
		{
			var childNode = this.root.childNodes[i];
			if( !childNode.classList || !childNode.classList.contains("ltreeitem") )
				continue;

			var current_level = parseInt( childNode.dataset["level"] );
			if(only_direct && current_level > (parent_level + 1) )
				continue;
			if(current_level <= parent_level)
				return result;

			result.push( childNode );
		}

		return result;
	}
	
	Tree.prototype.createTreeItem = function(data, options, level)
	{
		options = options || this.options;

		var root = document.createElement("li");
		root.className = "ltreeitem";
		var that = this;

		//ids are not used because they could collide, classes instead
		if(data.id)
		{
			var safe_id = data.id.replace(/\s/g,"_");
			root.className += " ltreeitem-" + safe_id;
			root.dataset["item_id"] = data.id;
		}

		data.DOM = root; //double link
		root.data = data;

		if(level !== undefined)
			root.dataset["level"] = level;

		var title_element = document.createElement("div");
		title_element.className = "ltreeitemtitle";
		if(data.className)
			title_element.className += " " + data.className;

		title_element.innerHTML = "<span class='precontent'></span><span class='indentblock'></span><span class='collapsebox'></span><span class='incontent'></span><span class='postcontent'></span>";


		var content = data.content || data.id || "";
		title_element.querySelector(".incontent").innerHTML = content;

		if(data.precontent)
			title_element.querySelector(".precontent").innerHTML = data.precontent;

		if(data.dataset)
			for(var i in data.dataset)
				root.dataset[i] = data.dataset[i];

		root.appendChild(title_element);
		root.title_element = title_element;

		if(data.visible === false)
			root.style.display = "none";

		//var row = root.querySelector(".ltreeitemtitle .incontent");
		var row = root;
		row.addEventListener("click", onNodeSelected );
		row.addEventListener("dblclick",onNodeDblClicked );
		row.addEventListener("contextmenu", function(e) { 
			var item = this;
			e.preventDefault(); 
			e.stopPropagation();

			if(e.button != 2) //right button
				return;

			if(that.onItemContextMenu)
				return that.onItemContextMenu(e, { item: item, data: item.data} );

			return false;
		});

		function onNodeSelected(e)
		{
			e.preventDefault();
			e.stopPropagation();

			//var title = this.parentNode;
			//var item = title.parentNode;
			var node = this;
			var title = node.title_element;

			if(title._editing) 
				return;

			if(e.shiftKey && that.options.allow_multiselection)
			{
				//check if selected
				if( that.isNodeSelected( node ) )
				{
					node.title_element.classList.remove("selected");
					LiteGUI.trigger(that.root, "item_remove_from_selection", { item: node, data: node.data} );
					return;
				}

				//mark as selected
				that.markAsSelected( node, true );

				LiteGUI.trigger(that.root, "item_add_to_selection", { item: node, data: node.data} );
				var r = false;
				if(data.callback) 
					r = data.callback.call(that,node);

				if(!r && that.onItemAddToSelection)
					that.onItemAddToSelection(node.data, node);
			}
			else
			{
				//mark as selected
				that.markAsSelected( node );

				that._skip_scroll = true; //avoid scrolling while user clicks something
				LiteGUI.trigger(that.root, "item_selected", { item: node, data: node.data} );
				var r = false;
				if(data.callback) 
					r = data.callback.call(that,node);

				if(!r && that.onItemSelected)
					that.onItemSelected(node.data, node);
				that._skip_scroll = false;
			}
		}

		function onNodeDblClicked(e)
		{
			var node = this; //this.parentNode;
			var title = node.title_element.querySelector(".incontent");

			LiteGUI.trigger( that.root, "item_dblclicked", node );

			if(!title._editing && that.options.allow_rename)
			{
				title._editing = true;
				title._old_name = title.innerHTML;
				var that2 = title;
				title.innerHTML = "<input type='text' value='" + title.innerHTML + "' />";
				var input = title.querySelector("input");

				//loose focus when renaming
				$(input).blur(function(e) { 
					var new_name = e.target.value;
					setTimeout(function() { that2.innerHTML = new_name; },1); //bug fix, if I destroy input inside the event, it produce a NotFoundError
					//item.node_name = new_name;
					delete that2._editing;
					LiteGUI.trigger( that.root, "item_renamed", { old_name: that2._old_name, new_name: new_name, item: node, data: node.data } );
					delete that2._old_name;
				});

				//finishes renaming
				input.addEventListener("keydown", function(e) {
					if(e.keyCode != 13)
						return;
					$(this).blur();
				});

				//set on focus
				$(input).focus();

				e.preventDefault();
			}
			
			e.preventDefault();
			e.stopPropagation();
		}

		//dragging tree
		if(this.options.allow_drag)
		{
			var draggable_element = title_element;
			draggable_element.draggable = true;

			//starts dragging this element
			draggable_element.addEventListener("dragstart", function(ev) {
				//this.removeEventListener("dragover", on_drag_over ); //avoid being drag on top of himself
				//ev.dataTransfer.setData("node-id", this.parentNode.id);
				ev.dataTransfer.setData("item_id", this.parentNode.dataset["item_id"]);
				if(!data.onDragData)
					return;

				var drag_data =	data.onDragData();
				if(drag_data)
				{
					for(var i in drag_data)
						ev.dataTransfer.setData(i,drag_data[i]);
				}
			});

			//something being dragged entered
			draggable_element.addEventListener("dragenter", function (ev)
			{
				ev.preventDefault();
				if(data.skipdrag)
					return false;

				title_element.classList.add("dragover");
			});

			draggable_element.addEventListener("dragleave", function (ev)
			{
				ev.preventDefault();
				//console.log(data.id);
				title_element.classList.remove("dragover");
				//if(ev.srcElement == this) return;
			});

			//test if allows to drag stuff on top?
			draggable_element.addEventListener("dragover", on_drag_over );
			function on_drag_over(ev)
			{
				ev.preventDefault();
			}

			draggable_element.addEventListener("drop", function (ev)
			{
				title_element.classList.remove("dragover");
				ev.preventDefault();
				if(data.skipdrag)
					return false;

				var item_id = ev.dataTransfer.getData("item_id");

				//var data = ev.dataTransfer.getData("Text");
				if(!item_id)
				{
					LiteGUI.trigger( that.root, "drop_on_item", { item: this, event: ev });
					return;
				}

				//try
				{
					var parent_id = this.parentNode.dataset["item_id"];

					if( !that.onMoveItem || (that.onMoveItem && that.onMoveItem( that.getItem( item_id ), that.getItem( parent_id ) ) != false))
					{
						if( that.moveItem( item_id, parent_id ) )
							LiteGUI.trigger( that.root, "item_moved", { item: that.getItem( item_id ), parent_item: that.getItem( parent_id ) } );
					}
				}
				/*
				catch (err)
				{
					console.error("Error: " + err );
				}
				*/
			});
		} //allow drag

		return root;
	}

	Tree.prototype.filterByName = function(name)
	{
		for(var i = 0; i < this.root.childNodes.length; ++i)
		{
			var childNode = this.root.childNodes[i]; //ltreeitem
			if( !childNode.classList || !childNode.classList.contains("ltreeitem") )
				continue;

			var content = childNode.querySelector(".incontent");
			if(!content)
				continue;

			var str = content.innerHTML.toLowerCase();

			if(!name || str.indexOf( name.toLowerCase() ) != -1)
			{
				if( childNode.data && childNode.data.visible !== false )
					childNode.style.display = null;
				var indent = childNode.querySelector(".indentblock");
				if(indent)
				{
					if(name)
						indent.style.paddingLeft = 0;
					else
						indent.style.paddingLeft = paddingLeft = (parseInt(childNode.dataset["level"]) * Tree.INDENT) + "px";
				}
			}
			else
			{
				childNode.style.display = "none";
			}
		}

		/*
		var all = this.root.querySelectorAll(".ltreeitemtitle .incontent");
		for(var i = 0; i < all.length; i++)
		{
			var element = all[i];
			if(!element)
				continue;

			var str = element.innerHTML;
			var parent = element.parentNode;

			if(!name || str.indexOf(name) != -1)
			{
				parent.style.display = null;
				parent.parentNode.style.paddingLeft = (parseInt(parent.parentNode.dataset["level"]) * Tree.INDENT) + "px";
			}
			else
			{
				parent.style.display = "none";
				parent.parentNode.style.paddingLeft = 0;
			}
		}
		*/
	}	

	/**
	* get the item with that id, returns the HTML element
	* @method getItem
	* @param {string} id
	* @return {Object}
	*/
	Tree.prototype.getItem = function( id )
	{
		if(!id)
			return null;

		if( id.classList )
			return id;

		for(var i = 0; i < this.root.childNodes.length; ++i)
		{
			var childNode = this.root.childNodes[i];
			if( !childNode.classList || !childNode.classList.contains("ltreeitem") )
				continue;

			if(childNode.dataset["item_id"] === id)
				return childNode;
		}

		return null;

		/*
		var safe_id = id.replace(/\s/g,"_");
		var node = this.root.querySelector(".ltreeitem-"+safe_id);
		if(!node) 
			return null;
		if( !node.classList.contains("ltreeitem") )
			throw("this node is not a tree item");
		return node;
		*/
	}

	/**
	* in case an item is collapsed, it expands it to show children
	* @method expandItem
	* @param {string} id
	*/
	Tree.prototype.expandItem = function(id)
	{
		var item = this.getItem(id);
		if(!item)
			return;

		if(!item.listbox)
			return;

		listbox.setValue(true);
	}

	/**
	* in case an item is expanded, it collapses it to hide children
	* @method collapseItem
	* @param {string} id
	*/
	Tree.prototype.collapseItem = function(id)
	{
		var item = this.getItem(id);
		if(!item)
			return;

		if(!item.listbox)
			return;

		listbox.setValue(false);
	}


	/**
	* Tells you if the item its out of the view due to the scrolling
	* @method isInsideArea
	* @param {string} id
	*/
	Tree.prototype.isInsideArea = function( id )
	{
		var item = id.constructor === String ? this.getItem(id) : id;
		if(!item)
			return false;

		var rects = this.root.getClientRects();
		if(!rects.length)
			return false;
		var r = rects[0];
		var h = r.height;
		var y = item.offsetTop;

		if( this.root.scrollTop < y && y < (this.root.scrollTop + h) )
			return true;
		return false;
	}

	/**
	* Scrolls to center this item
	* @method scrollToItem
	* @param {string} id
	*/
	Tree.prototype.scrollToItem = function(id)
	{
		var item = id.constructor === String ? this.getItem(id) : id;
		if(!item)
			return;

		var rects = this.root.getClientRects();
		if(!rects.length)
			return false;
		var r = rects[0];
		var h = r.height;
		var x = parseInt( item.dataset["level"] ) * Tree.INDENT + 50;

		this.root.scrollTop = item.offsetTop - (h * 0.5)|0;
		if( r.width * 0.75 < x )
			this.root.scrollLeft = x;
		else
			this.root.scrollLeft = 0;
	}

	/**
	* mark item as selected
	* @method setSelectedItem
	* @param {string} id
	*/
	Tree.prototype.setSelectedItem = function( id, scroll )
	{
		if(!id)
		{
			//clear selection
			this.unmarkAllAsSelected();
			return;
		}

		var node = this.getItem(id);
		if(!node) //not found
			return null;

		//already selected
		if( node.classList.contains("selected") ) 
			return;

		this.markAsSelected(node);
		if( scroll && !this._skip_scroll )
			this.scrollToItem(node);

		return node;
	}

	/**
	* adds item to selection (multiple selection)
	* @method addItemToSelection
	* @param {string} id
	*/
	Tree.prototype.addItemToSelection = function( id )
	{
		if(!id)
			return;

		var node = this.getItem(id);
		if(!node) //not found
			return null;

		this.markAsSelected(node, true);
		return node;
	}

	/**
	* remove item from selection (multiple selection)
	* @method removeItemFromSelection
	* @param {string} id
	*/
	Tree.prototype.removeItemFromSelection = function( id )
	{
		if(!id)
			return;
		var node = this.getItem(id);
		if(!node) //not found
			return null;
		node.title_element.classList.remove("selected");
	}

	/**
	* returns the first selected item (its HTML element)
	* @method getSelectedItem
	* @return {HTML}
	*/
	Tree.prototype.getSelectedItem = function()
	{
		return this.root.querySelector(".ltreeitemtitle.selected");
	}

	/**
	* returns an array with the selected items (its HTML elements)
	* @method getSelectedItems
	* @return {HTML}
	*/
	Tree.prototype.getSelectedItems = function()
	{
		return this.root.querySelectorAll(".ltreeitemtitle.selected");
	}

	/**
	* returns if an item is selected
	* @method isItemSelected
	* @param {string} id
	* @return {bool}
	*/
	Tree.prototype.isItemSelected = function(id)
	{
		var node = this.getItem( id );
		if(!node)
			return false;
		return this.isNodeSelected(node);
	}

	/**
	* returns the children of an item
	* @method getChildren
	* @param {string} id
	* @param {bool} [only_direct=false] to get only direct children
	* @return {Array}
	*/
	Tree.prototype.getChildren = function(id, only_direct )
	{
		return this._findChildElements( id, only_direct );
	}

	/**
	* returns the parent of a item
	* @method getParent
	* @param {string} id
	* @return {HTML}
	*/
	Tree.prototype.getParent = function(id_or_node)
	{
		var element = this.getItem( id_or_node );
		if(element)
			return this.getItem( element.parent_id );
		return null;
	}

	/**
	* move item with id to be child of parent_id
	* @method moveItem
	* @param {string} id
	* @param {string} parent_id
	* @return {bool}
	*/
	Tree.prototype.moveItem = function(id, parent_id )
	{
		if(id === parent_id)
			return;

		var node = this.getItem( id );
		var parent = this.getItem( parent_id );
		var parent_index = this._findElementIndex( parent );
		var parent_level = parseInt( parent.dataset["level"] );
		var old_parent = this.getParent( node );
		var old_parent_level = parseInt( old_parent.dataset["level"] );
		var level_offset = parent_level - old_parent_level;

		if(!parent || !node)
			return false;

		if(parent == old_parent)
			return;

		//replace parent info
		node.parent_id = parent_id;

		//get all children and subchildren
		var children = this.getChildren( node );
		children.unshift(node); //add the node at the beginning

		//remove all children
		for(var i = 0; i < children.length; i++)
			children[i].parentNode.removeChild( children[i] );

		//update levels
		for(var i = 0; i < children.length; i++)
		{
			var child = children[i];
			var new_level = parseInt(child.dataset["level"]) + level_offset;
			child.dataset["level"] = new_level;
		}

		//reinsert
		parent_index = this._findElementIndex( parent ); //update parent index
		var last_index = this._findElementLastChildIndex( parent_index );
		if(last_index == -1)
			last_index = 0;
		for(var i = 0; i < children.length; i++)
		{
			var child = children[i];
			this._insertInside( child, parent_index, last_index + i - 1, parseInt( child.dataset["level"] ) );
		}
		
		this._updateListBox( parent );
		if(old_parent)
			this._updateListBox( old_parent );

		return true;
	}

	/**
	* remove item with given id
	* @method removeItem
	* @param {string} id
	* @return {bool}
	*/
	Tree.prototype.removeItem = function(id_or_node)
	{
		var node = id_or_node;
		if(typeof(id_or_node) == "string")
			node = this.getItem(id_or_node);
		if(!node)
			return false;

		var parent = this.getParent(node);
		this.root.removeChild( node );

		if(parent)
			this._updateListBox(parent);
		return true;
	}

	/**
	* update a given item with new data
	* @method updateItem
	* @param {string} id
	* @param {object} data
	*/
	Tree.prototype.updateItem = function(id, data)
	{
		var node = this.getItem(id);
		if(!node)
			return;

		node.data = data;
		if(data.id)
			node.id = data.id;
		if(data.content)
		{
			//node.title_element.innerHTML = "<span class='precontent'></span><span class='incontent'>" +  + "</span><span class='postcontent'></span>";
			var incontent = node.title_element.querySelector(".incontent");
			incontent.innerHTML = data.content;
		}
	}

	/**
	* clears all the items
	* @method clear
	* @param {bool} keep_root if you want to keep the root item
	*/
	Tree.prototype.clear = function(keep_root)
	{
		if(!keep_root)
		{
			this.root.innerHTML = "";
			return;
		}

		var items = this.root.querySelectorAll(".ltreeitem");
		for(var i = 1; i < items.length; i++)
		{
			var item = items[i];
			this.root.removeChild( item );
		}
	}


	Tree.prototype.getNodeByIndex = function(index)
	{
		var items = this.root.querySelectorAll(".ltreeitem");
		return items[index];
	}

	//private ********************************

	Tree.prototype.unmarkAllAsSelected = function()
	{
		this.root.classList.remove("selected");
		var selected_array = this.root.querySelectorAll(".ltreeitemtitle.selected");
		if(selected_array)
		{
			for(var i = 0; i < selected_array.length; i++)
				selected_array[i].classList.remove("selected");
		}
		var semiselected = this.root.querySelectorAll(".ltreeitemtitle.semiselected");
		for(var i = 0; i < semiselected.length; i++)
			semiselected[i].classList.remove("semiselected");
	}

	Tree.prototype.isNodeSelected = function( node )
	{
		//already selected
		if( node.classList.contains("selected") ) 
			return true;
		return false;
	}

	Tree.prototype.markAsSelected = function( node, add_to_existing_selection )
	{
		//already selected
		if( node.classList.contains("selected") ) 
			return;

		//clear old selection
		if(!add_to_existing_selection)
			this.unmarkAllAsSelected();

		//mark as selected
		node.title_element.classList.add("selected");

		//go up and semiselect
		var parent = node.parentNode.parentNode; //two elements per level
		while(parent && parent.classList.contains("ltreeitem"))
		{
			parent.title_element.classList.add("semiselected");
			parent = parent.parentNode.parentNode;
		}
	}

	Tree.prototype._updateListBox = function( node )
	{
		if(!node)
			return;

		var that = this;

		if(!node.listbox)
		{
			var pre = node.title_element.querySelector(".collapsebox");
			var box = LiteGUI.createLitebox(true, function(e) { that.onClickBox(e, node); });
			box.stopPropagation = true;
			box.setEmpty(true);
			pre.appendChild(box);
			node.listbox = box;
		}

		var child_elements = this.getChildren( node.dataset["item_id"] );
		if(!child_elements)
			return; //null

		if(child_elements.length)
			node.listbox.setEmpty(false);
		else
			node.listbox.setEmpty(true);
	}

	Tree.prototype.onClickBox = function(e, node)
	{
		var children = this.getChildren( node );
		var status = node.listbox.getValue();

		for(var i = 0; i < children.length; ++i)
			children[i].style.display = status == "open" ? null : "none";
	}

	LiteGUI.Tree = Tree;
})();