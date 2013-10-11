/* Attributes editor panel 
	Dependencies: 
		- jQuery
		- jQuery UI (sliders)
		- jscolor.js
*/

/* LiteWiget options:
	+ name_width: the width of the widget name area

*/

jQuery.fn.wchange = function(callback) {
	$(this[0]).bind("wchange",callback);
};

jQuery.fn.wclick = function(callback) {
	$(this[0]).bind("wclick",callback);
};

function Inspector(id,options)
{
	options = options || {};
	this.root = document.createElement("DIV");
	this.root.className = "inspector " + ( options.full ? "full" : "");
	if(options.one_line)
		this.root.className += " one-line";

	if(id) this.root.id = id;

	this.values = {};
	this.sections = [];
	this.widgets = {};

	this.addSection();
	this.tab_index = Math.floor(Math.random() * 10000);

	if(options.name_width)
		this.widget_name_width = options.name_width;

	if(options.parent) this.appendTo(options.parent);
	this.widgets_per_row = options.widgets_per_row || 1;
}

Inspector.prototype.appendTo = function(parent, at_front)
{
	if(at_front)
		$(parent).prepend(this.root);
	else
		$(parent).append(this.root);
}

Inspector.prototype.clear = function()
{
	$(this.root).empty();

	this.sections = [];
	this.values = {};
	this.widgets = {};

	this.addSection();
}

Inspector.prototype.append = function(widget)
{
	var root = this.root;
	if(this.current_group_content)
		root = this.current_group_content;
	else if(this.current_section_content)
		root = this.current_section_content;
	root.appendChild(widget);
}

Inspector.prototype.setup = function(info)
{
	for(var i in info)
	{
		var w = info[i];
		var widget = this.add(w.type,w.name,w.value,w.options);
	}
}

Inspector.prototype.createWidget = function(name, content, options) 
{
	options = options || {};
	content = content || "";
	var element = document.createElement("DIV");
	element.className = "widget " + (options.className || "");
	element.inspector = this;
	element.options = options;
	element.name = name;
	if(options.width)
	{
		element.style.width = typeof(options.width) == "string" ? options.width : options.width + "px";
		element.style.minWidth = element.style.width;
	}

	if(name)
		this.widgets[name] = element;

	if(this.widgets_per_row != 1)
	{
		if(!options.width)
			element.style.width = (100 / this.widgets_per_row).toFixed(2) + "%";
		element.style.display = "inline-block";
	}

	var namewidth = "";
	var contentwidth = "";
	if(this.widget_name_width || options.widget_name_width)
	{
		var w = this.widget_name_width || options.widget_name_width;
		if(typeof(w) == "number") w = w.toFixed() + "px";
		namewidth = "style='width: calc(" + w + " - 0px); width: -webkit-calc(" + w + " - 0px); width: -moz-calc(" + w + " - 0px); '"; //hack 
		contentwidth = "style='width: calc( 100% - " + w + "); width: -webkit-calc(100% - " + w + "); width: -moz-calc( 100% - " + w + "); '";
	}

	var code = "";
	var content_class = "wcontent ";
	if(name == null)
		content_class += " full";
	else if(name == "")
		code = "<span class='wname' title='"+name+"' "+namewidth+"></span>";
	else
		code = "<span class='wname' title='"+name+"' "+namewidth+">"+name+"<span class='filling'>....................</span> </span>";

	if(typeof(content) == "string")
		element.innerHTML = code + "<span class='info_content "+content_class+"' "+contentwidth+">"+content+"</span>";
	else
	{
		element.innerHTML = code + "<span class='info_content "+content_class+"' "+contentwidth+"></span>";
		$(element).find("span.info_content").append(content);
	}

	return element;
}

Inspector.onWidgetChange = function(element, name, value, options)
{
	this.values[name] = value;
	$(this.current_section).trigger("wchange",value); //used for undo
	if(options.callback)
		options.callback.call(element,value);
	$(element).trigger("wchange",value);
	if(this.onchange) this.onchange(name,value,element);
}

Inspector.widget_constructors = {
	title: 'addTitle',
	info: 'addInfo',
	number: 'addNumber',
	slider: 'addSlider',
	string: 'addString',
	text: 'addString',
	textarea: 'addTextarea',
	slider: 'addSlider',
	color: 'addColor',
	checkbox: 'addCheckbox',
	vector2: 'addVector2',
	vector3: 'addVector3',
	combo: 'addCombo',
	button: 'addButton',
	buttons: 'addButtons',
	file: 'addFile',
	line: 'addLine',
	list: 'addList',
	separator: 'addSeparator'
};

