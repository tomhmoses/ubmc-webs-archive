var Ajax = function() {

	this.post = function(url, query) {
		this.transport = Ajax.getTransport();
		url = '/_proxy?fw_url=' + encodeURIComponent(url)
		if(arguments.length > 1) {
			//method = post
			this.transport.open('post', url, true);
			this.transport.onreadystatechange = this.onStateChange.bind(this);
			this.transport.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
			if(typeof(query) == 'object') {
				query = Ajax.toQueryString(query);
				query += Ajax.fwParams;
				query += '&fw_ajax_type=' + this.responseType;
				this.transport.send(query);
			} else if(typeof(query == 'string')) {
				query += Ajax.fwParams;
				query += '&fw_ajax_type=' + this.responseType;
				this.transport.send(query);
			} else {
				this.transport.send(null);
			}
		} else {
			//method = get
			this.transport.open('get', url, true);
			this.transport.onreadystatechange = this.onStateChange.bind(this);
			this.transport.send(null);
		}
		return this;
	};

	this.onStateChange = function() {
//		this.options.onStateChange.delay(10, this);
		if(this.transport.readyState == 4) {
			if(this.transport.status == 200) {
//			if (this.options.update) $(this.options.update).setHTML(this.transport.responseText);
//			this.options.onComplete.pass(this.transport, this).delay(20);
				this.onComplete();
//			if (this.options.evalScripts) this.evalScripts.delay(30, this);
//			this.callChain();
			} else {
				this.onError();
			}
			this.transport.onreadystatechange = function(){};
		}
	};

	this.onComplete = function() {
		if(this.ondone) this.ondone(this.transport.responseText);
	};

	this.onError = function() {
		if(this.onerror) this.onerror();
	};

/*
	this.evalScripts = function() {
		if(scripts = this.transport.responseText.match(/<script[^>]*?>[\S\s]*?<\/script>/g)){
			scripts.each(function(script){
				eval(script.replace(/^<script[^>]*?>/, '').replace(/<\/script>$/, ''));
			});
		}
	};
*/

	//constructor
//	this.transport = Ajax.getTransport();
	this.responseType = Ajax.RAW;
	Ajax.fwParams = window.fwParams ? window.fwParams : ('&fw_app=' + parent.Editor.page.app + parent.Editor.page.params);
};

//static methods
Ajax.getTransport = function() {
	if (window.XMLHttpRequest) return new XMLHttpRequest();
	else if (window.ActiveXObject) return new ActiveXObject('Microsoft.XMLHTTP');
};

Ajax.toQueryString = function(source) {
	var queryString = [];
	for (var property in source) queryString.push(encodeURIComponent(property)+'='+encodeURIComponent(source[property]));
	return queryString.join('&');
};

Ajax.RAW = 'raw';
Ajax.JSON = 'json';
Ajax.FWML = Ajax.FBML = 'fwml';
Ajax.fwParams = '';

if(!window.fw) fw = {};
fw.Ajax = Ajax;
