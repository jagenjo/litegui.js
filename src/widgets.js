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


	/**
	* ContextualMenu 
	*
	* @class ContextualMenu
	* @constructor
	* @param {Array} values (allows object { title: "Nice text", callback: function ... })
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
		root.style.pointerEvents = "none";
		setTimeout(function() { root.style.pointerEvents = "auto"; },100); //delay so the mouse up event is not caugh by this element


		this.root = root;
		
		for(var i in values)
		{
			var element = document.createElement("div");
			element.className = "litemenu-entry submenu";

			var name = values.constructor == Array ? values[i] : i;
			var value = values[i];

			element.innerHTML = value && value.title ? value.title : name;
			element.value = value;

			if(typeof(value) == "function")
			{
				element.dataset["value"] = name;
				element.onclick_callback = value;
			}
			else if(typeof(value) == "object")
			{
				if(value.callback)
					element.addEventListener("click", function(e) { this.value.callback.apply( this, this.value ); });
			}
			else
				element.dataset["value"] = value;

			root.appendChild(element);
			element.addEventListener("click", inner_onclick);
		}

		//option clicked
		function inner_onclick(e) {
			var value = this.value;
			if(options.callback)
				options.callback.call(that, value, options );
			if(root.parentNode)
				root.parentNode.removeChild( root );
		}

		//if(0)
		root.addEventListener("mouseleave", function(e) {
			if(this.parentNode)
				this.parentNode.removeChild( this );
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
	function Checkbox( value, on_change)
	{
		var that = this;

		var root = this.root = document.createElement("span");
		root.className = "litecheckbox inputfield";
		root.dataset["value"] = value;

		var element = this.element =document.createElement("span");
		element.className = "fixed flag checkbox "+(value ? "on" : "off");
		root.appendChild( element );
		
		root.addEventListener("click", onClick.bind(this) );

		function onClick(e) {
			this.setValue( this.root.dataset["value"] != "true" );
			e.preventDefault();
			e.stopPropagation();
		}

		this.setValue = function(v)
		{
			if( this.root.dataset["value"] == v.toString())
				return;

			this.root.dataset["value"] = v;
			if(v)
			{
				this.element.classList.remove("off");
				this.element.classList.add("on");
			}
			else
			{
				this.element.classList.remove("on");
				this.element.classList.add("off");
			}

			if(on_change)
				on_change( v );
		}

		this.getValue = function()
		{
			return this.root.dataset["value"] == "true";
		}
	}	

	LiteGUI.Checkbox = Checkbox;


	//the tiny box to expand the children of a node
	function createLitebox(state, on_change)
	{
		var element = document.createElement("span");
		element.className = "listbox " + (state ? "listopen" : "listclosed");
		element.innerHTML = state ? "&#9660;" : "&#9658;";
		element.dataset["value"] = state ? "open" : "closed";
		element.addEventListener("click", onClick );
		element.on_change_callback = on_change;

		element.setEmpty = function(v)
		{
			if(v)
				this.classList.add("empty");
			else
				this.classList.remove("empty");
		}

		element.setValue = function(v)
		{
			if(this.dataset["value"] == (v ? "open" : "closed"))
				return;

			if(!v)
			{
				this.dataset["value"] = "closed";
				this.innerHTML = "&#9658;";
				this.classList.remove("listopen");
				this.classList.add("listclosed");
			}
			else
			{
				this.dataset["value"] = "open";
				this.innerHTML = "&#9660;";
				this.classList.add("listopen");
				this.classList.remove("listclosed");
			}

			if(on_change)
				on_change( this.dataset["value"] );
		}

		element.getValue = function()
		{
			return this.dataset["value"];
		}

		function onClick(e) {
			console.log("CLICK");
			var box = e.target;
			box.setValue( this.dataset["value"] == "open" ? false : true );
			if(this.stopPropagation)
				e.stopPropagation();
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