Inspector.prototype.add = function(type,name,value,options)
{
	if(typeof(type) == "object" && arguments.length == 1)
	{
		options = type;
		type = options.type;
		name = options.name;
		value = options.value;
	}

	var func = Inspector.widget_constructors[type];
	if(!func) return;

	if(typeof(func) == "string")
		func = Inspector.prototype[func];
	if(!func) return;
	if(typeof(func) != "function") return;

	if(typeof(options) == 'function')
		options = { callback: options };
	
	return func.call(this, name,value, options);
}

Inspector.prototype.getValue = function(name)
{
	return this.values[name];
}

Inspector.prototype.set = function(name, value)
{
	//TODO
}

Inspector.prototype.addSection = function(name, options)
{
	options = options || {};

	if(this.current_group)
		this.endGroup();

	var element = document.createElement("DIV");
	element.className = "wsection";
	if(!name) element.className += " notitle";
	var code = "";
	if(name) code += "<div class='wsectiontitle'>"+(options.no_minimize ? "" : "<span class='switch-section-button'></span>")+name+"</div>";
	code += "<div class='wsectioncontent'></div>";
	element.innerHTML = code;
	this.root.appendChild(element);

	if(name)
		$(element).find(".wsectiontitle").click(function(e) {
			if(e.target.localName == "button") return;
			$(element).toggleClass("minimized");
			$(element).find(".wsectioncontent").toggle();
		});

	this.current_section = element;
	this.current_section_content = $(element).find(".wsectioncontent")[0];
	this.content = this.current_section_content; //shortcut
	if(options.widgets_per_row)
		this.widgets_per_row = options.widgets_per_row;
	return element;
}

Inspector.prototype.beginGroup = function(name, options)
{
	options = options || {};

	if(this.current_group)
		this.endGroup();

	var element = document.createElement("DIV");
	element.className = "wgroup";
	element.innerHTML = "<div class='wgroupheader "+ (options.title ? "wtitle" : "") +"'><span class='wgrouptoggle'>-</span>"+name+"</div>";

	var content = document.createElement("DIV");
	content.className = "wgroupcontent";
	if(options.collapsed)
		content.style.display = "none";

	element.appendChild(content);

	var collapsed = options.collapsed || false;
	$(element).find(".wgroupheader").click(function() { 
		$(element).find(".wgroupcontent").toggle();
		collapsed = !collapsed;
		$(element).find(".wgrouptoggle").html(collapsed ? "+" : "-");
	});

	this.append(element);

	this.current_group = element;
	this.current_group_content = content;
	this.content = this.current_group_content; //shortcut

	return element;
}

Inspector.prototype.endGroup = function(options)
{
	this.current_group = null;
	this.current_group_content = null;
	this.content = this.current_section_content; //shortcut
}

Inspector.prototype.addTitle = function(title,options)
{
	options = options || {};
	var element = document.createElement("DIV");
	var code = "<span class='wtitle'><span class='text'>"+title+"</span>";
	if(options.help)
	{
		code += "<span class='help'><div class='help-content'>"+options.help+"</div></span>";
	}
	code += "</span>";
	element.innerHTML = code;

	element.setValue = function(v) { $(this).find(".text").html(v); };

	this.append(element);
	return element;
}

Inspector.prototype.addSeparator = function()
{
	var element = document.createElement("DIV");
	element.className = "separator";
	this.append(element);
	return element;
}

Inspector.prototype.addString = function(name,value, options)
{
	options = options || {};
	value = value || "";
	var that = this;
	this.values[name] = value;

	var inputtype = "text";
	if(options.password) inputtype = "password";
	
	var element = this.createWidget(name,"<span class='inputfield full "+(options.disabled?"disabled":"")+"'><input type='"+inputtype+"' tabIndex='"+this.tab_index+"' class='text string' value='"+value+"' "+(options.disabled?"disabled":"")+"/></span>", options);
	$(element).find(".wcontent input").change( function(e) { 
		Inspector.onWidgetChange.call(that,element,name,e.target.value, options);
	});
	this.tab_index += 1;

	element.setValue = function(v) { $(this).find("input").val(v).change(); };
	element.wchange = function(callback) { $(this).wchange(callback); }
	this.append(element);
	return element;
}

Inspector.prototype.addStringButton = function(name,value, options)
{
	options = options || {};
	value = value || "";
	var that = this;
	this.values[name] = value;
	
	var element = this.createWidget(name,"<span class='inputfield button'><input type='text' tabIndex='"+this.tab_index+"' class='text string' value='"+value+"' "+(options.disabled?"disabled":"")+"/></span><button class='micro'>"+(options.button || "...")+"</button>", options);

	$(element).find(".wcontent input").change( function(e) { 
		Inspector.onWidgetChange.call(that,element,name,e.target.value, options);
	});
	
	$(element).find(".wcontent button").click( function(e) { 
		if(options.callback_button)
			options.callback_button.call(element, $(element).find(".wcontent input").val() );
	});

	this.tab_index += 1;
	this.append(element);
	element.wchange = function(callback) { $(this).wchange(callback); }
	element.wclick = function(callback) { $(this).wclick(callback); }
	return element;
}

