/*!
 * URL Handler - v0.1
 *
 * Copyright (c) 2013 Dave Olsen, http://dmolsen.com
 * Licensed under the MIT license
 *
 * Helps handle the initial iFrame source. Parses a string to see if it matches
 * an expected pattern in Pattern Lab. Supports Pattern Labs fuzzy pattern partial
 * matching style.
 *
 */

var urlHandler = {
	
	// if true it'll make sure iFrames and history aren't updated on back button click
	skipBack: false,
	
	/**
	* get the real file name for a given pattern name
	* @param  {String}       the shorthand partials syntax for a given pattern
	*
	* @return {String}       the real file path
	*/
	getFileName: function (name) {
		
		var baseDir     = "patterns";
		var fileName    = "";
		
		if (name == undefined) {
			return fileName;
		}
		
		var paths = (name.indexOf("viewall-") != -1) ? viewAllPaths : patternPaths;
		nameClean = name.replace("viewall-","");
		
		// look at this as a regular pattern
		var bits        = this.getPatternInfo(nameClean, paths);
		var patternType = bits[0];
		var pattern     = bits[1];
		
		if ((paths[patternType] != undefined) && (paths[patternType][pattern] != undefined)) {
			
			fileName = paths[patternType][pattern];
			
		} else if (paths[patternType] != undefined) {
			
			for (patternMatchKey in paths[patternType]) {
				if (patternMatchKey.indexOf(pattern) != -1) {
					fileName = paths[patternType][patternMatchKey];
					break;
				}
			}
		
		}
		
		if (fileName == "") {
			return fileName;
		}
		
		var regex = /\//g;
		if ((name.indexOf("viewall-") != -1) && (fileName != "")) {
			fileName = baseDir+"/"+fileName.replace(regex,"-")+"/index.html";
		} else if (fileName != "") {
			fileName = baseDir+"/"+fileName.replace(regex,"-")+"/"+fileName.replace(regex,"-")+".html";
		}
		
		return fileName;
	},
	
	/**
	* break up a pattern into its parts, pattern type and pattern name
	* @param  {String}       the shorthand partials syntax for a given pattern
	* @param  {Object}       the paths to be compared
	*
	* @return {Array}        the pattern type and pattern name
	*/
	getPatternInfo: function (name, paths) {
		
		var patternBits = name.split("-");
		
		var i = 1;
		var c = patternBits.length;
		
		var patternType = patternBits[0];
		while ((paths[patternType] == undefined) && (i < c)) {
			patternType += "-"+patternBits[i];
			i++;
		}
		
		pattern = name.slice(patternType.length+1,name.length);
		
		return [patternType, pattern];
		
	},
	
	/**
	* search the request vars for a particular item
	*
	* @return {Object}       a search of the window.location.search vars
	*/
	getRequestVars: function() {
		
		// the following is taken from https://developer.mozilla.org/en-US/docs/Web/API/window.location
		var oGetVars = new (function (sSearch) {
		  if (sSearch.length > 1) {
		    for (var aItKey, nKeyId = 0, aCouples = sSearch.substr(1).split("&"); nKeyId < aCouples.length; nKeyId++) {
		      aItKey = aCouples[nKeyId].split("=");
		      this[unescape(aItKey[0])] = aItKey.length > 1 ? unescape(aItKey[1]) : "";
		    }
		  }
		})(window.location.search);
		
		return oGetVars;
		
	},
	
	/**
	* push a pattern onto the current history based on a click
	* @param  {String}       the shorthand partials syntax for a given pattern
	*/
	pushPattern: function (pattern) {
		var data = { "pattern": pattern };
		var path = window.location.protocol+"//"+window.location.host+window.location.pathname.replace("index.html","")+urlHandler.getFileName(pattern);
		if (document.getElementById("sg-viewport").contentWindow.location.toString() != path) {
			urlHandler.skipBack = true;
			document.getElementById("sg-viewport").contentWindow.location.replace(path);
		} else {
			history.pushState(data, "", window.location.protocol+"//"+window.location.host+window.location.pathname.replace("index.html","")+"?p="+pattern);
		}
	},
	
	/**
	* based on a click forward or backward modify the url and iframe source
	* @param  {Object}      event info like state and properties set in pushState()
	*/
	popPattern: function (e) {
		
		var state = e.state;
		
		if (state == null) {
			var rVars = this.getRequestVars();
			if ((rVars.p != undefined) || (rVars.pattern != undefined)) {
				var patternName = (rVars.p != undefined) ? rVars.p : rVars.pattern;
			} else {
				this.skipBack = false;
				return;
			}
		} else if (state != null) {
			var patternName = state.pattern;
		} 
		
		var iFramePath = "";
		iFramePath = this.getFileName(patternName);
		if (iFramePath == "") {
			iFramePath = window.location.protocol+"//"+window.location.host+window.location.pathname.replace("index.html","")+"styleguide/html/styleguide.html";
		}
		
		document.getElementById("sg-viewport").contentWindow.location.replace(iFramePath);
		
		if (wsnConnected) {
			wsn.send( '{"url": "'+iFramePath+'", "patternpartial": "'+patternName+'" }' );
		}
		
	}
	
}

/**
* handle the onpopstate event
*/
window.onpopstate = function (event) {
	urlHandler.skipBack = true;
	urlHandler.popPattern(event);
}