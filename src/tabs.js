/**************  ***************************/
(function(){
	
	function Tabs(id,options)
	{
		options = options || {};

		var element = document.createElement("DIV");
		if(id) element.id = id;
		element.data = this;
		element.className = "litetabs";
		this.root = element;

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

		this.contents = {};
		this.selected = null;

		this.onchange = options.callback;

		if(options.parent)
			this.appendTo(options.parent);
	}

	Tabs.tabs_height = "30px";

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

	Tabs.prototype.get = function(name)
	{
		return this.contents[name];
	}

	Tabs.prototype.add = function(name,options)
	{
		options = options || {};
		var that = this;

		//the tab element
		var element = document.createElement("LI");
		element.className = "wtab wtab-" + name.replace(/ /gi,"_");
		//if(options.selected) element.className += " selected";
		element.data = name;
		element.innerHTML = name;

		$(this.list).append(element);

		//the content of the tab
		var content = document.createElement("div");
		if(options.id)
			content.id = options.id;
		content.className = "wtabcontent " + "wtabcontent-" + name + " " + (options.className || "");
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

		$(this.root).append(content);
		this.contents[ name ] = content;

		//when clicked
		$(element).click(function(e) {
			if($(this).hasClass("selected")) return;

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
			$(this).addClass("selected");
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
			this.select(name);

		return {tab: element, content: content};
	}

	Tabs.prototype.select = function(name)
	{
		var tabs = $(this.list).find("li.wtab");
		for(var i = 0; i < tabs.length; i++)
			if( name == tabs[i].data)
			{
				$(tabs[i]).click();
				break;
			}
	}

	LiteGUI.Tabs = Tabs;
})();