Inspector.prototype.addNumber = function(name, value, options)
{
	options = options || { step: 0.1 };
	value = value || 0;
	var that = this;
	this.values[name] = value;

	var element = this.createWidget(name,"", options);
	this.append(element);

	options.extraclass = "full";
	options.tab_index = this.tab_index;
	options.dragger_class = "full";
	this.tab_index++;

	var dragger = new LiteDragger(value, options);
	$(element).find(".wcontent").append(dragger.root);

	$(dragger).bind("start_dragging",inner_before_change);
	function inner_before_change(e)
	{
		if(options.callback_before) options.callback_before.call(element);
	}

	$(element).find("input").change( function(e) { 
		that.values[name] = e.target.value;
		//Inspector.onWidgetChange.call(that,this,name,ret, options);

		if(options.callback)
		{
			var ret = options.callback.call(element, parseFloat( e.target.value) ); 
			if( typeof(ret) == "number")
				$(this).val(ret);
		}
		$(element).trigger("wchange",e.target.value);
		if(that.onchange) that.onchange(name,e.target.value,element);
	});

	element.setValue = function(v) { $(this).find("input").val(v).change(); };

	return element;
}

Inspector.prototype.addVector2 = function(name,value, options)
{
	options = options || { step: 0.1 };
	value = value || [0,0];
	var that = this;
	this.values[name] = value;
	
	var element = this.createWidget(name,"", options);

	options.step = options.step ||0.1;
	options.dragger_class = "medium";
	options.tab_index = this.tab_index;
	this.tab_index++;

	var dragger1 = new LiteDragger(value[0], options);
	dragger1.root.style.marginLeft = 0;
	$(element).find(".wcontent").append(dragger1.root);

	options.tab_index = this.tab_index;
	this.tab_index++;

	var dragger2 = new LiteDragger(value[1], options);
	$(element).find(".wcontent").append(dragger2.root);

	$(dragger1).bind("start_dragging",inner_before_change);
	$(dragger2).bind("start_dragging",inner_before_change);

	function inner_before_change(e)
	{
		if(options.callback_before) options.callback_before();
	}

	$(element).find("input").change( function(e) { 
		//gather all three parameters
		var r = [];
		var elems = $(element).find("input");
		for(var i = 0; i < elems.length; i++)
			r.push( parseFloat( elems[i].value ) );

		that.values[name] = r;

		if(options.callback)
		{
			var new_val = options.callback.call(element,r); 
			
			if(typeof(new_val) == "object" && new_val.length >= 2)
			{
				for(var i = 0; i < elems.length; i++)
					$(elems[i]).val(new_val[i]);
				r = new_val;
			}
		}

		$(element).trigger("wchange",[r]);
		if(that.onchange) that.onchange(name,r,element);
	});

	this.append(element);
	return element;
}

Inspector.prototype.addVector3 = function(name,value, options)
{
	options = options || { step: 0.1 };
	value = value || [0,0,0];
	var that = this;
	this.values[name] = value;
	
	var element = this.createWidget(name,"", options);

	options.step = options.step || 0.1;
	options.dragger_class = "mini";
	options.tab_index = this.tab_index;
	this.tab_index++;

	var dragger1 = new LiteDragger(value[0], options );
	dragger1.root.style.marginLeft = 0;
	$(element).find(".wcontent").append(dragger1.root);

	options.tab_index = this.tab_index;
	this.tab_index++;

	var dragger2 = new LiteDragger(value[1], options );
	$(element).find(".wcontent").append(dragger2.root);

	options.tab_index = this.tab_index;
	this.tab_index++;

	var dragger3 = new LiteDragger(value[2], options );
	$(element).find(".wcontent").append(dragger3.root);

	$(dragger1).bind("start_dragging",inner_before_change);
	$(dragger2).bind("start_dragging",inner_before_change);
	$(dragger3).bind("start_dragging",inner_before_change);

	function inner_before_change(e)
	{
		if(options.callback_before) options.callback_before();
	}

	$(element).find("input").change( function(e) { 
		//gather all three parameters
		var r = [];
		var elems = $(element).find("input");
		for(var i = 0; i < elems.length; i++)
			r.push( parseFloat( elems[i].value ) );

		that.values[name] = r;

		if(options.callback)
		{
			var new_val = options.callback.call(element,r); 
			
			if(typeof(new_val) == "object" && new_val.length >= 3)
			{
				for(var i = 0; i < elems.length; i++)
					$(elems[i]).val(new_val[i]);
				r = new_val;
			}
		}

		$(element).trigger("wchange",[r]);
		if(that.onchange) that.onchange(name,r,element);
	});

	this.append(element);
	return element;
}

