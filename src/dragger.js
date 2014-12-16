(function(){

	/***** DRAGGER **********/
	function Dragger(value, options)
	{
		options = options || {};
		var element = document.createElement("div");
		element.className = "dragger " + (options.extraclass ? options.extraclass : "");
		this.root = element;

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
		element.input = input;

		if(options.disabled)
			input.disabled = true;
		if(options.tab_index)
			input.tabIndex = options.tab_index;
		wrap.appendChild(input);

		this.setValue = function(v) { 
			$(input).val(v).trigger("change");
		}
		
		$(input).bind("keydown",function(e) {
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

		var dragger = document.createElement("div");
		dragger.className = "drag_widget";
		if(options.disabled)
			dragger.className += " disabled";

		wrap.appendChild(dragger);
		element.dragger = dragger;

		$(dragger).bind("mousedown",inner_down);

		function inner_down(e)
		{
			$(document).unbind("mousemove", inner_move);
			$(document).unbind("mouseup", inner_up);

			if(!options.disabled)
			{
				$(document).bind("mousemove", inner_move);
				$(document).bind("mouseup", inner_up);

				dragger.data = [e.screenX, e.screenY];

				$(element).trigger("start_dragging");
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
			$(element).trigger("stop_dragging");
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
	LiteGUI.Dragger = Dragger;

})();