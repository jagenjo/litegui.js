//enclose in a scope
(function(){

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

		var root_item = this.createTreeItem(data,options);
		root_item.className += " root_item";
		this.root.appendChild(root_item);
		this.root_item = root_item;
	}

	Tree.prototype.updateTree = function(data)
	{
		if(this.root_item)
			$(this.root_item).remove();
		if(!data) return;

		var root_item = this.createTreeItem(data,this.options);
		root_item.className += " root_item";
		this.root.appendChild(root_item);
		this.root_item = root_item;
	}

	Tree.prototype.createTreeItem = function(data,options)
	{
		var root = document.createElement("li");
		root.className = "ltreeitem";
		//if(data.id) root.id = data.id;
		if(data.id)
		{
			var safe_id = data.id.replace(/\s/g,"_");
			root.className += " ltreeitem-" + safe_id;
			root.dataset["item_id"] = data.id;
		}
		root.data = data;
		data.DOM = root;
		options = options || this.options;

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
		//incontent[0].addEventListener("mousedown", onMouseDown ); //for right click
		incontent.addEventListener("contextmenu", function(e) { 
			var title = this.parentNode;
			var item = title.parentNode;
			if(that.onContextMenu) 
				onContextMenu(e, { item: item, data: item.data} );
			e.preventDefault(); 
			return false;
		});

		var list = document.createElement("ul");
		list.className = "ltreeitemchildren";
		//list.style.display = "none";
		root.children_element = list;
		root.list = list;
		if(data.children)
		{
			for(var i in data.children)
			{
				var item = data.children[i];
				var element = this.createTreeItem(item, options);
				list.appendChild(element);
			}
		}
		root.appendChild(list);
		this.updateListBox(root);

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

				//loose focus
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
			if(item_id != "")
			{
				try
				{
					var parent_id = this.parentNode.dataset["item_id"];

					if( !that.onMoveItem || (that.onMoveItem && that.onMoveItem( that.getItem( item_id ), that.getItem( parent_id ) ) != false))
					{
						if( that.moveItem( item_id, parent_id ) )
							LiteGUI.trigger( that.root, "item_moved", { item: that.getItem( item_id ), parent_item: that.getItem( parent_id ) } );
					}
				}
				catch (err)
				{
					console.error("Error: " + err );
				}
			}
			else
			{
				LiteGUI.trigger( that.root, "drop_on_item", { item: this, event: ev });
			}
		});


		return root;
	}

	Tree.prototype.filterByName = function(name)
	{
		var all = this.root.querySelectorAll(".ltreeitemtitle .incontent");
		for(var i = 0; i < all.length; i++)
		{
			var element = all[i];
			if(!element) continue;
			var str = element.innerHTML;
			var parent = element.parentNode;
			if(!name || str.indexOf(name) != -1)
			{
				parent.style.display = "block"
				parent.parentNode.style.paddingLeft = null;
			}
			else
			{
				parent.style.display = "none"
				parent.parentNode.style.paddingLeft = 0;
			}
		}
	}	

	Tree.onClickBox = function(e)
	{
		var list = this.children_element;
		if(list.style.display == "none")
			list.style.display = "block";
		else
			list.style.display = "none";
	}

	Tree.prototype.getItem = function( id )
	{
		var safe_id = id.replace(/\s/g,"_");
		var node = this.root.querySelector(".ltreeitem-"+safe_id);
		if(!node) 
			return null;
		if( !node.classList.contains("ltreeitem") )
			throw("this node is not a tree item");
		return node;
	}

	Tree.prototype.expandItem = function(id)
	{
		var item = this.getItem(id);
		if(!item) return;

		if(!item.listbox) return;
		listbox.setValue(true);
	}

	Tree.prototype.contractItem = function(id)
	{
		var item = this.getItem(id);
		if(!item) return;

		if(!item.listbox) return;
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

	Tree.prototype.insertItem = function(data, id_parent, position, options)
	{
		var parent = this.root_item;
		if(id_parent)
		{
			if(typeof(id_parent) == "string")
				parent = this.getItem( id_parent );
			else
				parent = id_parent;
			if(!parent)
				return null; //not found
		}
		if( !parent.classList.contains("ltreeitem") )
			throw("this node is not a tree item");

		var element = this.createTreeItem(data, options);
		if(position == undefined)
			parent.list.appendChild( element );
		else
		{
			parent.list.insertBefore(element, parent.list.childNodes[position]);
		}

		this.updateListBox(parent);

		return element;
	}

	Tree.prototype.updateListBox = function(node)
	{

		if(!node.listbox)
		{
			var pre = node.title_element.querySelector(".precontent");
			var box = LiteGUI.createLitebox(true, Tree.onClickBox.bind(node) );
			box.setEmpty(true);
			pre.appendChild(box);
			node.listbox = box;
		}

		var child_elements = this.getChildren(node);
		if(!child_elements) return; //null

		if(child_elements.length)
			node.listbox.setEmpty(false);
		else
			node.listbox.setEmpty(true);

		/*
		var child_elements = this.getChildren(node);
		if(!child_elements) return; //null

		if(child_elements.length && !node.listbox)
		{
			var pre = node.title_element.querySelector(".precontent");
			var box = LiteGUI.createLitebox(true, Tree.onClickBox.bind(node) );
			pre.appendChild(box);
			node.listbox = box;
			return;
		}

		if(!child_elements.length && node.listbox)
		{
			node.listbox.parentNode.removeChild(node.listbox);
			node.listbox = null;
		}
		*/
	}

	Tree.prototype.getChildren = function(id_or_node)
	{
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
	}

	Tree.prototype.getParent = function(id_or_node)
	{
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
	}

	Tree.prototype.moveItem = function(id, id_parent)
	{
		var parent = this.getItem(id_parent);
		var node = this.getItem(id);
		var old_parent = this.getParent(node);

		if(!parent || !node)
			return false;

		if(parent == old_parent)
			return;

		parent.list.appendChild( node );
		this.updateListBox(parent);

		if(old_parent)
			this.updateListBox(old_parent);

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
		if(!parent || !parent.list) return;

		parent.list.removeChild( node );

		if(parent)
			this.updateListBox(parent);
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