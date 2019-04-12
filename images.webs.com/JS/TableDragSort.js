/**
 * @author idris
 * @require mootools
 */
var TableDragSort = {instances:[]};
TableDragSort.enableSort = function(table, opts) {
        var pub = {};

        var options = Object.extend({}, opts);

        table.unselectable = 'on';

        var startPos = null;
        var startTD = null;
        var slack = 5;
        var tablePos = getAbsPos(table);
        var tdList = [];
        var row = $(table).getFirst().getFirst();

        var numRows = 0;
        var numCols = 0;
        while(row) {
                numRows++;
                var cols = row.childNodes;
                for(var i=0;i<cols.length;i++) {
                        if(cols[i].nodeType == 1 && cols[i].tagName == 'TD') {
                                numCols++;
                                tdList.push(cols[i]);
                        }
                }
                row = row.getNext();
        }
        numCols = numCols / numRows;
/*
        for(var i=0;i<kids.length;i++) {
                if(kids[i].tagName == 'tr') {

                }
        }
*/

        var curr = null;

        function getAbsPos(el) {
                var doc = document;
                if (el.getBoundingClientRect) { // IE
                  var r = el.getBoundingClientRect();
                  return {
                        absLeft: r.left + (doc.body.scrollLeft || doc.documentElement.scrollLeft || 0),
                        absTop: r.top + (doc.body.scrollTop || doc.documentElement.scrollTop || 0),
                        width: r.right - r.left,
                        height: r.bottom - r.top
                  };
                }
                else
                  if (doc.getBoxObjectFor) { // FF
                        var r = doc.getBoxObjectFor(el);
                        return {
                          absLeft: r.x,
                          absTop: r.y,
                          width: r.width,
                          height: r.height
                        };
                  }
        }

	var createGhost = function(){};

	function onDragStart(el) {
			startTD = el;
			if(options.onDragStart) {
					options.onDragStart(el);
			}
	}
	function onDrop(el) {
			if(startTD == el) return false;
			if(options.onDrop) {
					options.onDrop(el);
			}
			startTD = null;
	}

	function onMouseDown(el, e) {
			var evnt = e || event;
//              stopEvent(evnt);
			var pos = getAbsPos(el);
			var kids = el.childNodes;
			var i;
			for(i=0;i<kids.length;i++) {
					if(kids[i].nodeType == 1) break;
			}
			if(i >= kids.length) return;
			var fp = getAbsPos(kids[i]);
			var ePos = getPos(evnt);
			var eX = ePos.left;
			var eY = ePos.top;
			startPos = {'x':eX, 'y':eY};
			createGhost = function() {
					var ghost = document.createElement("div");
				ghost.style.position = 'absolute';
				ghost.style.paddingLeft = (fp.absLeft - pos.absLeft) + 'px';
				ghost.style.paddingTop = (fp.absTop - pos.absTop) + 'px';
				ghost.style.left = pos.absLeft + 'px';
				ghost.style.top = pos.absTop + 'px';
				ghost.style.width = pos.width + 'px';
				ghost.style.height = pos.height + 'px';
//              ghost.style.opacity = '0.7';
//                      ghost.appendChild(getFirst(el).cloneNode(true));
				ghost.innerHTML = el.innerHTML;
				document.body.appendChild(ghost);
				el.style.visibility = 'hidden';
				curr = {'el': el, 'ghost': ghost, 'offsetX': eX - pos.absLeft, 'offsetY': eY - pos.absTop, 'origPos':pos, 'lastEl':el, 'lastPos':pos};
				return ghost;
		};
//              $(document.body).addEvent('mousemove', onMouseMove);
//              $(document.body).addEvent('mouseup', onMouseUp);
		document.onmousemove = onMouseMove;
		document.onmouseup = onMouseUp;
//              observe(document.body, "mousemove", onMouseMove);
//              observe(document.body, "mouseup", onMouseUp);
		return false;
}
function onMouseMove(e) {
		var evnt = e || event;
		var ePos = getPos(evnt);
		if(curr == null) {
				if(Math.abs(ePos.left - startPos.x) >= slack || Math.abs(ePos.top - startPos.y) >= slack) {
						createGhost();
						onDragStart(curr.el);
				} else {
						return true;
				}
		}

//              stopEvent(e);
//              if(curr == null) onMouseUp(null, e);
		curr.ghost.style.opacity = '0.9';
		var newX = ePos.left - curr.offsetX;
		var newY = ePos.top - curr.offsetY;

/* //if we want to bound dragging within table borders
		if(newY > tablePos.absTop && newY < tablePos.absTop + tablePos.height) {
				curr.ghost.style.top = newY + 'px';
		}
		if(newX > tablePos.absLeft && newX < tablePos.absLeft + tablePos.width) {
				curr.ghost.style.left = newX + 'px';
		}
*/

		curr.ghost.style.top = newY + 'px';
		curr.ghost.style.left = newX + 'px';

		var rowChange = 0;
		var colChange = 0;
		var ny = ePos.top;
		var nx = ePos.left;
		if(ny < curr.lastPos.absTop) {
				//try up 1 row
				rowChange = -1;
		} else if(ny > curr.lastPos.absTop + curr.lastPos.height) {
				//try down 1 row
				rowChange = 1;
		} else {
				if(nx < curr.lastPos.absLeft) {
						//try left 1 col
					colChange = -1;
			} else if(nx > curr.lastPos.absLeft + curr.lastPos.width) {
					//try right 1 col
					colChange = 1;
			}
	}

	var newEl = curr.lastEl;
	var newRow = curr.lastEl.parentNode;
	if(rowChange != 0) {
			newRow = $(newRow).getBrother(rowChange>0?'next':'previous');
			if(!newRow) {
					rowChange = 0;
			}
	} else if(colChange != 0) {
			newEl = $(newEl).getBrother(colChange>0?'next':'previous');
			if(!newEl) {
					colChange = 0;
			}
	}

	if(rowChange != 0) {
			var tmp = curr.lastEl.innerHTML;
			var last = curr.lastEl;
			var el = $(curr.lastEl).getBrother(rowChange>0?'next':'previous');
			var cols = numCols;
			while(el) {
					cols--;
					last.innerHTML = el.innerHTML;
					last = el;
					el = el.getBrother(rowChange>0?'next':'previous');
			}
			if(rowChange > 0) {
				el = newRow.getFirst();
		} else {
				el = newRow.getLast();
		}
		while(cols-- > 0 && el) {
				last.innerHTML = el.innerHTML;
				last = el;
				el = el.getBrother(rowChange>0?'next':'previous');
		}
		last.innerHTML = tmp;

		last.style.visibility = 'hidden';
		curr.lastEl.style.visibility = 'visible';
		curr.lastEl = last;
		curr.lastPos = getAbsPos(curr.lastEl);
} else if(colChange != 0) {
		newEl.style.visibility = 'hidden';
		var tmp = newEl.innerHTML;
		newEl.innerHTML = curr.lastEl.innerHTML;
		curr.lastEl.innerHTML = tmp;
		curr.lastEl.style.visibility = 'visible';

		curr.lastEl = newEl;
		curr.lastPos = getAbsPos(curr.lastEl);
}
return false;
}
function onMouseUp(e) {
document.onmousemove = null;
document.onmouseup = null;
if(curr == null) {
		return true;
}
	var evnt = e || event;
//              stopEvent(evnt);
	var pos = getPos(evnt);
//              $(document.body).removeEvent('mousemove', onMouseMove);
//              $(document.body).removeEvent('mouseup', onMouseUp);
	document.onmousemove = null;
	document.onmouseup = null;
//              unobserve(document.body, "mousemove", onMouseMove);
//              unobserve(document.body, "mouseup", onMouseUp);
	curr.ghost.style.display = 'none';
	var dropTD = $(curr.lastEl);
	var prev = dropTD.getPrevious();
	while(isEmpty(prev)) {
			dropTD = prev;
			prev = dropTD.getPrevious();
	}
	if(dropTD != curr.lastEl) {
			dropTD.innerHTML = curr.lastEl.innerHTML;
			curr.lastEl.innerHTML = '&#160;';
	}
	curr.lastEl.style.visibility = 'visible';
//              curr.ghost.parentNode.removeChild(curr.ghost);
	curr = null;
	onDrop(dropTD);
	return false;
}

function isEmpty(el) {
	return el.innerHTML == '&#160;' || el.innerHTML == '&nbsp;';
}

function getPos(e) {
/*
                if(e.offsetX) {
                        return {top:e.offsetY + document.body.scrollTop, left:e.offsetX + document.body.scrollLeft};
                } else if(e.clientX) {
*/
                        return {top:e.clientY + (document.body.scrollTop || document.documentElement.scrollTop || 0), left:e.clientX + (document.body.scrollLeft || document.documentElement.scrollLeft || 0)};
//              }
        }

/*
        function observe(el, type, listener) {
                if(el.attachEvent) {
                        el.attachEvent("on" + type, listener);
                } else if(el.addEventListener) {
                        el.addEventListener(type, listener, false);
                }
        }
        function unobserve(el, type, listener) {
                if(el.detachEvent) {
                        el.detachEvent("on" + type, listener);
                } else if(el.removeEventListener) {
                        el.removeEventListener(type, listener, false);
                }
        }
*/
        function stopEvent(e) {
                if(e.preventDefault) {
                        e.preventDefault();
                        e.stopPropagation();
                } else {
					e.returnValue = false;
					 e.cancelBubble = true;
			 }
	 }

	 function init() {
			 for(var i=0;i<tdList.length;i++) {
					 var td = tdList[i];
					 function observeOne(td) {
 //                              $(td).addEvent('mousedown', function(e){onMouseDown(td, e);});
							 td.onmousedown = function(e){return onMouseDown(td,e);};
					 };
					 observeOne(td);
			 }
	 }

	 init();

	pub.isActive = function() {
		return curr != null;
	};

	 return pub;
 };


 TableDragSort.isEmpty = function(el) {
	 return el.innerHTML == '&#160;' || el.innerHTML == '&nbsp;';
 }
 TableDragSort.deleteTD = function(el) {
	 var td = $(el);
	 while(td) {
			 var n = TableDragSort.getNextTD(td);
			 if(!n || TableDragSort.isEmpty(n)) {
					 td.innerHTML = '&#160;';
					 break;
			 }
		 td.innerHTML = n.innerHTML;
		  td = n;
  }
  }
  TableDragSort.getPreviousTD = function(el) {
  var prev = el.getPrevious();
  if(prev) return prev;
  prev = $(el.parentNode).getPrevious();
  if(!prev) return false;
  return prev.getLast();
  }
  TableDragSort.getNextTD = function(el) {
  var next = el.getNext();
  if(next) return next;
  next = $(el.parentNode).getNext();
  if(!next) return false;
  return next.getFirst();
  }