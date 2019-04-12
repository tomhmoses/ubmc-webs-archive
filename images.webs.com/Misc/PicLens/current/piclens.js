/* PicLens Lite JavaScript: version 1.2.0
 * Copyright (c) 2008 Cooliris, Inc.
 * All Rights Reserved.
 *
 * The JavaScript portion of PicLens Lite is licensed under BSD.
 * For details, see http://lite.piclens.com/bsdlicense
 * This launcher includes and interacts with SWFObject (MIT), BrowserDetect (BSD Compatible), and Lytebox (CC Attribution 3.0).
 *
 * There are two versions of this JS:
 * http://lite.piclens.com/current/piclens.js			contains the full file with comments	(~42KB)
 * http://lite.piclens.com/current/piclens_optimized.js contains a light version for deployment (~25KB)
 */
var PicLensLite = {
	// PUBLIC API

	// PicLens Lite can be deployed in one of two ways:
	// 1) include http://lite.piclens.com/current/piclens.js in the <head> of your webpage
	// 2) download the zip file and deploy it on your own website (unzip it anywhere, and point to the JS file in the <head> of your page)
	//
	// For example: the directory layout looks like:
	//	 lite.piclens.com/current/ contains the SWF, JS, and image files
	//					 /lytebox/ contains slideshow support for browsers w/o Flash
	//
	// Pointing to the JS will automatically configure PicLens Lite relative to that URL...
	// Alternatively, you can customize the URLs with PicLensLite.setLiteURLs

	// 1) Call PicLensLite.start() to launch the default feed (specified in the head)
	// 2) Call PicLensLite.start({feedUrl:'http://myWebsite.com/myFeed.rss', ...}) to launch a specific feed
	//	Option 2 supports the following named arguments:
	//		feedUrl  : String  // is the URL to the specific Media RSS feed you want to launch
	//		feedData : String  // is the Media RSS feed itself (do not use feedUrl if you want to programmatically generate & pass in the feed text)
	//		guid	 : String  // starts from the item in the feed that is tagged w/ this unique id
	//		maxScale : Number  // normally, images fill the stage; 0 -> never scale up; any other positive number S --> scale up to S times the original size of the photo (but never bigger than the stage)
	//		loadFeedInFlash : Boolean // if true, we ask Flash to load the feed, instead of AJAX (expert option)
	//		loop	 : Boolean // if true, we turn looping on by default
	//		paused	 : Boolean // if true, we start the slideshow in paused mode
	// To enable smoothing for images. a crossdomain.xml file is required at the root of your image server.
	// Lite detects this crossdomain.xml and applies smoothing automatically.
	start : function (namedArgs) {
		this.determineBrowserParams();
		clearTimeout(this.REMOVE_TIMER_ID);
		clearTimeout(this.AUTO_CLOSE_TIMER_ID);
		this.ARGS = {}; // clear out previous args

		// handle named arguments
		if (typeof namedArgs !== "undefined" && namedArgs !== null) {
			this.ARGS = namedArgs;

			//////////////////////////////////////////////////////////////////////
			// if feedUrl is specified, it launches immediately
			if (namedArgs.feedUrl) {
				this.THE_FEED_URL = namedArgs.feedUrl;
				if (this.checkForPluginAndLaunchIfPossible(namedArgs.feedUrl)) {
					return;
				}
				if (namedArgs.loadFeedInFlash) {
					// read up on flash crossdomain.xml if you choose this option
					// Flash can only load feeds from servers hosting a crossdomain.xml
					// pass the URL as a FlashVar, and load the contents via a GET request
					this.showFlashUI("");
				} else {
					// load the contents of the URL via AJAX, and launch the Flash UI afterward....
					this.loadViaXHR(namedArgs.feedUrl);
				}
			}
			// pass in the feed XML directly through Javascript
			// use feedUrl OR feedData, but not both!
			if (typeof namedArgs.feedData !== 'undefined') {
				this.showFlashUI(namedArgs.feedData);
			}
		} else {
			// find the feed from the header, since none was specified
			// build list of XML feeds
			var feeds = this.indexFeeds();
			if (feeds.length !== 0) { // view the first feed, if available
				var feed = feeds[0];
				this.THE_FEED_URL = feed.url;
				if (this.checkForPluginAndLaunchIfPossible(feed.url)) {
					return;
				}
				this.loadViaXHR(feed.url);
			}
		}
	},
	// check if the slideshow is currently running
	isRunning : function () {
		return this.LITE_IS_RUNNING;
	},
	// check if the user has the PicLens browser plug-in installed
	hasClient : function () {
		return this.hasPicLensClient();
	},
	// OPTIONAL: provide callbacks to be notified in certain situations. Call this BEFORE PicLensLite.start(...)
	// 	onNoPlugins():Boolean
	//		is called when the user invokes Lite but does not have PicLens / Flash installed
	// 	onExit(itemUID):void
	//		is called when the user exits from Lite
	//		we provide the item's GUID if it exists, and the item's content URL otherwise
	//		itemUID is undefined if the user exited before Lite launched, or if the user did not have Flash
	setCallbacks : function (args) {
		if (args.onNoPlugins) {
			this.ON_NO_PLUGINS = args.onNoPlugins;
		}
		if (args.onExit) {
			this.ON_EXIT = args.onExit;
		}
	},
	// OPTIONAL: customize the location of resources. Call this BEFORE PicLensLite.start(...)
	// Normally, we locate the PicLensLite files relative to the JS file
	// To use this function, pass in an object with the following named arguments:
	// args = {
	//		lite	: other paths can be determined from this (make sure it ends in a slash)
	//		swf		: the URL of the SWF file					1
	//		button	: image allowing users to download piclens	1
	//		lbox	: where to find lytebox						1
	//		lboxcss	: the CSS file								2
	//		lboxjs	: the JS file								2
	// }
	// 1: Can be determined from args.lite
	// 2: Can be determined from args.lbox or args.lite
	setLiteURLs : function (args) {
		if (!this.LITE_URL) {
			if (args.swf) {
				this.LITE_URL = args.swf;
			} else if (args.lite) {
				this.LITE_URL = args.lite + "PicLensLite.swf";
			} // if both lite & swf aren't set, it won't work
		}
		if (!this.BUTTON_URL) {
			if (args.button) {
				this.BUTTON_URL = args.button;
			} else if (args.lite) {
				this.BUTTON_URL = args.lite + "NoFlash.jpg";
			}
		}

		var lboxUrl = "";
		if (args.lbox) {
			lboxUrl = args.lbox;
		} else if (args.lite) {
			lboxUrl = args.lite + "../lytebox/";
		}

		if (!this.LBOX_CSS_URL) {
			if (args.lboxcss) {
				this.LBOX_CSS_URL = args.lboxcss;
			} else if (lboxUrl != "") {
				this.LBOX_CSS_URL = lboxUrl + "lytebox.css";
			}
		}

		if (!this.LBOX_JS_URL) {
			if (args.lboxjs) {
				this.LBOX_JS_URL = args.lboxjs;
			} else if (lboxUrl != "") {
				this.LBOX_JS_URL = lboxUrl + "lytebox.js";
			}
		}
	},



	//////////////////////////////////////////////////////////////////////////////////////////////////////////
	// The PRIVATE API is below
	// DO NOT USE these functions or variables directly, as they WILL change in future releases
	// Please email us to request changes to the public API if necessary
	ARGS			: {},
	DEBUG_NOCLIENT	: false,	// if true, we will NEVER launch the PicLens Client (for testing Lite)
	DEBUG_NOFLASH	: false,	// if true, we will assume the user does not have Flash (for testing Lite)
	HPAD		: 60,		// horizontal padding
	VPAD		: 20,		// vertical padding
	LITE_BG_DIV		: null,		// the grey/black background overlay
	LITE_FG_DIV		: null,		// the foreground div that contains the flash component
	LITE_URL		: null,		// the location of PicLensLite.SWF
	BUTTON_URL		: null,		// image to display if the user doesn't have flash
	LBOX_CSS_URL	: null,		// where to find lytebox css/js files
	LBOX_JS_URL		: null,
	LBOX_COUNT		: 0,		// try to start lytebox, but if it doesn't exist after a few tries, give up...
	SHOW_LBOX		: false,	// if true, skip flash altogether
	OS_WIN			: false,	// OS Detect
	OS_MAC			: false,	// sadly, sometimes we have to do something different depending on our Browser/OS/Configuration
	BROWSER_FFX		: false,	// Browser Detect
	BROWSER_SAF		: false,
	BROWSER_IE		: false,
	BROWSER_IE6		: false,
	THE_FEED		: "",			// the feed text
	THE_FEED_URL	: "",			// the feed url
	LITE_IS_RUNNING		: false,	// use isRunning()
	piclensIsRunning_	: false,	// maintain compatibility with the Wordpress Plugin for a few iterations...
	FLASH_ID_1		: "pllflash1",	// outer
	FLASH_ID_2		: "pllflash2",	// inner
	FLASH_VER		: null,			// the version of Flash we're running
	FLASH_URL		: "http://www.adobe.com/go/getflashplayer",
	PL_URL			: "http://download.piclens.com/partner/",   // downloads PL immediately
	LEARN_PL_URL	: "http://affiliate.piclens.com/partner/",  // landing page to read about / download PL
	FONT			: "font-family: Lucida Grande, Myriad Pro, Verdana, Helvetica, Arial, sans-serif;",
	KEY_HANDLERS	: "",	// save the old key handlers, if any
	ON_NO_PLUGINS	: null, // callback
	ON_EXIT			: null, // callback
	AUTO_CLOSE_TIMER_ID		: 0,	//
	REMOVE_TIMER_ID			: 0,	// the timer for removing the children...
	RESIZE_TIMER_IE6		: null,	// every second, it auto resizes the UI
	RESIZE_HANDLER_EXISTS	: false,// for safari, it adds a handler to detect user resize events
	CUSTOM_BUTTON			: null,	// add an action to the UI

	// call this before starting lite. we currently support a single custom button
	// the button icon is a PNG, 32x32 or smaller
	// WARNING: In the near future, this will change to a REST API, where instead of a JavaScript callback,
	// we will perform a GET request of a provided URL, w/ the image GUID
	addCustomButton : function (buttonCallback, buttonLabel, buttonIcon) {
		this.CUSTOM_BUTTON = {callback: buttonCallback, labelText: buttonLabel, iconImage: buttonIcon};
	},
	addKeyHandlers : function () {
		var self = this;
		if (typeof document.onkeydown !== 'undefined') { // save & later restore key handlers...
			this.KEY_HANDLERS = document.onkeydown;
		}
		document.onkeydown = function (e) {
			var keycode;
			if (typeof e === "undefined" || e === null) { // ie
				keycode = window.event.keyCode;
			} else { // mozilla
				keycode = e.which;
			}
			var val=self.handleKeyPress(keycode);
			if (typeof e != "undefined" && e != null) {
				e.returnValue = val;
			}
			return val;
		};
	},
	addMouseHandlers : function () {
		if (window.addEventListener) {	// Firefox
			window.addEventListener("DOMMouseScroll", this.handleMouseWheel, false);
		}
		if (document.attachEvent) {		// IE/Opera
			document.attachEvent("onmousewheel", this.handleMouseWheel);
		}
		window.onmousewheel = document.onmousewheel = this.handleMouseWheel; // other browsers
	},
	// call this at the last possible moment (especially for Win/Firefox)
	appendElementsToDocument : function () {
		if (this.BROWSER_FFX && this.OS_MAC) {	// avoid redraw bug by not showing the background
			this.LITE_BG_DIV.style.display = "none";
		}
		document.body.appendChild(this.LITE_BG_DIV);
		document.body.appendChild(this.LITE_FG_DIV);
	},
	autoResize : function () { // for the IE6 auto resize
		if (!this.isRunning()) {
			// unregister the timer
			clearInterval(this.RESIZE_TIMER_IE6);
			return;
		}

		// resize the BG and FG divs
		var size = this.getPageSize();
		var bg = this.LITE_BG_DIV;
		if (bg) {
			bg.style.height = size.h + 'px';
			bg.style.width  = size.w + 'px';
		}
		if (this.LITE_FG_DIV) {
			var fgs = this.LITE_FG_DIV.style;
			this.resizeToPaddedBox(fgs);
			this.resizeToFitPaddedBox(fgs, size);
			this.resizeFlashToFitPaddedBox();
		}
	},
	clickCustomButton : function (buttonIndex, itemGUID) {
		this.CUSTOM_BUTTON.callback(itemGUID);
	},
	checkForPluginAndLaunchIfPossible : function (url) {
		// if we have the correct version of piclens, pass it onto the client and do not use LITE
		if (this.hasPicLensClient()) {
			window.piclens.launch(url,'','');
			return true; // launched!
		}
		return false;
	},
	createBackgroundOverlay : function () {
		// create a background that covers the page
		var bg = document.createElement('div');
		this.LITE_BG_DIV = bg;
		bg.id = "lite_bg_div";

		var bgs = bg.style;
		bgs.position = 'fixed';

		// stick to the sides when the window resizes
		bgs.width = bgs.height = "100%";

		if (this.BROWSER_IE6) {
			bgs.position = 'absolute';
			var page = this.getPageSize();
			bgs.height = page.h + 'px';
			bgs.width  = page.w + 'px';
		}

		bgs.left = bgs.right = bgs.top = bgs.bottom = '0px';
		bgs.backgroundColor = '#000';
		bgs.zIndex = 1000;
		bgs.opacity = '0.5';
		bgs.filter = 'alpha(opacity=50)';		// IE7

		var self = this;
		bg.onclick = function () {
			self.exitPicLensLite();
		};
	},
	createForegroundFlashComponent : function () { // configure the box
		var fg = document.createElement('div');
		this.LITE_FG_DIV = fg;
		fg.id = "lite_fg_div";

		var fgs = fg.style;
		fgs.backgroundColor = '#000';
		fgs.position = 'fixed';
		fgs.border = '2px solid #555';
		fgs.zIndex = 1001;	   // above the bg

		this.resizeToPaddedBox(fgs);

		if (this.BROWSER_IE6) {
			fgs.position = 'absolute';
			this.resizeToFitPaddedBox(fgs);
		}
	},
	// this just removes the HTML elements
	// we call this from Flash (thus, we need to allow the function to return before removing the children)
	closeFlashUI : function (itemID) {
		var doc = document;

		// remove the keyboard & mouse handlers...
		doc.onkeydown = this.KEY_HANDLERS;
		window.onmousewheel = doc.onmousewheel = "";
		if (window.removeEventListener) {
			window.removeEventListener("DOMMouseScroll", this.handleMouseWheel, false);
		}
		if (doc.detachEvent) { // IE/Opera
			doc.detachEvent("onmousewheel", this.handleMouseWheel);
		}

		// hide the div now; remove them later
		this.LITE_BG_DIV.style.display = this.LITE_FG_DIV.style.display = 'none';
		this.REMOVE_TIMER_ID = setTimeout(function (){PicLensLite.removeChildren();}, 150); // 0.15s

		if (this.ON_EXIT !== null) {
			this.ON_EXIT(itemID); // call on exit
		}
		this.setRunningFlag(false);
	},
	// for handling cross-browser quirks...
	determineBrowserParams : function () {
		// BrowserDetect {.OS, .browser, .version} e.g., "Mac Firefox 2" and "Windows Explorer 7"
		var os = BrowserDetect.OS;
		var b = BrowserDetect.browser;
		this.OS_MAC = (os == "Mac");
		this.OS_WIN = (os == "Windows");
		this.BROWSER_FFX = (b == "Firefox");
		this.BROWSER_SAF = (b == "Safari");
		this.BROWSER_IE = (b == "Explorer");
		this.BROWSER_IE6 = (this.BROWSER_IE && BrowserDetect.version == "6");
		this.FLASH_VER = swfobject.getFlashPlayerVersion(); // what version of Flash is the browser running?
	},
	// we should tell Flash we are exiting when this is called...
	// this should only be called when the user clicks outside of the flash component
	// all other exits are handled through Flash
	exitPicLensLite : function () {
		var fl = this.getFlash();
		if (fl !== null && fl.fl_exitPicLensLite) {	// binding exists
			// tell flash that we are quitting
			fl.fl_exitPicLensLite();
			// close after .5 seconds, if nothing happened
			// TODO: make sure this doesn't crash any browsers
			// TODO: Check the Return Value to Fire this Timer?
			this.AUTO_CLOSE_TIMER_ID = setTimeout(function (){ if (PicLensLite.isRunning()) { PicLensLite.closeFlashUI();}}, 500); // 0.5s
		} else {
			// if it's not running already, we just remove the DIVs (flash isn't defined)
			this.closeFlashUI();
		}
	},
	// a website should include the absolute URL of the piclens.js in its header
	// This function looks for the script tag and extracts the ROOT_URL
	// <script type="text/javascript" src="ROOT_URL/piclens.js"></script>
	// we assume the SWF and JPEG/PNG/GIF files are relative to this ROOT_URL...
	findScriptLocation : function () {
		var scriptTags = document.getElementsByTagName("script");
		for (var i = 0; i != scriptTags.length; ++i) {
			var script = scriptTags[i];
			var type = script.getAttribute("type");
			if (type == "text/javascript") {
				var src = script.getAttribute("src");
				if (src === null) {
					continue;
				}
				var index = src.indexOf("piclens.js");
				if (index != -1) {
					this.setLiteURLs({lite:src.substring(0,index)});
					return;
				} else {
					index = src.indexOf("piclens_optimized.js");
					if (index != -1) {
						this.setLiteURLs({lite:src.substring(0,index)});
						return;
					}
				}
			}
		}
	},
	getFeedURL : function () {		// for Flash to find the feed
		return encodeURIComponent(this.THE_FEED_URL);
	},
	// returns an object describing the page size of the browser window
	getPageSize : function () {
		var xScroll, yScroll, winW, winH;
		var doc = document;
		var body = doc.body;
		var html;
		if (window.innerHeight && window.scrollMaxY) {
			xScroll = doc.scrollWidth;
			yScroll = (this.isFrame ? parent.innerHeight : self.innerHeight) + (this.isFrame ? parent.scrollMaxY : self.scrollMaxY);
		} else if (body.scrollHeight > body.offsetHeight){
			xScroll = body.scrollWidth;
			yScroll = body.scrollHeight;
		} else {
			html = doc.getElementsByTagName("html").item(0);
			xScroll = html.offsetWidth;
			yScroll = html.offsetHeight;
			xScroll = (xScroll < body.offsetWidth) ? body.offsetWidth : xScroll;
			yScroll = (yScroll < body.offsetHeight) ? body.offsetHeight : yScroll;
		}
		var docElement = doc.documentElement;
		if (self.innerHeight) {
			winW = (this.isFrame) ? parent.innerWidth : self.innerWidth;
			winH = (this.isFrame) ? parent.innerHeight : self.innerHeight;
		} else if (docElement && docElement.clientHeight) {
			winW = docElement.clientWidth;
			winH = docElement.clientHeight;
		} else if (body) {
			html = doc.getElementsByTagName("html").item(0);
			winW = html.clientWidth;
			winH = html.clientHeight;
			winW = (winW == 0) ? body.clientWidth : winW;
			winH = (winH == 0) ? body.clientHeight : winH;
		}
		var pageHeight = (yScroll < winH) ? winH : yScroll;
		var pageWidth = (xScroll < winW) ? winW : xScroll;
		return {pw:pageWidth, ph:pageHeight, w:winW, h:winH}; // pw and ph are the larger pair. use w and h.
	},
	getElementsFromXMLFeed : function () {
		var xmlDoc;
		if (window.ActiveXObject) { // IE
		  	xmlDoc=new ActiveXObject("Microsoft.XMLDOM");
		  	xmlDoc.async=false;
		  	xmlDoc.loadXML(PicLensLite.THE_FEED);
		} else { // Mozilla, Firefox, Opera, etc.
			var parser = new DOMParser();
			xmlDoc = parser.parseFromString(PicLensLite.THE_FEED, "text/xml");
		}
		var elements = xmlDoc.getElementsByTagName('*');
		return elements;
	},
	getBasicSlideShowHTML : function () {
		if (!this.LBOX_JS_URL || !this.LBOX_CSS_URL) {
			return "";
		}

		// make sure the lytebox JS is included
		var head = document.getElementsByTagName('head').item(0);

		// add the script tag
		var script  = document.createElement('script');
		script.src  = this.LBOX_JS_URL;
		script.type = 'text/javascript';
		head.appendChild(script);

		// add the lytebox CSS too
		var link = document.createElement('link');
		link.rel = "stylesheet";
		link.href = this.LBOX_CSS_URL;
		link.type = "text/css";
		link.media = "screen";
		head.appendChild(link);

		// find all image URLs from the feed.
		var xmlElements = this.getElementsFromXMLFeed();

		var i;
		var hiddenURLs = "";
		for (i = 0; i < xmlElements.length; i++) {
			if (xmlElements[i].nodeName == "media:content") {	// what about the namespace?
				var url = xmlElements[i].getAttribute("url");
				if (url.indexOf(".flv") == -1) {				// images only... avoid FLV files
					hiddenURLs += '<a id="lboxImage" href="' + url + '" rel="lytebox[lite]"></a> ';
				}
			}
		}
		// rel="lytebox[lite]"
		var basicSlideShow = "<div id='lightbox_images' align='center' style='display: none; padding-top:10px; color:#FFFFFF; font-size:.8em; " +this.FONT+ " color:#999999;'>";
		basicSlideShow +=  '( Alternatively, <a onclick="javascript:PicLensLite.invokeLytebox();return false;" href="#" style="color:#656588">click here for a basic slideshow</a>. )';
		basicSlideShow += hiddenURLs;
		basicSlideShow += "</div><br/>";

		return basicSlideShow;
	},
	generateAlternativeContent : function () {
		var altContentHTML = '<div id="altContent" style="text-align:center; margin: 0 0 0 0; padding: 0 0 0 0; background-color: #252525; min-width:860px;">';
		altContentHTML += '<div align="center" style="width: 100%; padding-top:60px; '+this.FONT+'">';

		var v = this.FLASH_VER;
		var flashMessage;
		if (v.major > 0) { // has some version of Flash
			flashMessage = "update your Flash Player from version "+ v.major + '.' + v.minor + '.' + v.release + " to version 9.0.28 or newer";
		} else {
			flashMessage = "install the most recent Flash Player";
		}

		var basicSlideShow = "";
		if (this.THE_FEED !== "") {   // do this if we've loaded the feed in AJAX
			basicSlideShow = this.getBasicSlideShowHTML();
		}

		var downloadPL = this.PL_URL;
		var learnPL = this.LEARN_PL_URL;
		var pid = this.ARGS.pid;
		if (pid) {
			downloadPL += pid + "/";
			learnPL += pid + "/";
		} else {
			var x = "000000000001/";
			downloadPL += x;
			learnPL += x;
		}

		if (this.SHOW_LBOX) {
			// don't show the image, because we will invoke lytebox immediately
		} else {
			var sp = "<span style='padding-left:25px; color:#C6C6C6; font-size:";
			//altContentHTML +=
			//	"<div style='padding:10px;'>" +
			//		sp+"1.5em; font-weight: bold; " +this.FONT+ "'>You're clicks away from going full screen!</span><br/>" +
			//		sp+".9em; padding-bottom: 15px; " +this.FONT+ "'>You must get the <a href='"+downloadPL+"' style='color:#656588'>PicLens</a> browser plugin, or "+flashMessage+".</span>" +
			//	"</div>";
			//if (!this.BUTTON_URL) {
			//	altContentHTML +=
			//	'<a href="' + downloadPL + '">Get PicLens Now!</a>';
			//} else {
			//	var area = '<area shape="rect" coords=';
			//	altContentHTML +=
			//	'<img src="'+this.BUTTON_URL+'" alt="" border="0" usemap="#Map">' +
			//	'<map name="Map" id="Map">' +
			//		area+'"0,0,28,28" href="#" onclick="javascript:PicLensLite.closeFlashUI();" />' +
			//		area+'"31,34,316,293" href="' + downloadPL +'" />' +
			//		area+'"593,209,825,301" href="' + this.FLASH_URL +'" />' +
			//		area+'"328,136,448,158" href="' + learnPL +'" />' +
			//	'</map>';
			//}
			altContentHTML +=
				"<div style='padding:10px;'>" +
					sp+"1.5em; font-weight: bold; " +this.FONT+ "'>Sorry, your browser is not supported!</span>" +
				"</div>";
		}

		altContentHTML += '</div>';
		altContentHTML += basicSlideShow;
		//altContentHTML += '<div align="center" style="color:#666666; font-size:11px; '+this.FONT+'">&copy; 2008 Cooliris, Inc. All trademarks are property of their respective holders.<br/><br/><br/></div>';
		altContentHTML += '</div>';
		return altContentHTML;
	},
	generateFlashVars : function () {
		var fv = '';
		var args = this.ARGS;
		if (typeof args.guid !== 'undefined') {
			fv += "&startItemGUID=" + args.guid;
		}
		if (args.loadFeedInFlash) {
			fv += "&feedURL=" + this.getFeedURL();	// may need crossdomain.xml to allow loading of feed
		}
		if (args.paused) {
			fv += "&paused=" + args.paused;
		}
		if (args.loop) {
			fv += "&loop=" + args.loop;
		}
		if (args.delay) { // seconds: from 1-10
			fv += "&delay=" + args.delay;
		}
		if (args.pid) {
			fv += "&pid=" + args.pid;
		}
		if (typeof args.maxScale != 'undefined') {	// allow 0
			fv += "&maxScale=" + args.maxScale;
		}
		if (typeof args.overlayToolbars != 'undefined') {
			fv += "&overlayToolbars=" + args.overlayToolbars;
		}
		var button = this.CUSTOM_BUTTON;
		if (button != null) {
			fv += "&customButton=" + encodeURIComponent(button.labelText);
			if (button.iconImage != null) {
				fv += "__icon__" + encodeURIComponent(button.iconImage);
			}
		}
		fv += "&swfURL="+encodeURIComponent(this.LITE_URL);
		fv = fv.substring(1); // kill the first &
		return fv;
	},
	// does the right thing for each browser
	// returns the Flash object, so we can communicate with it over the ExternalInterface
	getFlash : function () {
		// we should determine which one to pass back depending on Browser/OS configuration
		if (this.BROWSER_SAF || this.BROWSER_IE) {
			return document.getElementById(this.FLASH_ID_1); // outer <object>
		} else {
			return document.getElementById(this.FLASH_ID_2); // inner <object>
		}
	},
	getWindowSize : function () { // inner size
		var docElement = document.documentElement;
		var docBody = document.body;
		var w = 0, h = 0;
		if (typeof(window.innerWidth) == 'number') {
			// not IE
			w = window.innerWidth;
			h = window.innerHeight;
		} else if (docElement && (docElement.clientWidth || docElement.clientHeight)) {
			// IE 6+ in 'standards compliant mode'
			w = docElement.clientWidth;
			h = docElement.clientHeight;
		} else if (docBody && (docBody.clientWidth || docBody.clientHeight)) {
			// IE 4 compatible
			w = docBody.clientWidth;
			h = docBody.clientHeight;
		}
		return {w:w, h:h};
	},
	handleKeyPress : function (code) {
		if (!this.isRunning()) { return true; }
		var fl = this.getFlash();
		if (fl != null && fl.fl_keyPressed) {
			fl.fl_keyPressed(code); // forward to Flash
		} else {
			if (code == 27) { // ESC to close
				this.closeFlashUI();
				return false;
			}
		}
		if (code == 9 || code == 13) { // trap tab, enter
			return false;
		}
		return true; // allow the browser to process the key
	},
	handleMouseWheel : function (e) {
		// e.wheelDelta
		// Safari/Windows (MouseWheel Up is +120; Down is -120)
		var delta = 0;
		if (!e) {
			e = window.event;
		}
		if (e.wheelDelta) { // IE/Opera
			delta = e.wheelDelta/120;
			if (window.opera) {
				delta = -delta;
			}
		} else if (e.detail) { // Firefox/Moz
			var d = e.detail;
			// on mac, don't divide by 3...
			if (Math.abs(d) < 3) {
				delta = -d;
			} else {
				delta = -d/3;
			}
		}
		if (delta) {
			// don't send abs values < 1; otherwise, you can only scroll next
			PicLensLite.sendMouseScrollToFlash(delta);
		}
		if (e.preventDefault) {
			e.preventDefault();
		}
		e.returnValue = false;
		return false;
	},
	// check if PicLens is available
	hasPicLensClient : function () {
		// if we are debugging, don't checking
		if (this.DEBUG_NOCLIENT) {
			return false;
		}

		// check if the bridge has already been defined
		var clientExists = false;
		if (window.piclens) {
			clientExists = true;
		} else {
			// if not, try to define it here...
			var context = null;
			if (typeof PicLensContext != 'undefined') { // Firefox ONLY
				context = new PicLensContext();
			} else {									// IE ONLY
				try {
					context = new ActiveXObject("PicLens.Context");
				} catch (e) {
					context = null;
				}
			}

		   window.piclens = context;
			if (window.piclens) {
				clientExists = true;
			}
		}
		if (clientExists) { // check the version number
			var version;
			try { version = window.piclens.version; } catch (e) { return false; }

			var parts = version.split('.'); // minimum version is: 1.6.0.824
			if (parts[0] > 1) {			    // a version 2.X product
				return true;
			} else if (parts[0] == 1) {	    // a 1.X product
				if (parts[1] > 6) {		    // a version 1.7.X product
					return true;
				} else if (parts[1] == 6) { // a 1.6 product
					if (parts[2] > 0) {	    // a version 1.6.1.X product
						return true;
					} else if (parts[2] == 0) {
						if (parts[3] >= 824) { // 1.6.0.824 or newer...
							return true;
						}
					}
				}
			}
			return false; // e.g., a 0.X product
		} else {
			return false;
		}
	},
	invokeLytebox : function () {
		this.SHOW_LBOX = true; // user has specified that she wants to use the basic slideshow
		myLytebox.start(document.getElementById("lboxImage"), false, false);
		this.closeFlashUI();
	},
	showLyteboxLink : function () {
		myLytebox.updateLyteboxItems();
		myLytebox.doAnimations = false;
		var lboxImages = document.getElementById('lightbox_images');
		if (lboxImages != null) {
			lboxImages.style.display = "block";
			if (this.SHOW_LBOX && this.getFlash()==null) { // the user has clicked on lbox once, so we assume it going forward
				this.invokeLytebox();
			}
		}
	},
	startLytebox : function () { // allows us to include lytebox, unmodified
		if (typeof myLytebox != "undefined") {
			this.showLyteboxLink();
		} else {
			if (typeof initLytebox != "undefined") {
				initLytebox();
				this.showLyteboxLink();
			} else {
				if (this.LBOX_COUNT >= 4) {
					return; // give up after 600 ms
				}
				setTimeout(function (){PicLensLite.startLytebox();}, 150); // try again in 150 ms
				this.LBOX_COUNT++;
			}
		}
	},
	injectFlashPlayer : function () {
		var fg = this.LITE_FG_DIV;

		// determine the width and height of the flash component
		var flashWInner;
		var flashHInner;
		flashWInner = flashHInner = '100%';
		if (this.BROWSER_IE6) {
			flashWInner = flashHInner = '0';
		}

		var flashVars = this.generateFlashVars();
		var altContentHTML = this.generateAlternativeContent(); // non-flash content

		if (this.meetsRequirements()) {
			var par = '<param name=';
			fg.innerHTML =
				'<object id="'+ this.FLASH_ID_1 +'" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="100%" height="100%">' + // SAF & IE
					par+'"movie" value="' + this.LITE_URL + '" />' +
					par+'"quality" value="high"/> ' +
					par+'"bgcolor" value="#000000"/> ' +
					par+'"allowScriptAccess" value="always"/> ' +
					par+'"FlashVars" value="' + flashVars + '"/> ' +
					par+'"allowFullScreen" value="true"/> ' +
					par+'"wmode" value="window"/> ' +
					par+'"scale" value="noscale"/> ' +
						'<object type="application/x-shockwave-flash" data="' + this.LITE_URL + '" width="'+flashWInner+'" height="'+flashHInner+'" ' + // NOT IE
							'quality="high" ' +
							'bgcolor="#000000" id="'+ this.FLASH_ID_2 + '" ' +
							'quality="high" ' +
							'FlashVars="' + flashVars + '" ' +
							'allowFullScreen="true" ' +
							'scale="noscale" ' +
							'wmode="window" ' +
							'allowScriptAccess="always">' +
							altContentHTML + // IE
						'</object>'+ // NOT IE
				'</object>';
			// fg.style.backgroundColor = '#252525'; // IE 100% div height problem
		} else {
			if (this.ON_NO_PLUGINS) {
				this.ON_NO_PLUGINS(); // callback instead of showing NoFlash.jpg
			} else {
				fg.innerHTML = altContentHTML;
				fg.style.minWidth = "860px";
				fg.style.minHeight = "550px";
				fg.style.backgroundColor = '#252525';
			}
		}

		if (this.BROWSER_SAF) {
			this.resizeUI(); // fixes layout
		}
	},
	// find the RSS feeds on this page, and return an array
	indexFeeds : function () {
		var linkTags = document.getElementsByTagName("link");
		var feeds = [];
		for (var i = 0; i != linkTags.length; ++i) {
			var link = linkTags[i], type = link.getAttribute("type");
			if (type == "application/rss+xml" || type == "text/xml") {
				feeds.push({ title: link.getAttribute("title"), url: link.getAttribute("href") });
			}
		}
		return feeds;
	},
	// once we get the response text, we launch flash
	loadViaXHR : function (url) {
		var self = this;
		var request = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("MSXML2.XMLHTTP.3.0");
		try {
			request.open("GET", url, true);
			request.onreadystatechange = function () {
				if (request.readyState == 4 && (request.status == 200 || request.status == 0)) { // 0 -> File System Testing
					if (request.responseText) {
						// at this point, we have the text
						self.showFlashUI(request.responseText);
					}
				}
			};
			request.send("");
		} catch (err) { // probably a crossdomain issue, so ask flash to try loading
			this.ARGS.loadFeedInFlash = true;
			this.showFlashUI("");
		}
	},
	meetsRequirements : function () {
		if (this.DEBUG_NOFLASH) {
			return false;
		}
		// if IE7, and Flash Detect returns ver 0, we show the Flash anyways
		var ie7FlashDetectionWorkaround = (this.FLASH_VER.major == 0) && this.BROWSER_IE;
		return swfobject.hasFlashPlayerVersion("9.0.28") || ie7FlashDetectionWorkaround;
	},
	removeChildren : function () {
		this.REMOVE_TIMER_ID = 0;
		// remove the divs after a timeout
		if (this.LITE_BG_DIV !== null) {
			document.body.removeChild(this.LITE_BG_DIV);
			this.LITE_BG_DIV = null;
		}
		if (this.LITE_FG_DIV !== null) {
			document.body.removeChild(this.LITE_FG_DIV);
			this.LITE_FG_DIV = null;
		}
	},
	resizeFlashToFitPaddedBox : function () {
		var flash = this.getFlash();
		if (flash) {
			var w = size.w - this.HPAD * 2;
			var h = size.h - this.VPAD * 2;
			flash.style.width = w; flash.style.height = h;
			flash.width = w; flash.height = h;
		}
	},
	resizeToFitPaddedBox : function (s, size) {
		if (typeof size == 'undefined') {
			size = this.getPageSize();
		}
		s.width = (size.w - this.HPAD * 2) + 'px';
		s.height = (size.h - this.VPAD * 2) + 'px';
	},
	resizeToPaddedBox : function (s) {
		s.left = s.right = this.HPAD + 'px';
		s.top = s.bottom = this.VPAD + 'px';
	},
	resizeUI : function () { // resize handler for Safari
		if (this.LITE_FG_DIV) {
			var fgs = this.LITE_FG_DIV.style;
			this.resizeToPaddedBox(fgs);
			this.resizeToFitPaddedBox(fgs);
			this.resizeFlashToFitPaddedBox();
		}
	},
	setRunningFlag : function (flag) {
		this.LITE_IS_RUNNING = flag;
		this.piclensIsRunning_ = flag;
	},
	setResizeHandler : function () { // for safari
		if (!this.RESIZE_HANDLER_EXISTS && this.BROWSER_SAF) {
			var self = this;
			window.addEventListener('resize', function () { self.resizeUI(); }, false);
			this.RESIZE_HANDLER_EXISTS = true;
		}
	},
	setResizeTimer : function () { // only do it for IE6...
		if (this.BROWSER_IE6) {
			this.RESIZE_TIMER_IE6 = setInterval(function () { PicLensLite.autoResize(); }, 1000);
		}
	},
	showFlashUI : function (feedText) {
		this.THE_FEED = feedText; // is "" if we are loading the feed in Flash
		this.findScriptLocation();
		this.createBackgroundOverlay();
		this.createForegroundFlashComponent();
		if (this.BROWSER_IE) {
			this.appendElementsToDocument();
		}
		this.injectFlashPlayer();
		if (!this.BROWSER_IE) {
			// Win Firefox needs this to be last
			// Other Browsers are OK with this
			this.appendElementsToDocument();
		}
		this.addKeyHandlers();
		this.addMouseHandlers();
		this.setRunningFlag(true);
		this.setResizeTimer();
		this.setResizeHandler();
		this.startLytebox();
	},
	sendMouseScrollToFlash : function (delta) {
		if (!this.isRunning()) { return; }
		var fl = this.getFlash();
		if (fl != null && fl.fl_mouseMoved) {
			fl.fl_mouseMoved(delta);
		}
	}
	// don't end the last function with a comma; it messes up IE7
};