Inspector.prototype.addTextarea = function(name,value, options)
{
	options = options || {};
	value = value || "";
	var that = this;
	this.values[name] = value;
	;

	var element = this.createWidget(name,"<span class='inputfield textarea "+(options.disabled?"disabled":"")+"'><textarea tabIndex='"+this.tab_index+"' "+(options.disabled?"disabled":"")+">"+value+"</textarea></span>", options);
	this.tab_index++;

	$(element).find(".wcontent textarea").bind( options.inmediate ? "keyup" : "change", function(e) { 
		Inspector.onWidgetChange.call(that,element,name,e.target.value, options);
	});

	if(options.height)
		$(element).find("textarea").css({height: options.height });
	this.append(element);

	element.setValue = function(v) { $(this).find("textarea").val(v).change(); };
	return element;
}

Inspector.prototype.addInfo = function(name,value, options)
{
	options = options || {};
	value = value || "";
	var element = null;
	if(name != null)
		element = this.createWidget(name,value, options);
	else
	{
		element = document.createElement("div");
		element.className = options.className;
		element.innerHTML = "<span class='winfo'>"+value+"</span>";
	}

	element.setValue = function(v) { $(this).find(".winfo").html(v); };

	if(options.height)
	{
		var content = $(element).find("span.info_content")[0];
		content.style.height = typeof(options.height) == "string" ? options.height : options.height + "px";
		content.style.overflow = "auto";
	}


	this.append(element);
	return element;
}

Inspector.prototype.addSlider = function(name, value, options)
{
	options = options || {};
	options.min = options.min || 0;
	options.max = options.max || 1;
	options.step = options.step || 0.01;

	var that = this;
	this.values[name] = value;
	
	//var element = this.createWidget(name,"<span class='inputfield'><input tabIndex='"+this.tab_index+"' type='text' class='fixed nano' value='"+value+"' /></span><div class='wslider'></div>", options);
	var element = this.createWidget(name,"<span class='inputfield'>\
				<input tabIndex='"+this.tab_index+"' type='text' class='slider-text fixed nano' value='"+value+"' /></span>\
				<span class='ui-slider'>\
				<input class='slider-input' type='range' step='"+options.step+"' min='"+ options.min +"' max='"+ options.max +"'/><span class='slider-thumb'></span></span>", options);

	this.tab_index++;
	var ui = $(element).find(".ui-slider");

	$(element).find(".slider-input").bind('input', inner_slider_move );

	$(element).find(".slider-text").bind('change', function() {
		var v = parseFloat( $(this).val() );
		$(element).find(".slider-input").val(v);
		var vnormalized = (v - options.min) / (options.max - options.min);
		$(element).find(".slider-thumb").css({left: (vnormalized * ($(ui).width() - 12)) });
		Inspector.onWidgetChange.call(that,element,name,v, options);
	});

	function inner_slider_move(e)
	{
		var v = parseFloat( e.target.value );
		var vnormalized = (v - options.min) / (options.max - options.min);
		$(element).find(".slider-text").val(v);
		//$(element).find(".slider-thumb").css({left: (vnormalized * ($(ui).width() - 12)) });
		$(element).find(".slider-thumb").css({left: (vnormalized * 90).toFixed(2) + "%" });
		Inspector.onWidgetChange.call(that,element,name,v, options);
	}

	/*
	$(element).find(".wslider").slider({min: options.min, max: options.max, value: value, step: options.step });
	$(element).find(".ui-slider").bind('slide', function(e,ui) {
		var v = ui.value;
		$(element).find("input").val(v);
		Inspector.onWidgetChange.call(that,element,name,v, options);
	});
	$(element).find("input").bind('change', function() {
		var v = parseFloat( $(this).val() );
		$(element).find(".ui-slider").slider("value",v);
		Inspector.onWidgetChange.call(that,element,name,v, options);
	});
	*/

	this.append(element);
	element.setValue = function(v) { $(this).find(".slider-text").val(v); };
	$(element).find(".slider-input").val(value).trigger("input");
	return element;
}


