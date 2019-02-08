/**************  ***************************/
(function(){
	

	/**
	* Widget that contains several tabs and their content
	* Options:
	* - mode: "vertical","horizontal"
	* - size
	* - width,height
	* - autoswitch: allow autoswitch (switch when mouse over)
	* @class Tabs
	* @constructor
	*/
	function Tabs( options, legacy )
	{
		if( legacy || (options && options.constructor === String) )
		{
			var id = options;
			options = legacy || {};
			options.id = id;
			console.warn("LiteGUI.Tabs legacy parameter, use options as first parameter instead of id.");
		}

		options = options || {};
		this.options = options;

		var mode = this.mode = options.mode || "horizontal";

		var root = document.createElement("DIV");
		if(options.id) 
			root.id = options.id;
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

		if(options.width)
			this.root.style.width = options.width.constructor === Number ? options.width.toFixed(0) + "px" : options.width;
		if(options.height)
			this.root.style.height = options.height.constructor === Number ? options.height.toFixed(0) + "px" : options.height;

		//container of tab elements
		var list = document.createElement("UL");
		list.className = "wtabcontainer";
		if(mode == "vertical")
			list.style.width = LiteGUI.Tabs.tabs_width + "px";
		else
			list.style.height = LiteGUI.Tabs.tabs_height + "px";

		//allows to use the wheel to see hidden tabs
		list.addEventListener("wheel", onMouseWheel);
		list.addEventListener("mousewheel", onMouseWheel);
		function onMouseWheel(e){
			if(e.deltaY)
				list.scrollLeft += e.deltaY;
		}

		this.list = list;
		this.root.appendChild(this.list);
		this.tabs_root = list;

		this.tabs = {};
		this.tabs_by_index = [];
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


	/**
	* Returns the currently selected tab in the form of a tab object
	* @method getCurrentTab
	* @return {Object} the tab in the form of an object with {id,tab,content}
	*/
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

	/**
	* Returns the last tab pressed before this one. used to know from which tab we come
	* @method getCurrentTab
	* @return {Object} the tab in the form of an object with {id,tab,content}
	*/
	Tabs.prototype.getPreviousTab = function()
	{
		if(!this.previous_tab)
			return null;
		return this.tabs[ this.previous_tab[0] ];
	}

	Tabs.prototype.appendTo = function(parent, at_front)
	{
		if(at_front)
			parent.prepend(this.root);
		else
			parent.appendChild(this.root);
	}

	/**
	* Returns a tab given its id
	* @method getTab
	* @param {String} id tab id
	* @return {Object} the tab in the form of an object with {id,tab,content}
	*/
	Tabs.prototype.getTab = function(id)
	{
		return this.tabs[id];
	}

	/**
	* Returns a tab given its index in the tabs list
	* @method getTabByIndex
	* @param {Number} index
	* @return {Object} the tab in the form of an object with {id,tab,content}
	*/
	Tabs.prototype.getTabByIndex = function(index)
	{
		return this.tabs_by_index[index];
	}

	/**
	* Returns how many tabs there is
	* @method getNumOfTabs
	* @return {number} number of tabs
	*/
	Tabs.prototype.getNumOfTabs = function()
	{
		var num = 0;
		for(var i in this.tabs)
			num++;
		return num;
	}

	/**
	* Returns the content HTML element of a tab
	* @method getTabContent
	* @param {String} id
	* @return {HTMLEntity} content
	*/
	Tabs.prototype.getTabContent = function(id)
	{
		var tab = this.tabs[id];
		if(tab)
			return tab.content;
	}

	/**
	* Returns the index of a tab (the position in the tabs list)
	* @method getTabIndex
	* @param {String} id
	* @return {number} index
	*/
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


	/**
	* Create a new tab, where id is a unique identifier
	* @method addTab
	* @param {String} id could be null then a random id is generated
	* @param {Object} options { 
	*	title: tab text, 
	*	callback: called when selected, 
	*	callback_leave: callback when leaving, 
	*   callback_context: on right click on tab
	*   callback_canopen: used to block if this tab can be opened or not (if it returns true then yes)
	*	content: HTML content, 
	*   closable: if it can be closed (callback is onclose), 
	*	tab_width: size of the tab,
	*	tab_className: classes for the tab element,
	*	id: content id,
	*	size: full means all,
	*	mode: "vertical" or "horizontal",
	*	button: if it is a button tab, not a selectable tab
	*	}
	* @param {bool} skip_event prevent dispatching events
	* @return {Object} an object containing { id, tab, content }
	*/
	Tabs.prototype.addTab = function( id, options, skip_event )
	{
		options = options || {};
		if(typeof(options) == "function")
			options = { callback: options };

		var that = this;
		if(id === undefined || id === null)
			id = "rand_" + ((Math.random() * 1000000)|0);

		//the tab element
		var element = document.createElement("LI");
		var safe_id = id.replace(/ /gi,"_");
		element.className = "wtab wtab-" + safe_id + " ";
		//if(options.selected) element.className += " selected";
		element.dataset["id"] = id;
		element.innerHTML = "<span class='tabtitle'>" + (options.title || id) + "</span>";

		if(options.button)
			element.className += "button ";
		if(options.tab_className)
			element.className += options.tab_className;
		if(options.bigicon)
			element.innerHTML = "<img class='tabbigicon' src='" + options.bigicon+"'/>" + element.innerHTML;
		if(options.closable)
		{
			element.innerHTML += "<span class='tabclose'>" + LiteGUI.special_codes.close + "</span>";
			element.querySelector("span.tabclose").addEventListener("click", function(e) { 
				that.removeTab(id);
				e.preventDefault();
				e.stopPropagation();
			},true);
		}
		//WARNING: do not modify element.innerHTML or events will be lost

		if( options.index !== undefined )
		{
			var after = this.list.childNodes[options.index];
			if(after)
				this.list.insertBefore(element,after);
			else
				this.list.appendChild(element);
		}
		else if( this.plus_tab )
			this.list.insertBefore( element, this.plus_tab );
		else
			this.list.appendChild(element);

		if(options.tab_width)
		{
			element.style.width = options.tab_width.constructor === Number ? ( options.tab_width.toFixed(0) + "px" ) : options.tab_width;
			element.style.minWidth = "0";
		}

		if(this.options.autoswitch)
		{
			element.classList.add("autoswitch");
			element.addEventListener("dragenter",function(e){
				//console.log("Enter",this.dataset["id"]);
				if(that._timeout_mouseover)
					clearTimeout(that._timeout_mouseover);
				that._timeout_mouseover = setTimeout((function(){
					LiteGUI.trigger(this,"click");
					that._timeout_mouseover = null;
				}).bind(this),500);
			});
			
			element.addEventListener("dragleave",function(e){
				//console.log("Leave",this.dataset["id"]);
				if(that._timeout_mouseover)
				{
					clearTimeout(that._timeout_mouseover);
					that._timeout_mouseover = null;
				}
			});
		}


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
					content.style.width = "100%";
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
					content.style.height = "100%";
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
		if(!options.button)
			element.addEventListener("click", Tabs.prototype.onTabClicked );
		else
			element.addEventListener("click", function(e){ 
				var tab_id = this.dataset["id"];
				if(options.callback)
					options.callback( tab_id, e );
			});

		element.options = options;
		element.tabs = this;

		var title = element.querySelector("span.tabtitle");

		//tab object
		var tab_info = {
			id: id,
			tab: element,
			content: content,
			title: title,
			add: function(v) { this.content.appendChild(v.root || v); },
			setTitle: function( title )	{ this.title.innerHTML = title; },
			click: function(){ LiteGUI.trigger( this.tab, "click" ); },
			destroy: function(){ that.removeTab(this.id) }
		};

		if(options.onclose)
			tab_info.onclose = options.onclose;
		this.tabs[ id ] = tab_info;

		this.recomputeTabsByIndex();

		//context menu
		element.addEventListener("contextmenu", (function(e) { 
			if(e.button != 2) //right button
				return false;
			e.preventDefault(); 
			if(options.callback_context)
				options.callback_context.call(tab_info);
			return false;
		}).bind(this));

		if ( options.selected == true || this.selected == null )
			this.selectTab( id, options.skip_callbacks );

		return tab_info;
	}

	Tabs.prototype.addPlusTab = function( callback )
	{
		if(this.plus_tab)
			console.warn("There is already a plus tab created in this tab widget");
		this.plus_tab = this.addTab( "plus_tab", { title: "+", tab_width: 20, button: true, callback: callback, skip_callbacks: true });
	}

	Tabs.prototype.addButtonTab = function( id, title, callback )
	{
		return this.addTab( id, { title: title, tab_width: 20, button: true, callback: callback, skip_callbacks: true });
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

		//launch leaving current tab event
		if( that.current_tab && 
			that.current_tab[0] != tab_id && 
			that.current_tab[2] && 
			that.current_tab[2].callback_leave)
				that.current_tab[2].callback_leave( that.current_tab[0], that.current_tab[1], that.current_tab[2] );

		var tab_id = this.dataset["id"];
		var tab_content = null;

		//iterate tab labels
		for(var i in that.tabs)
		{
			var tab_info = that.tabs[i];
			if( i == tab_id )
			{
				tab_info.selected = true;
				tab_info.content.style.display = "";
				tab_content = tab_info.content;
			}
			else
			{
				delete tab_info.selected;
				tab_info.content.style.display = "none";
			}
		}

		var list = that.list.querySelectorAll("li.wtab");
		for(var i = 0; i < list.length; ++i)
			list[i].classList.remove("selected");
		this.classList.add("selected");

		//change tab
		that.previous_tab = that.current_tab;
		that.current_tab = [tab_id, tab_content, options];

		if(e) //user clicked
		{
			//launch callback
			if(options.callback) 
				options.callback(tab_id, tab_content,e);

			LiteGUI.trigger(that,"wchange",[tab_id, tab_content]);
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

		if( id.constructor != String )
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

	Tabs.prototype.recomputeTabsByIndex = function()
	{
		this.tabs_by_index = [];

		for(var i in this.tabs)
		{
			var tab = this.tabs[i];

			//compute index
			var index = 0;
			var child = tab.tab;
			while( (child = child.previousSibling) != null ) 
				index++;

			this.tabs_by_index[index] = tab;
		}
	}

	Tabs.prototype.removeTab = function(id)
	{
		var tab = this.tabs[id];
		if(!tab)
		{
			console.warn( "tab not found: " + id );
			return;
		}

		if(tab.onclose)
			tab.onclose(tab);

		if(tab.tab.parentNode)
			tab.tab.parentNode.removeChild( tab.tab );
		if(tab.content.parentNode)
			tab.content.parentNode.removeChild( tab.content );
		delete this.tabs[id];

		this.recomputeTabsByIndex();
	}

	Tabs.prototype.removeAllTabs = function( keep_plus )
	{
		var tabs = [];
		for(var i in this.tabs)
			tabs.push( this.tabs[i] );

		for(var i in tabs)
		{
			var tab = tabs[i];
			if(tab == this.plus_tab && keep_plus)
				continue;
			if(tab.tab.parentNode)
				tab.tab.parentNode.removeChild( tab.tab );
			if(tab.content.parentNode)
				tab.content.parentNode.removeChild( tab.content );
			delete this.tabs[ tab.id ];
		}

		this.recomputeTabsByIndex();
	}

	Tabs.prototype.clear = function()
	{
		this.removeAllTabs();
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
		this.recomputeTabsByIndex();

		if(on_complete)
			on_complete();

		return tab_window;
	}


	LiteGUI.Tabs = Tabs;
})();