/*	SWFObject v2.0 RC4: http://code.google.com/p/swfobject/
	Copyright 2007 Geoff Stearns, Michael Williams, and Bobby van der Sluis
	MIT License: http://www.opensource.org/licenses/mit-license.php */
var swfobject=function(){var X="undefined",P="object",a="visibility:visible",e="visibility:hidden",B="Shockwave Flash",h="ShockwaveFlash.ShockwaveFlash",V="application/x-shockwave-flash",K="SWFObjectExprInst",G=window,g=document,N=navigator,f=[],H=[],Q=null,L=null,S=false,C=false;var Y=function(){var l=typeof g.getElementById!=X&&typeof g.getElementsByTagName!=X&&typeof g.createElement!=X&&typeof g.appendChild!=X&&typeof g.replaceChild!=X&&typeof g.removeChild!=X&&typeof g.cloneNode!=X,t=[0,0,0],n=null;if(typeof N.plugins!=X&&typeof N.plugins[B]==P){n=N.plugins[B].description;if(n){n=n.replace(/^.*\s+(\S+\s+\S+$)/,"$1");t[0]=parseInt(n.replace(/^(.*)\..*$/,"$1"),10);t[1]=parseInt(n.replace(/^.*\.(.*)\s.*$/,"$1"),10);t[2]=/r/.test(n)?parseInt(n.replace(/^.*r(.*)$/,"$1"),10):0}}else{if(typeof G.ActiveXObject!=X){var o=null,s=false;try{o=new ActiveXObject(h+".7")}catch(k){try{o=new ActiveXObject(h+".6");t=[6,0,21];o.AllowScriptAccess="always"}catch(k){if(t[0]==6){s=true}}if(!s){try{o=new ActiveXObject(h)}catch(k){}}}if(!s&&o){try{n=o.GetVariable("$version");if(n){n=n.split(" ")[1].split(",");t=[parseInt(n[0],10),parseInt(n[1],10),parseInt(n[2],10)]}}catch(k){}}}}var v=N.userAgent.toLowerCase(),j=N.platform.toLowerCase(),r=/webkit/.test(v)?parseFloat(v.replace(/^.*webkit\/(\d+(\.\d+)?).*$/,"$1")):false,i=false,q=j?/win/.test(j):/win/.test(v),m=j?/mac/.test(j):/mac/.test(v);/*@cc_on i=true;@if(@_win32)q=true;@elif(@_mac)m=true;@end@*/return{w3cdom:l,pv:t,webkit:r,ie:i,win:q,mac:m}}();var d=function(){if(!Y.w3cdom){return }J(I);if(Y.ie&&Y.win){try{g.write("<script id=__ie_ondomload defer=true src=//:><\/script>");var i=b("__ie_ondomload");if(i){i.onreadystatechange=function(){if(this.readyState=="complete"){this.parentNode.removeChild(this);U()}}}}catch(j){}}if(Y.webkit&&typeof g.readyState!=X){Q=setInterval(function(){if(/loaded|complete/.test(g.readyState)){U()}},10)}if(typeof g.addEventListener!=X){g.addEventListener("DOMContentLoaded",U,null)}M(U)}();function U(){if(S){return }if(Y.ie&&Y.win){var m=W("span");try{var l=g.getElementsByTagName("body")[0].appendChild(m);l.parentNode.removeChild(l)}catch(n){return }}S=true;if(Q){clearInterval(Q);Q=null}var j=f.length;for(var k=0;k<j;k++){f[k]()}}function J(i){if(S){i()}else{f[f.length]=i}}function M(j){if(typeof G.addEventListener!=X){G.addEventListener("load",j,false)}else{if(typeof g.addEventListener!=X){g.addEventListener("load",j,false)}else{if(typeof G.attachEvent!=X){G.attachEvent("onload",j)}else{if(typeof G.onload=="function"){var i=G.onload;G.onload=function(){i();j()}}else{G.onload=j}}}}}function I(){var l=H.length;for(var j=0;j<l;j++){var m=H[j].id;if(Y.pv[0]>0){var k=b(m);if(k){H[j].width=k.getAttribute("width")?k.getAttribute("width"):"0";H[j].height=k.getAttribute("height")?k.getAttribute("height"):"0";if(O(H[j].swfVersion)){if(Y.webkit&&Y.webkit<312){T(k)}}else{if(H[j].expressInstall&&!C&&O("6.0.65")&&(Y.win||Y.mac)){D(H[j])}else{c(k)}}}}A("#"+m,a)}}function T(m){var k=m.getElementsByTagName(P)[0];if(k){var p=W("embed"),r=k.attributes;if(r){var o=r.length;for(var n=0;n<o;n++){if(r[n].nodeName.toLowerCase()=="data"){p.setAttribute("src",r[n].nodeValue)}else{p.setAttribute(r[n].nodeName,r[n].nodeValue)}}}var q=k.childNodes;if(q){var s=q.length;for(var l=0;l<s;l++){if(q[l].nodeType==1&&q[l].nodeName.toLowerCase()=="param"){p.setAttribute(q[l].getAttribute("name"),q[l].getAttribute("value"))}}}m.parentNode.replaceChild(p,m)}}function F(i){if(Y.ie&&Y.win&&O("8.0.0")){G.attachEvent("onunload",function(){var k=b(i);for(var j in k){if(typeof k[j]=="function"){k[j]=function(){}}}k.parentNode.removeChild(k)})}}function D(j){C=true;var o=b(j.id);if(o){if(j.altContentId){var l=b(j.altContentId);if(l){L=l}}else{L=Z(o)}if(!(/%$/.test(j.width))&&parseInt(j.width,10)<310){j.width="310"}if(!(/%$/.test(j.height))&&parseInt(j.height,10)<137){j.height="137"}g.title=g.title.slice(0,47)+" - Flash Player Installation";var n=Y.ie&&Y.win?"ActiveX":"PlugIn",k=g.title,m="MMredirectURL="+G.location+"&MMplayerType="+n+"&MMdoctitle="+k,p=j.id;if(Y.ie&&Y.win&&o.readyState!=4){var i=W("div");p+="SWFObjectNew";i.setAttribute("id",p);o.parentNode.insertBefore(i,o);o.style.display="none";G.attachEvent("onload",function(){o.parentNode.removeChild(o)})}R({data:j.expressInstall,id:K,width:j.width,height:j.height},{flashvars:m},p)}}function c(j){if(Y.ie&&Y.win&&j.readyState!=4){var i=W("div");j.parentNode.insertBefore(i,j);i.parentNode.replaceChild(Z(j),i);j.style.display="none";G.attachEvent("onload",function(){j.parentNode.removeChild(j)})}else{j.parentNode.replaceChild(Z(j),j)}}function Z(n){var m=W("div");if(Y.win&&Y.ie){m.innerHTML=n.innerHTML}else{var k=n.getElementsByTagName(P)[0];if(k){var o=k.childNodes;if(o){var j=o.length;for(var l=0;l<j;l++){if(!(o[l].nodeType==1&&o[l].nodeName.toLowerCase()=="param")&&!(o[l].nodeType==8)){m.appendChild(o[l].cloneNode(true))}}}}}return m}function R(AE,AC,q){var p,t=b(q);if(typeof AE.id==X){AE.id=q}if(Y.ie&&Y.win){var AD="";for(var z in AE){if(AE[z]!=Object.prototype[z]){if(z=="data"){AC.movie=AE[z]}else{if(z.toLowerCase()=="styleclass"){AD+=' class="'+AE[z]+'"'}else{if(z!="classid"){AD+=" "+z+'="'+AE[z]+'"'}}}}}var AB="";for(var y in AC){if(AC[y]!=Object.prototype[y]){AB+='<param name="'+y+'" value="'+AC[y]+'" />'}}t.outerHTML='<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"'+AD+">"+AB+"</object>";F(AE.id);p=b(AE.id)}else{if(Y.webkit&&Y.webkit<312){var AA=W("embed");AA.setAttribute("type",V);for(var x in AE){if(AE[x]!=Object.prototype[x]){if(x=="data"){AA.setAttribute("src",AE[x])}else{if(x.toLowerCase()=="styleclass"){AA.setAttribute("class",AE[x])}else{if(x!="classid"){AA.setAttribute(x,AE[x])}}}}}for(var w in AC){if(AC[w]!=Object.prototype[w]){if(w!="movie"){AA.setAttribute(w,AC[w])}}}t.parentNode.replaceChild(AA,t);p=AA}else{var s=W(P);s.setAttribute("type",V);for(var v in AE){if(AE[v]!=Object.prototype[v]){if(v.toLowerCase()=="styleclass"){s.setAttribute("class",AE[v])}else{if(v!="classid"){s.setAttribute(v,AE[v])}}}}for(var u in AC){if(AC[u]!=Object.prototype[u]&&u!="movie"){E(s,u,AC[u])}}t.parentNode.replaceChild(s,t);p=s}}return p}function E(k,i,j){var l=W("param");l.setAttribute("name",i);l.setAttribute("value",j);k.appendChild(l)}function b(i){return g.getElementById(i)}function W(i){return g.createElement(i)}function O(k){var j=Y.pv,i=k.split(".");i[0]=parseInt(i[0],10);i[1]=parseInt(i[1],10);i[2]=parseInt(i[2],10);return(j[0]>i[0]||(j[0]==i[0]&&j[1]>i[1])||(j[0]==i[0]&&j[1]==i[1]&&j[2]>=i[2]))?true:false}function A(m,j){if(Y.ie&&Y.mac){return }var l=g.getElementsByTagName("head")[0],k=W("style");k.setAttribute("type","text/css");k.setAttribute("media","screen");if(!(Y.ie&&Y.win)&&typeof g.createTextNode!=X){k.appendChild(g.createTextNode(m+" {"+j+"}"))}l.appendChild(k);if(Y.ie&&Y.win&&typeof g.styleSheets!=X&&g.styleSheets.length>0){var i=g.styleSheets[g.styleSheets.length-1];if(typeof i.addRule==P){i.addRule(m,j)}}}return{registerObject:function(l,i,k){if(!Y.w3cdom||!l||!i){return }var j={};j.id=l;j.swfVersion=i;j.expressInstall=k?k:false;H[H.length]=j;A("#"+l,e)},getObjectById:function(l){var i=null;if(Y.w3cdom&&S){var j=b(l);if(j){var k=j.getElementsByTagName(P)[0];if(!k||(k&&typeof j.SetVariable!=X)){i=j}else{if(typeof k.SetVariable!=X){i=k}}}}return i},embedSWF:function(n,u,r,t,j,m,k,p,s){if(!Y.w3cdom||!n||!u||!r||!t||!j){return }r+="";t+="";if(O(j)){A("#"+u,e);var q=(typeof s==P)?s:{};q.data=n;q.width=r;q.height=t;var o=(typeof p==P)?p:{};if(typeof k==P){for(var l in k){if(k[l]!=Object.prototype[l]){if(typeof o.flashvars!=X){o.flashvars+="&"+l+"="+k[l]}else{o.flashvars=l+"="+k[l]}}}}J(function(){R(q,o,u);A("#"+u,a)})}else{if(m&&!C&&O("6.0.65")&&(Y.win||Y.mac)){A("#"+u,e);J(function(){var i={};i.id=i.altContentId=u;i.width=r;i.height=t;i.expressInstall=m;D(i);A("#"+u,a)})}}},getFlashPlayerVersion:function(){return{major:Y.pv[0],minor:Y.pv[1],release:Y.pv[2]}},hasFlashPlayerVersion:O,createSWF:function(k,j,i){if(Y.w3cdom&&S){return R(k,j,i)}else{return undefined}},createCSS:function(j,i){if(Y.w3cdom){A(j,i)}},addDomLoadEvent:J,addLoadEvent:M,getQueryParamValue:function(m){var l=g.location.search||g.location.hash;if(m==null){return l}if(l){var k=l.substring(1).split("&");for(var j=0;j<k.length;j++){if(k[j].substring(0,k[j].indexOf("="))==m){return k[j].substring((k[j].indexOf("=")+1))}}}return""},expressInstallCallback:function(){if(C&&L){var i=b(K);if(i){i.parentNode.replaceChild(L,i);L=null;C=false}}}}}();

