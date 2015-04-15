//enclose in a scope
(function(){

	//all the tree data is stored in this.tree

	/*********** LiteTree *****************************/
	function Tree(id, data, options)
	{
		var root = document.createElement("div");
		this.root = root;
		if(id)
			root.id = id;

		root.className = "litetree";
		this.tree = data;
		var that = this;
		options = options || {allow_rename: true, drag: true};
		this.options = options;

		//bg click
		root.addEventListener("click", function(e){
			if(e.srcElement != that.root)
				return;

			if(that.onBackgroundClicked)
				that.onBackgroundClicked(e,that);
		});

		var root_item = this.createAndInsert(data, options, null);
		root_item.className += " root_item";
		//this.root.appendChild(root_item);
		this.root_item = root_item;
	}

	Tree.PADDING = 20;

	Tree.prototype.updateTree = function(data)
	{
		this.root.innerHTML = "";
		var root_item = this.createAndInsert( data, this.options, null);
		root_item.className += " root_item";
		//this.root.appendChild(root_item);
		this.root_item = root_item;
	}

	Tree.prototype.insertItem = function(data, parent_id, position, options)
	{
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

		return element;
	}

	Tree.prototype._insertInside = function(element, parent_index, offset_index )
	{
		var parent = this.root.childNodes[ parent_index ];
		var parent_level = parseInt( parent.dataset["level"] );
		var child_level = parent_level + 1;

		element.style.paddingLeft = (child_level * Tree.PADDING) + "px"; //inner padding
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

	Tree.prototype._findChildElements = function( id )
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

		var content = data.content || data.id || "";
		title_element.innerHTML = "<span class='precontent'></span><span class='incontent'>" + content + "</span><span class='postcontent'></span>";

		if(data.dataset)
			for(var i in data.dataset)
				root.dataset[i] = data.dataset[i];

		root.appendChild(title_element);
		root.title_element = title_element;

		var incontent = root.querySelector(".ltreeitemtitle .incontent");
		incontent.addEventListener("click",onNodeSelected);
		incontent.addEventListener("dblclick",onNodeDblClicked);
		incontent.addEventListener("contextmenu", function(e) { 
			var title = this.parentNode;
			var item = title.parentNode;
			if(that.onContextMenu) 
				onContextMenu(e, { item: item, data: item.data} );
			e.preventDefault(); 
			return false;
		});

		var that = this;
		function onNodeSelected(e)
		{
			var title = this.parentNode;
			var item = title.parentNode;

			if(title._editing) 
				return;

			//mark as selected
			that.markAsSelected(item);
			
			LiteGUI.trigger(that.root, "item_selected", { item: item, data: item.data} );

			var r = false;
			if(data.callback) 
				r = data.callback.call(that,item);

			if(!r && that.onItemSelected)
				that.onItemSelected(item.data, item);

			e.preventDefault();
			e.stopPropagation();
		}

		function onNodeDblClicked(e)
		{
			var item = this.parentNode;
			LiteGUI.trigger( that.root, "item_dblclicked", item );

			if(!this._editing && that.options.allow_rename)
			{
				this._editing = true;
				this._old_name = this.innerHTML;
				var that2 = this;
				this.innerHTML = "<input type='text' value='" + this.innerHTML + "' />";
				var input = this.querySelector("input");

				//loose focus when renaming
				$(input).blur(function(e) { 
					var new_name = e.target.value;
					setTimeout(function() { that2.innerHTML = new_name; },1); //bug fix, if I destroy input inside the event, it produce a NotFoundError
					//item.node_name = new_name;
					delete that2._editing;
					LiteGUI.trigger( that.root, "item_renamed", { old_name: that2._old_name, new_name: new_name, item: item, data: item.data } );
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

		function onContextMenu(e, item_info)
		{
			if(e.button != 2) //right button
				return;

			if(that.onContextMenu)
				return that.onContextMenu(e, item_info);
		}

		//dragging tree
		var draggable_element = title_element;
		draggable_element.draggable = true;

		//starts dragging this element
		draggable_element.addEventListener("dragstart", function(ev) {
			//this.removeEventListener("dragover", on_drag_over ); //avoid being drag on top of himself
			//ev.dataTransfer.setData("node-id", this.parentNode.id);
			ev.dataTransfer.setData("item_id", this.parentNode.dataset["item_id"]);
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
			$(title_element).removeClass("dragover");
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


		return root;
	}

	Tree.prototype.filterByName = function(name)
	{
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
				parent.parentNode.style.paddingLeft = (parseInt(parent.parentNode.dataset["level"]) * Tree.PADDING) + "px";
			}
			else
			{
				parent.style.display = "none";
				parent.parentNode.style.paddingLeft = 0;
			}
		}
	}	

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

	Tree.prototype.expandItem = function(id)
	{
		var item = this.getItem(id);
		if(!item)
			return;

		if(!item.listbox)
			return;

		listbox.setValue(true);
	}

	Tree.prototype.contractItem = function(id)
	{
		var item = this.getItem(id);
		if(!item)
			return;

		if(!item.listbox)
			return;

		listbox.setValue(false);
	}

	Tree.prototype.setSelectedItem = function(id)
	{
		if(!id)
		{
			//clear selection
			this.root.classList.remove("selected");
			var sel = this.root.querySelector(".ltreeitemtitle.selected");
			if(sel)
				sel.classList.remove("selected");
			var semiselected = this.root.querySelectorAll(".ltreeitemtitle.semiselected");
			for(var i = 0; i < semiselected.length; i++)
				semiselected[i].classList.remove("semiselected");
			return;
		}

		var node = this.getItem(id);
		if(!node) //not found
			return null;

		this.markAsSelected(node);
		return node;
	}

	Tree.prototype.markAsSelected = function(node)
	{
		//already selected
		if( node.classList.contains("selected") ) 
			return;

		//clear old selection
		this.root.classList.remove("selected");
		var selected = this.root.querySelector(".ltreeitemtitle.selected");
		if(selected)
			selected.classList.remove("selected");
		var semiselected = this.root.querySelectorAll(".ltreeitemtitle.semiselected");
		for(var i = 0; i < semiselected.length; i++)
			semiselected[i].classList.remove("semiselected");

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

	Tree.prototype.getSelectedItem = function()
	{
		var node = this.root.querySelector(".ltreeitemtitle.selected");
		return node;
	}

	Tree.prototype._updateListBox = function( node )
	{
		if(!node)
			return;

		var that = this;

		if(!node.listbox)
		{
			var pre = node.title_element.querySelector(".precontent");
			var box = LiteGUI.createLitebox(true, function(e) { that.onClickBox(e, node); });
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

	Tree.prototype.getChildren = function(id)
	{
		return this._findChildElements(id);
		/*
		var node = id_or_node;
		if(typeof(id_or_node) == "string")
			this.getItem(id_or_node);

		if(!node)
			return null;
		if(!node.list) //this is not a itemTree
			return null;

		var childs = node.list.childNodes;
		var child_elements = [];
		for(var i in childs)
		{
			var c = childs[i];
			if(c.localName == "li" && c.classList.contains("ltreeitem"))
				child_elements.push(c);
		}

		return child_elements;
		*/
	}

	Tree.prototype.getParent = function(id_or_node)
	{
		var element = this.getItem( id_or_node );
		if(element)
			return this.getItem( element.parent_id );
		return null;

		/*
		var node = id_or_node;
		if(typeof(id_or_node) == "string")
			this.getItem(id_or_node);
		if(!node)
			return null;

		var aux = node.parentNode;
		while(aux)
		{
			if( aux.classList.contains("ltreeitem") )
				return aux;
			aux = aux.parentNode;
		}
		return null;
		*/
	}

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

		//parent.list.appendChild( node );
		var children = this.getChildren( node );
		children.unshift(node);

		//remove all
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
		for(var i = 0; i < children.length; i++)
		{
			var child = children[i];
			this._insertInside( child, parent_index );
		}
		
		this._updateListBox( parent );
		if(old_parent)
			this._updateListBox( old_parent );

		return true;
	}

	Tree.prototype.removeItem = function(id_or_node)
	{
		var node = id_or_node;
		if(typeof(id_or_node) == "string")
			node = this.getItem(id_or_node);
		if(!node)
			return null;

		var parent = this.getParent(node);
		this.root.removeChild( node );

		if(parent)
			this._updateListBox(parent);
	}

	Tree.prototype.updateItem = function(id, data)
	{
		var node = this.getItem(id);
		if(!node) return;

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

	Tree.prototype.clear = function(keep_root)
	{
		$(keep_root ? this.root_item : this.root).find(".ltreeitem").remove();
	}

	LiteGUI.Tree = Tree;
})();