Inspector.prototype.addCheckbox = function(name, value, options)
{
	options = options || {};
	value = value || "";
	var that = this;
	this.values[name] = value;
	
	//var element = this.createWidget(name,"<span class='inputfield'><span class='fixed flag'>"+(value ? "on" : "off")+"</span><span tabIndex='"+this.tab_index+"'class='checkbox "+(value?"on":"")+"'></span></span>", options );
	var element = this.createWidget(name,"<span class='inputfield'><span tabIndex='"+this.tab_index+"' class='fixed flag checkbox "+(value ? "on" : "off")+"'>"+(value ? "on" : "off")+"</span></span>", options );
	this.tab_index++;

	$(element).find(".wcontent .checkbox").keypress( function(e) { 
		if(e.keyCode == 32)
			$(this).click();
	});

	$(element).click( function() {
		var v = !this.data;
		this.data = v;
		$(element).find("span.flag").html(v ? "on" : "off");
		if(v)
			$(element).find("span.checkbox").addClass("on");
		else
			$(element).find("span.checkbox").removeClass("on");
		Inspector.onWidgetChange.call(that,element,name,v, options);
	})[0].data = value;

	element.setValue = function(v) { 
		if(	that.values[name] != v)
			$(this).find(".checkbox").click(); 
		};

	this.append(element);
	return element;
}

Inspector.prototype.addFlags = function(flags, force_flags)
{
	var f = {};
	for(var i in flags)
		f[i] = flags[i];
	if(force_flags)
		for(var i in force_flags)
			if( typeof(f[i]) == "undefined" )
				f[i] = ( force_flags[i] ? true : false );

	for(var i in f)
	{
		this.addCheckbox(i, f[i], { callback: (function(j) {
			return function(v) { 
				flags[j] = v;
			}
		})(i)
		});
	}
}

Inspector.prototype.addCombo = function(name, value, options)
{
	options = options || {};
	//value = value || "";
	var that = this;
	this.values[name] = value;
	
	var code = "<select tabIndex='"+this.tab_index+"' "+(options.disabled?"disabled":"")+" class='"+(options.disabled?"disabled":"")+"'>";
	this.tab_index++;

	if(options.values)
	{
		for(var i in options.values)
			code += "<option "+(options.values[i] == value?" selected":"")+">" + (options.values.length ? options.values[i] : i) + "</option>";
	}
	code += "</select>";

	var element = this.createWidget(name,"<span class='inputfield full inputcombo "+(options.disabled?"disabled":"")+"'>"+code+"</span>", options);
	$(element).find(".wcontent select").change( function(e) { 
		var value = e.target.value;
		if(options.values && options.values.constructor != Array)
			value = options.values[value];
		Inspector.onWidgetChange.call(that,element,name,value, options);
	});

	this.append(element);
	return element;
}

Inspector.prototype.addComboButtons = function(name, value, options)
{
	options = options || {};
	value = value || "";
	var that = this;
	this.values[name] = value;
	
	var code = "";
	if(options.values)
		for(var i in options.values)
			code += "<button class='wcombobutton "+(value == options.values[i] ? "selected":"")+"' data-name='options.values[i]'>" + options.values[i] + "</button>";

	var element = this.createWidget(name,code, options);
	$(element).find(".wcontent button").click( function(e) { 

		var buttonname = e.target.innerHTML;
		that.values[name] = buttonname;

		$(element).find(".selected").removeClass("selected");
		$(this).addClass("selected");

		Inspector.onWidgetChange.call(that,element,name,buttonname, options);
	});

	this.append(element);
	return element;
}

Inspector.prototype.addTags = function(name, value, options)
{
	options = options || {};
	value = value || [];
	var that = this;
	this.values[name] = value;
	
	var code = "<select>";
	if(options.values)
		for(var i in options.values)
			code += "<option>" + options.values[i] + "</option>";

	code += "</select><div class='wtagscontainer inputfield'></div>";

	var element = this.createWidget(name,"<span class='inputfield full'>"+code+"</span>", options);
	element.tags = {};

	//add default tags
	for(var i in options.value)
		inner_addtag(options.value[i]);

	//combo change
	$(element).find(".wcontent select").change( function(e) { 
		inner_addtag(e.target.value);
	});

	function inner_addtag(tagname)
	{
		if( element.tags[tagname] )
			return; //repeated tags no

		element.tags[tagname] = true;

		var tag = document.createElement("div");
		tag.data = tagname;
		tag.className = "wtag";
		tag.innerHTML = tagname+"<span class='close'>X</span>";

		$(tag).find(".close").click(function(e) {
			var tagname = $(this).parent()[0].data;
			delete element.tags[tagname];
			$(this).parent().remove();
			$(element).trigger("wremoved", tagname );
			Inspector.onWidgetChange.call(that,element,name,element.tags, options);
		});

		$(element).find(".wtagscontainer").append(tag);

		that.values[name] = element.tags;
		if(options.callback) options.callback.call(element,element.tags); 
		$(element).trigger("wchange",element.tags);
		$(element).trigger("wadded",tagname);
		if(that.onchange) that.onchange(name, element.tags, element);
	}

	this.append(element);
	return element;
}

