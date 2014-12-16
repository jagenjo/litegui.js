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
		if(options.scroll == true)	this.content.style.overflow = "auto";
	}

	Panel.prototype.add = function( litegui_item )
	{
		this.content.appendChild( litegui_item.root );
	}

	/****************** DIALOG **********************/
	function Dialog(id, options)
	{
		this._ctor( id, options );
		//this.makeDialog(options);
	}

	Dialog.MINIMIZED_WIDTH = 200;
	Dialog.title_height = "20px";

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

		var code = "";
		if(options.title)
		{
			code += "<div class='panel-header'>"+options.title+"</div><div class='buttons'>";
			if(options.minimize){
				code += "<button class='mini-button minimize-button'></button>";
				code += "<button class='mini-button maximize-button' style='display:none'></button>";
			}
			if(options.hide)
				code += "<button class='mini-button hide-button'></button>";
			
			if(options.close) code += "<button class='mini-button close-button'></button>";
			code += "</div>";
		}

		code += "<div class='content'>"+this.content+"</div>";
		code += "<div class='panel-footer'></div>";
		panel.innerHTML = code;

		this.root = panel;
		this.content = $(panel).find(".content")[0];
		this.footer = $(panel).find(".panel-footer")[0];

		if(options.buttons)
		{
			for(var i in options.buttons)
				this.addButton(options.buttons[i].name, options.buttons[i]);
		}

		//if(options.scroll == false)	this.content.style.overflow = "hidden";
		if(options.scroll == true)	this.content.style.overflow = "auto";

		$(panel).find(".close-button").bind("click", this.close.bind(this) );
		$(panel).find(".minimize-button").bind("click", this.minimize.bind(this) );
		$(panel).find(".maximize-button").bind("click", this.maximize.bind(this) );
		$(panel).find(".hide-button").bind("click", this.hide.bind(this) );

		this.makeDialog(options);
	}

	Dialog.prototype.add = function( litegui_item )
	{
		this.content.appendChild( litegui_item.root );
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

		//$(panel).bind("click",function(){});

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
		if(this.resizable) return;

		var root = this.root;
		this.resizable = true;
		var footer = this.footer;
		footer.style.minHeight = "4px";

		$(footer).addClass("resizable");

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
			$(parent).append(panel)
		else
			parent.appendChild(panel); 
	}

	Dialog.prototype.addButton = function(name,options)
	{
		var that = this;
		var button = document.createElement("button");

		button.innerHTML = name;
		if(options.className) button.className = options.className;

		$(this.root).find(".panel-footer").append(button);

		$(button).bind("click", function(e) { 
			if(options.callback)
				options.callback(this);

			if(options.close)
				that.close();
		});

		return button;
	}

	/*
	Panel.prototype.open = function(v) {
		$(this).trigger("opened");

		if(!v)
		{
			$(this.root).remove();
			return
		}

		$(this.root).hide('fade',null,function() {
			$(this).remove();
		});
	}
	*/	

	Dialog.prototype.close = function() {
		$(this.root).remove();
		$(this).trigger("closed");

		/*
		var that = this;
		if(fade_out == true)
		{
			$(this.root).hide('fade',null,function() {
				$(that.root).remove();
			});
		}
		else
		{
			$(this.root).remove();
			return;
		}
		*/
	}

	Dialog.minimized = [];

	Dialog.prototype.minimize = function() {
		if(this.minimized) return;

		this.minimized = true;
		this.old_pos = $(this.root).position();

		$(this.root).find(".content").hide();
		$(this.root).draggable({ disabled: true });
		$(this.root).find(".minimize-button").hide();
		$(this.root).find(".maximize-button").show();
		$(this.root).css({width: LiteGUI.Dialog.MINIMIZED_WIDTH});


		$(this).bind("closed", function() {
			LiteGUI.Dialog.minimized.splice( LiteGUI.Dialog.minimized.indexOf( this ), 1);
			LiteGUI.Dialog.arrangeMinimized();
		});

		LiteGUI.Dialog.minimized.push( this );
		LiteGUI.Dialog.arrangeMinimized();

		$(this).trigger("minimizing");
	}

	Dialog.arrangeMinimized = function()
	{
		for(var i in LiteGUI.Dialog.minimized)
		{
			var dialog = LiteGUI.Dialog.minimized[i];
			var parent = dialog.root.parentNode;
			var pos = $(parent).height() - 20;
			$(panel.root).animate({ left: LiteGUI.Dialog.MINIMIZED_WIDTH * i, top: pos + "px" },100);
		}
	}

	Dialog.prototype.maximize = function() {
		if(!this.minimized) return;
		this.minimized = false;

		$(this.root).find(".content").show();
		$(this.root).draggable({ disabled: false });
		$(this.root).animate({ left: this.old_pos.left+"px" , top: this.old_pos.top + "px", width: this.width },100);
		$(this.root).find(".minimize-button").show();
		$(this.root).find(".maximize-button").hide();

		LiteGUI.Dialog.minimized.splice( LiteGUI.Dialog.minimized.indexOf( this ), 1);
		LiteGUI.Dialog.arrangeMinimized();
		$(this).trigger("maximizing");
	}

	Dialog.prototype.makeModal = function()
	{
		LiteGUI.showModalBackground(true);
		LiteGUI.modalbg_div.appendChild( this.root ); //add panel
		//$(this.root).draggable({ disabled: true });
		this.show();
		this.center();

		$(this).bind("closed", inner );

		function inner(e)
		{
			LiteGUI.showModalBackground(false);
		}
	}

	Dialog.prototype.bringToFront = function()
	{
		var parent = $(this.root).parent();
		parent.detach(this.root);
		parent.attach(this.root);
	}

	Dialog.prototype.show = function(v,callback)
	{
		if(!this.root.parentNode)
			LiteGUI.add(this);

		//$(this.root).show(v,null,100,callback);
		$(this.root).show();
		$(this).trigger("shown");
	}

	Dialog.prototype.hide = function(v,callback)
	{
		//$(this.root).hide(v,null,100,callback);
		$(this.root).hide();
		$(this).trigger("hidden");
	}

	Dialog.prototype.setPosition = function(x,y)
	{
		this.root.position = "absolute";
		this.root.style.left = x + "px";
		this.root.style.top = y + "px";
	}

	Dialog.prototype.setSize = function(w,h)
	{
		this.root.style.width = w + "px";
		this.root.style.height = h + "px";
	}

	Dialog.prototype.center = function()
	{
		this.root.position = "absolute";
		this.root.style.left = Math.floor(( $(this.root.parentNode).width() - $(this.root).width() ) * 0.5) + "px";
		this.root.style.top = Math.floor(( $(this.root.parentNode).height() - $(this.root).height() ) * 0.5) + "px";
	}

	Dialog.prototype.adjustSize = function()
	{
		this.content.style.height = "auto";
		var width = $(this.content).width();
		var height = $(this.content).height() + 20;

		this.setSize(width,height);
	}


	LiteGUI.Panel = Panel;
	LiteGUI.Dialog = Dialog;
})();