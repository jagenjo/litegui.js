/**************  ***************************/
(function(){
	
	function Tabs(id,options)
	{
		options = options || {};

		var root = document.createElement("DIV");
		if(id) 
			root.id = id;
		root.data = this;
		root.className = "litetabs";
		this.root = root;
		this.root.tabs = this;

		this.current_tab = null; //current tab array [name, tab, content]

		if(options.height)
		{
			if(options.height == "full")
				this.root.style.height = "100%";
			else
				this.root.style.height = options.height;
		}

		//container of tab elements
		var list = document.createElement("UL");
		list.className = "wtabcontainer";
		list.style.height = LiteGUI.Tabs.tabs_height + "px";
		this.list = list;
		this.root.appendChild(this.list);

		this.tabs = {};
		this.selected = null;

		this.onchange = options.callback;

		if(options.parent)
			this.appendTo(options.parent);
	}

	Tabs.tabs_height = "30px";

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
		return this.current_tab;
	}

	Tabs.prototype.appendTo = function(parent,at_front)
	{
		if(at_front)
			$(parent).prepend(this.root);
		else
			$(parent).append(this.root);
	}

	Tabs.prototype.getTab = function(name)
	{
		return this.tabs[name];
	}

	Tabs.prototype.getTabContent = function(name)
	{
		var tab = this.tabs[name];
		if(tab)
			return tab.content;
	}

	Tabs.prototype.getTabIndex = function(name)
	{
		var tab = this.tabs[name];
		if(!tab)
			return -1;
		for(var i = 0; i < this.list.childNodes.length; i++)
			if( this.list.childNodes[i] == tab.tab )
				return i;
		return -1;
	}


	//add something
	Tabs.prototype.addTab = function(name,options)
	{
		options = options || {};
		var that = this;

		//the tab element
		var element = document.createElement("LI");
		element.className = "wtab wtab-" + name.replace(/ /gi,"_");
		//if(options.selected) element.className += " selected";
		element.data = name;
		element.innerHTML = name;

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
		content.className = "wtabcontent " + "wtabcontent-" + name.replace(/ /gi,"_") + " " + (options.className || "");
		content.data = name;
		content.style.display = "none";

		//adapt height
		if(options.height)
		{
			content.style.overflow = "auto";
			if(options.height == "full")
			{
				content.style.height = "calc( 100% - "+LiteGUI.Tabs.tabs_height+" )"; //minus title
				content.style.height = "-moz-calc( 100% - "+LiteGUI.Tabs.tabs_height+" )"; //minus title
				content.style.height = "-webkit-calc( 100% - "+LiteGUI.Tabs.tabs_height+" )"; //minus title
				//content.style.height = "-webkit-calc( 90% )"; //minus title
			}
			else
				content.style.height = options.height;
		}

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

		this.tabs[name] = {name: name, tab: element, content: content, add: function(v) { this.content.appendChild(v.root || v); }};

		if (options.selected == true || this.selected == null)
			this.selectTab(name);

		return this.tabs[name];
	}

	//this is tab
	Tabs.prototype.onTabClicked = function()
	{
		//skip if already selected
		if( this.classList.contains("selected") ) 
			return;

		var options = this.options;
		var tabs = this.parentNode.parentNode.tabs;
		if(!tabs)
			throw("tabs not found");
		var that = tabs;

		//check if this tab is available
		if(options.callback_canopen && options.callback_canopen() == false)
			return;

		var tabname = this.data;
		var tab_content = null;

		//iterate tab labels
		for(var i in that.tabs)
		{
			var tab_info = that.tabs[i];
			if( i == tabname )
			{
				$(tab_info.content).show();
				tab_content = tab_info.content;
			}
			else
				$(tab_info.content).hide();
		}

		$(that.list).find("li.wtab").removeClass("selected");
		this.classList.add("selected");

		//launch leaving current tab event
		if( that.current_tab && 
			that.current_tab[0] != tabname && 
			that.current_tab[2] && 
			that.current_tab[2].callback_leave)
				that.current_tab[2].callback_leave( that.current_tab[0], that.current_tab[1], that.current_tab[2] );

		//change tab
		that.current_tab = [tabname, tab_content, options];

		//launch callback
		if(options.callback) 
			options.callback(tabname, tab_content);

		$(that).trigger("wchange",[tabname,tab_content]);
		if(that.onchange) that.onchange(name,tabname,tab_content);
		that.selected = name;
	}

	Tabs.prototype.selectTab = function(name)
	{
		var tabs = this.list.querySelectorAll("li.wtab");
		for(var i = 0; i < tabs.length; i++)
			if( name == tabs[i].data)
			{
				$(tabs[i]).click();
				break;
			}
	}

	Tabs.prototype.setTabVisibility = function(name, v)
	{
		var tab = this.tabs[name];
		if(!tab)
			return;

		tab.tab.style.display = v ? "none" : "inline-block";
		tab.content.style.display = v ? "none" : "inline-block";
	}

	Tabs.prototype.removeTab = function(name)
	{
		var tab = this.tabs[name];
		if(!tab)
			return;

		tab.tab.parentNode.removeChild( tab.tab );
		tab.content.parentNode.removeChild( tab.content );
		delete this.tabs[name];
	}

	Tabs.prototype.hideTab = function(name)
	{
		this.setTabVisibility(name, false);
	}

	Tabs.prototype.showTab = function(name)
	{
		this.setTabVisibility(name, true);
	}

	Tabs.prototype.transferTab = function(name, target_tabs, index)
	{
		var tab = this.tabs[name];
		if(!tab)
			return;

		target_tabs.tabs[name] = tab;

		if(index !== undefined)
			target_tabs.list.insertBefore(tab.tab, target_tabs.list.childNodes[index]);
		else
			target_tabs.list.appendChild(tab.tab);
		target_tabs.root.appendChild(tab.content);
		delete this.tabs[name];

		var newtab = null;
		for(var i in this.tabs)
		{
			newtab = i;
			break;
		}

		if(newtab)
			this.selectTab(newtab);

		tab.tab.classList.remove("selected");
		target_tabs.selectTab(name);
	}

	Tabs.prototype.detachTab = function(name, on_complete, on_close )
	{
		var tab = this.tabs[name];
		if(!tab)
			return;

		var index = this.getTabIndex( name );

		//create window
		var w = 800;
		var h = 600;
		var tab_window = window.open("","","width="+w+", height="+h+", location=no, status=no, menubar=no, titlebar=no, fullscreen=yes");
		tab_window.document.write( "<head><title>"+name+"</title>" );

		//transfer style
		var styles = document.querySelectorAll("link[rel='stylesheet'],style");
		for(var i = 0; i < styles.length; i++)
			tab_window.document.write( styles[i].outerHTML );
		tab_window.document.write( "</head><body></body>" );
		tab_window.document.close();

		var that = this;

		//transfer content after a while so the window is propertly created
		setTimeout( function() {

			var newtabs = new LiteGUI.Tabs();
			tab_window.tabs = newtabs;

			//closing event
			tab_window.onbeforeunload = function(){
				newtabs.transferTab(name, that, index);
				if(on_close)
					on_close();
			}

			//move the content there
			newtabs.list.style.height = "20px";
			tab_window.document.body.appendChild(newtabs.root);
			that.transferTab(name, newtabs);
			newtabs.tabs[name].tab.classList.add("selected");

			if(on_complete)
				on_complete();
		},1);

		return tab_window;
	}


	LiteGUI.Tabs = Tabs;
})();