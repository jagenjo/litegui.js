//enclose in a scope
(function(){

	/****************** PANEL **************/
	function Panel(id, options)
	{
		this._ctor(id,options);
	}

	Panel.title_height = "20px";

	Panel.prototype._ctor = function(id, options)
	{
		if(!options && id && id.constructor !== String)
		{
			options = id;
			id = null;
		}

		options = options || {};

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

		if(options.width)
			this.root.style.width = LiteGUI.sizeToCSS( options.width );
		if(options.height)
			this.root.style.height = LiteGUI.sizeToCSS( options.height );
		if(options.position)
		{
			this.root.style.position = "absolute";
			this.root.style.left = LiteGUI.sizeToCSS( options.position[0] );
			this.root.style.top = LiteGUI.sizeToCSS( options.position[1] );
		}

		//if(options.scroll == false)	this.content.style.overflow = "hidden";
		if(options.scroll == true)
			this.content.style.overflow = "auto";
	}

	Panel.prototype.add = function( litegui_item )
	{
		this.content.appendChild( litegui_item.root );
	}

	Panel.prototype.clear = function()
	{
		while (this.content.firstChild)
			this.content.removeChild(this.content.firstChild);
	}

	LiteGUI.Panel = Panel;
})();