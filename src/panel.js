//enclose in a scope
(function(){
	
	/****************** PANEL **************/
	function Panel(id, options)
	{
		options = options || {};
		this._ctor(id,options);
	}

	Panel.title_height = "20px";

	Panel.prototype._ctor = function(id, options)
	{
		this.content = options.content || "";

		var root = this.root = document.createElement("div");
		if(id)
			root.id = id;

		root.className = "litepanel " + (options.className || "");
		root.data = this;

		var code = "";
		if(options.title)
			code += "<div class='panel-header'>"+options.title+"</div>";
		code += "<div class='content'>"+this.content+"</div>";
		code += "<div class='panel-footer'></div>";
		root.innerHTML = code;

		if(options.title)
			this.header = this.root.querySelector(".panel-header");

		this.content = this.root.querySelector(".content");
		this.footer = this.root.querySelector(".panel-footer");

		//if(options.scroll == false)	this.content.style.overflow = "hidden";
		if(options.scroll == true)
			this.content.style.overflow = "auto";
	}

	Panel.prototype.add = function( litegui_item )
	{
		this.content.appendChild( litegui_item.root );
	}

	/****************** DIALOG **********************/
	/**
	* Dialog
	*
	* @class Dialog
	* @param {string} id
	* @param {Object} options useful options are { title, width, height, closable, on_close, }
	* @constructor
	*/
	function Dialog(id, options)
	{
		this._ctor( id, options );
	}

	Dialog.MINIMIZED_WIDTH = 200;
	Dialog.title_height = "20px";

	Dialog.getDialog = function(id)
	{
		var element = document.getElementById(id);		
		if(!element)
			return null;
		return element.dialog;
	}

	Dialog.prototype._ctor = function(id, options)
	{
		this.width = options.width;
		this.height = options.height;
		this.minWidth = options.minWidth || 150;
		this.minHeight = options.minHeight || 100;
		this.content = options.content || "";

		var panel = document.createElement("div");
		if(id)
			panel.id = id;

		panel.className = "litedialog " + (options.className || "");
		panel.data = this;
		panel.dialog = this;

		var code = "";
		if(options.title)
		{
			code += "<div class='panel-header'>"+options.title+"</div><div class='buttons'>";
			if(options.minimize){
				code += "<button class='mini-button minimize-button'>-</button>";
				code += "<button class='mini-button maximize-button' style='display:none'></button>";
			}
			if(options.hide)
				code += "<button class='mini-button hide-button'></button>";
			
			if(options.close || options.closable)
				code += "<button class='mini-button close-button'>"+ LiteGUI.special_codes.close +"</button>";
			code += "</div>";
		}

		code += "<div class='content'>"+this.content+"</div>";
		code += "<div class='panel-footer'></div>";
		panel.innerHTML = code;

		this.root = panel;
		this.content = panel.querySelector(".content");
		this.footer = panel.querySelector(".panel-footer");

		if(options.fullcontent)
		{
			this.content.style.width = "100%";		
			this.content.style.height = "100%";		
		}

		if(options.buttons)
		{
			for(var i in options.buttons)
				this.addButton(options.buttons[i].name, options.buttons[i]);
		}

		//if(options.scroll == false)	this.content.style.overflow = "hidden";
		if(options.scroll == true)
			this.content.style.overflow = "auto";

		//buttons *********************************
		var close_button = panel.querySelector(".close-button");
		if(close_button)
			close_button.addEventListener("click", this.close.bind(this) );

		var maximize_button = panel.querySelector(".maximize-button");
		if(maximize_button)
			maximize_button.addEventListener("click", this.maximize.bind(this) );

		var minimize_button = panel.querySelector(".minimize-button");
		if(minimize_button)
			minimize_button.addEventListener("click", this.minimize.bind(this) );

		var hide_button = panel.querySelector(".hide-button");
		if(hide_button)
			hide_button.addEventListener("click", this.hide.bind(this) );

		this.makeDialog(options);
	}

	/**
	* add widget or html to the content of the dialog
	* @method add
	*/
	Dialog.prototype.add = function( litegui_item )
	{
		this.content.appendChild( litegui_item.root || litegui_item );
	}

	Dialog.prototype.makeDialog = function(options)
	{
		options = options || {};

		var panel = this.root;
		panel.style.position = "absolute";
		//panel.style.display = "none";

		panel.style.minWidth = this.minWidth + "px";
		panel.style.minHeight = this.minHeight + "px";

		if(this.width)
			panel.style.width = this.width + "px";

		if(this.height)
		{
			if(typeof(this.height) == "number")
			{
				panel.style.height = this.height + "px";
			}
			else
			{
				if(this.height.indexOf("%") != -1)
					panel.style.height = this.height;
			}

			this.content.style.height = "calc( " + this.height + " - 24px )";
		}

		panel.style.boxShadow = "0 0 3px black";

		if(options.draggable)
		{
			this.draggable = true;
			LiteGUI.draggable( panel, panel.querySelector(".panel-header") );
		}

		if(options.resizable)
			this.setResizable();

		var parent = null;
		if(options.parent)
			parent = typeof(options.parent) == "string" ? document.querySelector(options.parent) : options.parent;

		if(!parent)
			parent = LiteGUI.root;

		parent.appendChild( this.root );
		this.center();
	}

	Dialog.prototype.setResizable = function()
	{
		if(this.resizable)
			return;

		var root = this.root;
		this.resizable = true;
		var footer = this.footer;
		footer.style.minHeight = "4px";
		footer.classList.add("resizable");

		footer.addEventListener("mousedown", inner_mouse);

		var mouse = [0,0];
		var that = this;

		function inner_mouse(e)
		{
			if(e.type == "mousedown")
			{
				document.body.addEventListener("mousemove", inner_mouse);
				document.body.addEventListener("mouseup", inner_mouse);
				mouse[0] = e.pageX;
				mouse[1] = e.pageY;
			}
			else if(e.type == "mousemove")
			{
				var h = $(root).height();
				var newh = h - (mouse[1] - e.pageY);
				$(root).height(newh + "px");
				mouse[0] = e.pageX;
				mouse[1] = e.pageY;
				that.content.style.height = "calc( 100% - 24px )";
			}
			else if(e.type == "mouseup")
			{
				document.body.removeEventListener("mousemove", inner_mouse);
				document.body.removeEventListener("mouseup", inner_mouse);
			}
			e.preventDefault();
			return false;
		}
	}

	Dialog.prototype.dockTo = function(parent, dock_type)
	{
		if(!parent) return;
		var panel = this.root;

		dock_type = dock_type || "full";
		parent = parent.content || parent;

		panel.style.top = 0;
		panel.style.left = 0;

		panel.style.boxShadow = "0 0 0";

		if(dock_type == "full")
		{
			panel.style.position = "relative";
			panel.style.width = "100%";
			panel.style.height = "100%";
			this.content.style.width = "100%";
			this.content.style.height = "calc(100% - "+ LiteGUI.Panel.title_height +")"; //title offset: 20px
			this.content.style.height = "-moz-calc(100% - "+ LiteGUI.Panel.title_height +")";
			this.content.style.height = "-webkit-calc(100% - "+ LiteGUI.Panel.title_height +")"; 
			this.content.style.overflow = "auto";
		}
		else if(dock_type == 'left' || dock_type == 'right')
		{
			panel.style.position = "absolute";
			panel.style.top = 0;
			panel.style[dock_type] = 0;

			panel.style.width = this.width + "px";
			panel.style.height = "100%";

			this.content.style.height = "-moz-calc(100% - "+ LiteGUI.Panel.title_height +")";
			this.content.style.height = "-webkit-calc(100% - "+ LiteGUI.Panel.title_height +")";
			this.content.style.height = "calc(100% - "+ LiteGUI.Panel.title_height +")";
			this.content.style.overflow = "auto";

			if(dock_type == 'right')
			{
				panel.style.left = "auto";
				panel.style.right = 0;
			}
		}
		else if(dock_type == 'bottom' || dock_type == 'top')
		{
			panel.style.width = "100%";
			panel.style.height = this.height + "px";
			if(dock_type == 'bottom')
			{
				panel.style.bottom = 0;
				panel.style.top = "auto";
			}
		}

		if(this.draggable)
			$(panel).draggable({disabled: true});

		if(parent.content)
			parent.content.appendChild(panel);
		else if( typeof(parent) == "string")
		{
			parent = document.querySelector( parent );
			if(parent)
				parent.appendChild( panel )
		}
		else
			parent.appendChild( panel ); 
	}

	Dialog.prototype.addButton = function(name,options)
	{
		var that = this;
		var button = document.createElement("button");

		button.innerHTML = name;
		if(options.className) button.className = options.className;

		this.root.querySelector(".panel-footer").appendChild( button );

		button.addEventListener("click", function(e) { 
			if(options.callback)
				options.callback(this);

			if(options.close)
				that.close();
		});

		return button;
	}

	/**
	* destroys the dialog
	* @method close
	*/
	Dialog.prototype.close = function() {
		LiteGUI.remove( this );
		LiteGUI.trigger( this, "closed", this);
		if(this.on_close)
			this.on_close();
		if(this.onclose)
			console.warn("Dialog: Do not use onclose, use on_close instead");
	}

	Dialog.prototype.highlight = function(time)
	{
		time = time || 100;
		this.root.style.outline = "1px solid white";
		setTimeout( (function(){
			this.root.style.outline = null;
		}).bind(this), time );
	}

	Dialog.minimized = [];

	Dialog.prototype.minimize = function() {
		if(this.minimized) return;

		this.minimized = true;
		this.old_pos = $(this.root).position();

		this.root.querySelector(".content").style.display = "none";
		
		var minimize_button = this.root.querySelector(".minimize-button");
		if(minimize_button)	
			minimize_button.style.display = "none";

		var maximize_button = this.root.querySelector(".maximize-button");
		if(maximize_button)
			maximize_button.style.display = null;

		this.root.style.width = LiteGUI.Dialog.MINIMIZED_WIDTH + "px";

		LiteGUI.bind( this, "closed", function() {
			LiteGUI.Dialog.minimized.splice( LiteGUI.Dialog.minimized.indexOf( this ), 1);
			LiteGUI.Dialog.arrangeMinimized();
		});

		LiteGUI.Dialog.minimized.push( this );
		LiteGUI.Dialog.arrangeMinimized();

		LiteGUI.trigger( this,"minimizing" );
	}

	Dialog.arrangeMinimized = function()
	{
		for(var i in LiteGUI.Dialog.minimized)
		{
			var dialog = LiteGUI.Dialog.minimized[i];
			var parent = dialog.root.parentNode;
			var pos = $(parent).height() - 20;
			$(dialog.root).animate({ left: LiteGUI.Dialog.MINIMIZED_WIDTH * i, top: pos + "px" },100);
		}
	}

	Dialog.prototype.maximize = function() {
		if(!this.minimized)
			return;
		this.minimized = false;

		this.root.querySelector(".content").style.display = null;
		$(this.root).draggable({ disabled: false });
		$(this.root).animate({ left: this.old_pos.left+"px" , top: this.old_pos.top + "px", width: this.width },100);

		var minimize_button = this.root.querySelector(".minimize-button");
		if(minimize_button)
			minimize_button.style.display = null;

		var maximize_button = this.root.querySelector(".maximize-button");
		if(maximize_button)
			maximize_button.style.display = "none";

		LiteGUI.Dialog.minimized.splice( LiteGUI.Dialog.minimized.indexOf( this ), 1);
		LiteGUI.Dialog.arrangeMinimized();
		LiteGUI.trigger( this, "maximizing" );
	}

	Dialog.prototype.makeModal = function()
	{
		LiteGUI.showModalBackground(true);
		LiteGUI.modalbg_div.appendChild( this.root ); //add panel
		//$(this.root).draggable({ disabled: true });
		this.show();
		this.center();

		LiteGUI.bind( this, "closed", inner );

		function inner(e)
		{
			LiteGUI.showModalBackground(false);
		}
	}

	Dialog.prototype.bringToFront = function()
	{
		var parent = this.root.parentNode;
		parent.detach(this.root);
		parent.attach(this.root);
	}

	/**
	* shows a hidden dialog
	* @method show
	*/
	Dialog.prototype.show = function(v,callback)
	{
		if(!this.root.parentNode)
			LiteGUI.add( this );

		//$(this.root).show(v,null,100,callback);
		this.root.style.display = null;
		LiteGUI.trigger( this, "shown" );
	}

	/**
	* hides the dialog
	* @method hide
	*/
	Dialog.prototype.hide = function(v,callback)
	{
		this.root.style.display = "none";
		LiteGUI.trigger(this, "hidden");
	}

	Dialog.prototype.setPosition = function(x,y)
	{
		this.root.position = "absolute";
		this.root.style.left = x + "px";
		this.root.style.top = y + "px";
	}

	Dialog.prototype.setSize = function( w, h )
	{
		this.root.style.width = typeof(w) == "number" ? w + "px" : w;
		this.root.style.height = typeof(h) == "number" ? h + "px" : h;
	}

	Dialog.prototype.setTitle = function(text)
	{
		if(!this.header)
			return;
		this.header.innerHTML = text;
	}

	Dialog.prototype.center = function()
	{
		if(!this.root.parentNode)
			return;

		this.root.position = "absolute";
		var width = this.root.offsetWidth;
		var height = this.root.offsetHeight;
		var parent_width = this.root.parentNode.offsetWidth;
		var parent_height = this.root.parentNode.offsetHeight;
		this.root.style.left = Math.floor(( parent_width - width ) * 0.5) + "px";
		this.root.style.top = Math.floor(( parent_height - height ) * 0.5) + "px";
	}

	/**
	* Adjust the size of the dialog to the size of the content
	* @method adjustSize
	* @param {number} margin
	*/
	Dialog.prototype.adjustSize = function( margin, skip_timeout )
	{
		margin = margin || 0;
		this.content.style.height = "auto";

		if(this.content.offsetHeight == 0 && !skip_timeout) //happens sometimes if the dialog is not yet visible
		{
			var that = this;
			setTimeout( function(){ that.adjustSize( margin, true ); }, 1 );
			return;
		}

		var width = this.content.offsetWidth;
		var height = this.content.offsetHeight + 20 + margin;

		this.setSize( width, height );
	}

	Dialog.prototype.clear = function()
	{
		this.content.innerHTML = "";
	}

	Dialog.showAll = function()
	{
		var dialogs = document.body.querySelectorAll("litedialog");
		for(var i = 0; i < dialogs.length; i++)
		{
			var dialog = dialogs[i];
			dialog.dialog.show();
		}
	}

	Dialog.hideAll = function()
	{
		var dialogs = document.body.querySelectorAll("litedialog");
		for(var i = 0; i < dialogs.length; i++)
		{
			var dialog = dialogs[i];
			dialog.dialog.hide();
		}
	}

	Dialog.closeAll = function()
	{
		var dialogs = document.body.querySelectorAll("litedialog");
		for(var i = 0; i < dialogs.length; i++)
		{
			var dialog = dialogs[i];
			dialog.dialog.close();
		}
	}


	LiteGUI.Panel = Panel;
	LiteGUI.Dialog = Dialog;
})();