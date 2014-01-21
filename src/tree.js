//enclose in a scope
(function(){

	/*********** LiteTree *****************************/
	function Tree(id,data,options)
	{
		var root = document.createElement("div");
		this.root = root;
		root.id = id;
		root.className = "litetree";
		this.tree = data;
		var that = this;
		options = options || {allow_rename: true, drag: true};
		this.options = options;

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
		if(data.id) root.id = data.id;
		root.data = data;
		data.DOM = root;
		options = options || this.options;

		var title_element = document.createElement("div");
		title_element.className = "ltreeitemtitle";
		var content = data.content || data.id || "";
		title_element.innerHTML = "<span class='precontent'></span><span class='incontent'>" + content + "</span><span class='postcontent'></span>";
		//root.dataset["item"] = data.id || data.content || "";

		root.appendChild(title_element);
		root.title_element = title_element;

		var incontent = $(root).find(".ltreeitemtitle .incontent");
		incontent.click(onNodeSelected);
		incontent.dblclick(onNodeDblClicked);
		//incontent[0].addEventListener("mousedown", onMouseDown ); //for right click
		incontent[0].addEventListener("contextmenu", function(e) { 
			if(that.onContextMenu) onContextMenu(e);
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
			if(title._editing) return;

			$(that.root).removeClass("selected");
			$(that.root).find(".ltreeitemtitle.selected").removeClass("selected");
			$(title).addClass("selected");
			
			$(that).trigger("item_selected", [item.data, item] );
			if(item.callback) item.callback.call(that,item);
		}

		function onNodeDblClicked(e)
		{
			var item = this.parentNode;
			$(that).trigger("item_dblclicked", [item.data, item] );

			if(!this._editing && that.options.allow_rename)
			{
				this._editing = true;
				this._old_name = this.innerHTML;
				var that2 = this;
				this.innerHTML = "<input type='text' value='" + this.innerHTML + "' />";
				var input = $(this).find("input")[0];
				$(input).blur(function(e) { 
					var new_name = e.target.value;
					that2.innerHTML = new_name;
					//item.node_name = new_name;
					delete that2._editing;
					$(that).trigger("item_renamed", [that2._old_name, new_name, item]);
					delete that2._old_name;
				});
				$(input).bind("keydown", function(e) {
					if(e.keyCode != 13)
						return;
					$(this).blur();
				});
				$(input).focus();
				e.preventDefault();
			}
			
		}

		function onContextMenu(e)
		{
			if(e.button != 2) return;

			if(that.onContextMenu)
				return that.onContextMenu(e);
		}

		//dragging tree
		var draggable_element = title_element;
		draggable_element.draggable = true;

		//starts dragging this element
		draggable_element.addEventListener("dragstart", function(ev) {
			//trace("DRAGSTART!");
			//this.removeEventListener("dragover", on_drag_over ); //avoid being drag on top of himself
			ev.dataTransfer.setData("node-id", this.parentNode.id);
		});

		//something being dragged entered
		draggable_element.addEventListener("dragenter", function (ev)
		{
			//console.log(data.id);
			$(title_element).addClass("dragover");
			//if(ev.srcElement == this) return;
			ev.preventDefault();
		});

		draggable_element.addEventListener("dragleave", function (ev)
		{
			//console.log(data.id);
			$(title_element).removeClass("dragover");
			//if(ev.srcElement == this) return;
			ev.preventDefault();
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
			var node_id = ev.dataTransfer.getData("node-id");

			//trace("DROP! \"" + node_id + "\"");
			//var data = ev.dataTransfer.getData("Text");
			if(node_id != "")
			{
				try
				{
					if( that.moveItem(node_id, this.parentNode.id ) )
						$(that).trigger("item_moved", [ that.getItem(node_id), that.getItem(this.parentNode.id) ] );
				}
				catch (err)
				{
					trace("Error: " + err );
				}
			}
			else
			{
				$(that).trigger("drop_on_item", [this, ev] );
			}
		});


		return root;
	}

	Tree.onClickBox = function(e)
	{
		var list = this.children_element;
		if(list.style.display == "none")
			list.style.display = "block";
		else
			list.style.display = "none";
	}

	Tree.prototype.getItem = function(id)
	{
		var node = this.root.querySelector("#"+id);
		if(!node) return null;
		if( !$(node).hasClass("ltreeitem") )
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
			$(this.root).removeClass("selected");
			$(this.root).find(".ltreeitemtitle.selected").removeClass("selected");
			return;
		}

		var node = this.getItem(id);
		if(!node) return null;
		if( $(node).hasClass("selected") ) return node;

		$(this.root).removeClass("selected");
		$(this.root).find(".ltreeitemtitle.selected").removeClass("selected");
		$(node.title_element).addClass("selected");
		return node;
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
				parent = this.getItem(id_parent);
			else
				parent = id_parent;
			if(!parent)
				return null; //not found
		}
		if( !$(parent).hasClass("ltreeitem") )
			throw("this node is not a tree item");

		var element = this.createTreeItem(data, options);
		if(position == undefined)
			parent.list.appendChild( element );
		else
		{
			//trace(parent.list.childNodes);
			parent.list.insertBefore(element, parent.list.childNodes[position]);
		}

		this.updateListBox(parent);

		return element;
	}

	Tree.prototype.updateListBox = function(node)
	{
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
			if(c.localName == "li" && $(c).hasClass("ltreeitem"))
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
			if( $(aux).hasClass("ltreeitem") )
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
			node.title_element.innerHTML = "<span class='precontent'></span><span class='incontent'>" + data.content + "</span><span class='postcontent'></span>";
	}

	Tree.prototype.clear = function(keep_root)
	{
		$(keep_root ? this.root_item : this.root).find(".ltreeitem").remove();
	}

	LiteGUI.Tree = Tree;
})();