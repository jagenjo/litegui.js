//enclose in a scope
(function(){


	function Button(value,options)
	{
		options = options || {};

		if(typeof(options) === "function")
			options = { callback: options };

		var that = this;
		var element = document.createElement("div");
		element.className = "litegui button";

		this.root = element;
		var button = document.createElement("button");
		this.content = button;
		element.appendChild(button);

		button.innerHTML = value;		
		button.addEventListener("click", function(e) { 
			that.click();
		});

		this.click = function()
		{
			if(options.callback)
				options.callback.call(that);
		}
	}

	LiteGUI.Button = Button;

	/**
	* SearchBox 
	*
	* @class SearchBox
	* @constructor
	* @param {*} value
	* @param {Object} options
	*/

	function SearchBox(value, options)
	{
		options = options || {};
		var element = document.createElement("div");
		element.className = "litegui searchbox";
		var placeholder = (options.placeholder != null ? options.placeholder : "Search");
		element.innerHTML = "<input value='"+value+"' placeholder='"+ placeholder +"'/>";
		this.input = element.querySelector("input");
		this.root = element;
		var that = this;

		$(this.input).change( function(e) { 
			var value = e.target.value;
			if(options.callback)
				options.callback.call(that,value);
		});
	}

	SearchBox.prototype.setValue = function(v) { $(this.input).val(v).change(); };
	SearchBox.prototype.getValue = function() { return $(this.input).val(); };

	LiteGUI.SearchBox = SearchBox;

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
		element.style.width = options.width || "100%";
		element.style.height = options.height || "100%";

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
			splitinfo = " - 5px";
			splitbar = document.createElement("div");
			splitbar.className = "litesplitbar " + direction;
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
			document.addEventListener("mousemove",inner_mousemove);
			document.addEventListener("mouseup",inner_mouseup);
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
			document.removeEventListener("mousemove",inner_mousemove);
			document.removeEventListener("mouseup",inner_mouseup);
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
		var splitinfo = " - 2px";

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
				var size = ($(area2.root).height() + delta) + "px";
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
	}

	Area.prototype.setAreaSize = function(area,size)
	{
		var element = this.sections[1];

		var splitinfo = " - 2px";
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
		this.content.appendChild( v.root || v );
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
	}

	LiteGUI.Split = Split;



	/**
	* ContextualMenu 
	*
	* @class ContextualMenu
	* @constructor
	* @param {Array} values
	*/

	function ContextualMenu(values,options)
	{
		options = options || {};
		this.options = options;
		var that = this;

		var root = document.createElement("div");
		root.className = "litecontextualmenu litemenubar-panel";
		root.style.minWidth = 100;
		root.style.minHeight = 100;
		this.root = root;
		
		for(var i in values)
		{
			var element = document.createElement("div");
			element.className = "litemenu-entry submenu";

			element.dataset["value"] = values[i];
			element.innerHTML = values.constructor == Array ? values[i] : i;
			root.appendChild(element);
		}

		$(root).find(".litemenu-entry").click(function(e) {
			var value = this.dataset["value"];
			if(options.callback)
				options.callback.call(that, value );
			document.body.removeChild(root);
		});

		$(root).mouseleave(function(e) {
			document.body.removeChild(root);
		});

		//insert before checking position
		document.body.appendChild(root);

		var left = options.left || 0;
		var top = options.top || 0;
		if(options.event)
		{
			left = (options.event.pageX - 10);
			top = (options.event.pageY - 10);

			var rect = document.body.getClientRects()[0];
			if(left > (rect.width - $(root).width() - 10))
				left = (rect.width - $(root).width() - 10);
			if(top > (rect.height - $(root).height() - 10))
				top = (rect.height - $(root).height() - 10);
		}

		root.style.left = left + "px";
		root.style.top = top  + "px";
	}

	LiteGUI.ContextualMenu = ContextualMenu;


	//the tiny box to expand the children of a node
	function createLitebox(state, on_change)
	{
		var element = document.createElement("span");
		element.className = "listbox listopen";
		element.innerHTML = "";
		element.dataset["value"] = state ? "open" : "closed";
		element.addEventListener("click", onClick );
		element.on_change_callback = on_change;

		element.setEmpty = function(v)
		{
			if(v)
				$(this).addClass("empty");
			else
				$(this).removeClass("empty");
		}

		element.setValue = function(v)
		{
			if(this.dataset["value"] == (v ? "open" : "closed"))
				return;

			if(!v)
			{
				this.dataset["value"] = "closed";
				//this.innerHTML = "+";
				$(this).removeClass("listopen");
				$(this).addClass("listclosed");
			}
			else
			{
				this.dataset["value"] = "open";
				//this.innerHTML = "-";
				$(this).addClass("listopen");
				$(this).removeClass("listclosed");
			}

			if(on_change)
				on_change( this.dataset["value"] );
		}

		function onClick(e) {
			console.log("CLICK");
			var box = e.target;
			box.setValue( this.dataset["value"] == "open" ? false : true );
		}

		return element;
	}	

	LiteGUI.createLitebox = createLitebox;

	/**
	* List 
	*
	* @class List
	* @constructor
	* @param {String} id
	* @param {Array} values
	* @param {Object} options
	*/
	function List(id,items,options)
	{
		options = options || {};

		var root = document.createElement("ul");
		this.root = root;
		root.id = id;
		root.className = "litelist";
		this.items = [];
		var that = this;

		this.callback = options.callback;

		//walk over every item in the list
		for(var i in items)
		{
			var item = document.createElement("li");
			item.className = "list-item";
			item.data = items[i];

			var content = "";
			if(typeof(items[i]) == "string")
				content = items[i] + "<span class='arrow'></span>";
			else
			{
				content = (items[i].name || items[i].title || "") + "<span class='arrow'></span>";
				if(items[i].id)	item.id = items[i].id;
			}
			item.innerHTML = content;

			root.appendChild(item);
		}

		$(root).find(".list-item").click( function() {
			$(root).find(".list-item.selected").removeClass("selected");
			$(this).addClass("selected");

			$(that.root).trigger("wchanged", this);
			if(that.callback)
				that.callback( this.data  );
		});

		if(options.parent)
		{
			if(options.parent.root)
				$(options.parent.root).append(root);
			else
				$(options.parent).append(root);
		}
	}

	LiteGUI.List = List;

	/**
	* Slider 
	*
	* @class Slider
	* @constructor
	* @param {Number} value
	* @param {Object} options
	*/
	function Slider(value, options)
	{
		options = options || {};
		var canvas = document.createElement("canvas");
		canvas.className = "slider " + (options.extraclass ? options.extraclass : "");
		canvas.width = 100;
		canvas.height = 1;
		canvas.style.position = "relative";
		canvas.style.width = "calc( 100% - 2em )";
		canvas.style.height = "1.2em";
		this.root = canvas;
		var that = this;
		this.value = value;

		this.setValue = function(value)
		{
			//var width = canvas.getClientRects()[0].width;
			var ctx = canvas.getContext("2d");
			var min = options.min || 0.0;
			var max = options.max || 1.0;
			if(value < min) value = min;
			else if(value > max) value = max;
			var range = max - min;
			var norm = (value - min) / range;
			ctx.clearRect(0,0,canvas.width,canvas.height);
			ctx.fillStyle = "#999";
			ctx.fillRect(0,0, canvas.width * norm, canvas.height);
			ctx.fillStyle = "#DA2";
			ctx.fillRect(canvas.width * norm - 1,0,2, canvas.height);

			if(value != this.value)
			{
				this.value = value;
				$(this.root).trigger("change", value );
			}
		}

		function setFromX(x)
		{
			var width = canvas.getClientRects()[0].width;
			var norm = x / width;
			var min = options.min || 0.0;
			var max = options.max || 1.0;
			var range = max - min;
			that.setValue( range * norm + min );
		}

		canvas.addEventListener("mousedown", function(e) {
			var mouseX, mouseY;
			if(e.offsetX) { mouseX = e.offsetX; mouseY = e.offsetY; }
			else if(e.layerX) { mouseX = e.layerX; mouseY = e.layerY; }	
			setFromX(mouseX);
			document.addEventListener("mousemove", onMouseMove );
			document.addEventListener("mouseup", onMouseUp );
    	});

		function onMouseMove(e)
		{
			var rect = canvas.getClientRects()[0];
			var x = e.x === undefined ? e.pageX : e.x;
			var mouseX = x - rect.left;
			setFromX(mouseX);
			e.preventDefault();
			return false;
		}

		function onMouseUp(e)
		{
			document.removeEventListener("mousemove", onMouseMove );
			document.removeEventListener("mouseup", onMouseUp );
			e.preventDefault();
			return false;
		}

		this.setValue(value);
	}

	LiteGUI.Slider = Slider;

	/**
	* LineEditor 
	*
	* @class LineEditor
	* @constructor
	* @param {Number} value
	* @param {Object} options
	*/

	function LineEditor(value, options)
	{
		options = options || {};
		var element = document.createElement("div");
		element.className = "curve " + (options.extraclass ? options.extraclass : "");
		element.style.minHeight = "50px";
		element.style.width = options.width || "100%";

		element.bgcolor = options.bgcolor || "#222";
		element.pointscolor = options.pointscolor || "#5AF";
		element.linecolor = options.linecolor || "#444";

		element.value = value || [];
		element.xrange = options.xrange || [0,1]; //min,max
		element.yrange = options.yrange || [0,1]; //min,max
		element.defaulty = options.defaulty != null ? options.defaulty : 0.5;
		element.no_trespassing = options.no_trespassing || false;
		element.show_samples = options.show_samples || 0;
		element.options = options;

		var canvas = document.createElement("canvas");
		canvas.width = options.width || 200;
		canvas.height = options.height || 50;
		element.appendChild(canvas);
		element.canvas = canvas;

		$(canvas).bind("mousedown",onmousedown);
		$(element).resize(onresize);

		element.getValueAt = function(x)
		{
			if(x < element.xrange[0] || x > element.xrange[1])
				return element.defaulty;

			var last = [ element.xrange[0], element.defaulty ];
			var f = 0;
			for(var i = 0; i < element.value.length; i += 1)
			{
				var v = element.value[i];
				if(x == v[0]) return v[1];
				if(x < v[0])
				{
					f = (x - last[0]) / (v[0] - last[0]);
					return last[1] * (1-f) + v[1] * f;
				}
				last = v;
			}

			v = [ element.xrange[1], element.defaulty ];
			f = (x - last[0]) / (v[0] - last[0]);
			return last[1] * (1-f) + v[1] * f;
		}

		element.resample = function(samples)
		{
			var r = [];
			var dx = (element.xrange[1] - element.xrange[0]) / samples;
			for(var i = element.xrange[0]; i <= element.xrange[1]; i += dx)
			{
				r.push( element.getValueAt(i) );
			}
			return r;
		}

		element.addValue = function(v)
		{
			for(var i = 0; i < element.value; i++)
			{
				var value = element.value[i];
				if(value[0] < v[0]) continue;
				element.value.splice(i,0,v);
				redraw();
				return;
			}

			element.value.push(v);
			redraw();
		}

		//value to canvas
		function convert(v)
		{
			return [ canvas.width * ( (element.xrange[1] - element.xrange[0]) * v[0] + element.xrange[0]),
				canvas.height * ((element.yrange[1] - element.yrange[0]) * v[1] + element.yrange[0])];
		}

		//canvas to value
		function unconvert(v)
		{
			return [(v[0] / canvas.width - element.xrange[0]) / (element.xrange[1] - element.xrange[0]),
					(v[1] / canvas.height - element.yrange[0]) / (element.yrange[1] - element.yrange[0])];
		}

		var selected = -1;

		element.redraw = function()
		{
			var ctx = canvas.getContext("2d");
			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.translate(0,canvas.height);
			ctx.scale(1,-1);

			ctx.fillStyle = element.bgcolor;
			ctx.fillRect(0,0,canvas.width,canvas.height);

			ctx.strokeStyle = element.linecolor;
			ctx.beginPath();

			//draw line
			var pos = convert([element.xrange[0],element.defaulty]);
			ctx.moveTo( pos[0], pos[1] );

			for(var i in element.value)
			{
				var value = element.value[i];
				pos = convert(value);
				ctx.lineTo( pos[0], pos[1] );
			}

			pos = convert([element.xrange[1],element.defaulty]);
			ctx.lineTo( pos[0], pos[1] );
			ctx.stroke();

			//draw points
			for(var i = 0; i < element.value.length; i += 1)
			{
				var value = element.value[i];
				pos = convert(value);
				if(selected == i)
					ctx.fillStyle = "white";
				else
					ctx.fillStyle = element.pointscolor;
				ctx.beginPath();
				ctx.arc( pos[0], pos[1], selected == i ? 4 : 2, 0, Math.PI * 2);
				ctx.fill();
			}

			if(element.show_samples)
			{
				var samples = element.resample(element.show_samples);
				ctx.fillStyle = "#888";
				for(var i = 0; i < samples.length; i += 1)
				{
					var value = [ i * ((element.xrange[1] - element.xrange[0]) / element.show_samples) + element.xrange[0], samples[i] ];
					pos = convert(value);
					ctx.beginPath();
					ctx.arc( pos[0], pos[1], 2, 0, Math.PI * 2);
					ctx.fill();
				}
			}
		}

		var last_mouse = [0,0];
		function onmousedown(evt)
		{
			$(document).bind("mousemove",onmousemove);
			$(document).bind("mouseup",onmouseup);

			var rect = canvas.getBoundingClientRect();
			var mousex = evt.clientX - rect.left;
			var mousey = evt.clientY - rect.top;

			selected = computeSelected(mousex,canvas.height-mousey);

			if(selected == -1)
			{
				var v = unconvert([mousex,canvas.height-mousey]);
				element.value.push(v);
				sortValues();
				selected = element.value.indexOf(v);
			}

			last_mouse = [mousex,mousey];
			element.redraw();
			evt.preventDefault();
			evt.stopPropagation();
		}

		function onmousemove(evt)
		{
			var rect = canvas.getBoundingClientRect();
			var mousex = evt.clientX - rect.left;
			var mousey = evt.clientY - rect.top;

			if(mousex < 0) mousex = 0;
			else if(mousex > canvas.width) mousex = canvas.width;
			if(mousey < 0) mousey = 0;
			else if(mousey > canvas.height) mousey = canvas.height;

			//dragging to remove
			if( selected != -1 && distance( [evt.clientX - rect.left, evt.clientY - rect.top], [mousex,mousey] ) > canvas.height * 0.5 )
			{
				element.value.splice(selected,1);
				onmouseup(evt);
				return;
			}

			var dx = last_mouse[0] - mousex;
			var dy = last_mouse[1] - mousey;
			var delta = unconvert([-dx,dy]);
			if(selected != -1)
			{
				var minx = element.xrange[0];
				var maxx = element.xrange[1];

				if(element.no_trespassing)
				{
					if(selected > 0) minx = element.value[selected-1][0];
					if(selected < (element.value.length-1) ) maxx = element.value[selected+1][0];
				}

				var v = element.value[selected];
				v[0] += delta[0];
				v[1] += delta[1];
				if(v[0] < minx) v[0] = minx;
				else if(v[0] > maxx) v[0] = maxx;
				if(v[1] < element.yrange[0]) v[1] = element.yrange[0];
				else if(v[1] > element.yrange[1]) v[1] = element.yrange[1];
			}

			sortValues();
			element.redraw();
			last_mouse[0] = mousex;
			last_mouse[1] = mousey;
			onchange();

			evt.preventDefault();
			evt.stopPropagation();
		}

		function onmouseup(evt)
		{
			selected = -1;
			element.redraw();
			$(document).unbind("mousemove",onmousemove);
			$(document).unbind("mouseup",onmouseup);
			onchange();
			evt.preventDefault();
			evt.stopPropagation();
		}

		function onresize(e)
		{
			canvas.width = $(this).width();
			canvas.height = $(this).height();
			element.redraw();
		}
		
		function onchange()
		{
			if(options.callback)
				options.callback.call(element,element.value);
			else
				$(element).change();
		}

		function distance(a,b) { return Math.sqrt( Math.pow(b[0]-a[0],2) + Math.pow(b[1]-a[1],2) ); };

		function computeSelected(x,y)
		{
			var min_dist = 100000;
			var max_dist = 8; //pixels
			var selected = -1;
			for(var i=0; i < element.value.length; i++)
			{
				var value = element.value[i];
				var pos = convert(value);
				var dist = distance([x,y],pos);
				if(dist < min_dist && dist < max_dist)
				{
					min_dist = dist;
					selected = i;
				}
			}
			return selected;
		}

		function sortValues()
		{
			var v = null;
			if(selected != -1)
				v = element.value[selected];
			element.value.sort(function(a,b) { return a[0] > b[0]; });
			if(v)
				selected = element.value.indexOf(v);
		}
		
		element.redraw();
		return element;
	}

	LiteGUI.LineEditor = LineEditor;

})();