Inspector.prototype.addList = function(name, values, options)
{
	options = options || {};
	var that = this;
	
	var height = "";
	if(options.height)
		height = "style='height: "+options.height+"px; overflow: auto;'";

	var code = "<ul class='lite-list' "+height+" tabIndex='"+this.tab_index+"'><ul>";
	this.tab_index++;

	var element = this.createWidget(name,"<span class='inputfield full "+(options.disabled?"disabled":"")+"'>"+code+"</span>", options);

	$(element).find("ul").focus(function() {
		//trace("focus!");
		$(document).bind("keypress",inner_key);
	});

	$(element).find("ul").blur(function() {
		//trace("blur!");
		$(document).unbind("keypress",inner_key);
	});

	function inner_key(e)
	{
		//trace(e);
		var selected = $(element).find("li.selected");
		if(!selected || !selected.length) return;

		if(e.keyCode == 40)
		{
			var next = selected.next();
			if(next && next.length)
				$(next[0]).click();
		}
		else if(e.keyCode == 38)
		{
			var prev = selected.prev();
			if(prev && prev.length)
				$(prev[0]).click();
		}
	}

	function inner_item_click(e) { 

		if(options.multiselection)
			$(this).toggleClass("selected");
		else
		{
			$(element).find("li").removeClass("selected");
			$(this).addClass("selected");
		}

		var value = values[ this.dataset["pos"] ];
		//if(options.callback) options.callback.call(element,value); //done in onWidgetChange
		Inspector.onWidgetChange.call(that,element,name,value, options);
		$(element).trigger("wadded",value);
	}

	element.updateItems = function(new_values)
	{
		var code = "";
		values = new_values;
		if(values)
			for(var i in values)
			{
				var item_name = values[i]; //array

				var icon = "";
				if(	values[i].length == null ) //object
				{
					item_name = values[i].name ? values[i].name : i;
					if(values[i].icon)
						icon = "<img src='"+values[i].icon+"' class='icon' />";
				}

				code += "<li className='item-"+i+" "+(typeof(values[i]) == "object" && values[i].selected ? "selected":"") + "' data-name='"+item_name+"' data-pos='"+i+"'>" + icon + item_name + "</li>";
			}

		$(this).find("ul").html(code);
		$(this).find(".wcontent li").click( inner_item_click );
	}

	element.removeItem = function(name)
	{
		var items = $(element).find(".wcontent li");
		for(var i = 0; i < items.length; i++)
		{
			if(items[i].dataset["name"] == name)
				$(items[i]).remove();
		}
	}

	element.updateItems(values);
	this.append(element);

	if(options.height) $(element).scroll(0);
	return element;
}

Inspector.prototype.addButton = function(name, value, options)
{
	options = options || {};
	value = value || "";
	var that = this;
	
	var element = this.createWidget(name,"<button tabIndex='"+ this.tab_index + "'>"+value+"</button>", options);
	this.tab_index++;
	$(element).find("button").click(function() {
		Inspector.onWidgetChange.call(that,element,name,this.innerHTML, options);
		$(element).trigger("wclick",value);
	});
	this.append(element);
	element.wclick = function(callback) { $(this).wclick(callback); }
	return element;
}

Inspector.prototype.addButtons = function(name, value, options)
{
	options = options || {};
	value = value || "";
	var that = this;

	var code = "";
	var w = "calc("+(100/value.length).toFixed(3)+"% - "+Math.floor(16/value.length)+"px);";
	if(value && typeof(value) == "object")
	{
		for(var i in value)
		{
			code += "<button tabIndex='"+this.tab_index+"' style=' width:"+w+" width: -moz-"+w+" width: -webkit-calc("+(89/value.length).toFixed(3)+"%)'>"+value[i]+"</button>";
			this.tab_index++;
		}
	}
	var element = this.createWidget(name,code, options);
	$(element).find("button").click(function() {
		Inspector.onWidgetChange.call(that,element,name,this.innerHTML, options);
		$(element).trigger("wclick",this.innerHTML);
	});
	this.append(element);
	return element;
}

