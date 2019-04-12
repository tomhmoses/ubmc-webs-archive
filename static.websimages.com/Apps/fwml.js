var fwAppsURL = document.location.href,
    appHandle = "";

if(typeof webs === "undefined") var webs = { vars: {} };
else if (typeof webs.vars === "undefined") webs.vars = {};

(function() {
    var i = fwAppsURL.indexOf('/apps/') + 6;
    if(i < 10) {
	    i = fwAppsURL.indexOf('/manageapp/') + 11;
    }
	if(i < 11) {
		// homepage
		if(typeof(fwParams) === 'string') {
			i = fwParams.indexOf('&fw_app=') + 8;
			if(i >= 0) {
				appHandle = fwParams.substring(i, fwParams.indexOf('&', i));
			}

			var lol = window.location.href.split("/");
			if(window.location.href.indexOf("freewebs.com/") > 0) {
				fwAppsURL = lol[0] + '//' + lol[2] + '/' + '/' + lol[3] + '/apps/';
			} else {
				fwAppsURL = 'http://' + window.location.hostname + '/apps/';
			}
		}
	} else {
		appHandle = fwAppsURL.substring(i, fwAppsURL.indexOf('/', i));
		fwAppsURL = fwAppsURL.substring(0, i);
	}
})();

webs.redirect = function(url) {
	if(url.charAt(0) == '/') {
		document.location = fwAppsURL + appHandle + url;
	} else if(url.indexOf('http://') == 0) {
		document.location = url;
	} else {
		// blah, ../blah
		var loc = document.location;
		var href = loc.href;
		var i = href.indexOf(loc.search);
		if(i > 0) {
			href = href.substring(0, href.indexOf(loc.search));
		}
		href = href.substring(0, href.lastIndexOf('/')+1);
		href += url;
		document.location = href;
	}
};

/* These values are deprecated, DO NOT REFERENCE THESE ANYMORE (LEGACY) */
window.w = webs;
window.W = webs;

function getAbsPos(el) {
	var doc = document;
	var r;
	if (el.getBoundingClientRect) { // IE
		r = el.getBoundingClientRect();
		return {
			absLeft: r.left + (doc.body.scrollLeft || doc.documentElement.scrollLeft || 0),
			absTop: r.top + (doc.body.scrollTop || doc.documentElement.scrollTop || 0),
			width: r.right - r.left,
			height: r.bottom - r.top
		};
	} else if (doc.getBoxObjectFor) { // FF
		r = doc.getBoxObjectFor(el);
		return {
			absLeft: r.x,
			absTop: r.y,
			width: r.width,
			height: r.height
		};
	} else { // WebKit and others
		var elm = el;
		var left = 0, top = 0;
		do {
			left += elm.offsetLeft || 0;
			top += elm.offsetTop || 0;
			elm = elm.offsetParent;
		} while (elm);
		return { 'absLeft': left, 'absTop': top, 'width': el.offsetWidth, 'height': el.offsetHeight };
	}
}

var fwHelpTip = {
	show: function(id, context) {
		var el = document.getElementById("fw-help-tip-" + id);
		var pos = getAbsPos(context);
		el.style.top = (pos.absTop - 15) + "px";
		el.style.left = (pos.absLeft + 18) + "px";
		el.style.display = "block";
	},
	hide: function(id) {
		var el = document.getElementById("fw-help-tip-" + id);
		el.style.display = "none";
	}
};

var fwContextBarInstances = {};
function fwGetContextBar(cbid) {
	if(fwContextBarInstances[cbid]) {
		return fwContextBarInstances[cbid];
	}
	var id = cbid;
	var el = document.getElementById(id);
	var pub = {};
	var curr = null;
	pub.el = el;
	pub.show = function(contextEl, newID) {
		var pos = getAbsPos(contextEl);
		el.style.top = (pos.absTop - 45) + 'px';
		el.style.left = pos.absLeft + 'px';
		el.style.display = 'block';
		pub.setID(newID);
	};
	pub.isVisible = function() {
		return el.style.display == 'block';
	};
	pub.hide = function() {
		el.style.display = 'none';
		curr = null;
	};
	pub.setID = function(i) {
		curr = i;
	};
	pub.getID = function() {
		return curr;
	};

	fwContextBarInstances[cbid] = pub;

	return pub;
}

function fwCloseHelpBox(id, el) {
//	fwToggleHelpBoxes(false);
	el.style.display = 'none';
}
function fwShowHelpBox(id, el) {
//	fwToggleHelpBoxes(true);
	el.style.display = 'block';
}
function fwToggleHelpBox(el, show) {
	el.style.display = show?'block':'none';
}

var showHelpBoxes = false;
function fwToggleHelpBoxes(show) {
	if(arguments.length<1) {
		show = !showHelpBoxes;
	}
	var elements = document.getElementsByTagName("div");
	for(var i = 0;i < elements.length;i++){
		if(elements[i].className.indexOf("fw-help-box") >= 0){
			fwToggleHelpBox(elements[i], show);
		}
	}
	showHelpBoxes = show;
	parent.$("fwToggleHelpBoxesLink").innerHTML = (show?"Hide":"Show") + " Help Boxes";
	fwSetCookie('fw-help-boxes', show?'1':'0');
	return false;
}

function resizeFrame(frameName, h) {
	document.getElementById(frameName).style.height = (parseInt(h)+1) + 'px';
}

function fwRedirect(url) {
	var loc = document.location;
	var href = loc.href;
	var i = href.indexOf(loc.search);
	if(i > 0) {
		href = href.substring(0, href.indexOf(loc.search));
	}
	href = href.substring(0, href.lastIndexOf('/')+1);
	href += url;
	document.location = href;
}

Function.prototype.bind = function(bind){
    var fn = this;
    return function(){
        return fn.apply(bind, arguments);
    };
};
