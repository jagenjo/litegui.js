var trace = console ? console.log.bind(console) : function(){};

var LiteGUI = {
	root_container: null,
	panels: {},
	undo_steps: [],
	modalbg_div: null,
	_modules_initialized: false,

	mainmenu: null,
	modules: [],

	init: function(options)
	{
		options = options || {};

		trace("Init lite");
		if(options.width && options.height)
			this.setWindowSize(options.width,options.height);

		this.root_container = $("#work-area")[0];

		this.modalbg_div = document.createElement("div");
		this.modalbg_div.className = "litemodalbg";
		$(document.body).append(this.modalbg_div);

		if(options.menubar)
		{
			this.mainmenu = new LiteGUI.Menubar("mainmenubar");
			$(options.menubar).append(this.mainmenu.root);
		}

		if(options.gui_callback)
			options.gui_callback();

		//init all modules attached to the GUI
		if(options.initModules != false) this.initModules();

		//grab some keys
		$(document).bind("keydown",function(e){
			if(e.target.nodeName.toLowerCase() == "input" || e.target.nodeName.toLowerCase() == "textarea")
				return;
			//trace(e.keyCode);
			if(e.keyCode == 17) return; //ctrl

			if(e.keyCode == 26 || (e.keyCode == 90 && (e.ctrlKey || e.metaKey)) || (e.charCode == 122 && e.ctrlKey) ) //undo
				LiteGUI.doUndo();
			if(e.keyCode == 27) //esc
				$(LiteGUI).trigger("escape");

		});

		if( $("#wrap").hasClass("fullscreen") )
		{
			$(window).resize( function(e) { 
				LiteGUI.maximizeWindow();
			});
		}
	},

	initModules: function()
	{
		//pre init
		for(var i in this.modules)
			if (this.modules[i].init_gui)
				this.modules[i].init_gui();

		//post init
		for(var i in this.modules)
			if (this.modules[i].init && !this.modules[i]._initialized)
			{
				this.modules[i].init();
				this.modules[i]._initialized = true;
			}

		this._modules_initialized = true;
	},

	registerModule: function(module)
	{
		this.modules.push(module);

		//initialize on late registration
		if(this._modules_initialized)
		{
			if (module.init_gui) module.init_gui();
			if (module.init) module.init();
		}

		$(this).trigger("module_registered",module);
	},

	setWindowSize: function(w,h)
	{
		if(w && h)
		{
			$("#wrap").css( {width: w+"px", height: h + "px", "box-shadow":"0 0 4px black"}).removeClass("fullscreen");

		}
		else
		{
			if( $("#wrap").hasClass("fullscreen") )
				return;
			$("#wrap").addClass("fullscreen");
			$("#wrap").css( {width: "100%", height: "100%", "box-shadow":"0 0 0"});
		}
		$(LiteGUI).trigger("resized");
	},

	maximizeWindow: function()
	{
		this.setWindowSize();
	},

	//UNDO **********************
	max_undo_steps: 100,
	min_time_between_undos: 500,
	last_undo_time: 0, //to avoid doing too many undo steps simultaneously

	addUndoStep: function(o)
	{
		var now =  new Date().getTime();
		if( (now - this.last_undo_time) < this.min_time_between_undos) 
			return;
		this.undo_steps.push(o);
		this.last_undo_time = now;
		if(this.undo_steps.length > this.max_undo_steps)
			this.undo_steps.shift();
	},

	doUndo: function()
	{
		//trace("Undo step");
		if(!this.undo_steps.length) return;

		var step = this.undo_steps.pop();
		if(step.callback != null)
			step.callback(step.data);

		$(LiteGUI).trigger("undo", step);
	},

	removeUndoSteps: function()
	{
		this.undo_steps = [];
	},

	// CSS ************************
	addCSS: function(code)
	{
		var style = document.createElement('style');
		style.type = 'text/css';
		style.innerHTML = code;
		document.getElementsByTagName('head')[0].appendChild(style);
	},

	requireCSS: function(url, on_complete)
	{
		if(typeof(url)=="string")
			url = [url];

		while(url.length)
		{
			var link  = document.createElement('link');
			//link.id   = cssId;
			link.rel  = 'stylesheet';
			link.type = 'text/css';
			link.href = url.shift(1);
			link.media = 'all';
			var head = document.getElementsByTagName('head')[0];
			head.appendChild(link);
			if(url.length == 0)
				link.onload = on_complete;
		}
	},

	requireScript: function(url, on_complete)
	{
		if(typeof(url)=="string")
			url = [url];

		function addScript()
		{
			var script = document.createElement('script');
			script.type = 'text/javascript';
			script.src = url.shift(1);
			script.onload = function(e) { 
				if(url.length)
				{
					addScript();
					return;
				}
				
				if(on_complete)
					on_complete();
			};
			document.getElementsByTagName('head')[0].appendChild(script);
		}

		addScript();
	},

	//* DIALOGS *******************
	showModalBackground: function(v)
	{
		if(v)
			$(LiteGUI.modalbg_div).show('fade');
		else
			$(LiteGUI.modalbg_div).hide('fade');
	},

	showMessage: function(content, options)
	{
		options = options || {};
		
		options.title = options.title || "Attention";
		options.content = content;
		options.close = 'fade';
		var dialog = new LiteGUI.Dialog("info_message",options);
		if(!options.noclose)
			dialog.addButton("Close",{ close: true });
		dialog.makeModal('fade');
		return dialog;
	},

	alert: function(content,options)
	{
		options = options || {};

		options.className = "alert";
		options.title = "Alert";
		options.width = 280;
		options.height = 140;
		if (typeof(content) == "string")
			content = "<p>" + content + "</p>";

		return this.showMessage(content,options);
	},

	confirm: function(content,options, callback_yes, callback_no)
	{
		options = options || {};
		if(typeof(options) == "function")
		{
			callback_no = callback_yes;
			callback_yes = options;
			options = {};
		}

		options.className = "alert";
		options.title = "Confirm";
		options.width = 280;
		options.height = 140;
		if (typeof(content) == "string")
			content = "<p>" + content + "</p>";

		content +="<button class='yes-button' style='width:45%; margin-left: 10px'>Yes</button><button class='no-button' style='width:45%'>No</button>";
		options.noclose = true;
		var dialog = this.showMessage(content,options);
		$(dialog.content).find(".yes-button").click(function() {
			if(callback_yes) callback_yes();
			dialog.close();
		});

		$(dialog.content).find(".no-button").click(function() {
			if(callback_no) callback_no();
			dialog.close();
		});

		return dialog;
	},

	prompt: function(content,options, callback_yes, callback_no)
	{
		options = options || {};
		if(typeof(options) == "function")
		{
			callback_no = callback_yes;
			callback_yes = options;
			options = {};
		}

		options.className = "alert";
		options.title = "Prompt" || options.title;
		options.width = 280;
		options.height = 140 + (options.textarea ? 40 : 0);
		if (typeof(content) == "string")
			content = "<p>" + content + "</p>";

		var value = options.value || "";
		var textinput = "<input type='text' value='"+value+"'/>";
		if (options.textarea)
			textinput = "<textarea class='textfield' style='width:95%'>"+value+"</textarea>";

		content +="<p>"+textinput+"</p><button class='yes-button' style='width:45%; margin-left: 10px'>Accept</button><button class='no-button' style='width:45%'>Cancel</button>";
		options.noclose = true;
		var dialog = this.showMessage(content,options);
		$(dialog.content).find(".yes-button").click(function() {
			var input = $(dialog.content).find(options.textarea ? "textarea" : "input").val();

			if(callback_yes) callback_yes( input );
			dialog.close();
		});

		$(dialog.content).find(".no-button").click(function() {
			if(callback_no) callback_no();
			dialog.close();
		});

		return dialog;
	}
};


//Add support to get variables from the URL
$.extend({
  getUrlVars: function(){
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
      hash = hashes[i].split('=');
      vars.push(hash[0]);
      vars[hash[0]] = hash[1];
    }
    return vars;
  },
  getUrlVar: function(name){
    return $.getUrlVars()[name];
  }
});