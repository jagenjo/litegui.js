/**************  ***************************/
(function(){
	
	function Tabs(id,options)
	{
		options = options || {};
		this.options = options;

		var mode = this.mode = options.mode || "horizontal";

		var root = document.createElement("DIV");
		if(id) 
			root.id = id;
		root.data = this;
		root.className = "litetabs " + mode;
		this.root = root;
		this.root.tabs = this;

		this.current_tab = null; //current tab array [id, tab, content]

		if(mode == "horizontal")
		{
			if(options.size)
			{
				if(options.size == "full")
					this.root.style.height = "100%";
				else
					this.root.style.height = options.size;
			}
		}
		else if(mode == "vertical")
		{
			if(options.size)
			{
				if(options.size == "full")
					this.root.style.width = "100%";
				else
					this.root.style.width = options.size;
			}
		}


		//container of tab elements
		var list = document.createElement("UL");
		list.className = "wtabcontainer";
		if(mode == "vertical")
			list.style.width = LiteGUI.Tabs.tabs_width + "px";
		else
			list.style.height = LiteGUI.Tabs.tabs_height + "px";

		this.list = list;
		this.root.appendChild(this.list);
		this.tabs_root = list;

		this.tabs = {};
		this.selected = null;

		this.onchange = options.callback;

		if(options.parent)
			this.appendTo(options.parent);
	}

	Tabs.tabs_width = 64;
	Tabs.tabs_height = 26;

	Tabs.prototype.show = function()
	{
		this.root.style.display = "block";
	}

	Tabs.prototype.hide = function()
	{
		this.root.style.display = "none";
	}

	Tabs.prototype.getCurrentTab = function()
	{
		if(!this.current_tab)
			return null;
		return this.tabs[ this.current_tab[0] ];
	}

	Tabs.prototype.getCurrentTabId = function()
	{
		return this.current_tab[0];
	}

	//used to know from which tab we come
	Tabs.prototype.getPreviousTab = function()
	{
		if(!this.previous_tab)
			return null;
		return this.tabs[ this.previous_tab[0] ];
	}

	Tabs.prototype.appendTo = function(parent,at_front)
	{
		if(at_front)
			$(parent).prepend(this.root);
		else
			$(parent).append(this.root);
	}

	Tabs.prototype.getTab = function(id)
	{
		return this.tabs[id];
	}

	Tabs.prototype.getTabContent = function(id)
	{
		var tab = this.tabs[id];
		if(tab)
			return tab.content;
	}

	Tabs.prototype.getTabIndex = function(id)
	{
		var tab = this.tabs[id];
		if(!tab)
			return -1;
		for(var i = 0; i < this.list.childNodes.length; i++)
			if( this.list.childNodes[i] == tab.tab )
				return i;
		return -1;
	}


	//create a new tab, where name is a unique identifier
	Tabs.prototype.addTab = function( id, options, skip_event )
	{
		options = options || {};
		if(typeof(options) == "function")
			options = { callback: options };

		var that = this;

		//the tab element
		var element = document.createElement("LI");
		var safe_id = id.replace(/ /gi,"_");
		element.className = "wtab wtab-" + safe_id;
		//if(options.selected) element.className += " selected";
		element.dataset["id"] = id;
		element.innerHTML = "<span class='tabtitle'>" + (options.title || id) + "</span>";

		if(options.bigicon)
			element.innerHTML = "<img class='tabbigicon' src='" + options.bigicon+"'/>" + element.innerHTML;
		if(options.closable)
		{
			element.innerHTML += "<span class='tabclose'>X</span>";
			element.querySelector("span.tabclose").addEventListener("click", function(e) { 
				that.removeTab(id);
				e.preventDefault();
				e.stopPropagation();
			},true);
		}
		//WARNING: do not modify element.innerHTML or event will be lost

		if(options.index && options.index != -1)
		{
			this.list.insertBefore(element, this.list.childNodes[options.index]);
		}
		else
			this.list.appendChild(element);

		//the content of the tab
		var content = document.createElement("div");
		if(options.id)
			content.id = options.id;

		content.className = "wtabcontent " + "wtabcontent-" + safe_id + " " + (options.className || "");
		content.dataset["id"] = id;
		content.style.display = "none";

		//adapt height
		if(this.mode == "horizontal")
		{
			if(options.size)
			{
				content.style.overflow = "auto";
				if(options.size == "full")
				{
					content.style.height = "calc( 100% - "+LiteGUI.Tabs.tabs_height+"px )"; //minus title
					content.style.height = "-moz-calc( 100% - "+LiteGUI.Tabs.tabs_height+"px )"; //minus title
					content.style.height = "-webkit-calc( 100% - "+LiteGUI.Tabs.tabs_height+"px )"; //minus title
					//content.style.height = "-webkit-calc( 90% )"; //minus title
				}
				else
					content.style.height = options.size;
			}
		}
		else if(this.mode == "vertical")
		{
			if(options.size)
			{
				content.style.overflow = "auto";
				if(options.size == "full")
				{
					content.style.width = "calc( 100% - "+LiteGUI.Tabs.tabs_width+"px )"; //minus title
					content.style.width = "-moz-calc( 100% - "+LiteGUI.Tabs.tabs_width+"px )"; //minus title
					content.style.width = "-webkit-calc( 100% - "+LiteGUI.Tabs.tabs_width+"px )"; //minus title
					//content.style.height = "-webkit-calc( 90% )"; //minus title
				}
				else
					content.style.width = options.size;
			}
		}

		//overwrite
		if(options.width !== undefined )
			content.style.width = typeof(options.width) === "string" ? options.width : options.width + "px";
		if(options.height !== undefined )
			content.style.height = typeof(options.height) === "string" ? options.height : options.height + "px";

		//add content
		if(options.content)
		{
			if (typeof(options.content) == "string")
				content.innerHTML = options.content;
			else
				content.appendChild(options.content);
		}
		this.root.appendChild(content);

		//when clicked
		element.addEventListener("click", Tabs.prototype.onTabClicked );
		element.options = options;
		element.tabs = this;

		this.list.appendChild(element);

		var tab_info = {id: id, tab: element, content: content, add: function(v) { this.content.appendChild(v.root || v); }};
		if(options.onclose)
			tab_info.onclose = options.onclose;
		this.tabs[id] = tab_info;

		if ( options.selected == true || this.selected == null )
			this.selectTab( id, options.skip_callbacks );

		return tab_info;
	}

	//this is tab
	Tabs.prototype.onTabClicked = function(e)
	{
		//skip if already selected
		if( this.classList.contains("selected") ) 
			return;

		if(!this.parentNode)
			return; //this could happend if it gets removed while being clicked (not common)

		var options = this.options;
		var tabs = this.parentNode.parentNode.tabs;
		if(!tabs)
			throw("tabs not found");
		var that = tabs;

		//check if this tab is available
		if(options.callback_canopen && options.callback_canopen() == false)
			return;

		var tab_id = this.dataset["id"];
		var tab_content = null;

		//iterate tab labels
		for(var i in that.tabs)
		{
			var tab_info = that.tabs[i];
			if( i == tab_id )
			{
				tab_info.selected = true;
				tab_info.content.style.display = null;
				tab_content = tab_info.content;
			}
			else
			{
				delete tab_info.selected;
				tab_info.content.style.display = "none";
			}
		}

		$(that.list).find("li.wtab").removeClass("selected");
		this.classList.add("selected");

		//launch leaving current tab event
		if( that.current_tab && 
			that.current_tab[0] != tab_id && 
			that.current_tab[2] && 
			that.current_tab[2].callback_leave)
				that.current_tab[2].callback_leave( that.current_tab[0], that.current_tab[1], that.current_tab[2] );

		//change tab
		that.previous_tab = that.current_tab;
		that.current_tab = [tab_id, tab_content, options];

		if(e) //user clicked
		{
			//launch callback
			if(options.callback) 
				options.callback(tab_id, tab_content);

			$(that).trigger("wchange",[tab_id, tab_content]);
			if(that.onchange)
				that.onchange( tab_id, tab_content );
		}

		//change afterwards in case the user wants to know the previous one
		that.selected = tab_id;
	}

	Tabs.prototype.selectTab = function( id, skip_events )
	{
		if(!id)
			return;

		if(typeof(id) != "string")
			id = id.id; //in case id is the object referencing the tab

		var tabs = this.list.querySelectorAll("li.wtab");
		for(var i = 0; i < tabs.length; i++)
			if( id == tabs[i].dataset["id"] )
			{
				this.onTabClicked.call( tabs[i], !skip_events );
				break;
			}
	}

	Tabs.prototype.setTabVisibility = function(id, v)
	{
		var tab = this.tabs[id];
		if(!tab)
			return;

		tab.tab.style.display = v ? "none" : null;
		tab.content.style.display = v ? "none" : null;
	}

	Tabs.prototype.removeTab = function(id)
	{
		var tab = this.tabs[id];
		if(!tab)
			return;

		if(tab.onclose)
			tab.onclose(tab);

		tab.tab.parentNode.removeChild( tab.tab );
		tab.content.parentNode.removeChild( tab.content );
		delete this.tabs[id];
	}

	Tabs.prototype.removeAllTabs = function()
	{
		var tabs = [];
		for(var i in this.tabs)
			tabs.push( this.tabs[i] );

		for(var i in tabs)
		{
			var tab = tabs[i];
			tab.tab.parentNode.removeChild( tab.tab );
			tab.content.parentNode.removeChild( tab.content );
			delete this.tabs[ tab.id ];
		}

		this.tabs = {};
	}

	Tabs.prototype.hideTab = function(id)
	{
		this.setTabVisibility(id, false);
	}

	Tabs.prototype.showTab = function(id)
	{
		this.setTabVisibility(id, true);
	}

	Tabs.prototype.transferTab = function(id, target_tabs, index)
	{
		var tab = this.tabs[id];
		if(!tab)
			return;

		target_tabs.tabs[id] = tab;

		if(index !== undefined)
			target_tabs.list.insertBefore(tab.tab, target_tabs.list.childNodes[index]);
		else
			target_tabs.list.appendChild(tab.tab);
		target_tabs.root.appendChild(tab.content);
		delete this.tabs[id];

		var newtab = null;
		for(var i in this.tabs)
		{
			newtab = i;
			break;
		}

		if(newtab)
			this.selectTab(newtab);

		tab.tab.classList.remove("selected");
		target_tabs.selectTab(id);
	}

	Tabs.prototype.detachTab = function(id, on_complete, on_close )
	{
		var tab = this.tabs[id];
		if(!tab)
			return;

		var index = this.getTabIndex( id );

		//create window
		var w = 800;
		var h = 600;
		var tab_window = window.open("","","width="+w+", height="+h+", location=no, status=no, menubar=no, titlebar=no, fullscreen=yes");
		tab_window.document.write( "<head><title>"+id+"</title>" );

		//transfer style
		var styles = document.querySelectorAll("link[rel='stylesheet'],style");
		for(var i = 0; i < styles.length; i++)
			tab_window.document.write( styles[i].outerHTML );
		tab_window.document.write( "</head><body></body>" );
		tab_window.document.close();

		var that = this;

		//transfer content after a while so the window is propertly created
		var newtabs = new LiteGUI.Tabs(null, this.options );
		tab_window.tabs = newtabs;

		//closing event
		tab_window.onbeforeunload = function(){
			newtabs.transferTab( id, that, index);
			if(on_close)
				on_close();
		}

		//move the content there
		newtabs.list.style.height = "20px";
		tab_window.document.body.appendChild(newtabs.root);
		that.transferTab(id, newtabs);
		newtabs.tabs[id].tab.classList.add("selected");

		if(on_complete)
			on_complete();

		return tab_window;
	}


	LiteGUI.Tabs = Tabs;
})();