Inspector.prototype.addColor = function(name,value,options)
{
	options = options || {};
	value = value || [0.0,0.0,0.0];
	var that = this;
	this.values[name] = value;
	
	var code = "<input tabIndex='"+this.tab_index+"' id='colorpicker-"+name+"' class='color' value='"+value+"' "+(options.disabled?"disabled":"")+"/>";
	this.tab_index++;

	if(options.show_rgb)
		code += "<span class='rgb-color'>"+Inspector.parseColor(value)+"</span>";
	var element = this.createWidget(name,code, options);
	this.append(element); //add now or jscolor dont work

	//create jsColor 
	var input_element = $(element).find("input.color")[0];
	var myColor = new jscolor.color(input_element);
	myColor.pickerFaceColor = "#333";
	myColor.pickerBorderColor = "black";
	myColor.pickerInsetColor = "#222";
	myColor.rgb_intensity = 1.0;

	if(options.disabled) myColor.pickerOnfocus = false; //this doesnt work

	if(typeof(value) != "string" && value.length && value.length > 2)
	{
		var intensity = 1.0;
		myColor.fromRGB(value[0]*intensity,value[1]*intensity,value[2]*intensity);
		myColor.rgb_intensity = intensity;
	}

	//update values in rgb format
	$(input_element).change( function(e) { 
		$(element).find(".rgb-color").html( Inspector.parseColor(myColor.rgb) );
	});

	myColor.onImmediateChange = function() 
	{
		var v = [ myColor.rgb[0] * myColor.rgb_intensity, myColor.rgb[1] * myColor.rgb_intensity, myColor.rgb[2] * myColor.rgb_intensity ];
		//Inspector.onWidgetChange.call(that,element,name,v, options);

		that.values[name] = v;
		if(options.callback)
			options.callback.call(element, v.concat(), "#" + myColor.toString(), myColor);
		$(element).trigger("wchange",[v.concat(), myColor.toString()]);
		if(that.onchange) that.onchange(name, v.concat(), element);
	}

	//alpha dragger
	options.step = options.step || 0.01;
	options.dragger_class = "nano";

	var dragger = new LiteDragger(1, options);
	$(element).find('.wcontent').append(dragger.root);
	$(dragger.input).change(function()
	{
		var v = parseFloat($(this).val());
		myColor.rgb_intensity = v;
		if (myColor.onImmediateChange)
			myColor.onImmediateChange();
	});

	return element;
}

Inspector.prototype.addFile = function(name, value, options)
{
	options = options || {};
	value = value || "";
	var that = this;
	this.values[name] = value;
	
	var element = this.createWidget(name,"<span class='inputfield full whidden'><span class='filename'>"+value+"</span><input type='file' size='100' class='file' value='"+value+"'/></span>", options);
	$(element).find(".wcontent input").change( function(e) { 
		if(options.callback) options.callback.call(element,e.target.value);
		$(element).find(".filename").html( e.target.value );
		$(element).trigger("wchange",[e.target.files]);
		Inspector.onWidgetChange.call(that,element,name,e.target.value, options);
	});
	this.append(element);
	return element;
}

Inspector.prototype.addLine = function(name, value, options)
{
	options = options || {};
	value = value || "";
	var that = this;
	this.values[name] = value;
	
	var element = this.createWidget(name,"<span class='line-editor'></span>", options);

	var line_editor = new LiteLineEditor(value,options);
	$(element).find("span.line-editor").append(line_editor);

	$(line_editor).change( function(e) { 
		if(options.callback) options.callback.call(element,e.target.value);
		$(element).trigger("wchange",[e.target.value]);
		Inspector.onWidgetChange.call(that,element,name,e.target.value, options);
	});

	this.append(element);
	return element;
}

Inspector.prototype.addTree = function(name, value, options)
{
	options = options || {};
	value = value || "";
	var element = this.createWidget(name,"<div class='wtree'></div>", options);
	
	var node = $(element).find(".wtree")[0];
	var current = value;

	inner_recursive(node,value);

	function inner_recursive(root_node, value)
	{
		for(var i in value)
		{
			var e = document.createElement("div");
			e.className = "treenode";
			if( typeof( value[i] ) == "object" )
			{
				e.innerHTML = "<span class='itemname'>" + i + "</span><span class='itemcontent'></span>";
				inner_recursive($(e).find(".itemcontent")[0], value[i] );
			}
			else
				e.innerHTML = "<span class='itemname'>" + i + "</span><span class='itemvalue'>" + value[i] + "</span>";
			root_node.appendChild(e);
		}
	}

	this.append(element);
	return element;
}


