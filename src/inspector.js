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

Inspector.prototype.append = function(widget, options)
{
	var root = this.root;
	if(this.current_group_content)
		root = this.current_group_content;
	else if(this.current_section_content)
		root = this.current_section_content;

	if(options && options.replace)
		options.replace.parentNode.replaceChild(widget, options.replace);
	else
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

Inspector.prototype.inspectInstance = function(instance, attrs, attrs_info) 
{
	if(!instance) return;

	if( !attrs && instance.getAttributes )
		attrs = instance.getAttributes();
	else
		attrs = this.collectAttributes(instance);

	var classObject = instance.constructor;
	if(!attrs_info && classObject.attributes)
		attrs_info = classObject.attributes;

	if(!attrs_info)
		attrs_info = {};

	for(var i in attrs)
	{
		if(attrs_info[i])
			continue;

		var v = attrs[i];

		if(classObject["@" + i]) //in class object
		{
			var options = {}; 
			var shared_options = classObject["@" + i];
			for(var j in shared_options) //clone, because cannot be shared or errors could appear
				options[j] = shared_options[j];
			attrs_info[i] = options;
		}
		else if(instance["@" + i])
			attrs_info[i] = instance["@" + i];
		else if (typeof(v) == "number")
			attrs_info[i] = { type: "number" };
		else if (typeof(v) == "string")
			attrs_info[i] = { type: "string" };
		else if (typeof(v) == "boolean")
			attrs_info[i] = { type: "boolean" };
		else if( v && v.length )
		{
			switch(v.length)
			{
				case 2: attrs_info[i] = { type: "vec2" }; break;
				case 3: attrs_info[i] = { type: "vec3" }; break;
				case 4: attrs_info[i] = { type: "vec4" }; break;
				default: continue;
			}
		}
	}

	return this.showAttributes( instance, attrs_info );
}

Inspector.prototype.collectAttributes = function(instance)
{
	var attrs = {};

	for(var i in instance)
	{
		if(i[0] == "_" || i[0] == "@" || i.substr(0,6) == "jQuery") //skip vars with _ (they are private)
			continue;

		var v = instance[i];
		if ( v && v.constructor == Function )
			continue;
		attrs[i] = v;
	}
	return attrs;
}

Inspector.prototype.showAttributes = function(instance, attrs_info ) 
{
	for(var i in attrs_info)
	{
		var options = attrs_info[i];
		if(!options.callback)
		{
			var o = { instance: instance, name: i, options: options };
			options.callback = Inspector.assignValue.bind(o);
		}
		options.instance = instance;

		var type = options.type || options.widget || "string";
		this.add( type, i, instance[i], options );
	}
}

Inspector.assignValue = function(value)
{
	var instance = this.instance;
	var current_value = instance[this.name];

	if(current_value == null || value == null)
		instance[this.name] = value;
	else if(typeof(current_value) == "number")
		instance[this.name] = parseFloat(value);
	else if(typeof(current_value) == "string")
		instance[this.name] = value;
	else if(value && value.length && current_value && current_value.length)
	{
		for(var i = 0; i < current_value.length; ++i)
			current_value[i] = value[i];
	}
	else
		instance[this.name] = value;
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
	color: 'addColor',
	"boolean": 'addCheckbox', 
	checkbox: 'addCheckbox',
	vec2: 'addVector2',
	vector2: 'addVector2',
	vec3: 'addVector3',
	vector3: 'addVector3',
	"enum": 'addCombo',
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

	this.append(element, options);

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

	this.append(element, options);
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
	element.getValue = function() { return $(this).find("input").val(); };
	element.wchange = function(callback) { $(this).wchange(callback); }
	this.append(element,options);
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
	this.append(element,options);
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
	this.append(element,options);

	options.extraclass = "full";
	options.tab_index = this.tab_index;
	options.dragger_class = "full";
	this.tab_index++;

	var dragger = new LiteGUI.Dragger(value, options);
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

	var dragger1 = new LiteGUI.Dragger(value[0], options);
	dragger1.root.style.marginLeft = 0;
	$(element).find(".wcontent").append(dragger1.root);

	options.tab_index = this.tab_index;
	this.tab_index++;

	var dragger2 = new LiteGUI.Dragger(value[1], options);
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

	this.append(element,options);

	element.setValue = function(v) { 
		dragger1.setValue(v[0]);
		dragger2.setValue(v[1]);
	}

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

	var dragger1 = new LiteGUI.Dragger(value[0], options );
	dragger1.root.style.marginLeft = 0;
	$(element).find(".wcontent").append(dragger1.root);

	options.tab_index = this.tab_index;
	this.tab_index++;

	var dragger2 = new LiteGUI.Dragger(value[1], options );
	$(element).find(".wcontent").append(dragger2.root);

	options.tab_index = this.tab_index;
	this.tab_index++;

	var dragger3 = new LiteGUI.Dragger(value[2], options );
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

	this.append(element,options);

	element.setValue = function(v) { 
		dragger1.setValue(v[0]);
		dragger2.setValue(v[1]);
		dragger3.setValue(v[2]);
	}
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
	this.append(element,options);

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


	this.append(element,options);
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

	var element = this.createWidget(name,"<span class='inputfield'>\
				<input tabIndex='"+this.tab_index+"' type='text' class='slider-text fixed nano' value='"+value+"' /><span class='slider-container'></span></span>", options);

	var slider_container = element.querySelector(".slider-container");

	var slider = new LiteGUI.Slider(value,options);
	slider_container.appendChild(slider.root);

	var skip_change = false; //used to avoid recursive loops
	var text_input = element.querySelector(".slider-text");
	$(text_input).bind('change', function() {
		if(skip_change) return;

		var v = parseFloat( $(this).val() );
		/*
		if(v > options.max)
		{
			skip_change = true;
			slider.setValue( options.max );
			skip_change = false;
		}
		else
		*/
		slider.setValue( v );

		Inspector.onWidgetChange.call(that,element,name,v, options);
	});

	$(slider).bind("change", function(e,v) {
		text_input.value = v;
		Inspector.onWidgetChange.call(that,element,name,v, options);
	});

	
	/*
	//var element = this.createWidget(name,"<span class='inputfield'><input tabIndex='"+this.tab_index+"' type='text' class='fixed nano' value='"+value+"' /></span><div class='wslider'></div>", options);
	var element = this.createWidget(name,"<span class='inputfield'>\
				<input tabIndex='"+this.tab_index+"' type='text' class='slider-text fixed nano' value='"+value+"' /></span>\
				<span class='ui-slider'>\
				<input class='slider-input' type='range' step='"+options.step+"' min='"+ options.min +"' max='"+ options.max +"'/><span class='slider-thumb'></span></span>", options);

	this.tab_index++;

	var text_input = $(element).find(".slider-text");
	var slider_input = $(element).find(".slider-input");
	var slider_thumb = $(element).find(".slider-thumb");

	slider_input.bind('input', inner_slider_move );

	var skip_change = false; //used to avoid recursive loops
	text_input.bind('change', function() {
		if(skip_change) return;

		var v = parseFloat( $(this).val() );
		if(v > options.max)
		{
			skip_change = true;
			slider_input.val( options.max );
			skip_change = false;
		}
		else
			slider_input.val(v);

		var vnormalized = (v - options.min) / (options.max - options.min);
		if(vnormalized > 1) vnormalized = 1;
		else if(vnormalized < 0) vnormalized = 0;

		slider_thumb.css({left: (vnormalized * ($(slider_input).width() - 12)) });
		Inspector.onWidgetChange.call(that,element,name,v, options);
	});

	function inner_slider_move(e)
	{
		var v = parseFloat( e.target.value );
		var vnormalized = (v - options.min) / (options.max - options.min);
		if(!skip_change)
		{
			text_input.val(v);
			Inspector.onWidgetChange.call(that,element,name,v, options);
		}
		slider_thumb.css({left: (vnormalized * 90).toFixed(2) + "%" });
	}

	*/

	this.append(element,options);
	element.setValue = function(v) { slider.setValue(v); };
	//skip_change = true;
	//slider_input.val(value).trigger("input");
	//skip_change = false;
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

	this.append(element,options);
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

	var element = this.createWidget(name,"<span class='inputfield full inputcombo "+(options.disabled?"disabled":"")+"'></span>", options);
	element.options = options;

	var values = options.values || [];

	if(options.values)
	{
		if (typeof(values) == "function")
			values = options.values();
		else
			values = options.values;
		if(values) 
			for(var i in values)
				code += "<option "+( values[i] == value?" selected":"")+">" + ( values.length ?  values[i] : i) + "</option>";
	}
	code += "</select>";

	element.querySelector("span.inputcombo").innerHTML = code;

	$(element).find(".wcontent select").change( function(e) { 
		var value = e.target.value;
		if(values && values.constructor != Array)
			value = values[value];
		Inspector.onWidgetChange.call(that,element,name,value, options);
	});

	this.append(element,options);
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

	this.append(element,options);
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

	this.append(element,options);
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

		this.querySelector("ul").innerHTML = code;
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
	this.append(element,options);

	element.getSelected = function()
	{
		var r = [];
		var selected = this.querySelectorAll("ul li.selected");
		for(var i = 0; i < selected.length; ++i)
			r.push( selected[i].dataset["name"] );
		return r;
	}

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
	this.append(element,options);

	element.wclick = function(callback) { 
		if(!options.disabled)
			$(this).wclick(callback); 
	}
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
	this.append(element,options);
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
	this.append(element,options); //add now or jscolor dont work

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

	var dragger = new LiteGUI.Dragger(1, options);
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
	this.append(element,options);
	return element;
}

Inspector.prototype.addLine = function(name, value, options)
{
	options = options || {};
	value = value || "";
	var that = this;
	this.values[name] = value;
	
	var element = this.createWidget(name,"<span class='line-editor'></span>", options);

	var line_editor = new LiteGUI.LineEditor(value,options);
	$(element).find("span.line-editor").append(line_editor);

	$(line_editor).change( function(e) { 
		if(options.callback) options.callback.call(element,e.target.value);
		$(element).trigger("wchange",[e.target.value]);
		Inspector.onWidgetChange.call(that,element,name,e.target.value, options);
	});

	this.append(element,options);
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

	this.append(element,options);
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


LiteGUI.Inspector = Inspector;