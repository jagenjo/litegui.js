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

	LiteGUI.Panel = Panel;
})();