/*
Inspector.prototype.addImageSlot = function(title, callback_drop, callback_set)
{
	var element = this.createElement("DIV");
	element.innerHTML = "<strong>"+title+"</strong><input class='text' type='text' value=''/><button class='load confirm_button'>Ok</button><div class='img-slot'>Drop img here</div>";
	this.append(element);

	var confirm_button = $(element).find(".confirm_button")[0];
	$(confirm_button).click(function() {
		var text = $(element).find(".text")[0];
		if(callback_set)
			callback_set( $(text).val() );
	});

	var slot = $(element).find(".img-slot")[0];

	slot.addEventListener("dragenter", onDragEnter, false);
	slot.addEventListener("dragexit", onDragExit, false);
	slot.addEventListener("dragover", onDragNull, false);
	slot.addEventListener("drop", onFileDrop, false);


	function onDragEnter(evt)
	{
		$(slot).addClass("highlight");
		evt.stopPropagation();
		evt.preventDefault();
	}

	function onDragExit(evt)
	{
		$(slot).removeClass("highlight");
		evt.stopPropagation();
		evt.preventDefault();
	}

	function onDragNull(evt)
	{
		evt.stopPropagation();
		evt.preventDefault();
	}

	function onFileDrop(evt)
	{
		trace("processing drag and drop...");
		$(slot).removeClass("highlight");
		evt.stopPropagation();
		evt.preventDefault();

		var files = evt.dataTransfer.files;
		var count = files.length;
		
		var file = files[0];
		if(file == null) return;

		var reader = new FileReader();
		var extension = file.name.substr( file.name.lastIndexOf(".") + 1).toLowerCase();

		reader.onload = function(e) {
			if(callback_drop)
				callback_drop(e, file);
		}

		var image_extensions = ["png","jpg"];
		if (image_extensions.indexOf(extension) != -1)
			reader.readAsDataURL(file);
		else
			reader.readAsArrayBuffer(file);
	}
}
*/



Inspector.parseColor = function(color)
{
	return "<span style='color: #FAA'>" + color[0].toFixed(2) + "</span>,<span style='color: #AFA'>" + color[1].toFixed(2) + "</span>,<span style='color: #AAF'>" + color[2].toFixed(2) + "</span>";
}

/***** DRAGGER **********/

function LiteDragger(value, options)
{
	options = options || {};
	var element = document.createElement("div");
	element.className = "dragger " + (options.extraclass ? options.extraclass : "");

	var wrap = document.createElement("span");
	wrap.className = "inputfield " + (options.extraclass ? options.extraclass : "");
	if(options.disabled)
	wrap.className += " disabled";
	element.appendChild(wrap);

	var dragger_class = options.dragger_class || "full";

	var input = document.createElement("input");
	input.className = "text number " + (dragger_class ? dragger_class : "");
	input.value = value + (options.units ? options.units : "");
	input.tabIndex = options.tab_index;
	this.input = input;

	$(input).bind("keydown",function(e) {
		//trace(e.keyCode);
		if(e.keyCode == 38)
			inner_inc(1,e);
		else if(e.keyCode == 40)
			inner_inc(-1,e);
		else
			return;
		e.stopPropagation();
		e.preventDefault();
		return true;
	});


	if(options.disabled)
		input.disabled = true;
	if(options.tab_index)
		input.tabIndex = options.tab_index;
	wrap.appendChild(input);
	element.input = input;

	var dragger = document.createElement("div");
	dragger.className = "drag_widget";
	if(options.disabled)
		dragger.className += " disabled";

	wrap.appendChild(dragger);
	element.dragger = dragger;

	this.root = element;

	$(dragger).bind("mousedown",inner_down);

	function inner_down(e)
	{
		if(!options.disabled)
		{
			$(document).bind("mousemove", inner_move);
			$(document).bind("mouseup", inner_up);

			dragger.data = [e.screenX, e.screenY];

			$(dragger).trigger("start_dragging");
		}

		e.stopPropagation();
		e.preventDefault();
	}

	function inner_move(e)
	{
		var diff = [e.screenX - dragger.data[0], dragger.data[1] - e.screenY];

		dragger.data = [e.screenX, e.screenY];
		var axis = options.horizontal ? 0 : 1;
		inner_inc(diff[axis],e);

		e.stopPropagation();
		e.preventDefault();
		return false;
	};

	function inner_up(e)
	{
		$(dragger).trigger("stop_dragging");
		$(document).unbind("mousemove", inner_move);
		$(document).unbind("mouseup", inner_up);
		$(dragger).trigger("blur");
		e.stopPropagation();
		e.preventDefault();
		return false;
	};

	function inner_inc(v,e)
	{
		var scale = (options.step ? options.step : 1.0);
		if(e && e.shiftKey)
			scale *= 10;
		else if(e && e.ctrlKey)
			scale *= 0.1;
		var value = parseFloat( input.value ) + v * scale;
		if(options.max != null && value > options.max)
			value = options.max;
		if(options.min != null && value < options.min)
			value = options.min;

		if(options.precision)
			input.value = value.toFixed(options.precision);
		else
			input.value = ((value * 1000)<<0) / 1000; //remove ugly decimals
		if(options.units)
			input.value += options.units;
		$(input).change();
	}
}

function LiteLineEditor(value, options)
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


LiteGUI.Inspector = Inspector;