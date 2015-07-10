//enclose in a scope
(function(){

	
	/****************** AREA **************/
	/**
	* Areas can be split several times horizontally or vertically to fit different colums or rows
	*
	* @class Area
	* @constructor
	*/
	function Area(id, options)
	{
		options = options || {};
		/* the root element containing all sections */
		var element = document.createElement("div");
		element.className = "litearea";
		if(id) element.id = id;
		this.root = element;
		this.root.litearea = this; //dbl link

		var width = options.width || "100%";
		var height = options.height || "100%";

		if( width < 0 )
			width = 'calc( 100% - '+Math.abs(width)+'px)';
		if( height < 0 )
			height = 'calc( 100% - '+ Math.abs(height)+'px)';

		element.style.width = width;
		element.style.height = height;

		this.options = options;

		var that = this;
		window.addEventListener("resize",function(e) { that.resize(e); });
		//$(this).bind("resize",function(e) { that.resize(e); });

		this._computed_size = [ $(this.root).width(), $(this.root).height() ];

		var content = document.createElement("div");
		if(options.content_id)
			content.id = options.content_id;
		content.className = "liteareacontent";
		content.style.width = "100%";
		content.style.height = "100%";
		this.root.appendChild(content);
		this.content = content;

		this.split_direction = "none";
		this.sections = [];

		if(options.autoresize)
			$(LiteGUI).bind("resized", function() { 
				that.resize(); 
			});
	}

	Area.splitbar_size = 4;

	/* get container of the section */
	Area.prototype.getSection = function(num)
	{
		num = num || 0;
		if(this.sections.length > num)
			return this.sections[num];
		return null;
	}

	Area.prototype.resize = function(e)
	{
		var computed_size = [ $(this.root).width(), $(this.root).height() ];
		if( e && this._computed_size && computed_size[0] == this._computed_size[0] && computed_size[1] == this._computed_size[1])
			return;

		this.sendResizeEvent(e);
	}

	Area.prototype.adjustHeight = function()
	{
		if(!this.root.parentNode)
		{
			console.error("Cannot adjust height of LiteGUI.Area without parent");
			return;
		}

		//check parent height
		var h = this.root.parentNode.offsetHeight;

		//check position
		var y = this.root.getClientRects()[0].top;

		//adjust height
		this.root.style.height = "calc( 100% - " + y + "px )";
	}

	Area.prototype.sendResizeEvent = function(e)
	{
		if(this.sections.length)
			for(var i in this.sections)
			{
				var section = this.sections[i];
				section.resize(e);
				//$(section).trigger("resize"); //it is a LiteArea
				//$(section.root).trigger("resize");
				/*
				for (var j = 0; j < section.root.childNodes.length; j++)
					$(section.root.childNodes[j]).trigger("resize");
				*/
			}
		else //send it to the children
		{
			for (var j = 0; j < this.root.childNodes.length; j++)
			{
				var element = this.root.childNodes[j];
				if(element.litearea)
					element.litearea.resize();
				else
					$(element).trigger("resize");
			}
		}

		if( this.onresize )
			this.onresize();
	}

	Area.prototype.split = function(direction, sizes, editable)
	{
		direction = direction || "vertical";

		if(this.sections.length) throw "cannot split twice";

		//create areas
		var area1 = new LiteGUI.Area(null, { content_id: this.content.id });
		area1.root.style.display = "inline-block";
		var area2 = new LiteGUI.Area();
		area2.root.style.display = "inline-block";

		var splitinfo = "";
		var splitbar = null;
		var dynamic_section = null;
		if(editable)
		{
			splitinfo = " - " + (Area.splitbar_size + 2) +"px"; //2 px margin ¿?
			splitbar = document.createElement("div");
			splitbar.className = "litesplitbar " + direction;
			if(direction == "vertical")
				splitbar.style.height = Area.splitbar_size + "px";
			else
				splitbar.style.width = Area.splitbar_size + "px";
			this.splitbar = splitbar;
			splitbar.addEventListener("mousedown", inner_mousedown);
		}

		sizes = sizes || ["50%",null];

		if(direction == "vertical")
		{
			area1.root.style.width = "100%";
			area2.root.style.width = "100%";

			if(sizes[0] == null)
			{
				var h = sizes[1];
				if(typeof(h) == "number")
					h = sizes[1] + "px";

				area1.root.style.height = "-moz-calc( 100% - " + h + splitinfo + " )";
				area1.root.style.height = "-webkit-calc( 100% - " + h + splitinfo + " )";
				area1.root.style.height = "calc( 100% - " + h + splitinfo + " )";
				area2.root.style.height = h;
				area2.size = h;
				dynamic_section = area1;
			}
			else if(sizes[1] == null)
			{
				var h = sizes[0];
				if(typeof(h) == "number")
					h = sizes[0] + "px";

				area1.root.style.height = h;
				area1.size = h;
				area2.root.style.height = "-moz-calc( 100% - " + h + splitinfo + " )";
				area2.root.style.height = "-webkit-calc( 100% - " + h + splitinfo + " )";
				area2.root.style.height = "calc( 100% - " + h + splitinfo + " )";
				dynamic_section = area2;
			}
			else
			{
				var h1 = sizes[0];
				if(typeof(h1) == "number")
					h1 = sizes[0] + "px";
				var h2 = sizes[1];
				if(typeof(h2) == "number")
					h2 = sizes[1] + "px";
				area1.root.style.height = h1;
				area1.size = h1;
				area2.root.style.height = h2;
				area2.size = h2;
			}
		}
		else //horizontal
		{
			area1.root.style.height = "100%";
			area2.root.style.height = "100%";

			if(sizes[0] == null)
			{
				var w = sizes[1];
				if(typeof(w) == "number")
					w = sizes[1] + "px";
				area1.root.style.width = "-moz-calc( 100% - " + w + splitinfo + " )";
				area1.root.style.width = "-webkit-calc( 100% - " + w + splitinfo + " )";
				area1.root.style.width = "calc( 100% - " + w + splitinfo + " )";
				area2.root.style.width = w;
				area2.size = sizes[1];
				dynamic_section = area1;
			}
			else if(sizes[1] == null)
			{
				var w = sizes[0];
				if(typeof(w) == "number")
					w = sizes[0] + "px";

				area1.root.style.width = w;
				area1.size = w;
				area2.root.style.width = "-moz-calc( 100% - " + w + splitinfo + " )";
				area2.root.style.width = "-webkit-calc( 100% - " + w + splitinfo + " )";
				area2.root.style.width = "calc( 100% - " + w + splitinfo + " )";
				dynamic_section = area2;
			}
			else
			{
				var w1 = sizes[0];
				if(typeof(w1) == "number")
					w1 = sizes[0] + "px";
				var w2 = sizes[1];
				if(typeof(w2) == "number")
					w2 = sizes[1] + "px";

				area1.root.style.width = w1;
				area1.size = w1;
				area2.root.style.width = w2;
				area2.size = w2;
			}
		}

		area1.root.removeChild( area1.content );
		area1.root.appendChild( this.content );
		area1.content = this.content;

		this.root.appendChild( area1.root );
		if(splitbar)
			this.root.appendChild( splitbar );
		this.root.appendChild( area2.root );

		this.sections = [area1, area2];
		this.dynamic_section = dynamic_section;
		this.direction = direction;

		//SPLITTER DRAGGER INTERACTION
		var that = this;
		var last_pos = [0,0];
		function inner_mousedown(e)
		{
			var doc = that.root.ownerDocument;
			doc.addEventListener("mousemove",inner_mousemove);
			doc.addEventListener("mouseup",inner_mouseup);
			last_pos[0] = e.pageX;
			last_pos[1] = e.pageY;
			e.stopPropagation();
			e.preventDefault();
		}

		function inner_mousemove(e)
		{
			if(direction == "horizontal")
			{
				if (last_pos[0] != e.pageX)
					that.moveSplit(last_pos[0] - e.pageX);
			}
			else if(direction == "vertical")
			{
				if (last_pos[1] != e.pageY)
					that.moveSplit(e.pageY - last_pos[1]);
			}

			last_pos[0] = e.pageX;
			last_pos[1] = e.pageY;
			e.stopPropagation();
			e.preventDefault();
			if(that.options.inmediateResize)
				that.resize();
		}

		function inner_mouseup(e)
		{
			var doc = that.root.ownerDocument;
			doc.removeEventListener("mousemove",inner_mousemove);
			doc.removeEventListener("mouseup",inner_mouseup);
			that.resize();
		}
	}

	Area.prototype.hide = function()
	{
		this.root.style.display = "none";
	}

	Area.prototype.show = function()
	{
		this.root.style.display = "block";
	}

	Area.prototype.showSection = function(num)
	{
		var section = this.sections[num];
		var size = 0;
		
		if(this.direction == "horizontal")
			size = section.root.style.width;
		else
			size = section.root.style.height;

		if(size.indexOf("calc") != -1)
			size = "50%";

		for(var i in this.sections)
		{
			var section = this.sections[i];

			if(i == num)
				section.root.style.display = "inline-block";
			else
			{
				if(this.direction == "horizontal")
					section.root.style.width = "calc( 100% - " + size + " - 5px)";
				else
					section.root.style.height = "calc( 100% - " + size + " - 5px)";
			}
		}

		if(this.splitbar)
			this.splitbar.style.display = "inline-block";

		this.sendResizeEvent();
	}

	Area.prototype.hideSection = function(num)
	{
		for(var i in this.sections)
		{
			var section = this.sections[i];

			if(i == num)
				section.root.style.display = "none";
			else
			{
				if(this.direction == "horizontal")
					section.root.style.width = "100%";
				else
					section.root.style.height = "100%";
			}
		}

		if(this.splitbar)
			this.splitbar.style.display = "none";

		this.sendResizeEvent();
	}

	Area.prototype.moveSplit = function(delta)
	{
		if(!this.sections) return;

		var area1 = this.sections[0];
		var area2 = this.sections[1];
		var splitinfo = " - "+ Area.splitbar_size +"px";

		if(this.direction == "horizontal")
		{

			if (this.dynamic_section == area1)
			{
				var size = ($(area2.root).width() + delta) + "px";
				area1.root.style.width = "-moz-calc( 100% - " + size + splitinfo + " )";
				area1.root.style.width = "-webkit-calc( 100% - " + size + splitinfo + " )";
				area1.root.style.width = "calc( 100% - " + size + splitinfo + " )";
				area2.root.style.width = size;
			}
			else
			{
				var size = ($(area1.root).width() - delta) + "px";
				area1.root.style.width = size;
				area2.root.style.width = "-moz-calc( 100% - " + size + splitinfo + " )";
				area2.root.style.width = "-webkit-calc( 100% - " + size + splitinfo + " )";
				area2.root.style.width = "calc( 100% - " + size + splitinfo + " )";
			}
		}
		else if(this.direction == "vertical")
		{
			if (this.dynamic_section == area1)
			{
				var size = ($(area2.root).height() - delta) + "px";
				area1.root.style.height = "-moz-calc( 100% - " + size + splitinfo + " )";
				area1.root.style.height = "-webkit-calc( 100% - " + size + splitinfo + " )";
				area1.root.style.height = "calc( 100% - " + size + splitinfo + " )";
				area2.root.style.height = size;
			}
			else
			{
				var size = ($(area1.root).height() + delta) + "px";
				area1.root.style.height = size;
				area2.root.style.height = "-moz-calc( 100% - " + size + splitinfo + " )";
				area2.root.style.height = "-webkit-calc( 100% - " + size + splitinfo + " )";
				area2.root.style.height = "calc( 100% - " + size + splitinfo + " )";
			}
		}

		LiteGUI.trigger( this.root, "split_moved");
		var areas = this.root.querySelectorAll(".litearea");
		for(var i = 0; i < areas.length; ++i)
			LiteGUI.trigger( areas[i], "split_moved" );
	}

	Area.prototype.addEventListener = function(a,b,c,d)
	{
		return this.root.addEventListener(a,b,c,d);
	}

	Area.prototype.setAreaSize = function(area,size)
	{
		var element = this.sections[1];

		var splitinfo = " - "+Area.splitbar_size+"px";
		element.root.style.width = "-moz-calc( 100% - " + size + splitinfo + " )";
		element.root.style.width = "-webkit-calc( 100% - " + size + splitinfo + " )";
		element.root.style.width = "calc( 100% - " + size + splitinfo + " )";
	}

	Area.prototype.merge = function(main_section)
	{
		if(this.sections.length == 0) throw "not splitted";

		var main = this.sections[main_section || 0];

		this.root.appendChild( main.content );
		this.content = main.content;

		this.root.removeChild( this.sections[0].root );
		this.root.removeChild( this.sections[1].root );

		/*
		while(main.childNodes.length > 0)
		{
			var e = main.childNodes[0];
			this.root.appendChild(e);
		}

		this.root.removeChild( this.sections[0].root );
		this.root.removeChild( this.sections[1].root );
		*/

		this.sections = [];
		this._computed_size = null;
		this.resize();
	}

	Area.prototype.add = function(v)
	{
		if(typeof(v) == "string")
		{
			var element = document.createElement("div");
			element.innerHTML = v;
			v = element;
		}

		this.content.appendChild( v.root || v );
	}

	Area.prototype.query = function(v)
	{
		return this.root.querySelector(v);
	}

	LiteGUI.Area = Area;

	/***************** SPLIT ******************/

	/**
	* Split 
	*
	* @class Split
	* @constructor
	*/
	function Split(id, sections, options)
	{
		options = options || {};

		var root = document.createElement("div");
		this.root = root;
		root.id = id;
		root.className = "litesplit " + (options.vertical ? "vsplit" : "hsplit");
		this.sections = [];

		for(var i in sections)
		{
			var section = document.createElement("div");

			section.className = "split-section split" + i;
			if(typeof(sections[i]) == "number")
			{
				if(options.vertical)
					section.style.height = sections[i].toFixed(1) + "%";
				else
					section.style.width = sections[i].toFixed(1) + "%";
			}
			else if(typeof(sections[i]) == "string")
			{
				if(options.vertical)
					section.style.height = sections[i];
				else
					section.style.width = sections[i];
			}
			else
			{
				if(sections[i].id) section.id = sections[i].id;
				if(options.vertical)
					section.style.height = (typeof(sections[i].height) == "Number" ? sections[i].height.toFixed(1) + "%" : sections[i].height);
				else
					section.style.width = (typeof(sections[i].width) == "Number" ? sections[i].width.toFixed(1) + "%" : sections[i].width);
			}

			section.add = function(element) {
				this.appendChild( element.root || element );
			}

			this.sections.push(section);
			root.appendChild(section);
		}

		if(options.parent)
		{
			if(options.parent.root)
				options.parent.root.appendChild(root);
			else
				options.parent.appendChild(root);
		}

		this.getSection = function(n)
		{
			return this.sections[n];
		}
	}

	LiteGUI.Split = Split;

})();