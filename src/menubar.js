(function(){

	/************** MENUBAR ************************/
	function Menubar(id, options)
	{
		options = options || {};

		this.menu = [];
		this.panels = [];

		this.root = document.createElement("div");
		this.root.id = id;
		this.root.className = "litemenubar";

		this.content = document.createElement("ul");
		this.root.appendChild( this.content );

		this.is_open = false;
		this.auto_open = options.auto_open || false;
		this.sort_entries = options.sort_entries || false;
	}

	Menubar.closing_time = 500;

	Menubar.prototype.clear = function()
	{
		this.content.innerHTML = "";
		this.menu = [];
		this.panels = [];
	}

	Menubar.prototype.attachToPanel = function(panel)
	{
		panel.content.insertBefore( this.root, panel.content.firstChild );
	}

	Menubar.prototype.add = function( path, data )
	{
		data = data || {};

		if( typeof(data) == "function" )
			data = { callback: data };

		var prev_length = this.menu.length;

		var tokens = path.split("/");
		var current_token = 0;
		var current_pos = 0;
		var menu = this.menu;
		var last_item = null;

		while( menu )
		{
			if(current_token > 5)
				throw("Error: Menubar too deep");
			//token not found in this menu, create it
			if( menu.length == current_pos )
			{
				var v = { parent: last_item, children: [] };
				last_item = v;
				if(current_token == tokens.length - 1)
					v.data = data;

				v.disable = function() { if( this.data ) this.data.disabled = true; }
				v.enable = function() { if( this.data ) delete this.data.disabled; }

				v.name = tokens[ current_token ];
				menu.push( v );
				current_token++;
				if( current_token == tokens.length )
					break;
				v.children = [];
				menu = v.children;
				current_pos = 0;
				continue;
			}

			//token found in this menu, get inside for next token
			if( menu[ current_pos ] && tokens[ current_token ] == menu[ current_pos ].name )
			{
				if(current_token < tokens.length - 1)
				{
					last_item = menu[ current_pos ];
					menu = menu[ current_pos ].children;
					current_pos = 0;
					current_token++;
					continue;
				}
				else //last token
				{
					console.warn("Warning: Adding menu that already exists: " + path );
					break;
				}
			}
			current_pos++;
		}

		if(prev_length != this.menu.length)
			this.updateMenu();
	};

	Menubar.prototype.remove = function( path )
	{
		var menu = this.findMenu( path );
		if(!menu)
			return;
		if(!menu.parent || !menu.parent.children)
			return console.warn("menu without parent?");
		
		var index = menu.parent.children.indexOf( menu );
		if(index != -1)
			menu.parent.children.splice( index, 1 );
	},

	Menubar.prototype.separator = function( path, order )
	{
		var menu = this.findMenu( path );
		if(!menu)
			return;
		menu.children.push( {separator: true, order: order || 10 } );
	}

	//returns the menu entry that matches this path
	Menubar.prototype.findMenu = function( path )
	{
		var tokens = path.split("/");
		var current_token = 0;
		var current_pos = 0;
		var menu = this.menu;

		while( menu )
		{
			//no more tokens, return last found menu
			if(current_token == tokens.length)
				return menu;

			//this menu doesnt have more entries
			if(menu.length <= current_pos)
				return null;

			if(tokens[ current_token ] == "*")
				return menu[ current_pos ].children;

			//token found in this menu, get inside for next token
			if( tokens[ current_token ] == menu[ current_pos ].name )
			{
				if(current_token == tokens.length - 1) //last token
				{
					return menu[ current_pos ];
				}
				else
				{
					menu = menu[ current_pos ].children;
					current_pos = 0;
					current_token++;
					continue;
				}
			}

			//check next entry in this menu
			current_pos++;
		}
		return null;
	}

	//update top main menu
	Menubar.prototype.updateMenu = function()
	{
		var that = this;

		this.content.innerHTML = "";
		for(var i in this.menu)
		{
			var element = document.createElement("li");
			element.innerHTML = "<span class='icon'></span><span class='name'>" + this.menu[i].name + "</span>";
			this.content.appendChild(element);
			element.data = this.menu[i];
			this.menu[i].element = element;

			/* ON CLICK TOP MAIN MENU ITEM */
			element.addEventListener("click", function(e) {
				var item = this.data;

				if(item.data && item.data.callback && typeof(item.data.callback) == "function")
					item.data.callback(item.data);

				if(!that.is_open)
				{
					that.is_open = true;
					that.showMenu( item, e, this );
				}
				else
				{
					that.is_open = false;
					that.hidePanels();
				}
			});

			element.addEventListener("mouseover", function(e) {
				that.hidePanels();
				if(that.is_open || that.auto_open)
					that.showMenu( this.data, e, this );
			});
		}
	}

	Menubar.prototype.hidePanels = function() {
		if(!this.panels.length)
			return;

		for(var i in this.panels)
			LiteGUI.remove(this.panels[i]);
		this.panels = [];
	}

	//Create the panel with the drop menu
	Menubar.prototype.showMenu = function(menu, e, root, is_submenu) {

		if(!is_submenu)
			this.hidePanels();

		if(!menu.children || !menu.children.length)
			return;

		var that = this;
		if(that.closing_by_leave)
			clearInterval(that.closing_by_leave);

		var element = document.createElement("div");
		element.className = "litemenubar-panel";

		var sorted_entries = [];
		for(var i in menu.children)
			sorted_entries.push(menu.children[i]);

		if(this.sort_entries)
			sorted_entries.sort(function(a,b) {
				var a_order = 10;
				var b_order = 10;
				if(a && a.data && a.data.order != null) a_order = a.data.order;
				if(a && a.separator && a.order != null) a_order = a.order;
				if(b && b.data && b.data.order != null) b_order = b.data.order;
				if(b && b.separator && b.order != null) b_order = b.order;
				return a_order - b_order;
			});

		for(var i in sorted_entries)
		{
			var item = document.createElement("p");
			var menu_item = sorted_entries[i];

			item.className = 'litemenu-entry ' + ( item.children ? " submenu" : "" );
			var has_submenu = menu_item.children && menu_item.children.length;

			if(has_submenu)
				item.classList.add("has_submenu");

			if(menu_item && menu_item.name)
				item.innerHTML = "<span class='icon'></span><span class='name'>" + menu_item.name + (has_submenu ? "<span class='more'>+</span>":"") + "</span>";
			else
			{
				item.classList.add("separator");
				//item.innerHTML = "<span class='separator'></span>";
			}

			item.data = menu_item;

			//check if it has to show the item being 'checked'
			if( item.data.data )
			{
				var data = item.data.data;

				var checked = (data.type == "checkbox" && data.instance && data.property && data.instance[ data.property ] == true) || 
					data.checkbox == true ||
					(data.instance && data.property && data.hasOwnProperty("value") && data.instance[data.property] == data.value) ||
					(typeof( data.isChecked ) == "function" && data.isChecked.call(data.instance, data) );

				if(checked)
					item.className += " checked";

				if(data.disabled)
					item.className += " disabled";
			}

			/* ON CLICK SUBMENU ITEM */
			item.addEventListener("click",function(){
				var item = this.data;
				if(item.data)
				{
					if(item.data.disabled)
						return;

					//to change variables directly
					if(item.data.instance && item.data.property)
					{
						if( item.data.type == "checkbox" )
						{
							item.data.instance[item.data.property] = !item.data.instance[item.data.property];
							if(	item.data.instance[item.data.property] )
								this.classList.add("checked");
							else
								this.classList.remove("checked");
						}
						else if( item.data.hasOwnProperty("value") )
						{
							item.data.instance[item.data.property] = item.data.value;
						}
					}

					//to have a checkbox behaviour
					if(item.data.checkbox != null)
					{
						item.data.checkbox = !item.data.checkbox;
						if(	item.data.checkbox )
							this.classList.add("checked");
						else
							this.classList.remove("checked");
					}

					//execute a function
					if(item.data.callback && typeof(item.data.callback) == "function")
						item.data.callback(item.data);
				}

				//more menus
				if(item.children && item.children.length)
				{
					that.showMenu( item, e, this, true );
				}
				else
				{
					that.is_open = false;
					that.hidePanels();
				}
			});

			item.addEventListener("mouseenter",function(e){
				/*
				if( that.auto_open && this.classList.contains("has_submenu") )
					LiteGUI.trigger( this, "click" );
				*/
			});

			element.appendChild( item );
		}

		element.addEventListener("mouseleave",function(e){
		
			if(that.closing_by_leave)
				clearInterval(that.closing_by_leave);

			that.closing_by_leave = setTimeout( function() { 
				that.is_open = false;
				that.hidePanels();
			},LiteGUI.Menubar.closing_time);
		});

		element.addEventListener("mouseenter",function(e){
			if(that.closing_by_leave)
				clearInterval(that.closing_by_leave);
			that.closing_by_leave = null;
		});

		//compute X and Y for menu
		var box = root.getBoundingClientRect();
		element.style.left = box.left + ( is_submenu ? 200 : 0 ) + "px";
		element.style.top = box.top + box.height + ( is_submenu ? -20 : 10 ) + "px";
		/* animation, not working well, flickers
		element.style.opacity = "0.1";
		element.style.transform = "translate(0,-10px)";
		element.style.transition = "all 0.2s";
		setTimeout( function(){ 
			element.style.opacity = "1"; 
			element.style.transform = "translate(0,0)";
		},1);
		*/

		this.panels.push(element);
		document.body.appendChild( element );
	}

	LiteGUI.Menubar = Menubar;
})();