/* BrowserDetect: http://www.quirksmode.org/js/detect.html */
var BrowserDetect={
	init:function() { this.browser = this.searchString(this.dataBrowser) || "Unknown Browser"; this.version = this.searchVersion(navigator.userAgent) || this.searchVersion(navigator.appVersion) || "Unknown Version"; this.OS = this.searchString(this.dataOS) || "Unknown OS"; },
	searchString:function(data) { for (var i=0;i<data.length;i++)	{ var dataString = data[i].string; var dataProp = data[i].prop; this.versionSearchString = data[i].versionSearch || data[i].identity; if (dataString) { if (dataString.indexOf(data[i].subString) != -1) {return data[i].identity;} } else if (dataProp) { return data[i].identity; } } },
	searchVersion:function(dataString) { var index = dataString.indexOf(this.versionSearchString); if (index == -1) {return;} return parseFloat(dataString.substring(index+this.versionSearchString.length+1)); },
	dataBrowser:[
		{ string: navigator.userAgent, subString: "OmniWeb", versionSearch: "OmniWeb/", identity: "OmniWeb" },
		{ string: navigator.vendor, subString: "Apple", identity: "Safari" },
		{ prop: window.opera, identity: "Opera" },
		{ string: navigator.vendor, subString: "iCab", identity: "iCab" },
		{ string: navigator.vendor, subString: "KDE", identity: "Konqueror" },
		{ string: navigator.userAgent, subString: "Firefox", identity: "Firefox" },
		{ string: navigator.vendor, subString: "Camino", identity: "Camino" },
		{ string: navigator.userAgent, subString: "Netscape", identity: "Netscape" }, // newer Netscapes (6+)
		{ string: navigator.userAgent, subString: "MSIE", identity: "Explorer", versionSearch: "MSIE" },
		{ string: navigator.userAgent, subString: "Gecko", identity: "Mozilla", versionSearch: "rv" },
		{ string: navigator.userAgent, subString: "Mozilla", identity: "Netscape", versionSearch: "Mozilla" } // older Netscapes (4-)
	],
	dataOS:[{ string: navigator.platform, subString: "Win", identity: "Windows" }, { string: navigator.platform, subString: "Mac", identity: "Mac" }, { string: navigator.platform, subString: "Linux", identity: "Linux" } ]
};
BrowserDetect.init();
