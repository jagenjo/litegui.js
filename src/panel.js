//enclose in a scope
(function(){
	
	/****************** PANEL **************/
	function Panel(id, options)
	{
		options = options || {};
		this.width = options.width || 200;
		this.height = options.height || 100;
		this.content = options.content || "";

		var panel = document.createElement("div");
		panel.id = id;
		panel.className = "litepanel " + (options.className || "");
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

	Panel.MINIMIZED_WIDTH = 200;
	Panel.title_height = "20px";

	Panel.prototype.makeDialog = function(options)
	{
		options = options || {};

		var panel = this.root;
		panel.style.position = "absolute";
		panel.style.display = "none";
		panel.style.width = this.width + "px";
		if(this.height)
			panel.style.height = this.height + "px";

		if(this.height)
			$(panel).find(".content").css({height: this.height - 24});

		panel.style.boxShadow = "0 0 3px black";

		if(options.draggable)
		{
			this.draggable = true;
			$(panel).draggable({handle:".panel-header"});
		}

		if(options.resizable)
			this.setResizable();

		//$(panel).bind("click",function(){});

		var parent = options.parent || LiteGUI.root_container;
		$(parent).append(this.root);

		this.center();
	}

	Panel.prototype.setResizable = function()
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

	Panel.prototype.dockTo = function(parent, dock_type)
	{
		if(!parent) return;
		var panel = this.root;

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

	Panel.prototype.addButton = function(name,options)
	{
		var that = this;
		var button = document.createElement("button");

		button.innerHTML = name;
		if(options.className) button.className = options.className;

		$(this.root).find(".panel-footer").append(button);

		$(button).bind("click", function() { 
			if(options.callback)
				options.callback();

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
			//trace("Panel closed");
			$(this.root).remove();
			return
		}

		$(this.root).hide('fade',null,function() {
			//trace("Panel closed");
			$(this).remove();
		});
	}
	*/	

	Panel.prototype.close = function(v) {
		$(this).trigger("closed");

		if(!v)
		{
			//trace("Panel closed");
			$(this.root).remove();
			return;
		}

		$(this.root).hide('fade',null,function() {
			//trace("Panel closed");
			$(this.root).remove();
		});
	}

	Panel.minimized = [];

	Panel.prototype.minimize = function() {
		if(this.minimized) return;

		this.minimized = true;
		this.old_pos = $(this.root).position();

		$(this.root).find(".content").hide();
		$(this.root).draggable({ disabled: true });
		$(this.root).find(".minimize-button").hide();
		$(this.root).find(".maximize-button").show();
		$(this.root).css({width: LiteGUI.Panel.MINIMIZED_WIDTH});


		$(this).bind("closed", function() {
			LiteGUI.Panel.minimized.splice( LiteGUI.Panel.minimized.indexOf( this ), 1);
			LiteGUI.Panel.arrangeMinimized();
		});

		LiteGUI.Panel.minimized.push( this );
		LiteGUI.Panel.arrangeMinimized();

		$(this).trigger("minimizing");
	}

	Panel.arrangeMinimized = function()
	{
		for(var i in LiteGUI.Panel.minimized)
		{
			var panel = LiteGUI.Panel.minimized[i];
			var parent = panel.root.parentNode;
			var pos = $(parent).height() - 20;
			$(panel.root).animate({ left: LiteGUI.Panel.MINIMIZED_WIDTH * i, top: pos + "px" },100);
		}
	}

	Panel.prototype.maximize = function() {
		if(!this.minimized) return;
		this.minimized = false;

		$(this.root).find(".content").show();
		$(this.root).draggable({ disabled: false });
		$(this.root).animate({ left: this.old_pos.left+"px" , top: this.old_pos.top + "px", width: this.width },100);
		$(this.root).find(".minimize-button").show();
		$(this.root).find(".maximize-button").hide();

		LiteGUI.Panel.minimized.splice( LiteGUI.Panel.minimized.indexOf( this ), 1);
		LiteGUI.Panel.arrangeMinimized();
		$(this).trigger("maximizing");
	}

	Panel.prototype.makeModal = function()
	{
		LiteGUI.showModalBackground(true);
		$(LiteGUI.modalbg_div).append( this.root ); //add panel
		$(this.root).draggable({ disabled: true });
		this.show();
		this.center();

		$(this).bind("closed", inner );

		function inner(e)
		{
			trace("closing");
			LiteGUI.showModalBackground(false);
		}
	}

	Panel.prototype.bringToFront = function()
	{
		var parent = $(this.root).parent();
		parent.detach(this.root);
		parent.attach(this.root);
	}

	Panel.prototype.show = function(v,callback)
	{
		$(this.root).show(v,null,100,callback);
		$(this).trigger("shown");
	}

	Panel.prototype.hide = function(v,callback)
	{
		$(this.root).hide(v,null,100,callback);
		$(this).trigger("hidden");
	}

	Panel.prototype.setPosition = function(x,y)
	{
		this.root.position = "absolute";
		this.root.style.left = x + "px";
		this.root.style.top = y + "px";
	}

	Panel.prototype.setSize = function(w,h)
	{
		this.root.style.width = w + "px";
		this.root.style.height = h + "px";
	}

	Panel.prototype.center = function()
	{
		this.root.position = "absolute";
		this.root.style.left = Math.floor(( $(this.root.parentNode).width() - $(this.root).width() ) * 0.5) + "px";
		this.root.style.top = Math.floor(( $(this.root.parentNode).height() - $(this.root).height() ) * 0.5) + "px";
	}

	Panel.prototype.adjustSize = function()
	{
		this.content.style.height = "auto";
		var width = $(this.content).width();
		var height = $(this.content).height() + 20;

		this.setSize(width,height);
	}


	LiteGUI.Panel = Panel;
	LiteGUI.Dialog = Panel;
})();