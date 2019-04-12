/* Global Settings */
/*******************/

var linkApplication = {
	getAjax : function getAjax(){
		if(typeof(this.ajax) === "undefined"){
			this.ajax = new Ajax();
		}
		return this.ajax;
	},
	getLinkContextBar : function getLinkContextBar(){
		if(typeof(this.linkContextBar) === "undefined"){
			this.linkContextBar = jQuery("#linkContextBar");
		}
		return this.linkContextBar;
	},
	getSaveIndicator : function getSaveIndicator(){
		if(typeof(this.saveIndicator) === "undefined"){
			this.saveIndicator = jQuery("#saveIndicator");
		}
		return this.saveIndicator;
	},
	showContextIdleState : function showContextIdleState(showLinkContextBar){
		var saveIndicator = this.getSaveIndicator();
		if(typeof(saveIndicator) !== "undefined"){
			saveIndicator.css("visibility","hidden");
		}
		if(showLinkContextBar){
			this.getLinkContextBar().css("visibility","visible");
		}
	},
	showContextSavingState : function showContextSavingState(hideLinkContextBar){
		var saveIndicator = this.getSaveIndicator();
		if(typeof(saveIndicator) !== "undefined" && saveIndicator != null){
			saveIndicator.css("visibility","visible");
		}
		if(hideLinkContextBar){
			this.getLinkContextBar().css("visibility","hidden");
		}
	},	
	onDeleteLinkGroup : function onDeleteLinkGroup(id, data){
		function cleanUp(){
			jQuery("#linkGroup_" +id).remove(); 
			jQuery("#linkGroupsUL").show();
			jQuery("#toc_"+id).remove();
			linkApplication.getLinkContextBar().hide();
		}

		if ( data == 'OK' ) {
			animateDelete("linkGroupDiv_"+id);
			setTimeout(cleanUp, 600);			
		} 
		else {
			alert( "Unable to delete category, please try reloading the page and try again." );  
		}
		this.showContextIdleState(true);
	},
	onDeleteLink : function onDeleteLink(id, data){
		function cleanUp(){
			jQuery("#link_" + id).remove();
		}
		
		if ( data == 'OK' ) {
			animateDelete("link_"+id+"_CB");
			setTimeout(cleanUp, 600);
		} 
		else {
			alert( "Unable to delete link, please try reloading the page and try again." );	 
		}
		this.showContextIdleState(true);		
	},
	onDelete : function onDelete(id, confirm_msg, callback, delete_url){
		if (confirm(confirm_msg)) {
			this.showContextSavingState(true);
			var ajax = this.getAjax();
			ajax.ondone = function(data){
				callback(id, data);
			}
			ajax.post(delete_url + '/' + id, {"_method":"delete"});
		}	
		fwGetContextBar('linkContextBar').hide();
	},
	onSort : function onSort(sort_url, data){
		var ajax = this.getAjax();
		ajax.ondone = function(data){ linkApplication.showContextIdleState(false); };
		this.showContextSavingState(false);
		ajax.post(sort_url,data);
	},
	settings_addCategory : function settings_addCategory(callback){
		var insertion = document.createElement("input");
		insertion.type = "hidden";
		insertion.name = "new";
		insertion.value = 1;
		el = jQuery('#link_group_form');
		el.append(insertion);

		callback.call();
	},
	ajaxLinkPreview : function ajaxLinkPreview(id, thumbnail_url, url_element){
		var ajax = linkApplication.getAjax();
		ajax.ondone = function(data){ 
			jQuery("#"+id).attr("src", data);
	  	};
		ajax.post(links_thumbnail_url,{'url':url_element.value});
	},
	settings_animateDelete : function settings_animateDelete(el, callback){	
		el.animate({"opacity": "0"}, callback);
	},
	settings_remove : function settings_remove(el, confirm_msg, val, callback){
		if (confirm(confirm_msg)) {		
			var deletion = document.createElement("input");
			deletion.type = "hidden";
			deletion.name = "delete[]";
			deletion.value = val;
			el.parent().append(deletion);
			linkApplication.settings_animateDelete(el, function(){ el.remove(); });
			if(typeof(callback) !== "undefined"){
				callback.call();
			}
		}	
	},
	settings_removeLink : function settings_removeLink(id, confirm_msg){
		var el = jQuery("#"+id);
		linkApplication.settings_remove(el, confirm_msg, id.slice(5));
	},
	settings_removeCategory : function settings_removeCategory(el, confirm_msg){
		linkApplication.settings_remove(el, confirm_msg, el.attr("id").slice(4), function(){
			var flashMsg = $(".fw-flash");
			if(flashMsg.length == 0){
				flashMsg = jQuery("<div>").addClass("fw-flash").insertBefore("#link_group_form");
			}
			flashMsg.html(linkApplication.strings.del_category_success);
		});
	},
	settings_move : function settings_move(el, down){

		var next = el.next(),
			prev = el.prev(),
			els = [];

		/* Handle the edge cases, cant move too far either way */
		if( (down && (next.length == 0)) || (!down && (prev.length == 0)) ){
			return;
		}

		els.push(el);	

		if(down){
			els.push(next);
		}else{
			els.push(prev);
		}

		//Animate both elements at the same time, but only call the swap code once
		jQuery.each(els, function(i, v){
			jQuery(this).animate({"opacity": "0.3"}, function(){
				if(i == 1){linkApplication.settings_swap(els);} //Hacky, but it works.
				jQuery(this).animate({"opacity": "1"});
			})
		});
	},
	// Generic attribute swap function
	// Takes 2 jQuery elements (elementA and elementB) and an array of attributes to swap
	// For every attribute, swap the attribute value of elementA and elementB
	elementAttrsSwap : function elementAttrsSwap(elementA, elementB, attrs){		
		for (var i=0; i<attrs.length; i++){
			var attribute = attrs[i],
			 	temp = elementA.attr(attribute);

			elementA.attr(attribute, elementB.attr(attribute));
			elementB.attr(attribute, temp);
		}

	},
	settings_swap : function settings_swap(els){

		var main = jQuery(els[0]),
			main2 = jQuery(els[1]),
			mainID = main.attr("id"), 
			main2ID = main2.attr("id"),
			mainHidden = jQuery("#"+mainID + "_hidden"),
			main2Hidden = jQuery("#"+main2ID + "_hidden"),
			mainName = jQuery("#"+mainID + "_name"),
			main2Name = jQuery("#"+main2ID + "_name"),
			mainDesc = jQuery("#"+mainID + "_desc"),
			main2Desc = jQuery("#"+main2ID + "_desc");

		// Swap IDs
		linkApplication.elementAttrsSwap(main, main2, ["id"]);

		// Swap hidden input values and IDs
		linkApplication.elementAttrsSwap(mainHidden, main2Hidden, ["value", "id"]);

		// Swap text input values and IDs and Names
		linkApplication.elementAttrsSwap(mainName, main2Name, ["value", "id", "name"]);

		// Swap text area values and IDs and Names
		linkApplication.elementAttrsSwap(mainDesc, main2Desc, ["value", "id", "name"]);
	},
	more_link_please : function more_link_please( link_id ) {
	  jQuery("link_url_" + link_id ).hide();
	  jQuery("link_url_full_" + link_id ).show();
	  return false;
	},
	strings : {
		fwjs_confirm_del_category : "WARNING: Are you sure you want to remove this category and all of its links?",
		fwjs_confirm_del_group : "WARNING: Are you sure you want to permanently remove this category and all of its links?",
		fwjs_confirm_del_link : "Are you sure you want to permanently remove this link?",
		del_category_success : "[Click submit to remove category.]"
	},
	ajaxDeleteLink : function ajaxDeleteLink(id, confirm_msg){
		var callback = function(id, data){
			linkApplication.onDeleteLink(id, data);
		}
		linkApplication.onDelete(id, confirm_msg, callback, links_delete_url);
	},
	ajaxSort : function ajaxSort(id){
		linkApplication.onSort(links_sort_url,Sortable.serialize("links-"+ id)+"&LG_id="+id);
	},
	ajaxSortLG : function ajaxSortLG(){
		linkApplication.onSort(links_sort_group_url,Sortable.serialize("linkGroupsUL"));
	}
}
var Link = {

	cbID: -1,

	goWithId : function(url) {
		document.location.href = url + '/' + Link.cbId;
	},

	edit : function(url) {
		Link.setCbId();
    url = url + '/links/' + Link.cbId + '/edit';
		document.location.href = url;
	},

	refresh: function(url) {
		Link.setCbId();
    url = url + '/links/refresh/' + Link.cbId;
		document.location.href = url;
	},

	remove : function(confirm_msg) {
		Link.setCbId();
		linkApplication.ajaxDeleteLink(Link.cbId, confirm_msg);
	},

	setCbId : function() {
		Link.cbId = fwGetContextBar('linkContextBar').getID();
	},

	validate : function(obj) {
		/* TODO - validation time baby */
		var allInput = document.getElementsByTagName("input");
		var i,len,fail, curr;

		for(i=0, len=allInput.length; i<len; i++){
			curr = allInput[i];
			if(curr && curr.className && curr.className=="URL" && (!curr.value || curr.value=="")){
				fail = true;
				break;
			}
		}

		if(fail){
			window.scroll(0,0);
			jQuery('#linkErrors').show();
			return false;
		}else{
			return true;
		}
	}
};


var LinkGroup = {
	cbID: -1,

	goWithId : function(url) {
		document.location.href = url + '/' + Link.cbId;
	},

	edit : function(url) {
		Link.setCbId();
		Link.goWithId(url);
	},

	setCbId : function() {
		Link.cbId = fwGetContextBar('linkContextBar').getID();
	}
};