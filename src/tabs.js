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
		this.list = list;
		this.root.appendChild(this.list);

		this.tabs = {};
		this.contents = {};
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
		return this.contents[name];
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
		this.list.appendChild(element);

		//the content of the tab
		var content = document.createElement("div");
		if(options.id)
			content.id = options.id;
		content.className = "wtabcontent " + "wtabcontent-" + name.replace(/ /gi,"_") + " " + (options.className || "");
		content.data = name;
		content.style.display = "none";
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
		if(options.content)
		{
			if (typeof(options.content) == "string")
				content.innerHTML = options.content;
			else
				content.appendChild(options.content);
		}

		this.root.appendChild(content);
		this.contents[ name ] = content;

		//when clicked
		element.addEventListener("click", function(e) {
			if( this.classList.contains("selected") ) 
				return;

			var tabname = this.data;
			var tab = null;

			for(var i in that.contents)
				if( i == tabname )
				{
					$(that.contents[i]).show();
					tab = that.contents[i];
				}
				else
					$(that.contents[i]).hide();

			$(that.list).find("li.wtab").removeClass("selected");
			this.classList.add("selected");
			if( that.current_tab && 
				that.current_tab[0] != tabname && 
				that.current_tab[2] && 
				that.current_tab[2].callback_leave)
					that.current_tab[2].callback_leave( that.current_tab[0], that.current_tab[1], that.current_tab[2] );
			that.current_tab = [tabname, tab, options];
			if(options.callback) options.callback(tabname, tab);
			$(that).trigger("wchange",[tabname,tab]);
			if(that.onchange) that.onchange(name,tabname,tab);
			that.selected = name;
		});

		this.list.appendChild(element);

		if (options.selected == true || this.selected == null)
			this.selectTab(name);

		this.tabs[name] = {tab: element, content: content, add: function(v) { this.content.appendChild(v.root || v); }};
		return this.tabs[name];
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
		delete this.contents[name];
	}

	Tabs.prototype.hideTab = function(name)
	{
		this.setTabVisibility(name, false);
	}

	Tabs.prototype.showTab = function(name)
	{
		this.setTabVisibility(name, true);
	}

	LiteGUI.Tabs = Tabs;
})();