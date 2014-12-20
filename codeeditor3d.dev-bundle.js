// This THREEx helper makes it easy to handle the mouse events in your 3D scene
//
// * CHANGES NEEDED
//   * handle drag/drop
//   * notify events not object3D - like DOM
//     * so single object with property
//   * DONE bubling implement bubling/capturing
//   * DONE implement event.stopPropagation()
//   * DONE implement event.type = "click" and co
//   * DONE implement event.target
//
// # Lets get started
//
// First you include it in your page
//
// ```<script src='threex.domevent.js'></script>```
//
// # use the object oriented api
//
// You bind an event like this
//
// ```mesh.on('click', function(object3d){ ... })```
//
// To unbind an event, just do
//
// ```mesh.off('click', function(object3d){ ... })```
//
// As an alternative, there is another naming closer DOM events.
// Pick the one you like, they are doing the same thing
//
// ```mesh.addEventListener('click', function(object3d){ ... })```
// ```mesh.removeEventListener('click', function(object3d){ ... })```
//
// # Supported Events
//
// Always in a effort to stay close to usual pratices, the events name are the same as in DOM.
// The semantic is the same too.
// Currently, the available events are
// [click, dblclick, mouseup, mousedown](http://www.quirksmode.org/dom/events/click.html),
// [mouseover and mouse out](http://www.quirksmode.org/dom/events/mouseover.html).
//
// # use the standalone api
//
// The object-oriented api modifies THREE.Object3D class.
// It is a global class, so it may be legitimatly considered unclean by some people.
// If this bother you, simply do ```THREEx.DomEvents.noConflict()``` and use the
// standalone API. In fact, the object oriented API is just a thin wrapper
// on top of the standalone API.
//
// First, you instanciate the object
//
// ```var domEvent = new THREEx.DomEvent();```
//
// Then you bind an event like this
//
// ```domEvent.bind(mesh, 'click', function(object3d){ object3d.scale.x *= 2; });```
//
// To unbind an event, just do
//
// ```domEvent.unbind(mesh, 'click', callback);```
//
//
// # Code

//

/** @namespace */
var THREEx		= THREEx 		|| {};

var wheelEventName;

// # Constructor
THREEx.DomEvents	= function(camera, domElement)
{
	this._camera	= camera || null;
	this._domElement= domElement || document;
	this._projector	= new THREE.Projector();
	this._selected	= null;
	this._boundObjs	= {};
	// Bind dom event for mouse and touch
	var _this	= this;

    wheelEventName = "onmousewheel" in domElement ? "mousewheel" : ("onwheel" in domElement ? 'wheel' : 'DOMMouseScroll');

	this._$onClick		= function(){ _this._onClick.apply(_this, arguments);		};
	this._$onDblClick	= function(){ _this._onDblClick.apply(_this, arguments);	};
	this._$onMouseMove	= function(){ _this._onMouseMove.apply(_this, arguments);	};
	this._$onMouseDown	= function(){ _this._onMouseDown.apply(_this, arguments);	};
	this._$onMouseUp	= function(){ _this._onMouseUp.apply(_this, arguments);		};
	this._$onMouseWheel	= function(){ _this._onMouseWheel.apply(_this, arguments);		};
	this._$onTouchMove	= function(){ _this._onTouchMove.apply(_this, arguments);	};
	this._$onTouchStart	= function(){ _this._onTouchStart.apply(_this, arguments);	};
	this._$onTouchEnd	= function(){ _this._onTouchEnd.apply(_this, arguments);	};
	this._$onContextmenu	= function(){ _this._onContextmenu.apply(_this, arguments);	};
	this._domElement.addEventListener( 'click'	, this._$onClick	, false );
	this._domElement.addEventListener( 'dblclick'	, this._$onDblClick	, false );
	this._domElement.addEventListener( 'mousemove'	, this._$onMouseMove	, false );
	this._domElement.addEventListener( 'mousedown'	, this._$onMouseDown	, false );
	this._domElement.addEventListener( 'mouseup'	, this._$onMouseUp	, false );

	this._domElement.addEventListener( wheelEventName, this._$onMouseWheel	, false );
	this._domElement.addEventListener( 'touchmove'	, this._$onTouchMove	, false );
	this._domElement.addEventListener( 'touchstart'	, this._$onTouchStart	, false );
	this._domElement.addEventListener( 'touchend'	, this._$onTouchEnd	, false );
	this._domElement.addEventListener( 'contextmenu', this._$onContextmenu	, false );

}

// # Destructor
THREEx.DomEvents.prototype.destroy	= function()
{
	// unBind dom event for mouse and touch
	this._domElement.removeEventListener( 'click'		, this._$onClick	, false );
	this._domElement.removeEventListener( 'dblclick'	, this._$onDblClick	, false );
	this._domElement.removeEventListener( 'mousemove'	, this._$onMouseMove	, false );
	this._domElement.removeEventListener( 'mousedown'	, this._$onMouseDown	, false );
	this._domElement.removeEventListener( 'mouseup'		, this._$onMouseUp	, false );
	this._domElement.removeEventListener( wheelEventName, this._$onMouseWheel	, false );
	this._domElement.removeEventListener( 'touchmove'	, this._$onTouchMove	, false );
	this._domElement.removeEventListener( 'touchstart'	, this._$onTouchStart	, false );
	this._domElement.removeEventListener( 'touchend'	, this._$onTouchEnd	, false );
	this._domElement.removeEventListener( 'contextmenu'	, this._$onContextmenu	, false );
}

THREEx.DomEvents.eventNames	= [
	"click",
	"dblclick",
	"mouseover",
	"mouseout",
	"mousemove",
	"mousedown",
	"mouseup",
	"mousewheel",
	"contextmenu"
];

THREEx.DomEvents.prototype._getRelativeMouseXY	= function(domEvent){
  // Converts the browser global (page) x/y coordinates
  // into relative -1/1 values. These can be used by THREE for raycasting.

  var domElement = domEvent.target || domEvent.srcElement,
      x = domEvent.pageX, y = domEvent.pageY;

	var rect = domElement.getBoundingClientRect(),
  		relX = (x - rect.left) / rect.width,
  		relY = (y - rect.top) / rect.height;

	return {
		x :  (relX * 2) - 1,
		y : -(relY * 2) + 1,
		z: 0.5
	};
};


/********************************************************************************/
/*		domevent context						*/
/********************************************************************************/

// handle domevent context in object3d instance

THREEx.DomEvents.prototype._objectCtxInit	= function(object3d){
	object3d._3xDomEvent = {};
}
THREEx.DomEvents.prototype._objectCtxDeinit	= function(object3d){
	delete object3d._3xDomEvent;
}
THREEx.DomEvents.prototype._objectCtxIsInit	= function(object3d){
	return object3d._3xDomEvent ? true : false;
}
THREEx.DomEvents.prototype._objectCtxGet		= function(object3d){
	return object3d._3xDomEvent;
}

/********************************************************************************/
/*										*/
/********************************************************************************/

/**
 * Getter/Setter for camera
*/
THREEx.DomEvents.prototype.camera	= function(value)
{
	if( value )	this._camera	= value;
	return this._camera;
}

THREEx.DomEvents.prototype.bind	= function(object3d, eventName, callback, useCapture)
{
	console.assert( THREEx.DomEvents.eventNames.indexOf(eventName) !== -1, "not available events:"+eventName );

	if( !this._objectCtxIsInit(object3d) )	this._objectCtxInit(object3d);
	var objectCtx	= this._objectCtxGet(object3d);
	if( !objectCtx[eventName+'Handlers'] )	objectCtx[eventName+'Handlers']	= [];

	objectCtx[eventName+'Handlers'].push({
		callback	: callback,
		useCapture	: useCapture
	});

	// add this object in this._boundObjs
	if( this._boundObjs[eventName] === undefined ){
		this._boundObjs[eventName]	= [];
	}
	this._boundObjs[eventName].push(object3d);
}
THREEx.DomEvents.prototype.addEventListener	= THREEx.DomEvents.prototype.bind

THREEx.DomEvents.prototype.unbind	= function(object3d, eventName, callback, useCapture)
{
	console.assert( THREEx.DomEvents.eventNames.indexOf(eventName) !== -1, "not available events:"+eventName );

	if( !this._objectCtxIsInit(object3d) )	this._objectCtxInit(object3d);

	var objectCtx	= this._objectCtxGet(object3d);
	if( !objectCtx[eventName+'Handlers'] )	objectCtx[eventName+'Handlers']	= [];

	var handlers	= objectCtx[eventName+'Handlers'];
	for(var i = 0; i < handlers.length; i++){
		var handler	= handlers[i];
		if( callback != handler.callback )	continue;
		if( useCapture != handler.useCapture )	continue;
		handlers.splice(i, 1)
		break;
	}
	// from this object from this._boundObjs
	var index	= this._boundObjs[eventName].indexOf(object3d);
	console.assert( index !== -1 );
	this._boundObjs[eventName].splice(index, 1);
}
THREEx.DomEvents.prototype.removeEventListener	= THREEx.DomEvents.prototype.unbind

THREEx.DomEvents.prototype._bound	= function(eventName, object3d)
{
	var objectCtx	= this._objectCtxGet(object3d);
	if( !objectCtx )	return false;
	return objectCtx[eventName+'Handlers'] ? true : false;
}

/********************************************************************************/
/*		onMove								*/
/********************************************************************************/

// # handle mousemove kind of events

THREEx.DomEvents.prototype._onMove	= function(eventName, mouseX, mouseY, origDomEvent)
{
//console.log('eventName', eventName, 'boundObjs', this._boundObjs[eventName])
	// get objects bound to this event
	var boundObjs	= this._boundObjs[eventName];
	if( boundObjs === undefined || boundObjs.length === 0 )	return;
	// compute the intersection
	var vector	= new THREE.Vector3( mouseX, mouseY, 0.5 );
	var ray         = this._projector.pickingRay( vector, this._camera );
	var intersects  = ray.intersectObjects( boundObjs );

	var oldSelected	= this._selected;

	if( intersects.length > 0 ){
		var notifyOver, notifyOut, notifyMove;
		var intersect	= intersects[ 0 ];
		var newSelected	= intersect.object;
		this._selected	= newSelected;
		// if newSelected bound mousemove, notify it
		notifyMove	= this._bound('mousemove', newSelected);

		if( oldSelected != newSelected ){
			// if newSelected bound mouseenter, notify it
			notifyOver	= this._bound('mouseover', newSelected);
			// if there is a oldSelect and oldSelected bound mouseleave, notify it
			notifyOut	= oldSelected && this._bound('mouseout', oldSelected);
		}
	}else{
		// if there is a oldSelect and oldSelected bound mouseleave, notify it
		notifyOut	= oldSelected && this._bound('mouseout', oldSelected);
		this._selected	= null;
	}


	// notify mouseMove - done at the end with a copy of the list to allow callback to remove handlers
	notifyMove && this._notify('mousemove', newSelected, origDomEvent, intersect);
	// notify mouseEnter - done at the end with a copy of the list to allow callback to remove handlers
	notifyOver && this._notify('mouseover', newSelected, origDomEvent, intersect);
	// notify mouseLeave - done at the end with a copy of the list to allow callback to remove handlers
	notifyOut  && this._notify('mouseout' , oldSelected, origDomEvent, intersect);
}


/********************************************************************************/
/*		onEvent								*/
/********************************************************************************/

// # handle click kind of events

THREEx.DomEvents.prototype._onEvent	= function(eventName, mouseX, mouseY, origDomEvent)
{
//console.log('eventName', eventName, 'boundObjs', this._boundObjs[eventName])
	// get objects bound to this event
	var boundObjs	= this._boundObjs[eventName];
	if( boundObjs === undefined || boundObjs.length === 0 )	return;
	// compute the intersection
	var vector	= new THREE.Vector3( mouseX, mouseY, 0.5 );
	var ray         = this._projector.pickingRay( vector, this._camera );
	var intersects  = ray.intersectObjects( boundObjs );


	// if there are no intersections, return now
	if( intersects.length === 0 )	return;

	// init some vairables
	var intersect	= intersects[0];
	var object3d	= intersect.object;
	var objectCtx	= this._objectCtxGet(object3d);
	if( !objectCtx )	return;

	// notify handlers
	this._notify(eventName, object3d, origDomEvent, intersect);
}

THREEx.DomEvents.prototype._notify	= function(eventName, object3d, origDomEvent, intersect)
{
	var objectCtx	= this._objectCtxGet(object3d);
	var handlers	= objectCtx ? objectCtx[eventName+'Handlers'] : null;

	// parameter check
	console.assert(arguments.length === 4)

	// do bubbling
	if( !objectCtx || !handlers || handlers.length === 0 ){
		object3d.parent && this._notify(eventName, object3d.parent, origDomEvent, intersect);
		return;
	}

	// notify all handlers
	var handlers	= objectCtx[eventName+'Handlers'];
	for(var i = 0; i < handlers.length; i++){
		var handler	= handlers[i];
		var toPropagate	= true;
		handler.callback({
			type		: eventName,
			target		: object3d,
			origDomEvent	: origDomEvent,
			intersect	: intersect,
			stopPropagation	: function(){
				toPropagate	= false;
			}
		});
		if( !toPropagate )	continue;
		// do bubbling
		if( handler.useCapture === false ){
			object3d.parent && this._notify(eventName, object3d.parent, origDomEvent, intersect);
		}
	}
}

/********************************************************************************/
/*		handle mouse events						*/
/********************************************************************************/
// # handle mouse events

THREEx.DomEvents.prototype._onMouseDown	= function(event){ console.log("x down"); return this._onMouseEvent('mousedown', event);	}
THREEx.DomEvents.prototype._onMouseUp	= function(event){ return this._onMouseEvent('mouseup'	, event);	}
THREEx.DomEvents.prototype._onMouseWheel	= function(event){ return this._onMouseEvent('mousewheel'	, event);	}


THREEx.DomEvents.prototype._onMouseEvent	= function(eventName, domEvent)
{
	var mouseCoords = this._getRelativeMouseXY(domEvent);
	this._onEvent(eventName, mouseCoords.x, mouseCoords.y, domEvent);
}

THREEx.DomEvents.prototype._onMouseMove	= function(domEvent)
{
	var mouseCoords = this._getRelativeMouseXY(domEvent);
	this._onMove('mousemove', mouseCoords.x, mouseCoords.y, domEvent);
	this._onMove('mouseover', mouseCoords.x, mouseCoords.y, domEvent);
	this._onMove('mouseout' , mouseCoords.x, mouseCoords.y, domEvent);
}

THREEx.DomEvents.prototype._onClick		= function(event)
{
	// TODO handle touch ?
	this._onMouseEvent('click'	, event);
}
THREEx.DomEvents.prototype._onDblClick		= function(event)
{
	// TODO handle touch ?
	this._onMouseEvent('dblclick'	, event);
}

THREEx.DomEvents.prototype._onContextmenu	= function(event)
{
	//TODO don't have a clue about how this should work with touch..
	this._onMouseEvent('contextmenu'	, event);
}

/********************************************************************************/
/*		handle touch events						*/
/********************************************************************************/
// # handle touch events


THREEx.DomEvents.prototype._onTouchStart	= function(event){ return this._onTouchEvent('mousedown', event);	}
THREEx.DomEvents.prototype._onTouchEnd	= function(event){ return this._onTouchEvent('mouseup'	, event);	}

THREEx.DomEvents.prototype._onTouchMove	= function(domEvent)
{
	if( domEvent.touches.length != 1 )	return undefined;

	domEvent.preventDefault();

	var mouseX	= +(domEvent.touches[ 0 ].pageX / window.innerWidth ) * 2 - 1;
	var mouseY	= -(domEvent.touches[ 0 ].pageY / window.innerHeight) * 2 + 1;
	this._onMove('mousemove', mouseX, mouseY, domEvent);
	this._onMove('mouseover', mouseX, mouseY, domEvent);
	this._onMove('mouseout' , mouseX, mouseY, domEvent);
}

THREEx.DomEvents.prototype._onTouchEvent	= function(eventName, domEvent)
{
	if( domEvent.touches.length != 1 )	return undefined;

	domEvent.preventDefault();

	var mouseX	= +(domEvent.touches[ 0 ].pageX / window.innerWidth ) * 2 - 1;
	var mouseY	= -(domEvent.touches[ 0 ].pageY / window.innerHeight) * 2 + 1;
	this._onEvent(eventName, mouseX, mouseY, domEvent);
}
;
/* ***** BEGIN LICENSE BLOCK *****
 * Distributed under the BSD license:
 *
 * Copyright (c) 2010, Ajax.org B.V.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of Ajax.org B.V. nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL AJAX.ORG B.V. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ***** END LICENSE BLOCK ***** */

/**
 * Define a module along with a payload
 * @param module a name for the payload
 * @param payload a function to call with (require, exports, module) params
 */

(function() {

var ACE_NAMESPACE = "ace";

var global = (function() {
    return this;
})();


if (!ACE_NAMESPACE && typeof requirejs !== "undefined")
    return;


var _define = function(module, deps, payload) {
    if (typeof module !== 'string') {
        if (_define.original)
            _define.original.apply(window, arguments);
        else {
            console.error('dropping module because define wasn\'t a string.');
            console.trace();
        }
        return;
    }

    if (arguments.length == 2)
        payload = deps;

    if (!_define.modules) {
        _define.modules = {};
        _define.payloads = {};
    }

    _define.payloads[module] = payload;
    _define.modules[module] = null;
};

/**
 * Get at functionality ace.define()ed using the function above
 */
var _require = function(parentId, module, callback) {
    if (Object.prototype.toString.call(module) === "[object Array]") {
        var params = [];
        for (var i = 0, l = module.length; i < l; ++i) {
            var dep = lookup(parentId, module[i]);
            if (!dep && _require.original)
                return _require.original.apply(window, arguments);
            params.push(dep);
        }
        if (callback) {
            callback.apply(null, params);
        }
    }
    else if (typeof module === 'string') {
        var payload = lookup(parentId, module);
        if (!payload && _require.original)
            return _require.original.apply(window, arguments);

        if (callback) {
            callback();
        }

        return payload;
    }
    else {
        if (_require.original)
            return _require.original.apply(window, arguments);
    }
};

var normalizeModule = function(parentId, moduleName) {
    // normalize plugin requires
    if (moduleName.indexOf("!") !== -1) {
        var chunks = moduleName.split("!");
        return normalizeModule(parentId, chunks[0]) + "!" + normalizeModule(parentId, chunks[1]);
    }
    // normalize relative requires
    if (moduleName.charAt(0) == ".") {
        var base = parentId.split("/").slice(0, -1).join("/");
        moduleName = base + "/" + moduleName;

        while(moduleName.indexOf(".") !== -1 && previous != moduleName) {
            var previous = moduleName;
            moduleName = moduleName.replace(/\/\.\//, "/").replace(/[^\/]+\/\.\.\//, "");
        }
    }

    return moduleName;
};

/**
 * Internal function to lookup moduleNames and resolve them by calling the
 * definition function if needed.
 */
var lookup = function(parentId, moduleName) {

    moduleName = normalizeModule(parentId, moduleName);

    var module = _define.modules[moduleName];
    if (!module) {
        module = _define.payloads[moduleName];
        if (typeof module === 'function') {
            var exports = {};
            var mod = {
                id: moduleName,
                uri: '',
                exports: exports,
                packaged: true
            };

            var req = function(module, callback) {
                return _require(moduleName, module, callback);
            };

            var returnValue = module(req, exports, mod);
            exports = returnValue || mod.exports;
            _define.modules[moduleName] = exports;
            delete _define.payloads[moduleName];
        }
        module = _define.modules[moduleName] = exports || module;
    }
    return module;
};

function exportAce(ns) {
    var require = function(module, callback) {
        return _require("", module, callback);
    };

    var root = global;
    if (ns) {
        if (!global[ns])
            global[ns] = {};
        root = global[ns];
    }

    if (!root.define || !root.define.packaged) {
        _define.original = root.define;
        root.define = _define;
        root.define.packaged = true;
    }

    if (!root.require || !root.require.packaged) {
        _require.original = root.require;
        root.require = require;
        root.require.packaged = true;
    }
}

exportAce(ACE_NAMESPACE);

})();

ace.define("ace/lib/regexp",["require","exports","module"], function(require, exports, module) {
"use strict";

    var real = {
            exec: RegExp.prototype.exec,
            test: RegExp.prototype.test,
            match: String.prototype.match,
            replace: String.prototype.replace,
            split: String.prototype.split
        },
        compliantExecNpcg = real.exec.call(/()??/, "")[1] === undefined, // check `exec` handling of nonparticipating capturing groups
        compliantLastIndexIncrement = function () {
            var x = /^/g;
            real.test.call(x, "");
            return !x.lastIndex;
        }();

    if (compliantLastIndexIncrement && compliantExecNpcg)
        return;
    RegExp.prototype.exec = function (str) {
        var match = real.exec.apply(this, arguments),
            name, r2;
        if ( typeof(str) == 'string' && match) {
            if (!compliantExecNpcg && match.length > 1 && indexOf(match, "") > -1) {
                r2 = RegExp(this.source, real.replace.call(getNativeFlags(this), "g", ""));
                real.replace.call(str.slice(match.index), r2, function () {
                    for (var i = 1; i < arguments.length - 2; i++) {
                        if (arguments[i] === undefined)
                            match[i] = undefined;
                    }
                });
            }
            if (this._xregexp && this._xregexp.captureNames) {
                for (var i = 1; i < match.length; i++) {
                    name = this._xregexp.captureNames[i - 1];
                    if (name)
                       match[name] = match[i];
                }
            }
            if (!compliantLastIndexIncrement && this.global && !match[0].length && (this.lastIndex > match.index))
                this.lastIndex--;
        }
        return match;
    };
    if (!compliantLastIndexIncrement) {
        RegExp.prototype.test = function (str) {
            var match = real.exec.call(this, str);
            if (match && this.global && !match[0].length && (this.lastIndex > match.index))
                this.lastIndex--;
            return !!match;
        };
    }

    function getNativeFlags (regex) {
        return (regex.global     ? "g" : "") +
               (regex.ignoreCase ? "i" : "") +
               (regex.multiline  ? "m" : "") +
               (regex.extended   ? "x" : "") + // Proposed for ES4; included in AS3
               (regex.sticky     ? "y" : "");
    }

    function indexOf (array, item, from) {
        if (Array.prototype.indexOf) // Use the native array method if available
            return array.indexOf(item, from);
        for (var i = from || 0; i < array.length; i++) {
            if (array[i] === item)
                return i;
        }
        return -1;
    }

});

ace.define("ace/lib/es5-shim",["require","exports","module"], function(require, exports, module) {

function Empty() {}

if (!Function.prototype.bind) {
    Function.prototype.bind = function bind(that) { // .length is 1
        var target = this;
        if (typeof target != "function") {
            throw new TypeError("Function.prototype.bind called on incompatible " + target);
        }
        var args = slice.call(arguments, 1); // for normal call
        var bound = function () {

            if (this instanceof bound) {

                var result = target.apply(
                    this,
                    args.concat(slice.call(arguments))
                );
                if (Object(result) === result) {
                    return result;
                }
                return this;

            } else {
                return target.apply(
                    that,
                    args.concat(slice.call(arguments))
                );

            }

        };
        if(target.prototype) {
            Empty.prototype = target.prototype;
            bound.prototype = new Empty();
            Empty.prototype = null;
        }
        return bound;
    };
}
var call = Function.prototype.call;
var prototypeOfArray = Array.prototype;
var prototypeOfObject = Object.prototype;
var slice = prototypeOfArray.slice;
var _toString = call.bind(prototypeOfObject.toString);
var owns = call.bind(prototypeOfObject.hasOwnProperty);
var defineGetter;
var defineSetter;
var lookupGetter;
var lookupSetter;
var supportsAccessors;
if ((supportsAccessors = owns(prototypeOfObject, "__defineGetter__"))) {
    defineGetter = call.bind(prototypeOfObject.__defineGetter__);
    defineSetter = call.bind(prototypeOfObject.__defineSetter__);
    lookupGetter = call.bind(prototypeOfObject.__lookupGetter__);
    lookupSetter = call.bind(prototypeOfObject.__lookupSetter__);
}
if ([1,2].splice(0).length != 2) {
    if(function() { // test IE < 9 to splice bug - see issue #138
        function makeArray(l) {
            var a = new Array(l+2);
            a[0] = a[1] = 0;
            return a;
        }
        var array = [], lengthBefore;
        
        array.splice.apply(array, makeArray(20));
        array.splice.apply(array, makeArray(26));

        lengthBefore = array.length; //46
        array.splice(5, 0, "XXX"); // add one element

        lengthBefore + 1 == array.length

        if (lengthBefore + 1 == array.length) {
            return true;// has right splice implementation without bugs
        }
    }()) {//IE 6/7
        var array_splice = Array.prototype.splice;
        Array.prototype.splice = function(start, deleteCount) {
            if (!arguments.length) {
                return [];
            } else {
                return array_splice.apply(this, [
                    start === void 0 ? 0 : start,
                    deleteCount === void 0 ? (this.length - start) : deleteCount
                ].concat(slice.call(arguments, 2)))
            }
        };
    } else {//IE8
        Array.prototype.splice = function(pos, removeCount){
            var length = this.length;
            if (pos > 0) {
                if (pos > length)
                    pos = length;
            } else if (pos == void 0) {
                pos = 0;
            } else if (pos < 0) {
                pos = Math.max(length + pos, 0);
            }

            if (!(pos+removeCount < length))
                removeCount = length - pos;

            var removed = this.slice(pos, pos+removeCount);
            var insert = slice.call(arguments, 2);
            var add = insert.length;            
            if (pos === length) {
                if (add) {
                    this.push.apply(this, insert);
                }
            } else {
                var remove = Math.min(removeCount, length - pos);
                var tailOldPos = pos + remove;
                var tailNewPos = tailOldPos + add - remove;
                var tailCount = length - tailOldPos;
                var lengthAfterRemove = length - remove;

                if (tailNewPos < tailOldPos) { // case A
                    for (var i = 0; i < tailCount; ++i) {
                        this[tailNewPos+i] = this[tailOldPos+i];
                    }
                } else if (tailNewPos > tailOldPos) { // case B
                    for (i = tailCount; i--; ) {
                        this[tailNewPos+i] = this[tailOldPos+i];
                    }
                } // else, add == remove (nothing to do)

                if (add && pos === lengthAfterRemove) {
                    this.length = lengthAfterRemove; // truncate array
                    this.push.apply(this, insert);
                } else {
                    this.length = lengthAfterRemove + add; // reserves space
                    for (i = 0; i < add; ++i) {
                        this[pos+i] = insert[i];
                    }
                }
            }
            return removed;
        };
    }
}
if (!Array.isArray) {
    Array.isArray = function isArray(obj) {
        return _toString(obj) == "[object Array]";
    };
}
var boxedString = Object("a"),
    splitString = boxedString[0] != "a" || !(0 in boxedString);

if (!Array.prototype.forEach) {
    Array.prototype.forEach = function forEach(fun /*, thisp*/) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            thisp = arguments[1],
            i = -1,
            length = self.length >>> 0;
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(); // TODO message
        }

        while (++i < length) {
            if (i in self) {
                fun.call(thisp, self[i], i, object);
            }
        }
    };
}
if (!Array.prototype.map) {
    Array.prototype.map = function map(fun /*, thisp*/) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            length = self.length >>> 0,
            result = Array(length),
            thisp = arguments[1];
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }

        for (var i = 0; i < length; i++) {
            if (i in self)
                result[i] = fun.call(thisp, self[i], i, object);
        }
        return result;
    };
}
if (!Array.prototype.filter) {
    Array.prototype.filter = function filter(fun /*, thisp */) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                    object,
            length = self.length >>> 0,
            result = [],
            value,
            thisp = arguments[1];
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }

        for (var i = 0; i < length; i++) {
            if (i in self) {
                value = self[i];
                if (fun.call(thisp, value, i, object)) {
                    result.push(value);
                }
            }
        }
        return result;
    };
}
if (!Array.prototype.every) {
    Array.prototype.every = function every(fun /*, thisp */) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            length = self.length >>> 0,
            thisp = arguments[1];
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }

        for (var i = 0; i < length; i++) {
            if (i in self && !fun.call(thisp, self[i], i, object)) {
                return false;
            }
        }
        return true;
    };
}
if (!Array.prototype.some) {
    Array.prototype.some = function some(fun /*, thisp */) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            length = self.length >>> 0,
            thisp = arguments[1];
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }

        for (var i = 0; i < length; i++) {
            if (i in self && fun.call(thisp, self[i], i, object)) {
                return true;
            }
        }
        return false;
    };
}
if (!Array.prototype.reduce) {
    Array.prototype.reduce = function reduce(fun /*, initial*/) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            length = self.length >>> 0;
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }
        if (!length && arguments.length == 1) {
            throw new TypeError("reduce of empty array with no initial value");
        }

        var i = 0;
        var result;
        if (arguments.length >= 2) {
            result = arguments[1];
        } else {
            do {
                if (i in self) {
                    result = self[i++];
                    break;
                }
                if (++i >= length) {
                    throw new TypeError("reduce of empty array with no initial value");
                }
            } while (true);
        }

        for (; i < length; i++) {
            if (i in self) {
                result = fun.call(void 0, result, self[i], i, object);
            }
        }

        return result;
    };
}
if (!Array.prototype.reduceRight) {
    Array.prototype.reduceRight = function reduceRight(fun /*, initial*/) {
        var object = toObject(this),
            self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                object,
            length = self.length >>> 0;
        if (_toString(fun) != "[object Function]") {
            throw new TypeError(fun + " is not a function");
        }
        if (!length && arguments.length == 1) {
            throw new TypeError("reduceRight of empty array with no initial value");
        }

        var result, i = length - 1;
        if (arguments.length >= 2) {
            result = arguments[1];
        } else {
            do {
                if (i in self) {
                    result = self[i--];
                    break;
                }
                if (--i < 0) {
                    throw new TypeError("reduceRight of empty array with no initial value");
                }
            } while (true);
        }

        do {
            if (i in this) {
                result = fun.call(void 0, result, self[i], i, object);
            }
        } while (i--);

        return result;
    };
}
if (!Array.prototype.indexOf || ([0, 1].indexOf(1, 2) != -1)) {
    Array.prototype.indexOf = function indexOf(sought /*, fromIndex */ ) {
        var self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                toObject(this),
            length = self.length >>> 0;

        if (!length) {
            return -1;
        }

        var i = 0;
        if (arguments.length > 1) {
            i = toInteger(arguments[1]);
        }
        i = i >= 0 ? i : Math.max(0, length + i);
        for (; i < length; i++) {
            if (i in self && self[i] === sought) {
                return i;
            }
        }
        return -1;
    };
}
if (!Array.prototype.lastIndexOf || ([0, 1].lastIndexOf(0, -3) != -1)) {
    Array.prototype.lastIndexOf = function lastIndexOf(sought /*, fromIndex */) {
        var self = splitString && _toString(this) == "[object String]" ?
                this.split("") :
                toObject(this),
            length = self.length >>> 0;

        if (!length) {
            return -1;
        }
        var i = length - 1;
        if (arguments.length > 1) {
            i = Math.min(i, toInteger(arguments[1]));
        }
        i = i >= 0 ? i : length - Math.abs(i);
        for (; i >= 0; i--) {
            if (i in self && sought === self[i]) {
                return i;
            }
        }
        return -1;
    };
}
if (!Object.getPrototypeOf) {
    Object.getPrototypeOf = function getPrototypeOf(object) {
        return object.__proto__ || (
            object.constructor ?
            object.constructor.prototype :
            prototypeOfObject
        );
    };
}
if (!Object.getOwnPropertyDescriptor) {
    var ERR_NON_OBJECT = "Object.getOwnPropertyDescriptor called on a " +
                         "non-object: ";
    Object.getOwnPropertyDescriptor = function getOwnPropertyDescriptor(object, property) {
        if ((typeof object != "object" && typeof object != "function") || object === null)
            throw new TypeError(ERR_NON_OBJECT + object);
        if (!owns(object, property))
            return;

        var descriptor, getter, setter;
        descriptor =  { enumerable: true, configurable: true };
        if (supportsAccessors) {
            var prototype = object.__proto__;
            object.__proto__ = prototypeOfObject;

            var getter = lookupGetter(object, property);
            var setter = lookupSetter(object, property);
            object.__proto__ = prototype;

            if (getter || setter) {
                if (getter) descriptor.get = getter;
                if (setter) descriptor.set = setter;
                return descriptor;
            }
        }
        descriptor.value = object[property];
        return descriptor;
    };
}
if (!Object.getOwnPropertyNames) {
    Object.getOwnPropertyNames = function getOwnPropertyNames(object) {
        return Object.keys(object);
    };
}
if (!Object.create) {
    var createEmpty;
    if (Object.prototype.__proto__ === null) {
        createEmpty = function () {
            return { "__proto__": null };
        };
    } else {
        createEmpty = function () {
            var empty = {};
            for (var i in empty)
                empty[i] = null;
            empty.constructor =
            empty.hasOwnProperty =
            empty.propertyIsEnumerable =
            empty.isPrototypeOf =
            empty.toLocaleString =
            empty.toString =
            empty.valueOf =
            empty.__proto__ = null;
            return empty;
        }
    }

    Object.create = function create(prototype, properties) {
        var object;
        if (prototype === null) {
            object = createEmpty();
        } else {
            if (typeof prototype != "object")
                throw new TypeError("typeof prototype["+(typeof prototype)+"] != 'object'");
            var Type = function () {};
            Type.prototype = prototype;
            object = new Type();
            object.__proto__ = prototype;
        }
        if (properties !== void 0)
            Object.defineProperties(object, properties);
        return object;
    };
}

function doesDefinePropertyWork(object) {
    try {
        Object.defineProperty(object, "sentinel", {});
        return "sentinel" in object;
    } catch (exception) {
    }
}
if (Object.defineProperty) {
    var definePropertyWorksOnObject = doesDefinePropertyWork({});
    var definePropertyWorksOnDom = typeof document == "undefined" ||
        doesDefinePropertyWork(document.createElement("div"));
    if (!definePropertyWorksOnObject || !definePropertyWorksOnDom) {
        var definePropertyFallback = Object.defineProperty;
    }
}

if (!Object.defineProperty || definePropertyFallback) {
    var ERR_NON_OBJECT_DESCRIPTOR = "Property description must be an object: ";
    var ERR_NON_OBJECT_TARGET = "Object.defineProperty called on non-object: "
    var ERR_ACCESSORS_NOT_SUPPORTED = "getters & setters can not be defined " +
                                      "on this javascript engine";

    Object.defineProperty = function defineProperty(object, property, descriptor) {
        if ((typeof object != "object" && typeof object != "function") || object === null)
            throw new TypeError(ERR_NON_OBJECT_TARGET + object);
        if ((typeof descriptor != "object" && typeof descriptor != "function") || descriptor === null)
            throw new TypeError(ERR_NON_OBJECT_DESCRIPTOR + descriptor);
        if (definePropertyFallback) {
            try {
                return definePropertyFallback.call(Object, object, property, descriptor);
            } catch (exception) {
            }
        }
        if (owns(descriptor, "value")) {

            if (supportsAccessors && (lookupGetter(object, property) ||
                                      lookupSetter(object, property)))
            {
                var prototype = object.__proto__;
                object.__proto__ = prototypeOfObject;
                delete object[property];
                object[property] = descriptor.value;
                object.__proto__ = prototype;
            } else {
                object[property] = descriptor.value;
            }
        } else {
            if (!supportsAccessors)
                throw new TypeError(ERR_ACCESSORS_NOT_SUPPORTED);
            if (owns(descriptor, "get"))
                defineGetter(object, property, descriptor.get);
            if (owns(descriptor, "set"))
                defineSetter(object, property, descriptor.set);
        }

        return object;
    };
}
if (!Object.defineProperties) {
    Object.defineProperties = function defineProperties(object, properties) {
        for (var property in properties) {
            if (owns(properties, property))
                Object.defineProperty(object, property, properties[property]);
        }
        return object;
    };
}
if (!Object.seal) {
    Object.seal = function seal(object) {
        return object;
    };
}
if (!Object.freeze) {
    Object.freeze = function freeze(object) {
        return object;
    };
}
try {
    Object.freeze(function () {});
} catch (exception) {
    Object.freeze = (function freeze(freezeObject) {
        return function freeze(object) {
            if (typeof object == "function") {
                return object;
            } else {
                return freezeObject(object);
            }
        };
    })(Object.freeze);
}
if (!Object.preventExtensions) {
    Object.preventExtensions = function preventExtensions(object) {
        return object;
    };
}
if (!Object.isSealed) {
    Object.isSealed = function isSealed(object) {
        return false;
    };
}
if (!Object.isFrozen) {
    Object.isFrozen = function isFrozen(object) {
        return false;
    };
}
if (!Object.isExtensible) {
    Object.isExtensible = function isExtensible(object) {
        if (Object(object) === object) {
            throw new TypeError(); // TODO message
        }
        var name = '';
        while (owns(object, name)) {
            name += '?';
        }
        object[name] = true;
        var returnValue = owns(object, name);
        delete object[name];
        return returnValue;
    };
}
if (!Object.keys) {
    var hasDontEnumBug = true,
        dontEnums = [
            "toString",
            "toLocaleString",
            "valueOf",
            "hasOwnProperty",
            "isPrototypeOf",
            "propertyIsEnumerable",
            "constructor"
        ],
        dontEnumsLength = dontEnums.length;

    for (var key in {"toString": null}) {
        hasDontEnumBug = false;
    }

    Object.keys = function keys(object) {

        if (
            (typeof object != "object" && typeof object != "function") ||
            object === null
        ) {
            throw new TypeError("Object.keys called on a non-object");
        }

        var keys = [];
        for (var name in object) {
            if (owns(object, name)) {
                keys.push(name);
            }
        }

        if (hasDontEnumBug) {
            for (var i = 0, ii = dontEnumsLength; i < ii; i++) {
                var dontEnum = dontEnums[i];
                if (owns(object, dontEnum)) {
                    keys.push(dontEnum);
                }
            }
        }
        return keys;
    };

}
if (!Date.now) {
    Date.now = function now() {
        return new Date().getTime();
    };
}
var ws = "\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003" +
    "\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028" +
    "\u2029\uFEFF";
if (!String.prototype.trim || ws.trim()) {
    ws = "[" + ws + "]";
    var trimBeginRegexp = new RegExp("^" + ws + ws + "*"),
        trimEndRegexp = new RegExp(ws + ws + "*$");
    String.prototype.trim = function trim() {
        return String(this).replace(trimBeginRegexp, "").replace(trimEndRegexp, "");
    };
}

function toInteger(n) {
    n = +n;
    if (n !== n) { // isNaN
        n = 0;
    } else if (n !== 0 && n !== (1/0) && n !== -(1/0)) {
        n = (n > 0 || -1) * Math.floor(Math.abs(n));
    }
    return n;
}

function isPrimitive(input) {
    var type = typeof input;
    return (
        input === null ||
        type === "undefined" ||
        type === "boolean" ||
        type === "number" ||
        type === "string"
    );
}

function toPrimitive(input) {
    var val, valueOf, toString;
    if (isPrimitive(input)) {
        return input;
    }
    valueOf = input.valueOf;
    if (typeof valueOf === "function") {
        val = valueOf.call(input);
        if (isPrimitive(val)) {
            return val;
        }
    }
    toString = input.toString;
    if (typeof toString === "function") {
        val = toString.call(input);
        if (isPrimitive(val)) {
            return val;
        }
    }
    throw new TypeError();
}
var toObject = function (o) {
    if (o == null) { // this matches both null and undefined
        throw new TypeError("can't convert "+o+" to object");
    }
    return Object(o);
};

});

ace.define("ace/lib/fixoldbrowsers",["require","exports","module","ace/lib/regexp","ace/lib/es5-shim"], function(require, exports, module) {
"use strict";

require("./regexp");
require("./es5-shim");

});

ace.define("ace/lib/dom",["require","exports","module"], function(require, exports, module) {
"use strict";

if (typeof document == "undefined")
    return;

var XHTML_NS = "http://www.w3.org/1999/xhtml";

exports.getDocumentHead = function(doc) {
    if (!doc)
        doc = document;
    return doc.head || doc.getElementsByTagName("head")[0] || doc.documentElement;
}

exports.createElement = function(tag, ns) {
    return document.createElementNS ?
           document.createElementNS(ns || XHTML_NS, tag) :
           document.createElement(tag);
};

exports.hasCssClass = function(el, name) {
    var classes = (el.className || "").split(/\s+/g);
    return classes.indexOf(name) !== -1;
};
exports.addCssClass = function(el, name) {
    if (!exports.hasCssClass(el, name)) {
        el.className += " " + name;
    }
};
exports.removeCssClass = function(el, name) {
    var classes = el.className.split(/\s+/g);
    while (true) {
        var index = classes.indexOf(name);
        if (index == -1) {
            break;
        }
        classes.splice(index, 1);
    }
    el.className = classes.join(" ");
};

exports.toggleCssClass = function(el, name) {
    var classes = el.className.split(/\s+/g), add = true;
    while (true) {
        var index = classes.indexOf(name);
        if (index == -1) {
            break;
        }
        add = false;
        classes.splice(index, 1);
    }
    if(add)
        classes.push(name);

    el.className = classes.join(" ");
    return add;
};
exports.setCssClass = function(node, className, include) {
    if (include) {
        exports.addCssClass(node, className);
    } else {
        exports.removeCssClass(node, className);
    }
};

exports.hasCssString = function(id, doc) {
    var index = 0, sheets;
    doc = doc || document;

    if (doc.createStyleSheet && (sheets = doc.styleSheets)) {
        while (index < sheets.length)
            if (sheets[index++].owningElement.id === id) return true;
    } else if ((sheets = doc.getElementsByTagName("style"))) {
        while (index < sheets.length)
            if (sheets[index++].id === id) return true;
    }

    return false;
};

exports.importCssString = function importCssString(cssText, id, doc) {
    doc = doc || document;
    if (id && exports.hasCssString(id, doc))
        return null;
    
    var style;
    
    if (doc.createStyleSheet) {
        style = doc.createStyleSheet();
        style.cssText = cssText;
        if (id)
            style.owningElement.id = id;
    } else {
        style = doc.createElementNS
            ? doc.createElementNS(XHTML_NS, "style")
            : doc.createElement("style");

        style.appendChild(doc.createTextNode(cssText));
        if (id)
            style.id = id;

        exports.getDocumentHead(doc).appendChild(style);
    }
};

exports.importCssStylsheet = function(uri, doc) {
    if (doc.createStyleSheet) {
        doc.createStyleSheet(uri);
    } else {
        var link = exports.createElement('link');
        link.rel = 'stylesheet';
        link.href = uri;

        exports.getDocumentHead(doc).appendChild(link);
    }
};

exports.getInnerWidth = function(element) {
    return (
        parseInt(exports.computedStyle(element, "paddingLeft"), 10) +
        parseInt(exports.computedStyle(element, "paddingRight"), 10) + 
        element.clientWidth
    );
};

exports.getInnerHeight = function(element) {
    return (
        parseInt(exports.computedStyle(element, "paddingTop"), 10) +
        parseInt(exports.computedStyle(element, "paddingBottom"), 10) +
        element.clientHeight
    );
};

if (window.pageYOffset !== undefined) {
    exports.getPageScrollTop = function() {
        return window.pageYOffset;
    };

    exports.getPageScrollLeft = function() {
        return window.pageXOffset;
    };
}
else {
    exports.getPageScrollTop = function() {
        return document.body.scrollTop;
    };

    exports.getPageScrollLeft = function() {
        return document.body.scrollLeft;
    };
}

if (window.getComputedStyle)
    exports.computedStyle = function(element, style) {
        if (style)
            return (window.getComputedStyle(element, "") || {})[style] || "";
        return window.getComputedStyle(element, "") || {};
    };
else
    exports.computedStyle = function(element, style) {
        if (style)
            return element.currentStyle[style];
        return element.currentStyle;
    };

exports.scrollbarWidth = function(document) {
    var inner = exports.createElement("ace_inner");
    inner.style.width = "100%";
    inner.style.minWidth = "0px";
    inner.style.height = "200px";
    inner.style.display = "block";

    var outer = exports.createElement("ace_outer");
    var style = outer.style;

    style.position = "absolute";
    style.left = "-10000px";
    style.overflow = "hidden";
    style.width = "200px";
    style.minWidth = "0px";
    style.height = "150px";
    style.display = "block";

    outer.appendChild(inner);

    var body = document.documentElement;
    body.appendChild(outer);

    var noScrollbar = inner.offsetWidth;

    style.overflow = "scroll";
    var withScrollbar = inner.offsetWidth;

    if (noScrollbar == withScrollbar) {
        withScrollbar = outer.clientWidth;
    }

    body.removeChild(outer);

    return noScrollbar-withScrollbar;
};
exports.setInnerHtml = function(el, innerHtml) {
    var element = el.cloneNode(false);//document.createElement("div");
    element.innerHTML = innerHtml;
    el.parentNode.replaceChild(element, el);
    return element;
};

if ("textContent" in document.documentElement) {
    exports.setInnerText = function(el, innerText) {
        el.textContent = innerText;
    };

    exports.getInnerText = function(el) {
        return el.textContent;
    };
}
else {
    exports.setInnerText = function(el, innerText) {
        el.innerText = innerText;
    };

    exports.getInnerText = function(el) {
        return el.innerText;
    };
}

exports.getParentWindow = function(document) {
    return document.defaultView || document.parentWindow;
};

});

ace.define("ace/lib/oop",["require","exports","module"], function(require, exports, module) {
"use strict";

exports.inherits = function(ctor, superCtor) {
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
            value: ctor,
            enumerable: false,
            writable: true,
            configurable: true
        }
    });
};

exports.mixin = function(obj, mixin) {
    for (var key in mixin) {
        obj[key] = mixin[key];
    }
    return obj;
};

exports.implement = function(proto, mixin) {
    exports.mixin(proto, mixin);
};

});

ace.define("ace/lib/keys",["require","exports","module","ace/lib/fixoldbrowsers","ace/lib/oop"], function(require, exports, module) {
"use strict";

require("./fixoldbrowsers");

var oop = require("./oop");
var Keys = (function() {
    var ret = {
        MODIFIER_KEYS: {
            16: 'Shift', 17: 'Ctrl', 18: 'Alt', 224: 'Meta'
        },

        KEY_MODS: {
            "ctrl": 1, "alt": 2, "option" : 2, "shift": 4,
            "super": 8, "meta": 8, "command": 8, "cmd": 8
        },

        FUNCTION_KEYS : {
            8  : "Backspace",
            9  : "Tab",
            13 : "Return",
            19 : "Pause",
            27 : "Esc",
            32 : "Space",
            33 : "PageUp",
            34 : "PageDown",
            35 : "End",
            36 : "Home",
            37 : "Left",
            38 : "Up",
            39 : "Right",
            40 : "Down",
            44 : "Print",
            45 : "Insert",
            46 : "Delete",
            96 : "Numpad0",
            97 : "Numpad1",
            98 : "Numpad2",
            99 : "Numpad3",
            100: "Numpad4",
            101: "Numpad5",
            102: "Numpad6",
            103: "Numpad7",
            104: "Numpad8",
            105: "Numpad9",
            '-13': "NumpadEnter",
            112: "F1",
            113: "F2",
            114: "F3",
            115: "F4",
            116: "F5",
            117: "F6",
            118: "F7",
            119: "F8",
            120: "F9",
            121: "F10",
            122: "F11",
            123: "F12",
            144: "Numlock",
            145: "Scrolllock"
        },

        PRINTABLE_KEYS: {
           32: ' ',  48: '0',  49: '1',  50: '2',  51: '3',  52: '4', 53:  '5',
           54: '6',  55: '7',  56: '8',  57: '9',  59: ';',  61: '=', 65:  'a',
           66: 'b',  67: 'c',  68: 'd',  69: 'e',  70: 'f',  71: 'g', 72:  'h',
           73: 'i',  74: 'j',  75: 'k',  76: 'l',  77: 'm',  78: 'n', 79:  'o',
           80: 'p',  81: 'q',  82: 'r',  83: 's',  84: 't',  85: 'u', 86:  'v',
           87: 'w',  88: 'x',  89: 'y',  90: 'z', 107: '+', 109: '-', 110: '.',
          187: '=', 188: ',', 189: '-', 190: '.', 191: '/', 192: '`', 219: '[',
          220: '\\',221: ']', 222: '\''
        }
    };
    var name, i;
    for (i in ret.FUNCTION_KEYS) {
        name = ret.FUNCTION_KEYS[i].toLowerCase();
        ret[name] = parseInt(i, 10);
    }
    for (i in ret.PRINTABLE_KEYS) {
        name = ret.PRINTABLE_KEYS[i].toLowerCase();
        ret[name] = parseInt(i, 10);
    }
    oop.mixin(ret, ret.MODIFIER_KEYS);
    oop.mixin(ret, ret.PRINTABLE_KEYS);
    oop.mixin(ret, ret.FUNCTION_KEYS);
    ret.enter = ret["return"];
    ret.escape = ret.esc;
    ret.del = ret["delete"];
    ret[173] = '-';
    
    (function() {
        var mods = ["cmd", "ctrl", "alt", "shift"];
        for (var i = Math.pow(2, mods.length); i--;) {            
            ret.KEY_MODS[i] = mods.filter(function(x) {
                return i & ret.KEY_MODS[x];
            }).join("-") + "-";
        }
    })();

    ret.KEY_MODS[0] = "";
    ret.KEY_MODS[-1] = "input";

    return ret;
})();
oop.mixin(exports, Keys);

exports.keyCodeToString = function(keyCode) {
    var keyString = Keys[keyCode];
    if (typeof keyString != "string")
        keyString = String.fromCharCode(keyCode);
    return keyString.toLowerCase();
};

});

ace.define("ace/lib/useragent",["require","exports","module"], function(require, exports, module) {
"use strict";
exports.OS = {
    LINUX: "LINUX",
    MAC: "MAC",
    WINDOWS: "WINDOWS"
};
exports.getOS = function() {
    if (exports.isMac) {
        return exports.OS.MAC;
    } else if (exports.isLinux) {
        return exports.OS.LINUX;
    } else {
        return exports.OS.WINDOWS;
    }
};
if (typeof navigator != "object")
    return;

var os = (navigator.platform.match(/mac|win|linux/i) || ["other"])[0].toLowerCase();
var ua = navigator.userAgent;
exports.isWin = (os == "win");
exports.isMac = (os == "mac");
exports.isLinux = (os == "linux");
exports.isIE = 
    (navigator.appName == "Microsoft Internet Explorer" || navigator.appName.indexOf("MSAppHost") >= 0)
    ? parseFloat((ua.match(/(?:MSIE |Trident\/[0-9]+[\.0-9]+;.*rv:)([0-9]+[\.0-9]+)/)||[])[1])
    : parseFloat((ua.match(/(?:Trident\/[0-9]+[\.0-9]+;.*rv:)([0-9]+[\.0-9]+)/)||[])[1]); // for ie
    
exports.isOldIE = exports.isIE && exports.isIE < 9;
exports.isGecko = exports.isMozilla = (window.Controllers || window.controllers) && window.navigator.product === "Gecko";
exports.isOldGecko = exports.isGecko && parseInt((ua.match(/rv\:(\d+)/)||[])[1], 10) < 4;
exports.isOpera = window.opera && Object.prototype.toString.call(window.opera) == "[object Opera]";
exports.isWebKit = parseFloat(ua.split("WebKit/")[1]) || undefined;

exports.isChrome = parseFloat(ua.split(" Chrome/")[1]) || undefined;

exports.isAIR = ua.indexOf("AdobeAIR") >= 0;

exports.isIPad = ua.indexOf("iPad") >= 0;

exports.isTouchPad = ua.indexOf("TouchPad") >= 0;

exports.isChromeOS = ua.indexOf(" CrOS ") >= 0;

});

ace.define("ace/lib/event",["require","exports","module","ace/lib/keys","ace/lib/useragent"], function(require, exports, module) {
"use strict";

var keys = require("./keys");
var useragent = require("./useragent");

exports.addListener = function(elem, type, callback) {
    if (elem.addEventListener) {
        return elem.addEventListener(type, callback, false);
    }
    if (elem.attachEvent) {
        var wrapper = function() {
            callback.call(elem, window.event);
        };
        callback._wrapper = wrapper;
        elem.attachEvent("on" + type, wrapper);
    }
};

exports.removeListener = function(elem, type, callback) {
    if (elem.removeEventListener) {
        return elem.removeEventListener(type, callback, false);
    }
    if (elem.detachEvent) {
        elem.detachEvent("on" + type, callback._wrapper || callback);
    }
};
exports.stopEvent = function(e) {
    exports.stopPropagation(e);
    exports.preventDefault(e);
    return false;
};

exports.stopPropagation = function(e) {
    if (e.stopPropagation)
        e.stopPropagation();
    else
        e.cancelBubble = true;
};

exports.preventDefault = function(e) {
    if (e.preventDefault)
        e.preventDefault();
    else
        e.returnValue = false;
};
exports.getButton = function(e) {
    if (e.type == "dblclick")
        return 0;
    if (e.type == "contextmenu" || (useragent.isMac && (e.ctrlKey && !e.altKey && !e.shiftKey)))
        return 2;
    if (e.preventDefault) {
        return e.button;
    }
    else {
        return {1:0, 2:2, 4:1}[e.button];
    }
};

exports.capture = function(el, eventHandler, releaseCaptureHandler) {
    function onMouseUp(e) {
        eventHandler && eventHandler(e);
        releaseCaptureHandler && releaseCaptureHandler(e);

        exports.removeListener(document, "mousemove", eventHandler, true);
        exports.removeListener(document, "mouseup", onMouseUp, true);
        exports.removeListener(document, "dragstart", onMouseUp, true);
    }

    exports.addListener(document, "mousemove", eventHandler, true);
    exports.addListener(document, "mouseup", onMouseUp, true);
    exports.addListener(document, "dragstart", onMouseUp, true);
    
    return onMouseUp;
};

exports.addMouseWheelListener = function(el, callback) {
    if ("onmousewheel" in el) {
        exports.addListener(el, "mousewheel", function(e) {
            var factor = 8;
            if (e.wheelDeltaX !== undefined) {
                e.wheelX = -e.wheelDeltaX / factor;
                e.wheelY = -e.wheelDeltaY / factor;
            } else {
                e.wheelX = 0;
                e.wheelY = -e.wheelDelta / factor;
            }
            callback(e);
        });
    } else if ("onwheel" in el) {
        exports.addListener(el, "wheel",  function(e) {
            var factor = 0.35;
            switch (e.deltaMode) {
                case e.DOM_DELTA_PIXEL:
                    e.wheelX = e.deltaX * factor || 0;
                    e.wheelY = e.deltaY * factor || 0;
                    break;
                case e.DOM_DELTA_LINE:
                case e.DOM_DELTA_PAGE:
                    e.wheelX = (e.deltaX || 0) * 5;
                    e.wheelY = (e.deltaY || 0) * 5;
                    break;
            }
            
            callback(e);
        });
    } else {
        exports.addListener(el, "DOMMouseScroll", function(e) {
            if (e.axis && e.axis == e.HORIZONTAL_AXIS) {
                e.wheelX = (e.detail || 0) * 5;
                e.wheelY = 0;
            } else {
                e.wheelX = 0;
                e.wheelY = (e.detail || 0) * 5;
            }
            callback(e);
        });
    }
};

exports.addMultiMouseDownListener = function(el, timeouts, eventHandler, callbackName) {
    var clicks = 0;
    var startX, startY, timer; 
    var eventNames = {
        2: "dblclick",
        3: "tripleclick",
        4: "quadclick"
    };

    exports.addListener(el, "mousedown", function(e) {
        if (exports.getButton(e) !== 0) {
            clicks = 0;
        } else if (e.detail > 1) {
            clicks++;
            if (clicks > 4)
                clicks = 1;
        } else {
            clicks = 1;
        }
        if (useragent.isIE) {
            var isNewClick = Math.abs(e.clientX - startX) > 5 || Math.abs(e.clientY - startY) > 5;
            if (!timer || isNewClick)
                clicks = 1;
            if (timer)
                clearTimeout(timer);
            timer = setTimeout(function() {timer = null}, timeouts[clicks - 1] || 600);

            if (clicks == 1) {
                startX = e.clientX;
                startY = e.clientY;
            }
        }
        
        e._clicks = clicks;

        eventHandler[callbackName]("mousedown", e);

        if (clicks > 4)
            clicks = 0;
        else if (clicks > 1)
            return eventHandler[callbackName](eventNames[clicks], e);
    });

    if (useragent.isOldIE) {
        exports.addListener(el, "dblclick", function(e) {
            clicks = 2;
            if (timer)
                clearTimeout(timer);
            timer = setTimeout(function() {timer = null}, timeouts[clicks - 1] || 600);
            eventHandler[callbackName]("mousedown", e);
            eventHandler[callbackName](eventNames[clicks], e);
        });
    }
};

var getModifierHash = useragent.isMac && useragent.isOpera && !("KeyboardEvent" in window)
    ? function(e) {
        return 0 | (e.metaKey ? 1 : 0) | (e.altKey ? 2 : 0) | (e.shiftKey ? 4 : 0) | (e.ctrlKey ? 8 : 0);
    }
    : function(e) {
        return 0 | (e.ctrlKey ? 1 : 0) | (e.altKey ? 2 : 0) | (e.shiftKey ? 4 : 0) | (e.metaKey ? 8 : 0);
    };

exports.getModifierString = function(e) {
    return keys.KEY_MODS[getModifierHash(e)];
};

function normalizeCommandKeys(callback, e, keyCode) {
    var hashId = getModifierHash(e);

    if (!useragent.isMac && pressedKeys) {
        if (pressedKeys[91] || pressedKeys[92])
            hashId |= 8;
        if (pressedKeys.altGr) {
            if ((3 & hashId) != 3)
                pressedKeys.altGr = 0;
            else
                return;
        }
        if (keyCode === 18 || keyCode === 17) {
            var location = "location" in e ? e.location : e.keyLocation;
            if (keyCode === 17 && location === 1) {
                ts = e.timeStamp;
            } else if (keyCode === 18 && hashId === 3 && location === 2) {
                var dt = -ts;
                ts = e.timeStamp;
                dt += ts;
                if (dt < 3)
                    pressedKeys.altGr = true;
            }
        }
    }
    
    if (keyCode in keys.MODIFIER_KEYS) {
        switch (keys.MODIFIER_KEYS[keyCode]) {
            case "Alt":
                hashId = 2;
                break;
            case "Shift":
                hashId = 4;
                break;
            case "Ctrl":
                hashId = 1;
                break;
            default:
                hashId = 8;
                break;
        }
        keyCode = -1;
    }

    if (hashId & 8 && (keyCode === 91 || keyCode === 93)) {
        keyCode = -1;
    }
    
    if (!hashId && keyCode === 13) {
        var location = "location" in e ? e.location : e.keyLocation;
        if (location === 3) {
            callback(e, hashId, -keyCode);
            if (e.defaultPrevented)
                return;
        }
    }
    
    if (useragent.isChromeOS && hashId & 8) {
        callback(e, hashId, keyCode);
        if (e.defaultPrevented)
            return;
        else
            hashId &= ~8;
    }
    if (!hashId && !(keyCode in keys.FUNCTION_KEYS) && !(keyCode in keys.PRINTABLE_KEYS)) {
        return false;
    }
    
    return callback(e, hashId, keyCode);
}

var pressedKeys = null;
var ts = 0;
exports.addCommandKeyListener = function(el, callback) {
    var addListener = exports.addListener;
    if (useragent.isOldGecko || (useragent.isOpera && !("KeyboardEvent" in window))) {
        var lastKeyDownKeyCode = null;
        addListener(el, "keydown", function(e) {
            lastKeyDownKeyCode = e.keyCode;
        });
        addListener(el, "keypress", function(e) {
            return normalizeCommandKeys(callback, e, lastKeyDownKeyCode);
        });
    } else {
        var lastDefaultPrevented = null;

        addListener(el, "keydown", function(e) {
            pressedKeys[e.keyCode] = true;
            var result = normalizeCommandKeys(callback, e, e.keyCode);
            lastDefaultPrevented = e.defaultPrevented;
            return result;
        });

        addListener(el, "keypress", function(e) {
            if (lastDefaultPrevented && (e.ctrlKey || e.altKey || e.shiftKey || e.metaKey)) {
                exports.stopEvent(e);
                lastDefaultPrevented = null;
            }
        });

        addListener(el, "keyup", function(e) {
            pressedKeys[e.keyCode] = null;
        });

        if (!pressedKeys) {
            pressedKeys = Object.create(null);
            addListener(window, "focus", function(e) {
                pressedKeys = Object.create(null);
            });
        }
    }
};

if (window.postMessage && !useragent.isOldIE) {
    var postMessageId = 1;
    exports.nextTick = function(callback, win) {
        win = win || window;
        var messageName = "zero-timeout-message-" + postMessageId;
        exports.addListener(win, "message", function listener(e) {
            if (e.data == messageName) {
                exports.stopPropagation(e);
                exports.removeListener(win, "message", listener);
                callback();
            }
        });
        win.postMessage(messageName, "*");
    };
}


exports.nextFrame = window.requestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    window.oRequestAnimationFrame;

if (exports.nextFrame)
    exports.nextFrame = exports.nextFrame.bind(window);
else
    exports.nextFrame = function(callback) {
        setTimeout(callback, 17);
    };
});

ace.define("ace/lib/lang",["require","exports","module"], function(require, exports, module) {
"use strict";

exports.last = function(a) {
    return a[a.length - 1];
};

exports.stringReverse = function(string) {
    return string.split("").reverse().join("");
};

exports.stringRepeat = function (string, count) {
    var result = '';
    while (count > 0) {
        if (count & 1)
            result += string;

        if (count >>= 1)
            string += string;
    }
    return result;
};

var trimBeginRegexp = /^\s\s*/;
var trimEndRegexp = /\s\s*$/;

exports.stringTrimLeft = function (string) {
    return string.replace(trimBeginRegexp, '');
};

exports.stringTrimRight = function (string) {
    return string.replace(trimEndRegexp, '');
};

exports.copyObject = function(obj) {
    var copy = {};
    for (var key in obj) {
        copy[key] = obj[key];
    }
    return copy;
};

exports.copyArray = function(array){
    var copy = [];
    for (var i=0, l=array.length; i<l; i++) {
        if (array[i] && typeof array[i] == "object")
            copy[i] = this.copyObject( array[i] );
        else 
            copy[i] = array[i];
    }
    return copy;
};

exports.deepCopy = function (obj) {
    if (typeof obj !== "object" || !obj)
        return obj;
    var cons = obj.constructor;
    if (cons === RegExp)
        return obj;
    
    var copy = cons();
    for (var key in obj) {
        if (typeof obj[key] === "object") {
            copy[key] = exports.deepCopy(obj[key]);
        } else {
            copy[key] = obj[key];
        }
    }
    return copy;
};

exports.arrayToMap = function(arr) {
    var map = {};
    for (var i=0; i<arr.length; i++) {
        map[arr[i]] = 1;
    }
    return map;

};

exports.createMap = function(props) {
    var map = Object.create(null);
    for (var i in props) {
        map[i] = props[i];
    }
    return map;
};
exports.arrayRemove = function(array, value) {
  for (var i = 0; i <= array.length; i++) {
    if (value === array[i]) {
      array.splice(i, 1);
    }
  }
};

exports.escapeRegExp = function(str) {
    return str.replace(/([.*+?^${}()|[\]\/\\])/g, '\\$1');
};

exports.escapeHTML = function(str) {
    return str.replace(/&/g, "&#38;").replace(/"/g, "&#34;").replace(/'/g, "&#39;").replace(/</g, "&#60;");
};

exports.getMatchOffsets = function(string, regExp) {
    var matches = [];

    string.replace(regExp, function(str) {
        matches.push({
            offset: arguments[arguments.length-2],
            length: str.length
        });
    });

    return matches;
};
exports.deferredCall = function(fcn) {
    var timer = null;
    var callback = function() {
        timer = null;
        fcn();
    };

    var deferred = function(timeout) {
        deferred.cancel();
        timer = setTimeout(callback, timeout || 0);
        return deferred;
    };

    deferred.schedule = deferred;

    deferred.call = function() {
        this.cancel();
        fcn();
        return deferred;
    };

    deferred.cancel = function() {
        clearTimeout(timer);
        timer = null;
        return deferred;
    };
    
    deferred.isPending = function() {
        return timer;
    };

    return deferred;
};


exports.delayedCall = function(fcn, defaultTimeout) {
    var timer = null;
    var callback = function() {
        timer = null;
        fcn();
    };

    var _self = function(timeout) {
        if (timer == null)
            timer = setTimeout(callback, timeout || defaultTimeout);
    };

    _self.delay = function(timeout) {
        timer && clearTimeout(timer);
        timer = setTimeout(callback, timeout || defaultTimeout);
    };
    _self.schedule = _self;

    _self.call = function() {
        this.cancel();
        fcn();
    };

    _self.cancel = function() {
        timer && clearTimeout(timer);
        timer = null;
    };

    _self.isPending = function() {
        return timer;
    };

    return _self;
};
});

ace.define("ace/keyboard/textinput",["require","exports","module","ace/lib/event","ace/lib/useragent","ace/lib/dom","ace/lib/lang"], function(require, exports, module) {
"use strict";

var event = require("../lib/event");
var useragent = require("../lib/useragent");
var dom = require("../lib/dom");
var lang = require("../lib/lang");
var BROKEN_SETDATA = useragent.isChrome < 18;
var USE_IE_MIME_TYPE =  useragent.isIE;

var TextInput = function(parentNode, host) {
    var text = dom.createElement("textarea");
    text.className = "ace_text-input";

    if (useragent.isTouchPad)
        text.setAttribute("x-palm-disable-auto-cap", true);

    text.wrap = "off";
    text.autocorrect = "off";
    text.autocapitalize = "off";
    text.spellcheck = false;

    text.style.opacity = "0";
    if (useragent.isOldIE) text.style.top = "-100px";
    parentNode.insertBefore(text, parentNode.firstChild);

    var PLACEHOLDER = "\x01\x01";

    var copied = false;
    var pasted = false;
    var inComposition = false;
    var tempStyle = '';
    var isSelectionEmpty = true;
    try { var isFocused = document.activeElement === text; } catch(e) {}
    
    event.addListener(text, "blur", function(e) {
        host.onBlur(e);
        isFocused = false;
    });
    event.addListener(text, "focus", function(e) {
        isFocused = true;
        host.onFocus(e);
        resetSelection();
    });
    this.focus = function() { text.focus(); };
    this.blur = function() { text.blur(); };
    this.isFocused = function() {
        return isFocused;
    };
    var syncSelection = lang.delayedCall(function() {
        isFocused && resetSelection(isSelectionEmpty);
    });
    var syncValue = lang.delayedCall(function() {
         if (!inComposition) {
            text.value = PLACEHOLDER;
            isFocused && resetSelection();
         }
    });

    function resetSelection(isEmpty) {
        if (inComposition)
            return;
        if (inputHandler) {
            selectionStart = 0;
            selectionEnd = isEmpty ? 0 : text.value.length - 1;
        } else {
            var selectionStart = isEmpty ? 2 : 1;
            var selectionEnd = 2;
        }
        try {
            text.setSelectionRange(selectionStart, selectionEnd);
        } catch(e){}
    }

    function resetValue() {
        if (inComposition)
            return;
        text.value = PLACEHOLDER;
        if (useragent.isWebKit)
            syncValue.schedule();
    }

    useragent.isWebKit || host.addEventListener('changeSelection', function() {
        if (host.selection.isEmpty() != isSelectionEmpty) {
            isSelectionEmpty = !isSelectionEmpty;
            syncSelection.schedule();
        }
    });

    resetValue();
    if (isFocused)
        host.onFocus();


    var isAllSelected = function(text) {
        return text.selectionStart === 0 && text.selectionEnd === text.value.length;
    };
    if (!text.setSelectionRange && text.createTextRange) {
        text.setSelectionRange = function(selectionStart, selectionEnd) {
            var range = this.createTextRange();
            range.collapse(true);
            range.moveStart('character', selectionStart);
            range.moveEnd('character', selectionEnd);
            range.select();
        };
        isAllSelected = function(text) {
            try {
                var range = text.ownerDocument.selection.createRange();
            }catch(e) {}
            if (!range || range.parentElement() != text) return false;
                return range.text == text.value;
        }
    }
    if (useragent.isOldIE) {
        var inPropertyChange = false;
        var onPropertyChange = function(e){
            if (inPropertyChange)
                return;
            var data = text.value;
            if (inComposition || !data || data == PLACEHOLDER)
                return;
            if (e && data == PLACEHOLDER[0])
                return syncProperty.schedule();

            sendText(data);
            inPropertyChange = true;
            resetValue();
            inPropertyChange = false;
        };
        var syncProperty = lang.delayedCall(onPropertyChange);
        event.addListener(text, "propertychange", onPropertyChange);

        var keytable = { 13:1, 27:1 };
        event.addListener(text, "keyup", function (e) {
            if (inComposition && (!text.value || keytable[e.keyCode]))
                setTimeout(onCompositionEnd, 0);
            if ((text.value.charCodeAt(0)||0) < 129) {
                return syncProperty.call();
            }
            inComposition ? onCompositionUpdate() : onCompositionStart();
        });
        event.addListener(text, "keydown", function (e) {
            syncProperty.schedule(50);
        });
    }

    var onSelect = function(e) {
        if (copied) {
            copied = false;
        } else if (isAllSelected(text)) {
            host.selectAll();
            resetSelection();
        } else if (inputHandler) {
            resetSelection(host.selection.isEmpty());
        }
    };

    var inputHandler = null;
    this.setInputHandler = function(cb) {inputHandler = cb};
    this.getInputHandler = function() {return inputHandler};
    var afterContextMenu = false;
    
    var sendText = function(data) {
        if (inputHandler) {
            data = inputHandler(data);
            inputHandler = null;
        }
        if (pasted) {
            resetSelection();
            if (data)
                host.onPaste(data);
            pasted = false;
        } else if (data == PLACEHOLDER.charAt(0)) {
            if (afterContextMenu)
                host.execCommand("del", {source: "ace"});
            else // some versions of android do not fire keydown when pressing backspace
                host.execCommand("backspace", {source: "ace"});
        } else {
            if (data.substring(0, 2) == PLACEHOLDER)
                data = data.substr(2);
            else if (data.charAt(0) == PLACEHOLDER.charAt(0))
                data = data.substr(1);
            else if (data.charAt(data.length - 1) == PLACEHOLDER.charAt(0))
                data = data.slice(0, -1);
            if (data.charAt(data.length - 1) == PLACEHOLDER.charAt(0))
                data = data.slice(0, -1);
            
            if (data)
                host.onTextInput(data);
        }
        if (afterContextMenu)
            afterContextMenu = false;
    };
    var onInput = function(e) {
        if (inComposition)
            return;
        var data = text.value;
        sendText(data);
        resetValue();
    };
    
    var handleClipboardData = function(e, data) {
        var clipboardData = e.clipboardData || window.clipboardData;
        if (!clipboardData || BROKEN_SETDATA)
            return;
        var mime = USE_IE_MIME_TYPE ? "Text" : "text/plain";
        if (data) {
            return clipboardData.setData(mime, data) !== false;
        } else {
            return clipboardData.getData(mime);
        }
    };

    var doCopy = function(e, isCut) {
        var data = host.getCopyText();
        if (!data)
            return event.preventDefault(e);

        if (handleClipboardData(e, data)) {
            isCut ? host.onCut() : host.onCopy();
            event.preventDefault(e);
        } else {
            copied = true;
            text.value = data;
            text.select();
            setTimeout(function(){
                copied = false;
                resetValue();
                resetSelection();
                isCut ? host.onCut() : host.onCopy();
            });
        }
    };
    
    var onCut = function(e) {
        doCopy(e, true);
    };
    
    var onCopy = function(e) {
        doCopy(e, false);
    };
    
    var onPaste = function(e) {
        var data = handleClipboardData(e);
        if (typeof data == "string") {
            if (data)
                host.onPaste(data);
            if (useragent.isIE)
                setTimeout(resetSelection);
            event.preventDefault(e);
        }
        else {
            text.value = "";
            pasted = true;
        }
    };

    event.addCommandKeyListener(text, host.onCommandKey.bind(host));

    event.addListener(text, "select", onSelect);

    event.addListener(text, "input", onInput);

    event.addListener(text, "cut", onCut);
    event.addListener(text, "copy", onCopy);
    event.addListener(text, "paste", onPaste);
    if (!('oncut' in text) || !('oncopy' in text) || !('onpaste' in text)){
        event.addListener(parentNode, "keydown", function(e) {
            if ((useragent.isMac && !e.metaKey) || !e.ctrlKey)
                return;

            switch (e.keyCode) {
                case 67:
                    onCopy(e);
                    break;
                case 86:
                    onPaste(e);
                    break;
                case 88:
                    onCut(e);
                    break;
            }
        });
    }
    var onCompositionStart = function(e) {
        if (inComposition || !host.onCompositionStart || host.$readOnly) 
            return;
        inComposition = {};
        host.onCompositionStart();
        setTimeout(onCompositionUpdate, 0);
        host.on("mousedown", onCompositionEnd);
        if (!host.selection.isEmpty()) {
            host.insert("");
            host.session.markUndoGroup();
            host.selection.clearSelection();
        }
        host.session.markUndoGroup();
    };

    var onCompositionUpdate = function() {
        if (!inComposition || !host.onCompositionUpdate || host.$readOnly)
            return;
        var val = text.value.replace(/\x01/g, "");
        if (inComposition.lastValue === val) return;
        
        host.onCompositionUpdate(val);
        if (inComposition.lastValue)
            host.undo();
        inComposition.lastValue = val;
        if (inComposition.lastValue) {
            var r = host.selection.getRange();
            host.insert(inComposition.lastValue);
            host.session.markUndoGroup();
            inComposition.range = host.selection.getRange();
            host.selection.setRange(r);
            host.selection.clearSelection();
        }
    };

    var onCompositionEnd = function(e) {
        if (!host.onCompositionEnd || host.$readOnly) return;
        var c = inComposition;
        inComposition = false;
        var timer = setTimeout(function() {
            timer = null;
            var str = text.value.replace(/\x01/g, "");
            if (inComposition)
                return;
            else if (str == c.lastValue)
                resetValue();
            else if (!c.lastValue && str) {
                resetValue();
                sendText(str);
            }
        });
        inputHandler = function compositionInputHandler(str) {
            if (timer)
                clearTimeout(timer);
            str = str.replace(/\x01/g, "");
            if (str == c.lastValue)
                return "";
            if (c.lastValue && timer)
                host.undo();
            return str;
        };
        host.onCompositionEnd();
        host.removeListener("mousedown", onCompositionEnd);
        if (e.type == "compositionend" && c.range) {
            host.selection.setRange(c.range);
        }
    };
    
    

    var syncComposition = lang.delayedCall(onCompositionUpdate, 50);

    event.addListener(text, "compositionstart", onCompositionStart);
    if (useragent.isGecko) {
        event.addListener(text, "text", function(){syncComposition.schedule()});
    } else {
        event.addListener(text, "keyup", function(){syncComposition.schedule()});
        event.addListener(text, "keydown", function(){syncComposition.schedule()});
    }
    event.addListener(text, "compositionend", onCompositionEnd);

    this.getElement = function() {
        return text;
    };

    this.setReadOnly = function(readOnly) {
       text.readOnly = readOnly;
    };

    this.onContextMenu = function(e) {
        afterContextMenu = true;
        resetSelection(host.selection.isEmpty());
        host._emit("nativecontextmenu", {target: host, domEvent: e});
        this.moveToMouse(e, true);
    };
    
    this.moveToMouse = function(e, bringToFront) {
        if (!bringToFront && useragent.isOldIE)
            return;
        if (!tempStyle)
            tempStyle = text.style.cssText;
        text.style.cssText = (bringToFront ? "z-index:100000;" : "")
            + "height:" + text.style.height + ";"
            + (useragent.isIE ? "opacity:0.1;" : "");

        var rect = host.container.getBoundingClientRect();
        var style = dom.computedStyle(host.container);
        var top = rect.top + (parseInt(style.borderTopWidth) || 0);
        var left = rect.left + (parseInt(rect.borderLeftWidth) || 0);
        var maxTop = rect.bottom - top - text.clientHeight -2;
        var move = function(e) {
            text.style.left = e.clientX - left - 2 + "px";
            text.style.top = Math.min(e.clientY - top - 2, maxTop) + "px";
        }; 
        move(e);

        if (e.type != "mousedown")
            return;

        if (host.renderer.$keepTextAreaAtCursor)
            host.renderer.$keepTextAreaAtCursor = null;
        if (useragent.isWin && !useragent.isOldIE)
            event.capture(host.container, move, onContextMenuClose);
    };

    this.onContextMenuClose = onContextMenuClose;
    var closeTimeout;
    function onContextMenuClose() {
        clearTimeout(closeTimeout)
        closeTimeout = setTimeout(function () {
            if (tempStyle) {
                text.style.cssText = tempStyle;
                tempStyle = '';
            }
            if (host.renderer.$keepTextAreaAtCursor == null) {
                host.renderer.$keepTextAreaAtCursor = true;
                host.renderer.$moveTextAreaToCursor();
            }
        }, useragent.isOldIE ? 200 : 0);
    }

    var onContextMenu = function(e) {
        host.textInput.onContextMenu(e);
        onContextMenuClose();
    };
    event.addListener(host.renderer.scroller, "contextmenu", onContextMenu);
    event.addListener(text, "contextmenu", onContextMenu);
};

exports.TextInput = TextInput;
});

ace.define("ace/mouse/default_handlers",["require","exports","module","ace/lib/dom","ace/lib/event","ace/lib/useragent"], function(require, exports, module) {
"use strict";

var dom = require("../lib/dom");
var event = require("../lib/event");
var useragent = require("../lib/useragent");

var DRAG_OFFSET = 0; // pixels

function DefaultHandlers(mouseHandler) {
    mouseHandler.$clickSelection = null;

    var editor = mouseHandler.editor;
    editor.setDefaultHandler("mousedown", this.onMouseDown.bind(mouseHandler));
    editor.setDefaultHandler("dblclick", this.onDoubleClick.bind(mouseHandler));
    editor.setDefaultHandler("tripleclick", this.onTripleClick.bind(mouseHandler));
    editor.setDefaultHandler("quadclick", this.onQuadClick.bind(mouseHandler));
    editor.setDefaultHandler("mousewheel", this.onMouseWheel.bind(mouseHandler));

    var exports = ["select", "startSelect", "selectEnd", "selectAllEnd", "selectByWordsEnd",
        "selectByLinesEnd", "dragWait", "dragWaitEnd", "focusWait"];

    exports.forEach(function(x) {
        mouseHandler[x] = this[x];
    }, this);

    mouseHandler.selectByLines = this.extendSelectionBy.bind(mouseHandler, "getLineRange");
    mouseHandler.selectByWords = this.extendSelectionBy.bind(mouseHandler, "getWordRange");
}

(function() {

    this.onMouseDown = function(ev) {
        var inSelection = ev.inSelection();
        var pos = ev.getDocumentPosition();
        this.mousedownEvent = ev;
        var editor = this.editor;

        var button = ev.getButton();
        if (button !== 0) {
            var selectionRange = editor.getSelectionRange();
            var selectionEmpty = selectionRange.isEmpty();

            if (selectionEmpty)
                editor.selection.moveToPosition(pos);
            editor.textInput.onContextMenu(ev.domEvent);
            return; // stopping event here breaks contextmenu on ff mac
        }

        this.mousedownEvent.time = Date.now();
        if (inSelection && !editor.isFocused()) {
            editor.focus();
            if (this.$focusTimout && !this.$clickSelection && !editor.inMultiSelectMode) {
                this.setState("focusWait");
                this.captureMouse(ev);
                return;
            }
        }

        this.captureMouse(ev);
        this.startSelect(pos, ev.domEvent._clicks > 1);
        return ev.preventDefault();
    };

    this.startSelect = function(pos, waitForClickSelection) {
        pos = pos || this.editor.renderer.screenToTextCoordinates(this.x, this.y);
        var editor = this.editor;
        
        if (this.mousedownEvent.getShiftKey())
            editor.selection.selectToPosition(pos);
        else if (!waitForClickSelection)
            editor.selection.moveToPosition(pos);
        if (!waitForClickSelection)
            this.select();
        if (editor.renderer.scroller.setCapture) {
            editor.renderer.scroller.setCapture();
        }
        editor.setStyle("ace_selecting");
        this.setState("select");
    };

    this.select = function() {
        var anchor, editor = this.editor;
        var cursor = editor.renderer.screenToTextCoordinates(this.x, this.y);

        if (this.$clickSelection) {
            var cmp = this.$clickSelection.comparePoint(cursor);

            if (cmp == -1) {
                anchor = this.$clickSelection.end;
            } else if (cmp == 1) {
                anchor = this.$clickSelection.start;
            } else {
                var orientedRange = calcRangeOrientation(this.$clickSelection, cursor);
                cursor = orientedRange.cursor;
                anchor = orientedRange.anchor;
            }
            editor.selection.setSelectionAnchor(anchor.row, anchor.column);
        }
        editor.selection.selectToPosition(cursor);

        editor.renderer.scrollCursorIntoView();
    };

    this.extendSelectionBy = function(unitName) {
        var anchor, editor = this.editor;
        var cursor = editor.renderer.screenToTextCoordinates(this.x, this.y);
        var range = editor.selection[unitName](cursor.row, cursor.column);

        if (this.$clickSelection) {
            var cmpStart = this.$clickSelection.comparePoint(range.start);
            var cmpEnd = this.$clickSelection.comparePoint(range.end);

            if (cmpStart == -1 && cmpEnd <= 0) {
                anchor = this.$clickSelection.end;
                if (range.end.row != cursor.row || range.end.column != cursor.column)
                    cursor = range.start;
            } else if (cmpEnd == 1 && cmpStart >= 0) {
                anchor = this.$clickSelection.start;
                if (range.start.row != cursor.row || range.start.column != cursor.column)
                    cursor = range.end;
            } else if (cmpStart == -1 && cmpEnd == 1) {
                cursor = range.end;
                anchor = range.start;
            } else {
                var orientedRange = calcRangeOrientation(this.$clickSelection, cursor);
                cursor = orientedRange.cursor;
                anchor = orientedRange.anchor;
            }
            editor.selection.setSelectionAnchor(anchor.row, anchor.column);
        }
        editor.selection.selectToPosition(cursor);

        editor.renderer.scrollCursorIntoView();
    };

    this.selectEnd =
    this.selectAllEnd =
    this.selectByWordsEnd =
    this.selectByLinesEnd = function() {
        this.$clickSelection = null;
        this.editor.unsetStyle("ace_selecting");
        if (this.editor.renderer.scroller.releaseCapture) {
            this.editor.renderer.scroller.releaseCapture();
        }
    };

    this.focusWait = function() {
        var distance = calcDistance(this.mousedownEvent.x, this.mousedownEvent.y, this.x, this.y);
        var time = Date.now();

        if (distance > DRAG_OFFSET || time - this.mousedownEvent.time > this.$focusTimout)
            this.startSelect(this.mousedownEvent.getDocumentPosition());
    };

    this.onDoubleClick = function(ev) {
        var pos = ev.getDocumentPosition();
        var editor = this.editor;
        var session = editor.session;

        var range = session.getBracketRange(pos);
        if (range) {
            if (range.isEmpty()) {
                range.start.column--;
                range.end.column++;
            }
            this.setState("select");
        } else {
            range = editor.selection.getWordRange(pos.row, pos.column);
            this.setState("selectByWords");
        }
        this.$clickSelection = range;
        this.select();
    };

    this.onTripleClick = function(ev) {
        var pos = ev.getDocumentPosition();
        var editor = this.editor;

        this.setState("selectByLines");
        var range = editor.getSelectionRange();
        if (range.isMultiLine() && range.contains(pos.row, pos.column)) {
            this.$clickSelection = editor.selection.getLineRange(range.start.row);
            this.$clickSelection.end = editor.selection.getLineRange(range.end.row).end;
        } else {
            this.$clickSelection = editor.selection.getLineRange(pos.row);
        }
        this.select();
    };

    this.onQuadClick = function(ev) {
        var editor = this.editor;

        editor.selectAll();
        this.$clickSelection = editor.getSelectionRange();
        this.setState("selectAll");
    };

    this.onMouseWheel = function(ev) {
        if (ev.getAccelKey())
            return;
        if (ev.getShiftKey() && ev.wheelY && !ev.wheelX) {
            ev.wheelX = ev.wheelY;
            ev.wheelY = 0;
        }

        var t = ev.domEvent.timeStamp;
        var dt = t - (this.$lastScrollTime||0);
        
        var editor = this.editor;
        var isScrolable = editor.renderer.isScrollableBy(ev.wheelX * ev.speed, ev.wheelY * ev.speed);
        if (isScrolable || dt < 200) {
            this.$lastScrollTime = t;
            editor.renderer.scrollBy(ev.wheelX * ev.speed, ev.wheelY * ev.speed);
            return ev.stop();
        }
    };

}).call(DefaultHandlers.prototype);

exports.DefaultHandlers = DefaultHandlers;

function calcDistance(ax, ay, bx, by) {
    return Math.sqrt(Math.pow(bx - ax, 2) + Math.pow(by - ay, 2));
}

function calcRangeOrientation(range, cursor) {
    if (range.start.row == range.end.row)
        var cmp = 2 * cursor.column - range.start.column - range.end.column;
    else if (range.start.row == range.end.row - 1 && !range.start.column && !range.end.column)
        var cmp = cursor.column - 4;
    else
        var cmp = 2 * cursor.row - range.start.row - range.end.row;

    if (cmp < 0)
        return {cursor: range.start, anchor: range.end};
    else
        return {cursor: range.end, anchor: range.start};
}

});

ace.define("ace/tooltip",["require","exports","module","ace/lib/oop","ace/lib/dom"], function(require, exports, module) {
"use strict";

var oop = require("./lib/oop");
var dom = require("./lib/dom");
function Tooltip (parentNode) {
    this.isOpen = false;
    this.$element = null;
    this.$parentNode = parentNode;
}

(function() {
    this.$init = function() {
        this.$element = dom.createElement("div");
        this.$element.className = "ace_tooltip";
        this.$element.style.display = "none";
        this.$parentNode.appendChild(this.$element);
        return this.$element;
    };
    this.getElement = function() {
        return this.$element || this.$init();
    };
    this.setText = function(text) {
        dom.setInnerText(this.getElement(), text);
    };
    this.setHtml = function(html) {
        this.getElement().innerHTML = html;
    };
    this.setPosition = function(x, y) {
        this.getElement().style.left = x + "px";
        this.getElement().style.top = y + "px";
    };
    this.setClassName = function(className) {
        dom.addCssClass(this.getElement(), className);
    };
    this.show = function(text, x, y) {
        if (text != null)
            this.setText(text);
        if (x != null && y != null)
            this.setPosition(x, y);
        if (!this.isOpen) {
            this.getElement().style.display = "block";
            this.isOpen = true;
        }
    };

    this.hide = function() {
        if (this.isOpen) {
            this.getElement().style.display = "none";
            this.isOpen = false;
        }
    };
    this.getHeight = function() {
        return this.getElement().offsetHeight;
    };
    this.getWidth = function() {
        return this.getElement().offsetWidth;
    };

}).call(Tooltip.prototype);

exports.Tooltip = Tooltip;
});

ace.define("ace/mouse/default_gutter_handler",["require","exports","module","ace/lib/dom","ace/lib/oop","ace/lib/event","ace/tooltip"], function(require, exports, module) {
"use strict";
var dom = require("../lib/dom");
var oop = require("../lib/oop");
var event = require("../lib/event");
var Tooltip = require("../tooltip").Tooltip;

function GutterHandler(mouseHandler) {
    var editor = mouseHandler.editor;
    var gutter = editor.renderer.$gutterLayer;
    var tooltip = new GutterTooltip(editor.container);

    mouseHandler.editor.setDefaultHandler("guttermousedown", function(e) {
        if (!editor.isFocused() || e.getButton() != 0)
            return;
        var gutterRegion = gutter.getRegion(e);

        if (gutterRegion == "foldWidgets")
            return;

        var row = e.getDocumentPosition().row;
        var selection = editor.session.selection;

        if (e.getShiftKey())
            selection.selectTo(row, 0);
        else {
            if (e.domEvent.detail == 2) {
                editor.selectAll();
                return e.preventDefault();
            }
            mouseHandler.$clickSelection = editor.selection.getLineRange(row);
        }
        mouseHandler.setState("selectByLines");
        mouseHandler.captureMouse(e);
        return e.preventDefault();
    });


    var tooltipTimeout, mouseEvent, tooltipAnnotation;

    function showTooltip() {
        var row = mouseEvent.getDocumentPosition().row;
        var annotation = gutter.$annotations[row];
        if (!annotation)
            return hideTooltip();

        var maxRow = editor.session.getLength();
        if (row == maxRow) {
            var screenRow = editor.renderer.pixelToScreenCoordinates(0, mouseEvent.y).row;
            var pos = mouseEvent.$pos;
            if (screenRow > editor.session.documentToScreenRow(pos.row, pos.column))
                return hideTooltip();
        }

        if (tooltipAnnotation == annotation)
            return;
        tooltipAnnotation = annotation.text.join("<br/>");

        tooltip.setHtml(tooltipAnnotation);
        tooltip.show();
        editor.on("mousewheel", hideTooltip);

        if (mouseHandler.$tooltipFollowsMouse) {
            moveTooltip(mouseEvent);
        } else {
            var gutterElement = gutter.$cells[editor.session.documentToScreenRow(row, 0)].element;
            var rect = gutterElement.getBoundingClientRect();
            var style = tooltip.getElement().style;
            style.left = rect.right + "px";
            style.top = rect.bottom + "px";
        }
    }

    function hideTooltip() {
        if (tooltipTimeout)
            tooltipTimeout = clearTimeout(tooltipTimeout);
        if (tooltipAnnotation) {
            tooltip.hide();
            tooltipAnnotation = null;
            editor.removeEventListener("mousewheel", hideTooltip);
        }
    }

    function moveTooltip(e) {
        tooltip.setPosition(e.x, e.y);
    }

    mouseHandler.editor.setDefaultHandler("guttermousemove", function(e) {
        var target = e.domEvent.target || e.domEvent.srcElement;
        if (dom.hasCssClass(target, "ace_fold-widget"))
            return hideTooltip();

        if (tooltipAnnotation && mouseHandler.$tooltipFollowsMouse)
            moveTooltip(e);

        mouseEvent = e;
        if (tooltipTimeout)
            return;
        tooltipTimeout = setTimeout(function() {
            tooltipTimeout = null;
            if (mouseEvent && !mouseHandler.isMousePressed)
                showTooltip();
            else
                hideTooltip();
        }, 50);
    });

    event.addListener(editor.renderer.$gutter, "mouseout", function(e) {
        mouseEvent = null;
        if (!tooltipAnnotation || tooltipTimeout)
            return;

        tooltipTimeout = setTimeout(function() {
            tooltipTimeout = null;
            hideTooltip();
        }, 50);
    });
    
    editor.on("changeSession", hideTooltip);
}

function GutterTooltip(parentNode) {
    Tooltip.call(this, parentNode);
}

oop.inherits(GutterTooltip, Tooltip);

(function(){
    this.setPosition = function(x, y) {
        var windowWidth = window.innerWidth || document.documentElement.clientWidth;
        var windowHeight = window.innerHeight || document.documentElement.clientHeight;
        var width = this.getWidth();
        var height = this.getHeight();
        x += 15;
        y += 15;
        if (x + width > windowWidth) {
            x -= (x + width) - windowWidth;
        }
        if (y + height > windowHeight) {
            y -= 20 + height;
        }
        Tooltip.prototype.setPosition.call(this, x, y);
    };

}).call(GutterTooltip.prototype);



exports.GutterHandler = GutterHandler;

});

ace.define("ace/mouse/mouse_event",["require","exports","module","ace/lib/event","ace/lib/useragent"], function(require, exports, module) {
"use strict";

var event = require("../lib/event");
var useragent = require("../lib/useragent");
var MouseEvent = exports.MouseEvent = function(domEvent, editor) {
    this.domEvent = domEvent;
    this.editor = editor;
    
    this.x = this.clientX = domEvent.clientX;
    this.y = this.clientY = domEvent.clientY;

    this.$pos = null;
    this.$inSelection = null;
    
    this.propagationStopped = false;
    this.defaultPrevented = false;
};

(function() {  
    
    this.stopPropagation = function() {
        event.stopPropagation(this.domEvent);
        this.propagationStopped = true;
    };
    
    this.preventDefault = function() {
        event.preventDefault(this.domEvent);
        this.defaultPrevented = true;
    };
    
    this.stop = function() {
        this.stopPropagation();
        this.preventDefault();
    };
    this.getDocumentPosition = function() {
        if (this.$pos)
            return this.$pos;
        
        this.$pos = this.editor.renderer.screenToTextCoordinates(this.clientX, this.clientY);
        return this.$pos;
    };
    this.inSelection = function() {
        if (this.$inSelection !== null)
            return this.$inSelection;
            
        var editor = this.editor;
        

        var selectionRange = editor.getSelectionRange();
        if (selectionRange.isEmpty())
            this.$inSelection = false;
        else {
            var pos = this.getDocumentPosition();
            this.$inSelection = selectionRange.contains(pos.row, pos.column);
        }

        return this.$inSelection;
    };
    this.getButton = function() {
        return event.getButton(this.domEvent);
    };
    this.getShiftKey = function() {
        return this.domEvent.shiftKey;
    };
    
    this.getAccelKey = useragent.isMac
        ? function() { return this.domEvent.metaKey; }
        : function() { return this.domEvent.ctrlKey; };
    
}).call(MouseEvent.prototype);

});

ace.define("ace/mouse/dragdrop_handler",["require","exports","module","ace/lib/dom","ace/lib/event","ace/lib/useragent"], function(require, exports, module) {
"use strict";

var dom = require("../lib/dom");
var event = require("../lib/event");
var useragent = require("../lib/useragent");

var AUTOSCROLL_DELAY = 200;
var SCROLL_CURSOR_DELAY = 200;
var SCROLL_CURSOR_HYSTERESIS = 5;

function DragdropHandler(mouseHandler) {

    var editor = mouseHandler.editor;

    var blankImage = dom.createElement("img");
    blankImage.src = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
    if (useragent.isOpera)
        blankImage.style.cssText = "width:1px;height:1px;position:fixed;top:0;left:0;z-index:2147483647;opacity:0;";

    var exports = ["dragWait", "dragWaitEnd", "startDrag", "dragReadyEnd", "onMouseDrag"];

     exports.forEach(function(x) {
         mouseHandler[x] = this[x];
    }, this);
    editor.addEventListener("mousedown", this.onMouseDown.bind(mouseHandler));


    var mouseTarget = editor.container;
    var dragSelectionMarker, x, y;
    var timerId, range;
    var dragCursor, counter = 0;
    var dragOperation;
    var isInternal;
    var autoScrollStartTime;
    var cursorMovedTime;
    var cursorPointOnCaretMoved;

    this.onDragStart = function(e) {
        if (this.cancelDrag || !mouseTarget.draggable) {
            var self = this;
            setTimeout(function(){
                self.startSelect();
                self.captureMouse(e);
            }, 0);
            return e.preventDefault();
        }
        range = editor.getSelectionRange();

        var dataTransfer = e.dataTransfer;
        dataTransfer.effectAllowed = editor.getReadOnly() ? "copy" : "copyMove";
        if (useragent.isOpera) {
            editor.container.appendChild(blankImage);
            blankImage.scrollTop = 0;
        }
        dataTransfer.setDragImage && dataTransfer.setDragImage(blankImage, 0, 0);
        if (useragent.isOpera) {
            editor.container.removeChild(blankImage);
        }
        dataTransfer.clearData();
        dataTransfer.setData("Text", editor.session.getTextRange());

        isInternal = true;
        this.setState("drag");
    };

    this.onDragEnd = function(e) {
        mouseTarget.draggable = false;
        isInternal = false;
        this.setState(null);
        if (!editor.getReadOnly()) {
            var dropEffect = e.dataTransfer.dropEffect;
            if (!dragOperation && dropEffect == "move")
                editor.session.remove(editor.getSelectionRange());
            editor.renderer.$cursorLayer.setBlinking(true);
        }
        this.editor.unsetStyle("ace_dragging");
        this.editor.renderer.setCursorStyle("");
    };

    this.onDragEnter = function(e) {
        if (editor.getReadOnly() || !canAccept(e.dataTransfer))
            return;
        x = e.clientX;
        y = e.clientY;
        if (!dragSelectionMarker)
            addDragMarker();
        counter++;
        e.dataTransfer.dropEffect = dragOperation = getDropEffect(e);
        return event.preventDefault(e);
    };

    this.onDragOver = function(e) {
        if (editor.getReadOnly() || !canAccept(e.dataTransfer))
            return;
        x = e.clientX;
        y = e.clientY;
        if (!dragSelectionMarker) {
            addDragMarker();
            counter++;
        }
        if (onMouseMoveTimer !== null)
            onMouseMoveTimer = null;

        e.dataTransfer.dropEffect = dragOperation = getDropEffect(e);
        return event.preventDefault(e);
    };

    this.onDragLeave = function(e) {
        counter--;
        if (counter <= 0 && dragSelectionMarker) {
            clearDragMarker();
            dragOperation = null;
            return event.preventDefault(e);
        }
    };

    this.onDrop = function(e) {
        if (!dragCursor)
            return;
        var dataTransfer = e.dataTransfer;
        if (isInternal) {
            switch (dragOperation) {
                case "move":
                    if (range.contains(dragCursor.row, dragCursor.column)) {
                        range = {
                            start: dragCursor,
                            end: dragCursor
                        };
                    } else {
                        range = editor.moveText(range, dragCursor);
                    }
                    break;
                case "copy":
                    range = editor.moveText(range, dragCursor, true);
                    break;
            }
        } else {
            var dropData = dataTransfer.getData('Text');
            range = {
                start: dragCursor,
                end: editor.session.insert(dragCursor, dropData)
            };
            editor.focus();
            dragOperation = null;
        }
        clearDragMarker();
        return event.preventDefault(e);
    };

    event.addListener(mouseTarget, "dragstart", this.onDragStart.bind(mouseHandler));
    event.addListener(mouseTarget, "dragend", this.onDragEnd.bind(mouseHandler));
    event.addListener(mouseTarget, "dragenter", this.onDragEnter.bind(mouseHandler));
    event.addListener(mouseTarget, "dragover", this.onDragOver.bind(mouseHandler));
    event.addListener(mouseTarget, "dragleave", this.onDragLeave.bind(mouseHandler));
    event.addListener(mouseTarget, "drop", this.onDrop.bind(mouseHandler));

    function scrollCursorIntoView(cursor, prevCursor) {
        var now = Date.now();
        var vMovement = !prevCursor || cursor.row != prevCursor.row;
        var hMovement = !prevCursor || cursor.column != prevCursor.column;
        if (!cursorMovedTime || vMovement || hMovement) {
            editor.$blockScrolling += 1;
            editor.moveCursorToPosition(cursor);
            editor.$blockScrolling -= 1;
            cursorMovedTime = now;
            cursorPointOnCaretMoved = {x: x, y: y};
        } else {
            var distance = calcDistance(cursorPointOnCaretMoved.x, cursorPointOnCaretMoved.y, x, y);
            if (distance > SCROLL_CURSOR_HYSTERESIS) {
                cursorMovedTime = null;
            } else if (now - cursorMovedTime >= SCROLL_CURSOR_DELAY) {
                editor.renderer.scrollCursorIntoView();
                cursorMovedTime = null;
            }
        }
    }

    function autoScroll(cursor, prevCursor) {
        var now = Date.now();
        var lineHeight = editor.renderer.layerConfig.lineHeight;
        var characterWidth = editor.renderer.layerConfig.characterWidth;
        var editorRect = editor.renderer.scroller.getBoundingClientRect();
        var offsets = {
           x: {
               left: x - editorRect.left,
               right: editorRect.right - x
           },
           y: {
               top: y - editorRect.top,
               bottom: editorRect.bottom - y
           }
        };
        var nearestXOffset = Math.min(offsets.x.left, offsets.x.right);
        var nearestYOffset = Math.min(offsets.y.top, offsets.y.bottom);
        var scrollCursor = {row: cursor.row, column: cursor.column};
        if (nearestXOffset / characterWidth <= 2) {
            scrollCursor.column += (offsets.x.left < offsets.x.right ? -3 : +2);
        }
        if (nearestYOffset / lineHeight <= 1) {
            scrollCursor.row += (offsets.y.top < offsets.y.bottom ? -1 : +1);
        }
        var vScroll = cursor.row != scrollCursor.row;
        var hScroll = cursor.column != scrollCursor.column;
        var vMovement = !prevCursor || cursor.row != prevCursor.row;
        if (vScroll || (hScroll && !vMovement)) {
            if (!autoScrollStartTime)
                autoScrollStartTime = now;
            else if (now - autoScrollStartTime >= AUTOSCROLL_DELAY)
                editor.renderer.scrollCursorIntoView(scrollCursor);
        } else {
            autoScrollStartTime = null;
        }
    }

    function onDragInterval() {
        var prevCursor = dragCursor;
        dragCursor = editor.renderer.screenToTextCoordinates(x, y);
        scrollCursorIntoView(dragCursor, prevCursor);
        autoScroll(dragCursor, prevCursor);
    }

    function addDragMarker() {
        range = editor.selection.toOrientedRange();
        dragSelectionMarker = editor.session.addMarker(range, "ace_selection", editor.getSelectionStyle());
        editor.clearSelection();
        if (editor.isFocused())
            editor.renderer.$cursorLayer.setBlinking(false);
        clearInterval(timerId);
        onDragInterval();
        timerId = setInterval(onDragInterval, 20);
        counter = 0;
        event.addListener(document, "mousemove", onMouseMove);
    }

    function clearDragMarker() {
        clearInterval(timerId);
        editor.session.removeMarker(dragSelectionMarker);
        dragSelectionMarker = null;
        editor.$blockScrolling += 1;
        editor.selection.fromOrientedRange(range);
        editor.$blockScrolling -= 1;
        if (editor.isFocused() && !isInternal)
            editor.renderer.$cursorLayer.setBlinking(!editor.getReadOnly());
        range = null;
        dragCursor = null;
        counter = 0;
        autoScrollStartTime = null;
        cursorMovedTime = null;
        event.removeListener(document, "mousemove", onMouseMove);
    }
    var onMouseMoveTimer = null;
    function onMouseMove() {
        if (onMouseMoveTimer == null) {
            onMouseMoveTimer = setTimeout(function() {
                if (onMouseMoveTimer != null && dragSelectionMarker)
                    clearDragMarker();
            }, 20);
        }
    }

    function canAccept(dataTransfer) {
        var types = dataTransfer.types;
        return !types || Array.prototype.some.call(types, function(type) {
            return type == 'text/plain' || type == 'Text';
        });
    }

    function getDropEffect(e) {
        var copyAllowed = ['copy', 'copymove', 'all', 'uninitialized'];
        var moveAllowed = ['move', 'copymove', 'linkmove', 'all', 'uninitialized'];

        var copyModifierState = useragent.isMac ? e.altKey : e.ctrlKey;
        var effectAllowed = "uninitialized";
        try {
            effectAllowed = e.dataTransfer.effectAllowed.toLowerCase();
        } catch (e) {}
        var dropEffect = "none";

        if (copyModifierState && copyAllowed.indexOf(effectAllowed) >= 0)
            dropEffect = "copy";
        else if (moveAllowed.indexOf(effectAllowed) >= 0)
            dropEffect = "move";
        else if (copyAllowed.indexOf(effectAllowed) >= 0)
            dropEffect = "copy";

        return dropEffect;
    }
}

(function() {

    this.dragWait = function() {
        var interval = Date.now() - this.mousedownEvent.time;
        if (interval > this.editor.getDragDelay())
            this.startDrag();
    };

    this.dragWaitEnd = function() {
        var target = this.editor.container;
        target.draggable = false;
        this.startSelect(this.mousedownEvent.getDocumentPosition());
        this.selectEnd();
    };

    this.dragReadyEnd = function(e) {
        this.editor.renderer.$cursorLayer.setBlinking(!this.editor.getReadOnly());
        this.editor.unsetStyle("ace_dragging");
        this.editor.renderer.setCursorStyle("");
        this.dragWaitEnd();
    };

    this.startDrag = function(){
        this.cancelDrag = false;
        var editor = this.editor;
        var target = editor.container;
        target.draggable = true;
        editor.renderer.$cursorLayer.setBlinking(false);
        editor.setStyle("ace_dragging");
        var cursorStyle = useragent.isWin ? "default" : "move";
        editor.renderer.setCursorStyle(cursorStyle);
        this.setState("dragReady");
    };

    this.onMouseDrag = function(e) {
        var target = this.editor.container;
        if (useragent.isIE && this.state == "dragReady") {
            var distance = calcDistance(this.mousedownEvent.x, this.mousedownEvent.y, this.x, this.y);
            if (distance > 3)
                target.dragDrop();
        }
        if (this.state === "dragWait") {
            var distance = calcDistance(this.mousedownEvent.x, this.mousedownEvent.y, this.x, this.y);
            if (distance > 0) {
                target.draggable = false;
                this.startSelect(this.mousedownEvent.getDocumentPosition());
            }
        }
    };

    this.onMouseDown = function(e) {
        if (!this.$dragEnabled)
            return;
        this.mousedownEvent = e;
        var editor = this.editor;

        var inSelection = e.inSelection();
        var button = e.getButton();
        var clickCount = e.domEvent.detail || 1;
        if (clickCount === 1 && button === 0 && inSelection) {
            if (e.editor.inMultiSelectMode && (e.getAccelKey() || e.getShiftKey()))
                return;
            this.mousedownEvent.time = Date.now();
            var eventTarget = e.domEvent.target || e.domEvent.srcElement;
            if ("unselectable" in eventTarget)
                eventTarget.unselectable = "on";
            if (editor.getDragDelay()) {
                if (useragent.isWebKit) {
                    this.cancelDrag = true;
                    var mouseTarget = editor.container;
                    mouseTarget.draggable = true;
                }
                this.setState("dragWait");
            } else {
                this.startDrag();
            }
            this.captureMouse(e, this.onMouseDrag.bind(this));
            e.defaultPrevented = true;
        }
    };

}).call(DragdropHandler.prototype);


function calcDistance(ax, ay, bx, by) {
    return Math.sqrt(Math.pow(bx - ax, 2) + Math.pow(by - ay, 2));
}

exports.DragdropHandler = DragdropHandler;

});

ace.define("ace/lib/net",["require","exports","module","ace/lib/dom"], function(require, exports, module) {
"use strict";
var dom = require("./dom");

exports.get = function (url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            callback(xhr.responseText);
        }
    };
    xhr.send(null);
};

exports.loadScript = function(path, callback) {
    var head = dom.getDocumentHead();
    var s = document.createElement('script');

    s.src = path;
    head.appendChild(s);

    s.onload = s.onreadystatechange = function(_, isAbort) {
        if (isAbort || !s.readyState || s.readyState == "loaded" || s.readyState == "complete") {
            s = s.onload = s.onreadystatechange = null;
            if (!isAbort)
                callback();
        }
    };
};
exports.qualifyURL = function(url) {
    var a = document.createElement('a');
    a.href = url;
    return a.href;
}

});

ace.define("ace/lib/event_emitter",["require","exports","module"], function(require, exports, module) {
"use strict";

var EventEmitter = {};
var stopPropagation = function() { this.propagationStopped = true; };
var preventDefault = function() { this.defaultPrevented = true; };

EventEmitter._emit =
EventEmitter._dispatchEvent = function(eventName, e) {
    this._eventRegistry || (this._eventRegistry = {});
    this._defaultHandlers || (this._defaultHandlers = {});

    var listeners = this._eventRegistry[eventName] || [];
    var defaultHandler = this._defaultHandlers[eventName];
    if (!listeners.length && !defaultHandler)
        return;

    if (typeof e != "object" || !e)
        e = {};

    if (!e.type)
        e.type = eventName;
    if (!e.stopPropagation)
        e.stopPropagation = stopPropagation;
    if (!e.preventDefault)
        e.preventDefault = preventDefault;

    listeners = listeners.slice();
    for (var i=0; i<listeners.length; i++) {
        listeners[i](e, this);
        if (e.propagationStopped)
            break;
    }
    
    if (defaultHandler && !e.defaultPrevented)
        return defaultHandler(e, this);
};


EventEmitter._signal = function(eventName, e) {
    var listeners = (this._eventRegistry || {})[eventName];
    if (!listeners)
        return;
    listeners = listeners.slice();
    for (var i=0; i<listeners.length; i++)
        listeners[i](e, this);
};

EventEmitter.once = function(eventName, callback) {
    var _self = this;
    callback && this.addEventListener(eventName, function newCallback() {
        _self.removeEventListener(eventName, newCallback);
        callback.apply(null, arguments);
    });
};


EventEmitter.setDefaultHandler = function(eventName, callback) {
    var handlers = this._defaultHandlers
    if (!handlers)
        handlers = this._defaultHandlers = {_disabled_: {}};
    
    if (handlers[eventName]) {
        var old = handlers[eventName];
        var disabled = handlers._disabled_[eventName];
        if (!disabled)
            handlers._disabled_[eventName] = disabled = [];
        disabled.push(old);
        var i = disabled.indexOf(callback);
        if (i != -1) 
            disabled.splice(i, 1);
    }
    handlers[eventName] = callback;
};
EventEmitter.removeDefaultHandler = function(eventName, callback) {
    var handlers = this._defaultHandlers
    if (!handlers)
        return;
    var disabled = handlers._disabled_[eventName];
    
    if (handlers[eventName] == callback) {
        var old = handlers[eventName];
        if (disabled)
            this.setDefaultHandler(eventName, disabled.pop());
    } else if (disabled) {
        var i = disabled.indexOf(callback);
        if (i != -1)
            disabled.splice(i, 1);
    }
};

EventEmitter.on =
EventEmitter.addEventListener = function(eventName, callback, capturing) {
    this._eventRegistry = this._eventRegistry || {};

    var listeners = this._eventRegistry[eventName];
    if (!listeners)
        listeners = this._eventRegistry[eventName] = [];

    if (listeners.indexOf(callback) == -1)
        listeners[capturing ? "unshift" : "push"](callback);
    return callback;
};

EventEmitter.off =
EventEmitter.removeListener =
EventEmitter.removeEventListener = function(eventName, callback) {
    this._eventRegistry = this._eventRegistry || {};

    var listeners = this._eventRegistry[eventName];
    if (!listeners)
        return;

    var index = listeners.indexOf(callback);
    if (index !== -1)
        listeners.splice(index, 1);
};

EventEmitter.removeAllListeners = function(eventName) {
    if (this._eventRegistry) this._eventRegistry[eventName] = [];
};

exports.EventEmitter = EventEmitter;

});

ace.define("ace/config",["require","exports","module","ace/lib/lang","ace/lib/oop","ace/lib/net","ace/lib/event_emitter"], function(require, exports, module) {
"no use strict";

var lang = require("./lib/lang");
var oop = require("./lib/oop");
var net = require("./lib/net");
var EventEmitter = require("./lib/event_emitter").EventEmitter;

var global = (function() {
    return this;
})();

var options = {
    packaged: false,
    workerPath: null,
    modePath: null,
    themePath: null,
    basePath: "",
    suffix: ".js",
    $moduleUrls: {}
};

exports.get = function(key) {
    if (!options.hasOwnProperty(key))
        throw new Error("Unknown config key: " + key);

    return options[key];
};

exports.set = function(key, value) {
    if (!options.hasOwnProperty(key))
        throw new Error("Unknown config key: " + key);

    options[key] = value;
};

exports.all = function() {
    return lang.copyObject(options);
};
oop.implement(exports, EventEmitter);

exports.moduleUrl = function(name, component) {
    if (options.$moduleUrls[name])
        return options.$moduleUrls[name];

    var parts = name.split("/");
    component = component || parts[parts.length - 2] || "";
    var sep = component == "snippets" ? "/" : "-";
    var base = parts[parts.length - 1];
    if (component == "worker" && sep == "-") {
        var re = new RegExp("^" + component + "[\\-_]|[\\-_]" + component + "$", "g");
        base = base.replace(re, "");
    }

    if ((!base || base == component) && parts.length > 1)
        base = parts[parts.length - 2];
    var path = options[component + "Path"];
    if (path == null) {
        path = options.basePath;
    } else if (sep == "/") {
        component = sep = "";
    }
    if (path && path.slice(-1) != "/")
        path += "/";
    return path + component + sep + base + this.get("suffix");
};

exports.setModuleUrl = function(name, subst) {
    return options.$moduleUrls[name] = subst;
};

exports.$loading = {};
exports.loadModule = function(moduleName, onLoad) {
    var module, moduleType;
    if (Array.isArray(moduleName)) {
        moduleType = moduleName[0];
        moduleName = moduleName[1];
    }

    try {
        module = require(moduleName);
    } catch (e) {}
    if (module && !exports.$loading[moduleName])
        return onLoad && onLoad(module);

    if (!exports.$loading[moduleName])
        exports.$loading[moduleName] = [];

    exports.$loading[moduleName].push(onLoad);

    if (exports.$loading[moduleName].length > 1)
        return;

    var afterLoad = function() {
        require([moduleName], function(module) {
            exports._emit("load.module", {name: moduleName, module: module});
            var listeners = exports.$loading[moduleName];
            exports.$loading[moduleName] = null;
            listeners.forEach(function(onLoad) {
                onLoad && onLoad(module);
            });
        });
    };

    if (!exports.get("packaged"))
        return afterLoad();
    net.loadScript(exports.moduleUrl(moduleName, moduleType), afterLoad);
};
init(true);function init(packaged) {

    options.packaged = packaged || require.packaged || module.packaged || (global.define && define.packaged);

    if (!global.document)
        return "";

    var scriptOptions = {};
    var scriptUrl = "";
    var currentScript = (document.currentScript || document._currentScript ); // native or polyfill
    var currentDocument = currentScript && currentScript.ownerDocument || document;
    
    var scripts = currentDocument.getElementsByTagName("script");
    for (var i=0; i<scripts.length; i++) {
        var script = scripts[i];

        var src = script.src || script.getAttribute("src");
        if (!src)
            continue;

        var attributes = script.attributes;
        for (var j=0, l=attributes.length; j < l; j++) {
            var attr = attributes[j];
            if (attr.name.indexOf("data-ace-") === 0) {
                scriptOptions[deHyphenate(attr.name.replace(/^data-ace-/, ""))] = attr.value;
            }
        }

        var m = src.match(/^(.*)\/ace(\-\w+)?\.js(\?|$)/);
        if (m)
            scriptUrl = m[1];
    }

    if (scriptUrl) {
        scriptOptions.base = scriptOptions.base || scriptUrl;
        scriptOptions.packaged = true;
    }

    scriptOptions.basePath = scriptOptions.base;
    scriptOptions.workerPath = scriptOptions.workerPath || scriptOptions.base;
    scriptOptions.modePath = scriptOptions.modePath || scriptOptions.base;
    scriptOptions.themePath = scriptOptions.themePath || scriptOptions.base;
    delete scriptOptions.base;

    for (var key in scriptOptions)
        if (typeof scriptOptions[key] !== "undefined")
            exports.set(key, scriptOptions[key]);
};

exports.init = init;

function deHyphenate(str) {
    return str.replace(/-(.)/g, function(m, m1) { return m1.toUpperCase(); });
}

var optionsProvider = {
    setOptions: function(optList) {
        Object.keys(optList).forEach(function(key) {
            this.setOption(key, optList[key]);
        }, this);
    },
    getOptions: function(optionNames) {
        var result = {};
        if (!optionNames) {
            optionNames = Object.keys(this.$options);
        } else if (!Array.isArray(optionNames)) {
            result = optionNames;
            optionNames = Object.keys(result);
        }
        optionNames.forEach(function(key) {
            result[key] = this.getOption(key);
        }, this);
        return result;
    },
    setOption: function(name, value) {
        if (this["$" + name] === value)
            return;
        var opt = this.$options[name];
        if (!opt) {
            if (typeof console != "undefined" && console.warn)
                console.warn('misspelled option "' + name + '"');
            return undefined;
        }
        if (opt.forwardTo)
            return this[opt.forwardTo] && this[opt.forwardTo].setOption(name, value);

        if (!opt.handlesSet)
            this["$" + name] = value;
        if (opt && opt.set)
            opt.set.call(this, value);
    },
    getOption: function(name) {
        var opt = this.$options[name];
        if (!opt) {
            if (typeof console != "undefined" && console.warn)
                console.warn('misspelled option "' + name + '"');
            return undefined;
        }
        if (opt.forwardTo)
            return this[opt.forwardTo] && this[opt.forwardTo].getOption(name);
        return opt && opt.get ? opt.get.call(this) : this["$" + name];
    }
};

var defaultOptions = {};
exports.defineOptions = function(obj, path, options) {
    if (!obj.$options)
        defaultOptions[path] = obj.$options = {};

    Object.keys(options).forEach(function(key) {
        var opt = options[key];
        if (typeof opt == "string")
            opt = {forwardTo: opt};

        opt.name || (opt.name = key);
        obj.$options[opt.name] = opt;
        if ("initialValue" in opt)
            obj["$" + opt.name] = opt.initialValue;
    });
    oop.implement(obj, optionsProvider);

    return this;
};

exports.resetOptions = function(obj) {
    Object.keys(obj.$options).forEach(function(key) {
        var opt = obj.$options[key];
        if ("value" in opt)
            obj.setOption(key, opt.value);
    });
};

exports.setDefaultValue = function(path, name, value) {
    var opts = defaultOptions[path] || (defaultOptions[path] = {});
    if (opts[name]) {
        if (opts.forwardTo)
            exports.setDefaultValue(opts.forwardTo, name, value);
        else
            opts[name].value = value;
    }
};

exports.setDefaultValues = function(path, optionHash) {
    Object.keys(optionHash).forEach(function(key) {
        exports.setDefaultValue(path, key, optionHash[key]);
    });
};

});

ace.define("ace/mouse/mouse_handler",["require","exports","module","ace/lib/event","ace/lib/useragent","ace/mouse/default_handlers","ace/mouse/default_gutter_handler","ace/mouse/mouse_event","ace/mouse/dragdrop_handler","ace/config"], function(require, exports, module) {
"use strict";

var event = require("../lib/event");
var useragent = require("../lib/useragent");
var DefaultHandlers = require("./default_handlers").DefaultHandlers;
var DefaultGutterHandler = require("./default_gutter_handler").GutterHandler;
var MouseEvent = require("./mouse_event").MouseEvent;
var DragdropHandler = require("./dragdrop_handler").DragdropHandler;
var config = require("../config");

var MouseHandler = function(editor) {
    var _self = this;
    this.editor = editor;

    new DefaultHandlers(this);
    new DefaultGutterHandler(this);
    new DragdropHandler(this);
    
    var focusEditor = function(e) { 
        if (!editor.isFocused() && editor.textInput)
            editor.textInput.moveToMouse(e);
        editor.focus() 
    };
    
    var mouseTarget = editor.renderer.getMouseEventTarget();
    event.addListener(mouseTarget, "click", this.onMouseEvent.bind(this, "click"));
    event.addListener(mouseTarget, "mousemove", this.onMouseMove.bind(this, "mousemove"));
    event.addMultiMouseDownListener(mouseTarget, [400, 300, 250], this, "onMouseEvent");
    if (editor.renderer.scrollBarV) {
        event.addMultiMouseDownListener(editor.renderer.scrollBarV.inner, [400, 300, 250], this, "onMouseEvent");
        event.addMultiMouseDownListener(editor.renderer.scrollBarH.inner, [400, 300, 250], this, "onMouseEvent");
        if (useragent.isIE) {
            event.addListener(editor.renderer.scrollBarV.element, "mousedown", focusEditor);
            event.addListener(editor.renderer.scrollBarH.element, "mousemove", focusEditor);
        }
    }
    event.addMouseWheelListener(editor.container, this.onMouseWheel.bind(this, "mousewheel"));

    var gutterEl = editor.renderer.$gutter;
    event.addListener(gutterEl, "mousedown", this.onMouseEvent.bind(this, "guttermousedown"));
    event.addListener(gutterEl, "click", this.onMouseEvent.bind(this, "gutterclick"));
    event.addListener(gutterEl, "dblclick", this.onMouseEvent.bind(this, "gutterdblclick"));
    event.addListener(gutterEl, "mousemove", this.onMouseEvent.bind(this, "guttermousemove"));

    event.addListener(mouseTarget, "mousedown", focusEditor);

    event.addListener(gutterEl, "mousedown", function(e) {
        editor.focus();
        return event.preventDefault(e);
    });

    editor.on("mousemove", function(e){
        if (_self.state || _self.$dragDelay || !_self.$dragEnabled)
            return;
        
        var char = editor.renderer.screenToTextCoordinates(e.x, e.y);
        var range = editor.session.selection.getRange();
        var renderer = editor.renderer;

        if (!range.isEmpty() && range.insideStart(char.row, char.column)) {
            renderer.setCursorStyle("default");
        } else {
            renderer.setCursorStyle("");
        }
    });
};

(function() {
    this.onMouseEvent = function(name, e) {
        this.editor._emit(name, new MouseEvent(e, this.editor));
    };

    this.onMouseMove = function(name, e) {
        var listeners = this.editor._eventRegistry && this.editor._eventRegistry.mousemove;
        if (!listeners || !listeners.length)
            return;

        this.editor._emit(name, new MouseEvent(e, this.editor));
    };

    this.onMouseWheel = function(name, e) {
        var mouseEvent = new MouseEvent(e, this.editor);
        mouseEvent.speed = this.$scrollSpeed * 2;
        mouseEvent.wheelX = e.wheelX;
        mouseEvent.wheelY = e.wheelY;

        this.editor._emit(name, mouseEvent);
    };

    this.setState = function(state) {
        this.state = state;
    };

    this.captureMouse = function(ev, mouseMoveHandler) {
        this.x = ev.x;
        this.y = ev.y;

        this.isMousePressed = true;
        var renderer = this.editor.renderer;
        if (renderer.$keepTextAreaAtCursor)
            renderer.$keepTextAreaAtCursor = null;

        var self = this;
        var onMouseMove = function(e) {
            if (!e) return;
            if (useragent.isWebKit && !e.which && self.releaseMouse)
                return self.releaseMouse();

            self.x = e.clientX;
            self.y = e.clientY;
            mouseMoveHandler && mouseMoveHandler(e);
            self.mouseEvent = new MouseEvent(e, self.editor);
            self.$mouseMoved = true;
        };

        var onCaptureEnd = function(e) {
            clearInterval(timerId);
            onCaptureInterval();
            self[self.state + "End"] && self[self.state + "End"](e);
            self.state = "";
            if (renderer.$keepTextAreaAtCursor == null) {
                renderer.$keepTextAreaAtCursor = true;
                renderer.$moveTextAreaToCursor();
            }
            self.isMousePressed = false;
            self.$onCaptureMouseMove = self.releaseMouse = null;
            e && self.onMouseEvent("mouseup", e);
        };

        var onCaptureInterval = function() {
            self[self.state] && self[self.state]();
            self.$mouseMoved = false;
        };

        if (useragent.isOldIE && ev.domEvent.type == "dblclick") {
            return setTimeout(function() {onCaptureEnd(ev);});
        }

        self.$onCaptureMouseMove = onMouseMove;
        self.releaseMouse = event.capture(this.editor.container, onMouseMove, onCaptureEnd);
        var timerId = setInterval(onCaptureInterval, 20);
    };
    this.releaseMouse = null;
    this.cancelContextMenu = function() {
        var stop = function(e) {
            if (e && e.domEvent && e.domEvent.type != "contextmenu")
                return;
            this.editor.off("nativecontextmenu", stop);
            if (e && e.domEvent)
                event.stopEvent(e.domEvent);
        }.bind(this);
        setTimeout(stop, 10);
        this.editor.on("nativecontextmenu", stop);
    };
}).call(MouseHandler.prototype);

config.defineOptions(MouseHandler.prototype, "mouseHandler", {
    scrollSpeed: {initialValue: 2},
    dragDelay: {initialValue: (useragent.isMac ? 150 : 0)},
    dragEnabled: {initialValue: true},
    focusTimout: {initialValue: 0},
    tooltipFollowsMouse: {initialValue: true}
});


exports.MouseHandler = MouseHandler;
});

ace.define("ace/mouse/fold_handler",["require","exports","module"], function(require, exports, module) {
"use strict";

function FoldHandler(editor) {

    editor.on("click", function(e) {
        var position = e.getDocumentPosition();
        var session = editor.session;
        var fold = session.getFoldAt(position.row, position.column, 1);
        if (fold) {
            if (e.getAccelKey())
                session.removeFold(fold);
            else
                session.expandFold(fold);

            e.stop();
        }
    });

    editor.on("gutterclick", function(e) {
        var gutterRegion = editor.renderer.$gutterLayer.getRegion(e);

        if (gutterRegion == "foldWidgets") {
            var row = e.getDocumentPosition().row;
            var session = editor.session;
            if (session.foldWidgets && session.foldWidgets[row])
                editor.session.onFoldWidgetClick(row, e);
            if (!editor.isFocused())
                editor.focus();
            e.stop();
        }
    });

    editor.on("gutterdblclick", function(e) {
        var gutterRegion = editor.renderer.$gutterLayer.getRegion(e);

        if (gutterRegion == "foldWidgets") {
            var row = e.getDocumentPosition().row;
            var session = editor.session;
            var data = session.getParentFoldRangeData(row, true);
            var range = data.range || data.firstRange;

            if (range) {
                row = range.start.row;
                var fold = session.getFoldAt(row, session.getLine(row).length, 1);

                if (fold) {
                    session.removeFold(fold);
                } else {
                    session.addFold("...", range);
                    editor.renderer.scrollCursorIntoView({row: range.start.row, column: 0});
                }
            }
            e.stop();
        }
    });
}

exports.FoldHandler = FoldHandler;

});

ace.define("ace/keyboard/keybinding",["require","exports","module","ace/lib/keys","ace/lib/event"], function(require, exports, module) {
"use strict";

var keyUtil  = require("../lib/keys");
var event = require("../lib/event");

var KeyBinding = function(editor) {
    this.$editor = editor;
    this.$data = {editor: editor};
    this.$handlers = [];
    this.setDefaultHandler(editor.commands);
};

(function() {
    this.setDefaultHandler = function(kb) {
        this.removeKeyboardHandler(this.$defaultHandler);
        this.$defaultHandler = kb;
        this.addKeyboardHandler(kb, 0);
    };

    this.setKeyboardHandler = function(kb) {
        var h = this.$handlers;
        if (h[h.length - 1] == kb)
            return;

        while (h[h.length - 1] && h[h.length - 1] != this.$defaultHandler)
            this.removeKeyboardHandler(h[h.length - 1]);

        this.addKeyboardHandler(kb, 1);
    };

    this.addKeyboardHandler = function(kb, pos) {
        if (!kb)
            return;
        if (typeof kb == "function" && !kb.handleKeyboard)
            kb.handleKeyboard = kb;
        var i = this.$handlers.indexOf(kb);
        if (i != -1)
            this.$handlers.splice(i, 1);

        if (pos == undefined)
            this.$handlers.push(kb);
        else
            this.$handlers.splice(pos, 0, kb);

        if (i == -1 && kb.attach)
            kb.attach(this.$editor);
    };

    this.removeKeyboardHandler = function(kb) {
        var i = this.$handlers.indexOf(kb);
        if (i == -1)
            return false;
        this.$handlers.splice(i, 1);
        kb.detach && kb.detach(this.$editor);
        return true;
    };

    this.getKeyboardHandler = function() {
        return this.$handlers[this.$handlers.length - 1];
    };
    
    this.getStatusText = function() {
        var data = this.$data;
        var editor = data.editor;
        return this.$handlers.map(function(h) {
            return h.getStatusText && h.getStatusText(editor, data) || "";
        }).filter(Boolean).join(" ");
    };

    this.$callKeyboardHandlers = function(hashId, keyString, keyCode, e) {
        var toExecute;
        var success = false;
        var commands = this.$editor.commands;

        for (var i = this.$handlers.length; i--;) {
            toExecute = this.$handlers[i].handleKeyboard(
                this.$data, hashId, keyString, keyCode, e
            );
            if (!toExecute || !toExecute.command)
                continue;
            if (toExecute.command == "null") {
                success = true;
            } else {
                success = commands.exec(toExecute.command, this.$editor, toExecute.args, e);                
            }
            if (success && e && hashId != -1 && 
                toExecute.passEvent != true && toExecute.command.passEvent != true
            ) {
                event.stopEvent(e);
            }
            if (success)
                break;
        }
        return success;
    };

    this.onCommandKey = function(e, hashId, keyCode) {
        var keyString = keyUtil.keyCodeToString(keyCode);
        this.$callKeyboardHandlers(hashId, keyString, keyCode, e);
    };

    this.onTextInput = function(text) {
        var success = this.$callKeyboardHandlers(-1, text);
        if (!success)
            this.$editor.commands.exec("insertstring", this.$editor, text);
    };

}).call(KeyBinding.prototype);

exports.KeyBinding = KeyBinding;
});

ace.define("ace/range",["require","exports","module"], function(require, exports, module) {
"use strict";
var comparePoints = function(p1, p2) {
    return p1.row - p2.row || p1.column - p2.column;
};
var Range = function(startRow, startColumn, endRow, endColumn) {
    this.start = {
        row: startRow,
        column: startColumn
    };

    this.end = {
        row: endRow,
        column: endColumn
    };
};

(function() {
    this.isEqual = function(range) {
        return this.start.row === range.start.row &&
            this.end.row === range.end.row &&
            this.start.column === range.start.column &&
            this.end.column === range.end.column;
    };
    this.toString = function() {
        return ("Range: [" + this.start.row + "/" + this.start.column +
            "] -> [" + this.end.row + "/" + this.end.column + "]");
    };

    this.contains = function(row, column) {
        return this.compare(row, column) == 0;
    };
    this.compareRange = function(range) {
        var cmp,
            end = range.end,
            start = range.start;

        cmp = this.compare(end.row, end.column);
        if (cmp == 1) {
            cmp = this.compare(start.row, start.column);
            if (cmp == 1) {
                return 2;
            } else if (cmp == 0) {
                return 1;
            } else {
                return 0;
            }
        } else if (cmp == -1) {
            return -2;
        } else {
            cmp = this.compare(start.row, start.column);
            if (cmp == -1) {
                return -1;
            } else if (cmp == 1) {
                return 42;
            } else {
                return 0;
            }
        }
    };
    this.comparePoint = function(p) {
        return this.compare(p.row, p.column);
    };
    this.containsRange = function(range) {
        return this.comparePoint(range.start) == 0 && this.comparePoint(range.end) == 0;
    };
    this.intersects = function(range) {
        var cmp = this.compareRange(range);
        return (cmp == -1 || cmp == 0 || cmp == 1);
    };
    this.isEnd = function(row, column) {
        return this.end.row == row && this.end.column == column;
    };
    this.isStart = function(row, column) {
        return this.start.row == row && this.start.column == column;
    };
    this.setStart = function(row, column) {
        if (typeof row == "object") {
            this.start.column = row.column;
            this.start.row = row.row;
        } else {
            this.start.row = row;
            this.start.column = column;
        }
    };
    this.setEnd = function(row, column) {
        if (typeof row == "object") {
            this.end.column = row.column;
            this.end.row = row.row;
        } else {
            this.end.row = row;
            this.end.column = column;
        }
    };
    this.inside = function(row, column) {
        if (this.compare(row, column) == 0) {
            if (this.isEnd(row, column) || this.isStart(row, column)) {
                return false;
            } else {
                return true;
            }
        }
        return false;
    };
    this.insideStart = function(row, column) {
        if (this.compare(row, column) == 0) {
            if (this.isEnd(row, column)) {
                return false;
            } else {
                return true;
            }
        }
        return false;
    };
    this.insideEnd = function(row, column) {
        if (this.compare(row, column) == 0) {
            if (this.isStart(row, column)) {
                return false;
            } else {
                return true;
            }
        }
        return false;
    };
    this.compare = function(row, column) {
        if (!this.isMultiLine()) {
            if (row === this.start.row) {
                return column < this.start.column ? -1 : (column > this.end.column ? 1 : 0);
            };
        }

        if (row < this.start.row)
            return -1;

        if (row > this.end.row)
            return 1;

        if (this.start.row === row)
            return column >= this.start.column ? 0 : -1;

        if (this.end.row === row)
            return column <= this.end.column ? 0 : 1;

        return 0;
    };
    this.compareStart = function(row, column) {
        if (this.start.row == row && this.start.column == column) {
            return -1;
        } else {
            return this.compare(row, column);
        }
    };
    this.compareEnd = function(row, column) {
        if (this.end.row == row && this.end.column == column) {
            return 1;
        } else {
            return this.compare(row, column);
        }
    };
    this.compareInside = function(row, column) {
        if (this.end.row == row && this.end.column == column) {
            return 1;
        } else if (this.start.row == row && this.start.column == column) {
            return -1;
        } else {
            return this.compare(row, column);
        }
    };
    this.clipRows = function(firstRow, lastRow) {
        if (this.end.row > lastRow)
            var end = {row: lastRow + 1, column: 0};
        else if (this.end.row < firstRow)
            var end = {row: firstRow, column: 0};

        if (this.start.row > lastRow)
            var start = {row: lastRow + 1, column: 0};
        else if (this.start.row < firstRow)
            var start = {row: firstRow, column: 0};

        return Range.fromPoints(start || this.start, end || this.end);
    };
    this.extend = function(row, column) {
        var cmp = this.compare(row, column);

        if (cmp == 0)
            return this;
        else if (cmp == -1)
            var start = {row: row, column: column};
        else
            var end = {row: row, column: column};

        return Range.fromPoints(start || this.start, end || this.end);
    };

    this.isEmpty = function() {
        return (this.start.row === this.end.row && this.start.column === this.end.column);
    };
    this.isMultiLine = function() {
        return (this.start.row !== this.end.row);
    };
    this.clone = function() {
        return Range.fromPoints(this.start, this.end);
    };
    this.collapseRows = function() {
        if (this.end.column == 0)
            return new Range(this.start.row, 0, Math.max(this.start.row, this.end.row-1), 0)
        else
            return new Range(this.start.row, 0, this.end.row, 0)
    };
    this.toScreenRange = function(session) {
        var screenPosStart = session.documentToScreenPosition(this.start);
        var screenPosEnd = session.documentToScreenPosition(this.end);

        return new Range(
            screenPosStart.row, screenPosStart.column,
            screenPosEnd.row, screenPosEnd.column
        );
    };
    this.moveBy = function(row, column) {
        this.start.row += row;
        this.start.column += column;
        this.end.row += row;
        this.end.column += column;
    };

}).call(Range.prototype);
Range.fromPoints = function(start, end) {
    return new Range(start.row, start.column, end.row, end.column);
};
Range.comparePoints = comparePoints;

Range.comparePoints = function(p1, p2) {
    return p1.row - p2.row || p1.column - p2.column;
};


exports.Range = Range;
});

ace.define("ace/selection",["require","exports","module","ace/lib/oop","ace/lib/lang","ace/lib/event_emitter","ace/range"], function(require, exports, module) {
"use strict";

var oop = require("./lib/oop");
var lang = require("./lib/lang");
var EventEmitter = require("./lib/event_emitter").EventEmitter;
var Range = require("./range").Range;
var Selection = function(session) {
    this.session = session;
    this.doc = session.getDocument();

    this.clearSelection();
    this.lead = this.selectionLead = this.doc.createAnchor(0, 0);
    this.anchor = this.selectionAnchor = this.doc.createAnchor(0, 0);

    var self = this;
    this.lead.on("change", function(e) {
        self._emit("changeCursor");
        if (!self.$isEmpty)
            self._emit("changeSelection");
        if (!self.$keepDesiredColumnOnChange && e.old.column != e.value.column)
            self.$desiredColumn = null;
    });

    this.selectionAnchor.on("change", function() {
        if (!self.$isEmpty)
            self._emit("changeSelection");
    });
};

(function() {

    oop.implement(this, EventEmitter);
    this.isEmpty = function() {
        return (this.$isEmpty || (
            this.anchor.row == this.lead.row &&
            this.anchor.column == this.lead.column
        ));
    };
    this.isMultiLine = function() {
        if (this.isEmpty()) {
            return false;
        }

        return this.getRange().isMultiLine();
    };
    this.getCursor = function() {
        return this.lead.getPosition();
    };
    this.setSelectionAnchor = function(row, column) {
        this.anchor.setPosition(row, column);

        if (this.$isEmpty) {
            this.$isEmpty = false;
            this._emit("changeSelection");
        }
    };
    this.getSelectionAnchor = function() {
        if (this.$isEmpty)
            return this.getSelectionLead();
        else
            return this.anchor.getPosition();
    };
    this.getSelectionLead = function() {
        return this.lead.getPosition();
    };
    this.shiftSelection = function(columns) {
        if (this.$isEmpty) {
            this.moveCursorTo(this.lead.row, this.lead.column + columns);
            return;
        }

        var anchor = this.getSelectionAnchor();
        var lead = this.getSelectionLead();

        var isBackwards = this.isBackwards();

        if (!isBackwards || anchor.column !== 0)
            this.setSelectionAnchor(anchor.row, anchor.column + columns);

        if (isBackwards || lead.column !== 0) {
            this.$moveSelection(function() {
                this.moveCursorTo(lead.row, lead.column + columns);
            });
        }
    };
    this.isBackwards = function() {
        var anchor = this.anchor;
        var lead = this.lead;
        return (anchor.row > lead.row || (anchor.row == lead.row && anchor.column > lead.column));
    };
    this.getRange = function() {
        var anchor = this.anchor;
        var lead = this.lead;

        if (this.isEmpty())
            return Range.fromPoints(lead, lead);

        if (this.isBackwards()) {
            return Range.fromPoints(lead, anchor);
        }
        else {
            return Range.fromPoints(anchor, lead);
        }
    };
    this.clearSelection = function() {
        if (!this.$isEmpty) {
            this.$isEmpty = true;
            this._emit("changeSelection");
        }
    };
    this.selectAll = function() {
        var lastRow = this.doc.getLength() - 1;
        this.setSelectionAnchor(0, 0);
        this.moveCursorTo(lastRow, this.doc.getLine(lastRow).length);
    };
    this.setRange =
    this.setSelectionRange = function(range, reverse) {
        if (reverse) {
            this.setSelectionAnchor(range.end.row, range.end.column);
            this.selectTo(range.start.row, range.start.column);
        } else {
            this.setSelectionAnchor(range.start.row, range.start.column);
            this.selectTo(range.end.row, range.end.column);
        }
        if (this.getRange().isEmpty())
            this.$isEmpty = true;
        this.$desiredColumn = null;
    };

    this.$moveSelection = function(mover) {
        var lead = this.lead;
        if (this.$isEmpty)
            this.setSelectionAnchor(lead.row, lead.column);

        mover.call(this);
    };
    this.selectTo = function(row, column) {
        this.$moveSelection(function() {
            this.moveCursorTo(row, column);
        });
    };
    this.selectToPosition = function(pos) {
        this.$moveSelection(function() {
            this.moveCursorToPosition(pos);
        });
    };
    this.moveTo = function(row, column) {
        this.clearSelection();
        this.moveCursorTo(row, column);
    };
    this.moveToPosition = function(pos) {
        this.clearSelection();
        this.moveCursorToPosition(pos);
    };
    this.selectUp = function() {
        this.$moveSelection(this.moveCursorUp);
    };
    this.selectDown = function() {
        this.$moveSelection(this.moveCursorDown);
    };
    this.selectRight = function() {
        this.$moveSelection(this.moveCursorRight);
    };
    this.selectLeft = function() {
        this.$moveSelection(this.moveCursorLeft);
    };
    this.selectLineStart = function() {
        this.$moveSelection(this.moveCursorLineStart);
    };
    this.selectLineEnd = function() {
        this.$moveSelection(this.moveCursorLineEnd);
    };
    this.selectFileEnd = function() {
        this.$moveSelection(this.moveCursorFileEnd);
    };
    this.selectFileStart = function() {
        this.$moveSelection(this.moveCursorFileStart);
    };
    this.selectWordRight = function() {
        this.$moveSelection(this.moveCursorWordRight);
    };
    this.selectWordLeft = function() {
        this.$moveSelection(this.moveCursorWordLeft);
    };
    this.getWordRange = function(row, column) {
        if (typeof column == "undefined") {
            var cursor = row || this.lead;
            row = cursor.row;
            column = cursor.column;
        }
        return this.session.getWordRange(row, column);
    };
    this.selectWord = function() {
        this.setSelectionRange(this.getWordRange());
    };
    this.selectAWord = function() {
        var cursor = this.getCursor();
        var range = this.session.getAWordRange(cursor.row, cursor.column);
        this.setSelectionRange(range);
    };

    this.getLineRange = function(row, excludeLastChar) {
        var rowStart = typeof row == "number" ? row : this.lead.row;
        var rowEnd;

        var foldLine = this.session.getFoldLine(rowStart);
        if (foldLine) {
            rowStart = foldLine.start.row;
            rowEnd = foldLine.end.row;
        } else {
            rowEnd = rowStart;
        }
        if (excludeLastChar === true)
            return new Range(rowStart, 0, rowEnd, this.session.getLine(rowEnd).length);
        else
            return new Range(rowStart, 0, rowEnd + 1, 0);
    };
    this.selectLine = function() {
        this.setSelectionRange(this.getLineRange());
    };
    this.moveCursorUp = function() {
        this.moveCursorBy(-1, 0);
    };
    this.moveCursorDown = function() {
        this.moveCursorBy(1, 0);
    };
    this.moveCursorLeft = function() {
        var cursor = this.lead.getPosition(),
            fold;

        if (fold = this.session.getFoldAt(cursor.row, cursor.column, -1)) {
            this.moveCursorTo(fold.start.row, fold.start.column);
        } else if (cursor.column === 0) {
            if (cursor.row > 0) {
                this.moveCursorTo(cursor.row - 1, this.doc.getLine(cursor.row - 1).length);
            }
        }
        else {
            var tabSize = this.session.getTabSize();
            if (this.session.isTabStop(cursor) && this.doc.getLine(cursor.row).slice(cursor.column-tabSize, cursor.column).split(" ").length-1 == tabSize)
                this.moveCursorBy(0, -tabSize);
            else
                this.moveCursorBy(0, -1);
        }
    };
    this.moveCursorRight = function() {
        var cursor = this.lead.getPosition(),
            fold;
        if (fold = this.session.getFoldAt(cursor.row, cursor.column, 1)) {
            this.moveCursorTo(fold.end.row, fold.end.column);
        }
        else if (this.lead.column == this.doc.getLine(this.lead.row).length) {
            if (this.lead.row < this.doc.getLength() - 1) {
                this.moveCursorTo(this.lead.row + 1, 0);
            }
        }
        else {
            var tabSize = this.session.getTabSize();
            var cursor = this.lead;
            if (this.session.isTabStop(cursor) && this.doc.getLine(cursor.row).slice(cursor.column, cursor.column+tabSize).split(" ").length-1 == tabSize)
                this.moveCursorBy(0, tabSize);
            else
                this.moveCursorBy(0, 1);
        }
    };
    this.moveCursorLineStart = function() {
        var row = this.lead.row;
        var column = this.lead.column;
        var screenRow = this.session.documentToScreenRow(row, column);
        var firstColumnPosition = this.session.screenToDocumentPosition(screenRow, 0);
        var beforeCursor = this.session.getDisplayLine(
            row, null, firstColumnPosition.row,
            firstColumnPosition.column
        );

        var leadingSpace = beforeCursor.match(/^\s*/);
        if (leadingSpace[0].length != column && !this.session.$useEmacsStyleLineStart)
            firstColumnPosition.column += leadingSpace[0].length;
        this.moveCursorToPosition(firstColumnPosition);
    };
    this.moveCursorLineEnd = function() {
        var lead = this.lead;
        var lineEnd = this.session.getDocumentLastRowColumnPosition(lead.row, lead.column);
        if (this.lead.column == lineEnd.column) {
            var line = this.session.getLine(lineEnd.row);
            if (lineEnd.column == line.length) {
                var textEnd = line.search(/\s+$/);
                if (textEnd > 0)
                    lineEnd.column = textEnd;
            }
        }

        this.moveCursorTo(lineEnd.row, lineEnd.column);
    };
    this.moveCursorFileEnd = function() {
        var row = this.doc.getLength() - 1;
        var column = this.doc.getLine(row).length;
        this.moveCursorTo(row, column);
    };
    this.moveCursorFileStart = function() {
        this.moveCursorTo(0, 0);
    };
    this.moveCursorLongWordRight = function() {
        var row = this.lead.row;
        var column = this.lead.column;
        var line = this.doc.getLine(row);
        var rightOfCursor = line.substring(column);

        var match;
        this.session.nonTokenRe.lastIndex = 0;
        this.session.tokenRe.lastIndex = 0;
        var fold = this.session.getFoldAt(row, column, 1);
        if (fold) {
            this.moveCursorTo(fold.end.row, fold.end.column);
            return;
        }
        if (match = this.session.nonTokenRe.exec(rightOfCursor)) {
            column += this.session.nonTokenRe.lastIndex;
            this.session.nonTokenRe.lastIndex = 0;
            rightOfCursor = line.substring(column);
        }
        if (column >= line.length) {
            this.moveCursorTo(row, line.length);
            this.moveCursorRight();
            if (row < this.doc.getLength() - 1)
                this.moveCursorWordRight();
            return;
        }
        if (match = this.session.tokenRe.exec(rightOfCursor)) {
            column += this.session.tokenRe.lastIndex;
            this.session.tokenRe.lastIndex = 0;
        }

        this.moveCursorTo(row, column);
    };
    this.moveCursorLongWordLeft = function() {
        var row = this.lead.row;
        var column = this.lead.column;
        var fold;
        if (fold = this.session.getFoldAt(row, column, -1)) {
            this.moveCursorTo(fold.start.row, fold.start.column);
            return;
        }

        var str = this.session.getFoldStringAt(row, column, -1);
        if (str == null) {
            str = this.doc.getLine(row).substring(0, column);
        }

        var leftOfCursor = lang.stringReverse(str);
        var match;
        this.session.nonTokenRe.lastIndex = 0;
        this.session.tokenRe.lastIndex = 0;
        if (match = this.session.nonTokenRe.exec(leftOfCursor)) {
            column -= this.session.nonTokenRe.lastIndex;
            leftOfCursor = leftOfCursor.slice(this.session.nonTokenRe.lastIndex);
            this.session.nonTokenRe.lastIndex = 0;
        }
        if (column <= 0) {
            this.moveCursorTo(row, 0);
            this.moveCursorLeft();
            if (row > 0)
                this.moveCursorWordLeft();
            return;
        }
        if (match = this.session.tokenRe.exec(leftOfCursor)) {
            column -= this.session.tokenRe.lastIndex;
            this.session.tokenRe.lastIndex = 0;
        }

        this.moveCursorTo(row, column);
    };

    this.$shortWordEndIndex = function(rightOfCursor) {
        var match, index = 0, ch;
        var whitespaceRe = /\s/;
        var tokenRe = this.session.tokenRe;

        tokenRe.lastIndex = 0;
        if (match = this.session.tokenRe.exec(rightOfCursor)) {
            index = this.session.tokenRe.lastIndex;
        } else {
            while ((ch = rightOfCursor[index]) && whitespaceRe.test(ch))
                index ++;

            if (index < 1) {
                tokenRe.lastIndex = 0;
                 while ((ch = rightOfCursor[index]) && !tokenRe.test(ch)) {
                    tokenRe.lastIndex = 0;
                    index ++;
                    if (whitespaceRe.test(ch)) {
                        if (index > 2) {
                            index--;
                            break;
                        } else {
                            while ((ch = rightOfCursor[index]) && whitespaceRe.test(ch))
                                index ++;
                            if (index > 2)
                                break;
                        }
                    }
                }
            }
        }
        tokenRe.lastIndex = 0;

        return index;
    };

    this.moveCursorShortWordRight = function() {
        var row = this.lead.row;
        var column = this.lead.column;
        var line = this.doc.getLine(row);
        var rightOfCursor = line.substring(column);

        var fold = this.session.getFoldAt(row, column, 1);
        if (fold)
            return this.moveCursorTo(fold.end.row, fold.end.column);

        if (column == line.length) {
            var l = this.doc.getLength();
            do {
                row++;
                rightOfCursor = this.doc.getLine(row);
            } while (row < l && /^\s*$/.test(rightOfCursor));

            if (!/^\s+/.test(rightOfCursor))
                rightOfCursor = "";
            column = 0;
        }

        var index = this.$shortWordEndIndex(rightOfCursor);

        this.moveCursorTo(row, column + index);
    };

    this.moveCursorShortWordLeft = function() {
        var row = this.lead.row;
        var column = this.lead.column;

        var fold;
        if (fold = this.session.getFoldAt(row, column, -1))
            return this.moveCursorTo(fold.start.row, fold.start.column);

        var line = this.session.getLine(row).substring(0, column);
        if (column === 0) {
            do {
                row--;
                line = this.doc.getLine(row);
            } while (row > 0 && /^\s*$/.test(line));

            column = line.length;
            if (!/\s+$/.test(line))
                line = "";
        }

        var leftOfCursor = lang.stringReverse(line);
        var index = this.$shortWordEndIndex(leftOfCursor);

        return this.moveCursorTo(row, column - index);
    };

    this.moveCursorWordRight = function() {
        if (this.session.$selectLongWords)
            this.moveCursorLongWordRight();
        else
            this.moveCursorShortWordRight();
    };

    this.moveCursorWordLeft = function() {
        if (this.session.$selectLongWords)
            this.moveCursorLongWordLeft();
        else
            this.moveCursorShortWordLeft();
    };
    this.moveCursorBy = function(rows, chars) {
        var screenPos = this.session.documentToScreenPosition(
            this.lead.row,
            this.lead.column
        );

        if (chars === 0) {
            if (this.$desiredColumn)
                screenPos.column = this.$desiredColumn;
            else
                this.$desiredColumn = screenPos.column;
        }

        var docPos = this.session.screenToDocumentPosition(screenPos.row + rows, screenPos.column);
        
        if (rows !== 0 && chars === 0 && docPos.row === this.lead.row && docPos.column === this.lead.column) {
            if (this.session.lineWidgets && this.session.lineWidgets[docPos.row])
                docPos.row++;
        }
        this.moveCursorTo(docPos.row, docPos.column + chars, chars === 0);
    };
    this.moveCursorToPosition = function(position) {
        this.moveCursorTo(position.row, position.column);
    };
    this.moveCursorTo = function(row, column, keepDesiredColumn) {
        var fold = this.session.getFoldAt(row, column, 1);
        if (fold) {
            row = fold.start.row;
            column = fold.start.column;
        }

        this.$keepDesiredColumnOnChange = true;
        this.lead.setPosition(row, column);
        this.$keepDesiredColumnOnChange = false;

        if (!keepDesiredColumn)
            this.$desiredColumn = null;
    };
    this.moveCursorToScreen = function(row, column, keepDesiredColumn) {
        var pos = this.session.screenToDocumentPosition(row, column);
        this.moveCursorTo(pos.row, pos.column, keepDesiredColumn);
    };
    this.detach = function() {
        this.lead.detach();
        this.anchor.detach();
        this.session = this.doc = null;
    };

    this.fromOrientedRange = function(range) {
        this.setSelectionRange(range, range.cursor == range.start);
        this.$desiredColumn = range.desiredColumn || this.$desiredColumn;
    };

    this.toOrientedRange = function(range) {
        var r = this.getRange();
        if (range) {
            range.start.column = r.start.column;
            range.start.row = r.start.row;
            range.end.column = r.end.column;
            range.end.row = r.end.row;
        } else {
            range = r;
        }

        range.cursor = this.isBackwards() ? range.start : range.end;
        range.desiredColumn = this.$desiredColumn;
        return range;
    };
    this.getRangeOfMovements = function(func) {
        var start = this.getCursor();
        try {
            func.call(null, this);
            var end = this.getCursor();
            return Range.fromPoints(start,end);
        } catch(e) {
            return Range.fromPoints(start,start);
        } finally {
            this.moveCursorToPosition(start);
        }
    };

    this.toJSON = function() {
        if (this.rangeCount) {
            var data = this.ranges.map(function(r) {
                var r1 = r.clone();
                r1.isBackwards = r.cursor == r.start;
                return r1;
            });
        } else {
            var data = this.getRange();
            data.isBackwards = this.isBackwards();
        }
        return data;
    };

    this.fromJSON = function(data) {
        if (data.start == undefined) {
            if (this.rangeList) {
                this.toSingleRange(data[0]);
                for (var i = data.length; i--; ) {
                    var r = Range.fromPoints(data[i].start, data[i].end);
                    if (data.isBackwards)
                        r.cursor = r.start;
                    this.addRange(r, true);
                }
                return;
            } else
                data = data[0];
        }
        if (this.rangeList)
            this.toSingleRange(data);
        this.setSelectionRange(data, data.isBackwards);
    };

    this.isEqual = function(data) {
        if ((data.length || this.rangeCount) && data.length != this.rangeCount)
            return false;
        if (!data.length || !this.ranges)
            return this.getRange().isEqual(data);

        for (var i = this.ranges.length; i--; ) {
            if (!this.ranges[i].isEqual(data[i]))
                return false;
        }
        return true;
    };

}).call(Selection.prototype);

exports.Selection = Selection;
});

ace.define("ace/tokenizer",["require","exports","module"], function(require, exports, module) {
"use strict";
var MAX_TOKEN_COUNT = 2000;
var Tokenizer = function(rules) {
    this.states = rules;

    this.regExps = {};
    this.matchMappings = {};
    for (var key in this.states) {
        var state = this.states[key];
        var ruleRegExps = [];
        var matchTotal = 0;
        var mapping = this.matchMappings[key] = {defaultToken: "text"};
        var flag = "g";

        var splitterRurles = [];
        for (var i = 0; i < state.length; i++) {
            var rule = state[i];
            if (rule.defaultToken)
                mapping.defaultToken = rule.defaultToken;
            if (rule.caseInsensitive)
                flag = "gi";
            if (rule.regex == null)
                continue;

            if (rule.regex instanceof RegExp)
                rule.regex = rule.regex.toString().slice(1, -1);
            var adjustedregex = rule.regex;
            var matchcount = new RegExp("(?:(" + adjustedregex + ")|(.))").exec("a").length - 2;
            if (Array.isArray(rule.token)) {
                if (rule.token.length == 1 || matchcount == 1) {
                    rule.token = rule.token[0];
                } else if (matchcount - 1 != rule.token.length) {
                    this.reportError("number of classes and regexp groups doesn't match", { 
                        rule: rule,
                        groupCount: matchcount - 1
                    });
                    rule.token = rule.token[0];
                } else {
                    rule.tokenArray = rule.token;
                    rule.token = null;
                    rule.onMatch = this.$arrayTokens;
                }
            } else if (typeof rule.token == "function" && !rule.onMatch) {
                if (matchcount > 1)
                    rule.onMatch = this.$applyToken;
                else
                    rule.onMatch = rule.token;
            }

            if (matchcount > 1) {
                if (/\\\d/.test(rule.regex)) {
                    adjustedregex = rule.regex.replace(/\\([0-9]+)/g, function(match, digit) {
                        return "\\" + (parseInt(digit, 10) + matchTotal + 1);
                    });
                } else {
                    matchcount = 1;
                    adjustedregex = this.removeCapturingGroups(rule.regex);
                }
                if (!rule.splitRegex && typeof rule.token != "string")
                    splitterRurles.push(rule); // flag will be known only at the very end
            }

            mapping[matchTotal] = i;
            matchTotal += matchcount;

            ruleRegExps.push(adjustedregex);
            if (!rule.onMatch)
                rule.onMatch = null;
        }
        
        if (!ruleRegExps.length) {
            mapping[0] = 0;
            ruleRegExps.push("$");
        }
        
        splitterRurles.forEach(function(rule) {
            rule.splitRegex = this.createSplitterRegexp(rule.regex, flag);
        }, this);

        this.regExps[key] = new RegExp("(" + ruleRegExps.join(")|(") + ")|($)", flag);
    }
};

(function() {
    this.$setMaxTokenCount = function(m) {
        MAX_TOKEN_COUNT = m | 0;
    };
    
    this.$applyToken = function(str) {
        var values = this.splitRegex.exec(str).slice(1);
        var types = this.token.apply(this, values);
        if (typeof types === "string")
            return [{type: types, value: str}];

        var tokens = [];
        for (var i = 0, l = types.length; i < l; i++) {
            if (values[i])
                tokens[tokens.length] = {
                    type: types[i],
                    value: values[i]
                };
        }
        return tokens;
    },

    this.$arrayTokens = function(str) {
        if (!str)
            return [];
        var values = this.splitRegex.exec(str);
        if (!values)
            return "text";
        var tokens = [];
        var types = this.tokenArray;
        for (var i = 0, l = types.length; i < l; i++) {
            if (values[i + 1])
                tokens[tokens.length] = {
                    type: types[i],
                    value: values[i + 1]
                };
        }
        return tokens;
    };

    this.removeCapturingGroups = function(src) {
        var r = src.replace(
            /\[(?:\\.|[^\]])*?\]|\\.|\(\?[:=!]|(\()/g,
            function(x, y) {return y ? "(?:" : x;}
        );
        return r;
    };

    this.createSplitterRegexp = function(src, flag) {
        if (src.indexOf("(?=") != -1) {
            var stack = 0;
            var inChClass = false;
            var lastCapture = {};
            src.replace(/(\\.)|(\((?:\?[=!])?)|(\))|([\[\]])/g, function(
                m, esc, parenOpen, parenClose, square, index
            ) {
                if (inChClass) {
                    inChClass = square != "]";
                } else if (square) {
                    inChClass = true;
                } else if (parenClose) {
                    if (stack == lastCapture.stack) {
                        lastCapture.end = index+1;
                        lastCapture.stack = -1;
                    }
                    stack--;
                } else if (parenOpen) {
                    stack++;
                    if (parenOpen.length != 1) {
                        lastCapture.stack = stack
                        lastCapture.start = index;
                    }
                }
                return m;
            });

            if (lastCapture.end != null && /^\)*$/.test(src.substr(lastCapture.end)))
                src = src.substring(0, lastCapture.start) + src.substr(lastCapture.end);
        }
        return new RegExp(src, (flag||"").replace("g", ""));
    };
    this.getLineTokens = function(line, startState) {
        if (startState && typeof startState != "string") {
            var stack = startState.slice(0);
            startState = stack[0];
            if (startState === "#tmp") {
                stack.shift()
                startState = stack.shift()
            }
        } else
            var stack = [];

        var currentState = startState || "start";
        var state = this.states[currentState];
        if (!state) {
            currentState = "start";
            state = this.states[currentState];
        }
        var mapping = this.matchMappings[currentState];
        var re = this.regExps[currentState];
        re.lastIndex = 0;

        var match, tokens = [];
        var lastIndex = 0;
        var matchAttempts = 0;

        var token = {type: null, value: ""};

        while (match = re.exec(line)) {
            var type = mapping.defaultToken;
            var rule = null;
            var value = match[0];
            var index = re.lastIndex;

            if (index - value.length > lastIndex) {
                var skipped = line.substring(lastIndex, index - value.length);
                if (token.type == type) {
                    token.value += skipped;
                } else {
                    if (token.type)
                        tokens.push(token);
                    token = {type: type, value: skipped};
                }
            }

            for (var i = 0; i < match.length-2; i++) {
                if (match[i + 1] === undefined)
                    continue;

                rule = state[mapping[i]];

                if (rule.onMatch)
                    type = rule.onMatch(value, currentState, stack);
                else
                    type = rule.token;

                if (rule.next) {
                    if (typeof rule.next == "string") {
                        currentState = rule.next;
                    } else {
                        currentState = rule.next(currentState, stack);
                    }
                    
                    state = this.states[currentState];
                    if (!state) {
                        this.reportError("state doesn't exist", currentState);
                        currentState = "start";
                        state = this.states[currentState];
                    }
                    mapping = this.matchMappings[currentState];
                    lastIndex = index;
                    re = this.regExps[currentState];
                    re.lastIndex = index;
                }
                break;
            }

            if (value) {
                if (typeof type === "string") {
                    if ((!rule || rule.merge !== false) && token.type === type) {
                        token.value += value;
                    } else {
                        if (token.type)
                            tokens.push(token);
                        token = {type: type, value: value};
                    }
                } else if (type) {
                    if (token.type)
                        tokens.push(token);
                    token = {type: null, value: ""};
                    for (var i = 0; i < type.length; i++)
                        tokens.push(type[i]);
                }
            }

            if (lastIndex == line.length)
                break;

            lastIndex = index;

            if (matchAttempts++ > MAX_TOKEN_COUNT) {
                if (matchAttempts > 2 * line.length) {
                    this.reportError("infinite loop with in ace tokenizer", {
                        startState: startState,
                        line: line
                    });
                }
                while (lastIndex < line.length) {
                    if (token.type)
                        tokens.push(token);
                    token = {
                        value: line.substring(lastIndex, lastIndex += 2000),
                        type: "overflow"
                    };
                }
                currentState = "start";
                stack = [];
                break;
            }
        }

        if (token.type)
            tokens.push(token);
        
        if (stack.length > 1) {
            if (stack[0] !== currentState)
                stack.unshift("#tmp", currentState);
        }
        return {
            tokens : tokens,
            state : stack.length ? stack : currentState
        };
    };
    
    this.reportError = function(msg, data) {
        var e = new Error(msg);
        e.data = data;
        if (typeof console == "object" && console.error)
            console.error(e);
        setTimeout(function() { throw e; });
    };
}).call(Tokenizer.prototype);

exports.Tokenizer = Tokenizer;
});

ace.define("ace/mode/text_highlight_rules",["require","exports","module","ace/lib/lang"], function(require, exports, module) {
"use strict";

var lang = require("../lib/lang");

var TextHighlightRules = function() {

    this.$rules = {
        "start" : [{
            token : "empty_line",
            regex : '^$'
        }, {
            defaultToken : "text"
        }]
    };
};

(function() {

    this.addRules = function(rules, prefix) {
        if (!prefix) {
            for (var key in rules)
                this.$rules[key] = rules[key];
            return;
        }
        for (var key in rules) {
            var state = rules[key];
            for (var i = 0; i < state.length; i++) {
                var rule = state[i];
                if (rule.next || rule.onMatch) {
                    if (typeof rule.next != "string") {
                        if (rule.nextState && rule.nextState.indexOf(prefix) !== 0)
                            rule.nextState = prefix + rule.nextState;
                    } else {
                        if (rule.next.indexOf(prefix) !== 0)
                            rule.next = prefix + rule.next;
                    }
                }
            }
            this.$rules[prefix + key] = state;
        }
    };

    this.getRules = function() {
        return this.$rules;
    };

    this.embedRules = function (HighlightRules, prefix, escapeRules, states, append) {
        var embedRules = typeof HighlightRules == "function"
            ? new HighlightRules().getRules()
            : HighlightRules;
        if (states) {
            for (var i = 0; i < states.length; i++)
                states[i] = prefix + states[i];
        } else {
            states = [];
            for (var key in embedRules)
                states.push(prefix + key);
        }

        this.addRules(embedRules, prefix);

        if (escapeRules) {
            var addRules = Array.prototype[append ? "push" : "unshift"];
            for (var i = 0; i < states.length; i++)
                addRules.apply(this.$rules[states[i]], lang.deepCopy(escapeRules));
        }

        if (!this.$embeds)
            this.$embeds = [];
        this.$embeds.push(prefix);
    };

    this.getEmbeds = function() {
        return this.$embeds;
    };

    var pushState = function(currentState, stack) {
        if (currentState != "start" || stack.length)
            stack.unshift(this.nextState, currentState);
        return this.nextState;
    };
    var popState = function(currentState, stack) {
        stack.shift();
        return stack.shift() || "start";
    };

    this.normalizeRules = function() {
        var id = 0;
        var rules = this.$rules;
        function processState(key) {
            var state = rules[key];
            state.processed = true;
            for (var i = 0; i < state.length; i++) {
                var rule = state[i];
                if (!rule.regex && rule.start) {
                    rule.regex = rule.start;
                    if (!rule.next)
                        rule.next = [];
                    rule.next.push({
                        defaultToken: rule.token
                    }, {
                        token: rule.token + ".end",
                        regex: rule.end || rule.start,
                        next: "pop"
                    });
                    rule.token = rule.token + ".start";
                    rule.push = true;
                }
                var next = rule.next || rule.push;
                if (next && Array.isArray(next)) {
                    var stateName = rule.stateName;
                    if (!stateName)  {
                        stateName = rule.token;
                        if (typeof stateName != "string")
                            stateName = stateName[0] || "";
                        if (rules[stateName])
                            stateName += id++;
                    }
                    rules[stateName] = next;
                    rule.next = stateName;
                    processState(stateName);
                } else if (next == "pop") {
                    rule.next = popState;
                }

                if (rule.push) {
                    rule.nextState = rule.next || rule.push;
                    rule.next = pushState;
                    delete rule.push;
                }

                if (rule.rules) {
                    for (var r in rule.rules) {
                        if (rules[r]) {
                            if (rules[r].push)
                                rules[r].push.apply(rules[r], rule.rules[r]);
                        } else {
                            rules[r] = rule.rules[r];
                        }
                    }
                }
                if (rule.include || typeof rule == "string") {
                    var includeName = rule.include || rule;
                    var toInsert = rules[includeName];
                } else if (Array.isArray(rule))
                    toInsert = rule;

                if (toInsert) {
                    var args = [i, 1].concat(toInsert);
                    if (rule.noEscape)
                        args = args.filter(function(x) {return !x.next;});
                    state.splice.apply(state, args);
                    i--;
                    toInsert = null;
                }
                
                if (rule.keywordMap) {
                    rule.token = this.createKeywordMapper(
                        rule.keywordMap, rule.defaultToken || "text", rule.caseInsensitive
                    );
                    delete rule.defaultToken;
                }
            }
        }
        Object.keys(rules).forEach(processState, this);
    };

    this.createKeywordMapper = function(map, defaultToken, ignoreCase, splitChar) {
        var keywords = Object.create(null);
        Object.keys(map).forEach(function(className) {
            var a = map[className];
            if (ignoreCase)
                a = a.toLowerCase();
            var list = a.split(splitChar || "|");
            for (var i = list.length; i--; )
                keywords[list[i]] = className;
        });
        if (Object.getPrototypeOf(keywords)) {
            keywords.__proto__ = null;
        }
        this.$keywordList = Object.keys(keywords);
        map = null;
        return ignoreCase
            ? function(value) {return keywords[value.toLowerCase()] || defaultToken }
            : function(value) {return keywords[value] || defaultToken };
    };

    this.getKeywords = function() {
        return this.$keywords;
    };

}).call(TextHighlightRules.prototype);

exports.TextHighlightRules = TextHighlightRules;
});

ace.define("ace/mode/behaviour",["require","exports","module"], function(require, exports, module) {
"use strict";

var Behaviour = function() {
   this.$behaviours = {};
};

(function () {

    this.add = function (name, action, callback) {
        switch (undefined) {
          case this.$behaviours:
              this.$behaviours = {};
          case this.$behaviours[name]:
              this.$behaviours[name] = {};
        }
        this.$behaviours[name][action] = callback;
    }
    
    this.addBehaviours = function (behaviours) {
        for (var key in behaviours) {
            for (var action in behaviours[key]) {
                this.add(key, action, behaviours[key][action]);
            }
        }
    }
    
    this.remove = function (name) {
        if (this.$behaviours && this.$behaviours[name]) {
            delete this.$behaviours[name];
        }
    }
    
    this.inherit = function (mode, filter) {
        if (typeof mode === "function") {
            var behaviours = new mode().getBehaviours(filter);
        } else {
            var behaviours = mode.getBehaviours(filter);
        }
        this.addBehaviours(behaviours);
    }
    
    this.getBehaviours = function (filter) {
        if (!filter) {
            return this.$behaviours;
        } else {
            var ret = {}
            for (var i = 0; i < filter.length; i++) {
                if (this.$behaviours[filter[i]]) {
                    ret[filter[i]] = this.$behaviours[filter[i]];
                }
            }
            return ret;
        }
    }

}).call(Behaviour.prototype);

exports.Behaviour = Behaviour;
});

ace.define("ace/unicode",["require","exports","module"], function(require, exports, module) {
"use strict";
exports.packages = {};

addUnicodePackage({
    L:  "0041-005A0061-007A00AA00B500BA00C0-00D600D8-00F600F8-02C102C6-02D102E0-02E402EC02EE0370-037403760377037A-037D03860388-038A038C038E-03A103A3-03F503F7-0481048A-05250531-055605590561-058705D0-05EA05F0-05F20621-064A066E066F0671-06D306D506E506E606EE06EF06FA-06FC06FF07100712-072F074D-07A507B107CA-07EA07F407F507FA0800-0815081A082408280904-0939093D09500958-0961097109720979-097F0985-098C098F09900993-09A809AA-09B009B209B6-09B909BD09CE09DC09DD09DF-09E109F009F10A05-0A0A0A0F0A100A13-0A280A2A-0A300A320A330A350A360A380A390A59-0A5C0A5E0A72-0A740A85-0A8D0A8F-0A910A93-0AA80AAA-0AB00AB20AB30AB5-0AB90ABD0AD00AE00AE10B05-0B0C0B0F0B100B13-0B280B2A-0B300B320B330B35-0B390B3D0B5C0B5D0B5F-0B610B710B830B85-0B8A0B8E-0B900B92-0B950B990B9A0B9C0B9E0B9F0BA30BA40BA8-0BAA0BAE-0BB90BD00C05-0C0C0C0E-0C100C12-0C280C2A-0C330C35-0C390C3D0C580C590C600C610C85-0C8C0C8E-0C900C92-0CA80CAA-0CB30CB5-0CB90CBD0CDE0CE00CE10D05-0D0C0D0E-0D100D12-0D280D2A-0D390D3D0D600D610D7A-0D7F0D85-0D960D9A-0DB10DB3-0DBB0DBD0DC0-0DC60E01-0E300E320E330E40-0E460E810E820E840E870E880E8A0E8D0E94-0E970E99-0E9F0EA1-0EA30EA50EA70EAA0EAB0EAD-0EB00EB20EB30EBD0EC0-0EC40EC60EDC0EDD0F000F40-0F470F49-0F6C0F88-0F8B1000-102A103F1050-1055105A-105D106110651066106E-10701075-1081108E10A0-10C510D0-10FA10FC1100-1248124A-124D1250-12561258125A-125D1260-1288128A-128D1290-12B012B2-12B512B8-12BE12C012C2-12C512C8-12D612D8-13101312-13151318-135A1380-138F13A0-13F41401-166C166F-167F1681-169A16A0-16EA1700-170C170E-17111720-17311740-17511760-176C176E-17701780-17B317D717DC1820-18771880-18A818AA18B0-18F51900-191C1950-196D1970-19741980-19AB19C1-19C71A00-1A161A20-1A541AA71B05-1B331B45-1B4B1B83-1BA01BAE1BAF1C00-1C231C4D-1C4F1C5A-1C7D1CE9-1CEC1CEE-1CF11D00-1DBF1E00-1F151F18-1F1D1F20-1F451F48-1F4D1F50-1F571F591F5B1F5D1F5F-1F7D1F80-1FB41FB6-1FBC1FBE1FC2-1FC41FC6-1FCC1FD0-1FD31FD6-1FDB1FE0-1FEC1FF2-1FF41FF6-1FFC2071207F2090-209421022107210A-211321152119-211D212421262128212A-212D212F-2139213C-213F2145-2149214E218321842C00-2C2E2C30-2C5E2C60-2CE42CEB-2CEE2D00-2D252D30-2D652D6F2D80-2D962DA0-2DA62DA8-2DAE2DB0-2DB62DB8-2DBE2DC0-2DC62DC8-2DCE2DD0-2DD62DD8-2DDE2E2F300530063031-3035303B303C3041-3096309D-309F30A1-30FA30FC-30FF3105-312D3131-318E31A0-31B731F0-31FF3400-4DB54E00-9FCBA000-A48CA4D0-A4FDA500-A60CA610-A61FA62AA62BA640-A65FA662-A66EA67F-A697A6A0-A6E5A717-A71FA722-A788A78BA78CA7FB-A801A803-A805A807-A80AA80C-A822A840-A873A882-A8B3A8F2-A8F7A8FBA90A-A925A930-A946A960-A97CA984-A9B2A9CFAA00-AA28AA40-AA42AA44-AA4BAA60-AA76AA7AAA80-AAAFAAB1AAB5AAB6AAB9-AABDAAC0AAC2AADB-AADDABC0-ABE2AC00-D7A3D7B0-D7C6D7CB-D7FBF900-FA2DFA30-FA6DFA70-FAD9FB00-FB06FB13-FB17FB1DFB1F-FB28FB2A-FB36FB38-FB3CFB3EFB40FB41FB43FB44FB46-FBB1FBD3-FD3DFD50-FD8FFD92-FDC7FDF0-FDFBFE70-FE74FE76-FEFCFF21-FF3AFF41-FF5AFF66-FFBEFFC2-FFC7FFCA-FFCFFFD2-FFD7FFDA-FFDC",
    Ll: "0061-007A00AA00B500BA00DF-00F600F8-00FF01010103010501070109010B010D010F01110113011501170119011B011D011F01210123012501270129012B012D012F01310133013501370138013A013C013E014001420144014601480149014B014D014F01510153015501570159015B015D015F01610163016501670169016B016D016F0171017301750177017A017C017E-0180018301850188018C018D019201950199-019B019E01A101A301A501A801AA01AB01AD01B001B401B601B901BA01BD-01BF01C601C901CC01CE01D001D201D401D601D801DA01DC01DD01DF01E101E301E501E701E901EB01ED01EF01F001F301F501F901FB01FD01FF02010203020502070209020B020D020F02110213021502170219021B021D021F02210223022502270229022B022D022F02310233-0239023C023F0240024202470249024B024D024F-02930295-02AF037103730377037B-037D039003AC-03CE03D003D103D5-03D703D903DB03DD03DF03E103E303E503E703E903EB03ED03EF-03F303F503F803FB03FC0430-045F04610463046504670469046B046D046F04710473047504770479047B047D047F0481048B048D048F04910493049504970499049B049D049F04A104A304A504A704A904AB04AD04AF04B104B304B504B704B904BB04BD04BF04C204C404C604C804CA04CC04CE04CF04D104D304D504D704D904DB04DD04DF04E104E304E504E704E904EB04ED04EF04F104F304F504F704F904FB04FD04FF05010503050505070509050B050D050F05110513051505170519051B051D051F0521052305250561-05871D00-1D2B1D62-1D771D79-1D9A1E011E031E051E071E091E0B1E0D1E0F1E111E131E151E171E191E1B1E1D1E1F1E211E231E251E271E291E2B1E2D1E2F1E311E331E351E371E391E3B1E3D1E3F1E411E431E451E471E491E4B1E4D1E4F1E511E531E551E571E591E5B1E5D1E5F1E611E631E651E671E691E6B1E6D1E6F1E711E731E751E771E791E7B1E7D1E7F1E811E831E851E871E891E8B1E8D1E8F1E911E931E95-1E9D1E9F1EA11EA31EA51EA71EA91EAB1EAD1EAF1EB11EB31EB51EB71EB91EBB1EBD1EBF1EC11EC31EC51EC71EC91ECB1ECD1ECF1ED11ED31ED51ED71ED91EDB1EDD1EDF1EE11EE31EE51EE71EE91EEB1EED1EEF1EF11EF31EF51EF71EF91EFB1EFD1EFF-1F071F10-1F151F20-1F271F30-1F371F40-1F451F50-1F571F60-1F671F70-1F7D1F80-1F871F90-1F971FA0-1FA71FB0-1FB41FB61FB71FBE1FC2-1FC41FC61FC71FD0-1FD31FD61FD71FE0-1FE71FF2-1FF41FF61FF7210A210E210F2113212F21342139213C213D2146-2149214E21842C30-2C5E2C612C652C662C682C6A2C6C2C712C732C742C76-2C7C2C812C832C852C872C892C8B2C8D2C8F2C912C932C952C972C992C9B2C9D2C9F2CA12CA32CA52CA72CA92CAB2CAD2CAF2CB12CB32CB52CB72CB92CBB2CBD2CBF2CC12CC32CC52CC72CC92CCB2CCD2CCF2CD12CD32CD52CD72CD92CDB2CDD2CDF2CE12CE32CE42CEC2CEE2D00-2D25A641A643A645A647A649A64BA64DA64FA651A653A655A657A659A65BA65DA65FA663A665A667A669A66BA66DA681A683A685A687A689A68BA68DA68FA691A693A695A697A723A725A727A729A72BA72DA72F-A731A733A735A737A739A73BA73DA73FA741A743A745A747A749A74BA74DA74FA751A753A755A757A759A75BA75DA75FA761A763A765A767A769A76BA76DA76FA771-A778A77AA77CA77FA781A783A785A787A78CFB00-FB06FB13-FB17FF41-FF5A",
    Lu: "0041-005A00C0-00D600D8-00DE01000102010401060108010A010C010E01100112011401160118011A011C011E01200122012401260128012A012C012E01300132013401360139013B013D013F0141014301450147014A014C014E01500152015401560158015A015C015E01600162016401660168016A016C016E017001720174017601780179017B017D018101820184018601870189-018B018E-0191019301940196-0198019C019D019F01A001A201A401A601A701A901AC01AE01AF01B1-01B301B501B701B801BC01C401C701CA01CD01CF01D101D301D501D701D901DB01DE01E001E201E401E601E801EA01EC01EE01F101F401F6-01F801FA01FC01FE02000202020402060208020A020C020E02100212021402160218021A021C021E02200222022402260228022A022C022E02300232023A023B023D023E02410243-02460248024A024C024E03700372037603860388-038A038C038E038F0391-03A103A3-03AB03CF03D2-03D403D803DA03DC03DE03E003E203E403E603E803EA03EC03EE03F403F703F903FA03FD-042F04600462046404660468046A046C046E04700472047404760478047A047C047E0480048A048C048E04900492049404960498049A049C049E04A004A204A404A604A804AA04AC04AE04B004B204B404B604B804BA04BC04BE04C004C104C304C504C704C904CB04CD04D004D204D404D604D804DA04DC04DE04E004E204E404E604E804EA04EC04EE04F004F204F404F604F804FA04FC04FE05000502050405060508050A050C050E05100512051405160518051A051C051E0520052205240531-055610A0-10C51E001E021E041E061E081E0A1E0C1E0E1E101E121E141E161E181E1A1E1C1E1E1E201E221E241E261E281E2A1E2C1E2E1E301E321E341E361E381E3A1E3C1E3E1E401E421E441E461E481E4A1E4C1E4E1E501E521E541E561E581E5A1E5C1E5E1E601E621E641E661E681E6A1E6C1E6E1E701E721E741E761E781E7A1E7C1E7E1E801E821E841E861E881E8A1E8C1E8E1E901E921E941E9E1EA01EA21EA41EA61EA81EAA1EAC1EAE1EB01EB21EB41EB61EB81EBA1EBC1EBE1EC01EC21EC41EC61EC81ECA1ECC1ECE1ED01ED21ED41ED61ED81EDA1EDC1EDE1EE01EE21EE41EE61EE81EEA1EEC1EEE1EF01EF21EF41EF61EF81EFA1EFC1EFE1F08-1F0F1F18-1F1D1F28-1F2F1F38-1F3F1F48-1F4D1F591F5B1F5D1F5F1F68-1F6F1FB8-1FBB1FC8-1FCB1FD8-1FDB1FE8-1FEC1FF8-1FFB21022107210B-210D2110-211221152119-211D212421262128212A-212D2130-2133213E213F214521832C00-2C2E2C602C62-2C642C672C692C6B2C6D-2C702C722C752C7E-2C802C822C842C862C882C8A2C8C2C8E2C902C922C942C962C982C9A2C9C2C9E2CA02CA22CA42CA62CA82CAA2CAC2CAE2CB02CB22CB42CB62CB82CBA2CBC2CBE2CC02CC22CC42CC62CC82CCA2CCC2CCE2CD02CD22CD42CD62CD82CDA2CDC2CDE2CE02CE22CEB2CEDA640A642A644A646A648A64AA64CA64EA650A652A654A656A658A65AA65CA65EA662A664A666A668A66AA66CA680A682A684A686A688A68AA68CA68EA690A692A694A696A722A724A726A728A72AA72CA72EA732A734A736A738A73AA73CA73EA740A742A744A746A748A74AA74CA74EA750A752A754A756A758A75AA75CA75EA760A762A764A766A768A76AA76CA76EA779A77BA77DA77EA780A782A784A786A78BFF21-FF3A",
    Lt: "01C501C801CB01F21F88-1F8F1F98-1F9F1FA8-1FAF1FBC1FCC1FFC",
    Lm: "02B0-02C102C6-02D102E0-02E402EC02EE0374037A0559064006E506E607F407F507FA081A0824082809710E460EC610FC17D718431AA71C78-1C7D1D2C-1D611D781D9B-1DBF2071207F2090-20942C7D2D6F2E2F30053031-3035303B309D309E30FC-30FEA015A4F8-A4FDA60CA67FA717-A71FA770A788A9CFAA70AADDFF70FF9EFF9F",
    Lo: "01BB01C0-01C3029405D0-05EA05F0-05F20621-063F0641-064A066E066F0671-06D306D506EE06EF06FA-06FC06FF07100712-072F074D-07A507B107CA-07EA0800-08150904-0939093D09500958-096109720979-097F0985-098C098F09900993-09A809AA-09B009B209B6-09B909BD09CE09DC09DD09DF-09E109F009F10A05-0A0A0A0F0A100A13-0A280A2A-0A300A320A330A350A360A380A390A59-0A5C0A5E0A72-0A740A85-0A8D0A8F-0A910A93-0AA80AAA-0AB00AB20AB30AB5-0AB90ABD0AD00AE00AE10B05-0B0C0B0F0B100B13-0B280B2A-0B300B320B330B35-0B390B3D0B5C0B5D0B5F-0B610B710B830B85-0B8A0B8E-0B900B92-0B950B990B9A0B9C0B9E0B9F0BA30BA40BA8-0BAA0BAE-0BB90BD00C05-0C0C0C0E-0C100C12-0C280C2A-0C330C35-0C390C3D0C580C590C600C610C85-0C8C0C8E-0C900C92-0CA80CAA-0CB30CB5-0CB90CBD0CDE0CE00CE10D05-0D0C0D0E-0D100D12-0D280D2A-0D390D3D0D600D610D7A-0D7F0D85-0D960D9A-0DB10DB3-0DBB0DBD0DC0-0DC60E01-0E300E320E330E40-0E450E810E820E840E870E880E8A0E8D0E94-0E970E99-0E9F0EA1-0EA30EA50EA70EAA0EAB0EAD-0EB00EB20EB30EBD0EC0-0EC40EDC0EDD0F000F40-0F470F49-0F6C0F88-0F8B1000-102A103F1050-1055105A-105D106110651066106E-10701075-1081108E10D0-10FA1100-1248124A-124D1250-12561258125A-125D1260-1288128A-128D1290-12B012B2-12B512B8-12BE12C012C2-12C512C8-12D612D8-13101312-13151318-135A1380-138F13A0-13F41401-166C166F-167F1681-169A16A0-16EA1700-170C170E-17111720-17311740-17511760-176C176E-17701780-17B317DC1820-18421844-18771880-18A818AA18B0-18F51900-191C1950-196D1970-19741980-19AB19C1-19C71A00-1A161A20-1A541B05-1B331B45-1B4B1B83-1BA01BAE1BAF1C00-1C231C4D-1C4F1C5A-1C771CE9-1CEC1CEE-1CF12135-21382D30-2D652D80-2D962DA0-2DA62DA8-2DAE2DB0-2DB62DB8-2DBE2DC0-2DC62DC8-2DCE2DD0-2DD62DD8-2DDE3006303C3041-3096309F30A1-30FA30FF3105-312D3131-318E31A0-31B731F0-31FF3400-4DB54E00-9FCBA000-A014A016-A48CA4D0-A4F7A500-A60BA610-A61FA62AA62BA66EA6A0-A6E5A7FB-A801A803-A805A807-A80AA80C-A822A840-A873A882-A8B3A8F2-A8F7A8FBA90A-A925A930-A946A960-A97CA984-A9B2AA00-AA28AA40-AA42AA44-AA4BAA60-AA6FAA71-AA76AA7AAA80-AAAFAAB1AAB5AAB6AAB9-AABDAAC0AAC2AADBAADCABC0-ABE2AC00-D7A3D7B0-D7C6D7CB-D7FBF900-FA2DFA30-FA6DFA70-FAD9FB1DFB1F-FB28FB2A-FB36FB38-FB3CFB3EFB40FB41FB43FB44FB46-FBB1FBD3-FD3DFD50-FD8FFD92-FDC7FDF0-FDFBFE70-FE74FE76-FEFCFF66-FF6FFF71-FF9DFFA0-FFBEFFC2-FFC7FFCA-FFCFFFD2-FFD7FFDA-FFDC",
    M:  "0300-036F0483-04890591-05BD05BF05C105C205C405C505C70610-061A064B-065E067006D6-06DC06DE-06E406E706E806EA-06ED07110730-074A07A6-07B007EB-07F30816-0819081B-08230825-08270829-082D0900-0903093C093E-094E0951-0955096209630981-098309BC09BE-09C409C709C809CB-09CD09D709E209E30A01-0A030A3C0A3E-0A420A470A480A4B-0A4D0A510A700A710A750A81-0A830ABC0ABE-0AC50AC7-0AC90ACB-0ACD0AE20AE30B01-0B030B3C0B3E-0B440B470B480B4B-0B4D0B560B570B620B630B820BBE-0BC20BC6-0BC80BCA-0BCD0BD70C01-0C030C3E-0C440C46-0C480C4A-0C4D0C550C560C620C630C820C830CBC0CBE-0CC40CC6-0CC80CCA-0CCD0CD50CD60CE20CE30D020D030D3E-0D440D46-0D480D4A-0D4D0D570D620D630D820D830DCA0DCF-0DD40DD60DD8-0DDF0DF20DF30E310E34-0E3A0E47-0E4E0EB10EB4-0EB90EBB0EBC0EC8-0ECD0F180F190F350F370F390F3E0F3F0F71-0F840F860F870F90-0F970F99-0FBC0FC6102B-103E1056-1059105E-10601062-10641067-106D1071-10741082-108D108F109A-109D135F1712-17141732-1734175217531772177317B6-17D317DD180B-180D18A91920-192B1930-193B19B0-19C019C819C91A17-1A1B1A55-1A5E1A60-1A7C1A7F1B00-1B041B34-1B441B6B-1B731B80-1B821BA1-1BAA1C24-1C371CD0-1CD21CD4-1CE81CED1CF21DC0-1DE61DFD-1DFF20D0-20F02CEF-2CF12DE0-2DFF302A-302F3099309AA66F-A672A67CA67DA6F0A6F1A802A806A80BA823-A827A880A881A8B4-A8C4A8E0-A8F1A926-A92DA947-A953A980-A983A9B3-A9C0AA29-AA36AA43AA4CAA4DAA7BAAB0AAB2-AAB4AAB7AAB8AABEAABFAAC1ABE3-ABEAABECABEDFB1EFE00-FE0FFE20-FE26",
    Mn: "0300-036F0483-04870591-05BD05BF05C105C205C405C505C70610-061A064B-065E067006D6-06DC06DF-06E406E706E806EA-06ED07110730-074A07A6-07B007EB-07F30816-0819081B-08230825-08270829-082D0900-0902093C0941-0948094D0951-095509620963098109BC09C1-09C409CD09E209E30A010A020A3C0A410A420A470A480A4B-0A4D0A510A700A710A750A810A820ABC0AC1-0AC50AC70AC80ACD0AE20AE30B010B3C0B3F0B41-0B440B4D0B560B620B630B820BC00BCD0C3E-0C400C46-0C480C4A-0C4D0C550C560C620C630CBC0CBF0CC60CCC0CCD0CE20CE30D41-0D440D4D0D620D630DCA0DD2-0DD40DD60E310E34-0E3A0E47-0E4E0EB10EB4-0EB90EBB0EBC0EC8-0ECD0F180F190F350F370F390F71-0F7E0F80-0F840F860F870F90-0F970F99-0FBC0FC6102D-10301032-10371039103A103D103E10581059105E-10601071-1074108210851086108D109D135F1712-17141732-1734175217531772177317B7-17BD17C617C9-17D317DD180B-180D18A91920-19221927192819321939-193B1A171A181A561A58-1A5E1A601A621A65-1A6C1A73-1A7C1A7F1B00-1B031B341B36-1B3A1B3C1B421B6B-1B731B801B811BA2-1BA51BA81BA91C2C-1C331C361C371CD0-1CD21CD4-1CE01CE2-1CE81CED1DC0-1DE61DFD-1DFF20D0-20DC20E120E5-20F02CEF-2CF12DE0-2DFF302A-302F3099309AA66FA67CA67DA6F0A6F1A802A806A80BA825A826A8C4A8E0-A8F1A926-A92DA947-A951A980-A982A9B3A9B6-A9B9A9BCAA29-AA2EAA31AA32AA35AA36AA43AA4CAAB0AAB2-AAB4AAB7AAB8AABEAABFAAC1ABE5ABE8ABEDFB1EFE00-FE0FFE20-FE26",
    Mc: "0903093E-09400949-094C094E0982098309BE-09C009C709C809CB09CC09D70A030A3E-0A400A830ABE-0AC00AC90ACB0ACC0B020B030B3E0B400B470B480B4B0B4C0B570BBE0BBF0BC10BC20BC6-0BC80BCA-0BCC0BD70C01-0C030C41-0C440C820C830CBE0CC0-0CC40CC70CC80CCA0CCB0CD50CD60D020D030D3E-0D400D46-0D480D4A-0D4C0D570D820D830DCF-0DD10DD8-0DDF0DF20DF30F3E0F3F0F7F102B102C10311038103B103C105610571062-10641067-106D108310841087-108C108F109A-109C17B617BE-17C517C717C81923-19261929-192B193019311933-193819B0-19C019C819C91A19-1A1B1A551A571A611A631A641A6D-1A721B041B351B3B1B3D-1B411B431B441B821BA11BA61BA71BAA1C24-1C2B1C341C351CE11CF2A823A824A827A880A881A8B4-A8C3A952A953A983A9B4A9B5A9BAA9BBA9BD-A9C0AA2FAA30AA33AA34AA4DAA7BABE3ABE4ABE6ABE7ABE9ABEAABEC",
    Me: "0488048906DE20DD-20E020E2-20E4A670-A672",
    N:  "0030-003900B200B300B900BC-00BE0660-066906F0-06F907C0-07C90966-096F09E6-09EF09F4-09F90A66-0A6F0AE6-0AEF0B66-0B6F0BE6-0BF20C66-0C6F0C78-0C7E0CE6-0CEF0D66-0D750E50-0E590ED0-0ED90F20-0F331040-10491090-10991369-137C16EE-16F017E0-17E917F0-17F91810-18191946-194F19D0-19DA1A80-1A891A90-1A991B50-1B591BB0-1BB91C40-1C491C50-1C5920702074-20792080-20892150-21822185-21892460-249B24EA-24FF2776-27932CFD30073021-30293038-303A3192-31953220-32293251-325F3280-328932B1-32BFA620-A629A6E6-A6EFA830-A835A8D0-A8D9A900-A909A9D0-A9D9AA50-AA59ABF0-ABF9FF10-FF19",
    Nd: "0030-00390660-066906F0-06F907C0-07C90966-096F09E6-09EF0A66-0A6F0AE6-0AEF0B66-0B6F0BE6-0BEF0C66-0C6F0CE6-0CEF0D66-0D6F0E50-0E590ED0-0ED90F20-0F291040-10491090-109917E0-17E91810-18191946-194F19D0-19DA1A80-1A891A90-1A991B50-1B591BB0-1BB91C40-1C491C50-1C59A620-A629A8D0-A8D9A900-A909A9D0-A9D9AA50-AA59ABF0-ABF9FF10-FF19",
    Nl: "16EE-16F02160-21822185-218830073021-30293038-303AA6E6-A6EF",
    No: "00B200B300B900BC-00BE09F4-09F90BF0-0BF20C78-0C7E0D70-0D750F2A-0F331369-137C17F0-17F920702074-20792080-20892150-215F21892460-249B24EA-24FF2776-27932CFD3192-31953220-32293251-325F3280-328932B1-32BFA830-A835",
    P:  "0021-00230025-002A002C-002F003A003B003F0040005B-005D005F007B007D00A100AB00B700BB00BF037E0387055A-055F0589058A05BE05C005C305C605F305F40609060A060C060D061B061E061F066A-066D06D40700-070D07F7-07F90830-083E0964096509700DF40E4F0E5A0E5B0F04-0F120F3A-0F3D0F850FD0-0FD4104A-104F10FB1361-13681400166D166E169B169C16EB-16ED1735173617D4-17D617D8-17DA1800-180A1944194519DE19DF1A1E1A1F1AA0-1AA61AA8-1AAD1B5A-1B601C3B-1C3F1C7E1C7F1CD32010-20272030-20432045-20512053-205E207D207E208D208E2329232A2768-277527C527C627E6-27EF2983-299829D8-29DB29FC29FD2CF9-2CFC2CFE2CFF2E00-2E2E2E302E313001-30033008-30113014-301F3030303D30A030FBA4FEA4FFA60D-A60FA673A67EA6F2-A6F7A874-A877A8CEA8CFA8F8-A8FAA92EA92FA95FA9C1-A9CDA9DEA9DFAA5C-AA5FAADEAADFABEBFD3EFD3FFE10-FE19FE30-FE52FE54-FE61FE63FE68FE6AFE6BFF01-FF03FF05-FF0AFF0C-FF0FFF1AFF1BFF1FFF20FF3B-FF3DFF3FFF5BFF5DFF5F-FF65",
    Pd: "002D058A05BE140018062010-20152E172E1A301C303030A0FE31FE32FE58FE63FF0D",
    Ps: "0028005B007B0F3A0F3C169B201A201E2045207D208D23292768276A276C276E27702772277427C527E627E827EA27EC27EE2983298529872989298B298D298F299129932995299729D829DA29FC2E222E242E262E283008300A300C300E3010301430163018301A301DFD3EFE17FE35FE37FE39FE3BFE3DFE3FFE41FE43FE47FE59FE5BFE5DFF08FF3BFF5BFF5FFF62",
    Pe: "0029005D007D0F3B0F3D169C2046207E208E232A2769276B276D276F27712773277527C627E727E927EB27ED27EF298429862988298A298C298E2990299229942996299829D929DB29FD2E232E252E272E293009300B300D300F3011301530173019301B301E301FFD3FFE18FE36FE38FE3AFE3CFE3EFE40FE42FE44FE48FE5AFE5CFE5EFF09FF3DFF5DFF60FF63",
    Pi: "00AB2018201B201C201F20392E022E042E092E0C2E1C2E20",
    Pf: "00BB2019201D203A2E032E052E0A2E0D2E1D2E21",
    Pc: "005F203F20402054FE33FE34FE4D-FE4FFF3F",
    Po: "0021-00230025-0027002A002C002E002F003A003B003F0040005C00A100B700BF037E0387055A-055F058905C005C305C605F305F40609060A060C060D061B061E061F066A-066D06D40700-070D07F7-07F90830-083E0964096509700DF40E4F0E5A0E5B0F04-0F120F850FD0-0FD4104A-104F10FB1361-1368166D166E16EB-16ED1735173617D4-17D617D8-17DA1800-18051807-180A1944194519DE19DF1A1E1A1F1AA0-1AA61AA8-1AAD1B5A-1B601C3B-1C3F1C7E1C7F1CD3201620172020-20272030-2038203B-203E2041-20432047-205120532055-205E2CF9-2CFC2CFE2CFF2E002E012E06-2E082E0B2E0E-2E162E182E192E1B2E1E2E1F2E2A-2E2E2E302E313001-3003303D30FBA4FEA4FFA60D-A60FA673A67EA6F2-A6F7A874-A877A8CEA8CFA8F8-A8FAA92EA92FA95FA9C1-A9CDA9DEA9DFAA5C-AA5FAADEAADFABEBFE10-FE16FE19FE30FE45FE46FE49-FE4CFE50-FE52FE54-FE57FE5F-FE61FE68FE6AFE6BFF01-FF03FF05-FF07FF0AFF0CFF0EFF0FFF1AFF1BFF1FFF20FF3CFF61FF64FF65",
    S:  "0024002B003C-003E005E0060007C007E00A2-00A900AC00AE-00B100B400B600B800D700F702C2-02C502D2-02DF02E5-02EB02ED02EF-02FF03750384038503F604820606-0608060B060E060F06E906FD06FE07F609F209F309FA09FB0AF10B700BF3-0BFA0C7F0CF10CF20D790E3F0F01-0F030F13-0F170F1A-0F1F0F340F360F380FBE-0FC50FC7-0FCC0FCE0FCF0FD5-0FD8109E109F13601390-139917DB194019E0-19FF1B61-1B6A1B74-1B7C1FBD1FBF-1FC11FCD-1FCF1FDD-1FDF1FED-1FEF1FFD1FFE20442052207A-207C208A-208C20A0-20B8210021012103-21062108210921142116-2118211E-2123212521272129212E213A213B2140-2144214A-214D214F2190-2328232B-23E82400-24262440-244A249C-24E92500-26CD26CF-26E126E326E8-26FF2701-27042706-2709270C-27272729-274B274D274F-27522756-275E2761-276727942798-27AF27B1-27BE27C0-27C427C7-27CA27CC27D0-27E527F0-29822999-29D729DC-29FB29FE-2B4C2B50-2B592CE5-2CEA2E80-2E992E9B-2EF32F00-2FD52FF0-2FFB300430123013302030363037303E303F309B309C319031913196-319F31C0-31E33200-321E322A-32503260-327F328A-32B032C0-32FE3300-33FF4DC0-4DFFA490-A4C6A700-A716A720A721A789A78AA828-A82BA836-A839AA77-AA79FB29FDFCFDFDFE62FE64-FE66FE69FF04FF0BFF1C-FF1EFF3EFF40FF5CFF5EFFE0-FFE6FFE8-FFEEFFFCFFFD",
    Sm: "002B003C-003E007C007E00AC00B100D700F703F60606-060820442052207A-207C208A-208C2140-2144214B2190-2194219A219B21A021A321A621AE21CE21CF21D221D421F4-22FF2308-230B23202321237C239B-23B323DC-23E125B725C125F8-25FF266F27C0-27C427C7-27CA27CC27D0-27E527F0-27FF2900-29822999-29D729DC-29FB29FE-2AFF2B30-2B442B47-2B4CFB29FE62FE64-FE66FF0BFF1C-FF1EFF5CFF5EFFE2FFE9-FFEC",
    Sc: "002400A2-00A5060B09F209F309FB0AF10BF90E3F17DB20A0-20B8A838FDFCFE69FF04FFE0FFE1FFE5FFE6",
    Sk: "005E006000A800AF00B400B802C2-02C502D2-02DF02E5-02EB02ED02EF-02FF0375038403851FBD1FBF-1FC11FCD-1FCF1FDD-1FDF1FED-1FEF1FFD1FFE309B309CA700-A716A720A721A789A78AFF3EFF40FFE3",
    So: "00A600A700A900AE00B000B60482060E060F06E906FD06FE07F609FA0B700BF3-0BF80BFA0C7F0CF10CF20D790F01-0F030F13-0F170F1A-0F1F0F340F360F380FBE-0FC50FC7-0FCC0FCE0FCF0FD5-0FD8109E109F13601390-1399194019E0-19FF1B61-1B6A1B74-1B7C210021012103-21062108210921142116-2118211E-2123212521272129212E213A213B214A214C214D214F2195-2199219C-219F21A121A221A421A521A7-21AD21AF-21CD21D021D121D321D5-21F32300-2307230C-231F2322-2328232B-237B237D-239A23B4-23DB23E2-23E82400-24262440-244A249C-24E92500-25B625B8-25C025C2-25F72600-266E2670-26CD26CF-26E126E326E8-26FF2701-27042706-2709270C-27272729-274B274D274F-27522756-275E2761-276727942798-27AF27B1-27BE2800-28FF2B00-2B2F2B452B462B50-2B592CE5-2CEA2E80-2E992E9B-2EF32F00-2FD52FF0-2FFB300430123013302030363037303E303F319031913196-319F31C0-31E33200-321E322A-32503260-327F328A-32B032C0-32FE3300-33FF4DC0-4DFFA490-A4C6A828-A82BA836A837A839AA77-AA79FDFDFFE4FFE8FFEDFFEEFFFCFFFD",
    Z:  "002000A01680180E2000-200A20282029202F205F3000",
    Zs: "002000A01680180E2000-200A202F205F3000",
    Zl: "2028",
    Zp: "2029",
    C:  "0000-001F007F-009F00AD03780379037F-0383038B038D03A20526-05300557055805600588058B-059005C8-05CF05EB-05EF05F5-0605061C061D0620065F06DD070E070F074B074C07B2-07BF07FB-07FF082E082F083F-08FF093A093B094F095609570973-097809800984098D098E0991099209A909B109B3-09B509BA09BB09C509C609C909CA09CF-09D609D8-09DB09DE09E409E509FC-0A000A040A0B-0A0E0A110A120A290A310A340A370A3A0A3B0A3D0A43-0A460A490A4A0A4E-0A500A52-0A580A5D0A5F-0A650A76-0A800A840A8E0A920AA90AB10AB40ABA0ABB0AC60ACA0ACE0ACF0AD1-0ADF0AE40AE50AF00AF2-0B000B040B0D0B0E0B110B120B290B310B340B3A0B3B0B450B460B490B4A0B4E-0B550B58-0B5B0B5E0B640B650B72-0B810B840B8B-0B8D0B910B96-0B980B9B0B9D0BA0-0BA20BA5-0BA70BAB-0BAD0BBA-0BBD0BC3-0BC50BC90BCE0BCF0BD1-0BD60BD8-0BE50BFB-0C000C040C0D0C110C290C340C3A-0C3C0C450C490C4E-0C540C570C5A-0C5F0C640C650C70-0C770C800C810C840C8D0C910CA90CB40CBA0CBB0CC50CC90CCE-0CD40CD7-0CDD0CDF0CE40CE50CF00CF3-0D010D040D0D0D110D290D3A-0D3C0D450D490D4E-0D560D58-0D5F0D640D650D76-0D780D800D810D840D97-0D990DB20DBC0DBE0DBF0DC7-0DC90DCB-0DCE0DD50DD70DE0-0DF10DF5-0E000E3B-0E3E0E5C-0E800E830E850E860E890E8B0E8C0E8E-0E930E980EA00EA40EA60EA80EA90EAC0EBA0EBE0EBF0EC50EC70ECE0ECF0EDA0EDB0EDE-0EFF0F480F6D-0F700F8C-0F8F0F980FBD0FCD0FD9-0FFF10C6-10CF10FD-10FF1249124E124F12571259125E125F1289128E128F12B112B612B712BF12C112C612C712D7131113161317135B-135E137D-137F139A-139F13F5-13FF169D-169F16F1-16FF170D1715-171F1737-173F1754-175F176D17711774-177F17B417B517DE17DF17EA-17EF17FA-17FF180F181A-181F1878-187F18AB-18AF18F6-18FF191D-191F192C-192F193C-193F1941-1943196E196F1975-197F19AC-19AF19CA-19CF19DB-19DD1A1C1A1D1A5F1A7D1A7E1A8A-1A8F1A9A-1A9F1AAE-1AFF1B4C-1B4F1B7D-1B7F1BAB-1BAD1BBA-1BFF1C38-1C3A1C4A-1C4C1C80-1CCF1CF3-1CFF1DE7-1DFC1F161F171F1E1F1F1F461F471F4E1F4F1F581F5A1F5C1F5E1F7E1F7F1FB51FC51FD41FD51FDC1FF01FF11FF51FFF200B-200F202A-202E2060-206F20722073208F2095-209F20B9-20CF20F1-20FF218A-218F23E9-23FF2427-243F244B-245F26CE26E226E4-26E727002705270A270B2728274C274E2753-2755275F27602795-279727B027BF27CB27CD-27CF2B4D-2B4F2B5A-2BFF2C2F2C5F2CF2-2CF82D26-2D2F2D66-2D6E2D70-2D7F2D97-2D9F2DA72DAF2DB72DBF2DC72DCF2DD72DDF2E32-2E7F2E9A2EF4-2EFF2FD6-2FEF2FFC-2FFF3040309730983100-3104312E-3130318F31B8-31BF31E4-31EF321F32FF4DB6-4DBF9FCC-9FFFA48D-A48FA4C7-A4CFA62C-A63FA660A661A674-A67BA698-A69FA6F8-A6FFA78D-A7FAA82C-A82FA83A-A83FA878-A87FA8C5-A8CDA8DA-A8DFA8FC-A8FFA954-A95EA97D-A97FA9CEA9DA-A9DDA9E0-A9FFAA37-AA3FAA4EAA4FAA5AAA5BAA7C-AA7FAAC3-AADAAAE0-ABBFABEEABEFABFA-ABFFD7A4-D7AFD7C7-D7CAD7FC-F8FFFA2EFA2FFA6EFA6FFADA-FAFFFB07-FB12FB18-FB1CFB37FB3DFB3FFB42FB45FBB2-FBD2FD40-FD4FFD90FD91FDC8-FDEFFDFEFDFFFE1A-FE1FFE27-FE2FFE53FE67FE6C-FE6FFE75FEFD-FF00FFBF-FFC1FFC8FFC9FFD0FFD1FFD8FFD9FFDD-FFDFFFE7FFEF-FFFBFFFEFFFF",
    Cc: "0000-001F007F-009F",
    Cf: "00AD0600-060306DD070F17B417B5200B-200F202A-202E2060-2064206A-206FFEFFFFF9-FFFB",
    Co: "E000-F8FF",
    Cs: "D800-DFFF",
    Cn: "03780379037F-0383038B038D03A20526-05300557055805600588058B-059005C8-05CF05EB-05EF05F5-05FF06040605061C061D0620065F070E074B074C07B2-07BF07FB-07FF082E082F083F-08FF093A093B094F095609570973-097809800984098D098E0991099209A909B109B3-09B509BA09BB09C509C609C909CA09CF-09D609D8-09DB09DE09E409E509FC-0A000A040A0B-0A0E0A110A120A290A310A340A370A3A0A3B0A3D0A43-0A460A490A4A0A4E-0A500A52-0A580A5D0A5F-0A650A76-0A800A840A8E0A920AA90AB10AB40ABA0ABB0AC60ACA0ACE0ACF0AD1-0ADF0AE40AE50AF00AF2-0B000B040B0D0B0E0B110B120B290B310B340B3A0B3B0B450B460B490B4A0B4E-0B550B58-0B5B0B5E0B640B650B72-0B810B840B8B-0B8D0B910B96-0B980B9B0B9D0BA0-0BA20BA5-0BA70BAB-0BAD0BBA-0BBD0BC3-0BC50BC90BCE0BCF0BD1-0BD60BD8-0BE50BFB-0C000C040C0D0C110C290C340C3A-0C3C0C450C490C4E-0C540C570C5A-0C5F0C640C650C70-0C770C800C810C840C8D0C910CA90CB40CBA0CBB0CC50CC90CCE-0CD40CD7-0CDD0CDF0CE40CE50CF00CF3-0D010D040D0D0D110D290D3A-0D3C0D450D490D4E-0D560D58-0D5F0D640D650D76-0D780D800D810D840D97-0D990DB20DBC0DBE0DBF0DC7-0DC90DCB-0DCE0DD50DD70DE0-0DF10DF5-0E000E3B-0E3E0E5C-0E800E830E850E860E890E8B0E8C0E8E-0E930E980EA00EA40EA60EA80EA90EAC0EBA0EBE0EBF0EC50EC70ECE0ECF0EDA0EDB0EDE-0EFF0F480F6D-0F700F8C-0F8F0F980FBD0FCD0FD9-0FFF10C6-10CF10FD-10FF1249124E124F12571259125E125F1289128E128F12B112B612B712BF12C112C612C712D7131113161317135B-135E137D-137F139A-139F13F5-13FF169D-169F16F1-16FF170D1715-171F1737-173F1754-175F176D17711774-177F17DE17DF17EA-17EF17FA-17FF180F181A-181F1878-187F18AB-18AF18F6-18FF191D-191F192C-192F193C-193F1941-1943196E196F1975-197F19AC-19AF19CA-19CF19DB-19DD1A1C1A1D1A5F1A7D1A7E1A8A-1A8F1A9A-1A9F1AAE-1AFF1B4C-1B4F1B7D-1B7F1BAB-1BAD1BBA-1BFF1C38-1C3A1C4A-1C4C1C80-1CCF1CF3-1CFF1DE7-1DFC1F161F171F1E1F1F1F461F471F4E1F4F1F581F5A1F5C1F5E1F7E1F7F1FB51FC51FD41FD51FDC1FF01FF11FF51FFF2065-206920722073208F2095-209F20B9-20CF20F1-20FF218A-218F23E9-23FF2427-243F244B-245F26CE26E226E4-26E727002705270A270B2728274C274E2753-2755275F27602795-279727B027BF27CB27CD-27CF2B4D-2B4F2B5A-2BFF2C2F2C5F2CF2-2CF82D26-2D2F2D66-2D6E2D70-2D7F2D97-2D9F2DA72DAF2DB72DBF2DC72DCF2DD72DDF2E32-2E7F2E9A2EF4-2EFF2FD6-2FEF2FFC-2FFF3040309730983100-3104312E-3130318F31B8-31BF31E4-31EF321F32FF4DB6-4DBF9FCC-9FFFA48D-A48FA4C7-A4CFA62C-A63FA660A661A674-A67BA698-A69FA6F8-A6FFA78D-A7FAA82C-A82FA83A-A83FA878-A87FA8C5-A8CDA8DA-A8DFA8FC-A8FFA954-A95EA97D-A97FA9CEA9DA-A9DDA9E0-A9FFAA37-AA3FAA4EAA4FAA5AAA5BAA7C-AA7FAAC3-AADAAAE0-ABBFABEEABEFABFA-ABFFD7A4-D7AFD7C7-D7CAD7FC-D7FFFA2EFA2FFA6EFA6FFADA-FAFFFB07-FB12FB18-FB1CFB37FB3DFB3FFB42FB45FBB2-FBD2FD40-FD4FFD90FD91FDC8-FDEFFDFEFDFFFE1A-FE1FFE27-FE2FFE53FE67FE6C-FE6FFE75FEFDFEFEFF00FFBF-FFC1FFC8FFC9FFD0FFD1FFD8FFD9FFDD-FFDFFFE7FFEF-FFF8FFFEFFFF"
});

function addUnicodePackage (pack) {
    var codePoint = /\w{4}/g;
    for (var name in pack)
        exports.packages[name] = pack[name].replace(codePoint, "\\u$&");
};

});

ace.define("ace/token_iterator",["require","exports","module"], function(require, exports, module) {
"use strict";
var TokenIterator = function(session, initialRow, initialColumn) {
    this.$session = session;
    this.$row = initialRow;
    this.$rowTokens = session.getTokens(initialRow);

    var token = session.getTokenAt(initialRow, initialColumn);
    this.$tokenIndex = token ? token.index : -1;
};

(function() { 
    this.stepBackward = function() {
        this.$tokenIndex -= 1;
        
        while (this.$tokenIndex < 0) {
            this.$row -= 1;
            if (this.$row < 0) {
                this.$row = 0;
                return null;
            }
                
            this.$rowTokens = this.$session.getTokens(this.$row);
            this.$tokenIndex = this.$rowTokens.length - 1;
        }
            
        return this.$rowTokens[this.$tokenIndex];
    };   
    this.stepForward = function() {
        this.$tokenIndex += 1;
        var rowCount;
        while (this.$tokenIndex >= this.$rowTokens.length) {
            this.$row += 1;
            if (!rowCount)
                rowCount = this.$session.getLength();
            if (this.$row >= rowCount) {
                this.$row = rowCount - 1;
                return null;
            }

            this.$rowTokens = this.$session.getTokens(this.$row);
            this.$tokenIndex = 0;
        }
            
        return this.$rowTokens[this.$tokenIndex];
    };      
    this.getCurrentToken = function () {
        return this.$rowTokens[this.$tokenIndex];
    };      
    this.getCurrentTokenRow = function () {
        return this.$row;
    };     
    this.getCurrentTokenColumn = function() {
        var rowTokens = this.$rowTokens;
        var tokenIndex = this.$tokenIndex;
        var column = rowTokens[tokenIndex].start;
        if (column !== undefined)
            return column;
            
        column = 0;
        while (tokenIndex > 0) {
            tokenIndex -= 1;
            column += rowTokens[tokenIndex].value.length;
        }
        
        return column;  
    };
            
}).call(TokenIterator.prototype);

exports.TokenIterator = TokenIterator;
});

ace.define("ace/mode/text",["require","exports","module","ace/tokenizer","ace/mode/text_highlight_rules","ace/mode/behaviour","ace/unicode","ace/lib/lang","ace/token_iterator","ace/range"], function(require, exports, module) {
"use strict";

var Tokenizer = require("../tokenizer").Tokenizer;
var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;
var Behaviour = require("./behaviour").Behaviour;
var unicode = require("../unicode");
var lang = require("../lib/lang");
var TokenIterator = require("../token_iterator").TokenIterator;
var Range = require("../range").Range;

var Mode = function() {
    this.HighlightRules = TextHighlightRules;
    this.$behaviour = new Behaviour();
};

(function() {

    this.tokenRe = new RegExp("^["
        + unicode.packages.L
        + unicode.packages.Mn + unicode.packages.Mc
        + unicode.packages.Nd
        + unicode.packages.Pc + "\\$_]+", "g"
    );

    this.nonTokenRe = new RegExp("^(?:[^"
        + unicode.packages.L
        + unicode.packages.Mn + unicode.packages.Mc
        + unicode.packages.Nd
        + unicode.packages.Pc + "\\$_]|\\s])+", "g"
    );

    this.getTokenizer = function() {
        if (!this.$tokenizer) {
            this.$highlightRules = this.$highlightRules || new this.HighlightRules();
            this.$tokenizer = new Tokenizer(this.$highlightRules.getRules());
        }
        return this.$tokenizer;
    };

    this.lineCommentStart = "";
    this.blockComment = "";

    this.toggleCommentLines = function(state, session, startRow, endRow) {
        var doc = session.doc;

        var ignoreBlankLines = true;
        var shouldRemove = true;
        var minIndent = Infinity;
        var tabSize = session.getTabSize();
        var insertAtTabStop = false;

        if (!this.lineCommentStart) {
            if (!this.blockComment)
                return false;
            var lineCommentStart = this.blockComment.start;
            var lineCommentEnd = this.blockComment.end;
            var regexpStart = new RegExp("^(\\s*)(?:" + lang.escapeRegExp(lineCommentStart) + ")");
            var regexpEnd = new RegExp("(?:" + lang.escapeRegExp(lineCommentEnd) + ")\\s*$");

            var comment = function(line, i) {
                if (testRemove(line, i))
                    return;
                if (!ignoreBlankLines || /\S/.test(line)) {
                    doc.insertInLine({row: i, column: line.length}, lineCommentEnd);
                    doc.insertInLine({row: i, column: minIndent}, lineCommentStart);
                }
            };

            var uncomment = function(line, i) {
                var m;
                if (m = line.match(regexpEnd))
                    doc.removeInLine(i, line.length - m[0].length, line.length);
                if (m = line.match(regexpStart))
                    doc.removeInLine(i, m[1].length, m[0].length);
            };

            var testRemove = function(line, row) {
                if (regexpStart.test(line))
                    return true;
                var tokens = session.getTokens(row);
                for (var i = 0; i < tokens.length; i++) {
                    if (tokens[i].type === 'comment')
                        return true;
                }
            };
        } else {
            if (Array.isArray(this.lineCommentStart)) {
                var regexpStart = this.lineCommentStart.map(lang.escapeRegExp).join("|");
                var lineCommentStart = this.lineCommentStart[0];
            } else {
                var regexpStart = lang.escapeRegExp(this.lineCommentStart);
                var lineCommentStart = this.lineCommentStart;
            }
            regexpStart = new RegExp("^(\\s*)(?:" + regexpStart + ") ?");
            
            insertAtTabStop = session.getUseSoftTabs();

            var uncomment = function(line, i) {
                var m = line.match(regexpStart);
                if (!m) return;
                var start = m[1].length, end = m[0].length;
                if (!shouldInsertSpace(line, start, end) && m[0][end - 1] == " ")
                    end--;
                doc.removeInLine(i, start, end);
            };
            var commentWithSpace = lineCommentStart + " ";
            var comment = function(line, i) {
                if (!ignoreBlankLines || /\S/.test(line)) {
                    if (shouldInsertSpace(line, minIndent, minIndent))
                        doc.insertInLine({row: i, column: minIndent}, commentWithSpace);
                    else
                        doc.insertInLine({row: i, column: minIndent}, lineCommentStart);
                }
            };
            var testRemove = function(line, i) {
                return regexpStart.test(line);
            };
            
            var shouldInsertSpace = function(line, before, after) {
                var spaces = 0;
                while (before-- && line.charAt(before) == " ")
                    spaces++;
                if (spaces % tabSize != 0)
                    return false;
                var spaces = 0;
                while (line.charAt(after++) == " ")
                    spaces++;
                if (tabSize > 2)
                    return spaces % tabSize != tabSize - 1;
                else
                    return spaces % tabSize == 0;
                return true;
            };
        }

        function iter(fun) {
            for (var i = startRow; i <= endRow; i++)
                fun(doc.getLine(i), i);
        }


        var minEmptyLength = Infinity;
        iter(function(line, i) {
            var indent = line.search(/\S/);
            if (indent !== -1) {
                if (indent < minIndent)
                    minIndent = indent;
                if (shouldRemove && !testRemove(line, i))
                    shouldRemove = false;
            } else if (minEmptyLength > line.length) {
                minEmptyLength = line.length;
            }
        });

        if (minIndent == Infinity) {
            minIndent = minEmptyLength;
            ignoreBlankLines = false;
            shouldRemove = false;
        }

        if (insertAtTabStop && minIndent % tabSize != 0)
            minIndent = Math.floor(minIndent / tabSize) * tabSize;

        iter(shouldRemove ? uncomment : comment);
    };

    this.toggleBlockComment = function(state, session, range, cursor) {
        var comment = this.blockComment;
        if (!comment)
            return;
        if (!comment.start && comment[0])
            comment = comment[0];

        var iterator = new TokenIterator(session, cursor.row, cursor.column);
        var token = iterator.getCurrentToken();

        var sel = session.selection;
        var initialRange = session.selection.toOrientedRange();
        var startRow, colDiff;

        if (token && /comment/.test(token.type)) {
            var startRange, endRange;
            while (token && /comment/.test(token.type)) {
                var i = token.value.indexOf(comment.start);
                if (i != -1) {
                    var row = iterator.getCurrentTokenRow();
                    var column = iterator.getCurrentTokenColumn() + i;
                    startRange = new Range(row, column, row, column + comment.start.length);
                    break;
                }
                token = iterator.stepBackward();
            }

            var iterator = new TokenIterator(session, cursor.row, cursor.column);
            var token = iterator.getCurrentToken();
            while (token && /comment/.test(token.type)) {
                var i = token.value.indexOf(comment.end);
                if (i != -1) {
                    var row = iterator.getCurrentTokenRow();
                    var column = iterator.getCurrentTokenColumn() + i;
                    endRange = new Range(row, column, row, column + comment.end.length);
                    break;
                }
                token = iterator.stepForward();
            }
            if (endRange)
                session.remove(endRange);
            if (startRange) {
                session.remove(startRange);
                startRow = startRange.start.row;
                colDiff = -comment.start.length;
            }
        } else {
            colDiff = comment.start.length;
            startRow = range.start.row;
            session.insert(range.end, comment.end);
            session.insert(range.start, comment.start);
        }
        if (initialRange.start.row == startRow)
            initialRange.start.column += colDiff;
        if (initialRange.end.row == startRow)
            initialRange.end.column += colDiff;
        session.selection.fromOrientedRange(initialRange);
    };

    this.getNextLineIndent = function(state, line, tab) {
        return this.$getIndent(line);
    };

    this.checkOutdent = function(state, line, input) {
        return false;
    };

    this.autoOutdent = function(state, doc, row) {
    };

    this.$getIndent = function(line) {
        return line.match(/^\s*/)[0];
    };

    this.createWorker = function(session) {
        return null;
    };

    this.createModeDelegates = function (mapping) {
        this.$embeds = [];
        this.$modes = {};
        for (var i in mapping) {
            if (mapping[i]) {
                this.$embeds.push(i);
                this.$modes[i] = new mapping[i]();
            }
        }

        var delegations = ['toggleBlockComment', 'toggleCommentLines', 'getNextLineIndent', 
            'checkOutdent', 'autoOutdent', 'transformAction', 'getCompletions'];

        for (var i = 0; i < delegations.length; i++) {
            (function(scope) {
              var functionName = delegations[i];
              var defaultHandler = scope[functionName];
              scope[delegations[i]] = function() {
                  return this.$delegator(functionName, arguments, defaultHandler);
              };
            } (this));
        }
    };

    this.$delegator = function(method, args, defaultHandler) {
        var state = args[0];
        if (typeof state != "string")
            state = state[0];
        for (var i = 0; i < this.$embeds.length; i++) {
            if (!this.$modes[this.$embeds[i]]) continue;

            var split = state.split(this.$embeds[i]);
            if (!split[0] && split[1]) {
                args[0] = split[1];
                var mode = this.$modes[this.$embeds[i]];
                return mode[method].apply(mode, args);
            }
        }
        var ret = defaultHandler.apply(this, args);
        return defaultHandler ? ret : undefined;
    };

    this.transformAction = function(state, action, editor, session, param) {
        if (this.$behaviour) {
            var behaviours = this.$behaviour.getBehaviours();
            for (var key in behaviours) {
                if (behaviours[key][action]) {
                    var ret = behaviours[key][action].apply(this, arguments);
                    if (ret) {
                        return ret;
                    }
                }
            }
        }
    };
    
    this.getKeywords = function(append) {
        if (!this.completionKeywords) {
            var rules = this.$tokenizer.rules;
            var completionKeywords = [];
            for (var rule in rules) {
                var ruleItr = rules[rule];
                for (var r = 0, l = ruleItr.length; r < l; r++) {
                    if (typeof ruleItr[r].token === "string") {
                        if (/keyword|support|storage/.test(ruleItr[r].token))
                            completionKeywords.push(ruleItr[r].regex);
                    }
                    else if (typeof ruleItr[r].token === "object") {
                        for (var a = 0, aLength = ruleItr[r].token.length; a < aLength; a++) {    
                            if (/keyword|support|storage/.test(ruleItr[r].token[a])) {
                                var rule = ruleItr[r].regex.match(/\(.+?\)/g)[a];
                                completionKeywords.push(rule.substr(1, rule.length - 2));
                            }
                        }
                    }
                }
            }
            this.completionKeywords = completionKeywords;
        }
        if (!append)
            return this.$keywordList;
        return completionKeywords.concat(this.$keywordList || []);
    };
    
    this.$createKeywordList = function() {
        if (!this.$highlightRules)
            this.getTokenizer();
        return this.$keywordList = this.$highlightRules.$keywordList || [];
    };

    this.getCompletions = function(state, session, pos, prefix) {
        var keywords = this.$keywordList || this.$createKeywordList();
        return keywords.map(function(word) {
            return {
                name: word,
                value: word,
                score: 0,
                meta: "keyword"
            };
        });
    };

    this.$id = "ace/mode/text";
}).call(Mode.prototype);

exports.Mode = Mode;
});

ace.define("ace/anchor",["require","exports","module","ace/lib/oop","ace/lib/event_emitter"], function(require, exports, module) {
"use strict";

var oop = require("./lib/oop");
var EventEmitter = require("./lib/event_emitter").EventEmitter;

var Anchor = exports.Anchor = function(doc, row, column) {
    this.$onChange = this.onChange.bind(this);
    this.attach(doc);
    
    if (typeof column == "undefined")
        this.setPosition(row.row, row.column);
    else
        this.setPosition(row, column);
};

(function() {

    oop.implement(this, EventEmitter);
    this.getPosition = function() {
        return this.$clipPositionToDocument(this.row, this.column);
    };
    this.getDocument = function() {
        return this.document;
    };
    this.$insertRight = false;
    this.onChange = function(e) {
        var delta = e.data;
        var range = delta.range;

        if (range.start.row == range.end.row && range.start.row != this.row)
            return;

        if (range.start.row > this.row)
            return;

        if (range.start.row == this.row && range.start.column > this.column)
            return;

        var row = this.row;
        var column = this.column;
        var start = range.start;
        var end = range.end;

        if (delta.action === "insertText") {
            if (start.row === row && start.column <= column) {
                if (start.column === column && this.$insertRight) {
                } else if (start.row === end.row) {
                    column += end.column - start.column;
                } else {
                    column -= start.column;
                    row += end.row - start.row;
                }
            } else if (start.row !== end.row && start.row < row) {
                row += end.row - start.row;
            }
        } else if (delta.action === "insertLines") {
            if (start.row === row && column === 0 && this.$insertRight) {
            }
            else if (start.row <= row) {
                row += end.row - start.row;
            }
        } else if (delta.action === "removeText") {
            if (start.row === row && start.column < column) {
                if (end.column >= column)
                    column = start.column;
                else
                    column = Math.max(0, column - (end.column - start.column));

            } else if (start.row !== end.row && start.row < row) {
                if (end.row === row)
                    column = Math.max(0, column - end.column) + start.column;
                row -= (end.row - start.row);
            } else if (end.row === row) {
                row -= end.row - start.row;
                column = Math.max(0, column - end.column) + start.column;
            }
        } else if (delta.action == "removeLines") {
            if (start.row <= row) {
                if (end.row <= row)
                    row -= end.row - start.row;
                else {
                    row = start.row;
                    column = 0;
                }
            }
        }

        this.setPosition(row, column, true);
    };
    this.setPosition = function(row, column, noClip) {
        var pos;
        if (noClip) {
            pos = {
                row: row,
                column: column
            };
        } else {
            pos = this.$clipPositionToDocument(row, column);
        }

        if (this.row == pos.row && this.column == pos.column)
            return;

        var old = {
            row: this.row,
            column: this.column
        };

        this.row = pos.row;
        this.column = pos.column;
        this._signal("change", {
            old: old,
            value: pos
        });
    };
    this.detach = function() {
        this.document.removeEventListener("change", this.$onChange);
    };
    this.attach = function(doc) {
        this.document = doc || this.document;
        this.document.on("change", this.$onChange);
    };
    this.$clipPositionToDocument = function(row, column) {
        var pos = {};

        if (row >= this.document.getLength()) {
            pos.row = Math.max(0, this.document.getLength() - 1);
            pos.column = this.document.getLine(pos.row).length;
        }
        else if (row < 0) {
            pos.row = 0;
            pos.column = 0;
        }
        else {
            pos.row = row;
            pos.column = Math.min(this.document.getLine(pos.row).length, Math.max(0, column));
        }

        if (column < 0)
            pos.column = 0;

        return pos;
    };

}).call(Anchor.prototype);

});

ace.define("ace/document",["require","exports","module","ace/lib/oop","ace/lib/event_emitter","ace/range","ace/anchor"], function(require, exports, module) {
"use strict";

var oop = require("./lib/oop");
var EventEmitter = require("./lib/event_emitter").EventEmitter;
var Range = require("./range").Range;
var Anchor = require("./anchor").Anchor;

var Document = function(text) {
    this.$lines = [];
    if (text.length === 0) {
        this.$lines = [""];
    } else if (Array.isArray(text)) {
        this._insertLines(0, text);
    } else {
        this.insert({row: 0, column:0}, text);
    }
};

(function() {

    oop.implement(this, EventEmitter);
    this.setValue = function(text) {
        var len = this.getLength();
        this.remove(new Range(0, 0, len, this.getLine(len-1).length));
        this.insert({row: 0, column:0}, text);
    };
    this.getValue = function() {
        return this.getAllLines().join(this.getNewLineCharacter());
    };
    this.createAnchor = function(row, column) {
        return new Anchor(this, row, column);
    };
    if ("aaa".split(/a/).length === 0)
        this.$split = function(text) {
            return text.replace(/\r\n|\r/g, "\n").split("\n");
        };
    else
        this.$split = function(text) {
            return text.split(/\r\n|\r|\n/);
        };


    this.$detectNewLine = function(text) {
        var match = text.match(/^.*?(\r\n|\r|\n)/m);
        this.$autoNewLine = match ? match[1] : "\n";
        this._signal("changeNewLineMode");
    };
    this.getNewLineCharacter = function() {
        switch (this.$newLineMode) {
          case "windows":
            return "\r\n";
          case "unix":
            return "\n";
          default:
            return this.$autoNewLine || "\n";
        }
    };

    this.$autoNewLine = "";
    this.$newLineMode = "auto";
    this.setNewLineMode = function(newLineMode) {
        if (this.$newLineMode === newLineMode)
            return;

        this.$newLineMode = newLineMode;
        this._signal("changeNewLineMode");
    };
    this.getNewLineMode = function() {
        return this.$newLineMode;
    };
    this.isNewLine = function(text) {
        return (text == "\r\n" || text == "\r" || text == "\n");
    };
    this.getLine = function(row) {
        return this.$lines[row] || "";
    };
    this.getLines = function(firstRow, lastRow) {
        return this.$lines.slice(firstRow, lastRow + 1);
    };
    this.getAllLines = function() {
        return this.getLines(0, this.getLength());
    };
    this.getLength = function() {
        return this.$lines.length;
    };
    this.getTextRange = function(range) {
        if (range.start.row == range.end.row) {
            return this.getLine(range.start.row)
                .substring(range.start.column, range.end.column);
        }
        var lines = this.getLines(range.start.row, range.end.row);
        lines[0] = (lines[0] || "").substring(range.start.column);
        var l = lines.length - 1;
        if (range.end.row - range.start.row == l)
            lines[l] = lines[l].substring(0, range.end.column);
        return lines.join(this.getNewLineCharacter());
    };

    this.$clipPosition = function(position) {
        var length = this.getLength();
        if (position.row >= length) {
            position.row = Math.max(0, length - 1);
            position.column = this.getLine(length-1).length;
        } else if (position.row < 0)
            position.row = 0;
        return position;
    };
    this.insert = function(position, text) {
        if (!text || text.length === 0)
            return position;

        position = this.$clipPosition(position);
        if (this.getLength() <= 1)
            this.$detectNewLine(text);

        var lines = this.$split(text);
        var firstLine = lines.splice(0, 1)[0];
        var lastLine = lines.length == 0 ? null : lines.splice(lines.length - 1, 1)[0];

        position = this.insertInLine(position, firstLine);
        if (lastLine !== null) {
            position = this.insertNewLine(position); // terminate first line
            position = this._insertLines(position.row, lines);
            position = this.insertInLine(position, lastLine || "");
        }
        return position;
    };
    this.insertLines = function(row, lines) {
        if (row >= this.getLength())
            return this.insert({row: row, column: 0}, "\n" + lines.join("\n"));
        return this._insertLines(Math.max(row, 0), lines);
    };
    this._insertLines = function(row, lines) {
        if (lines.length == 0)
            return {row: row, column: 0};
        while (lines.length > 0xF000) {
            var end = this._insertLines(row, lines.slice(0, 0xF000));
            lines = lines.slice(0xF000);
            row = end.row;
        }

        var args = [row, 0];
        args.push.apply(args, lines);
        this.$lines.splice.apply(this.$lines, args);

        var range = new Range(row, 0, row + lines.length, 0);
        var delta = {
            action: "insertLines",
            range: range,
            lines: lines
        };
        this._signal("change", { data: delta });
        return range.end;
    };
    this.insertNewLine = function(position) {
        position = this.$clipPosition(position);
        var line = this.$lines[position.row] || "";

        this.$lines[position.row] = line.substring(0, position.column);
        this.$lines.splice(position.row + 1, 0, line.substring(position.column, line.length));

        var end = {
            row : position.row + 1,
            column : 0
        };

        var delta = {
            action: "insertText",
            range: Range.fromPoints(position, end),
            text: this.getNewLineCharacter()
        };
        this._signal("change", { data: delta });

        return end;
    };
    this.insertInLine = function(position, text) {
        if (text.length == 0)
            return position;

        var line = this.$lines[position.row] || "";

        this.$lines[position.row] = line.substring(0, position.column) + text
                + line.substring(position.column);

        var end = {
            row : position.row,
            column : position.column + text.length
        };

        var delta = {
            action: "insertText",
            range: Range.fromPoints(position, end),
            text: text
        };
        this._signal("change", { data: delta });

        return end;
    };
    this.remove = function(range) {
        if (!(range instanceof Range))
            range = Range.fromPoints(range.start, range.end);
        range.start = this.$clipPosition(range.start);
        range.end = this.$clipPosition(range.end);

        if (range.isEmpty())
            return range.start;

        var firstRow = range.start.row;
        var lastRow = range.end.row;

        if (range.isMultiLine()) {
            var firstFullRow = range.start.column == 0 ? firstRow : firstRow + 1;
            var lastFullRow = lastRow - 1;

            if (range.end.column > 0)
                this.removeInLine(lastRow, 0, range.end.column);

            if (lastFullRow >= firstFullRow)
                this._removeLines(firstFullRow, lastFullRow);

            if (firstFullRow != firstRow) {
                this.removeInLine(firstRow, range.start.column, this.getLine(firstRow).length);
                this.removeNewLine(range.start.row);
            }
        }
        else {
            this.removeInLine(firstRow, range.start.column, range.end.column);
        }
        return range.start;
    };
    this.removeInLine = function(row, startColumn, endColumn) {
        if (startColumn == endColumn)
            return;

        var range = new Range(row, startColumn, row, endColumn);
        var line = this.getLine(row);
        var removed = line.substring(startColumn, endColumn);
        var newLine = line.substring(0, startColumn) + line.substring(endColumn, line.length);
        this.$lines.splice(row, 1, newLine);

        var delta = {
            action: "removeText",
            range: range,
            text: removed
        };
        this._signal("change", { data: delta });
        return range.start;
    };
    this.removeLines = function(firstRow, lastRow) {
        if (firstRow < 0 || lastRow >= this.getLength())
            return this.remove(new Range(firstRow, 0, lastRow + 1, 0));
        return this._removeLines(firstRow, lastRow);
    };

    this._removeLines = function(firstRow, lastRow) {
        var range = new Range(firstRow, 0, lastRow + 1, 0);
        var removed = this.$lines.splice(firstRow, lastRow - firstRow + 1);

        var delta = {
            action: "removeLines",
            range: range,
            nl: this.getNewLineCharacter(),
            lines: removed
        };
        this._signal("change", { data: delta });
        return removed;
    };
    this.removeNewLine = function(row) {
        var firstLine = this.getLine(row);
        var secondLine = this.getLine(row+1);

        var range = new Range(row, firstLine.length, row+1, 0);
        var line = firstLine + secondLine;

        this.$lines.splice(row, 2, line);

        var delta = {
            action: "removeText",
            range: range,
            text: this.getNewLineCharacter()
        };
        this._signal("change", { data: delta });
    };
    this.replace = function(range, text) {
        if (!(range instanceof Range))
            range = Range.fromPoints(range.start, range.end);
        if (text.length == 0 && range.isEmpty())
            return range.start;
        if (text == this.getTextRange(range))
            return range.end;

        this.remove(range);
        if (text) {
            var end = this.insert(range.start, text);
        }
        else {
            end = range.start;
        }

        return end;
    };
    this.applyDeltas = function(deltas) {
        for (var i=0; i<deltas.length; i++) {
            var delta = deltas[i];
            var range = Range.fromPoints(delta.range.start, delta.range.end);

            if (delta.action == "insertLines")
                this.insertLines(range.start.row, delta.lines);
            else if (delta.action == "insertText")
                this.insert(range.start, delta.text);
            else if (delta.action == "removeLines")
                this._removeLines(range.start.row, range.end.row - 1);
            else if (delta.action == "removeText")
                this.remove(range);
        }
    };
    this.revertDeltas = function(deltas) {
        for (var i=deltas.length-1; i>=0; i--) {
            var delta = deltas[i];

            var range = Range.fromPoints(delta.range.start, delta.range.end);

            if (delta.action == "insertLines")
                this._removeLines(range.start.row, range.end.row - 1);
            else if (delta.action == "insertText")
                this.remove(range);
            else if (delta.action == "removeLines")
                this._insertLines(range.start.row, delta.lines);
            else if (delta.action == "removeText")
                this.insert(range.start, delta.text);
        }
    };
    this.indexToPosition = function(index, startRow) {
        var lines = this.$lines || this.getAllLines();
        var newlineLength = this.getNewLineCharacter().length;
        for (var i = startRow || 0, l = lines.length; i < l; i++) {
            index -= lines[i].length + newlineLength;
            if (index < 0)
                return {row: i, column: index + lines[i].length + newlineLength};
        }
        return {row: l-1, column: lines[l-1].length};
    };
    this.positionToIndex = function(pos, startRow) {
        var lines = this.$lines || this.getAllLines();
        var newlineLength = this.getNewLineCharacter().length;
        var index = 0;
        var row = Math.min(pos.row, lines.length);
        for (var i = startRow || 0; i < row; ++i)
            index += lines[i].length + newlineLength;

        return index + pos.column;
    };

}).call(Document.prototype);

exports.Document = Document;
});

ace.define("ace/background_tokenizer",["require","exports","module","ace/lib/oop","ace/lib/event_emitter"], function(require, exports, module) {
"use strict";

var oop = require("./lib/oop");
var EventEmitter = require("./lib/event_emitter").EventEmitter;

var BackgroundTokenizer = function(tokenizer, editor) {
    this.running = false;
    this.lines = [];
    this.states = [];
    this.currentLine = 0;
    this.tokenizer = tokenizer;

    var self = this;

    this.$worker = function() {
        if (!self.running) { return; }

        var workerStart = new Date();
        var currentLine = self.currentLine;
        var endLine = -1;
        var doc = self.doc;

        while (self.lines[currentLine])
            currentLine++;

        var startLine = currentLine;

        var len = doc.getLength();
        var processedLines = 0;
        self.running = false;
        while (currentLine < len) {
            self.$tokenizeRow(currentLine);
            endLine = currentLine;
            do {
                currentLine++;
            } while (self.lines[currentLine]);
            processedLines ++;
            if ((processedLines % 5 === 0) && (new Date() - workerStart) > 20) {                
                self.running = setTimeout(self.$worker, 20);
                break;
            }
        }
        self.currentLine = currentLine;
        
        if (startLine <= endLine)
            self.fireUpdateEvent(startLine, endLine);
    };
};

(function(){

    oop.implement(this, EventEmitter);
    this.setTokenizer = function(tokenizer) {
        this.tokenizer = tokenizer;
        this.lines = [];
        this.states = [];

        this.start(0);
    };
    this.setDocument = function(doc) {
        this.doc = doc;
        this.lines = [];
        this.states = [];

        this.stop();
    };
    this.fireUpdateEvent = function(firstRow, lastRow) {
        var data = {
            first: firstRow,
            last: lastRow
        };
        this._signal("update", {data: data});
    };
    this.start = function(startRow) {
        this.currentLine = Math.min(startRow || 0, this.currentLine, this.doc.getLength());
        this.lines.splice(this.currentLine, this.lines.length);
        this.states.splice(this.currentLine, this.states.length);

        this.stop();
        this.running = setTimeout(this.$worker, 700);
    };
    
    this.scheduleStart = function() {
        if (!this.running)
            this.running = setTimeout(this.$worker, 700);
    }

    this.$updateOnChange = function(delta) {
        var range = delta.range;
        var startRow = range.start.row;
        var len = range.end.row - startRow;

        if (len === 0) {
            this.lines[startRow] = null;
        } else if (delta.action == "removeText" || delta.action == "removeLines") {
            this.lines.splice(startRow, len + 1, null);
            this.states.splice(startRow, len + 1, null);
        } else {
            var args = Array(len + 1);
            args.unshift(startRow, 1);
            this.lines.splice.apply(this.lines, args);
            this.states.splice.apply(this.states, args);
        }

        this.currentLine = Math.min(startRow, this.currentLine, this.doc.getLength());

        this.stop();
    };
    this.stop = function() {
        if (this.running)
            clearTimeout(this.running);
        this.running = false;
    };
    this.getTokens = function(row) {
        return this.lines[row] || this.$tokenizeRow(row);
    };
    this.getState = function(row) {
        if (this.currentLine == row)
            this.$tokenizeRow(row);
        return this.states[row] || "start";
    };

    this.$tokenizeRow = function(row) {
        var line = this.doc.getLine(row);
        var state = this.states[row - 1];

        var data = this.tokenizer.getLineTokens(line, state, row);

        if (this.states[row] + "" !== data.state + "") {
            this.states[row] = data.state;
            this.lines[row + 1] = null;
            if (this.currentLine > row + 1)
                this.currentLine = row + 1;
        } else if (this.currentLine == row) {
            this.currentLine = row + 1;
        }

        return this.lines[row] = data.tokens;
    };

}).call(BackgroundTokenizer.prototype);

exports.BackgroundTokenizer = BackgroundTokenizer;
});

ace.define("ace/search_highlight",["require","exports","module","ace/lib/lang","ace/lib/oop","ace/range"], function(require, exports, module) {
"use strict";

var lang = require("./lib/lang");
var oop = require("./lib/oop");
var Range = require("./range").Range;

var SearchHighlight = function(regExp, clazz, type) {
    this.setRegexp(regExp);
    this.clazz = clazz;
    this.type = type || "text";
};

(function() {
    this.MAX_RANGES = 500;
    
    this.setRegexp = function(regExp) {
        if (this.regExp+"" == regExp+"")
            return;
        this.regExp = regExp;
        this.cache = [];
    };

    this.update = function(html, markerLayer, session, config) {
        if (!this.regExp)
            return;
        var start = config.firstRow, end = config.lastRow;

        for (var i = start; i <= end; i++) {
            var ranges = this.cache[i];
            if (ranges == null) {
                ranges = lang.getMatchOffsets(session.getLine(i), this.regExp);
                if (ranges.length > this.MAX_RANGES)
                    ranges = ranges.slice(0, this.MAX_RANGES);
                ranges = ranges.map(function(match) {
                    return new Range(i, match.offset, i, match.offset + match.length);
                });
                this.cache[i] = ranges.length ? ranges : "";
            }

            for (var j = ranges.length; j --; ) {
                markerLayer.drawSingleLineMarker(
                    html, ranges[j].toScreenRange(session), this.clazz, config);
            }
        }
    };

}).call(SearchHighlight.prototype);

exports.SearchHighlight = SearchHighlight;
});

ace.define("ace/edit_session/fold_line",["require","exports","module","ace/range"], function(require, exports, module) {
"use strict";

var Range = require("../range").Range;
function FoldLine(foldData, folds) {
    this.foldData = foldData;
    if (Array.isArray(folds)) {
        this.folds = folds;
    } else {
        folds = this.folds = [ folds ];
    }

    var last = folds[folds.length - 1];
    this.range = new Range(folds[0].start.row, folds[0].start.column,
                           last.end.row, last.end.column);
    this.start = this.range.start;
    this.end   = this.range.end;

    this.folds.forEach(function(fold) {
        fold.setFoldLine(this);
    }, this);
}

(function() {
    this.shiftRow = function(shift) {
        this.start.row += shift;
        this.end.row += shift;
        this.folds.forEach(function(fold) {
            fold.start.row += shift;
            fold.end.row += shift;
        });
    };

    this.addFold = function(fold) {
        if (fold.sameRow) {
            if (fold.start.row < this.startRow || fold.endRow > this.endRow) {
                throw new Error("Can't add a fold to this FoldLine as it has no connection");
            }
            this.folds.push(fold);
            this.folds.sort(function(a, b) {
                return -a.range.compareEnd(b.start.row, b.start.column);
            });
            if (this.range.compareEnd(fold.start.row, fold.start.column) > 0) {
                this.end.row = fold.end.row;
                this.end.column =  fold.end.column;
            } else if (this.range.compareStart(fold.end.row, fold.end.column) < 0) {
                this.start.row = fold.start.row;
                this.start.column = fold.start.column;
            }
        } else if (fold.start.row == this.end.row) {
            this.folds.push(fold);
            this.end.row = fold.end.row;
            this.end.column = fold.end.column;
        } else if (fold.end.row == this.start.row) {
            this.folds.unshift(fold);
            this.start.row = fold.start.row;
            this.start.column = fold.start.column;
        } else {
            throw new Error("Trying to add fold to FoldRow that doesn't have a matching row");
        }
        fold.foldLine = this;
    };

    this.containsRow = function(row) {
        return row >= this.start.row && row <= this.end.row;
    };

    this.walk = function(callback, endRow, endColumn) {
        var lastEnd = 0,
            folds = this.folds,
            fold,
            cmp, stop, isNewRow = true;

        if (endRow == null) {
            endRow = this.end.row;
            endColumn = this.end.column;
        }

        for (var i = 0; i < folds.length; i++) {
            fold = folds[i];

            cmp = fold.range.compareStart(endRow, endColumn);
            if (cmp == -1) {
                callback(null, endRow, endColumn, lastEnd, isNewRow);
                return;
            }

            stop = callback(null, fold.start.row, fold.start.column, lastEnd, isNewRow);
            stop = !stop && callback(fold.placeholder, fold.start.row, fold.start.column, lastEnd);
            if (stop || cmp === 0) {
                return;
            }
            isNewRow = !fold.sameRow;
            lastEnd = fold.end.column;
        }
        callback(null, endRow, endColumn, lastEnd, isNewRow);
    };

    this.getNextFoldTo = function(row, column) {
        var fold, cmp;
        for (var i = 0; i < this.folds.length; i++) {
            fold = this.folds[i];
            cmp = fold.range.compareEnd(row, column);
            if (cmp == -1) {
                return {
                    fold: fold,
                    kind: "after"
                };
            } else if (cmp === 0) {
                return {
                    fold: fold,
                    kind: "inside"
                };
            }
        }
        return null;
    };

    this.addRemoveChars = function(row, column, len) {
        var ret = this.getNextFoldTo(row, column),
            fold, folds;
        if (ret) {
            fold = ret.fold;
            if (ret.kind == "inside"
                && fold.start.column != column
                && fold.start.row != row)
            {
                window.console && window.console.log(row, column, fold);
            } else if (fold.start.row == row) {
                folds = this.folds;
                var i = folds.indexOf(fold);
                if (i === 0) {
                    this.start.column += len;
                }
                for (i; i < folds.length; i++) {
                    fold = folds[i];
                    fold.start.column += len;
                    if (!fold.sameRow) {
                        return;
                    }
                    fold.end.column += len;
                }
                this.end.column += len;
            }
        }
    };

    this.split = function(row, column) {
        var pos = this.getNextFoldTo(row, column);
        
        if (!pos || pos.kind == "inside")
            return null;
            
        var fold = pos.fold;
        var folds = this.folds;
        var foldData = this.foldData;
        
        var i = folds.indexOf(fold);
        var foldBefore = folds[i - 1];
        this.end.row = foldBefore.end.row;
        this.end.column = foldBefore.end.column;
        folds = folds.splice(i, folds.length - i);

        var newFoldLine = new FoldLine(foldData, folds);
        foldData.splice(foldData.indexOf(this) + 1, 0, newFoldLine);
        return newFoldLine;
    };

    this.merge = function(foldLineNext) {
        var folds = foldLineNext.folds;
        for (var i = 0; i < folds.length; i++) {
            this.addFold(folds[i]);
        }
        var foldData = this.foldData;
        foldData.splice(foldData.indexOf(foldLineNext), 1);
    };

    this.toString = function() {
        var ret = [this.range.toString() + ": [" ];

        this.folds.forEach(function(fold) {
            ret.push("  " + fold.toString());
        });
        ret.push("]");
        return ret.join("\n");
    };

    this.idxToPosition = function(idx) {
        var lastFoldEndColumn = 0;

        for (var i = 0; i < this.folds.length; i++) {
            var fold = this.folds[i];

            idx -= fold.start.column - lastFoldEndColumn;
            if (idx < 0) {
                return {
                    row: fold.start.row,
                    column: fold.start.column + idx
                };
            }

            idx -= fold.placeholder.length;
            if (idx < 0) {
                return fold.start;
            }

            lastFoldEndColumn = fold.end.column;
        }

        return {
            row: this.end.row,
            column: this.end.column + idx
        };
    };
}).call(FoldLine.prototype);

exports.FoldLine = FoldLine;
});

ace.define("ace/range_list",["require","exports","module","ace/range"], function(require, exports, module) {
"use strict";
var Range = require("./range").Range;
var comparePoints = Range.comparePoints;

var RangeList = function() {
    this.ranges = [];
};

(function() {
    this.comparePoints = comparePoints;

    this.pointIndex = function(pos, excludeEdges, startIndex) {
        var list = this.ranges;

        for (var i = startIndex || 0; i < list.length; i++) {
            var range = list[i];
            var cmpEnd = comparePoints(pos, range.end);
            if (cmpEnd > 0)
                continue;
            var cmpStart = comparePoints(pos, range.start);
            if (cmpEnd === 0)
                return excludeEdges && cmpStart !== 0 ? -i-2 : i;
            if (cmpStart > 0 || (cmpStart === 0 && !excludeEdges))
                return i;

            return -i-1;
        }
        return -i - 1;
    };

    this.add = function(range) {
        var excludeEdges = !range.isEmpty();
        var startIndex = this.pointIndex(range.start, excludeEdges);
        if (startIndex < 0)
            startIndex = -startIndex - 1;

        var endIndex = this.pointIndex(range.end, excludeEdges, startIndex);

        if (endIndex < 0)
            endIndex = -endIndex - 1;
        else
            endIndex++;
        return this.ranges.splice(startIndex, endIndex - startIndex, range);
    };

    this.addList = function(list) {
        var removed = [];
        for (var i = list.length; i--; ) {
            removed.push.call(removed, this.add(list[i]));
        }
        return removed;
    };

    this.substractPoint = function(pos) {
        var i = this.pointIndex(pos);

        if (i >= 0)
            return this.ranges.splice(i, 1);
    };
    this.merge = function() {
        var removed = [];
        var list = this.ranges;
        
        list = list.sort(function(a, b) {
            return comparePoints(a.start, b.start);
        });
        
        var next = list[0], range;
        for (var i = 1; i < list.length; i++) {
            range = next;
            next = list[i];
            var cmp = comparePoints(range.end, next.start);
            if (cmp < 0)
                continue;

            if (cmp == 0 && !range.isEmpty() && !next.isEmpty())
                continue;

            if (comparePoints(range.end, next.end) < 0) {
                range.end.row = next.end.row;
                range.end.column = next.end.column;
            }

            list.splice(i, 1);
            removed.push(next);
            next = range;
            i--;
        }
        
        this.ranges = list;

        return removed;
    };

    this.contains = function(row, column) {
        return this.pointIndex({row: row, column: column}) >= 0;
    };

    this.containsPoint = function(pos) {
        return this.pointIndex(pos) >= 0;
    };

    this.rangeAtPoint = function(pos) {
        var i = this.pointIndex(pos);
        if (i >= 0)
            return this.ranges[i];
    };


    this.clipRows = function(startRow, endRow) {
        var list = this.ranges;
        if (list[0].start.row > endRow || list[list.length - 1].start.row < startRow)
            return [];

        var startIndex = this.pointIndex({row: startRow, column: 0});
        if (startIndex < 0)
            startIndex = -startIndex - 1;
        var endIndex = this.pointIndex({row: endRow, column: 0}, startIndex);
        if (endIndex < 0)
            endIndex = -endIndex - 1;

        var clipped = [];
        for (var i = startIndex; i < endIndex; i++) {
            clipped.push(list[i]);
        }
        return clipped;
    };

    this.removeAll = function() {
        return this.ranges.splice(0, this.ranges.length);
    };

    this.attach = function(session) {
        if (this.session)
            this.detach();

        this.session = session;
        this.onChange = this.$onChange.bind(this);

        this.session.on('change', this.onChange);
    };

    this.detach = function() {
        if (!this.session)
            return;
        this.session.removeListener('change', this.onChange);
        this.session = null;
    };

    this.$onChange = function(e) {
        var changeRange = e.data.range;
        if (e.data.action[0] == "i"){
            var start = changeRange.start;
            var end = changeRange.end;
        } else {
            var end = changeRange.start;
            var start = changeRange.end;
        }
        var startRow = start.row;
        var endRow = end.row;
        var lineDif = endRow - startRow;

        var colDiff = -start.column + end.column;
        var ranges = this.ranges;

        for (var i = 0, n = ranges.length; i < n; i++) {
            var r = ranges[i];
            if (r.end.row < startRow)
                continue;
            if (r.start.row > startRow)
                break;

            if (r.start.row == startRow && r.start.column >= start.column ) {
                if (r.start.column == start.column && this.$insertRight) {
                } else {
                    r.start.column += colDiff;
                    r.start.row += lineDif;
                }
            }
            if (r.end.row == startRow && r.end.column >= start.column) {
                if (r.end.column == start.column && this.$insertRight) {
                    continue;
                }
                if (r.end.column == start.column && colDiff > 0 && i < n - 1) {                
                    if (r.end.column > r.start.column && r.end.column == ranges[i+1].start.column)
                        r.end.column -= colDiff;
                }
                r.end.column += colDiff;
                r.end.row += lineDif;
            }
        }

        if (lineDif != 0 && i < n) {
            for (; i < n; i++) {
                var r = ranges[i];
                r.start.row += lineDif;
                r.end.row += lineDif;
            }
        }
    };

}).call(RangeList.prototype);

exports.RangeList = RangeList;
});

ace.define("ace/edit_session/fold",["require","exports","module","ace/range","ace/range_list","ace/lib/oop"], function(require, exports, module) {
"use strict";

var Range = require("../range").Range;
var RangeList = require("../range_list").RangeList;
var oop = require("../lib/oop")
var Fold = exports.Fold = function(range, placeholder) {
    this.foldLine = null;
    this.placeholder = placeholder;
    this.range = range;
    this.start = range.start;
    this.end = range.end;

    this.sameRow = range.start.row == range.end.row;
    this.subFolds = this.ranges = [];
};

oop.inherits(Fold, RangeList);

(function() {

    this.toString = function() {
        return '"' + this.placeholder + '" ' + this.range.toString();
    };

    this.setFoldLine = function(foldLine) {
        this.foldLine = foldLine;
        this.subFolds.forEach(function(fold) {
            fold.setFoldLine(foldLine);
        });
    };

    this.clone = function() {
        var range = this.range.clone();
        var fold = new Fold(range, this.placeholder);
        this.subFolds.forEach(function(subFold) {
            fold.subFolds.push(subFold.clone());
        });
        fold.collapseChildren = this.collapseChildren;
        return fold;
    };

    this.addSubFold = function(fold) {
        if (this.range.isEqual(fold))
            return;

        if (!this.range.containsRange(fold))
            throw new Error("A fold can't intersect already existing fold" + fold.range + this.range);
        consumeRange(fold, this.start);

        var row = fold.start.row, column = fold.start.column;
        for (var i = 0, cmp = -1; i < this.subFolds.length; i++) {
            cmp = this.subFolds[i].range.compare(row, column);
            if (cmp != 1)
                break;
        }
        var afterStart = this.subFolds[i];

        if (cmp == 0)
            return afterStart.addSubFold(fold);
        var row = fold.range.end.row, column = fold.range.end.column;
        for (var j = i, cmp = -1; j < this.subFolds.length; j++) {
            cmp = this.subFolds[j].range.compare(row, column);
            if (cmp != 1)
                break;
        }
        var afterEnd = this.subFolds[j];

        if (cmp == 0)
            throw new Error("A fold can't intersect already existing fold" + fold.range + this.range);

        var consumedFolds = this.subFolds.splice(i, j - i, fold);
        fold.setFoldLine(this.foldLine);

        return fold;
    };
    
    this.restoreRange = function(range) {
        return restoreRange(range, this.start);
    };

}).call(Fold.prototype);

function consumePoint(point, anchor) {
    point.row -= anchor.row;
    if (point.row == 0)
        point.column -= anchor.column;
}
function consumeRange(range, anchor) {
    consumePoint(range.start, anchor);
    consumePoint(range.end, anchor);
}
function restorePoint(point, anchor) {
    if (point.row == 0)
        point.column += anchor.column;
    point.row += anchor.row;
}
function restoreRange(range, anchor) {
    restorePoint(range.start, anchor);
    restorePoint(range.end, anchor);
}

});

ace.define("ace/edit_session/folding",["require","exports","module","ace/range","ace/edit_session/fold_line","ace/edit_session/fold","ace/token_iterator"], function(require, exports, module) {
"use strict";

var Range = require("../range").Range;
var FoldLine = require("./fold_line").FoldLine;
var Fold = require("./fold").Fold;
var TokenIterator = require("../token_iterator").TokenIterator;

function Folding() {
    this.getFoldAt = function(row, column, side) {
        var foldLine = this.getFoldLine(row);
        if (!foldLine)
            return null;

        var folds = foldLine.folds;
        for (var i = 0; i < folds.length; i++) {
            var fold = folds[i];
            if (fold.range.contains(row, column)) {
                if (side == 1 && fold.range.isEnd(row, column)) {
                    continue;
                } else if (side == -1 && fold.range.isStart(row, column)) {
                    continue;
                }
                return fold;
            }
        }
    };
    this.getFoldsInRange = function(range) {
        var start = range.start;
        var end = range.end;
        var foldLines = this.$foldData;
        var foundFolds = [];

        start.column += 1;
        end.column -= 1;

        for (var i = 0; i < foldLines.length; i++) {
            var cmp = foldLines[i].range.compareRange(range);
            if (cmp == 2) {
                continue;
            }
            else if (cmp == -2) {
                break;
            }

            var folds = foldLines[i].folds;
            for (var j = 0; j < folds.length; j++) {
                var fold = folds[j];
                cmp = fold.range.compareRange(range);
                if (cmp == -2) {
                    break;
                } else if (cmp == 2) {
                    continue;
                } else
                if (cmp == 42) {
                    break;
                }
                foundFolds.push(fold);
            }
        }
        start.column -= 1;
        end.column += 1;

        return foundFolds;
    };

    this.getFoldsInRangeList = function(ranges) {
        if (Array.isArray(ranges)) {
            var folds = [];
            ranges.forEach(function(range) {
                folds = folds.concat(this.getFoldsInRange(range));
            }, this);
        } else {
            var folds = this.getFoldsInRange(ranges);
        }
        return folds;
    }
    this.getAllFolds = function() {
        var folds = [];
        var foldLines = this.$foldData;
        
        for (var i = 0; i < foldLines.length; i++)
            for (var j = 0; j < foldLines[i].folds.length; j++)
                folds.push(foldLines[i].folds[j]);

        return folds;
    };
    this.getFoldStringAt = function(row, column, trim, foldLine) {
        foldLine = foldLine || this.getFoldLine(row);
        if (!foldLine)
            return null;

        var lastFold = {
            end: { column: 0 }
        };
        var str, fold;
        for (var i = 0; i < foldLine.folds.length; i++) {
            fold = foldLine.folds[i];
            var cmp = fold.range.compareEnd(row, column);
            if (cmp == -1) {
                str = this
                    .getLine(fold.start.row)
                    .substring(lastFold.end.column, fold.start.column);
                break;
            }
            else if (cmp === 0) {
                return null;
            }
            lastFold = fold;
        }
        if (!str)
            str = this.getLine(fold.start.row).substring(lastFold.end.column);

        if (trim == -1)
            return str.substring(0, column - lastFold.end.column);
        else if (trim == 1)
            return str.substring(column - lastFold.end.column);
        else
            return str;
    };

    this.getFoldLine = function(docRow, startFoldLine) {
        var foldData = this.$foldData;
        var i = 0;
        if (startFoldLine)
            i = foldData.indexOf(startFoldLine);
        if (i == -1)
            i = 0;
        for (i; i < foldData.length; i++) {
            var foldLine = foldData[i];
            if (foldLine.start.row <= docRow && foldLine.end.row >= docRow) {
                return foldLine;
            } else if (foldLine.end.row > docRow) {
                return null;
            }
        }
        return null;
    };
    this.getNextFoldLine = function(docRow, startFoldLine) {
        var foldData = this.$foldData;
        var i = 0;
        if (startFoldLine)
            i = foldData.indexOf(startFoldLine);
        if (i == -1)
            i = 0;
        for (i; i < foldData.length; i++) {
            var foldLine = foldData[i];
            if (foldLine.end.row >= docRow) {
                return foldLine;
            }
        }
        return null;
    };

    this.getFoldedRowCount = function(first, last) {
        var foldData = this.$foldData, rowCount = last-first+1;
        for (var i = 0; i < foldData.length; i++) {
            var foldLine = foldData[i],
                end = foldLine.end.row,
                start = foldLine.start.row;
            if (end >= last) {
                if(start < last) {
                    if(start >= first)
                        rowCount -= last-start;
                    else
                        rowCount = 0;//in one fold
                }
                break;
            } else if(end >= first){
                if (start >= first) //fold inside range
                    rowCount -=  end-start;
                else
                    rowCount -=  end-first+1;
            }
        }
        return rowCount;
    };

    this.$addFoldLine = function(foldLine) {
        this.$foldData.push(foldLine);
        this.$foldData.sort(function(a, b) {
            return a.start.row - b.start.row;
        });
        return foldLine;
    };
    this.addFold = function(placeholder, range) {
        var foldData = this.$foldData;
        var added = false;
        var fold;
        
        if (placeholder instanceof Fold)
            fold = placeholder;
        else {
            fold = new Fold(range, placeholder);
            fold.collapseChildren = range.collapseChildren;
        }
        this.$clipRangeToDocument(fold.range);

        var startRow = fold.start.row;
        var startColumn = fold.start.column;
        var endRow = fold.end.row;
        var endColumn = fold.end.column;
        if (!(startRow < endRow || 
            startRow == endRow && startColumn <= endColumn - 2))
            throw new Error("The range has to be at least 2 characters width");

        var startFold = this.getFoldAt(startRow, startColumn, 1);
        var endFold = this.getFoldAt(endRow, endColumn, -1);
        if (startFold && endFold == startFold)
            return startFold.addSubFold(fold);

        if (startFold && !startFold.range.isStart(startRow, startColumn))
            this.removeFold(startFold);
        
        if (endFold && !endFold.range.isEnd(endRow, endColumn))
            this.removeFold(endFold);
        var folds = this.getFoldsInRange(fold.range);
        if (folds.length > 0) {
            this.removeFolds(folds);
            folds.forEach(function(subFold) {
                fold.addSubFold(subFold);
            });
        }

        for (var i = 0; i < foldData.length; i++) {
            var foldLine = foldData[i];
            if (endRow == foldLine.start.row) {
                foldLine.addFold(fold);
                added = true;
                break;
            } else if (startRow == foldLine.end.row) {
                foldLine.addFold(fold);
                added = true;
                if (!fold.sameRow) {
                    var foldLineNext = foldData[i + 1];
                    if (foldLineNext && foldLineNext.start.row == endRow) {
                        foldLine.merge(foldLineNext);
                        break;
                    }
                }
                break;
            } else if (endRow <= foldLine.start.row) {
                break;
            }
        }

        if (!added)
            foldLine = this.$addFoldLine(new FoldLine(this.$foldData, fold));

        if (this.$useWrapMode)
            this.$updateWrapData(foldLine.start.row, foldLine.start.row);
        else
            this.$updateRowLengthCache(foldLine.start.row, foldLine.start.row);
        this.$modified = true;
        this._emit("changeFold", { data: fold, action: "add" });

        return fold;
    };

    this.addFolds = function(folds) {
        folds.forEach(function(fold) {
            this.addFold(fold);
        }, this);
    };

    this.removeFold = function(fold) {
        var foldLine = fold.foldLine;
        var startRow = foldLine.start.row;
        var endRow = foldLine.end.row;

        var foldLines = this.$foldData;
        var folds = foldLine.folds;
        if (folds.length == 1) {
            foldLines.splice(foldLines.indexOf(foldLine), 1);
        } else
        if (foldLine.range.isEnd(fold.end.row, fold.end.column)) {
            folds.pop();
            foldLine.end.row = folds[folds.length - 1].end.row;
            foldLine.end.column = folds[folds.length - 1].end.column;
        } else
        if (foldLine.range.isStart(fold.start.row, fold.start.column)) {
            folds.shift();
            foldLine.start.row = folds[0].start.row;
            foldLine.start.column = folds[0].start.column;
        } else
        if (fold.sameRow) {
            folds.splice(folds.indexOf(fold), 1);
        } else
        {
            var newFoldLine = foldLine.split(fold.start.row, fold.start.column);
            folds = newFoldLine.folds;
            folds.shift();
            newFoldLine.start.row = folds[0].start.row;
            newFoldLine.start.column = folds[0].start.column;
        }

        if (!this.$updating) {
            if (this.$useWrapMode)
                this.$updateWrapData(startRow, endRow);
            else
                this.$updateRowLengthCache(startRow, endRow);
        }
        this.$modified = true;
        this._emit("changeFold", { data: fold, action: "remove" });
    };

    this.removeFolds = function(folds) {
        var cloneFolds = [];
        for (var i = 0; i < folds.length; i++) {
            cloneFolds.push(folds[i]);
        }

        cloneFolds.forEach(function(fold) {
            this.removeFold(fold);
        }, this);
        this.$modified = true;
    };

    this.expandFold = function(fold) {
        this.removeFold(fold);
        fold.subFolds.forEach(function(subFold) {
            fold.restoreRange(subFold);
            this.addFold(subFold);
        }, this);
        if (fold.collapseChildren > 0) {
            this.foldAll(fold.start.row+1, fold.end.row, fold.collapseChildren-1);
        }
        fold.subFolds = [];
    };

    this.expandFolds = function(folds) {
        folds.forEach(function(fold) {
            this.expandFold(fold);
        }, this);
    };

    this.unfold = function(location, expandInner) {
        var range, folds;
        if (location == null) {
            range = new Range(0, 0, this.getLength(), 0);
            expandInner = true;
        } else if (typeof location == "number")
            range = new Range(location, 0, location, this.getLine(location).length);
        else if ("row" in location)
            range = Range.fromPoints(location, location);
        else
            range = location;
        
        folds = this.getFoldsInRangeList(range);
        if (expandInner) {
            this.removeFolds(folds);
        } else {
            var subFolds = folds;
            while (subFolds.length) {
                this.expandFolds(subFolds);
                subFolds = this.getFoldsInRangeList(range);
            }
        }
        if (folds.length)
            return folds;
    };
    this.isRowFolded = function(docRow, startFoldRow) {
        return !!this.getFoldLine(docRow, startFoldRow);
    };

    this.getRowFoldEnd = function(docRow, startFoldRow) {
        var foldLine = this.getFoldLine(docRow, startFoldRow);
        return foldLine ? foldLine.end.row : docRow;
    };

    this.getRowFoldStart = function(docRow, startFoldRow) {
        var foldLine = this.getFoldLine(docRow, startFoldRow);
        return foldLine ? foldLine.start.row : docRow;
    };

    this.getFoldDisplayLine = function(foldLine, endRow, endColumn, startRow, startColumn) {
        if (startRow == null)
            startRow = foldLine.start.row;
        if (startColumn == null)
            startColumn = 0;
        if (endRow == null)
            endRow = foldLine.end.row;
        if (endColumn == null)
            endColumn = this.getLine(endRow).length;
        var doc = this.doc;
        var textLine = "";

        foldLine.walk(function(placeholder, row, column, lastColumn) {
            if (row < startRow)
                return;
            if (row == startRow) {
                if (column < startColumn)
                    return;
                lastColumn = Math.max(startColumn, lastColumn);
            }

            if (placeholder != null) {
                textLine += placeholder;
            } else {
                textLine += doc.getLine(row).substring(lastColumn, column);
            }
        }, endRow, endColumn);
        return textLine;
    };

    this.getDisplayLine = function(row, endColumn, startRow, startColumn) {
        var foldLine = this.getFoldLine(row);

        if (!foldLine) {
            var line;
            line = this.doc.getLine(row);
            return line.substring(startColumn || 0, endColumn || line.length);
        } else {
            return this.getFoldDisplayLine(
                foldLine, row, endColumn, startRow, startColumn);
        }
    };

    this.$cloneFoldData = function() {
        var fd = [];
        fd = this.$foldData.map(function(foldLine) {
            var folds = foldLine.folds.map(function(fold) {
                return fold.clone();
            });
            return new FoldLine(fd, folds);
        });

        return fd;
    };

    this.toggleFold = function(tryToUnfold) {
        var selection = this.selection;
        var range = selection.getRange();
        var fold;
        var bracketPos;

        if (range.isEmpty()) {
            var cursor = range.start;
            fold = this.getFoldAt(cursor.row, cursor.column);

            if (fold) {
                this.expandFold(fold);
                return;
            } else if (bracketPos = this.findMatchingBracket(cursor)) {
                if (range.comparePoint(bracketPos) == 1) {
                    range.end = bracketPos;
                } else {
                    range.start = bracketPos;
                    range.start.column++;
                    range.end.column--;
                }
            } else if (bracketPos = this.findMatchingBracket({row: cursor.row, column: cursor.column + 1})) {
                if (range.comparePoint(bracketPos) == 1)
                    range.end = bracketPos;
                else
                    range.start = bracketPos;

                range.start.column++;
            } else {
                range = this.getCommentFoldRange(cursor.row, cursor.column) || range;
            }
        } else {
            var folds = this.getFoldsInRange(range);
            if (tryToUnfold && folds.length) {
                this.expandFolds(folds);
                return;
            } else if (folds.length == 1 ) {
                fold = folds[0];
            }
        }

        if (!fold)
            fold = this.getFoldAt(range.start.row, range.start.column);

        if (fold && fold.range.toString() == range.toString()) {
            this.expandFold(fold);
            return;
        }

        var placeholder = "...";
        if (!range.isMultiLine()) {
            placeholder = this.getTextRange(range);
            if(placeholder.length < 4)
                return;
            placeholder = placeholder.trim().substring(0, 2) + "..";
        }

        this.addFold(placeholder, range);
    };

    this.getCommentFoldRange = function(row, column, dir) {
        var iterator = new TokenIterator(this, row, column);
        var token = iterator.getCurrentToken();
        if (token && /^comment|string/.test(token.type)) {
            var range = new Range();
            var re = new RegExp(token.type.replace(/\..*/, "\\."));
            if (dir != 1) {
                do {
                    token = iterator.stepBackward();
                } while(token && re.test(token.type));
                iterator.stepForward();
            }
            
            range.start.row = iterator.getCurrentTokenRow();
            range.start.column = iterator.getCurrentTokenColumn() + 2;

            iterator = new TokenIterator(this, row, column);
            
            if (dir != -1) {
                do {
                    token = iterator.stepForward();
                } while(token && re.test(token.type));
                token = iterator.stepBackward();
            } else
                token = iterator.getCurrentToken();

            range.end.row = iterator.getCurrentTokenRow();
            range.end.column = iterator.getCurrentTokenColumn() + token.value.length - 2;
            return range;
        }
    };

    this.foldAll = function(startRow, endRow, depth) {
        if (depth == undefined)
            depth = 100000; // JSON.stringify doesn't hanle Infinity
        var foldWidgets = this.foldWidgets;
        if (!foldWidgets)
            return; // mode doesn't support folding
        endRow = endRow || this.getLength();
        startRow = startRow || 0;
        for (var row = startRow; row < endRow; row++) {
            if (foldWidgets[row] == null)
                foldWidgets[row] = this.getFoldWidget(row);
            if (foldWidgets[row] != "start")
                continue;

            var range = this.getFoldWidgetRange(row);
            if (range && range.isMultiLine()
                && range.end.row <= endRow
                && range.start.row >= startRow
            ) {
                row = range.end.row;
                try {
                    var fold = this.addFold("...", range);
                    if (fold)
                        fold.collapseChildren = depth;
                } catch(e) {}
            }
        }
    };
    this.$foldStyles = {
        "manual": 1,
        "markbegin": 1,
        "markbeginend": 1
    };
    this.$foldStyle = "markbegin";
    this.setFoldStyle = function(style) {
        if (!this.$foldStyles[style])
            throw new Error("invalid fold style: " + style + "[" + Object.keys(this.$foldStyles).join(", ") + "]");
        
        if (this.$foldStyle == style)
            return;

        this.$foldStyle = style;
        
        if (style == "manual")
            this.unfold();
        var mode = this.$foldMode;
        this.$setFolding(null);
        this.$setFolding(mode);
    };

    this.$setFolding = function(foldMode) {
        if (this.$foldMode == foldMode)
            return;
            
        this.$foldMode = foldMode;
        
        this.removeListener('change', this.$updateFoldWidgets);
        this._emit("changeAnnotation");
        
        if (!foldMode || this.$foldStyle == "manual") {
            this.foldWidgets = null;
            return;
        }
        
        this.foldWidgets = [];
        this.getFoldWidget = foldMode.getFoldWidget.bind(foldMode, this, this.$foldStyle);
        this.getFoldWidgetRange = foldMode.getFoldWidgetRange.bind(foldMode, this, this.$foldStyle);
        
        this.$updateFoldWidgets = this.updateFoldWidgets.bind(this);
        this.on('change', this.$updateFoldWidgets);
        
    };

    this.getParentFoldRangeData = function (row, ignoreCurrent) {
        var fw = this.foldWidgets;
        if (!fw || (ignoreCurrent && fw[row]))
            return {};

        var i = row - 1, firstRange;
        while (i >= 0) {
            var c = fw[i];
            if (c == null)
                c = fw[i] = this.getFoldWidget(i);

            if (c == "start") {
                var range = this.getFoldWidgetRange(i);
                if (!firstRange)
                    firstRange = range;
                if (range && range.end.row >= row)
                    break;
            }
            i--;
        }

        return {
            range: i !== -1 && range,
            firstRange: firstRange
        };
    }

    this.onFoldWidgetClick = function(row, e) {
        e = e.domEvent;
        var options = {
            children: e.shiftKey,
            all: e.ctrlKey || e.metaKey,
            siblings: e.altKey
        };
        
        var range = this.$toggleFoldWidget(row, options);
        if (!range) {
            var el = (e.target || e.srcElement)
            if (el && /ace_fold-widget/.test(el.className))
                el.className += " ace_invalid";
        }
    };
    
    this.$toggleFoldWidget = function(row, options) {
        if (!this.getFoldWidget)
            return;
        var type = this.getFoldWidget(row);
        var line = this.getLine(row);

        var dir = type === "end" ? -1 : 1;
        var fold = this.getFoldAt(row, dir === -1 ? 0 : line.length, dir);

        if (fold) {
            if (options.children || options.all)
                this.removeFold(fold);
            else
                this.expandFold(fold);
            return;
        }

        var range = this.getFoldWidgetRange(row, true);
        if (range && !range.isMultiLine()) {
            fold = this.getFoldAt(range.start.row, range.start.column, 1);
            if (fold && range.isEqual(fold.range)) {
                this.removeFold(fold);
                return;
            }
        }
        
        if (options.siblings) {
            var data = this.getParentFoldRangeData(row);
            if (data.range) {
                var startRow = data.range.start.row + 1;
                var endRow = data.range.end.row;
            }
            this.foldAll(startRow, endRow, options.all ? 10000 : 0);
        } else if (options.children) {
            endRow = range ? range.end.row : this.getLength();
            this.foldAll(row + 1, range.end.row, options.all ? 10000 : 0);
        } else if (range) {
            if (options.all) 
                range.collapseChildren = 10000;
            this.addFold("...", range);
        }
        
        return range;
    };
    
    
    
    this.toggleFoldWidget = function(toggleParent) {
        var row = this.selection.getCursor().row;
        row = this.getRowFoldStart(row);
        var range = this.$toggleFoldWidget(row, {});
        
        if (range)
            return;
        var data = this.getParentFoldRangeData(row, true);
        range = data.range || data.firstRange;
        
        if (range) {
            row = range.start.row;
            var fold = this.getFoldAt(row, this.getLine(row).length, 1);

            if (fold) {
                this.removeFold(fold);
            } else {
                this.addFold("...", range);
            }
        }
    };

    this.updateFoldWidgets = function(e) {
        var delta = e.data;
        var range = delta.range;
        var firstRow = range.start.row;
        var len = range.end.row - firstRow;

        if (len === 0) {
            this.foldWidgets[firstRow] = null;
        } else if (delta.action == "removeText" || delta.action == "removeLines") {
            this.foldWidgets.splice(firstRow, len + 1, null);
        } else {
            var args = Array(len + 1);
            args.unshift(firstRow, 1);
            this.foldWidgets.splice.apply(this.foldWidgets, args);
        }
    };

}

exports.Folding = Folding;

});

ace.define("ace/edit_session/bracket_match",["require","exports","module","ace/token_iterator","ace/range"], function(require, exports, module) {
"use strict";

var TokenIterator = require("../token_iterator").TokenIterator;
var Range = require("../range").Range;


function BracketMatch() {

    this.findMatchingBracket = function(position, chr) {
        if (position.column == 0) return null;

        var charBeforeCursor = chr || this.getLine(position.row).charAt(position.column-1);
        if (charBeforeCursor == "") return null;

        var match = charBeforeCursor.match(/([\(\[\{])|([\)\]\}])/);
        if (!match)
            return null;

        if (match[1])
            return this.$findClosingBracket(match[1], position);
        else
            return this.$findOpeningBracket(match[2], position);
    };
    
    this.getBracketRange = function(pos) {
        var line = this.getLine(pos.row);
        var before = true, range;

        var chr = line.charAt(pos.column-1);
        var match = chr && chr.match(/([\(\[\{])|([\)\]\}])/);
        if (!match) {
            chr = line.charAt(pos.column);
            pos = {row: pos.row, column: pos.column + 1};
            match = chr && chr.match(/([\(\[\{])|([\)\]\}])/);
            before = false;
        }
        if (!match)
            return null;

        if (match[1]) {
            var bracketPos = this.$findClosingBracket(match[1], pos);
            if (!bracketPos)
                return null;
            range = Range.fromPoints(pos, bracketPos);
            if (!before) {
                range.end.column++;
                range.start.column--;
            }
            range.cursor = range.end;
        } else {
            var bracketPos = this.$findOpeningBracket(match[2], pos);
            if (!bracketPos)
                return null;
            range = Range.fromPoints(bracketPos, pos);
            if (!before) {
                range.start.column++;
                range.end.column--;
            }
            range.cursor = range.start;
        }
        
        return range;
    };

    this.$brackets = {
        ")": "(",
        "(": ")",
        "]": "[",
        "[": "]",
        "{": "}",
        "}": "{"
    };

    this.$findOpeningBracket = function(bracket, position, typeRe) {
        var openBracket = this.$brackets[bracket];
        var depth = 1;

        var iterator = new TokenIterator(this, position.row, position.column);
        var token = iterator.getCurrentToken();
        if (!token)
            token = iterator.stepForward();
        if (!token)
            return;
        
         if (!typeRe){
            typeRe = new RegExp(
                "(\\.?" +
                token.type.replace(".", "\\.").replace("rparen", ".paren")
                    .replace(/\b(?:end|start|begin)\b/, "")
                + ")+"
            );
        }
        var valueIndex = position.column - iterator.getCurrentTokenColumn() - 2;
        var value = token.value;
        
        while (true) {
        
            while (valueIndex >= 0) {
                var chr = value.charAt(valueIndex);
                if (chr == openBracket) {
                    depth -= 1;
                    if (depth == 0) {
                        return {row: iterator.getCurrentTokenRow(),
                            column: valueIndex + iterator.getCurrentTokenColumn()};
                    }
                }
                else if (chr == bracket) {
                    depth += 1;
                }
                valueIndex -= 1;
            }
            do {
                token = iterator.stepBackward();
            } while (token && !typeRe.test(token.type));

            if (token == null)
                break;
                
            value = token.value;
            valueIndex = value.length - 1;
        }
        
        return null;
    };

    this.$findClosingBracket = function(bracket, position, typeRe) {
        var closingBracket = this.$brackets[bracket];
        var depth = 1;

        var iterator = new TokenIterator(this, position.row, position.column);
        var token = iterator.getCurrentToken();
        if (!token)
            token = iterator.stepForward();
        if (!token)
            return;

        if (!typeRe){
            typeRe = new RegExp(
                "(\\.?" +
                token.type.replace(".", "\\.").replace("lparen", ".paren")
                    .replace(/\b(?:end|start|begin)\b/, "")
                + ")+"
            );
        }
        var valueIndex = position.column - iterator.getCurrentTokenColumn();

        while (true) {

            var value = token.value;
            var valueLength = value.length;
            while (valueIndex < valueLength) {
                var chr = value.charAt(valueIndex);
                if (chr == closingBracket) {
                    depth -= 1;
                    if (depth == 0) {
                        return {row: iterator.getCurrentTokenRow(),
                            column: valueIndex + iterator.getCurrentTokenColumn()};
                    }
                }
                else if (chr == bracket) {
                    depth += 1;
                }
                valueIndex += 1;
            }
            do {
                token = iterator.stepForward();
            } while (token && !typeRe.test(token.type));

            if (token == null)
                break;

            valueIndex = 0;
        }
        
        return null;
    };
}
exports.BracketMatch = BracketMatch;

});

ace.define("ace/edit_session",["require","exports","module","ace/lib/oop","ace/lib/lang","ace/config","ace/lib/event_emitter","ace/selection","ace/mode/text","ace/range","ace/document","ace/background_tokenizer","ace/search_highlight","ace/edit_session/folding","ace/edit_session/bracket_match"], function(require, exports, module) {
"use strict";

var oop = require("./lib/oop");
var lang = require("./lib/lang");
var config = require("./config");
var EventEmitter = require("./lib/event_emitter").EventEmitter;
var Selection = require("./selection").Selection;
var TextMode = require("./mode/text").Mode;
var Range = require("./range").Range;
var Document = require("./document").Document;
var BackgroundTokenizer = require("./background_tokenizer").BackgroundTokenizer;
var SearchHighlight = require("./search_highlight").SearchHighlight;

var EditSession = function(text, mode) {
    this.$breakpoints = [];
    this.$decorations = [];
    this.$frontMarkers = {};
    this.$backMarkers = {};
    this.$markerId = 1;
    this.$undoSelect = true;

    this.$foldData = [];
    this.$foldData.toString = function() {
        return this.join("\n");
    }
    this.on("changeFold", this.onChangeFold.bind(this));
    this.$onChange = this.onChange.bind(this);

    if (typeof text != "object" || !text.getLine)
        text = new Document(text);

    this.setDocument(text);
    this.selection = new Selection(this);

    config.resetOptions(this);
    this.setMode(mode);
    config._signal("session", this);
};


(function() {

    oop.implement(this, EventEmitter);
    this.setDocument = function(doc) {
        if (this.doc)
            this.doc.removeListener("change", this.$onChange);

        this.doc = doc;
        doc.on("change", this.$onChange);

        if (this.bgTokenizer)
            this.bgTokenizer.setDocument(this.getDocument());

        this.resetCaches();
    };
    this.getDocument = function() {
        return this.doc;
    };
    this.$resetRowCache = function(docRow) {
        if (!docRow) {
            this.$docRowCache = [];
            this.$screenRowCache = [];
            return;
        }
        var l = this.$docRowCache.length;
        var i = this.$getRowCacheIndex(this.$docRowCache, docRow) + 1;
        if (l > i) {
            this.$docRowCache.splice(i, l);
            this.$screenRowCache.splice(i, l);
        }
    };

    this.$getRowCacheIndex = function(cacheArray, val) {
        var low = 0;
        var hi = cacheArray.length - 1;

        while (low <= hi) {
            var mid = (low + hi) >> 1;
            var c = cacheArray[mid];

            if (val > c)
                low = mid + 1;
            else if (val < c)
                hi = mid - 1;
            else
                return mid;
        }

        return low -1;
    };

    this.resetCaches = function() {
        this.$modified = true;
        this.$wrapData = [];
        this.$rowLengthCache = [];
        this.$resetRowCache(0);
        if (this.bgTokenizer)
            this.bgTokenizer.start(0);
    };

    this.onChangeFold = function(e) {
        var fold = e.data;
        this.$resetRowCache(fold.start.row);
    };

    this.onChange = function(e) {
        var delta = e.data;
        this.$modified = true;

        this.$resetRowCache(delta.range.start.row);

        var removedFolds = this.$updateInternalDataOnChange(e);
        if (!this.$fromUndo && this.$undoManager && !delta.ignore) {
            this.$deltasDoc.push(delta);
            if (removedFolds && removedFolds.length != 0) {
                this.$deltasFold.push({
                    action: "removeFolds",
                    folds:  removedFolds
                });
            }

            this.$informUndoManager.schedule();
        }

        this.bgTokenizer && this.bgTokenizer.$updateOnChange(delta);
        this._signal("change", e);
    };
    this.setValue = function(text) {
        this.doc.setValue(text);
        this.selection.moveTo(0, 0);

        this.$resetRowCache(0);
        this.$deltas = [];
        this.$deltasDoc = [];
        this.$deltasFold = [];
        this.setUndoManager(this.$undoManager);
        this.getUndoManager().reset();
    };
    this.getValue =
    this.toString = function() {
        return this.doc.getValue();
    };
    this.getSelection = function() {
        return this.selection;
    };
    this.getState = function(row) {
        return this.bgTokenizer.getState(row);
    };
    this.getTokens = function(row) {
        return this.bgTokenizer.getTokens(row);
    };
    this.getTokenAt = function(row, column) {
        var tokens = this.bgTokenizer.getTokens(row);
        var token, c = 0;
        if (column == null) {
            i = tokens.length - 1;
            c = this.getLine(row).length;
        } else {
            for (var i = 0; i < tokens.length; i++) {
                c += tokens[i].value.length;
                if (c >= column)
                    break;
            }
        }
        token = tokens[i];
        if (!token)
            return null;
        token.index = i;
        token.start = c - token.value.length;
        return token;
    };
    this.setUndoManager = function(undoManager) {
        this.$undoManager = undoManager;
        this.$deltas = [];
        this.$deltasDoc = [];
        this.$deltasFold = [];

        if (this.$informUndoManager)
            this.$informUndoManager.cancel();

        if (undoManager) {
            var self = this;

            this.$syncInformUndoManager = function() {
                self.$informUndoManager.cancel();

                if (self.$deltasFold.length) {
                    self.$deltas.push({
                        group: "fold",
                        deltas: self.$deltasFold
                    });
                    self.$deltasFold = [];
                }

                if (self.$deltasDoc.length) {
                    self.$deltas.push({
                        group: "doc",
                        deltas: self.$deltasDoc
                    });
                    self.$deltasDoc = [];
                }

                if (self.$deltas.length > 0) {
                    undoManager.execute({
                        action: "aceupdate",
                        args: [self.$deltas, self],
                        merge: self.mergeUndoDeltas
                    });
                }
                self.mergeUndoDeltas = false;
                self.$deltas = [];
            };
            this.$informUndoManager = lang.delayedCall(this.$syncInformUndoManager);
        }
    };
    this.markUndoGroup = function() {
        if (this.$syncInformUndoManager)
            this.$syncInformUndoManager();
    };
    
    this.$defaultUndoManager = {
        undo: function() {},
        redo: function() {},
        reset: function() {}
    };
    this.getUndoManager = function() {
        return this.$undoManager || this.$defaultUndoManager;
    };
    this.getTabString = function() {
        if (this.getUseSoftTabs()) {
            return lang.stringRepeat(" ", this.getTabSize());
        } else {
            return "\t";
        }
    };
    this.setUseSoftTabs = function(val) {
        this.setOption("useSoftTabs", val);
    };
    this.getUseSoftTabs = function() {
        return this.$useSoftTabs && !this.$mode.$indentWithTabs;
    };
    this.setTabSize = function(tabSize) {
        this.setOption("tabSize", tabSize);
    };
    this.getTabSize = function() {
        return this.$tabSize;
    };
    this.isTabStop = function(position) {
        return this.$useSoftTabs && (position.column % this.$tabSize === 0);
    };

    this.$overwrite = false;
    this.setOverwrite = function(overwrite) {
        this.setOption("overwrite", overwrite);
    };
    this.getOverwrite = function() {
        return this.$overwrite;
    };
    this.toggleOverwrite = function() {
        this.setOverwrite(!this.$overwrite);
    };
    this.addGutterDecoration = function(row, className) {
        if (!this.$decorations[row])
            this.$decorations[row] = "";
        this.$decorations[row] += " " + className;
        this._signal("changeBreakpoint", {});
    };
    this.removeGutterDecoration = function(row, className) {
        this.$decorations[row] = (this.$decorations[row] || "").replace(" " + className, "");
        this._signal("changeBreakpoint", {});
    };
    this.getBreakpoints = function() {
        return this.$breakpoints;
    };
    this.setBreakpoints = function(rows) {
        this.$breakpoints = [];
        for (var i=0; i<rows.length; i++) {
            this.$breakpoints[rows[i]] = "ace_breakpoint";
        }
        this._signal("changeBreakpoint", {});
    };
    this.clearBreakpoints = function() {
        this.$breakpoints = [];
        this._signal("changeBreakpoint", {});
    };
    this.setBreakpoint = function(row, className) {
        if (className === undefined)
            className = "ace_breakpoint";
        if (className)
            this.$breakpoints[row] = className;
        else
            delete this.$breakpoints[row];
        this._signal("changeBreakpoint", {});
    };
    this.clearBreakpoint = function(row) {
        delete this.$breakpoints[row];
        this._signal("changeBreakpoint", {});
    };
    this.addMarker = function(range, clazz, type, inFront) {
        var id = this.$markerId++;

        var marker = {
            range : range,
            type : type || "line",
            renderer: typeof type == "function" ? type : null,
            clazz : clazz,
            inFront: !!inFront,
            id: id
        };

        if (inFront) {
            this.$frontMarkers[id] = marker;
            this._signal("changeFrontMarker");
        } else {
            this.$backMarkers[id] = marker;
            this._signal("changeBackMarker");
        }

        return id;
    };
    this.addDynamicMarker = function(marker, inFront) {
        if (!marker.update)
            return;
        var id = this.$markerId++;
        marker.id = id;
        marker.inFront = !!inFront;

        if (inFront) {
            this.$frontMarkers[id] = marker;
            this._signal("changeFrontMarker");
        } else {
            this.$backMarkers[id] = marker;
            this._signal("changeBackMarker");
        }

        return marker;
    };
    this.removeMarker = function(markerId) {
        var marker = this.$frontMarkers[markerId] || this.$backMarkers[markerId];
        if (!marker)
            return;

        var markers = marker.inFront ? this.$frontMarkers : this.$backMarkers;
        if (marker) {
            delete (markers[markerId]);
            this._signal(marker.inFront ? "changeFrontMarker" : "changeBackMarker");
        }
    };
    this.getMarkers = function(inFront) {
        return inFront ? this.$frontMarkers : this.$backMarkers;
    };

    this.highlight = function(re) {
        if (!this.$searchHighlight) {
            var highlight = new SearchHighlight(null, "ace_selected-word", "text");
            this.$searchHighlight = this.addDynamicMarker(highlight);
        }
        this.$searchHighlight.setRegexp(re);
    };
    this.highlightLines = function(startRow, endRow, clazz, inFront) {
        if (typeof endRow != "number") {
            clazz = endRow;
            endRow = startRow;
        }
        if (!clazz)
            clazz = "ace_step";

        var range = new Range(startRow, 0, endRow, Infinity);
        range.id = this.addMarker(range, clazz, "fullLine", inFront);
        return range;
    };
    this.setAnnotations = function(annotations) {
        this.$annotations = annotations;
        this._signal("changeAnnotation", {});
    };
    this.getAnnotations = function() {
        return this.$annotations || [];
    };
    this.clearAnnotations = function() {
        this.setAnnotations([]);
    };
    this.$detectNewLine = function(text) {
        var match = text.match(/^.*?(\r?\n)/m);
        if (match) {
            this.$autoNewLine = match[1];
        } else {
            this.$autoNewLine = "\n";
        }
    };
    this.getWordRange = function(row, column) {
        var line = this.getLine(row);

        var inToken = false;
        if (column > 0)
            inToken = !!line.charAt(column - 1).match(this.tokenRe);

        if (!inToken)
            inToken = !!line.charAt(column).match(this.tokenRe);

        if (inToken)
            var re = this.tokenRe;
        else if (/^\s+$/.test(line.slice(column-1, column+1)))
            var re = /\s/;
        else
            var re = this.nonTokenRe;

        var start = column;
        if (start > 0) {
            do {
                start--;
            }
            while (start >= 0 && line.charAt(start).match(re));
            start++;
        }

        var end = column;
        while (end < line.length && line.charAt(end).match(re)) {
            end++;
        }

        return new Range(row, start, row, end);
    };
    this.getAWordRange = function(row, column) {
        var wordRange = this.getWordRange(row, column);
        var line = this.getLine(wordRange.end.row);

        while (line.charAt(wordRange.end.column).match(/[ \t]/)) {
            wordRange.end.column += 1;
        }
        return wordRange;
    };
    this.setNewLineMode = function(newLineMode) {
        this.doc.setNewLineMode(newLineMode);
    };
    this.getNewLineMode = function() {
        return this.doc.getNewLineMode();
    };
    this.setUseWorker = function(useWorker) { this.setOption("useWorker", useWorker); };
    this.getUseWorker = function() { return this.$useWorker; };
    this.onReloadTokenizer = function(e) {
        var rows = e.data;
        this.bgTokenizer.start(rows.first);
        this._signal("tokenizerUpdate", e);
    };

    this.$modes = {};
    this.$mode = null;
    this.$modeId = null;
    this.setMode = function(mode, cb) {
        if (mode && typeof mode === "object") {
            if (mode.getTokenizer)
                return this.$onChangeMode(mode);
            var options = mode;
            var path = options.path;
        } else {
            path = mode || "ace/mode/text";
        }
        if (!this.$modes["ace/mode/text"])
            this.$modes["ace/mode/text"] = new TextMode();

        if (this.$modes[path] && !options) {
            this.$onChangeMode(this.$modes[path]);
            cb && cb();
            return;
        }
        this.$modeId = path;
        config.loadModule(["mode", path], function(m) {
            if (this.$modeId !== path)
                return cb && cb();
            if (this.$modes[path] && !options)
                return this.$onChangeMode(this.$modes[path]);
            if (m && m.Mode) {
                m = new m.Mode(options);
                if (!options) {
                    this.$modes[path] = m;
                    m.$id = path;
                }
                this.$onChangeMode(m);
                cb && cb();
            }
        }.bind(this));
        if (!this.$mode)
            this.$onChangeMode(this.$modes["ace/mode/text"], true);
    };

    this.$onChangeMode = function(mode, $isPlaceholder) {
        if (!$isPlaceholder)
            this.$modeId = mode.$id;
        if (this.$mode === mode) 
            return;

        this.$mode = mode;

        this.$stopWorker();

        if (this.$useWorker)
            this.$startWorker();

        var tokenizer = mode.getTokenizer();

        if(tokenizer.addEventListener !== undefined) {
            var onReloadTokenizer = this.onReloadTokenizer.bind(this);
            tokenizer.addEventListener("update", onReloadTokenizer);
        }

        if (!this.bgTokenizer) {
            this.bgTokenizer = new BackgroundTokenizer(tokenizer);
            var _self = this;
            this.bgTokenizer.addEventListener("update", function(e) {
                _self._signal("tokenizerUpdate", e);
            });
        } else {
            this.bgTokenizer.setTokenizer(tokenizer);
        }

        this.bgTokenizer.setDocument(this.getDocument());

        this.tokenRe = mode.tokenRe;
        this.nonTokenRe = mode.nonTokenRe;

        
        if (!$isPlaceholder) {
            if (mode.attachToSession)
                mode.attachToSession(this);
            this.$options.wrapMethod.set.call(this, this.$wrapMethod);
            this.$setFolding(mode.foldingRules);
            this.bgTokenizer.start(0);
            this._emit("changeMode");
        }
    };

    this.$stopWorker = function() {
        if (this.$worker) {
            this.$worker.terminate();
            this.$worker = null;
        }
    };

    this.$startWorker = function() {
        try {
            this.$worker = this.$mode.createWorker(this);
        } catch (e) {
            if (typeof console == "object") {
                console.log("Could not load worker");
                console.log(e);
            }    
            this.$worker = null;
        }
    };
    this.getMode = function() {
        return this.$mode;
    };

    this.$scrollTop = 0;
    this.setScrollTop = function(scrollTop) {
        if (this.$scrollTop === scrollTop || isNaN(scrollTop))
            return;

        this.$scrollTop = scrollTop;
        this._signal("changeScrollTop", scrollTop);
    };
    this.getScrollTop = function() {
        return this.$scrollTop;
    };

    this.$scrollLeft = 0;
    this.setScrollLeft = function(scrollLeft) {
        if (this.$scrollLeft === scrollLeft || isNaN(scrollLeft))
            return;

        this.$scrollLeft = scrollLeft;
        this._signal("changeScrollLeft", scrollLeft);
    };
    this.getScrollLeft = function() {
        return this.$scrollLeft;
    };
    this.getScreenWidth = function() {
        this.$computeWidth();
        if (this.lineWidgets) 
            return Math.max(this.getLineWidgetMaxWidth(), this.screenWidth);
        return this.screenWidth;
    };
    
    this.getLineWidgetMaxWidth = function() {
        if (this.lineWidgetsWidth != null) return this.lineWidgetsWidth;
        var width = 0;
        this.lineWidgets.forEach(function(w) {
            if (w && w.screenWidth > width)
                width = w.screenWidth;
        });
        return this.lineWidgetWidth = width;
    };

    this.$computeWidth = function(force) {
        if (this.$modified || force) {
            this.$modified = false;

            if (this.$useWrapMode)
                return this.screenWidth = this.$wrapLimit;

            var lines = this.doc.getAllLines();
            var cache = this.$rowLengthCache;
            var longestScreenLine = 0;
            var foldIndex = 0;
            var foldLine = this.$foldData[foldIndex];
            var foldStart = foldLine ? foldLine.start.row : Infinity;
            var len = lines.length;

            for (var i = 0; i < len; i++) {
                if (i > foldStart) {
                    i = foldLine.end.row + 1;
                    if (i >= len)
                        break;
                    foldLine = this.$foldData[foldIndex++];
                    foldStart = foldLine ? foldLine.start.row : Infinity;
                }

                if (cache[i] == null)
                    cache[i] = this.$getStringScreenWidth(lines[i])[0];

                if (cache[i] > longestScreenLine)
                    longestScreenLine = cache[i];
            }
            this.screenWidth = longestScreenLine;
        }
    };
    this.getLine = function(row) {
        return this.doc.getLine(row);
    };
    this.getLines = function(firstRow, lastRow) {
        return this.doc.getLines(firstRow, lastRow);
    };
    this.getLength = function() {
        return this.doc.getLength();
    };
    this.getTextRange = function(range) {
        return this.doc.getTextRange(range || this.selection.getRange());
    };
    this.insert = function(position, text) {
        return this.doc.insert(position, text);
    };
    this.remove = function(range) {
        return this.doc.remove(range);
    };
    this.undoChanges = function(deltas, dontSelect) {
        if (!deltas.length)
            return;

        this.$fromUndo = true;
        var lastUndoRange = null;
        for (var i = deltas.length - 1; i != -1; i--) {
            var delta = deltas[i];
            if (delta.group == "doc") {
                this.doc.revertDeltas(delta.deltas);
                lastUndoRange =
                    this.$getUndoSelection(delta.deltas, true, lastUndoRange);
            } else {
                delta.deltas.forEach(function(foldDelta) {
                    this.addFolds(foldDelta.folds);
                }, this);
            }
        }
        this.$fromUndo = false;
        lastUndoRange &&
            this.$undoSelect &&
            !dontSelect &&
            this.selection.setSelectionRange(lastUndoRange);
        return lastUndoRange;
    };
    this.redoChanges = function(deltas, dontSelect) {
        if (!deltas.length)
            return;

        this.$fromUndo = true;
        var lastUndoRange = null;
        for (var i = 0; i < deltas.length; i++) {
            var delta = deltas[i];
            if (delta.group == "doc") {
                this.doc.applyDeltas(delta.deltas);
                lastUndoRange =
                    this.$getUndoSelection(delta.deltas, false, lastUndoRange);
            }
        }
        this.$fromUndo = false;
        lastUndoRange &&
            this.$undoSelect &&
            !dontSelect &&
            this.selection.setSelectionRange(lastUndoRange);
        return lastUndoRange;
    };
    this.setUndoSelect = function(enable) {
        this.$undoSelect = enable;
    };

    this.$getUndoSelection = function(deltas, isUndo, lastUndoRange) {
        function isInsert(delta) {
            var insert =
                delta.action === "insertText" || delta.action === "insertLines";
            return isUndo ? !insert : insert;
        }

        var delta = deltas[0];
        var range, point;
        var lastDeltaIsInsert = false;
        if (isInsert(delta)) {
            range = Range.fromPoints(delta.range.start, delta.range.end);
            lastDeltaIsInsert = true;
        } else {
            range = Range.fromPoints(delta.range.start, delta.range.start);
            lastDeltaIsInsert = false;
        }

        for (var i = 1; i < deltas.length; i++) {
            delta = deltas[i];
            if (isInsert(delta)) {
                point = delta.range.start;
                if (range.compare(point.row, point.column) == -1) {
                    range.setStart(delta.range.start);
                }
                point = delta.range.end;
                if (range.compare(point.row, point.column) == 1) {
                    range.setEnd(delta.range.end);
                }
                lastDeltaIsInsert = true;
            } else {
                point = delta.range.start;
                if (range.compare(point.row, point.column) == -1) {
                    range =
                        Range.fromPoints(delta.range.start, delta.range.start);
                }
                lastDeltaIsInsert = false;
            }
        }
        if (lastUndoRange != null) {
            if (Range.comparePoints(lastUndoRange.start, range.start) === 0) {
                lastUndoRange.start.column += range.end.column - range.start.column;
                lastUndoRange.end.column += range.end.column - range.start.column;
            }

            var cmp = lastUndoRange.compareRange(range);
            if (cmp == 1) {
                range.setStart(lastUndoRange.start);
            } else if (cmp == -1) {
                range.setEnd(lastUndoRange.end);
            }
        }

        return range;
    };
    this.replace = function(range, text) {
        return this.doc.replace(range, text);
    };
    this.moveText = function(fromRange, toPosition, copy) {
        var text = this.getTextRange(fromRange);
        var folds = this.getFoldsInRange(fromRange);

        var toRange = Range.fromPoints(toPosition, toPosition);
        if (!copy) {
            this.remove(fromRange);
            var rowDiff = fromRange.start.row - fromRange.end.row;
            var collDiff = rowDiff ? -fromRange.end.column : fromRange.start.column - fromRange.end.column;
            if (collDiff) {
                if (toRange.start.row == fromRange.end.row && toRange.start.column > fromRange.end.column)
                    toRange.start.column += collDiff;
                if (toRange.end.row == fromRange.end.row && toRange.end.column > fromRange.end.column)
                    toRange.end.column += collDiff;
            }
            if (rowDiff && toRange.start.row >= fromRange.end.row) {
                toRange.start.row += rowDiff;
                toRange.end.row += rowDiff;
            }
        }

        toRange.end = this.insert(toRange.start, text);
        if (folds.length) {
            var oldStart = fromRange.start;
            var newStart = toRange.start;
            var rowDiff = newStart.row - oldStart.row;
            var collDiff = newStart.column - oldStart.column;
            this.addFolds(folds.map(function(x) {
                x = x.clone();
                if (x.start.row == oldStart.row)
                    x.start.column += collDiff;
                if (x.end.row == oldStart.row)
                    x.end.column += collDiff;
                x.start.row += rowDiff;
                x.end.row += rowDiff;
                return x;
            }));
        }

        return toRange;
    };
    this.indentRows = function(startRow, endRow, indentString) {
        indentString = indentString.replace(/\t/g, this.getTabString());
        for (var row=startRow; row<=endRow; row++)
            this.insert({row: row, column:0}, indentString);
    };
    this.outdentRows = function (range) {
        var rowRange = range.collapseRows();
        var deleteRange = new Range(0, 0, 0, 0);
        var size = this.getTabSize();

        for (var i = rowRange.start.row; i <= rowRange.end.row; ++i) {
            var line = this.getLine(i);

            deleteRange.start.row = i;
            deleteRange.end.row = i;
            for (var j = 0; j < size; ++j)
                if (line.charAt(j) != ' ')
                    break;
            if (j < size && line.charAt(j) == '\t') {
                deleteRange.start.column = j;
                deleteRange.end.column = j + 1;
            } else {
                deleteRange.start.column = 0;
                deleteRange.end.column = j;
            }
            this.remove(deleteRange);
        }
    };

    this.$moveLines = function(firstRow, lastRow, dir) {
        firstRow = this.getRowFoldStart(firstRow);
        lastRow = this.getRowFoldEnd(lastRow);
        if (dir < 0) {
            var row = this.getRowFoldStart(firstRow + dir);
            if (row < 0) return 0;
            var diff = row-firstRow;
        } else if (dir > 0) {
            var row = this.getRowFoldEnd(lastRow + dir);
            if (row > this.doc.getLength()-1) return 0;
            var diff = row-lastRow;
        } else {
            firstRow = this.$clipRowToDocument(firstRow);
            lastRow = this.$clipRowToDocument(lastRow);
            var diff = lastRow - firstRow + 1;
        }

        var range = new Range(firstRow, 0, lastRow, Number.MAX_VALUE);
        var folds = this.getFoldsInRange(range).map(function(x){
            x = x.clone();
            x.start.row += diff;
            x.end.row += diff;
            return x;
        });

        var lines = dir == 0
            ? this.doc.getLines(firstRow, lastRow)
            : this.doc.removeLines(firstRow, lastRow);
        this.doc.insertLines(firstRow+diff, lines);
        folds.length && this.addFolds(folds);
        return diff;
    };
    this.moveLinesUp = function(firstRow, lastRow) {
        return this.$moveLines(firstRow, lastRow, -1);
    };
    this.moveLinesDown = function(firstRow, lastRow) {
        return this.$moveLines(firstRow, lastRow, 1);
    };
    this.duplicateLines = function(firstRow, lastRow) {
        return this.$moveLines(firstRow, lastRow, 0);
    };


    this.$clipRowToDocument = function(row) {
        return Math.max(0, Math.min(row, this.doc.getLength()-1));
    };

    this.$clipColumnToRow = function(row, column) {
        if (column < 0)
            return 0;
        return Math.min(this.doc.getLine(row).length, column);
    };


    this.$clipPositionToDocument = function(row, column) {
        column = Math.max(0, column);

        if (row < 0) {
            row = 0;
            column = 0;
        } else {
            var len = this.doc.getLength();
            if (row >= len) {
                row = len - 1;
                column = this.doc.getLine(len-1).length;
            } else {
                column = Math.min(this.doc.getLine(row).length, column);
            }
        }

        return {
            row: row,
            column: column
        };
    };

    this.$clipRangeToDocument = function(range) {
        if (range.start.row < 0) {
            range.start.row = 0;
            range.start.column = 0;
        } else {
            range.start.column = this.$clipColumnToRow(
                range.start.row,
                range.start.column
            );
        }

        var len = this.doc.getLength() - 1;
        if (range.end.row > len) {
            range.end.row = len;
            range.end.column = this.doc.getLine(len).length;
        } else {
            range.end.column = this.$clipColumnToRow(
                range.end.row,
                range.end.column
            );
        }
        return range;
    };
    this.$wrapLimit = 80;
    this.$useWrapMode = false;
    this.$wrapLimitRange = {
        min : null,
        max : null
    };
    this.setUseWrapMode = function(useWrapMode) {
        if (useWrapMode != this.$useWrapMode) {
            this.$useWrapMode = useWrapMode;
            this.$modified = true;
            this.$resetRowCache(0);
            if (useWrapMode) {
                var len = this.getLength();
                this.$wrapData = Array(len);
                this.$updateWrapData(0, len - 1);
            }

            this._signal("changeWrapMode");
        }
    };
    this.getUseWrapMode = function() {
        return this.$useWrapMode;
    };
    this.setWrapLimitRange = function(min, max) {
        if (this.$wrapLimitRange.min !== min || this.$wrapLimitRange.max !== max) {
            this.$wrapLimitRange = {
                min: min,
                max: max
            };
            this.$modified = true;
            this._signal("changeWrapMode");
        }
    };
    this.adjustWrapLimit = function(desiredLimit, $printMargin) {
        var limits = this.$wrapLimitRange;
        if (limits.max < 0)
            limits = {min: $printMargin, max: $printMargin};
        var wrapLimit = this.$constrainWrapLimit(desiredLimit, limits.min, limits.max);
        if (wrapLimit != this.$wrapLimit && wrapLimit > 1) {
            this.$wrapLimit = wrapLimit;
            this.$modified = true;
            if (this.$useWrapMode) {
                this.$updateWrapData(0, this.getLength() - 1);
                this.$resetRowCache(0);
                this._signal("changeWrapLimit");
            }
            return true;
        }
        return false;
    };

    this.$constrainWrapLimit = function(wrapLimit, min, max) {
        if (min)
            wrapLimit = Math.max(min, wrapLimit);

        if (max)
            wrapLimit = Math.min(max, wrapLimit);

        return wrapLimit;
    };
    this.getWrapLimit = function() {
        return this.$wrapLimit;
    };
    this.setWrapLimit = function (limit) {
        this.setWrapLimitRange(limit, limit);
    };
    this.getWrapLimitRange = function() {
        return {
            min : this.$wrapLimitRange.min,
            max : this.$wrapLimitRange.max
        };
    };

    this.$updateInternalDataOnChange = function(e) {
        var useWrapMode = this.$useWrapMode;
        var len;
        var action = e.data.action;
        var firstRow = e.data.range.start.row;
        var lastRow = e.data.range.end.row;
        var start = e.data.range.start;
        var end = e.data.range.end;
        var removedFolds = null;

        if (action.indexOf("Lines") != -1) {
            if (action == "insertLines") {
                lastRow = firstRow + (e.data.lines.length);
            } else {
                lastRow = firstRow;
            }
            len = e.data.lines ? e.data.lines.length : lastRow - firstRow;
        } else {
            len = lastRow - firstRow;
        }

        this.$updating = true;
        if (len != 0) {
            if (action.indexOf("remove") != -1) {
                this[useWrapMode ? "$wrapData" : "$rowLengthCache"].splice(firstRow, len);

                var foldLines = this.$foldData;
                removedFolds = this.getFoldsInRange(e.data.range);
                this.removeFolds(removedFolds);

                var foldLine = this.getFoldLine(end.row);
                var idx = 0;
                if (foldLine) {
                    foldLine.addRemoveChars(end.row, end.column, start.column - end.column);
                    foldLine.shiftRow(-len);

                    var foldLineBefore = this.getFoldLine(firstRow);
                    if (foldLineBefore && foldLineBefore !== foldLine) {
                        foldLineBefore.merge(foldLine);
                        foldLine = foldLineBefore;
                    }
                    idx = foldLines.indexOf(foldLine) + 1;
                }

                for (idx; idx < foldLines.length; idx++) {
                    var foldLine = foldLines[idx];
                    if (foldLine.start.row >= end.row) {
                        foldLine.shiftRow(-len);
                    }
                }

                lastRow = firstRow;
            } else {
                var args = Array(len);
                args.unshift(firstRow, 0);
                var arr = useWrapMode ? this.$wrapData : this.$rowLengthCache
                arr.splice.apply(arr, args);
                var foldLines = this.$foldData;
                var foldLine = this.getFoldLine(firstRow);
                var idx = 0;
                if (foldLine) {
                    var cmp = foldLine.range.compareInside(start.row, start.column);
                    if (cmp == 0) {
                        foldLine = foldLine.split(start.row, start.column);
                        if (foldLine) {
                            foldLine.shiftRow(len);
                            foldLine.addRemoveChars(lastRow, 0, end.column - start.column);
                        }
                    } else
                    if (cmp == -1) {
                        foldLine.addRemoveChars(firstRow, 0, end.column - start.column);
                        foldLine.shiftRow(len);
                    }
                    idx = foldLines.indexOf(foldLine) + 1;
                }

                for (idx; idx < foldLines.length; idx++) {
                    var foldLine = foldLines[idx];
                    if (foldLine.start.row >= firstRow) {
                        foldLine.shiftRow(len);
                    }
                }
            }
        } else {
            len = Math.abs(e.data.range.start.column - e.data.range.end.column);
            if (action.indexOf("remove") != -1) {
                removedFolds = this.getFoldsInRange(e.data.range);
                this.removeFolds(removedFolds);

                len = -len;
            }
            var foldLine = this.getFoldLine(firstRow);
            if (foldLine) {
                foldLine.addRemoveChars(firstRow, start.column, len);
            }
        }

        if (useWrapMode && this.$wrapData.length != this.doc.getLength()) {
            console.error("doc.getLength() and $wrapData.length have to be the same!");
        }
        this.$updating = false;

        if (useWrapMode)
            this.$updateWrapData(firstRow, lastRow);
        else
            this.$updateRowLengthCache(firstRow, lastRow);

        return removedFolds;
    };

    this.$updateRowLengthCache = function(firstRow, lastRow, b) {
        this.$rowLengthCache[firstRow] = null;
        this.$rowLengthCache[lastRow] = null;
    };

    this.$updateWrapData = function(firstRow, lastRow) {
        var lines = this.doc.getAllLines();
        var tabSize = this.getTabSize();
        var wrapData = this.$wrapData;
        var wrapLimit = this.$wrapLimit;
        var tokens;
        var foldLine;

        var row = firstRow;
        lastRow = Math.min(lastRow, lines.length - 1);
        while (row <= lastRow) {
            foldLine = this.getFoldLine(row, foldLine);
            if (!foldLine) {
                tokens = this.$getDisplayTokens(lines[row]);
                wrapData[row] = this.$computeWrapSplits(tokens, wrapLimit, tabSize);
                row ++;
            } else {
                tokens = [];
                foldLine.walk(function(placeholder, row, column, lastColumn) {
                        var walkTokens;
                        if (placeholder != null) {
                            walkTokens = this.$getDisplayTokens(
                                            placeholder, tokens.length);
                            walkTokens[0] = PLACEHOLDER_START;
                            for (var i = 1; i < walkTokens.length; i++) {
                                walkTokens[i] = PLACEHOLDER_BODY;
                            }
                        } else {
                            walkTokens = this.$getDisplayTokens(
                                lines[row].substring(lastColumn, column),
                                tokens.length);
                        }
                        tokens = tokens.concat(walkTokens);
                    }.bind(this),
                    foldLine.end.row,
                    lines[foldLine.end.row].length + 1
                );

                wrapData[foldLine.start.row] = this.$computeWrapSplits(tokens, wrapLimit, tabSize);
                row = foldLine.end.row + 1;
            }
        }
    };
    var CHAR = 1,
        CHAR_EXT = 2,
        PLACEHOLDER_START = 3,
        PLACEHOLDER_BODY =  4,
        PUNCTUATION = 9,
        SPACE = 10,
        TAB = 11,
        TAB_SPACE = 12;


    this.$computeWrapSplits = function(tokens, wrapLimit) {
        if (tokens.length == 0) {
            return [];
        }

        var splits = [];
        var displayLength = tokens.length;
        var lastSplit = 0, lastDocSplit = 0;

        var isCode = this.$wrapAsCode;

        function addSplit(screenPos) {
            var displayed = tokens.slice(lastSplit, screenPos);
            var len = displayed.length;
            displayed.join("").
                replace(/12/g, function() {
                    len -= 1;
                }).
                replace(/2/g, function() {
                    len -= 1;
                });

            lastDocSplit += len;
            splits.push(lastDocSplit);
            lastSplit = screenPos;
        }

        while (displayLength - lastSplit > wrapLimit) {
            var split = lastSplit + wrapLimit;
            if (tokens[split - 1] >= SPACE && tokens[split] >= SPACE) {
                addSplit(split);
                continue;
            }
            if (tokens[split] == PLACEHOLDER_START || tokens[split] == PLACEHOLDER_BODY) {
                for (split; split != lastSplit - 1; split--) {
                    if (tokens[split] == PLACEHOLDER_START) {
                        break;
                    }
                }
                if (split > lastSplit) {
                    addSplit(split);
                    continue;
                }
                split = lastSplit + wrapLimit;
                for (split; split < tokens.length; split++) {
                    if (tokens[split] != PLACEHOLDER_BODY) {
                        break;
                    }
                }
                if (split == tokens.length) {
                    break;  // Breaks the while-loop.
                }
                addSplit(split);
                continue;
            }
            var minSplit = Math.max(split - (isCode ? 10 : wrapLimit-(wrapLimit>>2)), lastSplit - 1);
            while (split > minSplit && tokens[split] < PLACEHOLDER_START) {
                split --;
            }
            if (isCode) {
                while (split > minSplit && tokens[split] < PLACEHOLDER_START) {
                    split --;
                }
                while (split > minSplit && tokens[split] == PUNCTUATION) {
                    split --;
                }
            } else {
                while (split > minSplit && tokens[split] < SPACE) {
                    split --;
                }
            }
            if (split > minSplit) {
                addSplit(++split);
                continue;
            }
            split = lastSplit + wrapLimit;
            if (tokens[split] == CHAR_EXT)
                split--;
            addSplit(split);
        }
        return splits;
    };
    this.$getDisplayTokens = function(str, offset) {
        var arr = [];
        var tabSize;
        offset = offset || 0;

        for (var i = 0; i < str.length; i++) {
            var c = str.charCodeAt(i);
            if (c == 9) {
                tabSize = this.getScreenTabSize(arr.length + offset);
                arr.push(TAB);
                for (var n = 1; n < tabSize; n++) {
                    arr.push(TAB_SPACE);
                }
            }
            else if (c == 32) {
                arr.push(SPACE);
            } else if((c > 39 && c < 48) || (c > 57 && c < 64)) {
                arr.push(PUNCTUATION);
            }
            else if (c >= 0x1100 && isFullWidth(c)) {
                arr.push(CHAR, CHAR_EXT);
            } else {
                arr.push(CHAR);
            }
        }
        return arr;
    };
    this.$getStringScreenWidth = function(str, maxScreenColumn, screenColumn) {
        if (maxScreenColumn == 0)
            return [0, 0];
        if (maxScreenColumn == null)
            maxScreenColumn = Infinity;
        screenColumn = screenColumn || 0;

        var c, column;
        for (column = 0; column < str.length; column++) {
            c = str.charCodeAt(column);
            if (c == 9) {
                screenColumn += this.getScreenTabSize(screenColumn);
            }
            else if (c >= 0x1100 && isFullWidth(c)) {
                screenColumn += 2;
            } else {
                screenColumn += 1;
            }
            if (screenColumn > maxScreenColumn) {
                break;
            }
        }

        return [screenColumn, column];
    };

    this.lineWidgets = null;
    this.getRowLength = function(row) {
        if (this.lineWidgets)
            var h = this.lineWidgets[row] && this.lineWidgets[row].rowCount || 0;
        else 
            h = 0
        if (!this.$useWrapMode || !this.$wrapData[row]) {
            return 1 + h;
        } else {
            return this.$wrapData[row].length + 1 + h;
        }
    };
    this.getRowLineCount = function(row) {
        if (!this.$useWrapMode || !this.$wrapData[row]) {
            return 1;
        } else {
            return this.$wrapData[row].length + 1;
        }
    };
    this.getScreenLastRowColumn = function(screenRow) {
        var pos = this.screenToDocumentPosition(screenRow, Number.MAX_VALUE);
        return this.documentToScreenColumn(pos.row, pos.column);
    };
    this.getDocumentLastRowColumn = function(docRow, docColumn) {
        var screenRow = this.documentToScreenRow(docRow, docColumn);
        return this.getScreenLastRowColumn(screenRow);
    };
    this.getDocumentLastRowColumnPosition = function(docRow, docColumn) {
        var screenRow = this.documentToScreenRow(docRow, docColumn);
        return this.screenToDocumentPosition(screenRow, Number.MAX_VALUE / 10);
    };
    this.getRowSplitData = function(row) {
        if (!this.$useWrapMode) {
            return undefined;
        } else {
            return this.$wrapData[row];
        }
    };
    this.getScreenTabSize = function(screenColumn) {
        return this.$tabSize - screenColumn % this.$tabSize;
    };


    this.screenToDocumentRow = function(screenRow, screenColumn) {
        return this.screenToDocumentPosition(screenRow, screenColumn).row;
    };


    this.screenToDocumentColumn = function(screenRow, screenColumn) {
        return this.screenToDocumentPosition(screenRow, screenColumn).column;
    };
    this.screenToDocumentPosition = function(screenRow, screenColumn) {
        if (screenRow < 0)
            return {row: 0, column: 0};

        var line;
        var docRow = 0;
        var docColumn = 0;
        var column;
        var row = 0;
        var rowLength = 0;

        var rowCache = this.$screenRowCache;
        var i = this.$getRowCacheIndex(rowCache, screenRow);
        var l = rowCache.length;
        if (l && i >= 0) {
            var row = rowCache[i];
            var docRow = this.$docRowCache[i];
            var doCache = screenRow > rowCache[l - 1];
        } else {
            var doCache = !l;
        }

        var maxRow = this.getLength() - 1;
        var foldLine = this.getNextFoldLine(docRow);
        var foldStart = foldLine ? foldLine.start.row : Infinity;

        while (row <= screenRow) {
            rowLength = this.getRowLength(docRow);
            if (row + rowLength > screenRow || docRow >= maxRow) {
                break;
            } else {
                row += rowLength;
                docRow++;
                if (docRow > foldStart) {
                    docRow = foldLine.end.row+1;
                    foldLine = this.getNextFoldLine(docRow, foldLine);
                    foldStart = foldLine ? foldLine.start.row : Infinity;
                }
            }

            if (doCache) {
                this.$docRowCache.push(docRow);
                this.$screenRowCache.push(row);
            }
        }

        if (foldLine && foldLine.start.row <= docRow) {
            line = this.getFoldDisplayLine(foldLine);
            docRow = foldLine.start.row;
        } else if (row + rowLength <= screenRow || docRow > maxRow) {
            return {
                row: maxRow,
                column: this.getLine(maxRow).length
            };
        } else {
            line = this.getLine(docRow);
            foldLine = null;
        }

        if (this.$useWrapMode) {
            var splits = this.$wrapData[docRow];
            if (splits) {
                var splitIndex = Math.floor(screenRow - row);
                column = splits[splitIndex];
                if(splitIndex > 0 && splits.length) {
                    docColumn = splits[splitIndex - 1] || splits[splits.length - 1];
                    line = line.substring(docColumn);
                }
            }
        }

        docColumn += this.$getStringScreenWidth(line, screenColumn)[1];
        if (this.$useWrapMode && docColumn >= column)
            docColumn = column - 1;

        if (foldLine)
            return foldLine.idxToPosition(docColumn);

        return {row: docRow, column: docColumn};
    };
    this.documentToScreenPosition = function(docRow, docColumn) {
        if (typeof docColumn === "undefined")
            var pos = this.$clipPositionToDocument(docRow.row, docRow.column);
        else
            pos = this.$clipPositionToDocument(docRow, docColumn);

        docRow = pos.row;
        docColumn = pos.column;

        var screenRow = 0;
        var foldStartRow = null;
        var fold = null;
        fold = this.getFoldAt(docRow, docColumn, 1);
        if (fold) {
            docRow = fold.start.row;
            docColumn = fold.start.column;
        }

        var rowEnd, row = 0;


        var rowCache = this.$docRowCache;
        var i = this.$getRowCacheIndex(rowCache, docRow);
        var l = rowCache.length;
        if (l && i >= 0) {
            var row = rowCache[i];
            var screenRow = this.$screenRowCache[i];
            var doCache = docRow > rowCache[l - 1];
        } else {
            var doCache = !l;
        }

        var foldLine = this.getNextFoldLine(row);
        var foldStart = foldLine ?foldLine.start.row :Infinity;

        while (row < docRow) {
            if (row >= foldStart) {
                rowEnd = foldLine.end.row + 1;
                if (rowEnd > docRow)
                    break;
                foldLine = this.getNextFoldLine(rowEnd, foldLine);
                foldStart = foldLine ?foldLine.start.row :Infinity;
            }
            else {
                rowEnd = row + 1;
            }

            screenRow += this.getRowLength(row);
            row = rowEnd;

            if (doCache) {
                this.$docRowCache.push(row);
                this.$screenRowCache.push(screenRow);
            }
        }
        var textLine = "";
        if (foldLine && row >= foldStart) {
            textLine = this.getFoldDisplayLine(foldLine, docRow, docColumn);
            foldStartRow = foldLine.start.row;
        } else {
            textLine = this.getLine(docRow).substring(0, docColumn);
            foldStartRow = docRow;
        }
        if (this.$useWrapMode) {
            var wrapRow = this.$wrapData[foldStartRow];
            if (wrapRow) {
                var screenRowOffset = 0;
                while (textLine.length >= wrapRow[screenRowOffset]) {
                    screenRow ++;
                    screenRowOffset++;
                }
                textLine = textLine.substring(
                    wrapRow[screenRowOffset - 1] || 0, textLine.length
                );
            }
        }

        return {
            row: screenRow,
            column: this.$getStringScreenWidth(textLine)[0]
        };
    };
    this.documentToScreenColumn = function(row, docColumn) {
        return this.documentToScreenPosition(row, docColumn).column;
    };
    this.documentToScreenRow = function(docRow, docColumn) {
        return this.documentToScreenPosition(docRow, docColumn).row;
    };
    this.getScreenLength = function() {
        var screenRows = 0;
        var fold = null;
        if (!this.$useWrapMode) {
            screenRows = this.getLength();
            var foldData = this.$foldData;
            for (var i = 0; i < foldData.length; i++) {
                fold = foldData[i];
                screenRows -= fold.end.row - fold.start.row;
            }
        } else {
            var lastRow = this.$wrapData.length;
            var row = 0, i = 0;
            var fold = this.$foldData[i++];
            var foldStart = fold ? fold.start.row :Infinity;

            while (row < lastRow) {
                var splits = this.$wrapData[row];
                screenRows += splits ? splits.length + 1 : 1;
                row ++;
                if (row > foldStart) {
                    row = fold.end.row+1;
                    fold = this.$foldData[i++];
                    foldStart = fold ?fold.start.row :Infinity;
                }
            }
        }
        if (this.lineWidgets)
            screenRows += this.$getWidgetScreenLength();

        return screenRows;
    };
    this.$setFontMetrics = function(fm) {
    };
    
    this.destroy = function() {
        if (this.bgTokenizer) {
            this.bgTokenizer.setDocument(null);
            this.bgTokenizer = null;
        }
        this.$stopWorker();
    };
    function isFullWidth(c) {
        if (c < 0x1100)
            return false;
        return c >= 0x1100 && c <= 0x115F ||
               c >= 0x11A3 && c <= 0x11A7 ||
               c >= 0x11FA && c <= 0x11FF ||
               c >= 0x2329 && c <= 0x232A ||
               c >= 0x2E80 && c <= 0x2E99 ||
               c >= 0x2E9B && c <= 0x2EF3 ||
               c >= 0x2F00 && c <= 0x2FD5 ||
               c >= 0x2FF0 && c <= 0x2FFB ||
               c >= 0x3000 && c <= 0x303E ||
               c >= 0x3041 && c <= 0x3096 ||
               c >= 0x3099 && c <= 0x30FF ||
               c >= 0x3105 && c <= 0x312D ||
               c >= 0x3131 && c <= 0x318E ||
               c >= 0x3190 && c <= 0x31BA ||
               c >= 0x31C0 && c <= 0x31E3 ||
               c >= 0x31F0 && c <= 0x321E ||
               c >= 0x3220 && c <= 0x3247 ||
               c >= 0x3250 && c <= 0x32FE ||
               c >= 0x3300 && c <= 0x4DBF ||
               c >= 0x4E00 && c <= 0xA48C ||
               c >= 0xA490 && c <= 0xA4C6 ||
               c >= 0xA960 && c <= 0xA97C ||
               c >= 0xAC00 && c <= 0xD7A3 ||
               c >= 0xD7B0 && c <= 0xD7C6 ||
               c >= 0xD7CB && c <= 0xD7FB ||
               c >= 0xF900 && c <= 0xFAFF ||
               c >= 0xFE10 && c <= 0xFE19 ||
               c >= 0xFE30 && c <= 0xFE52 ||
               c >= 0xFE54 && c <= 0xFE66 ||
               c >= 0xFE68 && c <= 0xFE6B ||
               c >= 0xFF01 && c <= 0xFF60 ||
               c >= 0xFFE0 && c <= 0xFFE6;
    };

}).call(EditSession.prototype);

require("./edit_session/folding").Folding.call(EditSession.prototype);
require("./edit_session/bracket_match").BracketMatch.call(EditSession.prototype);


config.defineOptions(EditSession.prototype, "session", {
    wrap: {
        set: function(value) {
            if (!value || value == "off")
                value = false;
            else if (value == "free")
                value = true;
            else if (value == "printMargin")
                value = -1;
            else if (typeof value == "string")
                value = parseInt(value, 10) || false;

            if (this.$wrap == value)
                return;
            if (!value) {
                this.setUseWrapMode(false);
            } else {
                var col = typeof value == "number" ? value : null;
                this.setWrapLimitRange(col, col);
                this.setUseWrapMode(true);
            }
            this.$wrap = value;
        },
        get: function() {
            if (this.getUseWrapMode()) {
                if (this.$wrap == -1)
                    return "printMargin";
                if (!this.getWrapLimitRange().min)
                    return "free";
                return this.$wrap;
            }
            return "off";
        },
        handlesSet: true
    },    
    wrapMethod: {
        set: function(val) {
            val = val == "auto"
                ? this.$mode.type != "text"
                : val != "text";
            if (val != this.$wrapAsCode) {
                this.$wrapAsCode = val;
                if (this.$useWrapMode) {
                    this.$modified = true;
                    this.$resetRowCache(0);
                    this.$updateWrapData(0, this.getLength() - 1);
                }
            }
        },
        initialValue: "auto"
    },
    firstLineNumber: {
        set: function() {this._signal("changeBreakpoint");},
        initialValue: 1
    },
    useWorker: {
        set: function(useWorker) {
            this.$useWorker = useWorker;

            this.$stopWorker();
            if (useWorker)
                this.$startWorker();
        },
        initialValue: true
    },
    useSoftTabs: {initialValue: true},
    tabSize: {
        set: function(tabSize) {
            if (isNaN(tabSize) || this.$tabSize === tabSize) return;

            this.$modified = true;
            this.$rowLengthCache = [];
            this.$tabSize = tabSize;
            this._signal("changeTabSize");
        },
        initialValue: 4,
        handlesSet: true
    },
    overwrite: {
        set: function(val) {this._signal("changeOverwrite");},
        initialValue: false
    },
    newLineMode: {
        set: function(val) {this.doc.setNewLineMode(val)},
        get: function() {return this.doc.getNewLineMode()},
        handlesSet: true
    },
    mode: {
        set: function(val) { this.setMode(val) },
        get: function() { return this.$modeId }
    }
});

exports.EditSession = EditSession;
});

ace.define("ace/search",["require","exports","module","ace/lib/lang","ace/lib/oop","ace/range"], function(require, exports, module) {
"use strict";

var lang = require("./lib/lang");
var oop = require("./lib/oop");
var Range = require("./range").Range;

var Search = function() {
    this.$options = {};
};

(function() {
    this.set = function(options) {
        oop.mixin(this.$options, options);
        return this;
    };
    this.getOptions = function() {
        return lang.copyObject(this.$options);
    };
    this.setOptions = function(options) {
        this.$options = options;
    };
    this.find = function(session) {
        var iterator = this.$matchIterator(session, this.$options);

        if (!iterator)
            return false;

        var firstRange = null;
        iterator.forEach(function(range, row, offset) {
            if (!range.start) {
                var column = range.offset + (offset || 0);
                firstRange = new Range(row, column, row, column+range.length);
            } else
                firstRange = range;
            return true;
        });

        return firstRange;
    };
    this.findAll = function(session) {
        var options = this.$options;
        if (!options.needle)
            return [];
        this.$assembleRegExp(options);

        var range = options.range;
        var lines = range
            ? session.getLines(range.start.row, range.end.row)
            : session.doc.getAllLines();

        var ranges = [];
        var re = options.re;
        if (options.$isMultiLine) {
            var len = re.length;
            var maxRow = lines.length - len;
            var prevRange;
            outer: for (var row = re.offset || 0; row <= maxRow; row++) {
                for (var j = 0; j < len; j++)
                    if (lines[row + j].search(re[j]) == -1)
                        continue outer;
                
                var startLine = lines[row];
                var line = lines[row + len - 1];
                var startIndex = startLine.length - startLine.match(re[0])[0].length;
                var endIndex = line.match(re[len - 1])[0].length;
                
                if (prevRange && prevRange.end.row === row &&
                    prevRange.end.column > startIndex
                ) {
                    continue;
                }
                ranges.push(prevRange = new Range(
                    row, startIndex, row + len - 1, endIndex
                ));
                if (len > 2)
                    row = row + len - 2;
            }
        } else {
            for (var i = 0; i < lines.length; i++) {
                var matches = lang.getMatchOffsets(lines[i], re);
                for (var j = 0; j < matches.length; j++) {
                    var match = matches[j];
                    ranges.push(new Range(i, match.offset, i, match.offset + match.length));
                }
            }
        }

        if (range) {
            var startColumn = range.start.column;
            var endColumn = range.start.column;
            var i = 0, j = ranges.length - 1;
            while (i < j && ranges[i].start.column < startColumn && ranges[i].start.row == range.start.row)
                i++;

            while (i < j && ranges[j].end.column > endColumn && ranges[j].end.row == range.end.row)
                j--;
            
            ranges = ranges.slice(i, j + 1);
            for (i = 0, j = ranges.length; i < j; i++) {
                ranges[i].start.row += range.start.row;
                ranges[i].end.row += range.start.row;
            }
        }

        return ranges;
    };
    this.replace = function(input, replacement) {
        var options = this.$options;

        var re = this.$assembleRegExp(options);
        if (options.$isMultiLine)
            return replacement;

        if (!re)
            return;

        var match = re.exec(input);
        if (!match || match[0].length != input.length)
            return null;
        
        replacement = input.replace(re, replacement);
        if (options.preserveCase) {
            replacement = replacement.split("");
            for (var i = Math.min(input.length, input.length); i--; ) {
                var ch = input[i];
                if (ch && ch.toLowerCase() != ch)
                    replacement[i] = replacement[i].toUpperCase();
                else
                    replacement[i] = replacement[i].toLowerCase();
            }
            replacement = replacement.join("");
        }
        
        return replacement;
    };

    this.$matchIterator = function(session, options) {
        var re = this.$assembleRegExp(options);
        if (!re)
            return false;

        var self = this, callback, backwards = options.backwards;

        if (options.$isMultiLine) {
            var len = re.length;
            var matchIterator = function(line, row, offset) {
                var startIndex = line.search(re[0]);
                if (startIndex == -1)
                    return;
                for (var i = 1; i < len; i++) {
                    line = session.getLine(row + i);
                    if (line.search(re[i]) == -1)
                        return;
                }

                var endIndex = line.match(re[len - 1])[0].length;

                var range = new Range(row, startIndex, row + len - 1, endIndex);
                if (re.offset == 1) {
                    range.start.row--;
                    range.start.column = Number.MAX_VALUE;
                } else if (offset)
                    range.start.column += offset;

                if (callback(range))
                    return true;
            };
        } else if (backwards) {
            var matchIterator = function(line, row, startIndex) {
                var matches = lang.getMatchOffsets(line, re);
                for (var i = matches.length-1; i >= 0; i--)
                    if (callback(matches[i], row, startIndex))
                        return true;
            };
        } else {
            var matchIterator = function(line, row, startIndex) {
                var matches = lang.getMatchOffsets(line, re);
                for (var i = 0; i < matches.length; i++)
                    if (callback(matches[i], row, startIndex))
                        return true;
            };
        }

        return {
            forEach: function(_callback) {
                callback = _callback;
                self.$lineIterator(session, options).forEach(matchIterator);
            }
        };
    };

    this.$assembleRegExp = function(options, $disableFakeMultiline) {
        if (options.needle instanceof RegExp)
            return options.re = options.needle;

        var needle = options.needle;

        if (!options.needle)
            return options.re = false;

        if (!options.regExp)
            needle = lang.escapeRegExp(needle);

        if (options.wholeWord)
            needle = "\\b" + needle + "\\b";

        var modifier = options.caseSensitive ? "gm" : "gmi";

        options.$isMultiLine = !$disableFakeMultiline && /[\n\r]/.test(needle);
        if (options.$isMultiLine)
            return options.re = this.$assembleMultilineRegExp(needle, modifier);

        try {
            var re = new RegExp(needle, modifier);
        } catch(e) {
            re = false;
        }
        return options.re = re;
    };

    this.$assembleMultilineRegExp = function(needle, modifier) {
        var parts = needle.replace(/\r\n|\r|\n/g, "$\n^").split("\n");
        var re = [];
        for (var i = 0; i < parts.length; i++) try {
            re.push(new RegExp(parts[i], modifier));
        } catch(e) {
            return false;
        }
        if (parts[0] == "") {
            re.shift();
            re.offset = 1;
        } else {
            re.offset = 0;
        }
        return re;
    };

    this.$lineIterator = function(session, options) {
        var backwards = options.backwards == true;
        var skipCurrent = options.skipCurrent != false;

        var range = options.range;
        var start = options.start;
        if (!start)
            start = range ? range[backwards ? "end" : "start"] : session.selection.getRange();
         
        if (start.start)
            start = start[skipCurrent != backwards ? "end" : "start"];

        var firstRow = range ? range.start.row : 0;
        var lastRow = range ? range.end.row : session.getLength() - 1;

        var forEach = backwards ? function(callback) {
                var row = start.row;

                var line = session.getLine(row).substring(0, start.column);
                if (callback(line, row))
                    return;

                for (row--; row >= firstRow; row--)
                    if (callback(session.getLine(row), row))
                        return;

                if (options.wrap == false)
                    return;

                for (row = lastRow, firstRow = start.row; row >= firstRow; row--)
                    if (callback(session.getLine(row), row))
                        return;
            } : function(callback) {
                var row = start.row;

                var line = session.getLine(row).substr(start.column);
                if (callback(line, row, start.column))
                    return;

                for (row = row+1; row <= lastRow; row++)
                    if (callback(session.getLine(row), row))
                        return;

                if (options.wrap == false)
                    return;

                for (row = firstRow, lastRow = start.row; row <= lastRow; row++)
                    if (callback(session.getLine(row), row))
                        return;
            };
        
        return {forEach: forEach};
    };

}).call(Search.prototype);

exports.Search = Search;
});

ace.define("ace/keyboard/hash_handler",["require","exports","module","ace/lib/keys","ace/lib/useragent"], function(require, exports, module) {
"use strict";

var keyUtil = require("../lib/keys");
var useragent = require("../lib/useragent");
var KEY_MODS = keyUtil.KEY_MODS;

function HashHandler(config, platform) {
    this.platform = platform || (useragent.isMac ? "mac" : "win");
    this.commands = {};
    this.commandKeyBinding = {};
    this.addCommands(config);
    this.$singleCommand = true;
}

function MultiHashHandler(config, platform) {
    HashHandler.call(this, config, platform);
    this.$singleCommand = false;
}

MultiHashHandler.prototype = HashHandler.prototype;

(function() {
    

    this.addCommand = function(command) {
        if (this.commands[command.name])
            this.removeCommand(command);

        this.commands[command.name] = command;

        if (command.bindKey)
            this._buildKeyHash(command);
    };

    this.removeCommand = function(command, keepCommand) {
        var name = command && (typeof command === 'string' ? command : command.name);
        command = this.commands[name];
        if (!keepCommand)
            delete this.commands[name];
        var ckb = this.commandKeyBinding;
        for (var keyId in ckb) {
            var cmdGroup = ckb[keyId];
            if (cmdGroup == command) {
                delete ckb[keyId];
            } else if (Array.isArray(cmdGroup)) {
                var i = cmdGroup.indexOf(command);
                if (i != -1) {
                    cmdGroup.splice(i, 1);
                    if (cmdGroup.length == 1)
                        ckb[keyId] = cmdGroup[0];
                }
            }
        }
    };

    this.bindKey = function(key, command, asDefault) {
        if (typeof key == "object")
            key = key[this.platform];
        if (!key)
            return;
        if (typeof command == "function")
            return this.addCommand({exec: command, bindKey: key, name: command.name || key});
        
        key.split("|").forEach(function(keyPart) {
            var chain = "";
            if (keyPart.indexOf(" ") != -1) {
                var parts = keyPart.split(/\s+/);
                keyPart = parts.pop();
                parts.forEach(function(keyPart) {
                    var binding = this.parseKeys(keyPart);
                    var id = KEY_MODS[binding.hashId] + binding.key;
                    chain += (chain ? " " : "") + id;
                    this._addCommandToBinding(chain, "chainKeys");
                }, this);
                chain += " ";
            }
            var binding = this.parseKeys(keyPart);
            var id = KEY_MODS[binding.hashId] + binding.key;
            this._addCommandToBinding(chain + id, command, asDefault);
        }, this);
    };
    
    this._addCommandToBinding = function(keyId, command, asDefault) {
        var ckb = this.commandKeyBinding, i;
        if (!command) {
            delete ckb[keyId];
        } else if (!ckb[keyId] || this.$singleCommand) {
            ckb[keyId] = command;
        } else {
            if (!Array.isArray(ckb[keyId])) {
                ckb[keyId] = [ckb[keyId]];
            } else if ((i = ckb[keyId].indexOf(command)) != -1) {
                ckb[keyId].splice(i, 1);
            }
            
            if (asDefault || command.isDefault)
                ckb[keyId].unshift(command);
            else
                ckb[keyId].push(command);
        }
    };

    this.addCommands = function(commands) {
        commands && Object.keys(commands).forEach(function(name) {
            var command = commands[name];
            if (!command)
                return;
            
            if (typeof command === "string")
                return this.bindKey(command, name);

            if (typeof command === "function")
                command = { exec: command };

            if (typeof command !== "object")
                return;

            if (!command.name)
                command.name = name;

            this.addCommand(command);
        }, this);
    };

    this.removeCommands = function(commands) {
        Object.keys(commands).forEach(function(name) {
            this.removeCommand(commands[name]);
        }, this);
    };

    this.bindKeys = function(keyList) {
        Object.keys(keyList).forEach(function(key) {
            this.bindKey(key, keyList[key]);
        }, this);
    };

    this._buildKeyHash = function(command) {
        this.bindKey(command.bindKey, command);
    };
    this.parseKeys = function(keys) {
        var parts = keys.toLowerCase().split(/[\-\+]([\-\+])?/).filter(function(x){return x});
        var key = parts.pop();

        var keyCode = keyUtil[key];
        if (keyUtil.FUNCTION_KEYS[keyCode])
            key = keyUtil.FUNCTION_KEYS[keyCode].toLowerCase();
        else if (!parts.length)
            return {key: key, hashId: -1};
        else if (parts.length == 1 && parts[0] == "shift")
            return {key: key.toUpperCase(), hashId: -1};

        var hashId = 0;
        for (var i = parts.length; i--;) {
            var modifier = keyUtil.KEY_MODS[parts[i]];
            if (modifier == null) {
                if (typeof console != "undefined")
                    console.error("invalid modifier " + parts[i] + " in " + keys);
                return false;
            }
            hashId |= modifier;
        }
        return {key: key, hashId: hashId};
    };

    this.findKeyCommand = function findKeyCommand(hashId, keyString) {
        var key = KEY_MODS[hashId] + keyString;
        return this.commandKeyBinding[key];
    };

    this.handleKeyboard = function(data, hashId, keyString, keyCode) {
        var key = KEY_MODS[hashId] + keyString;
        var command = this.commandKeyBinding[key];
        if (data.$keyChain) {
            data.$keyChain += " " + key;
            command = this.commandKeyBinding[data.$keyChain] || command;
        }
        
        if (command) {
            if (command == "chainKeys" || command[command.length - 1] == "chainKeys") {
                data.$keyChain = data.$keyChain || key;
                return {command: "null"};
            }
        }
        
        if (data.$keyChain && keyCode > 0)
            data.$keyChain = "";
        return {command: command};
    };

}).call(HashHandler.prototype);

exports.HashHandler = HashHandler;
exports.MultiHashHandler = MultiHashHandler;
});

ace.define("ace/commands/command_manager",["require","exports","module","ace/lib/oop","ace/keyboard/hash_handler","ace/lib/event_emitter"], function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var MultiHashHandler = require("../keyboard/hash_handler").MultiHashHandler;
var EventEmitter = require("../lib/event_emitter").EventEmitter;

var CommandManager = function(platform, commands) {
    MultiHashHandler.call(this, commands, platform);
    this.byName = this.commands;
    this.setDefaultHandler("exec", function(e) {
        return e.command.exec(e.editor, e.args || {});
    });
};

oop.inherits(CommandManager, MultiHashHandler);

(function() {

    oop.implement(this, EventEmitter);

    this.exec = function(command, editor, args) {
        if (Array.isArray(command)) {
            for (var i = command.length; i--; ) {
                if (this.exec(command[i], editor, args)) return true;
            }
            return false;
        }
        
        if (typeof command === "string")
            command = this.commands[command];

        if (!command)
            return false;

        if (editor && editor.$readOnly && !command.readOnly)
            return false;

        var e = {editor: editor, command: command, args: args};
        e.returnValue = this._emit("exec", e);
        this._signal("afterExec", e);

        return e.returnValue === false ? false : true;
    };

    this.toggleRecording = function(editor) {
        if (this.$inReplay)
            return;

        editor && editor._emit("changeStatus");
        if (this.recording) {
            this.macro.pop();
            this.removeEventListener("exec", this.$addCommandToMacro);

            if (!this.macro.length)
                this.macro = this.oldMacro;

            return this.recording = false;
        }
        if (!this.$addCommandToMacro) {
            this.$addCommandToMacro = function(e) {
                this.macro.push([e.command, e.args]);
            }.bind(this);
        }

        this.oldMacro = this.macro;
        this.macro = [];
        this.on("exec", this.$addCommandToMacro);
        return this.recording = true;
    };

    this.replay = function(editor) {
        if (this.$inReplay || !this.macro)
            return;

        if (this.recording)
            return this.toggleRecording(editor);

        try {
            this.$inReplay = true;
            this.macro.forEach(function(x) {
                if (typeof x == "string")
                    this.exec(x, editor);
                else
                    this.exec(x[0], editor, x[1]);
            }, this);
        } finally {
            this.$inReplay = false;
        }
    };

    this.trimMacro = function(m) {
        return m.map(function(x){
            if (typeof x[0] != "string")
                x[0] = x[0].name;
            if (!x[1])
                x = x[0];
            return x;
        });
    };

}).call(CommandManager.prototype);

exports.CommandManager = CommandManager;

});

ace.define("ace/commands/default_commands",["require","exports","module","ace/lib/lang","ace/config","ace/range"], function(require, exports, module) {
"use strict";

var lang = require("../lib/lang");
var config = require("../config");
var Range = require("../range").Range;

function bindKey(win, mac) {
    return {win: win, mac: mac};
}
exports.commands = [{
    name: "showSettingsMenu",
    bindKey: bindKey("Ctrl-,", "Command-,"),
    exec: function(editor) {
        config.loadModule("ace/ext/settings_menu", function(module) {
            module.init(editor);
            editor.showSettingsMenu();
        });
    },
    readOnly: true
}, {
    name: "goToNextError",
    bindKey: bindKey("Alt-E", "Ctrl-E"),
    exec: function(editor) {
        config.loadModule("ace/ext/error_marker", function(module) {
            module.showErrorMarker(editor, 1);
        });
    },
    scrollIntoView: "animate",
    readOnly: true
}, {
    name: "goToPreviousError",
    bindKey: bindKey("Alt-Shift-E", "Ctrl-Shift-E"),
    exec: function(editor) {
        config.loadModule("ace/ext/error_marker", function(module) {
            module.showErrorMarker(editor, -1);
        });
    },
    scrollIntoView: "animate",
    readOnly: true
}, {
    name: "selectall",
    bindKey: bindKey("Ctrl-A", "Command-A"),
    exec: function(editor) { editor.selectAll(); },
    readOnly: true
}, {
    name: "centerselection",
    bindKey: bindKey(null, "Ctrl-L"),
    exec: function(editor) { editor.centerSelection(); },
    readOnly: true
}, {
    name: "gotoline",
    bindKey: bindKey("Ctrl-L", "Command-L"),
    exec: function(editor) {
        var line = parseInt(prompt("Enter line number:"), 10);
        if (!isNaN(line)) {
            editor.gotoLine(line);
        }
    },
    readOnly: true
}, {
    name: "fold",
    bindKey: bindKey("Alt-L|Ctrl-F1", "Command-Alt-L|Command-F1"),
    exec: function(editor) { editor.session.toggleFold(false); },
    scrollIntoView: "center",
    readOnly: true
}, {
    name: "unfold",
    bindKey: bindKey("Alt-Shift-L|Ctrl-Shift-F1", "Command-Alt-Shift-L|Command-Shift-F1"),
    exec: function(editor) { editor.session.toggleFold(true); },
    scrollIntoView: "center",
    readOnly: true
}, {
    name: "toggleFoldWidget",
    bindKey: bindKey("F2", "F2"),
    exec: function(editor) { editor.session.toggleFoldWidget(); },
    scrollIntoView: "center",
    readOnly: true
}, {
    name: "toggleParentFoldWidget",
    bindKey: bindKey("Alt-F2", "Alt-F2"),
    exec: function(editor) { editor.session.toggleFoldWidget(true); },
    scrollIntoView: "center",
    readOnly: true
}, {
    name: "foldall",
    bindKey: bindKey("Ctrl-Alt-0", "Ctrl-Command-Option-0"),
    exec: function(editor) { editor.session.foldAll(); },
    scrollIntoView: "center",
    readOnly: true
}, {
    name: "foldOther",
    bindKey: bindKey("Alt-0", "Command-Option-0"),
    exec: function(editor) { 
        editor.session.foldAll();
        editor.session.unfold(editor.selection.getAllRanges());
    },
    scrollIntoView: "center",
    readOnly: true
}, {
    name: "unfoldall",
    bindKey: bindKey("Alt-Shift-0", "Command-Option-Shift-0"),
    exec: function(editor) { editor.session.unfold(); },
    scrollIntoView: "center",
    readOnly: true
}, {
    name: "findnext",
    bindKey: bindKey("Ctrl-K", "Command-G"),
    exec: function(editor) { editor.findNext(); },
    multiSelectAction: "forEach",
    scrollIntoView: "center",
    readOnly: true
}, {
    name: "findprevious",
    bindKey: bindKey("Ctrl-Shift-K", "Command-Shift-G"),
    exec: function(editor) { editor.findPrevious(); },
    multiSelectAction: "forEach",
    scrollIntoView: "center",
    readOnly: true
}, {
    name: "selectOrFindNext",
    bindKey: bindKey("Alt-K", "Ctrl-G"),
    exec: function(editor) {
        if (editor.selection.isEmpty())
            editor.selection.selectWord();
        else
            editor.findNext(); 
    },
    readOnly: true
}, {
    name: "selectOrFindPrevious",
    bindKey: bindKey("Alt-Shift-K", "Ctrl-Shift-G"),
    exec: function(editor) { 
        if (editor.selection.isEmpty())
            editor.selection.selectWord();
        else
            editor.findPrevious();
    },
    readOnly: true
}, {
    name: "find",
    bindKey: bindKey("Ctrl-F", "Command-F"),
    exec: function(editor) {
        config.loadModule("ace/ext/searchbox", function(e) {e.Search(editor)});
    },
    readOnly: true
}, {
    name: "overwrite",
    bindKey: "Insert",
    exec: function(editor) { editor.toggleOverwrite(); },
    readOnly: true
}, {
    name: "selecttostart",
    bindKey: bindKey("Ctrl-Shift-Home", "Command-Shift-Up"),
    exec: function(editor) { editor.getSelection().selectFileStart(); },
    multiSelectAction: "forEach",
    readOnly: true,
    scrollIntoView: "animate",
    aceCommandGroup: "fileJump"
}, {
    name: "gotostart",
    bindKey: bindKey("Ctrl-Home", "Command-Home|Command-Up"),
    exec: function(editor) { editor.navigateFileStart(); },
    multiSelectAction: "forEach",
    readOnly: true,
    scrollIntoView: "animate",
    aceCommandGroup: "fileJump"
}, {
    name: "selectup",
    bindKey: bindKey("Shift-Up", "Shift-Up"),
    exec: function(editor) { editor.getSelection().selectUp(); },
    multiSelectAction: "forEach",
    readOnly: true
}, {
    name: "golineup",
    bindKey: bindKey("Up", "Up|Ctrl-P"),
    exec: function(editor, args) { editor.navigateUp(args.times); },
    multiSelectAction: "forEach",
    readOnly: true
}, {
    name: "selecttoend",
    bindKey: bindKey("Ctrl-Shift-End", "Command-Shift-Down"),
    exec: function(editor) { editor.getSelection().selectFileEnd(); },
    multiSelectAction: "forEach",
    readOnly: true,
    scrollIntoView: "animate",
    aceCommandGroup: "fileJump"
}, {
    name: "gotoend",
    bindKey: bindKey("Ctrl-End", "Command-End|Command-Down"),
    exec: function(editor) { editor.navigateFileEnd(); },
    multiSelectAction: "forEach",
    readOnly: true,
    scrollIntoView: "animate",
    aceCommandGroup: "fileJump"
}, {
    name: "selectdown",
    bindKey: bindKey("Shift-Down", "Shift-Down"),
    exec: function(editor) { editor.getSelection().selectDown(); },
    multiSelectAction: "forEach",
    scrollIntoView: "cursor",
    readOnly: true
}, {
    name: "golinedown",
    bindKey: bindKey("Down", "Down|Ctrl-N"),
    exec: function(editor, args) { editor.navigateDown(args.times); },
    multiSelectAction: "forEach",
    scrollIntoView: "cursor",
    readOnly: true
}, {
    name: "selectwordleft",
    bindKey: bindKey("Ctrl-Shift-Left", "Option-Shift-Left"),
    exec: function(editor) { editor.getSelection().selectWordLeft(); },
    multiSelectAction: "forEach",
    scrollIntoView: "cursor",
    readOnly: true
}, {
    name: "gotowordleft",
    bindKey: bindKey("Ctrl-Left", "Option-Left"),
    exec: function(editor) { editor.navigateWordLeft(); },
    multiSelectAction: "forEach",
    scrollIntoView: "cursor",
    readOnly: true
}, {
    name: "selecttolinestart",
    bindKey: bindKey("Alt-Shift-Left", "Command-Shift-Left"),
    exec: function(editor) { editor.getSelection().selectLineStart(); },
    multiSelectAction: "forEach",
    scrollIntoView: "cursor",
    readOnly: true
}, {
    name: "gotolinestart",
    bindKey: bindKey("Alt-Left|Home", "Command-Left|Home|Ctrl-A"),
    exec: function(editor) { editor.navigateLineStart(); },
    multiSelectAction: "forEach",
    scrollIntoView: "cursor",
    readOnly: true
}, {
    name: "selectleft",
    bindKey: bindKey("Shift-Left", "Shift-Left"),
    exec: function(editor) { editor.getSelection().selectLeft(); },
    multiSelectAction: "forEach",
    scrollIntoView: "cursor",
    readOnly: true
}, {
    name: "gotoleft",
    bindKey: bindKey("Left", "Left|Ctrl-B"),
    exec: function(editor, args) { editor.navigateLeft(args.times); },
    multiSelectAction: "forEach",
    scrollIntoView: "cursor",
    readOnly: true
}, {
    name: "selectwordright",
    bindKey: bindKey("Ctrl-Shift-Right", "Option-Shift-Right"),
    exec: function(editor) { editor.getSelection().selectWordRight(); },
    multiSelectAction: "forEach",
    scrollIntoView: "cursor",
    readOnly: true
}, {
    name: "gotowordright",
    bindKey: bindKey("Ctrl-Right", "Option-Right"),
    exec: function(editor) { editor.navigateWordRight(); },
    multiSelectAction: "forEach",
    scrollIntoView: "cursor",
    readOnly: true
}, {
    name: "selecttolineend",
    bindKey: bindKey("Alt-Shift-Right", "Command-Shift-Right"),
    exec: function(editor) { editor.getSelection().selectLineEnd(); },
    multiSelectAction: "forEach",
    scrollIntoView: "cursor",
    readOnly: true
}, {
    name: "gotolineend",
    bindKey: bindKey("Alt-Right|End", "Command-Right|End|Ctrl-E"),
    exec: function(editor) { editor.navigateLineEnd(); },
    multiSelectAction: "forEach",
    scrollIntoView: "cursor",
    readOnly: true
}, {
    name: "selectright",
    bindKey: bindKey("Shift-Right", "Shift-Right"),
    exec: function(editor) { editor.getSelection().selectRight(); },
    multiSelectAction: "forEach",
    scrollIntoView: "cursor",
    readOnly: true
}, {
    name: "gotoright",
    bindKey: bindKey("Right", "Right|Ctrl-F"),
    exec: function(editor, args) { editor.navigateRight(args.times); },
    multiSelectAction: "forEach",
    scrollIntoView: "cursor",
    readOnly: true
}, {
    name: "selectpagedown",
    bindKey: "Shift-PageDown",
    exec: function(editor) { editor.selectPageDown(); },
    readOnly: true
}, {
    name: "pagedown",
    bindKey: bindKey(null, "Option-PageDown"),
    exec: function(editor) { editor.scrollPageDown(); },
    readOnly: true
}, {
    name: "gotopagedown",
    bindKey: bindKey("PageDown", "PageDown|Ctrl-V"),
    exec: function(editor) { editor.gotoPageDown(); },
    readOnly: true
}, {
    name: "selectpageup",
    bindKey: "Shift-PageUp",
    exec: function(editor) { editor.selectPageUp(); },
    readOnly: true
}, {
    name: "pageup",
    bindKey: bindKey(null, "Option-PageUp"),
    exec: function(editor) { editor.scrollPageUp(); },
    readOnly: true
}, {
    name: "gotopageup",
    bindKey: "PageUp",
    exec: function(editor) { editor.gotoPageUp(); },
    readOnly: true
}, {
    name: "scrollup",
    bindKey: bindKey("Ctrl-Up", null),
    exec: function(e) { e.renderer.scrollBy(0, -2 * e.renderer.layerConfig.lineHeight); },
    readOnly: true
}, {
    name: "scrolldown",
    bindKey: bindKey("Ctrl-Down", null),
    exec: function(e) { e.renderer.scrollBy(0, 2 * e.renderer.layerConfig.lineHeight); },
    readOnly: true
}, {
    name: "selectlinestart",
    bindKey: "Shift-Home",
    exec: function(editor) { editor.getSelection().selectLineStart(); },
    multiSelectAction: "forEach",
    scrollIntoView: "cursor",
    readOnly: true
}, {
    name: "selectlineend",
    bindKey: "Shift-End",
    exec: function(editor) { editor.getSelection().selectLineEnd(); },
    multiSelectAction: "forEach",
    scrollIntoView: "cursor",
    readOnly: true
}, {
    name: "togglerecording",
    bindKey: bindKey("Ctrl-Alt-E", "Command-Option-E"),
    exec: function(editor) { editor.commands.toggleRecording(editor); },
    readOnly: true
}, {
    name: "replaymacro",
    bindKey: bindKey("Ctrl-Shift-E", "Command-Shift-E"),
    exec: function(editor) { editor.commands.replay(editor); },
    readOnly: true
}, {
    name: "jumptomatching",
    bindKey: bindKey("Ctrl-P", "Ctrl-P"),
    exec: function(editor) { editor.jumpToMatching(); },
    multiSelectAction: "forEach",
    readOnly: true
}, {
    name: "selecttomatching",
    bindKey: bindKey("Ctrl-Shift-P", "Ctrl-Shift-P"),
    exec: function(editor) { editor.jumpToMatching(true); },
    multiSelectAction: "forEach",
    readOnly: true
}, {
    name: "passKeysToBrowser",
    bindKey: bindKey("null", "null"),
    exec: function() {},
    passEvent: true,
    readOnly: true
},
{
    name: "cut",
    exec: function(editor) {
        var range = editor.getSelectionRange();
        editor._emit("cut", range);

        if (!editor.selection.isEmpty()) {
            editor.session.remove(range);
            editor.clearSelection();
        }
    },
    scrollIntoView: "cursor",
    multiSelectAction: "forEach"
}, {
    name: "removeline",
    bindKey: bindKey("Ctrl-D", "Command-D"),
    exec: function(editor) { editor.removeLines(); },
    scrollIntoView: "cursor",
    multiSelectAction: "forEachLine"
}, {
    name: "duplicateSelection",
    bindKey: bindKey("Ctrl-Shift-D", "Command-Shift-D"),
    exec: function(editor) { editor.duplicateSelection(); },
    scrollIntoView: "cursor",
    multiSelectAction: "forEach"
}, {
    name: "sortlines",
    bindKey: bindKey("Ctrl-Alt-S", "Command-Alt-S"),
    exec: function(editor) { editor.sortLines(); },
    scrollIntoView: "selection",
    multiSelectAction: "forEachLine"
}, {
    name: "togglecomment",
    bindKey: bindKey("Ctrl-/", "Command-/"),
    exec: function(editor) { editor.toggleCommentLines(); },
    multiSelectAction: "forEachLine",
    scrollIntoView: "selectionPart"
}, {
    name: "toggleBlockComment",
    bindKey: bindKey("Ctrl-Shift-/", "Command-Shift-/"),
    exec: function(editor) { editor.toggleBlockComment(); },
    multiSelectAction: "forEach",
    scrollIntoView: "selectionPart"
}, {
    name: "modifyNumberUp",
    bindKey: bindKey("Ctrl-Shift-Up", "Alt-Shift-Up"),
    exec: function(editor) { editor.modifyNumber(1); },
    multiSelectAction: "forEach"
}, {
    name: "modifyNumberDown",
    bindKey: bindKey("Ctrl-Shift-Down", "Alt-Shift-Down"),
    exec: function(editor) { editor.modifyNumber(-1); },
    multiSelectAction: "forEach"
}, {
    name: "replace",
    bindKey: bindKey("Ctrl-H", "Command-Option-F"),
    exec: function(editor) {
        config.loadModule("ace/ext/searchbox", function(e) {e.Search(editor, true)});
    }
}, {
    name: "undo",
    bindKey: bindKey("Ctrl-Z", "Command-Z"),
    exec: function(editor) { editor.undo(); }
}, {
    name: "redo",
    bindKey: bindKey("Ctrl-Shift-Z|Ctrl-Y", "Command-Shift-Z|Command-Y"),
    exec: function(editor) { editor.redo(); }
}, {
    name: "copylinesup",
    bindKey: bindKey("Alt-Shift-Up", "Command-Option-Up"),
    exec: function(editor) { editor.copyLinesUp(); },
    scrollIntoView: "cursor"
}, {
    name: "movelinesup",
    bindKey: bindKey("Alt-Up", "Option-Up"),
    exec: function(editor) { editor.moveLinesUp(); },
    scrollIntoView: "cursor"
}, {
    name: "copylinesdown",
    bindKey: bindKey("Alt-Shift-Down", "Command-Option-Down"),
    exec: function(editor) { editor.copyLinesDown(); },
    scrollIntoView: "cursor"
}, {
    name: "movelinesdown",
    bindKey: bindKey("Alt-Down", "Option-Down"),
    exec: function(editor) { editor.moveLinesDown(); },
    scrollIntoView: "cursor"
}, {
    name: "del",
    bindKey: bindKey("Delete", "Delete|Ctrl-D|Shift-Delete"),
    exec: function(editor) { editor.remove("right"); },
    multiSelectAction: "forEach",
    scrollIntoView: "cursor"
}, {
    name: "backspace",
    bindKey: bindKey(
        "Shift-Backspace|Backspace",
        "Ctrl-Backspace|Shift-Backspace|Backspace|Ctrl-H"
    ),
    exec: function(editor) { editor.remove("left"); },
    multiSelectAction: "forEach",
    scrollIntoView: "cursor"
}, {
    name: "cut_or_delete",
    bindKey: bindKey("Shift-Delete", null),
    exec: function(editor) { 
        if (editor.selection.isEmpty()) {
            editor.remove("left");
        } else {
            return false;
        }
    },
    multiSelectAction: "forEach",
    scrollIntoView: "cursor"
}, {
    name: "removetolinestart",
    bindKey: bindKey("Alt-Backspace", "Command-Backspace"),
    exec: function(editor) { editor.removeToLineStart(); },
    multiSelectAction: "forEach",
    scrollIntoView: "cursor"
}, {
    name: "removetolineend",
    bindKey: bindKey("Alt-Delete", "Ctrl-K"),
    exec: function(editor) { editor.removeToLineEnd(); },
    multiSelectAction: "forEach",
    scrollIntoView: "cursor"
}, {
    name: "removewordleft",
    bindKey: bindKey("Ctrl-Backspace", "Alt-Backspace|Ctrl-Alt-Backspace"),
    exec: function(editor) { editor.removeWordLeft(); },
    multiSelectAction: "forEach",
    scrollIntoView: "cursor"
}, {
    name: "removewordright",
    bindKey: bindKey("Ctrl-Delete", "Alt-Delete"),
    exec: function(editor) { editor.removeWordRight(); },
    multiSelectAction: "forEach",
    scrollIntoView: "cursor"
}, {
    name: "outdent",
    bindKey: bindKey("Shift-Tab", "Shift-Tab"),
    exec: function(editor) { editor.blockOutdent(); },
    multiSelectAction: "forEach",
    scrollIntoView: "selectionPart"
}, {
    name: "indent",
    bindKey: bindKey("Tab", "Tab"),
    exec: function(editor) { editor.indent(); },
    multiSelectAction: "forEach",
    scrollIntoView: "selectionPart"
}, {
    name: "blockoutdent",
    bindKey: bindKey("Ctrl-[", "Ctrl-["),
    exec: function(editor) { editor.blockOutdent(); },
    multiSelectAction: "forEachLine",
    scrollIntoView: "selectionPart"
}, {
    name: "blockindent",
    bindKey: bindKey("Ctrl-]", "Ctrl-]"),
    exec: function(editor) { editor.blockIndent(); },
    multiSelectAction: "forEachLine",
    scrollIntoView: "selectionPart"
}, {
    name: "insertstring",
    exec: function(editor, str) { editor.insert(str); },
    multiSelectAction: "forEach",
    scrollIntoView: "cursor"
}, {
    name: "inserttext",
    exec: function(editor, args) {
        editor.insert(lang.stringRepeat(args.text  || "", args.times || 1));
    },
    multiSelectAction: "forEach",
    scrollIntoView: "cursor"
}, {
    name: "splitline",
    bindKey: bindKey(null, "Ctrl-O"),
    exec: function(editor) { editor.splitLine(); },
    multiSelectAction: "forEach",
    scrollIntoView: "cursor"
}, {
    name: "transposeletters",
    bindKey: bindKey("Ctrl-T", "Ctrl-T"),
    exec: function(editor) { editor.transposeLetters(); },
    multiSelectAction: function(editor) {editor.transposeSelections(1); },
    scrollIntoView: "cursor"
}, {
    name: "touppercase",
    bindKey: bindKey("Ctrl-U", "Ctrl-U"),
    exec: function(editor) { editor.toUpperCase(); },
    multiSelectAction: "forEach",
    scrollIntoView: "cursor"
}, {
    name: "tolowercase",
    bindKey: bindKey("Ctrl-Shift-U", "Ctrl-Shift-U"),
    exec: function(editor) { editor.toLowerCase(); },
    multiSelectAction: "forEach",
    scrollIntoView: "cursor"
}, {
    name: "expandtoline",
    bindKey: bindKey("Ctrl-Shift-L", "Command-Shift-L"),
    exec: function(editor) {
        var range = editor.selection.getRange();

        range.start.column = range.end.column = 0;
        range.end.row++;
        editor.selection.setRange(range, false);
    },
    multiSelectAction: "forEach",
    scrollIntoView: "cursor",
    readOnly: true
}, {
    name: "joinlines",
    bindKey: bindKey(null, null),
    exec: function(editor) {
        var isBackwards = editor.selection.isBackwards();
        var selectionStart = isBackwards ? editor.selection.getSelectionLead() : editor.selection.getSelectionAnchor();
        var selectionEnd = isBackwards ? editor.selection.getSelectionAnchor() : editor.selection.getSelectionLead();
        var firstLineEndCol = editor.session.doc.getLine(selectionStart.row).length
        var selectedText = editor.session.doc.getTextRange(editor.selection.getRange());
        var selectedCount = selectedText.replace(/\n\s*/, " ").length;
        var insertLine = editor.session.doc.getLine(selectionStart.row);

        for (var i = selectionStart.row + 1; i <= selectionEnd.row + 1; i++) {
            var curLine = lang.stringTrimLeft(lang.stringTrimRight(editor.session.doc.getLine(i)));
            if (curLine.length !== 0) {
                curLine = " " + curLine;
            }
            insertLine += curLine;
        };

        if (selectionEnd.row + 1 < (editor.session.doc.getLength() - 1)) {
            insertLine += editor.session.doc.getNewLineCharacter();
        }

        editor.clearSelection();
        editor.session.doc.replace(new Range(selectionStart.row, 0, selectionEnd.row + 2, 0), insertLine);

        if (selectedCount > 0) {
            editor.selection.moveCursorTo(selectionStart.row, selectionStart.column);
            editor.selection.selectTo(selectionStart.row, selectionStart.column + selectedCount);
        } else {
            firstLineEndCol = editor.session.doc.getLine(selectionStart.row).length > firstLineEndCol ? (firstLineEndCol + 1) : firstLineEndCol;
            editor.selection.moveCursorTo(selectionStart.row, firstLineEndCol);
        }
    },
    multiSelectAction: "forEach",
    readOnly: true
}, {
    name: "invertSelection",
    bindKey: bindKey(null, null),
    exec: function(editor) {
        var endRow = editor.session.doc.getLength() - 1;
        var endCol = editor.session.doc.getLine(endRow).length;
        var ranges = editor.selection.rangeList.ranges;
        var newRanges = [];
        if (ranges.length < 1) {
            ranges = [editor.selection.getRange()];
        }

        for (var i = 0; i < ranges.length; i++) {
            if (i == (ranges.length - 1)) {
                if (!(ranges[i].end.row === endRow && ranges[i].end.column === endCol)) {
                    newRanges.push(new Range(ranges[i].end.row, ranges[i].end.column, endRow, endCol));
                }
            }

            if (i === 0) {
                if (!(ranges[i].start.row === 0 && ranges[i].start.column === 0)) {
                    newRanges.push(new Range(0, 0, ranges[i].start.row, ranges[i].start.column));
                }
            } else {
                newRanges.push(new Range(ranges[i-1].end.row, ranges[i-1].end.column, ranges[i].start.row, ranges[i].start.column));
            }
        }

        editor.exitMultiSelectMode();
        editor.clearSelection();

        for(var i = 0; i < newRanges.length; i++) {
            editor.selection.addRange(newRanges[i], false);
        }
    },
    readOnly: true,
    scrollIntoView: "none"
}];

});

ace.define("ace/editor",["require","exports","module","ace/lib/fixoldbrowsers","ace/lib/oop","ace/lib/dom","ace/lib/lang","ace/lib/useragent","ace/keyboard/textinput","ace/mouse/mouse_handler","ace/mouse/fold_handler","ace/keyboard/keybinding","ace/edit_session","ace/search","ace/range","ace/lib/event_emitter","ace/commands/command_manager","ace/commands/default_commands","ace/config","ace/token_iterator"], function(require, exports, module) {
"use strict";

require("./lib/fixoldbrowsers");

var oop = require("./lib/oop");
var dom = require("./lib/dom");
var lang = require("./lib/lang");
var useragent = require("./lib/useragent");
var TextInput = require("./keyboard/textinput").TextInput;
var MouseHandler = require("./mouse/mouse_handler").MouseHandler;
var FoldHandler = require("./mouse/fold_handler").FoldHandler;
var KeyBinding = require("./keyboard/keybinding").KeyBinding;
var EditSession = require("./edit_session").EditSession;
var Search = require("./search").Search;
var Range = require("./range").Range;
var EventEmitter = require("./lib/event_emitter").EventEmitter;
var CommandManager = require("./commands/command_manager").CommandManager;
var defaultCommands = require("./commands/default_commands").commands;
var config = require("./config");
var TokenIterator = require("./token_iterator").TokenIterator;
var Editor = function(renderer, session) {
    var container = renderer.getContainerElement();
    this.container = container;
    this.renderer = renderer;

    this.commands = new CommandManager(useragent.isMac ? "mac" : "win", defaultCommands);
    this.textInput  = new TextInput(renderer.getTextAreaContainer(), this);
    this.renderer.textarea = this.textInput.getElement();
    this.keyBinding = new KeyBinding(this);
    this.$mouseHandler = new MouseHandler(this);
    new FoldHandler(this);

    this.$blockScrolling = 0;
    this.$search = new Search().set({
        wrap: true
    });

    this.$historyTracker = this.$historyTracker.bind(this);
    this.commands.on("exec", this.$historyTracker);

    this.$initOperationListeners();
    
    this._$emitInputEvent = lang.delayedCall(function() {
        this._signal("input", {});
        if (this.session && this.session.bgTokenizer)
            this.session.bgTokenizer.scheduleStart();
    }.bind(this));
    
    this.on("change", function(_, _self) {
        _self._$emitInputEvent.schedule(31);
    });

    this.setSession(session || new EditSession(""));
    config.resetOptions(this);
    config._signal("editor", this);
};

(function(){

    oop.implement(this, EventEmitter);

    this.$initOperationListeners = function() {
        function last(a) {return a[a.length - 1]}

        this.selections = [];
        this.commands.on("exec", this.startOperation.bind(this), true);
        this.commands.on("afterExec", this.endOperation.bind(this), true);

        this.$opResetTimer = lang.delayedCall(this.endOperation.bind(this));

        this.on("change", function() {
            this.curOp || this.startOperation();
            this.curOp.docChanged = true;
        }.bind(this), true);

        this.on("changeSelection", function() {
            this.curOp || this.startOperation();
            this.curOp.selectionChanged = true;
        }.bind(this), true);
    };

    this.curOp = null;
    this.prevOp = {};
    this.startOperation = function(commadEvent) {
        if (this.curOp) {
            if (!commadEvent || this.curOp.command)
                return;
            this.prevOp = this.curOp;
        }
        if (!commadEvent) {
            this.previousCommand = null;
            commadEvent = {};
        }

        this.$opResetTimer.schedule();
        this.curOp = {
            command: commadEvent.command || {},
            args: commadEvent.args,
            scrollTop: this.renderer.scrollTop
        };
    };

    this.endOperation = function(e) {
        if (this.curOp) {
            if (e && e.returnValue === false)
                return this.curOp = null;
                
            var command = this.curOp.command;
            if (command && command.scrollIntoView) {
                switch (command.scrollIntoView) {
                    case "center":
                        this.renderer.scrollCursorIntoView(null, 0.5);
                        break;
                    case "animate":
                    case "cursor":
                        this.renderer.scrollCursorIntoView();
                        break;
                    case "selectionPart":
                        var range = this.selection.getRange();
                        var config = this.renderer.layerConfig;
                        if (range.start.row >= config.lastRow || range.end.row <= config.firstRow) {
                            this.renderer.scrollSelectionIntoView(this.selection.anchor, this.selection.lead);
                        }
                        break;
                    default:
                        break;
                }
                if (command.scrollIntoView == "animate")
                    this.renderer.animateScrolling(this.curOp.scrollTop);
            }
            
            this.prevOp = this.curOp;
            this.curOp = null;
        }
    };
    this.$mergeableCommands = ["backspace", "del", "insertstring"];
    this.$historyTracker = function(e) {
        if (!this.$mergeUndoDeltas)
            return;

        var prev = this.prevOp;
        var mergeableCommands = this.$mergeableCommands;
        var shouldMerge = prev.command && (e.command.name == prev.command.name);
        if (e.command.name == "insertstring") {
            var text = e.args;
            if (this.mergeNextCommand === undefined)
                this.mergeNextCommand = true;

            shouldMerge = shouldMerge
                && this.mergeNextCommand // previous command allows to coalesce with
                && (!/\s/.test(text) || /\s/.test(prev.args)); // previous insertion was of same type

            this.mergeNextCommand = true;
        } else {
            shouldMerge = shouldMerge
                && mergeableCommands.indexOf(e.command.name) !== -1; // the command is mergeable
        }

        if (
            this.$mergeUndoDeltas != "always"
            && Date.now() - this.sequenceStartTime > 2000
        ) {
            shouldMerge = false; // the sequence is too long
        }

        if (shouldMerge)
            this.session.mergeUndoDeltas = true;
        else if (mergeableCommands.indexOf(e.command.name) !== -1)
            this.sequenceStartTime = Date.now();
    };
    this.setKeyboardHandler = function(keyboardHandler, cb) {
        if (keyboardHandler && typeof keyboardHandler === "string") {
            this.$keybindingId = keyboardHandler;
            var _self = this;
            config.loadModule(["keybinding", keyboardHandler], function(module) {
                if (_self.$keybindingId == keyboardHandler)
                    _self.keyBinding.setKeyboardHandler(module && module.handler);
                cb && cb();
            });
        } else {
            this.$keybindingId = null;
            this.keyBinding.setKeyboardHandler(keyboardHandler);
            cb && cb();
        }
    };
    this.getKeyboardHandler = function() {
        return this.keyBinding.getKeyboardHandler();
    };
    this.setSession = function(session) {
        if (this.session == session)
            return;

        var oldSession = this.session;
        if (oldSession) {
            this.session.removeEventListener("change", this.$onDocumentChange);
            this.session.removeEventListener("changeMode", this.$onChangeMode);
            this.session.removeEventListener("tokenizerUpdate", this.$onTokenizerUpdate);
            this.session.removeEventListener("changeTabSize", this.$onChangeTabSize);
            this.session.removeEventListener("changeWrapLimit", this.$onChangeWrapLimit);
            this.session.removeEventListener("changeWrapMode", this.$onChangeWrapMode);
            this.session.removeEventListener("onChangeFold", this.$onChangeFold);
            this.session.removeEventListener("changeFrontMarker", this.$onChangeFrontMarker);
            this.session.removeEventListener("changeBackMarker", this.$onChangeBackMarker);
            this.session.removeEventListener("changeBreakpoint", this.$onChangeBreakpoint);
            this.session.removeEventListener("changeAnnotation", this.$onChangeAnnotation);
            this.session.removeEventListener("changeOverwrite", this.$onCursorChange);
            this.session.removeEventListener("changeScrollTop", this.$onScrollTopChange);
            this.session.removeEventListener("changeScrollLeft", this.$onScrollLeftChange);

            var selection = this.session.getSelection();
            selection.removeEventListener("changeCursor", this.$onCursorChange);
            selection.removeEventListener("changeSelection", this.$onSelectionChange);
        }

        this.session = session;
        if (session) {
            this.$onDocumentChange = this.onDocumentChange.bind(this);
            session.addEventListener("change", this.$onDocumentChange);
            this.renderer.setSession(session);
    
            this.$onChangeMode = this.onChangeMode.bind(this);
            session.addEventListener("changeMode", this.$onChangeMode);
    
            this.$onTokenizerUpdate = this.onTokenizerUpdate.bind(this);
            session.addEventListener("tokenizerUpdate", this.$onTokenizerUpdate);
    
            this.$onChangeTabSize = this.renderer.onChangeTabSize.bind(this.renderer);
            session.addEventListener("changeTabSize", this.$onChangeTabSize);
    
            this.$onChangeWrapLimit = this.onChangeWrapLimit.bind(this);
            session.addEventListener("changeWrapLimit", this.$onChangeWrapLimit);
    
            this.$onChangeWrapMode = this.onChangeWrapMode.bind(this);
            session.addEventListener("changeWrapMode", this.$onChangeWrapMode);
    
            this.$onChangeFold = this.onChangeFold.bind(this);
            session.addEventListener("changeFold", this.$onChangeFold);
    
            this.$onChangeFrontMarker = this.onChangeFrontMarker.bind(this);
            this.session.addEventListener("changeFrontMarker", this.$onChangeFrontMarker);
    
            this.$onChangeBackMarker = this.onChangeBackMarker.bind(this);
            this.session.addEventListener("changeBackMarker", this.$onChangeBackMarker);
    
            this.$onChangeBreakpoint = this.onChangeBreakpoint.bind(this);
            this.session.addEventListener("changeBreakpoint", this.$onChangeBreakpoint);
    
            this.$onChangeAnnotation = this.onChangeAnnotation.bind(this);
            this.session.addEventListener("changeAnnotation", this.$onChangeAnnotation);
    
            this.$onCursorChange = this.onCursorChange.bind(this);
            this.session.addEventListener("changeOverwrite", this.$onCursorChange);
    
            this.$onScrollTopChange = this.onScrollTopChange.bind(this);
            this.session.addEventListener("changeScrollTop", this.$onScrollTopChange);
    
            this.$onScrollLeftChange = this.onScrollLeftChange.bind(this);
            this.session.addEventListener("changeScrollLeft", this.$onScrollLeftChange);
    
            this.selection = session.getSelection();
            this.selection.addEventListener("changeCursor", this.$onCursorChange);
    
            this.$onSelectionChange = this.onSelectionChange.bind(this);
            this.selection.addEventListener("changeSelection", this.$onSelectionChange);
    
            this.onChangeMode();
    
            this.$blockScrolling += 1;
            this.onCursorChange();
            this.$blockScrolling -= 1;
    
            this.onScrollTopChange();
            this.onScrollLeftChange();
            this.onSelectionChange();
            this.onChangeFrontMarker();
            this.onChangeBackMarker();
            this.onChangeBreakpoint();
            this.onChangeAnnotation();
            this.session.getUseWrapMode() && this.renderer.adjustWrapLimit();
            this.renderer.updateFull();
        } else {
            this.selection = null;
            this.renderer.setSession(session);
        }

        this._signal("changeSession", {
            session: session,
            oldSession: oldSession
        });
        
        oldSession && oldSession._signal("changeEditor", {oldEditor: this});
        session && session._signal("changeEditor", {editor: this});
    };
    this.getSession = function() {
        return this.session;
    };
    this.setValue = function(val, cursorPos) {
        this.session.doc.setValue(val);

        if (!cursorPos)
            this.selectAll();
        else if (cursorPos == 1)
            this.navigateFileEnd();
        else if (cursorPos == -1)
            this.navigateFileStart();

        return val;
    };
    this.getValue = function() {
        return this.session.getValue();
    };
    this.getSelection = function() {
        return this.selection;
    };
    this.resize = function(force) {
        this.renderer.onResize(force);
    };
    this.setTheme = function(theme, cb) {
        this.renderer.setTheme(theme, cb);
    };
    this.getTheme = function() {
        return this.renderer.getTheme();
    };
    this.setStyle = function(style) {
        this.renderer.setStyle(style);
    };
    this.unsetStyle = function(style) {
        this.renderer.unsetStyle(style);
    };
    this.getFontSize = function () {
        return this.getOption("fontSize") ||
           dom.computedStyle(this.container, "fontSize");
    };
    this.setFontSize = function(size) {
        this.setOption("fontSize", size);
    };

    this.$highlightBrackets = function() {
        if (this.session.$bracketHighlight) {
            this.session.removeMarker(this.session.$bracketHighlight);
            this.session.$bracketHighlight = null;
        }

        if (this.$highlightPending) {
            return;
        }
        var self = this;
        this.$highlightPending = true;
        setTimeout(function() {
            self.$highlightPending = false;
            var session = self.session;
            if (!session || !session.bgTokenizer) return;
            var pos = session.findMatchingBracket(self.getCursorPosition());
            if (pos) {
                var range = new Range(pos.row, pos.column, pos.row, pos.column + 1);
            } else if (session.$mode.getMatching) {
                var range = session.$mode.getMatching(self.session);
            }
            if (range)
                session.$bracketHighlight = session.addMarker(range, "ace_bracket", "text");
        }, 50);
    };
    this.$highlightTags = function() {
        if (this.$highlightTagPending)
            return;
        var self = this;
        this.$highlightTagPending = true;
        setTimeout(function() {
            self.$highlightTagPending = false;
            
            var session = self.session;
            if (!session || !session.bgTokenizer) return;
            
            var pos = self.getCursorPosition();
            var iterator = new TokenIterator(self.session, pos.row, pos.column);
            var token = iterator.getCurrentToken();
            
            if (!token || token.type.indexOf('tag-name') === -1) {
                session.removeMarker(session.$tagHighlight);
                session.$tagHighlight = null;
                return;
            }

            var tag = token.value;
            var depth = 0;
            var prevToken = iterator.stepBackward();
            
            if (prevToken.value == '<'){
                do {
                    prevToken = token;
                    token = iterator.stepForward();
                    
                    if (token && token.value === tag && token.type.indexOf('tag-name') !== -1) {
                        if (prevToken.value === '<'){
                            depth++;
                        } else if (prevToken.value === '</'){
                            depth--;
                        }
                    }
                    
                } while (token && depth >= 0);
            } else {
                do {
                    token = prevToken;
                    prevToken = iterator.stepBackward();
                    
                    if (token && token.value === tag && token.type.indexOf('tag-name') !== -1) {
                        if (prevToken.value === '<') {
                            depth++;
                        } else if (prevToken.value === '</') {
                            depth--;
                        }
                    }
                } while (prevToken && depth <= 0);
                iterator.stepForward();
            }
            
            if (!token) {
                session.removeMarker(session.$tagHighlight);
                session.$tagHighlight = null;
                return;
            }
            
            var row = iterator.getCurrentTokenRow();
            var column = iterator.getCurrentTokenColumn();
            var range = new Range(row, column, row, column+token.value.length);
            if (session.$tagHighlight && range.compareRange(session.$backMarkers[session.$tagHighlight].range)!==0) {
                session.removeMarker(session.$tagHighlight);
                session.$tagHighlight = null;
            }
            
            if (range && !session.$tagHighlight)
                session.$tagHighlight = session.addMarker(range, "ace_bracket", "text");
        }, 50);
    };
    this.focus = function() {
        var _self = this;
        setTimeout(function() {
            _self.textInput.focus();
        });
        this.textInput.focus();
    };
    this.isFocused = function() {
        return this.textInput.isFocused();
    };
    this.blur = function() {
        this.textInput.blur();
    };
    this.onFocus = function(e) {
        if (this.$isFocused)
            return;
        this.$isFocused = true;
        this.renderer.showCursor();
        this.renderer.visualizeFocus();
        this._emit("focus", e);
    };
    this.onBlur = function(e) {
        if (!this.$isFocused)
            return;
        this.$isFocused = false;
        this.renderer.hideCursor();
        this.renderer.visualizeBlur();
        this._emit("blur", e);
    };

    this.$cursorChange = function() {
        this.renderer.updateCursor();
    };
    this.onDocumentChange = function(e) {
        var delta = e.data;
        var range = delta.range;
        var lastRow;

        if (range.start.row == range.end.row && delta.action != "insertLines" && delta.action != "removeLines")
            lastRow = range.end.row;
        else
            lastRow = Infinity;
        this.renderer.updateLines(range.start.row, lastRow, this.session.$useWrapMode);

        this._signal("change", e);
        this.$cursorChange();
        this.$updateHighlightActiveLine();
    };

    this.onTokenizerUpdate = function(e) {
        var rows = e.data;
        this.renderer.updateLines(rows.first, rows.last);
    };


    this.onScrollTopChange = function() {
        this.renderer.scrollToY(this.session.getScrollTop());
    };

    this.onScrollLeftChange = function() {
        this.renderer.scrollToX(this.session.getScrollLeft());
    };
    this.onCursorChange = function() {
        this.$cursorChange();

        if (!this.$blockScrolling) {
            this.renderer.scrollCursorIntoView();
        }

        this.$highlightBrackets();
        this.$highlightTags();
        this.$updateHighlightActiveLine();
        this._signal("changeSelection");
    };

    this.$updateHighlightActiveLine = function() {
        var session = this.getSession();

        var highlight;
        if (this.$highlightActiveLine) {
            if ((this.$selectionStyle != "line" || !this.selection.isMultiLine()))
                highlight = this.getCursorPosition();
            if (this.renderer.$maxLines && this.session.getLength() === 1 && !(this.renderer.$minLines > 1))
                highlight = false;
        }

        if (session.$highlightLineMarker && !highlight) {
            session.removeMarker(session.$highlightLineMarker.id);
            session.$highlightLineMarker = null;
        } else if (!session.$highlightLineMarker && highlight) {
            var range = new Range(highlight.row, highlight.column, highlight.row, Infinity);
            range.id = session.addMarker(range, "ace_active-line", "screenLine");
            session.$highlightLineMarker = range;
        } else if (highlight) {
            session.$highlightLineMarker.start.row = highlight.row;
            session.$highlightLineMarker.end.row = highlight.row;
            session.$highlightLineMarker.start.column = highlight.column;
            session._signal("changeBackMarker");
        }
    };

    this.onSelectionChange = function(e) {
        var session = this.session;

        if (session.$selectionMarker) {
            session.removeMarker(session.$selectionMarker);
        }
        session.$selectionMarker = null;

        if (!this.selection.isEmpty()) {
            var range = this.selection.getRange();
            var style = this.getSelectionStyle();
            session.$selectionMarker = session.addMarker(range, "ace_selection", style);
        } else {
            this.$updateHighlightActiveLine();
        }

        var re = this.$highlightSelectedWord && this.$getSelectionHighLightRegexp();
        this.session.highlight(re);

        this._signal("changeSelection");
    };

    this.$getSelectionHighLightRegexp = function() {
        var session = this.session;

        var selection = this.getSelectionRange();
        if (selection.isEmpty() || selection.isMultiLine())
            return;

        var startOuter = selection.start.column - 1;
        var endOuter = selection.end.column + 1;
        var line = session.getLine(selection.start.row);
        var lineCols = line.length;
        var needle = line.substring(Math.max(startOuter, 0),
                                    Math.min(endOuter, lineCols));
        if ((startOuter >= 0 && /^[\w\d]/.test(needle)) ||
            (endOuter <= lineCols && /[\w\d]$/.test(needle)))
            return;

        needle = line.substring(selection.start.column, selection.end.column);
        if (!/^[\w\d]+$/.test(needle))
            return;

        var re = this.$search.$assembleRegExp({
            wholeWord: true,
            caseSensitive: true,
            needle: needle
        });

        return re;
    };


    this.onChangeFrontMarker = function() {
        this.renderer.updateFrontMarkers();
    };

    this.onChangeBackMarker = function() {
        this.renderer.updateBackMarkers();
    };


    this.onChangeBreakpoint = function() {
        this.renderer.updateBreakpoints();
    };

    this.onChangeAnnotation = function() {
        this.renderer.setAnnotations(this.session.getAnnotations());
    };


    this.onChangeMode = function(e) {
        this.renderer.updateText();
        this._emit("changeMode", e);
    };


    this.onChangeWrapLimit = function() {
        this.renderer.updateFull();
    };

    this.onChangeWrapMode = function() {
        this.renderer.onResize(true);
    };


    this.onChangeFold = function() {
        this.$updateHighlightActiveLine();
        this.renderer.updateFull();
    };
    this.getSelectedText = function() {
        return this.session.getTextRange(this.getSelectionRange());
    };
    this.getCopyText = function() {
        var text = this.getSelectedText();
        this._signal("copy", text);
        return text;
    };
    this.onCopy = function() {
        this.commands.exec("copy", this);
    };
    this.onCut = function() {
        this.commands.exec("cut", this);
    };
    this.onPaste = function(text) {
        if (this.$readOnly)
            return;
        var e = {text: text};
        this._signal("paste", e);
        this.insert(e.text, true);
    };

    this.execCommand = function(command, args) {
        return this.commands.exec(command, this, args);
    };
    this.insert = function(text, pasted) {
        var session = this.session;
        var mode = session.getMode();
        var cursor = this.getCursorPosition();

        if (this.getBehavioursEnabled() && !pasted) {
            var transform = mode.transformAction(session.getState(cursor.row), 'insertion', this, session, text);
            if (transform) {
                if (text !== transform.text) {
                    this.session.mergeUndoDeltas = false;
                    this.$mergeNextCommand = false;
                }
                text = transform.text;

            }
        }
        
        if (text == "\t")
            text = this.session.getTabString();
        if (!this.selection.isEmpty()) {
            var range = this.getSelectionRange();
            cursor = this.session.remove(range);
            this.clearSelection();
        }
        else if (this.session.getOverwrite()) {
            var range = new Range.fromPoints(cursor, cursor);
            range.end.column += text.length;
            this.session.remove(range);
        }

        if (text == "\n" || text == "\r\n") {
            var line = session.getLine(cursor.row);
            if (cursor.column > line.search(/\S|$/)) {
                var d = line.substr(cursor.column).search(/\S|$/);
                session.doc.removeInLine(cursor.row, cursor.column, cursor.column + d);
            }
        }
        this.clearSelection();

        var start = cursor.column;
        var lineState = session.getState(cursor.row);
        var line = session.getLine(cursor.row);
        var shouldOutdent = mode.checkOutdent(lineState, line, text);
        var end = session.insert(cursor, text);

        if (transform && transform.selection) {
            if (transform.selection.length == 2) { // Transform relative to the current column
                this.selection.setSelectionRange(
                    new Range(cursor.row, start + transform.selection[0],
                              cursor.row, start + transform.selection[1]));
            } else { // Transform relative to the current row.
                this.selection.setSelectionRange(
                    new Range(cursor.row + transform.selection[0],
                              transform.selection[1],
                              cursor.row + transform.selection[2],
                              transform.selection[3]));
            }
        }

        if (session.getDocument().isNewLine(text)) {
            var lineIndent = mode.getNextLineIndent(lineState, line.slice(0, cursor.column), session.getTabString());

            session.insert({row: cursor.row+1, column: 0}, lineIndent);
        }
        if (shouldOutdent)
            mode.autoOutdent(lineState, session, cursor.row);
    };

    this.onTextInput = function(text) {
        this.keyBinding.onTextInput(text);
    };

    this.onCommandKey = function(e, hashId, keyCode) {
        this.keyBinding.onCommandKey(e, hashId, keyCode);
    };
    this.setOverwrite = function(overwrite) {
        this.session.setOverwrite(overwrite);
    };
    this.getOverwrite = function() {
        return this.session.getOverwrite();
    };
    this.toggleOverwrite = function() {
        this.session.toggleOverwrite();
    };
    this.setScrollSpeed = function(speed) {
        this.setOption("scrollSpeed", speed);
    };
    this.getScrollSpeed = function() {
        return this.getOption("scrollSpeed");
    };
    this.setDragDelay = function(dragDelay) {
        this.setOption("dragDelay", dragDelay);
    };
    this.getDragDelay = function() {
        return this.getOption("dragDelay");
    };
    this.setSelectionStyle = function(val) {
        this.setOption("selectionStyle", val);
    };
    this.getSelectionStyle = function() {
        return this.getOption("selectionStyle");
    };
    this.setHighlightActiveLine = function(shouldHighlight) {
        this.setOption("highlightActiveLine", shouldHighlight);
    };
    this.getHighlightActiveLine = function() {
        return this.getOption("highlightActiveLine");
    };
    this.setHighlightGutterLine = function(shouldHighlight) {
        this.setOption("highlightGutterLine", shouldHighlight);
    };

    this.getHighlightGutterLine = function() {
        return this.getOption("highlightGutterLine");
    };
    this.setHighlightSelectedWord = function(shouldHighlight) {
        this.setOption("highlightSelectedWord", shouldHighlight);
    };
    this.getHighlightSelectedWord = function() {
        return this.$highlightSelectedWord;
    };

    this.setAnimatedScroll = function(shouldAnimate){
        this.renderer.setAnimatedScroll(shouldAnimate);
    };

    this.getAnimatedScroll = function(){
        return this.renderer.getAnimatedScroll();
    };
    this.setShowInvisibles = function(showInvisibles) {
        this.renderer.setShowInvisibles(showInvisibles);
    };
    this.getShowInvisibles = function() {
        return this.renderer.getShowInvisibles();
    };

    this.setDisplayIndentGuides = function(display) {
        this.renderer.setDisplayIndentGuides(display);
    };

    this.getDisplayIndentGuides = function() {
        return this.renderer.getDisplayIndentGuides();
    };
    this.setShowPrintMargin = function(showPrintMargin) {
        this.renderer.setShowPrintMargin(showPrintMargin);
    };
    this.getShowPrintMargin = function() {
        return this.renderer.getShowPrintMargin();
    };
    this.setPrintMarginColumn = function(showPrintMargin) {
        this.renderer.setPrintMarginColumn(showPrintMargin);
    };
    this.getPrintMarginColumn = function() {
        return this.renderer.getPrintMarginColumn();
    };
    this.setReadOnly = function(readOnly) {
        this.setOption("readOnly", readOnly);
    };
    this.getReadOnly = function() {
        return this.getOption("readOnly");
    };
    this.setBehavioursEnabled = function (enabled) {
        this.setOption("behavioursEnabled", enabled);
    };
    this.getBehavioursEnabled = function () {
        return this.getOption("behavioursEnabled");
    };
    this.setWrapBehavioursEnabled = function (enabled) {
        this.setOption("wrapBehavioursEnabled", enabled);
    };
    this.getWrapBehavioursEnabled = function () {
        return this.getOption("wrapBehavioursEnabled");
    };
    this.setShowFoldWidgets = function(show) {
        this.setOption("showFoldWidgets", show);

    };
    this.getShowFoldWidgets = function() {
        return this.getOption("showFoldWidgets");
    };

    this.setFadeFoldWidgets = function(fade) {
        this.setOption("fadeFoldWidgets", fade);
    };

    this.getFadeFoldWidgets = function() {
        return this.getOption("fadeFoldWidgets");
    };
    this.remove = function(dir) {
        if (this.selection.isEmpty()){
            if (dir == "left")
                this.selection.selectLeft();
            else
                this.selection.selectRight();
        }

        var range = this.getSelectionRange();
        if (this.getBehavioursEnabled()) {
            var session = this.session;
            var state = session.getState(range.start.row);
            var new_range = session.getMode().transformAction(state, 'deletion', this, session, range);

            if (range.end.column === 0) {
                var text = session.getTextRange(range);
                if (text[text.length - 1] == "\n") {
                    var line = session.getLine(range.end.row);
                    if (/^\s+$/.test(line)) {
                        range.end.column = line.length;
                    }
                }
            }
            if (new_range)
                range = new_range;
        }

        this.session.remove(range);
        this.clearSelection();
    };
    this.removeWordRight = function() {
        if (this.selection.isEmpty())
            this.selection.selectWordRight();

        this.session.remove(this.getSelectionRange());
        this.clearSelection();
    };
    this.removeWordLeft = function() {
        if (this.selection.isEmpty())
            this.selection.selectWordLeft();

        this.session.remove(this.getSelectionRange());
        this.clearSelection();
    };
    this.removeToLineStart = function() {
        if (this.selection.isEmpty())
            this.selection.selectLineStart();

        this.session.remove(this.getSelectionRange());
        this.clearSelection();
    };
    this.removeToLineEnd = function() {
        if (this.selection.isEmpty())
            this.selection.selectLineEnd();

        var range = this.getSelectionRange();
        if (range.start.column == range.end.column && range.start.row == range.end.row) {
            range.end.column = 0;
            range.end.row++;
        }

        this.session.remove(range);
        this.clearSelection();
    };
    this.splitLine = function() {
        if (!this.selection.isEmpty()) {
            this.session.remove(this.getSelectionRange());
            this.clearSelection();
        }

        var cursor = this.getCursorPosition();
        this.insert("\n");
        this.moveCursorToPosition(cursor);
    };
    this.transposeLetters = function() {
        if (!this.selection.isEmpty()) {
            return;
        }

        var cursor = this.getCursorPosition();
        var column = cursor.column;
        if (column === 0)
            return;

        var line = this.session.getLine(cursor.row);
        var swap, range;
        if (column < line.length) {
            swap = line.charAt(column) + line.charAt(column-1);
            range = new Range(cursor.row, column-1, cursor.row, column+1);
        }
        else {
            swap = line.charAt(column-1) + line.charAt(column-2);
            range = new Range(cursor.row, column-2, cursor.row, column);
        }
        this.session.replace(range, swap);
    };
    this.toLowerCase = function() {
        var originalRange = this.getSelectionRange();
        if (this.selection.isEmpty()) {
            this.selection.selectWord();
        }

        var range = this.getSelectionRange();
        var text = this.session.getTextRange(range);
        this.session.replace(range, text.toLowerCase());
        this.selection.setSelectionRange(originalRange);
    };
    this.toUpperCase = function() {
        var originalRange = this.getSelectionRange();
        if (this.selection.isEmpty()) {
            this.selection.selectWord();
        }

        var range = this.getSelectionRange();
        var text = this.session.getTextRange(range);
        this.session.replace(range, text.toUpperCase());
        this.selection.setSelectionRange(originalRange);
    };
    this.indent = function() {
        var session = this.session;
        var range = this.getSelectionRange();

        if (range.start.row < range.end.row) {
            var rows = this.$getSelectedRows();
            session.indentRows(rows.first, rows.last, "\t");
            return;
        } else if (range.start.column < range.end.column) {
            var text = session.getTextRange(range);
            if (!/^\s+$/.test(text)) {
                var rows = this.$getSelectedRows();
                session.indentRows(rows.first, rows.last, "\t");
                return;
            }
        }
        
        var line = session.getLine(range.start.row);
        var position = range.start;
        var size = session.getTabSize();
        var column = session.documentToScreenColumn(position.row, position.column);

        if (this.session.getUseSoftTabs()) {
            var count = (size - column % size);
            var indentString = lang.stringRepeat(" ", count);
        } else {
            var count = column % size;
            while (line[range.start.column] == " " && count) {
                range.start.column--;
                count--;
            }
            this.selection.setSelectionRange(range);
            indentString = "\t";
        }
        return this.insert(indentString);
    };
    this.blockIndent = function() {
        var rows = this.$getSelectedRows();
        this.session.indentRows(rows.first, rows.last, "\t");
    };
    this.blockOutdent = function() {
        var selection = this.session.getSelection();
        this.session.outdentRows(selection.getRange());
    };
    this.sortLines = function() {
        var rows = this.$getSelectedRows();
        var session = this.session;

        var lines = [];
        for (i = rows.first; i <= rows.last; i++)
            lines.push(session.getLine(i));

        lines.sort(function(a, b) {
            if (a.toLowerCase() < b.toLowerCase()) return -1;
            if (a.toLowerCase() > b.toLowerCase()) return 1;
            return 0;
        });

        var deleteRange = new Range(0, 0, 0, 0);
        for (var i = rows.first; i <= rows.last; i++) {
            var line = session.getLine(i);
            deleteRange.start.row = i;
            deleteRange.end.row = i;
            deleteRange.end.column = line.length;
            session.replace(deleteRange, lines[i-rows.first]);
        }
    };
    this.toggleCommentLines = function() {
        var state = this.session.getState(this.getCursorPosition().row);
        var rows = this.$getSelectedRows();
        this.session.getMode().toggleCommentLines(state, this.session, rows.first, rows.last);
    };

    this.toggleBlockComment = function() {
        var cursor = this.getCursorPosition();
        var state = this.session.getState(cursor.row);
        var range = this.getSelectionRange();
        this.session.getMode().toggleBlockComment(state, this.session, range, cursor);
    };
    this.getNumberAt = function(row, column) {
        var _numberRx = /[\-]?[0-9]+(?:\.[0-9]+)?/g;
        _numberRx.lastIndex = 0;

        var s = this.session.getLine(row);
        while (_numberRx.lastIndex < column) {
            var m = _numberRx.exec(s);
            if(m.index <= column && m.index+m[0].length >= column){
                var number = {
                    value: m[0],
                    start: m.index,
                    end: m.index+m[0].length
                };
                return number;
            }
        }
        return null;
    };
    this.modifyNumber = function(amount) {
        var row = this.selection.getCursor().row;
        var column = this.selection.getCursor().column;
        var charRange = new Range(row, column-1, row, column);

        var c = this.session.getTextRange(charRange);
        if (!isNaN(parseFloat(c)) && isFinite(c)) {
            var nr = this.getNumberAt(row, column);
            if (nr) {
                var fp = nr.value.indexOf(".") >= 0 ? nr.start + nr.value.indexOf(".") + 1 : nr.end;
                var decimals = nr.start + nr.value.length - fp;

                var t = parseFloat(nr.value);
                t *= Math.pow(10, decimals);


                if(fp !== nr.end && column < fp){
                    amount *= Math.pow(10, nr.end - column - 1);
                } else {
                    amount *= Math.pow(10, nr.end - column);
                }

                t += amount;
                t /= Math.pow(10, decimals);
                var nnr = t.toFixed(decimals);
                var replaceRange = new Range(row, nr.start, row, nr.end);
                this.session.replace(replaceRange, nnr);
                this.moveCursorTo(row, Math.max(nr.start +1, column + nnr.length - nr.value.length));

            }
        }
    };
    this.removeLines = function() {
        var rows = this.$getSelectedRows();
        var range;
        if (rows.first === 0 || rows.last+1 < this.session.getLength())
            range = new Range(rows.first, 0, rows.last+1, 0);
        else
            range = new Range(
                rows.first-1, this.session.getLine(rows.first-1).length,
                rows.last, this.session.getLine(rows.last).length
            );
        this.session.remove(range);
        this.clearSelection();
    };

    this.duplicateSelection = function() {
        var sel = this.selection;
        var doc = this.session;
        var range = sel.getRange();
        var reverse = sel.isBackwards();
        if (range.isEmpty()) {
            var row = range.start.row;
            doc.duplicateLines(row, row);
        } else {
            var point = reverse ? range.start : range.end;
            var endPoint = doc.insert(point, doc.getTextRange(range), false);
            range.start = point;
            range.end = endPoint;

            sel.setSelectionRange(range, reverse);
        }
    };
    this.moveLinesDown = function() {
        this.$moveLines(function(firstRow, lastRow) {
            return this.session.moveLinesDown(firstRow, lastRow);
        });
    };
    this.moveLinesUp = function() {
        this.$moveLines(function(firstRow, lastRow) {
            return this.session.moveLinesUp(firstRow, lastRow);
        });
    };
    this.moveText = function(range, toPosition, copy) {
        return this.session.moveText(range, toPosition, copy);
    };
    this.copyLinesUp = function() {
        this.$moveLines(function(firstRow, lastRow) {
            this.session.duplicateLines(firstRow, lastRow);
            return 0;
        });
    };
    this.copyLinesDown = function() {
        this.$moveLines(function(firstRow, lastRow) {
            return this.session.duplicateLines(firstRow, lastRow);
        });
    };
    this.$moveLines = function(mover) {
        var selection = this.selection;
        if (!selection.inMultiSelectMode || this.inVirtualSelectionMode) {
            var range = selection.toOrientedRange();
            var rows = this.$getSelectedRows(range);
            var linesMoved = mover.call(this, rows.first, rows.last);
            range.moveBy(linesMoved, 0);
            selection.fromOrientedRange(range);
        } else {
            var ranges = selection.rangeList.ranges;
            selection.rangeList.detach(this.session);

            for (var i = ranges.length; i--; ) {
                var rangeIndex = i;
                var rows = ranges[i].collapseRows();
                var last = rows.end.row;
                var first = rows.start.row;
                while (i--) {
                    rows = ranges[i].collapseRows();
                    if (first - rows.end.row <= 1)
                        first = rows.end.row;
                    else
                        break;
                }
                i++;

                var linesMoved = mover.call(this, first, last);
                while (rangeIndex >= i) {
                    ranges[rangeIndex].moveBy(linesMoved, 0);
                    rangeIndex--;
                }
            }
            selection.fromOrientedRange(selection.ranges[0]);
            selection.rangeList.attach(this.session);
        }
    };
    this.$getSelectedRows = function() {
        var range = this.getSelectionRange().collapseRows();

        return {
            first: this.session.getRowFoldStart(range.start.row),
            last: this.session.getRowFoldEnd(range.end.row)
        };
    };

    this.onCompositionStart = function(text) {
        this.renderer.showComposition(this.getCursorPosition());
    };

    this.onCompositionUpdate = function(text) {
        this.renderer.setCompositionText(text);
    };

    this.onCompositionEnd = function() {
        this.renderer.hideComposition();
    };
    this.getFirstVisibleRow = function() {
        return this.renderer.getFirstVisibleRow();
    };
    this.getLastVisibleRow = function() {
        return this.renderer.getLastVisibleRow();
    };
    this.isRowVisible = function(row) {
        return (row >= this.getFirstVisibleRow() && row <= this.getLastVisibleRow());
    };
    this.isRowFullyVisible = function(row) {
        return (row >= this.renderer.getFirstFullyVisibleRow() && row <= this.renderer.getLastFullyVisibleRow());
    };
    this.$getVisibleRowCount = function() {
        return this.renderer.getScrollBottomRow() - this.renderer.getScrollTopRow() + 1;
    };

    this.$moveByPage = function(dir, select) {
        var renderer = this.renderer;
        var config = this.renderer.layerConfig;
        var rows = dir * Math.floor(config.height / config.lineHeight);

        this.$blockScrolling++;
        if (select === true) {
            this.selection.$moveSelection(function(){
                this.moveCursorBy(rows, 0);
            });
        } else if (select === false) {
            this.selection.moveCursorBy(rows, 0);
            this.selection.clearSelection();
        }
        this.$blockScrolling--;

        var scrollTop = renderer.scrollTop;

        renderer.scrollBy(0, rows * config.lineHeight);
        if (select != null)
            renderer.scrollCursorIntoView(null, 0.5);

        renderer.animateScrolling(scrollTop);
    };
    this.selectPageDown = function() {
        this.$moveByPage(1, true);
    };
    this.selectPageUp = function() {
        this.$moveByPage(-1, true);
    };
    this.gotoPageDown = function() {
       this.$moveByPage(1, false);
    };
    this.gotoPageUp = function() {
        this.$moveByPage(-1, false);
    };
    this.scrollPageDown = function() {
        this.$moveByPage(1);
    };
    this.scrollPageUp = function() {
        this.$moveByPage(-1);
    };
    this.scrollToRow = function(row) {
        this.renderer.scrollToRow(row);
    };
    this.scrollToLine = function(line, center, animate, callback) {
        this.renderer.scrollToLine(line, center, animate, callback);
    };
    this.centerSelection = function() {
        var range = this.getSelectionRange();
        var pos = {
            row: Math.floor(range.start.row + (range.end.row - range.start.row) / 2),
            column: Math.floor(range.start.column + (range.end.column - range.start.column) / 2)
        };
        this.renderer.alignCursor(pos, 0.5);
    };
    this.getCursorPosition = function() {
        return this.selection.getCursor();
    };
    this.getCursorPositionScreen = function() {
        return this.session.documentToScreenPosition(this.getCursorPosition());
    };
    this.getSelectionRange = function() {
        return this.selection.getRange();
    };
    this.selectAll = function() {
        this.$blockScrolling += 1;
        this.selection.selectAll();
        this.$blockScrolling -= 1;
    };
    this.clearSelection = function() {
        this.selection.clearSelection();
    };
    this.moveCursorTo = function(row, column) {
        this.selection.moveCursorTo(row, column);
    };
    this.moveCursorToPosition = function(pos) {
        this.selection.moveCursorToPosition(pos);
    };
    this.jumpToMatching = function(select, expand) {
        var cursor = this.getCursorPosition();
        var iterator = new TokenIterator(this.session, cursor.row, cursor.column);
        var prevToken = iterator.getCurrentToken();
        var token = prevToken || iterator.stepForward();

        if (!token) return;
        var matchType;
        var found = false;
        var depth = {};
        var i = cursor.column - token.start;
        var bracketType;
        var brackets = {
            ")": "(",
            "(": "(",
            "]": "[",
            "[": "[",
            "{": "{",
            "}": "{"
        };
        
        do {
            if (token.value.match(/[{}()\[\]]/g)) {
                for (; i < token.value.length && !found; i++) {
                    if (!brackets[token.value[i]]) {
                        continue;
                    }

                    bracketType = brackets[token.value[i]] + '.' + token.type.replace("rparen", "lparen");

                    if (isNaN(depth[bracketType])) {
                        depth[bracketType] = 0;
                    }

                    switch (token.value[i]) {
                        case '(':
                        case '[':
                        case '{':
                            depth[bracketType]++;
                            break;
                        case ')':
                        case ']':
                        case '}':
                            depth[bracketType]--;

                            if (depth[bracketType] === -1) {
                                matchType = 'bracket';
                                found = true;
                            }
                        break;
                    }
                }
            }
            else if (token && token.type.indexOf('tag-name') !== -1) {
                if (isNaN(depth[token.value])) {
                    depth[token.value] = 0;
                }
                
                if (prevToken.value === '<') {
                    depth[token.value]++;
                }
                else if (prevToken.value === '</') {
                    depth[token.value]--;
                }
                
                if (depth[token.value] === -1) {
                    matchType = 'tag';
                    found = true;
                }
            }

            if (!found) {
                prevToken = token;
                token = iterator.stepForward();
                i = 0;
            }
        } while (token && !found);
        if (!matchType)
            return;

        var range, pos;
        if (matchType === 'bracket') {
            range = this.session.getBracketRange(cursor);
            if (!range) {
                range = new Range(
                    iterator.getCurrentTokenRow(),
                    iterator.getCurrentTokenColumn() + i - 1,
                    iterator.getCurrentTokenRow(),
                    iterator.getCurrentTokenColumn() + i - 1
                );
                pos = range.start;
                if (expand || pos.row === cursor.row && Math.abs(pos.column - cursor.column) < 2)
                    range = this.session.getBracketRange(pos);
            }
        }
        else if (matchType === 'tag') {
            if (token && token.type.indexOf('tag-name') !== -1) 
                var tag = token.value;
            else
                return;

            range = new Range(
                iterator.getCurrentTokenRow(),
                iterator.getCurrentTokenColumn() - 2,
                iterator.getCurrentTokenRow(),
                iterator.getCurrentTokenColumn() - 2
            );
            if (range.compare(cursor.row, cursor.column) === 0) {
                found = false;
                do {
                    token = prevToken;
                    prevToken = iterator.stepBackward();
                    
                    if (prevToken) {
                        if (prevToken.type.indexOf('tag-close') !== -1) {
                            range.setEnd(iterator.getCurrentTokenRow(), iterator.getCurrentTokenColumn() + 1);
                        }

                        if (token.value === tag && token.type.indexOf('tag-name') !== -1) {
                            if (prevToken.value === '<') {
                                depth[tag]++;
                            }
                            else if (prevToken.value === '</') {
                                depth[tag]--;
                            }
                            
                            if (depth[tag] === 0)
                                found = true;
                        }
                    }
                } while (prevToken && !found);
            }
            if (token && token.type.indexOf('tag-name')) {
                pos = range.start;
                if (pos.row == cursor.row && Math.abs(pos.column - cursor.column) < 2)
                    pos = range.end;
            }
        }

        pos = range && range.cursor || pos;
        if (pos) {
            if (select) {
                if (range && expand) {
                    this.selection.setRange(range);
                } else if (range && range.isEqual(this.getSelectionRange())) {
                    this.clearSelection();
                } else {
                    this.selection.selectTo(pos.row, pos.column);
                }
            } else {
                this.selection.moveTo(pos.row, pos.column);
            }
        }
    };
    this.gotoLine = function(lineNumber, column, animate) {
        this.selection.clearSelection();
        this.session.unfold({row: lineNumber - 1, column: column || 0});

        this.$blockScrolling += 1;
        this.exitMultiSelectMode && this.exitMultiSelectMode();
        this.moveCursorTo(lineNumber - 1, column || 0);
        this.$blockScrolling -= 1;

        if (!this.isRowFullyVisible(lineNumber - 1))
            this.scrollToLine(lineNumber - 1, true, animate);
    };
    this.navigateTo = function(row, column) {
        this.selection.moveTo(row, column);
    };
    this.navigateUp = function(times) {
        if (this.selection.isMultiLine() && !this.selection.isBackwards()) {
            var selectionStart = this.selection.anchor.getPosition();
            return this.moveCursorToPosition(selectionStart);
        }
        this.selection.clearSelection();
        this.selection.moveCursorBy(-times || -1, 0);
    };
    this.navigateDown = function(times) {
        if (this.selection.isMultiLine() && this.selection.isBackwards()) {
            var selectionEnd = this.selection.anchor.getPosition();
            return this.moveCursorToPosition(selectionEnd);
        }
        this.selection.clearSelection();
        this.selection.moveCursorBy(times || 1, 0);
    };
    this.navigateLeft = function(times) {
        if (!this.selection.isEmpty()) {
            var selectionStart = this.getSelectionRange().start;
            this.moveCursorToPosition(selectionStart);
        }
        else {
            times = times || 1;
            while (times--) {
                this.selection.moveCursorLeft();
            }
        }
        this.clearSelection();
    };
    this.navigateRight = function(times) {
        if (!this.selection.isEmpty()) {
            var selectionEnd = this.getSelectionRange().end;
            this.moveCursorToPosition(selectionEnd);
        }
        else {
            times = times || 1;
            while (times--) {
                this.selection.moveCursorRight();
            }
        }
        this.clearSelection();
    };
    this.navigateLineStart = function() {
        this.selection.moveCursorLineStart();
        this.clearSelection();
    };
    this.navigateLineEnd = function() {
        this.selection.moveCursorLineEnd();
        this.clearSelection();
    };
    this.navigateFileEnd = function() {
        this.selection.moveCursorFileEnd();
        this.clearSelection();
    };
    this.navigateFileStart = function() {
        this.selection.moveCursorFileStart();
        this.clearSelection();
    };
    this.navigateWordRight = function() {
        this.selection.moveCursorWordRight();
        this.clearSelection();
    };
    this.navigateWordLeft = function() {
        this.selection.moveCursorWordLeft();
        this.clearSelection();
    };
    this.replace = function(replacement, options) {
        if (options)
            this.$search.set(options);

        var range = this.$search.find(this.session);
        var replaced = 0;
        if (!range)
            return replaced;

        if (this.$tryReplace(range, replacement)) {
            replaced = 1;
        }
        if (range !== null) {
            this.selection.setSelectionRange(range);
            this.renderer.scrollSelectionIntoView(range.start, range.end);
        }

        return replaced;
    };
    this.replaceAll = function(replacement, options) {
        if (options) {
            this.$search.set(options);
        }

        var ranges = this.$search.findAll(this.session);
        var replaced = 0;
        if (!ranges.length)
            return replaced;

        this.$blockScrolling += 1;

        var selection = this.getSelectionRange();
        this.selection.moveTo(0, 0);

        for (var i = ranges.length - 1; i >= 0; --i) {
            if(this.$tryReplace(ranges[i], replacement)) {
                replaced++;
            }
        }

        this.selection.setSelectionRange(selection);
        this.$blockScrolling -= 1;

        return replaced;
    };

    this.$tryReplace = function(range, replacement) {
        var input = this.session.getTextRange(range);
        replacement = this.$search.replace(input, replacement);
        if (replacement !== null) {
            range.end = this.session.replace(range, replacement);
            return range;
        } else {
            return null;
        }
    };
    this.getLastSearchOptions = function() {
        return this.$search.getOptions();
    };
    this.find = function(needle, options, animate) {
        if (!options)
            options = {};

        if (typeof needle == "string" || needle instanceof RegExp)
            options.needle = needle;
        else if (typeof needle == "object")
            oop.mixin(options, needle);

        var range = this.selection.getRange();
        if (options.needle == null) {
            needle = this.session.getTextRange(range)
                || this.$search.$options.needle;
            if (!needle) {
                range = this.session.getWordRange(range.start.row, range.start.column);
                needle = this.session.getTextRange(range);
            }
            this.$search.set({needle: needle});
        }

        this.$search.set(options);
        if (!options.start)
            this.$search.set({start: range});

        var newRange = this.$search.find(this.session);
        if (options.preventScroll)
            return newRange;
        if (newRange) {
            this.revealRange(newRange, animate);
            return newRange;
        }
        if (options.backwards)
            range.start = range.end;
        else
            range.end = range.start;
        this.selection.setRange(range);
    };
    this.findNext = function(options, animate) {
        this.find({skipCurrent: true, backwards: false}, options, animate);
    };
    this.findPrevious = function(options, animate) {
        this.find(options, {skipCurrent: true, backwards: true}, animate);
    };

    this.revealRange = function(range, animate) {
        this.$blockScrolling += 1;
        this.session.unfold(range);
        this.selection.setSelectionRange(range);
        this.$blockScrolling -= 1;

        var scrollTop = this.renderer.scrollTop;
        this.renderer.scrollSelectionIntoView(range.start, range.end, 0.5);
        if (animate !== false)
            this.renderer.animateScrolling(scrollTop);
    };
    this.undo = function() {
        this.$blockScrolling++;
        this.session.getUndoManager().undo();
        this.$blockScrolling--;
        this.renderer.scrollCursorIntoView(null, 0.5);
    };
    this.redo = function() {
        this.$blockScrolling++;
        this.session.getUndoManager().redo();
        this.$blockScrolling--;
        this.renderer.scrollCursorIntoView(null, 0.5);
    };
    this.destroy = function() {
        this.renderer.destroy();
        this._signal("destroy", this);
        if (this.session) {
            this.session.destroy();
        }
    };
    this.setAutoScrollEditorIntoView = function(enable) {
        if (!enable)
            return;
        var rect;
        var self = this;
        var shouldScroll = false;
        if (!this.$scrollAnchor)
            this.$scrollAnchor = document.createElement("div");
        var scrollAnchor = this.$scrollAnchor;
        scrollAnchor.style.cssText = "position:absolute";
        this.container.insertBefore(scrollAnchor, this.container.firstChild);
        var onChangeSelection = this.on("changeSelection", function() {
            shouldScroll = true;
        });
        var onBeforeRender = this.renderer.on("beforeRender", function() {
            if (shouldScroll)
                rect = self.renderer.container.getBoundingClientRect();
        });
        var onAfterRender = this.renderer.on("afterRender", function() {
            if (shouldScroll && rect && (self.isFocused()
                || self.searchBox && self.searchBox.isFocused())
            ) {
                var renderer = self.renderer;
                var pos = renderer.$cursorLayer.$pixelPos;
                var config = renderer.layerConfig;
                var top = pos.top - config.offset;
                if (pos.top >= 0 && top + rect.top < 0) {
                    shouldScroll = true;
                } else if (pos.top < config.height &&
                    pos.top + rect.top + config.lineHeight > window.innerHeight) {
                    shouldScroll = false;
                } else {
                    shouldScroll = null;
                }
                if (shouldScroll != null) {
                    scrollAnchor.style.top = top + "px";
                    scrollAnchor.style.left = pos.left + "px";
                    scrollAnchor.style.height = config.lineHeight + "px";
                    scrollAnchor.scrollIntoView(shouldScroll);
                }
                shouldScroll = rect = null;
            }
        });
        this.setAutoScrollEditorIntoView = function(enable) {
            if (enable)
                return;
            delete this.setAutoScrollEditorIntoView;
            this.removeEventListener("changeSelection", onChangeSelection);
            this.renderer.removeEventListener("afterRender", onAfterRender);
            this.renderer.removeEventListener("beforeRender", onBeforeRender);
        };
    };


    this.$resetCursorStyle = function() {
        var style = this.$cursorStyle || "ace";
        var cursorLayer = this.renderer.$cursorLayer;
        if (!cursorLayer)
            return;
        cursorLayer.setSmoothBlinking(/smooth/.test(style));
        cursorLayer.isBlinking = !this.$readOnly && style != "wide";
        dom.setCssClass(cursorLayer.element, "ace_slim-cursors", /slim/.test(style));
    };

}).call(Editor.prototype);



config.defineOptions(Editor.prototype, "editor", {
    selectionStyle: {
        set: function(style) {
            this.onSelectionChange();
            this._signal("changeSelectionStyle", {data: style});
        },
        initialValue: "line"
    },
    highlightActiveLine: {
        set: function() {this.$updateHighlightActiveLine();},
        initialValue: true
    },
    highlightSelectedWord: {
        set: function(shouldHighlight) {this.$onSelectionChange();},
        initialValue: true
    },
    readOnly: {
        set: function(readOnly) {
            this.$resetCursorStyle(); 
        },
        initialValue: false
    },
    cursorStyle: {
        set: function(val) { this.$resetCursorStyle(); },
        values: ["ace", "slim", "smooth", "wide"],
        initialValue: "ace"
    },
    mergeUndoDeltas: {
        values: [false, true, "always"],
        initialValue: true
    },
    behavioursEnabled: {initialValue: true},
    wrapBehavioursEnabled: {initialValue: true},
    autoScrollEditorIntoView: {
        set: function(val) {this.setAutoScrollEditorIntoView(val)}
    },

    hScrollBarAlwaysVisible: "renderer",
    vScrollBarAlwaysVisible: "renderer",
    highlightGutterLine: "renderer",
    animatedScroll: "renderer",
    showInvisibles: "renderer",
    showPrintMargin: "renderer",
    printMarginColumn: "renderer",
    printMargin: "renderer",
    fadeFoldWidgets: "renderer",
    showFoldWidgets: "renderer",
    showLineNumbers: "renderer",
    showGutter: "renderer",
    displayIndentGuides: "renderer",
    fontSize: "renderer",
    fontFamily: "renderer",
    maxLines: "renderer",
    minLines: "renderer",
    scrollPastEnd: "renderer",
    fixedWidthGutter: "renderer",
    theme: "renderer",

    scrollSpeed: "$mouseHandler",
    dragDelay: "$mouseHandler",
    dragEnabled: "$mouseHandler",
    focusTimout: "$mouseHandler",
    tooltipFollowsMouse: "$mouseHandler",

    firstLineNumber: "session",
    overwrite: "session",
    newLineMode: "session",
    useWorker: "session",
    useSoftTabs: "session",
    tabSize: "session",
    wrap: "session",
    foldStyle: "session",
    mode: "session"
});

exports.Editor = Editor;
});

ace.define("ace/undomanager",["require","exports","module"], function(require, exports, module) {
"use strict";
var UndoManager = function() {
    this.reset();
};

(function() {
    this.execute = function(options) {
        var deltas = options.args[0];
        this.$doc  = options.args[1];
        if (options.merge && this.hasUndo()){
            this.dirtyCounter--;
            deltas = this.$undoStack.pop().concat(deltas);
        }
        this.$undoStack.push(deltas);
        this.$redoStack = [];

        if (this.dirtyCounter < 0) {
            this.dirtyCounter = NaN;
        }
        this.dirtyCounter++;
    };
    this.undo = function(dontSelect) {
        var deltas = this.$undoStack.pop();
        var undoSelectionRange = null;
        if (deltas) {
            undoSelectionRange =
                this.$doc.undoChanges(deltas, dontSelect);
            this.$redoStack.push(deltas);
            this.dirtyCounter--;
        }

        return undoSelectionRange;
    };
    this.redo = function(dontSelect) {
        var deltas = this.$redoStack.pop();
        var redoSelectionRange = null;
        if (deltas) {
            redoSelectionRange =
                this.$doc.redoChanges(deltas, dontSelect);
            this.$undoStack.push(deltas);
            this.dirtyCounter++;
        }

        return redoSelectionRange;
    };
    this.reset = function() {
        this.$undoStack = [];
        this.$redoStack = [];
        this.dirtyCounter = 0;
    };
    this.hasUndo = function() {
        return this.$undoStack.length > 0;
    };
    this.hasRedo = function() {
        return this.$redoStack.length > 0;
    };
    this.markClean = function() {
        this.dirtyCounter = 0;
    };
    this.isClean = function() {
        return this.dirtyCounter === 0;
    };

}).call(UndoManager.prototype);

exports.UndoManager = UndoManager;
});

ace.define("ace/layer/gutter",["require","exports","module","ace/lib/dom","ace/lib/oop","ace/lib/lang","ace/lib/event_emitter"], function(require, exports, module) {
"use strict";

var dom = require("../lib/dom");
var oop = require("../lib/oop");
var lang = require("../lib/lang");
var EventEmitter = require("../lib/event_emitter").EventEmitter;

var Gutter = function(parentEl) {
    this.element = dom.createElement("div");
    this.element.className = "ace_layer ace_gutter-layer";
    parentEl.appendChild(this.element);
    this.setShowFoldWidgets(this.$showFoldWidgets);
    
    this.gutterWidth = 0;

    this.$annotations = [];
    this.$updateAnnotations = this.$updateAnnotations.bind(this);

    this.$cells = [];
};

(function() {

    oop.implement(this, EventEmitter);

    this.setSession = function(session) {
        if (this.session)
            this.session.removeEventListener("change", this.$updateAnnotations);
        this.session = session;
        if (session)
            session.on("change", this.$updateAnnotations);
    };

    this.addGutterDecoration = function(row, className){
        if (window.console)
            console.warn && console.warn("deprecated use session.addGutterDecoration");
        this.session.addGutterDecoration(row, className);
    };

    this.removeGutterDecoration = function(row, className){
        if (window.console)
            console.warn && console.warn("deprecated use session.removeGutterDecoration");
        this.session.removeGutterDecoration(row, className);
    };

    this.setAnnotations = function(annotations) {
        this.$annotations = [];
        for (var i = 0; i < annotations.length; i++) {
            var annotation = annotations[i];
            var row = annotation.row;
            var rowInfo = this.$annotations[row];
            if (!rowInfo)
                rowInfo = this.$annotations[row] = {text: []};
           
            var annoText = annotation.text;
            annoText = annoText ? lang.escapeHTML(annoText) : annotation.html || "";

            if (rowInfo.text.indexOf(annoText) === -1)
                rowInfo.text.push(annoText);

            var type = annotation.type;
            if (type == "error")
                rowInfo.className = " ace_error";
            else if (type == "warning" && rowInfo.className != " ace_error")
                rowInfo.className = " ace_warning";
            else if (type == "info" && (!rowInfo.className))
                rowInfo.className = " ace_info";
        }
    };

    this.$updateAnnotations = function (e) {
        if (!this.$annotations.length)
            return;
        var delta = e.data;
        var range = delta.range;
        var firstRow = range.start.row;
        var len = range.end.row - firstRow;
        if (len === 0) {
        } else if (delta.action == "removeText" || delta.action == "removeLines") {
            this.$annotations.splice(firstRow, len + 1, null);
        } else {
            var args = new Array(len + 1);
            args.unshift(firstRow, 1);
            this.$annotations.splice.apply(this.$annotations, args);
        }
    };

    this.update = function(config) {
        var session = this.session;
        var firstRow = config.firstRow;
        var lastRow = Math.min(config.lastRow + config.gutterOffset,  // needed to compensate for hor scollbar
            session.getLength() - 1);
        var fold = session.getNextFoldLine(firstRow);
        var foldStart = fold ? fold.start.row : Infinity;
        var foldWidgets = this.$showFoldWidgets && session.foldWidgets;
        var breakpoints = session.$breakpoints;
        var decorations = session.$decorations;
        var firstLineNumber = session.$firstLineNumber;
        var lastLineNumber = 0;
        
        var gutterRenderer = session.gutterRenderer || this.$renderer;

        var cell = null;
        var index = -1;
        var row = firstRow;
        while (true) {
            if (row > foldStart) {
                row = fold.end.row + 1;
                fold = session.getNextFoldLine(row, fold);
                foldStart = fold ? fold.start.row : Infinity;
            }
            if (row > lastRow) {
                while (this.$cells.length > index + 1) {
                    cell = this.$cells.pop();
                    this.element.removeChild(cell.element);
                }
                break;
            }

            cell = this.$cells[++index];
            if (!cell) {
                cell = {element: null, textNode: null, foldWidget: null};
                cell.element = dom.createElement("div");
                cell.textNode = document.createTextNode('');
                cell.element.appendChild(cell.textNode);
                this.element.appendChild(cell.element);
                this.$cells[index] = cell;
            }

            var className = "ace_gutter-cell ";
            if (breakpoints[row])
                className += breakpoints[row];
            if (decorations[row])
                className += decorations[row];
            if (this.$annotations[row])
                className += this.$annotations[row].className;
            if (cell.element.className != className)
                cell.element.className = className;

            var height = session.getRowLength(row) * config.lineHeight + "px";
            if (height != cell.element.style.height)
                cell.element.style.height = height;

            if (foldWidgets) {
                var c = foldWidgets[row];
                if (c == null)
                    c = foldWidgets[row] = session.getFoldWidget(row);
            }

            if (c) {
                if (!cell.foldWidget) {
                    cell.foldWidget = dom.createElement("span");
                    cell.element.appendChild(cell.foldWidget);
                }
                var className = "ace_fold-widget ace_" + c;
                if (c == "start" && row == foldStart && row < fold.end.row)
                    className += " ace_closed";
                else
                    className += " ace_open";
                if (cell.foldWidget.className != className)
                    cell.foldWidget.className = className;

                var height = config.lineHeight + "px";
                if (cell.foldWidget.style.height != height)
                    cell.foldWidget.style.height = height;
            } else {
                if (cell.foldWidget) {
                    cell.element.removeChild(cell.foldWidget);
                    cell.foldWidget = null;
                }
            }
            
            var text = lastLineNumber = gutterRenderer
                ? gutterRenderer.getText(session, row)
                : row + firstLineNumber;
            if (text != cell.textNode.data)
                cell.textNode.data = text;

            row++;
        }

        this.element.style.height = config.minHeight + "px";

        if (this.$fixedWidth || session.$useWrapMode)
            lastLineNumber = session.getLength() + firstLineNumber;

        var gutterWidth = gutterRenderer 
            ? gutterRenderer.getWidth(session, lastLineNumber, config)
            : lastLineNumber.toString().length * config.characterWidth;
        
        var padding = this.$padding || this.$computePadding();
        gutterWidth += padding.left + padding.right;
        if (gutterWidth !== this.gutterWidth && !isNaN(gutterWidth)) {
            this.gutterWidth = gutterWidth;
            this.element.style.width = Math.ceil(this.gutterWidth) + "px";
            this._emit("changeGutterWidth", gutterWidth);
        }
    };

    this.$fixedWidth = false;
    
    this.$showLineNumbers = true;
    this.$renderer = "";
    this.setShowLineNumbers = function(show) {
        this.$renderer = !show && {
            getWidth: function() {return ""},
            getText: function() {return ""}
        };
    };
    
    this.getShowLineNumbers = function() {
        return this.$showLineNumbers;
    };
    
    this.$showFoldWidgets = true;
    this.setShowFoldWidgets = function(show) {
        if (show)
            dom.addCssClass(this.element, "ace_folding-enabled");
        else
            dom.removeCssClass(this.element, "ace_folding-enabled");

        this.$showFoldWidgets = show;
        this.$padding = null;
    };
    
    this.getShowFoldWidgets = function() {
        return this.$showFoldWidgets;
    };

    this.$computePadding = function() {
        if (!this.element.firstChild)
            return {left: 0, right: 0};
        var style = dom.computedStyle(this.element.firstChild);
        this.$padding = {};
        this.$padding.left = parseInt(style.paddingLeft) + 1 || 0;
        this.$padding.right = parseInt(style.paddingRight) || 0;
        return this.$padding;
    };

    this.getRegion = function(point) {
        var padding = this.$padding || this.$computePadding();
        var rect = this.element.getBoundingClientRect();
        if (point.x < padding.left + rect.left)
            return "markers";
        if (this.$showFoldWidgets && point.x > rect.right - padding.right)
            return "foldWidgets";
    };

}).call(Gutter.prototype);

exports.Gutter = Gutter;

});

ace.define("ace/layer/marker",["require","exports","module","ace/range","ace/lib/dom"], function(require, exports, module) {
"use strict";

var Range = require("../range").Range;
var dom = require("../lib/dom");

var Marker = function(parentEl) {
    this.element = dom.createElement("div");
    this.element.className = "ace_layer ace_marker-layer";
    parentEl.appendChild(this.element);
};

(function() {

    this.$padding = 0;

    this.setPadding = function(padding) {
        this.$padding = padding;
    };
    this.setSession = function(session) {
        this.session = session;
    };
    
    this.setMarkers = function(markers) {
        this.markers = markers;
    };

    this.update = function(config) {
        var config = config || this.config;
        if (!config)
            return;

        this.config = config;


        var html = [];
        for (var key in this.markers) {
            var marker = this.markers[key];

            if (!marker.range) {
                marker.update(html, this, this.session, config);
                continue;
            }

            var range = marker.range.clipRows(config.firstRow, config.lastRow);
            if (range.isEmpty()) continue;

            range = range.toScreenRange(this.session);
            if (marker.renderer) {
                var top = this.$getTop(range.start.row, config);
                var left = this.$padding + range.start.column * config.characterWidth;
                marker.renderer(html, range, left, top, config);
            } else if (marker.type == "fullLine") {
                this.drawFullLineMarker(html, range, marker.clazz, config);
            } else if (marker.type == "screenLine") {
                this.drawScreenLineMarker(html, range, marker.clazz, config);
            } else if (range.isMultiLine()) {
                if (marker.type == "text")
                    this.drawTextMarker(html, range, marker.clazz, config);
                else
                    this.drawMultiLineMarker(html, range, marker.clazz, config);
            } else {
                this.drawSingleLineMarker(html, range, marker.clazz + " ace_start", config);
            }
        }
        this.element.innerHTML = html.join("");
    };

    this.$getTop = function(row, layerConfig) {
        return (row - layerConfig.firstRowScreen) * layerConfig.lineHeight;
    };
    this.drawTextMarker = function(stringBuilder, range, clazz, layerConfig, extraStyle) {
        var row = range.start.row;

        var lineRange = new Range(
            row, range.start.column,
            row, this.session.getScreenLastRowColumn(row)
        );
        this.drawSingleLineMarker(stringBuilder, lineRange, clazz + " ace_start", layerConfig, 1, extraStyle);
        row = range.end.row;
        lineRange = new Range(row, 0, row, range.end.column);
        this.drawSingleLineMarker(stringBuilder, lineRange, clazz, layerConfig, 0, extraStyle);

        for (row = range.start.row + 1; row < range.end.row; row++) {
            lineRange.start.row = row;
            lineRange.end.row = row;
            lineRange.end.column = this.session.getScreenLastRowColumn(row);
            this.drawSingleLineMarker(stringBuilder, lineRange, clazz, layerConfig, 1, extraStyle);
        }
    };
    this.drawMultiLineMarker = function(stringBuilder, range, clazz, config, extraStyle) {
        var padding = this.$padding;
        var height = config.lineHeight;
        var top = this.$getTop(range.start.row, config);
        var left = padding + range.start.column * config.characterWidth;
        extraStyle = extraStyle || "";

        stringBuilder.push(
            "<div class='", clazz, " ace_start' style='",
            "height:", height, "px;",
            "right:0;",
            "top:", top, "px;",
            "left:", left, "px;", extraStyle, "'></div>"
        );
        top = this.$getTop(range.end.row, config);
        var width = range.end.column * config.characterWidth;

        stringBuilder.push(
            "<div class='", clazz, "' style='",
            "height:", height, "px;",
            "width:", width, "px;",
            "top:", top, "px;",
            "left:", padding, "px;", extraStyle, "'></div>"
        );
        height = (range.end.row - range.start.row - 1) * config.lineHeight;
        if (height < 0)
            return;
        top = this.$getTop(range.start.row + 1, config);

        stringBuilder.push(
            "<div class='", clazz, "' style='",
            "height:", height, "px;",
            "right:0;",
            "top:", top, "px;",
            "left:", padding, "px;", extraStyle, "'></div>"
        );
    };
    this.drawSingleLineMarker = function(stringBuilder, range, clazz, config, extraLength, extraStyle) {
        var height = config.lineHeight;
        var width = (range.end.column + (extraLength || 0) - range.start.column) * config.characterWidth;

        var top = this.$getTop(range.start.row, config);
        var left = this.$padding + range.start.column * config.characterWidth;

        stringBuilder.push(
            "<div class='", clazz, "' style='",
            "height:", height, "px;",
            "width:", width, "px;",
            "top:", top, "px;",
            "left:", left, "px;", extraStyle || "", "'></div>"
        );
    };

    this.drawFullLineMarker = function(stringBuilder, range, clazz, config, extraStyle) {
        var top = this.$getTop(range.start.row, config);
        var height = config.lineHeight;
        if (range.start.row != range.end.row)
            height += this.$getTop(range.end.row, config) - top;

        stringBuilder.push(
            "<div class='", clazz, "' style='",
            "height:", height, "px;",
            "top:", top, "px;",
            "left:0;right:0;", extraStyle || "", "'></div>"
        );
    };
    
    this.drawScreenLineMarker = function(stringBuilder, range, clazz, config, extraStyle) {
        var top = this.$getTop(range.start.row, config);
        var height = config.lineHeight;

        stringBuilder.push(
            "<div class='", clazz, "' style='",
            "height:", height, "px;",
            "top:", top, "px;",
            "left:0;right:0;", extraStyle || "", "'></div>"
        );
    };

}).call(Marker.prototype);

exports.Marker = Marker;

});

ace.define("ace/layer/text",["require","exports","module","ace/lib/oop","ace/lib/dom","ace/lib/lang","ace/lib/useragent","ace/lib/event_emitter"], function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var dom = require("../lib/dom");
var lang = require("../lib/lang");
var useragent = require("../lib/useragent");
var EventEmitter = require("../lib/event_emitter").EventEmitter;

var Text = function(parentEl) {
    this.element = dom.createElement("div");
    this.element.className = "ace_layer ace_text-layer";
    parentEl.appendChild(this.element);
    this.$updateEolChar = this.$updateEolChar.bind(this);
};

(function() {

    oop.implement(this, EventEmitter);

    this.EOF_CHAR = "\xB6";
    this.EOL_CHAR_LF = "\xAC";
    this.EOL_CHAR_CRLF = "\xa4";
    this.EOL_CHAR = this.EOL_CHAR_LF;
    this.TAB_CHAR = "\u2192"; //"\u21E5";
    this.SPACE_CHAR = "\xB7";
    this.$padding = 0;

    this.$updateEolChar = function() {
        var EOL_CHAR = this.session.doc.getNewLineCharacter() == "\n"
           ? this.EOL_CHAR_LF
           : this.EOL_CHAR_CRLF;
        if (this.EOL_CHAR != EOL_CHAR) {
            this.EOL_CHAR = EOL_CHAR;
            return true;
        }
    }

    this.setPadding = function(padding) {
        this.$padding = padding;
        this.element.style.padding = "0 " + padding + "px";
    };

    this.getLineHeight = function() {
        return this.$fontMetrics.$characterSize.height || 0;
    };

    this.getCharacterWidth = function() {
        return this.$fontMetrics.$characterSize.width || 0;
    };
    
    this.$setFontMetrics = function(measure) {
        this.$fontMetrics = measure;
        this.$fontMetrics.on("changeCharacterSize", function(e) {
            this._signal("changeCharacterSize", e);
        }.bind(this));
        this.$pollSizeChanges();
    }

    this.checkForSizeChanges = function() {
        this.$fontMetrics.checkForSizeChanges();
    };
    this.$pollSizeChanges = function() {
        return this.$pollSizeChangesTimer = this.$fontMetrics.$pollSizeChanges();
    };
    this.setSession = function(session) {
        this.session = session;
        if (session)
            this.$computeTabString();
    };

    this.showInvisibles = false;
    this.setShowInvisibles = function(showInvisibles) {
        if (this.showInvisibles == showInvisibles)
            return false;

        this.showInvisibles = showInvisibles;
        this.$computeTabString();
        return true;
    };

    this.displayIndentGuides = true;
    this.setDisplayIndentGuides = function(display) {
        if (this.displayIndentGuides == display)
            return false;

        this.displayIndentGuides = display;
        this.$computeTabString();
        return true;
    };

    this.$tabStrings = [];
    this.onChangeTabSize =
    this.$computeTabString = function() {
        var tabSize = this.session.getTabSize();
        this.tabSize = tabSize;
        var tabStr = this.$tabStrings = [0];
        for (var i = 1; i < tabSize + 1; i++) {
            if (this.showInvisibles) {
                tabStr.push("<span class='ace_invisible ace_invisible_tab'>"
                    + this.TAB_CHAR
                    + lang.stringRepeat("\xa0", i - 1)
                    + "</span>");
            } else {
                tabStr.push(lang.stringRepeat("\xa0", i));
            }
        }
        if (this.displayIndentGuides) {
            this.$indentGuideRe =  /\s\S| \t|\t |\s$/;
            var className = "ace_indent-guide";
            var spaceClass = "";
            var tabClass = "";
            if (this.showInvisibles) {
                className += " ace_invisible";
                spaceClass = " ace_invisible_space";
                tabClass = " ace_invisible_tab";
                var spaceContent = lang.stringRepeat(this.SPACE_CHAR, this.tabSize);
                var tabContent = this.TAB_CHAR + lang.stringRepeat("\xa0", this.tabSize - 1);
            } else{
                var spaceContent = lang.stringRepeat("\xa0", this.tabSize);
                var tabContent = spaceContent;
            }

            this.$tabStrings[" "] = "<span class='" + className + spaceClass + "'>" + spaceContent + "</span>";
            this.$tabStrings["\t"] = "<span class='" + className + tabClass + "'>" + tabContent + "</span>";
        }
    };

    this.updateLines = function(config, firstRow, lastRow) {
        if (this.config.lastRow != config.lastRow ||
            this.config.firstRow != config.firstRow) {
            this.scrollLines(config);
        }
        this.config = config;

        var first = Math.max(firstRow, config.firstRow);
        var last = Math.min(lastRow, config.lastRow);

        var lineElements = this.element.childNodes;
        var lineElementsIdx = 0;

        for (var row = config.firstRow; row < first; row++) {
            var foldLine = this.session.getFoldLine(row);
            if (foldLine) {
                if (foldLine.containsRow(first)) {
                    first = foldLine.start.row;
                    break;
                } else {
                    row = foldLine.end.row;
                }
            }
            lineElementsIdx ++;
        }

        var row = first;
        var foldLine = this.session.getNextFoldLine(row);
        var foldStart = foldLine ? foldLine.start.row : Infinity;

        while (true) {
            if (row > foldStart) {
                row = foldLine.end.row+1;
                foldLine = this.session.getNextFoldLine(row, foldLine);
                foldStart = foldLine ? foldLine.start.row :Infinity;
            }
            if (row > last)
                break;

            var lineElement = lineElements[lineElementsIdx++];
            if (lineElement) {
                var html = [];
                this.$renderLine(
                    html, row, !this.$useLineGroups(), row == foldStart ? foldLine : false
                );
                lineElement.style.height = config.lineHeight * this.session.getRowLength(row) + "px";
                lineElement.innerHTML = html.join("");
            }
            row++;
        }
    };

    this.scrollLines = function(config) {
        var oldConfig = this.config;
        this.config = config;

        if (!oldConfig || oldConfig.lastRow < config.firstRow)
            return this.update(config);

        if (config.lastRow < oldConfig.firstRow)
            return this.update(config);

        var el = this.element;
        if (oldConfig.firstRow < config.firstRow)
            for (var row=this.session.getFoldedRowCount(oldConfig.firstRow, config.firstRow - 1); row>0; row--)
                el.removeChild(el.firstChild);

        if (oldConfig.lastRow > config.lastRow)
            for (var row=this.session.getFoldedRowCount(config.lastRow + 1, oldConfig.lastRow); row>0; row--)
                el.removeChild(el.lastChild);

        if (config.firstRow < oldConfig.firstRow) {
            var fragment = this.$renderLinesFragment(config, config.firstRow, oldConfig.firstRow - 1);
            if (el.firstChild)
                el.insertBefore(fragment, el.firstChild);
            else
                el.appendChild(fragment);
        }

        if (config.lastRow > oldConfig.lastRow) {
            var fragment = this.$renderLinesFragment(config, oldConfig.lastRow + 1, config.lastRow);
            el.appendChild(fragment);
        }
    };

    this.$renderLinesFragment = function(config, firstRow, lastRow) {
        var fragment = this.element.ownerDocument.createDocumentFragment();
        var row = firstRow;
        var foldLine = this.session.getNextFoldLine(row);
        var foldStart = foldLine ? foldLine.start.row : Infinity;

        while (true) {
            if (row > foldStart) {
                row = foldLine.end.row+1;
                foldLine = this.session.getNextFoldLine(row, foldLine);
                foldStart = foldLine ? foldLine.start.row : Infinity;
            }
            if (row > lastRow)
                break;

            var container = dom.createElement("div");

            var html = [];
            this.$renderLine(html, row, false, row == foldStart ? foldLine : false);
            container.innerHTML = html.join("");
            if (this.$useLineGroups()) {
                container.className = 'ace_line_group';
                fragment.appendChild(container);
                container.style.height = config.lineHeight * this.session.getRowLength(row) + "px";

            } else {
                while(container.firstChild)
                    fragment.appendChild(container.firstChild);
            }

            row++;
        }
        return fragment;
    };

    this.update = function(config) {
        this.config = config;

        var html = [];
        var firstRow = config.firstRow, lastRow = config.lastRow;

        var row = firstRow;
        var foldLine = this.session.getNextFoldLine(row);
        var foldStart = foldLine ? foldLine.start.row : Infinity;

        while (true) {
            if (row > foldStart) {
                row = foldLine.end.row+1;
                foldLine = this.session.getNextFoldLine(row, foldLine);
                foldStart = foldLine ? foldLine.start.row :Infinity;
            }
            if (row > lastRow)
                break;

            if (this.$useLineGroups())
                html.push("<div class='ace_line_group' style='height:", config.lineHeight*this.session.getRowLength(row), "px'>")

            this.$renderLine(html, row, false, row == foldStart ? foldLine : false);

            if (this.$useLineGroups())
                html.push("</div>"); // end the line group

            row++;
        }
        this.element.innerHTML = html.join("");
    };

    this.$textToken = {
        "text": true,
        "rparen": true,
        "lparen": true
    };

    this.$renderToken = function(stringBuilder, screenColumn, token, value) {
        var self = this;
        var replaceReg = /\t|&|<|( +)|([\x00-\x1f\x80-\xa0\xad\u1680\u180E\u2000-\u200f\u2028\u2029\u202F\u205F\u3000\uFEFF])|[\u1100-\u115F\u11A3-\u11A7\u11FA-\u11FF\u2329-\u232A\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFB\u3000-\u303E\u3041-\u3096\u3099-\u30FF\u3105-\u312D\u3131-\u318E\u3190-\u31BA\u31C0-\u31E3\u31F0-\u321E\u3220-\u3247\u3250-\u32FE\u3300-\u4DBF\u4E00-\uA48C\uA490-\uA4C6\uA960-\uA97C\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFAFF\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE66\uFE68-\uFE6B\uFF01-\uFF60\uFFE0-\uFFE6]/g;
        var replaceFunc = function(c, a, b, tabIdx, idx4) {
            if (a) {
                return self.showInvisibles ?
                    "<span class='ace_invisible ace_invisible_space'>" + lang.stringRepeat(self.SPACE_CHAR, c.length) + "</span>" :
                    lang.stringRepeat("\xa0", c.length);
            } else if (c == "&") {
                return "&#38;";
            } else if (c == "<") {
                return "&#60;";
            } else if (c == "\t") {
                var tabSize = self.session.getScreenTabSize(screenColumn + tabIdx);
                screenColumn += tabSize - 1;
                return self.$tabStrings[tabSize];
            } else if (c == "\u3000") {
                var classToUse = self.showInvisibles ? "ace_cjk ace_invisible ace_invisible_space" : "ace_cjk";
                var space = self.showInvisibles ? self.SPACE_CHAR : "";
                screenColumn += 1;
                return "<span class='" + classToUse + "' style='width:" +
                    (self.config.characterWidth * 2) +
                    "px'>" + space + "</span>";
            } else if (b) {
                return "<span class='ace_invisible ace_invisible_space ace_invalid'>" + self.SPACE_CHAR + "</span>";
            } else {
                screenColumn += 1;
                return "<span class='ace_cjk' style='width:" +
                    (self.config.characterWidth * 2) +
                    "px'>" + c + "</span>";
            }
        };

        var output = value.replace(replaceReg, replaceFunc);

        if (!this.$textToken[token.type]) {
            var classes = "ace_" + token.type.replace(/\./g, " ace_");
            var style = "";
            if (token.type == "fold")
                style = " style='width:" + (token.value.length * this.config.characterWidth) + "px;' ";
            stringBuilder.push("<span class='", classes, "'", style, ">", output, "</span>");
        }
        else {
            stringBuilder.push(output);
        }
        return screenColumn + value.length;
    };

    this.renderIndentGuide = function(stringBuilder, value, max) {
        var cols = value.search(this.$indentGuideRe);
        if (cols <= 0 || cols >= max)
            return value;
        if (value[0] == " ") {
            cols -= cols % this.tabSize;
            stringBuilder.push(lang.stringRepeat(this.$tabStrings[" "], cols/this.tabSize));
            return value.substr(cols);
        } else if (value[0] == "\t") {
            stringBuilder.push(lang.stringRepeat(this.$tabStrings["\t"], cols));
            return value.substr(cols);
        }
        return value;
    };

    this.$renderWrappedLine = function(stringBuilder, tokens, splits, onlyContents) {
        var chars = 0;
        var split = 0;
        var splitChars = splits[0];
        var screenColumn = 0;

        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i];
            var value = token.value;
            if (i == 0 && this.displayIndentGuides) {
                chars = value.length;
                value = this.renderIndentGuide(stringBuilder, value, splitChars);
                if (!value)
                    continue;
                chars -= value.length;
            }

            if (chars + value.length < splitChars) {
                screenColumn = this.$renderToken(stringBuilder, screenColumn, token, value);
                chars += value.length;
            } else {
                while (chars + value.length >= splitChars) {
                    screenColumn = this.$renderToken(
                        stringBuilder, screenColumn,
                        token, value.substring(0, splitChars - chars)
                    );
                    value = value.substring(splitChars - chars);
                    chars = splitChars;

                    if (!onlyContents) {
                        stringBuilder.push("</div>",
                            "<div class='ace_line' style='height:",
                            this.config.lineHeight, "px'>"
                        );
                    }

                    split ++;
                    screenColumn = 0;
                    splitChars = splits[split] || Number.MAX_VALUE;
                }
                if (value.length != 0) {
                    chars += value.length;
                    screenColumn = this.$renderToken(
                        stringBuilder, screenColumn, token, value
                    );
                }
            }
        }
    };

    this.$renderSimpleLine = function(stringBuilder, tokens) {
        var screenColumn = 0;
        var token = tokens[0];
        var value = token.value;
        if (this.displayIndentGuides)
            value = this.renderIndentGuide(stringBuilder, value);
        if (value)
            screenColumn = this.$renderToken(stringBuilder, screenColumn, token, value);
        for (var i = 1; i < tokens.length; i++) {
            token = tokens[i];
            value = token.value;
            screenColumn = this.$renderToken(stringBuilder, screenColumn, token, value);
        }
    };
    this.$renderLine = function(stringBuilder, row, onlyContents, foldLine) {
        if (!foldLine && foldLine != false)
            foldLine = this.session.getFoldLine(row);

        if (foldLine)
            var tokens = this.$getFoldLineTokens(row, foldLine);
        else
            var tokens = this.session.getTokens(row);


        if (!onlyContents) {
            stringBuilder.push(
                "<div class='ace_line' style='height:", 
                    this.config.lineHeight * (
                        this.$useLineGroups() ? 1 :this.session.getRowLength(row)
                    ), "px'>"
            );
        }

        if (tokens.length) {
            var splits = this.session.getRowSplitData(row);
            if (splits && splits.length)
                this.$renderWrappedLine(stringBuilder, tokens, splits, onlyContents);
            else
                this.$renderSimpleLine(stringBuilder, tokens);
        }

        if (this.showInvisibles) {
            if (foldLine)
                row = foldLine.end.row

            stringBuilder.push(
                "<span class='ace_invisible ace_invisible_eol'>",
                row == this.session.getLength() - 1 ? this.EOF_CHAR : this.EOL_CHAR,
                "</span>"
            );
        }
        if (!onlyContents)
            stringBuilder.push("</div>");
    };

    this.$getFoldLineTokens = function(row, foldLine) {
        var session = this.session;
        var renderTokens = [];

        function addTokens(tokens, from, to) {
            var idx = 0, col = 0;
            while ((col + tokens[idx].value.length) < from) {
                col += tokens[idx].value.length;
                idx++;

                if (idx == tokens.length)
                    return;
            }
            if (col != from) {
                var value = tokens[idx].value.substring(from - col);
                if (value.length > (to - from))
                    value = value.substring(0, to - from);

                renderTokens.push({
                    type: tokens[idx].type,
                    value: value
                });

                col = from + value.length;
                idx += 1;
            }

            while (col < to && idx < tokens.length) {
                var value = tokens[idx].value;
                if (value.length + col > to) {
                    renderTokens.push({
                        type: tokens[idx].type,
                        value: value.substring(0, to - col)
                    });
                } else
                    renderTokens.push(tokens[idx]);
                col += value.length;
                idx += 1;
            }
        }

        var tokens = session.getTokens(row);
        foldLine.walk(function(placeholder, row, column, lastColumn, isNewRow) {
            if (placeholder != null) {
                renderTokens.push({
                    type: "fold",
                    value: placeholder
                });
            } else {
                if (isNewRow)
                    tokens = session.getTokens(row);

                if (tokens.length)
                    addTokens(tokens, lastColumn, column);
            }
        }, foldLine.end.row, this.session.getLine(foldLine.end.row).length);

        return renderTokens;
    };

    this.$useLineGroups = function() {
        return this.session.getUseWrapMode();
    };

    this.destroy = function() {
        clearInterval(this.$pollSizeChangesTimer);
        if (this.$measureNode)
            this.$measureNode.parentNode.removeChild(this.$measureNode);
        delete this.$measureNode;
    };

}).call(Text.prototype);

exports.Text = Text;

});

ace.define("ace/layer/cursor",["require","exports","module","ace/lib/dom"], function(require, exports, module) {
"use strict";

var dom = require("../lib/dom");
var IE8;

var Cursor = function(parentEl) {
    this.element = dom.createElement("div");
    this.element.className = "ace_layer ace_cursor-layer";
    parentEl.appendChild(this.element);
    
    if (IE8 === undefined)
        IE8 = "opacity" in this.element;

    this.isVisible = false;
    this.isBlinking = true;
    this.blinkInterval = 1000;
    this.smoothBlinking = false;

    this.cursors = [];
    this.cursor = this.addCursor();
    dom.addCssClass(this.element, "ace_hidden-cursors");
    this.$updateCursors = this.$updateVisibility.bind(this);
};

(function() {
    
    this.$updateVisibility = function(val) {
        var cursors = this.cursors;
        for (var i = cursors.length; i--; )
            cursors[i].style.visibility = val ? "" : "hidden";
    };
    this.$updateOpacity = function(val) {
        var cursors = this.cursors;
        for (var i = cursors.length; i--; )
            cursors[i].style.opacity = val ? "" : "0";
    };
    

    this.$padding = 0;
    this.setPadding = function(padding) {
        this.$padding = padding;
    };

    this.setSession = function(session) {
        this.session = session;
    };

    this.setBlinking = function(blinking) {
        if (blinking != this.isBlinking){
            this.isBlinking = blinking;
            this.restartTimer();
        }
    };

    this.setBlinkInterval = function(blinkInterval) {
        if (blinkInterval != this.blinkInterval){
            this.blinkInterval = blinkInterval;
            this.restartTimer();
        }
    };

    this.setSmoothBlinking = function(smoothBlinking) {
        if (smoothBlinking != this.smoothBlinking && !IE8) {
            this.smoothBlinking = smoothBlinking;
            dom.setCssClass(this.element, "ace_smooth-blinking", smoothBlinking);
            this.$updateCursors(true);
            this.$updateCursors = (smoothBlinking 
                ? this.$updateOpacity
                : this.$updateVisibility).bind(this);
            this.restartTimer();
        }
    };

    this.addCursor = function() {
        var el = dom.createElement("div");
        el.className = "ace_cursor";
        this.element.appendChild(el);
        this.cursors.push(el);
        return el;
    };

    this.removeCursor = function() {
        if (this.cursors.length > 1) {
            var el = this.cursors.pop();
            el.parentNode.removeChild(el);
            return el;
        }
    };

    this.hideCursor = function() {
        this.isVisible = false;
        dom.addCssClass(this.element, "ace_hidden-cursors");
        this.restartTimer();
    };

    this.showCursor = function() {
        this.isVisible = true;
        dom.removeCssClass(this.element, "ace_hidden-cursors");
        this.restartTimer();
    };

    this.restartTimer = function() {
        var update = this.$updateCursors;
        clearInterval(this.intervalId);
        clearTimeout(this.timeoutId);
        if (this.smoothBlinking) {
            dom.removeCssClass(this.element, "ace_smooth-blinking");
        }
        
        update(true);

        if (!this.isBlinking || !this.blinkInterval || !this.isVisible)
            return;

        if (this.smoothBlinking) {
            setTimeout(function(){
                dom.addCssClass(this.element, "ace_smooth-blinking");
            }.bind(this));
        }
        
        var blink = function(){
            this.timeoutId = setTimeout(function() {
                update(false);
            }, 0.6 * this.blinkInterval);
        }.bind(this);

        this.intervalId = setInterval(function() {
            update(true);
            blink();
        }, this.blinkInterval);

        blink();
    };

    this.getPixelPosition = function(position, onScreen) {
        if (!this.config || !this.session)
            return {left : 0, top : 0};

        if (!position)
            position = this.session.selection.getCursor();
        var pos = this.session.documentToScreenPosition(position);
        var cursorLeft = this.$padding + pos.column * this.config.characterWidth;
        var cursorTop = (pos.row - (onScreen ? this.config.firstRowScreen : 0)) *
            this.config.lineHeight;

        return {left : cursorLeft, top : cursorTop};
    };

    this.update = function(config) {
        this.config = config;

        var selections = this.session.$selectionMarkers;
        var i = 0, cursorIndex = 0;

        if (selections === undefined || selections.length === 0){
            selections = [{cursor: null}];
        }

        for (var i = 0, n = selections.length; i < n; i++) {
            var pixelPos = this.getPixelPosition(selections[i].cursor, true);
            if ((pixelPos.top > config.height + config.offset ||
                 pixelPos.top < 0) && i > 1) {
                continue;
            }

            var style = (this.cursors[cursorIndex++] || this.addCursor()).style;

            style.left = pixelPos.left + "px";
            style.top = pixelPos.top + "px";
            style.width = config.characterWidth + "px";
            style.height = config.lineHeight + "px";
        }
        while (this.cursors.length > cursorIndex)
            this.removeCursor();

        var overwrite = this.session.getOverwrite();
        this.$setOverwrite(overwrite);
        this.$pixelPos = pixelPos;
        this.restartTimer();
    };

    this.$setOverwrite = function(overwrite) {
        if (overwrite != this.overwrite) {
            this.overwrite = overwrite;
            if (overwrite)
                dom.addCssClass(this.element, "ace_overwrite-cursors");
            else
                dom.removeCssClass(this.element, "ace_overwrite-cursors");
        }
    };

    this.destroy = function() {
        clearInterval(this.intervalId);
        clearTimeout(this.timeoutId);
    };

}).call(Cursor.prototype);

exports.Cursor = Cursor;

});

ace.define("ace/scrollbar",["require","exports","module","ace/lib/oop","ace/lib/dom","ace/lib/event","ace/lib/event_emitter"], function(require, exports, module) {
"use strict";

var oop = require("./lib/oop");
var dom = require("./lib/dom");
var event = require("./lib/event");
var EventEmitter = require("./lib/event_emitter").EventEmitter;
var ScrollBar = function(parent) {
    this.element = dom.createElement("div");
    this.element.className = "ace_scrollbar ace_scrollbar" + this.classSuffix;

    this.inner = dom.createElement("div");
    this.inner.className = "ace_scrollbar-inner";
    this.element.appendChild(this.inner);

    parent.appendChild(this.element);

    this.setVisible(false);
    this.skipEvent = false;

    event.addListener(this.element, "scroll", this.onScroll.bind(this));
    event.addListener(this.element, "mousedown", event.preventDefault);
};

(function() {
    oop.implement(this, EventEmitter);

    this.setVisible = function(isVisible) {
        this.element.style.display = isVisible ? "" : "none";
        this.isVisible = isVisible;
    };
}).call(ScrollBar.prototype);
var VScrollBar = function(parent, renderer) {
    ScrollBar.call(this, parent);
    this.scrollTop = 0;
    renderer.$scrollbarWidth = 
    this.width = dom.scrollbarWidth(parent.ownerDocument);
    this.inner.style.width =
    this.element.style.width = (this.width || 15) + 5 + "px";
};

oop.inherits(VScrollBar, ScrollBar);

(function() {

    this.classSuffix = '-v';
    this.onScroll = function() {
        if (!this.skipEvent) {
            this.scrollTop = this.element.scrollTop;
            this._emit("scroll", {data: this.scrollTop});
        }
        this.skipEvent = false;
    };
    this.getWidth = function() {
        return this.isVisible ? this.width : 0;
    };
    this.setHeight = function(height) {
        this.element.style.height = height + "px";
    };
    this.setInnerHeight = function(height) {
        this.inner.style.height = height + "px";
    };
    this.setScrollHeight = function(height) {
        this.inner.style.height = height + "px";
    };
    this.setScrollTop = function(scrollTop) {
        if (this.scrollTop != scrollTop) {
            this.skipEvent = true;
            this.scrollTop = this.element.scrollTop = scrollTop;
        }
    };

}).call(VScrollBar.prototype);
var HScrollBar = function(parent, renderer) {
    ScrollBar.call(this, parent);
    this.scrollLeft = 0;
    this.height = renderer.$scrollbarWidth;
    this.inner.style.height =
    this.element.style.height = (this.height || 15) + 5 + "px";
};

oop.inherits(HScrollBar, ScrollBar);

(function() {

    this.classSuffix = '-h';
    this.onScroll = function() {
        if (!this.skipEvent) {
            this.scrollLeft = this.element.scrollLeft;
            this._emit("scroll", {data: this.scrollLeft});
        }
        this.skipEvent = false;
    };
    this.getHeight = function() {
        return this.isVisible ? this.height : 0;
    };
    this.setWidth = function(width) {
        this.element.style.width = width + "px";
    };
    this.setInnerWidth = function(width) {
        this.inner.style.width = width + "px";
    };
    this.setScrollWidth = function(width) {
        this.inner.style.width = width + "px";
    };
    this.setScrollLeft = function(scrollLeft) {
        if (this.scrollLeft != scrollLeft) {
            this.skipEvent = true;
            this.scrollLeft = this.element.scrollLeft = scrollLeft;
        }
    };

}).call(HScrollBar.prototype);


exports.ScrollBar = VScrollBar; // backward compatibility
exports.ScrollBarV = VScrollBar; // backward compatibility
exports.ScrollBarH = HScrollBar; // backward compatibility

exports.VScrollBar = VScrollBar;
exports.HScrollBar = HScrollBar;
});

ace.define("ace/renderloop",["require","exports","module","ace/lib/event"], function(require, exports, module) {
"use strict";

var event = require("./lib/event");


var RenderLoop = function(onRender, win) {
    this.onRender = onRender;
    this.pending = false;
    this.changes = 0;
    this.window = win || window;
};

(function() {


    this.schedule = function(change) {
        this.changes = this.changes | change;
        if (!this.pending && this.changes) {
            this.pending = true;
            var _self = this;
            event.nextFrame(function() {
                _self.pending = false;
                var changes;
                while (changes = _self.changes) {
                    _self.changes = 0;
                    _self.onRender(changes);
                }
            }, this.window);
        }
    };

}).call(RenderLoop.prototype);

exports.RenderLoop = RenderLoop;
});

ace.define("ace/layer/font_metrics",["require","exports","module","ace/lib/oop","ace/lib/dom","ace/lib/lang","ace/lib/useragent","ace/lib/event_emitter"], function(require, exports, module) {

var oop = require("../lib/oop");
var dom = require("../lib/dom");
var lang = require("../lib/lang");
var useragent = require("../lib/useragent");
var EventEmitter = require("../lib/event_emitter").EventEmitter;

var CHAR_COUNT = 0;

var FontMetrics = exports.FontMetrics = function(parentEl, interval) {
    this.el = dom.createElement("div");
    this.$setMeasureNodeStyles(this.el.style, true);
    
    this.$main = dom.createElement("div");
    this.$setMeasureNodeStyles(this.$main.style);
    
    this.$measureNode = dom.createElement("div");
    this.$setMeasureNodeStyles(this.$measureNode.style);
    
    
    this.el.appendChild(this.$main);
    this.el.appendChild(this.$measureNode);
    parentEl.appendChild(this.el);
    
    if (!CHAR_COUNT)
        this.$testFractionalRect();
    this.$measureNode.innerHTML = lang.stringRepeat("X", CHAR_COUNT);
    
    this.$characterSize = {width: 0, height: 0};
    this.checkForSizeChanges();
};

(function() {

    oop.implement(this, EventEmitter);
        
    this.$characterSize = {width: 0, height: 0};
    
    this.$testFractionalRect = function() {
        var el = dom.createElement("div");
        this.$setMeasureNodeStyles(el.style);
        el.style.width = "0.2px";
        document.documentElement.appendChild(el);
        var w = el.getBoundingClientRect().width;
        if (w > 0 && w < 1)
            CHAR_COUNT = 50;
        else
            CHAR_COUNT = 100;
        el.parentNode.removeChild(el);
    };
    
    this.$setMeasureNodeStyles = function(style, isRoot) {
        style.width = style.height = "auto";
        style.left = style.top = "-100px";
        style.visibility = "hidden";
        style.position = "fixed";
        style.whiteSpace = "pre";

        if (useragent.isIE < 8) {
            style["font-family"] = "inherit";
        } else {
            style.font = "inherit";
        }
        style.overflow = isRoot ? "hidden" : "visible";
    };

    this.checkForSizeChanges = function() {
        var size = this.$measureSizes();
        if (size && (this.$characterSize.width !== size.width || this.$characterSize.height !== size.height)) {
            this.$measureNode.style.fontWeight = "bold";
            var boldSize = this.$measureSizes();
            this.$measureNode.style.fontWeight = "";
            this.$characterSize = size;
            this.charSizes = Object.create(null);
            this.allowBoldFonts = boldSize && boldSize.width === size.width && boldSize.height === size.height;
            this._emit("changeCharacterSize", {data: size});
        }
    };

    this.$pollSizeChanges = function() {
        if (this.$pollSizeChangesTimer)
            return this.$pollSizeChangesTimer;
        var self = this;
        return this.$pollSizeChangesTimer = setInterval(function() {
            self.checkForSizeChanges();
        }, 500);
    };
    
    this.setPolling = function(val) {
        if (val) {
            this.$pollSizeChanges();
        } else {
            if (this.$pollSizeChangesTimer)
                this.$pollSizeChangesTimer;
        }
    };

    this.$measureSizes = function() {
        if (CHAR_COUNT === 50) {
            var rect = null;
            try { 
               rect = this.$measureNode.getBoundingClientRect();
            } catch(e) {
               rect = {width: 0, height:0 };
            };
            var size = {
                height: rect.height,
                width: rect.width / CHAR_COUNT
            };
        } else {
            var size = {
                height: this.$measureNode.clientHeight,
                width: this.$measureNode.clientWidth / CHAR_COUNT
            };
        }
        if (size.width === 0 || size.height === 0)
            return null;
        return size;
    };

    this.$measureCharWidth = function(ch) {
        this.$main.innerHTML = lang.stringRepeat(ch, CHAR_COUNT);
        var rect = this.$main.getBoundingClientRect();
        return rect.width / CHAR_COUNT;
    };
    
    this.getCharacterWidth = function(ch) {
        var w = this.charSizes[ch];
        if (w === undefined) {
            this.charSizes[ch] = this.$measureCharWidth(ch) / this.$characterSize.width;
        }
        return w;
    };

    this.destroy = function() {
        clearInterval(this.$pollSizeChangesTimer);
        if (this.el && this.el.parentNode)
            this.el.parentNode.removeChild(this.el);
    };

}).call(FontMetrics.prototype);

});

ace.define("ace/virtual_renderer",["require","exports","module","ace/lib/oop","ace/lib/dom","ace/config","ace/lib/useragent","ace/layer/gutter","ace/layer/marker","ace/layer/text","ace/layer/cursor","ace/scrollbar","ace/scrollbar","ace/renderloop","ace/layer/font_metrics","ace/lib/event_emitter"], function(require, exports, module) {
"use strict";

var oop = require("./lib/oop");
var dom = require("./lib/dom");
var config = require("./config");
var useragent = require("./lib/useragent");
var GutterLayer = require("./layer/gutter").Gutter;
var MarkerLayer = require("./layer/marker").Marker;
var TextLayer = require("./layer/text").Text;
var CursorLayer = require("./layer/cursor").Cursor;
var HScrollBar = require("./scrollbar").HScrollBar;
var VScrollBar = require("./scrollbar").VScrollBar;
var RenderLoop = require("./renderloop").RenderLoop;
var FontMetrics = require("./layer/font_metrics").FontMetrics;
var EventEmitter = require("./lib/event_emitter").EventEmitter;
var editorCss = ".ace_editor {\
position: relative;\
overflow: hidden;\
font: 12px/normal 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace;\
direction: ltr;\
}\
.ace_scroller {\
position: absolute;\
overflow: hidden;\
top: 0;\
bottom: 0;\
background-color: inherit;\
-ms-user-select: none;\
-moz-user-select: none;\
-webkit-user-select: none;\
user-select: none;\
cursor: text;\
}\
.ace_content {\
position: absolute;\
-moz-box-sizing: border-box;\
-webkit-box-sizing: border-box;\
box-sizing: border-box;\
min-width: 100%;\
}\
.ace_dragging .ace_scroller:before{\
position: absolute;\
top: 0;\
left: 0;\
right: 0;\
bottom: 0;\
content: '';\
background: rgba(250, 250, 250, 0.01);\
z-index: 1000;\
}\
.ace_dragging.ace_dark .ace_scroller:before{\
background: rgba(0, 0, 0, 0.01);\
}\
.ace_selecting, .ace_selecting * {\
cursor: text !important;\
}\
.ace_gutter {\
position: absolute;\
overflow : hidden;\
width: auto;\
top: 0;\
bottom: 0;\
left: 0;\
cursor: default;\
z-index: 4;\
-ms-user-select: none;\
-moz-user-select: none;\
-webkit-user-select: none;\
user-select: none;\
}\
.ace_gutter-active-line {\
position: absolute;\
left: 0;\
right: 0;\
}\
.ace_scroller.ace_scroll-left {\
box-shadow: 17px 0 16px -16px rgba(0, 0, 0, 0.4) inset;\
}\
.ace_gutter-cell {\
padding-left: 19px;\
padding-right: 6px;\
background-repeat: no-repeat;\
}\
.ace_gutter-cell.ace_error {\
background-image: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAABOFBMVEX/////////QRswFAb/Ui4wFAYwFAYwFAaWGAfDRymzOSH/PxswFAb/SiUwFAYwFAbUPRvjQiDllog5HhHdRybsTi3/Tyv9Tir+Syj/UC3////XurebMBIwFAb/RSHbPx/gUzfdwL3kzMivKBAwFAbbvbnhPx66NhowFAYwFAaZJg8wFAaxKBDZurf/RB6mMxb/SCMwFAYwFAbxQB3+RB4wFAb/Qhy4Oh+4QifbNRcwFAYwFAYwFAb/QRzdNhgwFAYwFAbav7v/Uy7oaE68MBK5LxLewr/r2NXewLswFAaxJw4wFAbkPRy2PyYwFAaxKhLm1tMwFAazPiQwFAaUGAb/QBrfOx3bvrv/VC/maE4wFAbRPBq6MRO8Qynew8Dp2tjfwb0wFAbx6eju5+by6uns4uH9/f36+vr/GkHjAAAAYnRSTlMAGt+64rnWu/bo8eAA4InH3+DwoN7j4eLi4xP99Nfg4+b+/u9B/eDs1MD1mO7+4PHg2MXa347g7vDizMLN4eG+Pv7i5evs/v79yu7S3/DV7/498Yv24eH+4ufQ3Ozu/v7+y13sRqwAAADLSURBVHjaZc/XDsFgGIBhtDrshlitmk2IrbHFqL2pvXf/+78DPokj7+Fz9qpU/9UXJIlhmPaTaQ6QPaz0mm+5gwkgovcV6GZzd5JtCQwgsxoHOvJO15kleRLAnMgHFIESUEPmawB9ngmelTtipwwfASilxOLyiV5UVUyVAfbG0cCPHig+GBkzAENHS0AstVF6bacZIOzgLmxsHbt2OecNgJC83JERmePUYq8ARGkJx6XtFsdddBQgZE2nPR6CICZhawjA4Fb/chv+399kfR+MMMDGOQAAAABJRU5ErkJggg==\");\
background-repeat: no-repeat;\
background-position: 2px center;\
}\
.ace_gutter-cell.ace_warning {\
background-image: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAmVBMVEX///8AAAD///8AAAAAAABPSzb/5sAAAAB/blH/73z/ulkAAAAAAAD85pkAAAAAAAACAgP/vGz/rkDerGbGrV7/pkQICAf////e0IsAAAD/oED/qTvhrnUAAAD/yHD/njcAAADuv2r/nz//oTj/p064oGf/zHAAAAA9Nir/tFIAAAD/tlTiuWf/tkIAAACynXEAAAAAAAAtIRW7zBpBAAAAM3RSTlMAABR1m7RXO8Ln31Z36zT+neXe5OzooRDfn+TZ4p3h2hTf4t3k3ucyrN1K5+Xaks52Sfs9CXgrAAAAjklEQVR42o3PbQ+CIBQFYEwboPhSYgoYunIqqLn6/z8uYdH8Vmdnu9vz4WwXgN/xTPRD2+sgOcZjsge/whXZgUaYYvT8QnuJaUrjrHUQreGczuEafQCO/SJTufTbroWsPgsllVhq3wJEk2jUSzX3CUEDJC84707djRc5MTAQxoLgupWRwW6UB5fS++NV8AbOZgnsC7BpEAAAAABJRU5ErkJggg==\");\
background-position: 2px center;\
}\
.ace_gutter-cell.ace_info {\
background-image: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAAAAAA6mKC9AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAJ0Uk5TAAB2k804AAAAPklEQVQY02NgIB68QuO3tiLznjAwpKTgNyDbMegwisCHZUETUZV0ZqOquBpXj2rtnpSJT1AEnnRmL2OgGgAAIKkRQap2htgAAAAASUVORK5CYII=\");\
background-position: 2px center;\
}\
.ace_dark .ace_gutter-cell.ace_info {\
background-image: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAJFBMVEUAAAChoaGAgIAqKiq+vr6tra1ZWVmUlJSbm5s8PDxubm56enrdgzg3AAAAAXRSTlMAQObYZgAAAClJREFUeNpjYMAPdsMYHegyJZFQBlsUlMFVCWUYKkAZMxZAGdxlDMQBAG+TBP4B6RyJAAAAAElFTkSuQmCC\");\
}\
.ace_scrollbar {\
position: absolute;\
right: 0;\
bottom: 0;\
z-index: 6;\
}\
.ace_scrollbar-inner {\
position: absolute;\
cursor: text;\
left: 0;\
top: 0;\
}\
.ace_scrollbar-v{\
overflow-x: hidden;\
overflow-y: scroll;\
top: 0;\
}\
.ace_scrollbar-h {\
overflow-x: scroll;\
overflow-y: hidden;\
left: 0;\
}\
.ace_print-margin {\
position: absolute;\
height: 100%;\
}\
.ace_text-input {\
position: absolute;\
z-index: 0;\
width: 0.5em;\
height: 1em;\
opacity: 0;\
background: transparent;\
-moz-appearance: none;\
appearance: none;\
border: none;\
resize: none;\
outline: none;\
overflow: hidden;\
font: inherit;\
padding: 0 1px;\
margin: 0 -1px;\
text-indent: -1em;\
-ms-user-select: text;\
-moz-user-select: text;\
-webkit-user-select: text;\
user-select: text;\
}\
.ace_text-input.ace_composition {\
background: inherit;\
color: inherit;\
z-index: 1000;\
opacity: 1;\
text-indent: 0;\
}\
.ace_layer {\
z-index: 1;\
position: absolute;\
overflow: hidden;\
white-space: pre;\
height: 100%;\
width: 100%;\
-moz-box-sizing: border-box;\
-webkit-box-sizing: border-box;\
box-sizing: border-box;\
pointer-events: none;\
}\
.ace_gutter-layer {\
position: relative;\
width: auto;\
text-align: right;\
pointer-events: auto;\
}\
.ace_text-layer {\
font: inherit !important;\
}\
.ace_cjk {\
display: inline-block;\
text-align: center;\
}\
.ace_cursor-layer {\
z-index: 4;\
}\
.ace_cursor {\
z-index: 4;\
position: absolute;\
-moz-box-sizing: border-box;\
-webkit-box-sizing: border-box;\
box-sizing: border-box;\
border-left: 2px solid\
}\
.ace_slim-cursors .ace_cursor {\
border-left-width: 1px;\
}\
.ace_overwrite-cursors .ace_cursor {\
border-left-width: 0;\
border-bottom: 1px solid;\
}\
.ace_hidden-cursors .ace_cursor {\
opacity: 0.2;\
}\
.ace_smooth-blinking .ace_cursor {\
-webkit-transition: opacity 0.18s;\
transition: opacity 0.18s;\
}\
.ace_editor.ace_multiselect .ace_cursor {\
border-left-width: 1px;\
}\
.ace_marker-layer .ace_step, .ace_marker-layer .ace_stack {\
position: absolute;\
z-index: 3;\
}\
.ace_marker-layer .ace_selection {\
position: absolute;\
z-index: 5;\
}\
.ace_marker-layer .ace_bracket {\
position: absolute;\
z-index: 6;\
}\
.ace_marker-layer .ace_active-line {\
position: absolute;\
z-index: 2;\
}\
.ace_marker-layer .ace_selected-word {\
position: absolute;\
z-index: 4;\
-moz-box-sizing: border-box;\
-webkit-box-sizing: border-box;\
box-sizing: border-box;\
}\
.ace_line .ace_fold {\
-moz-box-sizing: border-box;\
-webkit-box-sizing: border-box;\
box-sizing: border-box;\
display: inline-block;\
height: 11px;\
margin-top: -2px;\
vertical-align: middle;\
background-image:\
url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAAJCAYAAADU6McMAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAJpJREFUeNpi/P//PwOlgAXGYGRklAVSokD8GmjwY1wasKljQpYACtpCFeADcHVQfQyMQAwzwAZI3wJKvCLkfKBaMSClBlR7BOQikCFGQEErIH0VqkabiGCAqwUadAzZJRxQr/0gwiXIal8zQQPnNVTgJ1TdawL0T5gBIP1MUJNhBv2HKoQHHjqNrA4WO4zY0glyNKLT2KIfIMAAQsdgGiXvgnYAAAAASUVORK5CYII=\"),\
url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAA3CAYAAADNNiA5AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAACJJREFUeNpi+P//fxgTAwPDBxDxD078RSX+YeEyDFMCIMAAI3INmXiwf2YAAAAASUVORK5CYII=\");\
background-repeat: no-repeat, repeat-x;\
background-position: center center, top left;\
color: transparent;\
border: 1px solid black;\
border-radius: 2px;\
cursor: pointer;\
pointer-events: auto;\
}\
.ace_dark .ace_fold {\
}\
.ace_fold:hover{\
background-image:\
url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAAJCAYAAADU6McMAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAJpJREFUeNpi/P//PwOlgAXGYGRklAVSokD8GmjwY1wasKljQpYACtpCFeADcHVQfQyMQAwzwAZI3wJKvCLkfKBaMSClBlR7BOQikCFGQEErIH0VqkabiGCAqwUadAzZJRxQr/0gwiXIal8zQQPnNVTgJ1TdawL0T5gBIP1MUJNhBv2HKoQHHjqNrA4WO4zY0glyNKLT2KIfIMAAQsdgGiXvgnYAAAAASUVORK5CYII=\"),\
url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAA3CAYAAADNNiA5AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAACBJREFUeNpi+P//fz4TAwPDZxDxD5X4i5fLMEwJgAADAEPVDbjNw87ZAAAAAElFTkSuQmCC\");\
}\
.ace_tooltip {\
background-color: #FFF;\
background-image: -webkit-linear-gradient(top, transparent, rgba(0, 0, 0, 0.1));\
background-image: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.1));\
border: 1px solid gray;\
border-radius: 1px;\
box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);\
color: black;\
max-width: 100%;\
padding: 3px 4px;\
position: fixed;\
z-index: 999999;\
-moz-box-sizing: border-box;\
-webkit-box-sizing: border-box;\
box-sizing: border-box;\
cursor: default;\
white-space: pre;\
word-wrap: break-word;\
line-height: normal;\
font-style: normal;\
font-weight: normal;\
letter-spacing: normal;\
pointer-events: none;\
}\
.ace_folding-enabled > .ace_gutter-cell {\
padding-right: 13px;\
}\
.ace_fold-widget {\
-moz-box-sizing: border-box;\
-webkit-box-sizing: border-box;\
box-sizing: border-box;\
margin: 0 -12px 0 1px;\
display: none;\
width: 11px;\
vertical-align: top;\
background-image: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAANElEQVR42mWKsQ0AMAzC8ixLlrzQjzmBiEjp0A6WwBCSPgKAXoLkqSot7nN3yMwR7pZ32NzpKkVoDBUxKAAAAABJRU5ErkJggg==\");\
background-repeat: no-repeat;\
background-position: center;\
border-radius: 3px;\
border: 1px solid transparent;\
cursor: pointer;\
}\
.ace_folding-enabled .ace_fold-widget {\
display: inline-block;   \
}\
.ace_fold-widget.ace_end {\
background-image: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAANElEQVR42m3HwQkAMAhD0YzsRchFKI7sAikeWkrxwScEB0nh5e7KTPWimZki4tYfVbX+MNl4pyZXejUO1QAAAABJRU5ErkJggg==\");\
}\
.ace_fold-widget.ace_closed {\
background-image: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAAAGCAYAAAAG5SQMAAAAOUlEQVR42jXKwQkAMAgDwKwqKD4EwQ26sSOkVWjgIIHAzPiCgaqiqnJHZnKICBERHN194O5b9vbLuAVRL+l0YWnZAAAAAElFTkSuQmCCXA==\");\
}\
.ace_fold-widget:hover {\
border: 1px solid rgba(0, 0, 0, 0.3);\
background-color: rgba(255, 255, 255, 0.2);\
box-shadow: 0 1px 1px rgba(255, 255, 255, 0.7);\
}\
.ace_fold-widget:active {\
border: 1px solid rgba(0, 0, 0, 0.4);\
background-color: rgba(0, 0, 0, 0.05);\
box-shadow: 0 1px 1px rgba(255, 255, 255, 0.8);\
}\
.ace_dark .ace_fold-widget {\
background-image: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHklEQVQIW2P4//8/AzoGEQ7oGCaLLAhWiSwB146BAQCSTPYocqT0AAAAAElFTkSuQmCC\");\
}\
.ace_dark .ace_fold-widget.ace_end {\
background-image: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAH0lEQVQIW2P4//8/AxQ7wNjIAjDMgC4AxjCVKBirIAAF0kz2rlhxpAAAAABJRU5ErkJggg==\");\
}\
.ace_dark .ace_fold-widget.ace_closed {\
background-image: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAAAFCAYAAACAcVaiAAAAHElEQVQIW2P4//+/AxAzgDADlOOAznHAKgPWAwARji8UIDTfQQAAAABJRU5ErkJggg==\");\
}\
.ace_dark .ace_fold-widget:hover {\
box-shadow: 0 1px 1px rgba(255, 255, 255, 0.2);\
background-color: rgba(255, 255, 255, 0.1);\
}\
.ace_dark .ace_fold-widget:active {\
box-shadow: 0 1px 1px rgba(255, 255, 255, 0.2);\
}\
.ace_fold-widget.ace_invalid {\
background-color: #FFB4B4;\
border-color: #DE5555;\
}\
.ace_fade-fold-widgets .ace_fold-widget {\
-webkit-transition: opacity 0.4s ease 0.05s;\
transition: opacity 0.4s ease 0.05s;\
opacity: 0;\
}\
.ace_fade-fold-widgets:hover .ace_fold-widget {\
-webkit-transition: opacity 0.05s ease 0.05s;\
transition: opacity 0.05s ease 0.05s;\
opacity:1;\
}\
.ace_underline {\
text-decoration: underline;\
}\
.ace_bold {\
font-weight: bold;\
}\
.ace_nobold .ace_bold {\
font-weight: normal;\
}\
.ace_italic {\
font-style: italic;\
}\
.ace_error-marker {\
background-color: rgba(255, 0, 0,0.2);\
position: absolute;\
z-index: 9;\
}\
.ace_highlight-marker {\
background-color: rgba(255, 255, 0,0.2);\
position: absolute;\
z-index: 8;\
}\
";

dom.importCssString(editorCss, "ace_editor");

var VirtualRenderer = function(container, theme) {
    var _self = this;

    this.container = container || dom.createElement("div");
    this.$keepTextAreaAtCursor = !useragent.isOldIE;

    dom.addCssClass(this.container, "ace_editor");

    this.setTheme(theme);

    this.$gutter = dom.createElement("div");
    this.$gutter.className = "ace_gutter";
    this.container.appendChild(this.$gutter);

    this.scroller = dom.createElement("div");
    this.scroller.className = "ace_scroller";
    this.container.appendChild(this.scroller);

    this.content = dom.createElement("div");
    this.content.className = "ace_content";
    this.scroller.appendChild(this.content);

    this.$gutterLayer = new GutterLayer(this.$gutter);
    this.$gutterLayer.on("changeGutterWidth", this.onGutterResize.bind(this));

    this.$markerBack = new MarkerLayer(this.content);

    var textLayer = this.$textLayer = new TextLayer(this.content);
    this.canvas = textLayer.element;

    this.$markerFront = new MarkerLayer(this.content);

    this.$cursorLayer = new CursorLayer(this.content);
    this.$horizScroll = false;
    this.$vScroll = false;

    this.scrollBar = 
    this.scrollBarV = new VScrollBar(this.container, this);
    this.scrollBarH = new HScrollBar(this.container, this);
    this.scrollBarV.addEventListener("scroll", function(e) {
        if (!_self.$scrollAnimation)
            _self.session.setScrollTop(e.data - _self.scrollMargin.top);
    });
    this.scrollBarH.addEventListener("scroll", function(e) {
        if (!_self.$scrollAnimation)
            _self.session.setScrollLeft(e.data - _self.scrollMargin.left);
    });

    this.scrollTop = 0;
    this.scrollLeft = 0;

    this.cursorPos = {
        row : 0,
        column : 0
    };

    this.$fontMetrics = new FontMetrics(this.container, 500);
    this.$textLayer.$setFontMetrics(this.$fontMetrics);
    this.$textLayer.addEventListener("changeCharacterSize", function(e) {
        _self.updateCharacterSize();
        _self.onResize(true, _self.gutterWidth, _self.$size.width, _self.$size.height);
        _self._signal("changeCharacterSize", e);
    });

    this.$size = {
        width: 0,
        height: 0,
        scrollerHeight: 0,
        scrollerWidth: 0,
        $dirty: true
    };

    this.layerConfig = {
        width : 1,
        padding : 0,
        firstRow : 0,
        firstRowScreen: 0,
        lastRow : 0,
        lineHeight : 0,
        characterWidth : 0,
        minHeight : 1,
        maxHeight : 1,
        offset : 0,
        height : 1,
        gutterOffset: 1
    };
    
    this.scrollMargin = {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        v: 0,
        h: 0
    };

    this.$loop = new RenderLoop(
        this.$renderChanges.bind(this),
        this.container.ownerDocument.defaultView
    );
    this.$loop.schedule(this.CHANGE_FULL);

    this.updateCharacterSize();
    this.setPadding(4);
    config.resetOptions(this);
    config._emit("renderer", this);
};

(function() {

    this.CHANGE_CURSOR = 1;
    this.CHANGE_MARKER = 2;
    this.CHANGE_GUTTER = 4;
    this.CHANGE_SCROLL = 8;
    this.CHANGE_LINES = 16;
    this.CHANGE_TEXT = 32;
    this.CHANGE_SIZE = 64;
    this.CHANGE_MARKER_BACK = 128;
    this.CHANGE_MARKER_FRONT = 256;
    this.CHANGE_FULL = 512;
    this.CHANGE_H_SCROLL = 1024;

    oop.implement(this, EventEmitter);

    this.updateCharacterSize = function() {
        if (this.$textLayer.allowBoldFonts != this.$allowBoldFonts) {
            this.$allowBoldFonts = this.$textLayer.allowBoldFonts;
            this.setStyle("ace_nobold", !this.$allowBoldFonts);
        }

        this.layerConfig.characterWidth =
        this.characterWidth = this.$textLayer.getCharacterWidth();
        this.layerConfig.lineHeight =
        this.lineHeight = this.$textLayer.getLineHeight();
        this.$updatePrintMargin();
    };
    this.setSession = function(session) {
        if (this.session)
            this.session.doc.off("changeNewLineMode", this.onChangeNewLineMode);
            
        this.session = session;
        if (session && this.scrollMargin.top && session.getScrollTop() <= 0)
            session.setScrollTop(-this.scrollMargin.top);

        this.$cursorLayer.setSession(session);
        this.$markerBack.setSession(session);
        this.$markerFront.setSession(session);
        this.$gutterLayer.setSession(session);
        this.$textLayer.setSession(session);
        if (!session)
            return;
        
        this.$loop.schedule(this.CHANGE_FULL);
        this.session.$setFontMetrics(this.$fontMetrics);
        
        this.onChangeNewLineMode = this.onChangeNewLineMode.bind(this);
        this.onChangeNewLineMode()
        this.session.doc.on("changeNewLineMode", this.onChangeNewLineMode);
    };
    this.updateLines = function(firstRow, lastRow, force) {
        if (lastRow === undefined)
            lastRow = Infinity;

        if (!this.$changedLines) {
            this.$changedLines = {
                firstRow: firstRow,
                lastRow: lastRow
            };
        }
        else {
            if (this.$changedLines.firstRow > firstRow)
                this.$changedLines.firstRow = firstRow;

            if (this.$changedLines.lastRow < lastRow)
                this.$changedLines.lastRow = lastRow;
        }
        if (this.$changedLines.lastRow < this.layerConfig.firstRow) {
            if (force)
                this.$changedLines.lastRow = this.layerConfig.lastRow;
            else
                return;
        }
        if (this.$changedLines.firstRow > this.layerConfig.lastRow)
            return;
        this.$loop.schedule(this.CHANGE_LINES);
    };

    this.onChangeNewLineMode = function() {
        this.$loop.schedule(this.CHANGE_TEXT);
        this.$textLayer.$updateEolChar();
    };
    
    this.onChangeTabSize = function() {
        this.$loop.schedule(this.CHANGE_TEXT | this.CHANGE_MARKER);
        this.$textLayer.onChangeTabSize();
    };
    this.updateText = function() {
        this.$loop.schedule(this.CHANGE_TEXT);
    };
    this.updateFull = function(force) {
        if (force)
            this.$renderChanges(this.CHANGE_FULL, true);
        else
            this.$loop.schedule(this.CHANGE_FULL);
    };
    this.updateFontSize = function() {
        this.$textLayer.checkForSizeChanges();
    };

    this.$changes = 0;
    this.$updateSizeAsync = function() {
        if (this.$loop.pending)
            this.$size.$dirty = true;
        else
            this.onResize();
    };
    this.onResize = function(force, gutterWidth, width, height) {
        if (this.resizing > 2)
            return;
        else if (this.resizing > 0)
            this.resizing++;
        else
            this.resizing = force ? 1 : 0;
        var el = this.container;
        if (!height)
            height = el.clientHeight || el.scrollHeight;
        if (!width)
            width = el.clientWidth || el.scrollWidth;
        var changes = this.$updateCachedSize(force, gutterWidth, width, height);

        
        if (!this.$size.scrollerHeight || (!width && !height))
            return this.resizing = 0;

        if (force)
            this.$gutterLayer.$padding = null;

        if (force)
            this.$renderChanges(changes | this.$changes, true);
        else
            this.$loop.schedule(changes | this.$changes);

        if (this.resizing)
            this.resizing = 0;
    };
    
    this.$updateCachedSize = function(force, gutterWidth, width, height) {
        height -= (this.$extraHeight || 0);
        var changes = 0;
        var size = this.$size;
        var oldSize = {
            width: size.width,
            height: size.height,
            scrollerHeight: size.scrollerHeight,
            scrollerWidth: size.scrollerWidth
        };
        if (height && (force || size.height != height)) {
            size.height = height;
            changes |= this.CHANGE_SIZE;

            size.scrollerHeight = size.height;
            if (this.$horizScroll)
                size.scrollerHeight -= this.scrollBarH.getHeight();
            this.scrollBarV.element.style.bottom = this.scrollBarH.getHeight() + "px";

            changes = changes | this.CHANGE_SCROLL;
        }

        if (width && (force || size.width != width)) {
            changes |= this.CHANGE_SIZE;
            size.width = width;
            
            if (gutterWidth == null)
                gutterWidth = this.$showGutter ? this.$gutter.offsetWidth : 0;
            
            this.gutterWidth = gutterWidth;
            
            this.scrollBarH.element.style.left = 
            this.scroller.style.left = gutterWidth + "px";
            size.scrollerWidth = Math.max(0, width - gutterWidth - this.scrollBarV.getWidth());           
            
            this.scrollBarH.element.style.right = 
            this.scroller.style.right = this.scrollBarV.getWidth() + "px";
            this.scroller.style.bottom = this.scrollBarH.getHeight() + "px";

            if (this.session && this.session.getUseWrapMode() && this.adjustWrapLimit() || force)
                changes |= this.CHANGE_FULL;
        }
        
        size.$dirty = !width || !height;

        if (changes)
            this._signal("resize", oldSize);

        return changes;
    };

    this.onGutterResize = function() {
        var gutterWidth = this.$showGutter ? this.$gutter.offsetWidth : 0;
        if (gutterWidth != this.gutterWidth)
            this.$changes |= this.$updateCachedSize(true, gutterWidth, this.$size.width, this.$size.height);

        if (this.session.getUseWrapMode() && this.adjustWrapLimit()) {
            this.$loop.schedule(this.CHANGE_FULL);
        } else if (this.$size.$dirty) {
            this.$loop.schedule(this.CHANGE_FULL);
        } else {
            this.$computeLayerConfig();
            this.$loop.schedule(this.CHANGE_MARKER);
        }
    };
    this.adjustWrapLimit = function() {
        var availableWidth = this.$size.scrollerWidth - this.$padding * 2;
        var limit = Math.floor(availableWidth / this.characterWidth);
        return this.session.adjustWrapLimit(limit, this.$showPrintMargin && this.$printMarginColumn);
    };
    this.setAnimatedScroll = function(shouldAnimate){
        this.setOption("animatedScroll", shouldAnimate);
    };
    this.getAnimatedScroll = function() {
        return this.$animatedScroll;
    };
    this.setShowInvisibles = function(showInvisibles) {
        this.setOption("showInvisibles", showInvisibles);
    };
    this.getShowInvisibles = function() {
        return this.getOption("showInvisibles");
    };
    this.getDisplayIndentGuides = function() {
        return this.getOption("displayIndentGuides");
    };

    this.setDisplayIndentGuides = function(display) {
        this.setOption("displayIndentGuides", display);
    };
    this.setShowPrintMargin = function(showPrintMargin) {
        this.setOption("showPrintMargin", showPrintMargin);
    };
    this.getShowPrintMargin = function() {
        return this.getOption("showPrintMargin");
    };
    this.setPrintMarginColumn = function(showPrintMargin) {
        this.setOption("printMarginColumn", showPrintMargin);
    };
    this.getPrintMarginColumn = function() {
        return this.getOption("printMarginColumn");
    };
    this.getShowGutter = function(){
        return this.getOption("showGutter");
    };
    this.setShowGutter = function(show){
        return this.setOption("showGutter", show);
    };

    this.getFadeFoldWidgets = function(){
        return this.getOption("fadeFoldWidgets")
    };

    this.setFadeFoldWidgets = function(show) {
        this.setOption("fadeFoldWidgets", show);
    };

    this.setHighlightGutterLine = function(shouldHighlight) {
        this.setOption("highlightGutterLine", shouldHighlight);
    };

    this.getHighlightGutterLine = function() {
        return this.getOption("highlightGutterLine");
    };

    this.$updateGutterLineHighlight = function() {
        var pos = this.$cursorLayer.$pixelPos;
        var height = this.layerConfig.lineHeight;
        if (this.session.getUseWrapMode()) {
            var cursor = this.session.selection.getCursor();
            cursor.column = 0;
            pos = this.$cursorLayer.getPixelPosition(cursor, true);
            height *= this.session.getRowLength(cursor.row);
        }
        this.$gutterLineHighlight.style.top = pos.top - this.layerConfig.offset + "px";
        this.$gutterLineHighlight.style.height = height + "px";
    };

    this.$updatePrintMargin = function() {
        if (!this.$showPrintMargin && !this.$printMarginEl)
            return;

        if (!this.$printMarginEl) {
            var containerEl = dom.createElement("div");
            containerEl.className = "ace_layer ace_print-margin-layer";
            this.$printMarginEl = dom.createElement("div");
            this.$printMarginEl.className = "ace_print-margin";
            containerEl.appendChild(this.$printMarginEl);
            this.content.insertBefore(containerEl, this.content.firstChild);
        }

        var style = this.$printMarginEl.style;
        style.left = ((this.characterWidth * this.$printMarginColumn) + this.$padding) + "px";
        style.visibility = this.$showPrintMargin ? "visible" : "hidden";
        
        if (this.session && this.session.$wrap == -1)
            this.adjustWrapLimit();
    };
    this.getContainerElement = function() {
        return this.container;
    };
    this.getMouseEventTarget = function() {
        return this.content;
    };
    this.getTextAreaContainer = function() {
        return this.container;
    };
    this.$moveTextAreaToCursor = function() {
        if (!this.$keepTextAreaAtCursor)
            return;
        var config = this.layerConfig;
        var posTop = this.$cursorLayer.$pixelPos.top;
        var posLeft = this.$cursorLayer.$pixelPos.left;
        posTop -= config.offset;

        var h = this.lineHeight;
        if (posTop < 0 || posTop > config.height - h)
            return;

        var w = this.characterWidth;
        if (this.$composition) {
            var val = this.textarea.value.replace(/^\x01+/, "");
            w *= (this.session.$getStringScreenWidth(val)[0]+2);
            h += 2;
        }
        posLeft -= this.scrollLeft;
        if (posLeft > this.$size.scrollerWidth - w)
            posLeft = this.$size.scrollerWidth - w;

        posLeft += this.gutterWidth;

        this.textarea.style.height = h + "px";
        this.textarea.style.width = w + "px";
        this.textarea.style.left = Math.min(posLeft, this.$size.scrollerWidth - w) + "px";
        this.textarea.style.top = Math.min(posTop, this.$size.height - h) + "px";
    };
    this.getFirstVisibleRow = function() {
        return this.layerConfig.firstRow;
    };
    this.getFirstFullyVisibleRow = function() {
        return this.layerConfig.firstRow + (this.layerConfig.offset === 0 ? 0 : 1);
    };
    this.getLastFullyVisibleRow = function() {
        var flint = Math.floor((this.layerConfig.height + this.layerConfig.offset) / this.layerConfig.lineHeight);
        return this.layerConfig.firstRow - 1 + flint;
    };
    this.getLastVisibleRow = function() {
        return this.layerConfig.lastRow;
    };

    this.$padding = null;
    this.setPadding = function(padding) {
        this.$padding = padding;
        this.$textLayer.setPadding(padding);
        this.$cursorLayer.setPadding(padding);
        this.$markerFront.setPadding(padding);
        this.$markerBack.setPadding(padding);
        this.$loop.schedule(this.CHANGE_FULL);
        this.$updatePrintMargin();
    };
    
    this.setScrollMargin = function(top, bottom, left, right) {
        var sm = this.scrollMargin;
        sm.top = top|0;
        sm.bottom = bottom|0;
        sm.right = right|0;
        sm.left = left|0;
        sm.v = sm.top + sm.bottom;
        sm.h = sm.left + sm.right;
        if (sm.top && this.scrollTop <= 0 && this.session)
            this.session.setScrollTop(-sm.top);
        this.updateFull();
    };
    this.getHScrollBarAlwaysVisible = function() {
        return this.$hScrollBarAlwaysVisible;
    };
    this.setHScrollBarAlwaysVisible = function(alwaysVisible) {
        this.setOption("hScrollBarAlwaysVisible", alwaysVisible);
    };
    this.getVScrollBarAlwaysVisible = function() {
        return this.$hScrollBarAlwaysVisible;
    };
    this.setVScrollBarAlwaysVisible = function(alwaysVisible) {
        this.setOption("vScrollBarAlwaysVisible", alwaysVisible);
    };

    this.$updateScrollBarV = function() {
        var scrollHeight = this.layerConfig.maxHeight;
        var scrollerHeight = this.$size.scrollerHeight;
        if (!this.$maxLines && this.$scrollPastEnd) {
            scrollHeight -= (scrollerHeight - this.lineHeight) * this.$scrollPastEnd;
            if (this.scrollTop > scrollHeight - scrollerHeight) {
                scrollHeight = this.scrollTop + scrollerHeight;
                this.scrollBarV.scrollTop = null;
            }
        }
        this.scrollBarV.setScrollHeight(scrollHeight + this.scrollMargin.v);
        this.scrollBarV.setScrollTop(this.scrollTop + this.scrollMargin.top);
    };
    this.$updateScrollBarH = function() {
        this.scrollBarH.setScrollWidth(this.layerConfig.width + 2 * this.$padding + this.scrollMargin.h);
        this.scrollBarH.setScrollLeft(this.scrollLeft + this.scrollMargin.left);
    };
    
    this.$frozen = false;
    this.freeze = function() {
        this.$frozen = true;
    };
    
    this.unfreeze = function() {
        this.$frozen = false;
    };

    this.$renderChanges = function(changes, force) {
        if (this.$changes) {
            changes |= this.$changes;
            this.$changes = 0;
        }
        if ((!this.session || !this.container.offsetWidth || this.$frozen) || (!changes && !force)) {
            this.$changes |= changes;
            return; 
        } 
        if (this.$size.$dirty) {
            this.$changes |= changes;
            return this.onResize(true);
        }
        if (!this.lineHeight) {
            this.$textLayer.checkForSizeChanges();
        }
        
        this._signal("beforeRender");
        var config = this.layerConfig;
        if (changes & this.CHANGE_FULL ||
            changes & this.CHANGE_SIZE ||
            changes & this.CHANGE_TEXT ||
            changes & this.CHANGE_LINES ||
            changes & this.CHANGE_SCROLL ||
            changes & this.CHANGE_H_SCROLL
        ) {
            changes |= this.$computeLayerConfig();
            if (config.firstRow != this.layerConfig.firstRow && config.firstRowScreen == this.layerConfig.firstRowScreen) {
                var st = this.scrollTop + (config.firstRow - this.layerConfig.firstRow) * this.lineHeight;
                if (st > 0) {
                    this.scrollTop = st;
                    changes = changes | this.CHANGE_SCROLL;
                    changes |= this.$computeLayerConfig();
                }
            }
            config = this.layerConfig;
            this.$updateScrollBarV();
            if (changes & this.CHANGE_H_SCROLL)
                this.$updateScrollBarH();
            this.$gutterLayer.element.style.marginTop = (-config.offset) + "px";
            this.content.style.marginTop = (-config.offset) + "px";
            this.content.style.width = config.width + 2 * this.$padding + "px";
            this.content.style.height = config.minHeight + "px";
        }
        if (changes & this.CHANGE_H_SCROLL) {
            this.content.style.marginLeft = -this.scrollLeft + "px";
            this.scroller.className = this.scrollLeft <= 0 ? "ace_scroller" : "ace_scroller ace_scroll-left";
        }
        if (changes & this.CHANGE_FULL) {
            this.$textLayer.update(config);
            if (this.$showGutter)
                this.$gutterLayer.update(config);
            this.$markerBack.update(config);
            this.$markerFront.update(config);
            this.$cursorLayer.update(config);
            this.$moveTextAreaToCursor();
            this.$highlightGutterLine && this.$updateGutterLineHighlight();
            this._signal("afterRender");
            return;
        }
        if (changes & this.CHANGE_SCROLL) {
            if (changes & this.CHANGE_TEXT || changes & this.CHANGE_LINES)
                this.$textLayer.update(config);
            else
                this.$textLayer.scrollLines(config);

            if (this.$showGutter)
                this.$gutterLayer.update(config);
            this.$markerBack.update(config);
            this.$markerFront.update(config);
            this.$cursorLayer.update(config);
            this.$highlightGutterLine && this.$updateGutterLineHighlight();
            this.$moveTextAreaToCursor();
            this._signal("afterRender");
            return;
        }

        if (changes & this.CHANGE_TEXT) {
            this.$textLayer.update(config);
            if (this.$showGutter)
                this.$gutterLayer.update(config);
        }
        else if (changes & this.CHANGE_LINES) {
            if (this.$updateLines() || (changes & this.CHANGE_GUTTER) && this.$showGutter)
                this.$gutterLayer.update(config);
        }
        else if (changes & this.CHANGE_TEXT || changes & this.CHANGE_GUTTER) {
            if (this.$showGutter)
                this.$gutterLayer.update(config);
        }

        if (changes & this.CHANGE_CURSOR) {
            this.$cursorLayer.update(config);
            this.$moveTextAreaToCursor();
            this.$highlightGutterLine && this.$updateGutterLineHighlight();
        }

        if (changes & (this.CHANGE_MARKER | this.CHANGE_MARKER_FRONT)) {
            this.$markerFront.update(config);
        }

        if (changes & (this.CHANGE_MARKER | this.CHANGE_MARKER_BACK)) {
            this.$markerBack.update(config);
        }

        this._signal("afterRender");
    };

    
    this.$autosize = function() {
        var height = this.session.getScreenLength() * this.lineHeight;
        var maxHeight = this.$maxLines * this.lineHeight;
        var desiredHeight = Math.max(
            (this.$minLines||1) * this.lineHeight,
            Math.min(maxHeight, height)
        ) + this.scrollMargin.v + (this.$extraHeight || 0);
        var vScroll = height > maxHeight;
        
        if (desiredHeight != this.desiredHeight ||
            this.$size.height != this.desiredHeight || vScroll != this.$vScroll) {
            if (vScroll != this.$vScroll) {
                this.$vScroll = vScroll;
                this.scrollBarV.setVisible(vScroll);
            }
            
            var w = this.container.clientWidth;
            this.container.style.height = desiredHeight + "px";
            this.$updateCachedSize(true, this.$gutterWidth, w, desiredHeight);
            this.desiredHeight = desiredHeight;
            
            this._signal("autosize");
        }
    };
    
    this.$computeLayerConfig = function() {
        if (this.$maxLines && this.lineHeight > 1)
            this.$autosize();

        var session = this.session;
        var size = this.$size;
        
        var hideScrollbars = size.height <= 2 * this.lineHeight;
        var screenLines = this.session.getScreenLength();
        var maxHeight = screenLines * this.lineHeight;

        var offset = this.scrollTop % this.lineHeight;
        var minHeight = size.scrollerHeight + this.lineHeight;

        var longestLine = this.$getLongestLine();
        
        var horizScroll = !hideScrollbars && (this.$hScrollBarAlwaysVisible ||
            size.scrollerWidth - longestLine - 2 * this.$padding < 0);

        var hScrollChanged = this.$horizScroll !== horizScroll;
        if (hScrollChanged) {
            this.$horizScroll = horizScroll;
            this.scrollBarH.setVisible(horizScroll);
        }
        
        var scrollPastEnd = !this.$maxLines && this.$scrollPastEnd
            ? (size.scrollerHeight - this.lineHeight) * this.$scrollPastEnd
            : 0;
        maxHeight += scrollPastEnd;
        
        this.session.setScrollTop(Math.max(-this.scrollMargin.top,
            Math.min(this.scrollTop, maxHeight - size.scrollerHeight + this.scrollMargin.bottom)));

        this.session.setScrollLeft(Math.max(-this.scrollMargin.left, Math.min(this.scrollLeft, 
            longestLine + 2 * this.$padding - size.scrollerWidth + this.scrollMargin.right)));
        
        var vScroll = !hideScrollbars && (this.$vScrollBarAlwaysVisible ||
            size.scrollerHeight - maxHeight + scrollPastEnd < 0 || this.scrollTop);
        var vScrollChanged = this.$vScroll !== vScroll;
        if (vScrollChanged) {
            this.$vScroll = vScroll;
            this.scrollBarV.setVisible(vScroll);
        }

        var lineCount = Math.ceil(minHeight / this.lineHeight) - 1;
        var firstRow = Math.max(0, Math.round((this.scrollTop - offset) / this.lineHeight));
        var lastRow = firstRow + lineCount;
        var firstRowScreen, firstRowHeight;
        var lineHeight = this.lineHeight;
        firstRow = session.screenToDocumentRow(firstRow, 0);
        var foldLine = session.getFoldLine(firstRow);
        if (foldLine) {
            firstRow = foldLine.start.row;
        }

        firstRowScreen = session.documentToScreenRow(firstRow, 0);
        firstRowHeight = session.getRowLength(firstRow) * lineHeight;

        lastRow = Math.min(session.screenToDocumentRow(lastRow, 0), session.getLength() - 1);
        minHeight = size.scrollerHeight + session.getRowLength(lastRow) * lineHeight +
                                                firstRowHeight;

        offset = this.scrollTop - firstRowScreen * lineHeight;

        var changes = 0;
        if (this.layerConfig.width != longestLine) 
            changes = this.CHANGE_H_SCROLL;
        if (hScrollChanged || vScrollChanged) {
            changes = this.$updateCachedSize(true, this.gutterWidth, size.width, size.height);
            this._signal("scrollbarVisibilityChanged");
            if (vScrollChanged)
                longestLine = this.$getLongestLine();
        }
        
        this.layerConfig = {
            width : longestLine,
            padding : this.$padding,
            firstRow : firstRow,
            firstRowScreen: firstRowScreen,
            lastRow : lastRow,
            lineHeight : lineHeight,
            characterWidth : this.characterWidth,
            minHeight : minHeight,
            maxHeight : maxHeight,
            offset : offset,
            gutterOffset : Math.max(0, Math.ceil((offset + size.height - size.scrollerHeight) / lineHeight)),
            height : this.$size.scrollerHeight
        };

        return changes;
    };

    this.$updateLines = function() {
        var firstRow = this.$changedLines.firstRow;
        var lastRow = this.$changedLines.lastRow;
        this.$changedLines = null;

        var layerConfig = this.layerConfig;

        if (firstRow > layerConfig.lastRow + 1) { return; }
        if (lastRow < layerConfig.firstRow) { return; }
        if (lastRow === Infinity) {
            if (this.$showGutter)
                this.$gutterLayer.update(layerConfig);
            this.$textLayer.update(layerConfig);
            return;
        }
        this.$textLayer.updateLines(layerConfig, firstRow, lastRow);
        return true;
    };

    this.$getLongestLine = function() {
        var charCount = this.session.getScreenWidth();
        if (this.showInvisibles && !this.session.$useWrapMode)
            charCount += 1;

        return Math.max(this.$size.scrollerWidth - 2 * this.$padding, Math.round(charCount * this.characterWidth));
    };
    this.updateFrontMarkers = function() {
        this.$markerFront.setMarkers(this.session.getMarkers(true));
        this.$loop.schedule(this.CHANGE_MARKER_FRONT);
    };
    this.updateBackMarkers = function() {
        this.$markerBack.setMarkers(this.session.getMarkers());
        this.$loop.schedule(this.CHANGE_MARKER_BACK);
    };
    this.addGutterDecoration = function(row, className){
        this.$gutterLayer.addGutterDecoration(row, className);
    };
    this.removeGutterDecoration = function(row, className){
        this.$gutterLayer.removeGutterDecoration(row, className);
    };
    this.updateBreakpoints = function(rows) {
        this.$loop.schedule(this.CHANGE_GUTTER);
    };
    this.setAnnotations = function(annotations) {
        this.$gutterLayer.setAnnotations(annotations);
        this.$loop.schedule(this.CHANGE_GUTTER);
    };
    this.updateCursor = function() {
        this.$loop.schedule(this.CHANGE_CURSOR);
    };
    this.hideCursor = function() {
        this.$cursorLayer.hideCursor();
    };
    this.showCursor = function() {
        this.$cursorLayer.showCursor();
    };

    this.scrollSelectionIntoView = function(anchor, lead, offset) {
        this.scrollCursorIntoView(anchor, offset);
        this.scrollCursorIntoView(lead, offset);
    };
    this.scrollCursorIntoView = function(cursor, offset, $viewMargin) {
        if (this.$size.scrollerHeight === 0)
            return;

        var pos = this.$cursorLayer.getPixelPosition(cursor);

        var left = pos.left;
        var top = pos.top;
        
        var topMargin = $viewMargin && $viewMargin.top || 0;
        var bottomMargin = $viewMargin && $viewMargin.bottom || 0;
        
        var scrollTop = this.$scrollAnimation ? this.session.getScrollTop() : this.scrollTop;
        
        if (scrollTop + topMargin > top) {
            if (offset)
                top -= offset * this.$size.scrollerHeight;
            if (top === 0)
                top = -this.scrollMargin.top;
            this.session.setScrollTop(top);
        } else if (scrollTop + this.$size.scrollerHeight - bottomMargin < top + this.lineHeight) {
            if (offset)
                top += offset * this.$size.scrollerHeight;
            this.session.setScrollTop(top + this.lineHeight - this.$size.scrollerHeight);
        }

        var scrollLeft = this.scrollLeft;

        if (scrollLeft > left) {
            if (left < this.$padding + 2 * this.layerConfig.characterWidth)
                left = -this.scrollMargin.left;
            this.session.setScrollLeft(left);
        } else if (scrollLeft + this.$size.scrollerWidth < left + this.characterWidth) {
            this.session.setScrollLeft(Math.round(left + this.characterWidth - this.$size.scrollerWidth));
        } else if (scrollLeft <= this.$padding && left - scrollLeft < this.characterWidth) {
            this.session.setScrollLeft(0);
        }
    };
    this.getScrollTop = function() {
        return this.session.getScrollTop();
    };
    this.getScrollLeft = function() {
        return this.session.getScrollLeft();
    };
    this.getScrollTopRow = function() {
        return this.scrollTop / this.lineHeight;
    };
    this.getScrollBottomRow = function() {
        return Math.max(0, Math.floor((this.scrollTop + this.$size.scrollerHeight) / this.lineHeight) - 1);
    };
    this.scrollToRow = function(row) {
        this.session.setScrollTop(row * this.lineHeight);
    };

    this.alignCursor = function(cursor, alignment) {
        if (typeof cursor == "number")
            cursor = {row: cursor, column: 0};

        var pos = this.$cursorLayer.getPixelPosition(cursor);
        var h = this.$size.scrollerHeight - this.lineHeight;
        var offset = pos.top - h * (alignment || 0);

        this.session.setScrollTop(offset);
        return offset;
    };

    this.STEPS = 8;
    this.$calcSteps = function(fromValue, toValue){
        var i = 0;
        var l = this.STEPS;
        var steps = [];

        var func  = function(t, x_min, dx) {
            return dx * (Math.pow(t - 1, 3) + 1) + x_min;
        };

        for (i = 0; i < l; ++i)
            steps.push(func(i / this.STEPS, fromValue, toValue - fromValue));

        return steps;
    };
    this.scrollToLine = function(line, center, animate, callback) {
        var pos = this.$cursorLayer.getPixelPosition({row: line, column: 0});
        var offset = pos.top;
        if (center)
            offset -= this.$size.scrollerHeight / 2;

        var initialScroll = this.scrollTop;
        this.session.setScrollTop(offset);
        if (animate !== false)
            this.animateScrolling(initialScroll, callback);
    };

    this.animateScrolling = function(fromValue, callback) {
        var toValue = this.scrollTop;
        if (!this.$animatedScroll)
            return;
        var _self = this;
        
        if (fromValue == toValue)
            return;
        
        if (this.$scrollAnimation) {
            var oldSteps = this.$scrollAnimation.steps;
            if (oldSteps.length) {
                fromValue = oldSteps[0];
                if (fromValue == toValue)
                    return;
            }
        }
        
        var steps = _self.$calcSteps(fromValue, toValue);
        this.$scrollAnimation = {from: fromValue, to: toValue, steps: steps};

        clearInterval(this.$timer);

        _self.session.setScrollTop(steps.shift());
        _self.session.$scrollTop = toValue;
        this.$timer = setInterval(function() {
            if (steps.length) {
                _self.session.setScrollTop(steps.shift());
                _self.session.$scrollTop = toValue;
            } else if (toValue != null) {
                _self.session.$scrollTop = -1;
                _self.session.setScrollTop(toValue);
                toValue = null;
            } else {
                _self.$timer = clearInterval(_self.$timer);
                _self.$scrollAnimation = null;
                callback && callback();
            }
        }, 10);
    };
    this.scrollToY = function(scrollTop) {
        if (this.scrollTop !== scrollTop) {
            this.$loop.schedule(this.CHANGE_SCROLL);
            this.scrollTop = scrollTop;
        }
    };
    this.scrollToX = function(scrollLeft) {
        if (this.scrollLeft !== scrollLeft)
            this.scrollLeft = scrollLeft;
        this.$loop.schedule(this.CHANGE_H_SCROLL);
    };
    this.scrollTo = function(x, y) {
        this.session.setScrollTop(y);
        this.session.setScrollLeft(y);
    };
    this.scrollBy = function(deltaX, deltaY) {
        deltaY && this.session.setScrollTop(this.session.getScrollTop() + deltaY);
        deltaX && this.session.setScrollLeft(this.session.getScrollLeft() + deltaX);
    };
    this.isScrollableBy = function(deltaX, deltaY) {
        if (deltaY < 0 && this.session.getScrollTop() >= 1 - this.scrollMargin.top)
           return true;
        if (deltaY > 0 && this.session.getScrollTop() + this.$size.scrollerHeight
            - this.layerConfig.maxHeight < -1 + this.scrollMargin.bottom)
           return true;
        if (deltaX < 0 && this.session.getScrollLeft() >= 1 - this.scrollMargin.left)
            return true;
        if (deltaX > 0 && this.session.getScrollLeft() + this.$size.scrollerWidth
            - this.layerConfig.width < -1 + this.scrollMargin.right)
           return true;
    };

    this.pixelToScreenCoordinates = function(x, y) {
        var canvasPos = this.scroller.getBoundingClientRect();

        var offset = (x + this.scrollLeft - canvasPos.left - this.$padding) / this.characterWidth;
        var row = Math.floor((y + this.scrollTop - canvasPos.top) / this.lineHeight);
        var col = Math.round(offset);

        return {row: row, column: col, side: offset - col > 0 ? 1 : -1};
    };

    this.screenToTextCoordinates = function(x, y) {
        var canvasPos = this.scroller.getBoundingClientRect();

        var col = Math.round(
            (x + this.scrollLeft - canvasPos.left - this.$padding) / this.characterWidth
        );

        var row = (y + this.scrollTop - canvasPos.top) / this.lineHeight;

        return this.session.screenToDocumentPosition(row, Math.max(col, 0));
    };
    this.textToScreenCoordinates = function(row, column) {
        var canvasPos = this.scroller.getBoundingClientRect();
        var pos = this.session.documentToScreenPosition(row, column);

        var x = this.$padding + Math.round(pos.column * this.characterWidth);
        var y = pos.row * this.lineHeight;

        return {
            pageX: canvasPos.left + x - this.scrollLeft,
            pageY: canvasPos.top + y - this.scrollTop
        };
    };
    this.visualizeFocus = function() {
        dom.addCssClass(this.container, "ace_focus");
    };
    this.visualizeBlur = function() {
        dom.removeCssClass(this.container, "ace_focus");
    };
    this.showComposition = function(position) {
        if (!this.$composition)
            this.$composition = {
                keepTextAreaAtCursor: this.$keepTextAreaAtCursor,
                cssText: this.textarea.style.cssText
            };

        this.$keepTextAreaAtCursor = true;
        dom.addCssClass(this.textarea, "ace_composition");
        this.textarea.style.cssText = "";
        this.$moveTextAreaToCursor();
    };
    this.setCompositionText = function(text) {
        this.$moveTextAreaToCursor();
    };
    this.hideComposition = function() {
        if (!this.$composition)
            return;

        dom.removeCssClass(this.textarea, "ace_composition");
        this.$keepTextAreaAtCursor = this.$composition.keepTextAreaAtCursor;
        this.textarea.style.cssText = this.$composition.cssText;
        this.$composition = null;
    };
    this.setTheme = function(theme, cb) {
        var _self = this;
        this.$themeId = theme;
        _self._dispatchEvent('themeChange',{theme:theme});

        if (!theme || typeof theme == "string") {
            var moduleName = theme || this.$options.theme.initialValue;
            config.loadModule(["theme", moduleName], afterLoad);
        } else {
            afterLoad(theme);
        }

        function afterLoad(module) {
            if (_self.$themeId != theme)
                return cb && cb();
            if (!module.cssClass)
                return;
            dom.importCssString(
                module.cssText,
                module.cssClass,
                _self.container.ownerDocument
            );

            if (_self.theme)
                dom.removeCssClass(_self.container, _self.theme.cssClass);

            var padding = "padding" in module ? module.padding 
                : "padding" in (_self.theme || {}) ? 4 : _self.$padding;
            if (_self.$padding && padding != _self.$padding)
                _self.setPadding(padding);
            _self.$theme = module.cssClass;

            _self.theme = module;
            dom.addCssClass(_self.container, module.cssClass);
            dom.setCssClass(_self.container, "ace_dark", module.isDark);
            if (_self.$size) {
                _self.$size.width = 0;
                _self.$updateSizeAsync();
            }

            _self._dispatchEvent('themeLoaded', {theme:module});
            cb && cb();
        }
    };
    this.getTheme = function() {
        return this.$themeId;
    };
    this.setStyle = function(style, include) {
        dom.setCssClass(this.container, style, include !== false);
    };
    this.unsetStyle = function(style) {
        dom.removeCssClass(this.container, style);
    };
    
    this.setCursorStyle = function(style) {
        if (this.scroller.style.cursor != style)
            this.scroller.style.cursor = style;
    };
    this.setMouseCursor = function(cursorStyle) {
        this.scroller.style.cursor = cursorStyle;
    };
    this.destroy = function() {
        this.$textLayer.destroy();
        this.$cursorLayer.destroy();
    };

}).call(VirtualRenderer.prototype);


config.defineOptions(VirtualRenderer.prototype, "renderer", {
    animatedScroll: {initialValue: false},
    showInvisibles: {
        set: function(value) {
            if (this.$textLayer.setShowInvisibles(value))
                this.$loop.schedule(this.CHANGE_TEXT);
        },
        initialValue: false
    },
    showPrintMargin: {
        set: function() { this.$updatePrintMargin(); },
        initialValue: true
    },
    printMarginColumn: {
        set: function() { this.$updatePrintMargin(); },
        initialValue: 80
    },
    printMargin: {
        set: function(val) {
            if (typeof val == "number")
                this.$printMarginColumn = val;
            this.$showPrintMargin = !!val;
            this.$updatePrintMargin();
        },
        get: function() {
            return this.$showPrintMargin && this.$printMarginColumn; 
        }
    },
    showGutter: {
        set: function(show){
            this.$gutter.style.display = show ? "block" : "none";
            this.$loop.schedule(this.CHANGE_FULL);
            this.onGutterResize();
        },
        initialValue: true
    },
    fadeFoldWidgets: {
        set: function(show) {
            dom.setCssClass(this.$gutter, "ace_fade-fold-widgets", show);
        },
        initialValue: false
    },
    showFoldWidgets: {
        set: function(show) {this.$gutterLayer.setShowFoldWidgets(show)},
        initialValue: true
    },
    showLineNumbers: {
        set: function(show) {
            this.$gutterLayer.setShowLineNumbers(show);
            this.$loop.schedule(this.CHANGE_GUTTER);
        },
        initialValue: true
    },
    displayIndentGuides: {
        set: function(show) {
            if (this.$textLayer.setDisplayIndentGuides(show))
                this.$loop.schedule(this.CHANGE_TEXT);
        },
        initialValue: true
    },
    highlightGutterLine: {
        set: function(shouldHighlight) {
            if (!this.$gutterLineHighlight) {
                this.$gutterLineHighlight = dom.createElement("div");
                this.$gutterLineHighlight.className = "ace_gutter-active-line";
                this.$gutter.appendChild(this.$gutterLineHighlight);
                return;
            }

            this.$gutterLineHighlight.style.display = shouldHighlight ? "" : "none";
            if (this.$cursorLayer.$pixelPos)
                this.$updateGutterLineHighlight();
        },
        initialValue: false,
        value: true
    },
    hScrollBarAlwaysVisible: {
        set: function(val) {
            if (!this.$hScrollBarAlwaysVisible || !this.$horizScroll)
                this.$loop.schedule(this.CHANGE_SCROLL);
        },
        initialValue: false
    },
    vScrollBarAlwaysVisible: {
        set: function(val) {
            if (!this.$vScrollBarAlwaysVisible || !this.$vScroll)
                this.$loop.schedule(this.CHANGE_SCROLL);
        },
        initialValue: false
    },
    fontSize:  {
        set: function(size) {
            if (typeof size == "number")
                size = size + "px";
            this.container.style.fontSize = size;
            this.updateFontSize();
        },
        initialValue: 12
    },
    fontFamily: {
        set: function(name) {
            this.container.style.fontFamily = name;
            this.updateFontSize();
        }
    },
    maxLines: {
        set: function(val) {
            this.updateFull();
        }
    },
    minLines: {
        set: function(val) {
            this.updateFull();
        }
    },
    scrollPastEnd: {
        set: function(val) {
            val = +val || 0;
            if (this.$scrollPastEnd == val)
                return;
            this.$scrollPastEnd = val;
            this.$loop.schedule(this.CHANGE_SCROLL);
        },
        initialValue: 0,
        handlesSet: true
    },
    fixedWidthGutter: {
        set: function(val) {
            this.$gutterLayer.$fixedWidth = !!val;
            this.$loop.schedule(this.CHANGE_GUTTER);
        }
    },
    theme: {
        set: function(val) { this.setTheme(val) },
        get: function() { return this.$themeId || this.theme; },
        initialValue: "./theme/textmate",
        handlesSet: true
    }
});

exports.VirtualRenderer = VirtualRenderer;
});

ace.define("ace/worker/worker_client",["require","exports","module","ace/lib/oop","ace/lib/net","ace/lib/event_emitter","ace/config"], function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var net = require("../lib/net");
var EventEmitter = require("../lib/event_emitter").EventEmitter;
var config = require("../config");

var WorkerClient = function(topLevelNamespaces, mod, classname, workerUrl) {
    this.$sendDeltaQueue = this.$sendDeltaQueue.bind(this);
    this.changeListener = this.changeListener.bind(this);
    this.onMessage = this.onMessage.bind(this);
    if (require.nameToUrl && !require.toUrl)
        require.toUrl = require.nameToUrl;
    
    if (config.get("packaged") || !require.toUrl) {
        workerUrl = workerUrl || config.moduleUrl(mod, "worker");
    } else {
        var normalizePath = this.$normalizePath;
        workerUrl = workerUrl || normalizePath(require.toUrl("ace/worker/worker.js", null, "_"));

        var tlns = {};
        topLevelNamespaces.forEach(function(ns) {
            tlns[ns] = normalizePath(require.toUrl(ns, null, "_").replace(/(\.js)?(\?.*)?$/, ""));
        });
    }

    try {
        this.$worker = new Worker(workerUrl);
    } catch(e) {
        if (e instanceof window.DOMException) {
            var blob = this.$workerBlob(workerUrl);
            var URL = window.URL || window.webkitURL;
            var blobURL = URL.createObjectURL(blob);

            this.$worker = new Worker(blobURL);
            URL.revokeObjectURL(blobURL);
        } else {
            throw e;
        }
    }
    this.$worker.postMessage({
        init : true,
        tlns : tlns,
        module : mod,
        classname : classname
    });

    this.callbackId = 1;
    this.callbacks = {};

    this.$worker.onmessage = this.onMessage;
};

(function(){

    oop.implement(this, EventEmitter);

    this.onMessage = function(e) {
        var msg = e.data;
        switch(msg.type) {
            case "event":
                this._signal(msg.name, {data: msg.data});
                break;
            case "call":
                var callback = this.callbacks[msg.id];
                if (callback) {
                    callback(msg.data);
                    delete this.callbacks[msg.id];
                }
                break;
            case "error":
                this.reportError(msg.data);
                break;
            case "log":
                window.console && console.log && console.log.apply(console, msg.data);
                break;
        }
    };
    
    this.reportError = function(err) {
        window.console && console.error && console.error(err);
    };

    this.$normalizePath = function(path) {
        return net.qualifyURL(path);
    };

    this.terminate = function() {
        this._signal("terminate", {});
        this.deltaQueue = null;
        this.$worker.terminate();
        this.$worker = null;
        if (this.$doc)
            this.$doc.off("change", this.changeListener);
        this.$doc = null;
    };

    this.send = function(cmd, args) {
        this.$worker.postMessage({command: cmd, args: args});
    };

    this.call = function(cmd, args, callback) {
        if (callback) {
            var id = this.callbackId++;
            this.callbacks[id] = callback;
            args.push(id);
        }
        this.send(cmd, args);
    };

    this.emit = function(event, data) {
        try {
            this.$worker.postMessage({event: event, data: {data: data.data}});
        }
        catch(ex) {
            console.error(ex.stack);
        }
    };

    this.attachToDocument = function(doc) {
        if(this.$doc)
            this.terminate();

        this.$doc = doc;
        this.call("setValue", [doc.getValue()]);
        doc.on("change", this.changeListener);
    };

    this.changeListener = function(e) {
        if (!this.deltaQueue) {
            this.deltaQueue = [e.data];
            setTimeout(this.$sendDeltaQueue, 0);
        } else
            this.deltaQueue.push(e.data);
    };

    this.$sendDeltaQueue = function() {
        var q = this.deltaQueue;
        if (!q) return;
        this.deltaQueue = null;
        if (q.length > 20 && q.length > this.$doc.getLength() >> 1) {
            this.call("setValue", [this.$doc.getValue()]);
        } else
            this.emit("change", {data: q});
    };

    this.$workerBlob = function(workerUrl) {
        var script = "importScripts('" + net.qualifyURL(workerUrl) + "');";
        try {
            return new Blob([script], {"type": "application/javascript"});
        } catch (e) { // Backwards-compatibility
            var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
            var blobBuilder = new BlobBuilder();
            blobBuilder.append(script);
            return blobBuilder.getBlob("application/javascript");
        }
    };

}).call(WorkerClient.prototype);


var UIWorkerClient = function(topLevelNamespaces, mod, classname) {
    this.$sendDeltaQueue = this.$sendDeltaQueue.bind(this);
    this.changeListener = this.changeListener.bind(this);
    this.callbackId = 1;
    this.callbacks = {};
    this.messageBuffer = [];

    var main = null;
    var emitSync = false;
    var sender = Object.create(EventEmitter);
    var _self = this;

    this.$worker = {};
    this.$worker.terminate = function() {};
    this.$worker.postMessage = function(e) {
        _self.messageBuffer.push(e);
        if (main) {
            if (emitSync)
                setTimeout(processNext);
            else
                processNext();
        }
    };
    this.setEmitSync = function(val) { emitSync = val };

    var processNext = function() {
        var msg = _self.messageBuffer.shift();
        if (msg.command)
            main[msg.command].apply(main, msg.args);
        else if (msg.event)
            sender._signal(msg.event, msg.data);
    };

    sender.postMessage = function(msg) {
        _self.onMessage({data: msg});
    };
    sender.callback = function(data, callbackId) {
        this.postMessage({type: "call", id: callbackId, data: data});
    };
    sender.emit = function(name, data) {
        this.postMessage({type: "event", name: name, data: data});
    };

    config.loadModule(["worker", mod], function(Main) {
        main = new Main[classname](sender);
        while (_self.messageBuffer.length)
            processNext();
    });
};

UIWorkerClient.prototype = WorkerClient.prototype;

exports.UIWorkerClient = UIWorkerClient;
exports.WorkerClient = WorkerClient;

});

ace.define("ace/placeholder",["require","exports","module","ace/range","ace/lib/event_emitter","ace/lib/oop"], function(require, exports, module) {
"use strict";

var Range = require("./range").Range;
var EventEmitter = require("./lib/event_emitter").EventEmitter;
var oop = require("./lib/oop");

var PlaceHolder = function(session, length, pos, others, mainClass, othersClass) {
    var _self = this;
    this.length = length;
    this.session = session;
    this.doc = session.getDocument();
    this.mainClass = mainClass;
    this.othersClass = othersClass;
    this.$onUpdate = this.onUpdate.bind(this);
    this.doc.on("change", this.$onUpdate);
    this.$others = others;
    
    this.$onCursorChange = function() {
        setTimeout(function() {
            _self.onCursorChange();
        });
    };
    
    this.$pos = pos;
    var undoStack = session.getUndoManager().$undoStack || session.getUndoManager().$undostack || {length: -1};
    this.$undoStackDepth =  undoStack.length;
    this.setup();

    session.selection.on("changeCursor", this.$onCursorChange);
};

(function() {

    oop.implement(this, EventEmitter);
    this.setup = function() {
        var _self = this;
        var doc = this.doc;
        var session = this.session;
        var pos = this.$pos;
        
        this.selectionBefore = session.selection.toJSON();
        if (session.selection.inMultiSelectMode)
            session.selection.toSingleRange();

        this.pos = doc.createAnchor(pos.row, pos.column);
        this.markerId = session.addMarker(new Range(pos.row, pos.column, pos.row, pos.column + this.length), this.mainClass, null, false);
        this.pos.on("change", function(event) {
            session.removeMarker(_self.markerId);
            _self.markerId = session.addMarker(new Range(event.value.row, event.value.column, event.value.row, event.value.column+_self.length), _self.mainClass, null, false);
        });
        this.others = [];
        this.$others.forEach(function(other) {
            var anchor = doc.createAnchor(other.row, other.column);
            _self.others.push(anchor);
        });
        session.setUndoSelect(false);
    };
    this.showOtherMarkers = function() {
        if(this.othersActive) return;
        var session = this.session;
        var _self = this;
        this.othersActive = true;
        this.others.forEach(function(anchor) {
            anchor.markerId = session.addMarker(new Range(anchor.row, anchor.column, anchor.row, anchor.column+_self.length), _self.othersClass, null, false);
            anchor.on("change", function(event) {
                session.removeMarker(anchor.markerId);
                anchor.markerId = session.addMarker(new Range(event.value.row, event.value.column, event.value.row, event.value.column+_self.length), _self.othersClass, null, false);
            });
        });
    };
    this.hideOtherMarkers = function() {
        if(!this.othersActive) return;
        this.othersActive = false;
        for (var i = 0; i < this.others.length; i++) {
            this.session.removeMarker(this.others[i].markerId);
        }
    };
    this.onUpdate = function(event) {
        var delta = event.data;
        var range = delta.range;
        if(range.start.row !== range.end.row) return;
        if(range.start.row !== this.pos.row) return;
        if (this.$updating) return;
        this.$updating = true;
        var lengthDiff = delta.action === "insertText" ? range.end.column - range.start.column : range.start.column - range.end.column;
        
        if(range.start.column >= this.pos.column && range.start.column <= this.pos.column + this.length + 1) {
            var distanceFromStart = range.start.column - this.pos.column;
            this.length += lengthDiff;
            if(!this.session.$fromUndo) {
                if(delta.action === "insertText") {
                    for (var i = this.others.length - 1; i >= 0; i--) {
                        var otherPos = this.others[i];
                        var newPos = {row: otherPos.row, column: otherPos.column + distanceFromStart};
                        if(otherPos.row === range.start.row && range.start.column < otherPos.column)
                            newPos.column += lengthDiff;
                        this.doc.insert(newPos, delta.text);
                    }
                } else if(delta.action === "removeText") {
                    for (var i = this.others.length - 1; i >= 0; i--) {
                        var otherPos = this.others[i];
                        var newPos = {row: otherPos.row, column: otherPos.column + distanceFromStart};
                        if(otherPos.row === range.start.row && range.start.column < otherPos.column)
                            newPos.column += lengthDiff;
                        this.doc.remove(new Range(newPos.row, newPos.column, newPos.row, newPos.column - lengthDiff));
                    }
                }
                if(range.start.column === this.pos.column && delta.action === "insertText") {
                    setTimeout(function() {
                        this.pos.setPosition(this.pos.row, this.pos.column - lengthDiff);
                        for (var i = 0; i < this.others.length; i++) {
                            var other = this.others[i];
                            var newPos = {row: other.row, column: other.column - lengthDiff};
                            if(other.row === range.start.row && range.start.column < other.column)
                                newPos.column += lengthDiff;
                            other.setPosition(newPos.row, newPos.column);
                        }
                    }.bind(this), 0);
                }
                else if(range.start.column === this.pos.column && delta.action === "removeText") {
                    setTimeout(function() {
                        for (var i = 0; i < this.others.length; i++) {
                            var other = this.others[i];
                            if(other.row === range.start.row && range.start.column < other.column) {
                                other.setPosition(other.row, other.column - lengthDiff);
                            }
                        }
                    }.bind(this), 0);
                }
            }
            this.pos._emit("change", {value: this.pos});
            for (var i = 0; i < this.others.length; i++) {
                this.others[i]._emit("change", {value: this.others[i]});
            }
        }
        this.$updating = false;
    };

    this.onCursorChange = function(event) {
        if (this.$updating || !this.session) return;
        var pos = this.session.selection.getCursor();
        if (pos.row === this.pos.row && pos.column >= this.pos.column && pos.column <= this.pos.column + this.length) {
            this.showOtherMarkers();
            this._emit("cursorEnter", event);
        } else {
            this.hideOtherMarkers();
            this._emit("cursorLeave", event);
        }
    };    
    this.detach = function() {
        this.session.removeMarker(this.markerId);
        this.hideOtherMarkers();
        this.doc.removeEventListener("change", this.$onUpdate);
        this.session.selection.removeEventListener("changeCursor", this.$onCursorChange);
        this.pos.detach();
        for (var i = 0; i < this.others.length; i++) {
            this.others[i].detach();
        }
        this.session.setUndoSelect(true);
        this.session = null;
    };
    this.cancel = function() {
        if(this.$undoStackDepth === -1)
            throw Error("Canceling placeholders only supported with undo manager attached to session.");
        var undoManager = this.session.getUndoManager();
        var undosRequired = (undoManager.$undoStack || undoManager.$undostack).length - this.$undoStackDepth;
        for (var i = 0; i < undosRequired; i++) {
            undoManager.undo(true);
        }
        if (this.selectionBefore)
            this.session.selection.fromJSON(this.selectionBefore);
    };
}).call(PlaceHolder.prototype);


exports.PlaceHolder = PlaceHolder;
});

ace.define("ace/mouse/multi_select_handler",["require","exports","module","ace/lib/event","ace/lib/useragent"], function(require, exports, module) {

var event = require("../lib/event");
var useragent = require("../lib/useragent");
function isSamePoint(p1, p2) {
    return p1.row == p2.row && p1.column == p2.column;
}

function onMouseDown(e) {
    var ev = e.domEvent;
    var alt = ev.altKey;
    var shift = ev.shiftKey;
    var ctrl = ev.ctrlKey;
    var accel = e.getAccelKey();
    var button = e.getButton();
    
    if (ctrl && useragent.isMac)
        button = ev.button;

    if (e.editor.inMultiSelectMode && button == 2) {
        e.editor.textInput.onContextMenu(e.domEvent);
        return;
    }
    
    if (!ctrl && !alt && !accel) {
        if (button === 0 && e.editor.inMultiSelectMode)
            e.editor.exitMultiSelectMode();
        return;
    }
    
    if (button !== 0)
        return;

    var editor = e.editor;
    var selection = editor.selection;
    var isMultiSelect = editor.inMultiSelectMode;
    var pos = e.getDocumentPosition();
    var cursor = selection.getCursor();
    var inSelection = e.inSelection() || (selection.isEmpty() && isSamePoint(pos, cursor));

    var mouseX = e.x, mouseY = e.y;
    var onMouseSelection = function(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
    };
    
    var session = editor.session;
    var screenAnchor = editor.renderer.pixelToScreenCoordinates(mouseX, mouseY);
    var screenCursor = screenAnchor;
    
    var selectionMode;
    if (editor.$mouseHandler.$enableJumpToDef) {
        if (ctrl && alt || accel && alt)
            selectionMode = "add";
        else if (alt)
            selectionMode = "block";
    } else {
        if (accel && !alt) {
            selectionMode = "add";
            if (!isMultiSelect && shift)
                return;
        } else if (alt) {
            selectionMode = "block";
        }
    }
    
    if (selectionMode && useragent.isMac && ev.ctrlKey) {
        editor.$mouseHandler.cancelContextMenu();
    }

    if (selectionMode == "add") {
        if (!isMultiSelect && inSelection)
            return; // dragging

        if (!isMultiSelect) {
            var range = selection.toOrientedRange();
            editor.addSelectionMarker(range);
        }

        var oldRange = selection.rangeList.rangeAtPoint(pos);
        
        
        editor.$blockScrolling++;
        editor.inVirtualSelectionMode = true;
        
        if (shift) {
            oldRange = null;
            range = selection.ranges[0];
            editor.removeSelectionMarker(range);
        }
        editor.once("mouseup", function() {
            var tmpSel = selection.toOrientedRange();

            if (oldRange && tmpSel.isEmpty() && isSamePoint(oldRange.cursor, tmpSel.cursor))
                selection.substractPoint(tmpSel.cursor);
            else {
                if (shift) {
                    selection.substractPoint(range.cursor);
                } else if (range) {
                    editor.removeSelectionMarker(range);
                    selection.addRange(range);
                }
                selection.addRange(tmpSel);
            }
            editor.$blockScrolling--;
            editor.inVirtualSelectionMode = false;
        });

    } else if (selectionMode == "block") {
        e.stop();
        editor.inVirtualSelectionMode = true;        
        var initialRange;
        var rectSel = [];
        var blockSelect = function() {
            var newCursor = editor.renderer.pixelToScreenCoordinates(mouseX, mouseY);
            var cursor = session.screenToDocumentPosition(newCursor.row, newCursor.column);

            if (isSamePoint(screenCursor, newCursor) && isSamePoint(cursor, selection.lead))
                return;
            screenCursor = newCursor;

            editor.selection.moveToPosition(cursor);
            editor.renderer.scrollCursorIntoView();

            editor.removeSelectionMarkers(rectSel);
            rectSel = selection.rectangularRangeBlock(screenCursor, screenAnchor);
            if (editor.$mouseHandler.$clickSelection && rectSel.length == 1 && rectSel[0].isEmpty())
                rectSel[0] = editor.$mouseHandler.$clickSelection.clone();
            rectSel.forEach(editor.addSelectionMarker, editor);
            editor.updateSelectionMarkers();
        };
        
        if (isMultiSelect && !accel) {
            selection.toSingleRange();
        } else if (!isMultiSelect && accel) {
            initialRange = selection.toOrientedRange();
            editor.addSelectionMarker(initialRange);
        }
        
        if (shift)
            screenAnchor = session.documentToScreenPosition(selection.lead);            
        else
            selection.moveToPosition(pos);
        
        screenCursor = {row: -1, column: -1};

        var onMouseSelectionEnd = function(e) {
            clearInterval(timerId);
            editor.removeSelectionMarkers(rectSel);
            if (!rectSel.length)
                rectSel = [selection.toOrientedRange()];
            editor.$blockScrolling++;
            if (initialRange) {
                editor.removeSelectionMarker(initialRange);
                selection.toSingleRange(initialRange);
            }
            for (var i = 0; i < rectSel.length; i++)
                selection.addRange(rectSel[i]);
            editor.inVirtualSelectionMode = false;
            editor.$mouseHandler.$clickSelection = null;
            editor.$blockScrolling--;
        };

        var onSelectionInterval = blockSelect;

        event.capture(editor.container, onMouseSelection, onMouseSelectionEnd);
        var timerId = setInterval(function() {onSelectionInterval();}, 20);

        return e.preventDefault();
    }
}


exports.onMouseDown = onMouseDown;

});

ace.define("ace/commands/multi_select_commands",["require","exports","module","ace/keyboard/hash_handler"], function(require, exports, module) {
exports.defaultCommands = [{
    name: "addCursorAbove",
    exec: function(editor) { editor.selectMoreLines(-1); },
    bindKey: {win: "Ctrl-Alt-Up", mac: "Ctrl-Alt-Up"},
    readonly: true
}, {
    name: "addCursorBelow",
    exec: function(editor) { editor.selectMoreLines(1); },
    bindKey: {win: "Ctrl-Alt-Down", mac: "Ctrl-Alt-Down"},
    readonly: true
}, {
    name: "addCursorAboveSkipCurrent",
    exec: function(editor) { editor.selectMoreLines(-1, true); },
    bindKey: {win: "Ctrl-Alt-Shift-Up", mac: "Ctrl-Alt-Shift-Up"},
    readonly: true
}, {
    name: "addCursorBelowSkipCurrent",
    exec: function(editor) { editor.selectMoreLines(1, true); },
    bindKey: {win: "Ctrl-Alt-Shift-Down", mac: "Ctrl-Alt-Shift-Down"},
    readonly: true
}, {
    name: "selectMoreBefore",
    exec: function(editor) { editor.selectMore(-1); },
    bindKey: {win: "Ctrl-Alt-Left", mac: "Ctrl-Alt-Left"},
    readonly: true
}, {
    name: "selectMoreAfter",
    exec: function(editor) { editor.selectMore(1); },
    bindKey: {win: "Ctrl-Alt-Right", mac: "Ctrl-Alt-Right"},
    readonly: true
}, {
    name: "selectNextBefore",
    exec: function(editor) { editor.selectMore(-1, true); },
    bindKey: {win: "Ctrl-Alt-Shift-Left", mac: "Ctrl-Alt-Shift-Left"},
    readonly: true
}, {
    name: "selectNextAfter",
    exec: function(editor) { editor.selectMore(1, true); },
    bindKey: {win: "Ctrl-Alt-Shift-Right", mac: "Ctrl-Alt-Shift-Right"},
    readonly: true
}, {
    name: "splitIntoLines",
    exec: function(editor) { editor.multiSelect.splitIntoLines(); },
    bindKey: {win: "Ctrl-Alt-L", mac: "Ctrl-Alt-L"},
    readonly: true
}, {
    name: "alignCursors",
    exec: function(editor) { editor.alignCursors(); },
    bindKey: {win: "Ctrl-Alt-A", mac: "Ctrl-Alt-A"}
}, {
    name: "findAll",
    exec: function(editor) { editor.findAll(); },
    bindKey: {win: "Ctrl-Alt-K", mac: "Ctrl-Alt-G"},
    readonly: true
}];
exports.multiSelectCommands = [{
    name: "singleSelection",
    bindKey: "esc",
    exec: function(editor) { editor.exitMultiSelectMode(); },
    readonly: true,
    isAvailable: function(editor) {return editor && editor.inMultiSelectMode}
}];

var HashHandler = require("../keyboard/hash_handler").HashHandler;
exports.keyboardHandler = new HashHandler(exports.multiSelectCommands);

});

ace.define("ace/multi_select",["require","exports","module","ace/range_list","ace/range","ace/selection","ace/mouse/multi_select_handler","ace/lib/event","ace/lib/lang","ace/commands/multi_select_commands","ace/search","ace/edit_session","ace/editor","ace/config"], function(require, exports, module) {

var RangeList = require("./range_list").RangeList;
var Range = require("./range").Range;
var Selection = require("./selection").Selection;
var onMouseDown = require("./mouse/multi_select_handler").onMouseDown;
var event = require("./lib/event");
var lang = require("./lib/lang");
var commands = require("./commands/multi_select_commands");
exports.commands = commands.defaultCommands.concat(commands.multiSelectCommands);
var Search = require("./search").Search;
var search = new Search();

function find(session, needle, dir) {
    search.$options.wrap = true;
    search.$options.needle = needle;
    search.$options.backwards = dir == -1;
    return search.find(session);
}
var EditSession = require("./edit_session").EditSession;
(function() {
    this.getSelectionMarkers = function() {
        return this.$selectionMarkers;
    };
}).call(EditSession.prototype);
(function() {
    this.ranges = null;
    this.rangeList = null;
    this.addRange = function(range, $blockChangeEvents) {
        if (!range)
            return;

        if (!this.inMultiSelectMode && this.rangeCount === 0) {
            var oldRange = this.toOrientedRange();
            this.rangeList.add(oldRange);
            this.rangeList.add(range);
            if (this.rangeList.ranges.length != 2) {
                this.rangeList.removeAll();
                return $blockChangeEvents || this.fromOrientedRange(range);
            }
            this.rangeList.removeAll();
            this.rangeList.add(oldRange);
            this.$onAddRange(oldRange);
        }

        if (!range.cursor)
            range.cursor = range.end;

        var removed = this.rangeList.add(range);

        this.$onAddRange(range);

        if (removed.length)
            this.$onRemoveRange(removed);

        if (this.rangeCount > 1 && !this.inMultiSelectMode) {
            this._signal("multiSelect");
            this.inMultiSelectMode = true;
            this.session.$undoSelect = false;
            this.rangeList.attach(this.session);
        }

        return $blockChangeEvents || this.fromOrientedRange(range);
    };

    this.toSingleRange = function(range) {
        range = range || this.ranges[0];
        var removed = this.rangeList.removeAll();
        if (removed.length)
            this.$onRemoveRange(removed);

        range && this.fromOrientedRange(range);
    };
    this.substractPoint = function(pos) {
        var removed = this.rangeList.substractPoint(pos);
        if (removed) {
            this.$onRemoveRange(removed);
            return removed[0];
        }
    };
    this.mergeOverlappingRanges = function() {
        var removed = this.rangeList.merge();
        if (removed.length)
            this.$onRemoveRange(removed);
        else if(this.ranges[0])
            this.fromOrientedRange(this.ranges[0]);
    };

    this.$onAddRange = function(range) {
        this.rangeCount = this.rangeList.ranges.length;
        this.ranges.unshift(range);
        this._signal("addRange", {range: range});
    };

    this.$onRemoveRange = function(removed) {
        this.rangeCount = this.rangeList.ranges.length;
        if (this.rangeCount == 1 && this.inMultiSelectMode) {
            var lastRange = this.rangeList.ranges.pop();
            removed.push(lastRange);
            this.rangeCount = 0;
        }

        for (var i = removed.length; i--; ) {
            var index = this.ranges.indexOf(removed[i]);
            this.ranges.splice(index, 1);
        }

        this._signal("removeRange", {ranges: removed});

        if (this.rangeCount === 0 && this.inMultiSelectMode) {
            this.inMultiSelectMode = false;
            this._signal("singleSelect");
            this.session.$undoSelect = true;
            this.rangeList.detach(this.session);
        }

        lastRange = lastRange || this.ranges[0];
        if (lastRange && !lastRange.isEqual(this.getRange()))
            this.fromOrientedRange(lastRange);
    };
    this.$initRangeList = function() {
        if (this.rangeList)
            return;

        this.rangeList = new RangeList();
        this.ranges = [];
        this.rangeCount = 0;
    };
    this.getAllRanges = function() {
        return this.rangeCount ? this.rangeList.ranges.concat() : [this.getRange()];
    };

    this.splitIntoLines = function () {
        if (this.rangeCount > 1) {
            var ranges = this.rangeList.ranges;
            var lastRange = ranges[ranges.length - 1];
            var range = Range.fromPoints(ranges[0].start, lastRange.end);

            this.toSingleRange();
            this.setSelectionRange(range, lastRange.cursor == lastRange.start);
        } else {
            var range = this.getRange();
            var isBackwards = this.isBackwards();
            var startRow = range.start.row;
            var endRow = range.end.row;
            if (startRow == endRow) {
                if (isBackwards)
                    var start = range.end, end = range.start;
                else
                    var start = range.start, end = range.end;
                
                this.addRange(Range.fromPoints(end, end));
                this.addRange(Range.fromPoints(start, start));
                return;
            }

            var rectSel = [];
            var r = this.getLineRange(startRow, true);
            r.start.column = range.start.column;
            rectSel.push(r);

            for (var i = startRow + 1; i < endRow; i++)
                rectSel.push(this.getLineRange(i, true));

            r = this.getLineRange(endRow, true);
            r.end.column = range.end.column;
            rectSel.push(r);

            rectSel.forEach(this.addRange, this);
        }
    };
    this.toggleBlockSelection = function () {
        if (this.rangeCount > 1) {
            var ranges = this.rangeList.ranges;
            var lastRange = ranges[ranges.length - 1];
            var range = Range.fromPoints(ranges[0].start, lastRange.end);

            this.toSingleRange();
            this.setSelectionRange(range, lastRange.cursor == lastRange.start);
        } else {
            var cursor = this.session.documentToScreenPosition(this.selectionLead);
            var anchor = this.session.documentToScreenPosition(this.selectionAnchor);

            var rectSel = this.rectangularRangeBlock(cursor, anchor);
            rectSel.forEach(this.addRange, this);
        }
    };
    this.rectangularRangeBlock = function(screenCursor, screenAnchor, includeEmptyLines) {
        var rectSel = [];

        var xBackwards = screenCursor.column < screenAnchor.column;
        if (xBackwards) {
            var startColumn = screenCursor.column;
            var endColumn = screenAnchor.column;
        } else {
            var startColumn = screenAnchor.column;
            var endColumn = screenCursor.column;
        }

        var yBackwards = screenCursor.row < screenAnchor.row;
        if (yBackwards) {
            var startRow = screenCursor.row;
            var endRow = screenAnchor.row;
        } else {
            var startRow = screenAnchor.row;
            var endRow = screenCursor.row;
        }

        if (startColumn < 0)
            startColumn = 0;
        if (startRow < 0)
            startRow = 0;

        if (startRow == endRow)
            includeEmptyLines = true;

        for (var row = startRow; row <= endRow; row++) {
            var range = Range.fromPoints(
                this.session.screenToDocumentPosition(row, startColumn),
                this.session.screenToDocumentPosition(row, endColumn)
            );
            if (range.isEmpty()) {
                if (docEnd && isSamePoint(range.end, docEnd))
                    break;
                var docEnd = range.end;
            }
            range.cursor = xBackwards ? range.start : range.end;
            rectSel.push(range);
        }

        if (yBackwards)
            rectSel.reverse();

        if (!includeEmptyLines) {
            var end = rectSel.length - 1;
            while (rectSel[end].isEmpty() && end > 0)
                end--;
            if (end > 0) {
                var start = 0;
                while (rectSel[start].isEmpty())
                    start++;
            }
            for (var i = end; i >= start; i--) {
                if (rectSel[i].isEmpty())
                    rectSel.splice(i, 1);
            }
        }

        return rectSel;
    };
}).call(Selection.prototype);
var Editor = require("./editor").Editor;
(function() {
    this.updateSelectionMarkers = function() {
        this.renderer.updateCursor();
        this.renderer.updateBackMarkers();
    };
    this.addSelectionMarker = function(orientedRange) {
        if (!orientedRange.cursor)
            orientedRange.cursor = orientedRange.end;

        var style = this.getSelectionStyle();
        orientedRange.marker = this.session.addMarker(orientedRange, "ace_selection", style);

        this.session.$selectionMarkers.push(orientedRange);
        this.session.selectionMarkerCount = this.session.$selectionMarkers.length;
        return orientedRange;
    };
    this.removeSelectionMarker = function(range) {
        if (!range.marker)
            return;
        this.session.removeMarker(range.marker);
        var index = this.session.$selectionMarkers.indexOf(range);
        if (index != -1)
            this.session.$selectionMarkers.splice(index, 1);
        this.session.selectionMarkerCount = this.session.$selectionMarkers.length;
    };

    this.removeSelectionMarkers = function(ranges) {
        var markerList = this.session.$selectionMarkers;
        for (var i = ranges.length; i--; ) {
            var range = ranges[i];
            if (!range.marker)
                continue;
            this.session.removeMarker(range.marker);
            var index = markerList.indexOf(range);
            if (index != -1)
                markerList.splice(index, 1);
        }
        this.session.selectionMarkerCount = markerList.length;
    };

    this.$onAddRange = function(e) {
        this.addSelectionMarker(e.range);
        this.renderer.updateCursor();
        this.renderer.updateBackMarkers();
    };

    this.$onRemoveRange = function(e) {
        this.removeSelectionMarkers(e.ranges);
        this.renderer.updateCursor();
        this.renderer.updateBackMarkers();
    };

    this.$onMultiSelect = function(e) {
        if (this.inMultiSelectMode)
            return;
        this.inMultiSelectMode = true;

        this.setStyle("ace_multiselect");
        this.keyBinding.addKeyboardHandler(commands.keyboardHandler);
        this.commands.setDefaultHandler("exec", this.$onMultiSelectExec);

        this.renderer.updateCursor();
        this.renderer.updateBackMarkers();
    };

    this.$onSingleSelect = function(e) {
        if (this.session.multiSelect.inVirtualMode)
            return;
        this.inMultiSelectMode = false;

        this.unsetStyle("ace_multiselect");
        this.keyBinding.removeKeyboardHandler(commands.keyboardHandler);

        this.commands.removeDefaultHandler("exec", this.$onMultiSelectExec);
        this.renderer.updateCursor();
        this.renderer.updateBackMarkers();
        this._emit("changeSelection");
    };

    this.$onMultiSelectExec = function(e) {
        var command = e.command;
        var editor = e.editor;
        if (!editor.multiSelect)
            return;
        if (!command.multiSelectAction) {
            var result = command.exec(editor, e.args || {});
            editor.multiSelect.addRange(editor.multiSelect.toOrientedRange());
            editor.multiSelect.mergeOverlappingRanges();
        } else if (command.multiSelectAction == "forEach") {
            result = editor.forEachSelection(command, e.args);
        } else if (command.multiSelectAction == "forEachLine") {
            result = editor.forEachSelection(command, e.args, true);
        } else if (command.multiSelectAction == "single") {
            editor.exitMultiSelectMode();
            result = command.exec(editor, e.args || {});
        } else {
            result = command.multiSelectAction(editor, e.args || {});
        }
        return result;
    }; 
    this.forEachSelection = function(cmd, args, options) {
        if (this.inVirtualSelectionMode)
            return;
        var keepOrder = options && options.keepOrder;
        var $byLines = options == true || options && options.$byLines
        var session = this.session;
        var selection = this.selection;
        var rangeList = selection.rangeList;
        var ranges = (keepOrder ? selection : rangeList).ranges;
        var result;
        
        if (!ranges.length)
            return cmd.exec ? cmd.exec(this, args || {}) : cmd(this, args || {});
        
        var reg = selection._eventRegistry;
        selection._eventRegistry = {};

        var tmpSel = new Selection(session);
        this.inVirtualSelectionMode = true;
        for (var i = ranges.length; i--;) {
            if ($byLines) {
                while (i > 0 && ranges[i].start.row == ranges[i - 1].end.row)
                    i--;
            }
            tmpSel.fromOrientedRange(ranges[i]);
            tmpSel.index = i;
            this.selection = session.selection = tmpSel;
            var cmdResult = cmd.exec ? cmd.exec(this, args || {}) : cmd(this, args || {});
            if (!result && cmdResult !== undefined)
                result = cmdResult;
            tmpSel.toOrientedRange(ranges[i]);
        }
        tmpSel.detach();

        this.selection = session.selection = selection;
        this.inVirtualSelectionMode = false;
        selection._eventRegistry = reg;
        selection.mergeOverlappingRanges();
        
        var anim = this.renderer.$scrollAnimation;
        this.onCursorChange();
        this.onSelectionChange();
        if (anim && anim.from == anim.to)
            this.renderer.animateScrolling(anim.from);
        
        return result;
    };
    this.exitMultiSelectMode = function() {
        if (!this.inMultiSelectMode || this.inVirtualSelectionMode)
            return;
        this.multiSelect.toSingleRange();
    };

    this.getSelectedText = function() {
        var text = "";
        if (this.inMultiSelectMode && !this.inVirtualSelectionMode) {
            var ranges = this.multiSelect.rangeList.ranges;
            var buf = [];
            for (var i = 0; i < ranges.length; i++) {
                buf.push(this.session.getTextRange(ranges[i]));
            }
            var nl = this.session.getDocument().getNewLineCharacter();
            text = buf.join(nl);
            if (text.length == (buf.length - 1) * nl.length)
                text = "";
        } else if (!this.selection.isEmpty()) {
            text = this.session.getTextRange(this.getSelectionRange());
        }
        return text;
    };
    
    this.$checkMultiselectChange = function(e, anchor) {
        if (this.inMultiSelectMode && !this.inVirtualSelectionMode) {
            var range = this.multiSelect.ranges[0];
            if (this.multiSelect.isEmpty() && anchor == this.multiSelect.anchor)
                return;
            var pos = anchor == this.multiSelect.anchor
                ? range.cursor == range.start ? range.end : range.start
                : range.cursor;
            if (!isSamePoint(pos, anchor))
                this.multiSelect.toSingleRange(this.multiSelect.toOrientedRange());
        }
    };
    this.onPaste = function(text) {
        if (this.$readOnly)
            return;


        var e = {text: text};
        this._signal("paste", e);
        text = e.text;
        if (!this.inMultiSelectMode || this.inVirtualSelectionMode)
            return this.insert(text);

        var lines = text.split(/\r\n|\r|\n/);
        var ranges = this.selection.rangeList.ranges;

        if (lines.length > ranges.length || lines.length < 2 || !lines[1])
            return this.commands.exec("insertstring", this, text);

        for (var i = ranges.length; i--;) {
            var range = ranges[i];
            if (!range.isEmpty())
                this.session.remove(range);

            this.session.insert(range.start, lines[i]);
        }
    };
    this.findAll = function(needle, options, additive) {
        options = options || {};
        options.needle = needle || options.needle;
        if (options.needle == undefined) {
            var range = this.selection.isEmpty()
                ? this.selection.getWordRange()
                : this.selection.getRange();
            options.needle = this.session.getTextRange(range);
        }    
        this.$search.set(options);
        
        var ranges = this.$search.findAll(this.session);
        if (!ranges.length)
            return 0;

        this.$blockScrolling += 1;
        var selection = this.multiSelect;

        if (!additive)
            selection.toSingleRange(ranges[0]);

        for (var i = ranges.length; i--; )
            selection.addRange(ranges[i], true);
        if (range && selection.rangeList.rangeAtPoint(range.start))
            selection.addRange(range, true);
        
        this.$blockScrolling -= 1;

        return ranges.length;
    };
    this.selectMoreLines = function(dir, skip) {
        var range = this.selection.toOrientedRange();
        var isBackwards = range.cursor == range.end;

        var screenLead = this.session.documentToScreenPosition(range.cursor);
        if (this.selection.$desiredColumn)
            screenLead.column = this.selection.$desiredColumn;

        var lead = this.session.screenToDocumentPosition(screenLead.row + dir, screenLead.column);

        if (!range.isEmpty()) {
            var screenAnchor = this.session.documentToScreenPosition(isBackwards ? range.end : range.start);
            var anchor = this.session.screenToDocumentPosition(screenAnchor.row + dir, screenAnchor.column);
        } else {
            var anchor = lead;
        }

        if (isBackwards) {
            var newRange = Range.fromPoints(lead, anchor);
            newRange.cursor = newRange.start;
        } else {
            var newRange = Range.fromPoints(anchor, lead);
            newRange.cursor = newRange.end;
        }

        newRange.desiredColumn = screenLead.column;
        if (!this.selection.inMultiSelectMode) {
            this.selection.addRange(range);
        } else {
            if (skip)
                var toRemove = range.cursor;
        }

        this.selection.addRange(newRange);
        if (toRemove)
            this.selection.substractPoint(toRemove);
    };
    this.transposeSelections = function(dir) {
        var session = this.session;
        var sel = session.multiSelect;
        var all = sel.ranges;

        for (var i = all.length; i--; ) {
            var range = all[i];
            if (range.isEmpty()) {
                var tmp = session.getWordRange(range.start.row, range.start.column);
                range.start.row = tmp.start.row;
                range.start.column = tmp.start.column;
                range.end.row = tmp.end.row;
                range.end.column = tmp.end.column;
            }
        }
        sel.mergeOverlappingRanges();

        var words = [];
        for (var i = all.length; i--; ) {
            var range = all[i];
            words.unshift(session.getTextRange(range));
        }

        if (dir < 0)
            words.unshift(words.pop());
        else
            words.push(words.shift());

        for (var i = all.length; i--; ) {
            var range = all[i];
            var tmp = range.clone();
            session.replace(range, words[i]);
            range.start.row = tmp.start.row;
            range.start.column = tmp.start.column;
        }
    };
    this.selectMore = function(dir, skip, stopAtFirst) {
        var session = this.session;
        var sel = session.multiSelect;

        var range = sel.toOrientedRange();
        if (range.isEmpty()) {
            range = session.getWordRange(range.start.row, range.start.column);
            range.cursor = dir == -1 ? range.start : range.end;
            this.multiSelect.addRange(range);
            if (stopAtFirst)
                return;
        }
        var needle = session.getTextRange(range);

        var newRange = find(session, needle, dir);
        if (newRange) {
            newRange.cursor = dir == -1 ? newRange.start : newRange.end;
            this.$blockScrolling += 1;
            this.session.unfold(newRange);
            this.multiSelect.addRange(newRange);
            this.$blockScrolling -= 1;
            this.renderer.scrollCursorIntoView(null, 0.5);
        }
        if (skip)
            this.multiSelect.substractPoint(range.cursor);
    };
    this.alignCursors = function() {
        var session = this.session;
        var sel = session.multiSelect;
        var ranges = sel.ranges;
        var row = -1;
        var sameRowRanges = ranges.filter(function(r) {
            if (r.cursor.row == row)
                return true;
            row = r.cursor.row;
        });
        
        if (!ranges.length || sameRowRanges.length == ranges.length - 1) {
            var range = this.selection.getRange();
            var fr = range.start.row, lr = range.end.row;
            var guessRange = fr == lr;
            if (guessRange) {
                var max = this.session.getLength();
                var line;
                do {
                    line = this.session.getLine(lr);
                } while (/[=:]/.test(line) && ++lr < max);
                do {
                    line = this.session.getLine(fr);
                } while (/[=:]/.test(line) && --fr > 0);
                
                if (fr < 0) fr = 0;
                if (lr >= max) lr = max - 1;
            }
            var lines = this.session.doc.removeLines(fr, lr);
            lines = this.$reAlignText(lines, guessRange);
            this.session.doc.insert({row: fr, column: 0}, lines.join("\n") + "\n");
            if (!guessRange) {
                range.start.column = 0;
                range.end.column = lines[lines.length - 1].length;
            }
            this.selection.setRange(range);
        } else {
            sameRowRanges.forEach(function(r) {
                sel.substractPoint(r.cursor);
            });

            var maxCol = 0;
            var minSpace = Infinity;
            var spaceOffsets = ranges.map(function(r) {
                var p = r.cursor;
                var line = session.getLine(p.row);
                var spaceOffset = line.substr(p.column).search(/\S/g);
                if (spaceOffset == -1)
                    spaceOffset = 0;

                if (p.column > maxCol)
                    maxCol = p.column;
                if (spaceOffset < minSpace)
                    minSpace = spaceOffset;
                return spaceOffset;
            });
            ranges.forEach(function(r, i) {
                var p = r.cursor;
                var l = maxCol - p.column;
                var d = spaceOffsets[i] - minSpace;
                if (l > d)
                    session.insert(p, lang.stringRepeat(" ", l - d));
                else
                    session.remove(new Range(p.row, p.column, p.row, p.column - l + d));

                r.start.column = r.end.column = maxCol;
                r.start.row = r.end.row = p.row;
                r.cursor = r.end;
            });
            sel.fromOrientedRange(ranges[0]);
            this.renderer.updateCursor();
            this.renderer.updateBackMarkers();
        }
    };

    this.$reAlignText = function(lines, forceLeft) {
        var isLeftAligned = true, isRightAligned = true;
        var startW, textW, endW;

        return lines.map(function(line) {
            var m = line.match(/(\s*)(.*?)(\s*)([=:].*)/);
            if (!m)
                return [line];

            if (startW == null) {
                startW = m[1].length;
                textW = m[2].length;
                endW = m[3].length;
                return m;
            }

            if (startW + textW + endW != m[1].length + m[2].length + m[3].length)
                isRightAligned = false;
            if (startW != m[1].length)
                isLeftAligned = false;

            if (startW > m[1].length)
                startW = m[1].length;
            if (textW < m[2].length)
                textW = m[2].length;
            if (endW > m[3].length)
                endW = m[3].length;

            return m;
        }).map(forceLeft ? alignLeft :
            isLeftAligned ? isRightAligned ? alignRight : alignLeft : unAlign);

        function spaces(n) {
            return lang.stringRepeat(" ", n);
        }

        function alignLeft(m) {
            return !m[2] ? m[0] : spaces(startW) + m[2]
                + spaces(textW - m[2].length + endW)
                + m[4].replace(/^([=:])\s+/, "$1 ");
        }
        function alignRight(m) {
            return !m[2] ? m[0] : spaces(startW + textW - m[2].length) + m[2]
                + spaces(endW, " ")
                + m[4].replace(/^([=:])\s+/, "$1 ");
        }
        function unAlign(m) {
            return !m[2] ? m[0] : spaces(startW) + m[2]
                + spaces(endW)
                + m[4].replace(/^([=:])\s+/, "$1 ");
        }
    };
}).call(Editor.prototype);


function isSamePoint(p1, p2) {
    return p1.row == p2.row && p1.column == p2.column;
}
exports.onSessionChange = function(e) {
    var session = e.session;
    if (session && !session.multiSelect) {
        session.$selectionMarkers = [];
        session.selection.$initRangeList();
        session.multiSelect = session.selection;
    }
    this.multiSelect = session && session.multiSelect;

    var oldSession = e.oldSession;
    if (oldSession) {
        oldSession.multiSelect.off("addRange", this.$onAddRange);
        oldSession.multiSelect.off("removeRange", this.$onRemoveRange);
        oldSession.multiSelect.off("multiSelect", this.$onMultiSelect);
        oldSession.multiSelect.off("singleSelect", this.$onSingleSelect);
        oldSession.multiSelect.lead.off("change",  this.$checkMultiselectChange);
        oldSession.multiSelect.anchor.off("change",  this.$checkMultiselectChange);
    }

    if (session) {
        session.multiSelect.on("addRange", this.$onAddRange);
        session.multiSelect.on("removeRange", this.$onRemoveRange);
        session.multiSelect.on("multiSelect", this.$onMultiSelect);
        session.multiSelect.on("singleSelect", this.$onSingleSelect);
        session.multiSelect.lead.on("change",  this.$checkMultiselectChange);
        session.multiSelect.anchor.on("change",  this.$checkMultiselectChange);
    }

    if (session && this.inMultiSelectMode != session.selection.inMultiSelectMode) {
        if (session.selection.inMultiSelectMode)
            this.$onMultiSelect();
        else
            this.$onSingleSelect();
    }
};
function MultiSelect(editor) {
    if (editor.$multiselectOnSessionChange)
        return;
    editor.$onAddRange = editor.$onAddRange.bind(editor);
    editor.$onRemoveRange = editor.$onRemoveRange.bind(editor);
    editor.$onMultiSelect = editor.$onMultiSelect.bind(editor);
    editor.$onSingleSelect = editor.$onSingleSelect.bind(editor);
    editor.$multiselectOnSessionChange = exports.onSessionChange.bind(editor);
    editor.$checkMultiselectChange = editor.$checkMultiselectChange.bind(editor);

    editor.$multiselectOnSessionChange(editor);
    editor.on("changeSession", editor.$multiselectOnSessionChange);

    editor.on("mousedown", onMouseDown);
    editor.commands.addCommands(commands.defaultCommands);

    addAltCursorListeners(editor);
}

function addAltCursorListeners(editor){
    var el = editor.textInput.getElement();
    var altCursor = false;
    event.addListener(el, "keydown", function(e) {
        if (e.keyCode == 18 && !(e.ctrlKey || e.shiftKey || e.metaKey)) {
            if (!altCursor) {
                editor.renderer.setMouseCursor("crosshair");
                altCursor = true;
            }
        } else if (altCursor) {
            reset();
        }
    });

    event.addListener(el, "keyup", reset);
    event.addListener(el, "blur", reset);
    function reset(e) {
        if (altCursor) {
            editor.renderer.setMouseCursor("");
            altCursor = false;
        }
    }
}

exports.MultiSelect = MultiSelect;


require("./config").defineOptions(Editor.prototype, "editor", {
    enableMultiselect: {
        set: function(val) {
            MultiSelect(this);
            if (val) {
                this.on("changeSession", this.$multiselectOnSessionChange);
                this.on("mousedown", onMouseDown);
            } else {
                this.off("changeSession", this.$multiselectOnSessionChange);
                this.off("mousedown", onMouseDown);
            }
        },
        value: true
    }
});



});

ace.define("ace/mode/folding/fold_mode",["require","exports","module","ace/range"], function(require, exports, module) {
"use strict";

var Range = require("../../range").Range;

var FoldMode = exports.FoldMode = function() {};

(function() {

    this.foldingStartMarker = null;
    this.foldingStopMarker = null;
    this.getFoldWidget = function(session, foldStyle, row) {
        var line = session.getLine(row);
        if (this.foldingStartMarker.test(line))
            return "start";
        if (foldStyle == "markbeginend"
                && this.foldingStopMarker
                && this.foldingStopMarker.test(line))
            return "end";
        return "";
    };

    this.getFoldWidgetRange = function(session, foldStyle, row) {
        return null;
    };

    this.indentationBlock = function(session, row, column) {
        var re = /\S/;
        var line = session.getLine(row);
        var startLevel = line.search(re);
        if (startLevel == -1)
            return;

        var startColumn = column || line.length;
        var maxRow = session.getLength();
        var startRow = row;
        var endRow = row;

        while (++row < maxRow) {
            var level = session.getLine(row).search(re);

            if (level == -1)
                continue;

            if (level <= startLevel)
                break;

            endRow = row;
        }

        if (endRow > startRow) {
            var endColumn = session.getLine(endRow).length;
            return new Range(startRow, startColumn, endRow, endColumn);
        }
    };

    this.openingBracketBlock = function(session, bracket, row, column, typeRe) {
        var start = {row: row, column: column + 1};
        var end = session.$findClosingBracket(bracket, start, typeRe);
        if (!end)
            return;

        var fw = session.foldWidgets[end.row];
        if (fw == null)
            fw = session.getFoldWidget(end.row);

        if (fw == "start" && end.row > start.row) {
            end.row --;
            end.column = session.getLine(end.row).length;
        }
        return Range.fromPoints(start, end);
    };

    this.closingBracketBlock = function(session, bracket, row, column, typeRe) {
        var end = {row: row, column: column};
        var start = session.$findOpeningBracket(bracket, end);

        if (!start)
            return;

        start.column++;
        end.column--;

        return  Range.fromPoints(start, end);
    };
}).call(FoldMode.prototype);

});

ace.define("ace/theme/textmate",["require","exports","module","ace/lib/dom"], function(require, exports, module) {
"use strict";

exports.isDark = false;
exports.cssClass = "ace-tm";
exports.cssText = ".ace-tm .ace_gutter {\
background: #f0f0f0;\
color: #333;\
}\
.ace-tm .ace_print-margin {\
width: 1px;\
background: #e8e8e8;\
}\
.ace-tm .ace_fold {\
background-color: #6B72E6;\
}\
.ace-tm {\
background-color: #FFFFFF;\
color: black;\
}\
.ace-tm .ace_cursor {\
color: black;\
}\
.ace-tm .ace_invisible {\
color: rgb(191, 191, 191);\
}\
.ace-tm .ace_storage,\
.ace-tm .ace_keyword {\
color: blue;\
}\
.ace-tm .ace_constant {\
color: rgb(197, 6, 11);\
}\
.ace-tm .ace_constant.ace_buildin {\
color: rgb(88, 72, 246);\
}\
.ace-tm .ace_constant.ace_language {\
color: rgb(88, 92, 246);\
}\
.ace-tm .ace_constant.ace_library {\
color: rgb(6, 150, 14);\
}\
.ace-tm .ace_invalid {\
background-color: rgba(255, 0, 0, 0.1);\
color: red;\
}\
.ace-tm .ace_support.ace_function {\
color: rgb(60, 76, 114);\
}\
.ace-tm .ace_support.ace_constant {\
color: rgb(6, 150, 14);\
}\
.ace-tm .ace_support.ace_type,\
.ace-tm .ace_support.ace_class {\
color: rgb(109, 121, 222);\
}\
.ace-tm .ace_keyword.ace_operator {\
color: rgb(104, 118, 135);\
}\
.ace-tm .ace_string {\
color: rgb(3, 106, 7);\
}\
.ace-tm .ace_comment {\
color: rgb(76, 136, 107);\
}\
.ace-tm .ace_comment.ace_doc {\
color: rgb(0, 102, 255);\
}\
.ace-tm .ace_comment.ace_doc.ace_tag {\
color: rgb(128, 159, 191);\
}\
.ace-tm .ace_constant.ace_numeric {\
color: rgb(0, 0, 205);\
}\
.ace-tm .ace_variable {\
color: rgb(49, 132, 149);\
}\
.ace-tm .ace_xml-pe {\
color: rgb(104, 104, 91);\
}\
.ace-tm .ace_entity.ace_name.ace_function {\
color: #0000A2;\
}\
.ace-tm .ace_heading {\
color: rgb(12, 7, 255);\
}\
.ace-tm .ace_list {\
color:rgb(185, 6, 144);\
}\
.ace-tm .ace_meta.ace_tag {\
color:rgb(0, 22, 142);\
}\
.ace-tm .ace_string.ace_regex {\
color: rgb(255, 0, 0)\
}\
.ace-tm .ace_marker-layer .ace_selection {\
background: rgb(181, 213, 255);\
}\
.ace-tm.ace_multiselect .ace_selection.ace_start {\
box-shadow: 0 0 3px 0px white;\
border-radius: 2px;\
}\
.ace-tm .ace_marker-layer .ace_step {\
background: rgb(252, 255, 0);\
}\
.ace-tm .ace_marker-layer .ace_stack {\
background: rgb(164, 229, 101);\
}\
.ace-tm .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid rgb(192, 192, 192);\
}\
.ace-tm .ace_marker-layer .ace_active-line {\
background: rgba(0, 0, 0, 0.07);\
}\
.ace-tm .ace_gutter-active-line {\
background-color : #dcdcdc;\
}\
.ace-tm .ace_marker-layer .ace_selected-word {\
background: rgb(250, 250, 255);\
border: 1px solid rgb(200, 200, 250);\
}\
.ace-tm .ace_indent-guide {\
background: url(\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAE0lEQVQImWP4////f4bLly//BwAmVgd1/w11/gAAAABJRU5ErkJggg==\") right repeat-y;\
}\
";

var dom = require("../lib/dom");
dom.importCssString(exports.cssText, exports.cssClass);
});

ace.define("ace/line_widgets",["require","exports","module","ace/lib/oop","ace/lib/dom","ace/range"], function(require, exports, module) {
"use strict";

var oop = require("./lib/oop");
var dom = require("./lib/dom");
var Range = require("./range").Range;


function LineWidgets(session) {
    this.session = session;
    this.session.widgetManager = this;
    this.session.getRowLength = this.getRowLength;
    this.session.$getWidgetScreenLength = this.$getWidgetScreenLength;
    this.updateOnChange = this.updateOnChange.bind(this);
    this.renderWidgets = this.renderWidgets.bind(this);
    this.measureWidgets = this.measureWidgets.bind(this);
    this.session._changedWidgets = [];
    this.$onChangeEditor = this.$onChangeEditor.bind(this);
    
    this.session.on("change", this.updateOnChange);
    this.session.on("changeEditor", this.$onChangeEditor);
}

(function() {
    this.getRowLength = function(row) {
        var h;
        if (this.lineWidgets)
            h = this.lineWidgets[row] && this.lineWidgets[row].rowCount || 0;
        else 
            h = 0;
        if (!this.$useWrapMode || !this.$wrapData[row]) {
            return 1 + h;
        } else {
            return this.$wrapData[row].length + 1 + h;
        }
    };

    this.$getWidgetScreenLength = function() {
        var screenRows = 0;
        this.lineWidgets.forEach(function(w){
            if (w && w.rowCount)
                screenRows +=w.rowCount;
        });
        return screenRows;
    };    
    
    this.$onChangeEditor = function(e) {
        this.attach(e.editor);
    };
    
    this.attach = function(editor) {
        if (editor  && editor.widgetManager && editor.widgetManager != this)
            editor.widgetManager.detach();

        if (this.editor == editor)
            return;

        this.detach();
        this.editor = editor;
        
        if (editor) {
            editor.widgetManager = this;
            editor.renderer.on("beforeRender", this.measureWidgets);
            editor.renderer.on("afterRender", this.renderWidgets);
        }
    };
    this.detach = function(e) {
        var editor = this.editor;
        if (!editor)
            return;
        
        this.editor = null;
        editor.widgetManager = null;
        
        editor.renderer.off("beforeRender", this.measureWidgets);
        editor.renderer.off("afterRender", this.renderWidgets);
        var lineWidgets = this.session.lineWidgets;
        lineWidgets && lineWidgets.forEach(function(w) {
            if (w && w.el && w.el.parentNode) {
                w._inDocument = false;
                w.el.parentNode.removeChild(w.el);
            }
        });
    };

    this.updateOnChange = function(e) {
        var lineWidgets = this.session.lineWidgets;
        if (!lineWidgets) return;
            
        var delta = e.data;
        var range = delta.range;
        var startRow = range.start.row;
        var len = range.end.row - startRow;

        if (len === 0) {
        } else if (delta.action == "removeText" || delta.action == "removeLines") {
            var removed = lineWidgets.splice(startRow + 1, len);
            removed.forEach(function(w) {
                w && this.removeLineWidget(w);
            }, this);
            this.$updateRows();
        } else {
            var args = new Array(len);
            args.unshift(startRow, 0);
            lineWidgets.splice.apply(lineWidgets, args);
            this.$updateRows();
        }
    };
    
    this.$updateRows = function() {
        var lineWidgets = this.session.lineWidgets;
        if (!lineWidgets) return;
        var noWidgets = true;
        lineWidgets.forEach(function(w, i) {
            if (w) {
                noWidgets = false;
                w.row = i;
            }
        });
        if (noWidgets)
            this.session.lineWidgets = null;
    };

    this.addLineWidget = function(w) {
        if (!this.session.lineWidgets)
            this.session.lineWidgets = new Array(this.session.getLength());
        
        this.session.lineWidgets[w.row] = w;
        
        var renderer = this.editor.renderer;
        if (w.html && !w.el) {
            w.el = dom.createElement("div");
            w.el.innerHTML = w.html;
        }
        if (w.el) {
            dom.addCssClass(w.el, "ace_lineWidgetContainer");
            w.el.style.position = "absolute";
            w.el.style.zIndex = 5;
            renderer.container.appendChild(w.el);
            w._inDocument = true;
        }
        
        if (!w.coverGutter) {
            w.el.style.zIndex = 3;
        }
        if (!w.pixelHeight) {
            w.pixelHeight = w.el.offsetHeight;
        }
        if (w.rowCount == null)
            w.rowCount = w.pixelHeight / renderer.layerConfig.lineHeight;
        
        this.session._emit("changeFold", {data:{start:{row: w.row}}});
        
        this.$updateRows();
        this.renderWidgets(null, renderer);
        return w;
    };
    
    this.removeLineWidget = function(w) {
        w._inDocument = false;
        if (w.el && w.el.parentNode)
            w.el.parentNode.removeChild(w.el);
        if (w.editor && w.editor.destroy) try {
            w.editor.destroy();
        } catch(e){}
        if (this.session.lineWidgets)
            this.session.lineWidgets[w.row] = undefined;
        this.session._emit("changeFold", {data:{start:{row: w.row}}});
        this.$updateRows();
    };
    
    this.onWidgetChanged = function(w) {
        this.session._changedWidgets.push(w);
        this.editor && this.editor.renderer.updateFull();
    };
    
    this.measureWidgets = function(e, renderer) {
        var changedWidgets = this.session._changedWidgets;
        var config = renderer.layerConfig;
        
        if (!changedWidgets || !changedWidgets.length) return;
        var min = Infinity;
        for (var i = 0; i < changedWidgets.length; i++) {
            var w = changedWidgets[i];
            if (!w._inDocument) {
                w._inDocument = true;
                renderer.container.appendChild(w.el);
            }
            
            w.h = w.el.offsetHeight;
            
            if (!w.fixedWidth) {
                w.w = w.el.offsetWidth;
                w.screenWidth = Math.ceil(w.w / config.characterWidth);
            }
            
            var rowCount = w.h / config.lineHeight;
            if (w.coverLine) {
                rowCount -= this.session.getRowLineCount(w.row);
                if (rowCount < 0)
                    rowCount = 0;
            }
            if (w.rowCount != rowCount) {
                w.rowCount = rowCount;
                if (w.row < min)
                    min = w.row;
            }
        }
        if (min != Infinity) {
            this.session._emit("changeFold", {data:{start:{row: min}}});
            this.session.lineWidgetWidth = null;
        }
        this.session._changedWidgets = [];
    };
    
    this.renderWidgets = function(e, renderer) {
        var config = renderer.layerConfig;
        var lineWidgets = this.session.lineWidgets;
        if (!lineWidgets)
            return;
        var first = Math.min(this.firstRow, config.firstRow);
        var last = Math.max(this.lastRow, config.lastRow, lineWidgets.length);
        
        while (first > 0 && !lineWidgets[first])
            first--;
        
        this.firstRow = config.firstRow;
        this.lastRow = config.lastRow;

        renderer.$cursorLayer.config = config;
        for (var i = first; i <= last; i++) {
            var w = lineWidgets[i];
            if (!w || !w.el) continue;

            if (!w._inDocument) {
                w._inDocument = true;
                renderer.container.appendChild(w.el);
            }
            var top = renderer.$cursorLayer.getPixelPosition({row: i, column:0}, true).top;
            if (!w.coverLine)
                top += config.lineHeight * this.session.getRowLineCount(w.row);
            w.el.style.top = top - config.offset + "px";
            
            var left = w.coverGutter ? 0 : renderer.gutterWidth;
            if (!w.fixedWidth)
                left -= renderer.scrollLeft;
            w.el.style.left = left + "px";

            if (w.fixedWidth) {
                w.el.style.right = renderer.scrollBar.getWidth() + "px";
            } else {
                w.el.style.right = "";
            }
        }
    };
    
}).call(LineWidgets.prototype);


exports.LineWidgets = LineWidgets;

});

ace.define("ace/ext/error_marker",["require","exports","module","ace/line_widgets","ace/lib/dom","ace/range"], function(require, exports, module) {
"use strict";
var LineWidgets = require("../line_widgets").LineWidgets;
var dom = require("../lib/dom");
var Range = require("../range").Range;

function binarySearch(array, needle, comparator) {
    var first = 0;
    var last = array.length - 1;

    while (first <= last) {
        var mid = (first + last) >> 1;
        var c = comparator(needle, array[mid]);
        if (c > 0)
            first = mid + 1;
        else if (c < 0)
            last = mid - 1;
        else
            return mid;
    }
    return -(first + 1);
}

function findAnnotations(session, row, dir) {
    var annotations = session.getAnnotations().sort(Range.comparePoints);
    if (!annotations.length)
        return;
    
    var i = binarySearch(annotations, {row: row, column: -1}, Range.comparePoints);
    if (i < 0)
        i = -i - 1;
    
    if (i >= annotations.length - 1)
        i = dir > 0 ? 0 : annotations.length - 1;
    else if (i === 0 && dir < 0)
        i = annotations.length - 1;
    
    var annotation = annotations[i];
    if (!annotation || !dir)
        return;

    if (annotation.row === row) {
        do {
            annotation = annotations[i += dir];
        } while (annotation && annotation.row === row);
        if (!annotation)
            return annotations.slice();
    }
    
    
    var matched = [];
    row = annotation.row;
    do {
        matched[dir < 0 ? "unshift" : "push"](annotation);
        annotation = annotations[i += dir];
    } while (annotation && annotation.row == row);
    return matched.length && matched;
}

exports.showErrorMarker = function(editor, dir) {
    var session = editor.session;
    if (!session.widgetManager) {
        session.widgetManager = new LineWidgets(session);
        session.widgetManager.attach(editor);
    }
    
    var pos = editor.getCursorPosition();
    var row = pos.row;
    var oldWidget = session.lineWidgets && session.lineWidgets[row];
    if (oldWidget) {
        oldWidget.destroy();
    } else {
        row -= dir;
    }
    var annotations = findAnnotations(session, row, dir);
    var gutterAnno;
    if (annotations) {
        var annotation = annotations[0];
        pos.column = (annotation.pos && typeof annotation.column != "number"
            ? annotation.pos.sc
            : annotation.column) || 0;
        pos.row = annotation.row;
        gutterAnno = editor.renderer.$gutterLayer.$annotations[pos.row];
    } else if (oldWidget) {
        return;
    } else {
        gutterAnno = {
            text: ["Looks good!"],
            className: "ace_ok"
        };
    }
    editor.session.unfold(pos.row);
    editor.selection.moveToPosition(pos);
    
    var w = {
        row: pos.row, 
        fixedWidth: true,
        coverGutter: true,
        el: dom.createElement("div")
    };
    var el = w.el.appendChild(dom.createElement("div"));
    var arrow = w.el.appendChild(dom.createElement("div"));
    arrow.className = "error_widget_arrow " + gutterAnno.className;
    
    var left = editor.renderer.$cursorLayer
        .getPixelPosition(pos).left;
    arrow.style.left = left + editor.renderer.gutterWidth - 5 + "px";
    
    w.el.className = "error_widget_wrapper";
    el.className = "error_widget " + gutterAnno.className;
    el.innerHTML = gutterAnno.text.join("<br>");
    
    el.appendChild(dom.createElement("div"));
    
    var kb = function(_, hashId, keyString) {
        if (hashId === 0 && (keyString === "esc" || keyString === "return")) {
            w.destroy();
            return {command: "null"};
        }
    };
    
    w.destroy = function() {
        if (editor.$mouseHandler.isMousePressed)
            return;
        editor.keyBinding.removeKeyboardHandler(kb);
        session.widgetManager.removeLineWidget(w);
        editor.off("changeSelection", w.destroy);
        editor.off("changeSession", w.destroy);
        editor.off("mouseup", w.destroy);
        editor.off("change", w.destroy);
    };
    
    editor.keyBinding.addKeyboardHandler(kb);
    editor.on("changeSelection", w.destroy);
    editor.on("changeSession", w.destroy);
    editor.on("mouseup", w.destroy);
    editor.on("change", w.destroy);
    
    editor.session.widgetManager.addLineWidget(w);
    
    w.el.onmousedown = editor.focus.bind(editor);
    
    editor.renderer.scrollCursorIntoView(null, 0.5, {bottom: w.el.offsetHeight});
};


dom.importCssString("\
    .error_widget_wrapper {\
        background: inherit;\
        color: inherit;\
        border:none\
    }\
    .error_widget {\
        border-top: solid 2px;\
        border-bottom: solid 2px;\
        margin: 5px 0;\
        padding: 10px 40px;\
        white-space: pre-wrap;\
    }\
    .error_widget.ace_error, .error_widget_arrow.ace_error{\
        border-color: #ff5a5a\
    }\
    .error_widget.ace_warning, .error_widget_arrow.ace_warning{\
        border-color: #F1D817\
    }\
    .error_widget.ace_info, .error_widget_arrow.ace_info{\
        border-color: #5a5a5a\
    }\
    .error_widget.ace_ok, .error_widget_arrow.ace_ok{\
        border-color: #5aaa5a\
    }\
    .error_widget_arrow {\
        position: absolute;\
        border: solid 5px;\
        border-top-color: transparent!important;\
        border-right-color: transparent!important;\
        border-left-color: transparent!important;\
        top: -5px;\
    }\
", "");

});

ace.define("ace/ace",["require","exports","module","ace/lib/fixoldbrowsers","ace/lib/dom","ace/lib/event","ace/editor","ace/edit_session","ace/undomanager","ace/virtual_renderer","ace/worker/worker_client","ace/keyboard/hash_handler","ace/placeholder","ace/multi_select","ace/mode/folding/fold_mode","ace/theme/textmate","ace/ext/error_marker","ace/config"], function(require, exports, module) {
"use strict";

require("./lib/fixoldbrowsers");

var dom = require("./lib/dom");
var event = require("./lib/event");

var Editor = require("./editor").Editor;
var EditSession = require("./edit_session").EditSession;
var UndoManager = require("./undomanager").UndoManager;
var Renderer = require("./virtual_renderer").VirtualRenderer;
require("./worker/worker_client");
require("./keyboard/hash_handler");
require("./placeholder");
require("./multi_select");
require("./mode/folding/fold_mode");
require("./theme/textmate");
require("./ext/error_marker");

exports.config = require("./config");
exports.require = require;
exports.edit = function(el) {
    if (typeof(el) == "string") {
        var _id = el;
        el = document.getElementById(_id);
        if (!el)
            throw new Error("ace.edit can't find div #" + _id);
    }

    if (el && el.env && el.env.editor instanceof Editor)
        return el.env.editor;

    var value = "";
    if (el && /input|textarea/i.test(el.tagName)) {
        var oldNode = el;
        value = oldNode.value;
        el = dom.createElement("pre");
        oldNode.parentNode.replaceChild(el, oldNode);
    } else {
        value = dom.getInnerText(el);
        el.innerHTML = '';
    }

    var doc = exports.createEditSession(value);

    var editor = new Editor(new Renderer(el));
    editor.setSession(doc);

    var env = {
        document: doc,
        editor: editor,
        onResize: editor.resize.bind(editor, null)
    };
    if (oldNode) env.textarea = oldNode;
    event.addListener(window, "resize", env.onResize);
    editor.on("destroy", function() {
        event.removeListener(window, "resize", env.onResize);
        env.editor.container.env = null; // prevent memory leak on old ie
    });
    editor.container.env = editor.env = env;
    return editor;
};
exports.createEditSession = function(text, mode) {
    var doc = new EditSession(text, mode);
    doc.setUndoManager(new UndoManager());
    return doc;
}
exports.EditSession = EditSession;
exports.UndoManager = UndoManager;
});
            (function() {
                ace.require(["ace/ace"], function(a) {
                    a && a.config.init(true);
                    if (!window.ace)
                        window.ace = a;
                    for (var key in a) if (a.hasOwnProperty(key))
                        window.ace[key] = a[key];
                });
            })();
        ;
/*global window, process, global*/

;(function(Global) {

  var globalInterfaceSpec = [
    {action: "installMethods", target: "Array",              sources: ["arr"],    methods: ["from","genN","range","withN"]},
    {action: "installMethods", target: "Array.prototype",    sources: ["arr"],    methods: ["all","any","batchify","clear","clone","collect","compact","delimWith","detect","doAndContinue","each","equals","filterByKey","findAll","first","flatten","forEachShowingProgress","grep","groupBy","groupByKey","histogram","include","inject","intersect","invoke","last","mapAsync", "mapAsyncSeries", "mask","max","min","mutableCompact","nestedDelay","partition","pluck","pushAll","pushAllAt","pushAt","pushIfNotIncluded","reMatches","reject","rejectByKey","remove","removeAt","replaceAt","rotate","shuffle","size","sortBy","sortByKey","sum","swap","toArray","toTuples","union","uniq","uniqBy","without","withoutAll","zip"], alias: [["select", "filter"],["find","detect"]]},
    {action: "installMethods", target: "Date",               sources: ["date"],   methods: [/*"parse"*/]},
    {action: "installMethods", target: "Date.prototype",     sources: ["date"],   methods: ["equals","format","relativeTo"]},
    {action: "installMethods", target: "Function",           sources: ["fun"],    methods: ["fromString"]},
    {action: "installMethods", target: "Function.prototype", sources: ["fun"],    methods: [/*"addProperties",*/"addToObject","argumentNames","asScript","asScriptOf","binds","curry","delay","functionNames","localFunctionNames","getOriginal","getVarMapping","logCalls","logCompletion","logErrors","qualifiedMethodName","setProperty","traceCalls","wrap"]},
    {action: "installMethods", target: "Number",             sources: ["num"],    methods: []},
    {action: "installMethods", target: "Number.prototype",   sources: ["num"],    methods: ["detent","randomSmallerInteger","roundTo","toDegrees","toRadians"]},
    {action: "installMethods", target: "Object",             sources: ["obj"],    methods: ["addScript","clone","deepCopy","extend","inherit","isArray","isBoolean","isElement","isEmpty","isFunction","isNumber","isObject","isRegExp","isString","isUndefined","merge","mergePropertyInHierarchy","values","valuesInPropertyHierarchy"]},
    {action: "installMethods", target: "Object.prototype",   sources: ["obj"],    methods: []},
    {action: "installMethods", target: "String.prototype",   sources: ["string"], methods: ["camelize","capitalize","digitValue","empty","endsWith","hashCode","include","pad","regExpEscape","startsWith","startsWithVowel","succ","times","toArray","toQueryParams","truncate"]},
    {action: "installMethods", target: "Function.prototype", sources: ["class"],  methods: ["create","addMethods","isSubclassOf","superclasses","categoryNameFor","remove"], alias: [["subclass", "create"]]},

    {action: "installObject", target: "Numbers",                source: "num",        methods: ["average","between","convertLength","humanReadableByteSize","median","normalRandom","parseLength","random","sort"]},
    {action: "installObject", target: "Properties",             source: "properties", methods: ["all","allOwnPropertiesOrFunctions","allProperties","any","forEachOwn","hash","nameFor","own","ownValues","values"]},
    {action: "installObject", target: "Strings",                source: "string",     methods: ["camelCaseString","createDataURI","diff","format","formatFromArray","indent","lineIndexComputer","lines","md5","newUUID","nonEmptyLines","pad","paragraphs","peekLeft","peekRight","print","printNested","printTable","printTree","quote","reMatches","removeSurroundingWhitespaces","stringMatch","tableize","tokens","unescapeCharacterEntities","withDecimalPrecision"]},
    {action: "installObject", target: "Objects",                source: "obj",        methods: ["asObject", "equals","inspect","isMutableType","safeToString","shortPrintStringOf","typeStringOf"]},
    {action: "installObject", target: "Functions",              source: "fun",        methods: ["all","compose","composeAsync","createQueue","debounce","debounceNamed","either","extractBody","flip","notYetImplemented","once","own","throttle","throttleNamed","timeToRun","timeToRunN","waitFor","workerWithCallbackQueue","wrapperChain"]},
    {action: "installObject", target: "Grid",                   source: "grid"},
    {action: "installObject", target: "Interval",               source: "interval"},
    {action: "installObject", target: "lively.ArrayProjection", source: "arrayProjection"},
    {action: "installObject", target: "lively.Closure",         source: "Closure"},
    {action: "installObject", target: "lively.Grouping",        source: "Group"},
    {action: "installObject", target: "lively.PropertyPath",    source: "Path"},
    {action: "installObject", target: "lively.Worker",          source: "worker"},
    {action: "installObject", target: "lively.Class",           source: "classHelper"}
  ];

  var isNode = typeof process !== 'undefined'
            && process.versions && process.versions.node;

  var livelyLang = createLivelyLangObject();
  if (isNode) module.exports = livelyLang;
  else {
    livelyLang._prevLivelyGlobal = Global.lively;
    if (!Global.lively) Global.lively = {};
    if (!Global.lively.lang) Global.lively.lang = livelyLang;
    else {
      for (var name in livelyLang)
        Global.lively.lang[name] = livelyLang[name];
    }
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  function createLivelyLangObject() {
    return {
      chain: chain,
      noConflict: noConflict,
      installGlobals: installGlobals,
      uninstallGlobals: uninstallGlobals,
      globalInterfaceSpec: globalInterfaceSpec,
      deprecatedLivelyPatches: deprecatedLivelyPatches
    };
  }

  function chain(object) {
    if (!object) return object;

    var chained;
    if (Array.isArray(object)) return createChain(livelyLang.arr, object);
    if (object.constructor.name === "Date") return createChain(livelyLang.date, object);
    switch (typeof object) {
      case 'string': return createChain(livelyLang.string, object);
      case 'object': return createChain(livelyLang.obj, object);
      case 'function': return createChain(livelyLang.fun, object);
      case 'number': return createChain(livelyLang.num, object);
    }
    throw new Error("Chain for object " + object + " (" + object.constructor.name + ") no supported");
  }

  function createChain(interfaceObj, obj) {
    return Object.keys(interfaceObj).reduce(function(chained, methodName) {
      chained[methodName] = function(/*args*/) {
        var args = Array.prototype.slice.call(arguments),
            result = interfaceObj[methodName].apply(null, [obj].concat(args));
        return chain(result);
      }
      return chained;
    }, {value: function() { return obj; }});
  }

  function noConflict() {
    if (!isNode) {
      var keepLivelyNS = livelyLang._prevLivelyGlobal;
      if (!keepLivelyNS) delete Global.lively
      else delete Global.lively.lang
    }
    return livelyLang;
  }

  function installGlobals() {
    globalInterfaceSpec.forEach(function(ea) {
      if (ea.action === "installMethods") {
        var targetPath = livelyLang.Path(ea.target);
        if (!targetPath.isIn(Global)) targetPath.set(Global, {}, true);
        var sourcePath = livelyLang.Path(ea.sources[0]);
        ea.methods.forEach(function(name) {
          installProperty(
            sourcePath.concat([name]),
            targetPath.concat([name]));
        });
        if (ea.alias)
          ea.alias.forEach(function(mapping) {
            installProperty(
              sourcePath.concat([mapping[1]]),
              targetPath.concat([mapping[0]]));
          });

      } else if (ea.action === "installObject") {
        var targetPath = livelyLang.Path(ea.target);
        var source = livelyLang.Path(ea.source).get(livelyLang);
        targetPath.set(Global, source, true);

      } else throw new Error("Cannot deal with global setup action: " + ea.action);
    });
  }

  function installProperty(sourcePath, targetPath) {
    if (!sourcePath.isIn(livelyLang)) {
      var err = new Error("property not provided by lively.lang: " + sourcePath);
      console.error(err.stack || err);
      throw err;
    }

    var prop = sourcePath.get(livelyLang);
    if (typeof prop === "function" && targetPath.slice(-2, -1).toString() === "prototype") {
      var origFunc = prop;
      prop = function(/*this and args*/) {
        var args = Array.prototype.slice.call(arguments);
        args.unshift(this);
        return origFunc.apply(null, args);
      };
      prop.toString = function() { return origFunc.toString(); };
    }
    targetPath.set(Global, prop, true);
  }

  function uninstallGlobals() {
    globalInterfaceSpec.forEach(function(ea) {
      if (ea.action === "installMethods") {
        var p = livelyLang.Path(ea.target)
        var target = p.get(Global);
        if (!target) return;
        ea.methods.forEach(function(name) { delete target[name]; });
        if (ea.alias)
          ea.alias.forEach(function(mapping) { delete target[mapping[0]]; });

      } else if (ea.action === "installObject") {
        var p = livelyLang.Path(ea.target);
        p.del(Global);

      } else throw new Error("Cannot deal with global setup action: " + ea.action);
    })
  }

  function deprecatedLivelyPatches() {
    livelyLang.installGlobals();

    Global.$A = Array.from;

    // We need to redefine Function.evalJS here b/c the original definition is
    // in a JS 'use strict' block. However, not all function sources we pass in
    // #evalJS from Lively adhere to the strictness rules. To allow those
    // functions for now we define the creator again outside of a strictness block.
    Function.evalJS = livelyLang.fun.evalJS = function(src) { return eval(src); }
    livelyLang.Path.type = livelyLang.PropertyPath;
    livelyLang.Path.prototype.serializeExpr = function () {
      // ignore-in-doc
      return 'lively.PropertyPath(' + livelyLang.obj.inspect(this.parts()) + ')';
    }

    livelyLang.Closure.type = "lively.Closure";
    livelyLang.fun.methodChain = livelyLang.fun.wrapperChain;

    if (typeof JSON !== "undefined") JSON.prettyPrint = function(jso) { return JSON.stringify(jso, null, 2); };

    Global.NativeArrayFunctions = livelyLang.arrNative;
  }

})(typeof window !== "undefined" ? window : global);
;/*global process, require*/

/*
 * A simple node.js-like cross-platform event emitter implementation.
 */
;(function(exports) {
"use strict";

var isNode = typeof process !== 'undefined' && process.versions && process.versions.node;

// A simple node.js-like cross-platform event emitter implementation that can
// be used as a mixin. Emitters support the methods: `on(eventName, handlerFunc)`,
// `once(eventName, handlerFunc)`, `emit(eventName, eventData)`,
// `removeListener(eventName, handlerFunc)`, `removeAllListeners(eventName)`
// Example:
// var emitter = events.makeEmitter({});
// var log = [];
// emitter.on("test", function() { log.push("listener1"); });
// emitter.once("test", function() { log.push("listener2"); });
// emitter.emit("test");
// emitter.emit("test");
// log // => ["listener1","listener2","listener1"]
// emitter.removeAllListeners("test");
// emitter.emit("test");
// log // => is still ["listener1","listener2","listener1"]

var events = exports.events = {

  makeEmitter: isNode ? function(obj) {
    if (obj.on && obj.removeListener) return obj;
    var events = require("events");
    require("util")._extend(obj, events.EventEmitter.prototype);
    events.EventEmitter.call(obj);
    return obj;
  } : function(obj) {
    if (obj.on && obj.removeListener) return obj;

    obj.listeners = {};

    obj.on = function(type, handler) {
      if (!handler) return;
      if (!obj.listeners[type]) obj.listeners[type] = [];
      obj.listeners[type].push(handler);
    }

    obj.once = function(type, handler) {
      if (!handler) return;
      function onceHandler(/*ignore-in-docs args*/) {
        obj.removeListener(type, onceHandler);
        handler.apply(this, arguments);
      }
      obj.on(type, onceHandler);
    }

    obj.removeListener = function(type, handler) {
      if (!obj.listeners[type]) return;
      obj.listeners[type] = obj.listeners[type].filter(function(h) {
        return h !== handler; });
    }

    obj.removeAllListeners = function(type) {
      if (!obj.listeners[type]) return;
      obj.listeners[type] = [];
    }

    obj.emit = function(/*type and args*/) {
      var args = Array.prototype.slice.call(arguments);
      var type = args.shift();
      var handlers = obj.listeners[type];
      if (!handlers || !handlers.length) return;
      handlers.forEach(function(handler) {
        try { handler.apply(null, args) } catch (e) {
          console.error("Error in event handler: %s", e.stack || String(e));
        }
      });
    }

    return obj;
  }
};

})(typeof lively !== 'undefined' && lively.lang ? lively.lang : require('./base'));
;/*global*/

/*
 * Utility functions that help to inspect, enumerate, and create JS objects
 */
;(function(exports) {
"use strict";

// -=-=-=-=-=-=-=-=-
// internal helper
// -=-=-=-=-=-=-=-=-

// serveral methods in lib/object.js are inspired or derived from
// Prototype JavaScript framework, version 1.6.0_rc1
// (c) 2005-2007 Sam Stephenson
// Prototype is freely distributable under the terms of an MIT-style license.
// For details, see the Prototype web site: http://www.prototypejs.org/

function print(object) {
  if (object && obj.isArray(object)) { return '[' + object.map(print) + ']'; }
  if (typeof object !== "string") { return String(object); }
  var result = String(object);
  result = result.replace(/\n/g, '\\n\\\n');
  result = result.replace(/(")/g, '\\$1');
  result = '\"' + result + '\"';
  return result;
}

function argumentNames(func) {
  if (func.superclass) return [];
  var names = func.toString().match(/^[\s\(]*function[^(]*\(([^)]*)\)/)[1].
      replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '').
      replace(/\s+/g, '').split(',');
  return names.length == 1 && !names[0] ? [] : names;
}

function indent(str, indentString, depth) {
  if (!depth || depth <= 0) return str;
  while (depth > 0) { depth--; str = indentString + str; }
  return str;
}

// show-in-doc
var obj = exports.obj = {

  // -=-=-=-=-
  // testing
  // -=-=-=-=-


  isArray: function(obj) { /*show-in-doc*/ return obj && Array.isArray(obj); },

  isElement: function(object) { /*show-in-doc*/ return object && object.nodeType == 1; },

  isFunction: function(object) { /*show-in-doc*/ return object instanceof Function; },

  isBoolean: function(object) { /*show-in-doc*/ return typeof object == "boolean"; },

  isString: function(object) { /*show-in-doc*/ return typeof object == "string"; },

  isNumber: function(object) { /*show-in-doc*/ return typeof object == "number"; },

  isUndefined: function(object) { /*show-in-doc*/ return typeof object == "undefined"; },

  isRegExp: function(object) { /*show-in-doc*/ return object instanceof RegExp; },

  isObject: function(object) { /*show-in-doc*/ return typeof object == "object"; },

  isEmpty: function(object) {
    /*show-in-doc*/
    for (var key in object)
      if (object.hasOwnProperty(key)) return false;
    return true;
  },

  equals: function(a, b) {
    // Is object `a` structurally equivalent to object `b`? Deep comparison.
    if (!a && !b) return true;
    if (!a || !b) return false;
    switch (a.constructor) {
      case String:
      case Date:
      case Boolean:
      case Number: return a == b;
    };
    if (typeof a.isEqualNode === "function") return a.isEqualNode(b);
    if (typeof a.equals === "function") return a.equals(b);
    return cmp(a, b) && cmp(b, a);

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

    function cmp(left, right) {
      for (var name in left) {
        if (typeof left[name] === "function") continue;
         if (!obj.equals(left[name], right[name])) return false;
      }
      return true;
    }
  },

  // -=-=-=-=-=-
  // accessing
  // -=-=-=-=-=-

  keys: Object.keys || function(object) {
    // like Object.keys
    var keys = [];
    for (var property in object) keys.push(property);
    return keys;
  },

  values: function(object) {
    // Example:
    // var obj1 = {x: 22}, obj2 = {x: 23, y: {z: 3}};
    // obj2.__proto__ = obj1;
    // obj.values(obj1) // => [22]
    // obj.values(obj2) // => [23,{z: 3}]
    return object ? Object.keys(object).map(function(k) { return object[k]; }) : [];
  },

  addScript: function (object, funcOrString, optName, optMapping) {
    var func = exports.fun.fromString(funcOrString);
    return exports.fun.asScriptOf(func, object, optName, optMapping);
  },

  // -=-=-=-=-
  // mutation
  // -=-=-=-=-
  extend: function(destination, source) {
    // Add all properties of `source` to `destination`.
    // Example:
    // var dest = {x: 22}, src = {x: 23, y: 24}
    // obj.extend(dest, src);
    // dest // => {x: 23,y: 24}

    var currentCategoryNames = null;
    for (var i = 1; i < arguments.length; i++) {
      if (typeof arguments[i] == "string") {
        var catName = arguments[i];
        if (!destination.categories) destination.categories = {};
        if (!destination.categories[catName]) destination.categories[catName] = [];
        currentCategoryNames = destination.categories[catName];
        continue;
      }

      var source = arguments[i];
      for (var property in source) {
          var getter = source.__lookupGetter__(property),
              setter = source.__lookupSetter__(property);
          if (getter) destination.__defineGetter__(property, getter);
          if (setter) destination.__defineSetter__(property, setter);
          if (getter || setter) continue;
          var sourceObj = source[property];
          destination[property] = sourceObj;
          if (currentCategoryNames) currentCategoryNames.push(property);
          if (typeof sourceObj === "function") {
            if ((!sourceObj.name || (sourceObj.name.length == 0)) && !sourceObj.displayName) sourceObj.displayName = property;
            // remember the module that contains the definition
            if (typeof lively !== 'undefined' && lively.Module && lively.Module.current)
              sourceObj.sourceModule = lively.Module.current();
          }
      }
    }

    return destination;
  },

  // -=-=-=-=-
  // clone
  // -=-=-=-=-

  clone: function(object) {
    // Shallow copy
    return Array.isArray(object) ?
      Array.prototype.slice.call(object) : exports.obj.extend({}, object);
  },

  extract: function(properties, object, mapFunc) {
    return properties.reduce(function(extracted, name) {
      if (object.hasOwnProperty(name)) {
        var val = mapFunc ? mapFunc(name, object[name]) : object[name];
        extracted[name] = val;
      }
      return extracted;
    }, {});
  },

  // -=-=-=-=-=-
  // inspection
  // -=-=-=-=-=-
  inspect: function inspect(object, options, depth) {
    // Prints a human-readable representation of `obj`. The printed
    // representation will be syntactically correct JavaScript but will not
    // necessarily evaluate to a structurally identical object. `inspect` is
    // meant to be used while interactivively exploring JavaScript programs and
    // state.
    //
    // `options` can be {printFunctionSource: BOOLEAN, escapeKeys: BOOLEAN, maxDepth: NUMBER}
    options = options || {};
    depth = depth || 0;
    if (!object) return print(object);

    // print function
    if (typeof object === 'function') {
      return options.printFunctionSource ? String(object) :
        'function' + (object.name ? ' ' + object.name : '')
        + '(' + argumentNames(object).join(',') + ') {/*...*/}';
    }

    // print "primitive"
    switch (object.constructor) {
      case String:
      case Boolean:
      case RegExp:
      case Number: return print(object);
    };

    if (typeof object.serializeExpr === 'function')
      return object.serializeExpr();

    var isArray = object && Array.isArray(object),
        openBr = isArray ? '[' : '{', closeBr = isArray ? ']' : '}';
    if (options.maxDepth && depth >= options.maxDepth)
      return openBr + '/*...*/' + closeBr;

    var printedProps = [];
    if (isArray) {
      printedProps = object.map(function(ea) { return inspect(ea, options, depth); });
    } else {
      printedProps = Object.keys(object)
        .sort(function(a, b) {
          var aIsFunc = typeof object[a] === 'function',
              bIsFunc = typeof object[b] === 'function';
          if (aIsFunc === bIsFunc) {
            if (a < b) return -1;
            if (a > b) return 1;
            return 0;
          }
          return aIsFunc ? 1 : -1;
        })
        .map(function(key, i) {
          if (isArray) inspect(object[key], options, depth + 1);
          var printedVal = inspect(object[key], options, depth + 1);
          return options.escapeKeys ?
            Strings.print(key) : key + ": " + printedVal;
        });
    }

    if (printedProps.length === 0) { return openBr + closeBr; }

    var printedPropsJoined = printedProps.join(','),
        useNewLines = !isArray
          && (!options.minLengthForNewLine
          || printedPropsJoined.length >= options.minLengthForNewLine),
        ind = indent('', options.indent || '  ', depth),
        propIndent = indent('', options.indent || '  ', depth + 1),
        startBreak = useNewLines ? '\n' + propIndent: '',
        endBreak = useNewLines ? '\n' + ind : '';
    if (useNewLines) printedPropsJoined = printedProps.join(',' + startBreak);
    return openBr + startBreak + printedPropsJoined + endBreak + closeBr;
  },

  // -=-=-=-=-
  // merging
  // -=-=-=-=-
  merge: function(objs) {
    // `objs` can be a list of objects. The return value will be a new object,
    // containing all properties of all objects. If the same property exist in
    // multiple objects, the right-most property takes precedence.
    //
    // Like `extend` but will not mutate objects in `objs`.

    // if objs are arrays just concat them
    // if objs are real objs then merge propertdies
    if (arguments.length > 1) {
      return obj.merge(Array.prototype.slice.call(arguments));
    }

    if (Array.isArray(objs[0])) { // test for all?
      return Array.prototype.concat.apply([], objs);
    }

    return objs.reduce(function(merged, ea) {
      for (var name in ea)
        if (ea.hasOwnProperty(name))
            merged[name] = ea[name];
      return merged;
    }, {});
  },

  // -=-=-=-=-=-=-
  // inheritance
  // -=-=-=-=-=-=-
  inherit: function(obj) { return Object.create(obj); },

  valuesInPropertyHierarchy: function(obj, name) {
    // Lookup all properties named name in the proto hierarchy of obj.
    // Example:
    // var a = {foo: 3}, b = Object.create(a), c = Object.create(b);
    // c.foo = 4;
    // obj.valuesInPropertyHierarchy(c, "foo") // => [3,4]
    var result = [], lookupObj = obj;
    while (lookupObj) {
      if (lookupObj.hasOwnProperty(name)) result.unshift(lookupObj[name])
      lookupObj = Object.getPrototypeOf(lookupObj);
    }
    return result;
  },

  mergePropertyInHierarchy: function(obj, propName) {
    // like `merge` but automatically gets all definitions of the value in the
    // prototype chain and merges those.
    // Example:
    // var o1 = {x: {foo: 23}}, o2 = {x: {foo: 24, bar: 15}}, o3 = {x: {baz: "zork"}};
    // o2.__proto__ = o1; o3.__proto__ = o2;
    // obj.mergePropertyInHierarchy(o3, "x");
    // // => {bar: 15, baz: "zork",foo: 24}
    return this.merge(this.valuesInPropertyHierarchy(obj, propName));
  },

  deepCopy: function (object) {
    // Recursively traverses `object` and its properties to create a copy.
    if (!object || typeof object !== "object") return object;
    var result = Array.isArray(object) ? Array(object.length) : {};
    for (var key in object) {
      if (object.hasOwnProperty(key))
        result[key] = obj.deepCopy(object[key]);
    }
    return result;
  },

  // -=-=-=-=-=-=-=-=-
  // stringification
  // -=-=-=-=-=-=-=-=-
  typeStringOf: function(obj) {
    // ignore-in-doc
    if (obj === null) return "null";
    if (typeof obj === "undefined") return "undefined";
    return obj.constructor.name;
  },

  shortPrintStringOf: function(obj) {
    // ignore-in-doc
    // primitive values
    if (!this.isMutableType(obj)) return this.safeToString(obj);

    // constructed objects
    if (obj.constructor.name !== 'Object' && !Array.isArray(obj)) {
      if(obj.constructor.name)
        return obj.constructor.name ?
          obj.constructor.name :
          Object.prototype.toString.call(obj).split(" ")[1].split("]")[0];
    }

    // arrays or plain objects
    var typeString = "";

    function displayTypeAndLength(obj, collectionType, firstBracket, secondBracket) {
      if (obj.constructor.name === collectionType) {
        typeString += firstBracket;
        if (obj.length || Object.keys(obj).length) typeString += "...";
        typeString += secondBracket;
      }
    }
    displayTypeAndLength(obj, "Object", "{", "}");
    displayTypeAndLength(obj, "Array", "[", "]");
    return typeString;
  },

  isMutableType: function(obj) {
    // Is `obj` a value or mutable type?
    var immutableTypes = ["null", "undefined", "Boolean", "Number", "String"];
    return immutableTypes.indexOf(this.typeStringOf(obj)) === -1;
  },

  safeToString: function(obj) {
    // Like `toString` but catches errors.
    try {
      return (obj ? obj.toString() : String(obj)).replace('\n','');
    } catch (e) { return '<error printing object>'; }
  },

  asObject: function(obj) {
    switch (typeof obj) {
      case 'string':
        return new String(obj);
      case 'boolean':
        return new Boolean(obj);
      case 'number':
        return new Number(obj);
      default:
        return obj;
    }
  }
};

// ignore-in-doc
// -=-=-=-=-=-
// properties
// -=-=-=-=-=-
var properties = exports.properties = {

  all: function(object, predicate) {
    // ignore-in-doc
    var a = [];
    for (var name in object) {
      if ((object.__lookupGetter__(name) || typeof object[name] !== 'function')
        && (predicate ? predicate(name, object) : true))
        a.push(name);
    }
    return a;
  },

  allOwnPropertiesOrFunctions: function(obj, predicate) {
    // ignore-in-doc
    return Object.getOwnPropertyNames(obj).reduce(function(result, name) {
      if (predicate ? predicate(obj, name) : true) result.push(name);
      return result;
    }, []);
  },

  own: function(object) {
    // ignore-in-doc
    var a = [];
    for (var name in object) {
      if (object.hasOwnProperty(name) && (object.__lookupGetter__(name)
        || object[name] !== 'function'))
        a.push(name);
    }
    return a;
  },

  forEachOwn: function(object, func, context) {
    // ignore-in-doc
    var result = [];
    for (var name in object) {
      if (!object.hasOwnProperty(name)) continue;
      var value = object[name];
      if (value !== 'function') {
        result.push(func.call(context || this, name, value));
      }
    }
    return result;
  },

  nameFor: function(object, value) {
    // ignore-in-doc
    for (var name in object) {
      if (object[name] === value) return name;
    }
    return undefined;
  },

  values: function(obj) {
    // ignore-in-doc
    var values = [];
    for (var name in obj) values.push(obj[name]);
    return values;
  },

  ownValues: function(obj) {
    // ignore-in-doc
    var values = [];
    for (var name in obj) {
      if (obj.hasOwnProperty(name)) values.push(obj[name]);
    }
    return values;
  },

  any: function(obj, predicate) {
    // ignore-in-doc
    for (var name in obj) {
      if (predicate(obj, name)) return true;
    }
    return false;
  },

  allProperties: function(obj, predicate) {
    // ignore-in-doc
    var result = [];
    for (var name in obj) {
      if (predicate ? predicate(obj, name) : true)
        result.push(name);
    }
    return result;
  },

  hash: function(obj) {
    // ignore-in-doc
    // Using the property names of `obj` to generate a hash value.
    return Object.keys(obj).sort().join('').hashCode();
  }

};

// -=-=-=-=-=-=-=-=-=-=-=-=-=-
// js object path accessor
// -=-=-=-=-=-=-=-=-=-=-=-=-=-

// A `Path` is an objectified chain of property names (kind of a "complex"
// getter and setter). Path objects can make access and writes into deeply nested
// structures more convenient. `Path` provide "safe" get and set operations and
// can be used for debugging by providing a hook that allows users to find out
// when get/set operations happen.
var Path = exports.Path = function Path(p, splitter) {
  if (p instanceof Path) return p;
  if (!(this instanceof Path)) return new Path(p, splitter);
  if (splitter) this.setSplitter(splitter);
  return this.fromPath(p);
}

obj.extend(Path, {
  superclass: Object,
  type: 'Path',
  categories: {}
});

obj.extend(Path.prototype, {

  isPathAccessor: true,
  splitter: '.',

  fromPath: function(path) {
    // ignore-in-doc
    if (obj.isString(path) && path !== '' && path !== this.splitter) {
      this._parts = path.split(this.splitter);
      this._path = path;
    } else if (obj.isArray(path)) {
      this._parts = [].concat(path);
      this._path = path.join(this.splitter);
    } else {
      this._parts = [];
      this._path = '';
    }
    return this;
  },

  setSplitter: function(splitter) {
    // ignore-in-doc
    if (splitter) this.splitter = splitter;
    return this;
  },

  parts: function() { /*key names as array*/ return this._parts; },

  size: function() { /*show-in-doc*/ return this._parts.length; },

  slice: function(n, m) { /*show-in-doc*/ return Path(this.parts().slice(n, m)); },

  normalizePath: function() {
    // ignore-in-doc
    // FIXME: define normalization
    return this._path;
  },

  isRoot: function(obj) { return this._parts.length === 0; },

  isIn: function(obj) {
    // Does the Path resolve to a value when applied to `obj`?
    if (this.isRoot()) return true;
    var parent = this.get(obj, -1);
    return parent && parent.hasOwnProperty(this._parts[this._parts.length-1]);
  },

  equals: function(obj) {
    // Example:
    // var p1 = Path("foo.1.bar.baz"), p2 = Path(["foo", 1, "bar", "baz"]);
    // // Path's can be both created via strings or pre-parsed with keys in a list.
    // p1.equals(p2) // => true
    return obj && obj.isPathAccessor && this.parts().equals(obj.parts());
  },

  isParentPathOf: function(otherPath) {
    // Example:
    // var p1 = Path("foo.1.bar.baz"), p2 = Path("foo.1.bar");
    // p2.isParentPathOf(p1) // => true
    // p1.isParentPathOf(p2) // => false
    otherPath = otherPath && otherPath.isPathAccessor ?
      otherPath : Path(otherPath);
    var parts = this.parts(),
        otherParts = otherPath.parts();
    for(var i = 0; i < parts.length; i ++) {
      if (parts[i] != otherParts[i]) return false
    }
    return true
  },

  relativePathTo: function(otherPath) {
    // Example:
    // var p1 = Path("foo.1.bar.baz"), p2 = Path("foo.1");
    // p2.relativePathTo(p1) // => Path(["bar","baz"])
    // p1.relativePathTo(p2) // => undefined
    otherPath = Path(otherPath);
    return this.isParentPathOf(otherPath) ?
      otherPath.slice(this.size(), otherPath.size()) : undefined;
  },

  del: function(obj) {
    if (this.isRoot()) return false;
    var parent = obj
    for (var i = 0; i < this._parts.length-1; i++) {
      var part = this._parts[i];
      if (parent.hasOwnProperty(part)) {
        parent = parent[part];
      } else return false;
    }
    return delete parent[this._parts[this._parts.length-1]];
  },

  set: function(obj, val, ensure) {
    // Deeply resolve path in `obj` and set the resulting property to `val`. If
    // `ensure` is true, create nested structure in between as necessary.
    // Example:
    // var o1 = {foo: {bar: {baz: 42}}};
    // var path = Path("foo.bar.baz");
    // path.set(o1, 43)
    // o1 // => {foo: {bar: {baz: 43}}}
    // var o2 = {foo: {}};
    // path.set(o2, 43, true)
    // o2 // => {foo: {bar: {baz: 43}}}
    if (this.isRoot()) return undefined;
    var parent = obj
    for (var i = 0; i < this._parts.length-1; i++) {
      var part = this._parts[i];
      if (parent.hasOwnProperty(part) && (typeof parent[part] === "object" || typeof parent[part] === "function")) {
        parent = parent[part];
      } else if (ensure) {
        parent = parent[part] = {};
      } else {
        return undefined;
      }
    }
    return parent[this._parts[this._parts.length-1]] = val;
  },

  get: function(obj, n) {
    // show-in-doc
    var parts = n ? this._parts.slice(0, n) : this._parts;
    return parts.reduce(function(current, pathPart) {
      return current ? current[pathPart] : current; }, obj);
  },

  concat: function(p, splitter) {
    // show-in-doc
    return Path(this.parts().concat(Path(p, splitter).parts()));
  },

  toString: function() { return this.normalizePath(); },

  serializeExpr: function() {
    // ignore-in-doc
    return 'Path(' + Objects.inspect(this.parts()) + ')';
  },

  watch: function(options) {
    // React or be notified on reads or writes to a path in a `target`. Options:
    // ```js
    // {
    //   target: OBJECT,
    //   uninstall: BOOLEAN,
    //   onGet: FUNCTION,
    //   onSet: FUNCTION,
    //   haltWhenChanged: BOOLEAN,
    //   verbose: BOOLEAN
    // }
    // ```
    // Example:
    // // Quite useful for debugging to find out what call-sites change an object.
    // var o = {foo: {bar: 23}};
    // Path("foo.bar").watch({target: o, verbose: true});
    // o.foo.bar = 24; // => You should see: "[object Object].bar changed: 23 -> 24"
    if (!options || this.isRoot()) return;
    var target = options.target,
        parent = this.get(target, -1),
        propName = exports.arr.last(this.parts()),
        newPropName = 'propertyWatcher$' + propName,
        watcherIsInstalled = parent && parent.hasOwnProperty(newPropName),
        uninstall = options.uninstall,
        haltWhenChanged = options.haltWhenChanged,
        showStack = options.showStack,
        getter = parent.__lookupGetter__(propName),
        setter = parent.__lookupSetter__(propName);
    if (!target || !propName || !parent) return;
    if (uninstall) {
      if (!watcherIsInstalled) return;
      delete parent[propName];
      parent[propName] = parent[newPropName];
      delete parent[newPropName];
      var msg = 'Watcher for ' + parent + '.' + propName + ' uninstalled';
      show(msg);
      return;
    }
    if (watcherIsInstalled) {
      var msg = 'Watcher for ' + parent + '.' + propName + ' already installed';
      show(msg);
      return;
    }
    if (getter || setter) {
      var msg = parent + '["' + propName + '"] is a getter/setter, watching not support';
      console.log(msg);
      if (typeof show === "undefined") show(msg);
      return;
    }
    // observe slots, for debugging
    parent[newPropName] = parent[propName];
    parent.__defineSetter__(propName, function(v) {
      var oldValue = parent[newPropName];
      if (options.onSet) options.onSet(v, oldValue);
      var msg = parent + "." + propName + " changed: " + oldValue + " -> " + v;
      if (showStack) msg += '\n' + (typeof lively !== "undefined" ?
                           lively.printStack() : console.trace());
      if (options.verbose) {
        console.log(msg);
        if (typeof show !== 'undefined') show(msg);
      }
      if (haltWhenChanged) debugger;
      return parent[newPropName] = v;
    });
    parent.__defineGetter__(propName, function() {
      if (options.onGet) options.onGet(parent[newPropName]);
      return parent[newPropName];
    });
    var msg = 'Watcher for ' + parent + '.' + propName + ' installed';
    console.log(msg);
    if (typeof show !== 'undefined') show(msg);
  },

  debugFunctionWrapper: function(options) {
    // ignore-in-doc
    // options = {target, [haltWhenChanged, showStack, verbose, uninstall]}
    var target = options.target,
      parent = this.get(target, -1),
      funcName = this.parts().last(),
      uninstall = options.uninstall,
      haltWhenChanged = options.haltWhenChanged === undefined ? true : options.haltWhenChanged,
      showStack = options.showStack,
      func = parent && funcName && parent[funcName],
      debuggerInstalled = func && func.isDebugFunctionWrapper;
    if (!target || !funcName || !func || !parent) return;
    if (uninstall) {
      if (!debuggerInstalled) return;
      parent[funcName] = parent[funcName].debugTargetFunction;
      var msg = 'Uninstalled debugFunctionWrapper for ' + parent + '.' + funcName;
      console.log(msg);
      if (typeof show !== 'undefined') show(msg);
      show(msg);
      return;
    }
    if (debuggerInstalled) {
      var msg = 'debugFunctionWrapper for ' + parent + '.' + funcName + ' already installed';
      console.log(msg);
      if (typeof show !== 'undefined') show(msg);
      return;
    }
    var debugFunc = parent[funcName] = func.wrap(function(proceed) {
      var args = Array.from(arguments);
      if (haltWhenChanged) debugger;
      if (showStack) show(lively.printStack());
      if (options.verbose) show(funcName + ' called');
      return args.shift().apply(parent, args);
    });
    debugFunc.isDebugFunctionWrapper = true;
    debugFunc.debugTargetFunction = func;
    var msg = 'debugFunctionWrapper for ' + parent + '.' + funcName + ' installed';
    console.log(msg);
    if (typeof show !== 'undefined') show(msg);
  }

});

})(typeof lively !== 'undefined' && lively.lang ? lively.lang : require('./base'));
;
/*
 * Methods to make working with arrays more convenient and collection-like
 * abstractions for groups, intervals, grids.
 */
;(function(exports) {
"use strict";


// Pure JS implementations of native Array methods.
var arrNative = exports.arrNative = {

  sort: function(sortFunc) {
    // show-in-doc
    if (!sortFunc) {
      sortFunc = function(x,y) {
        if (x < y) return -1;
        if (x > y) return 1;
        return 0;
      };
    }
    var len = this.length, sorted = [];
    for (var i = 0; i < this.length; i++) {
      var inserted = false;
      for (var j = 0; j < sorted.length; j++) {
        if (1 === sortFunc(sorted[j], this[i])) {
          inserted = true;
          sorted[j+1] = sorted[j];
          sorted[j] = this[i];
          break;
        }
      }
      if (!inserted) sorted.push(this[i]);
    }
    return sorted;
  },

  filter: function(iterator, context) {
    // show-in-doc
    var results = [];
    for (var i = 0; i < this.length; i++) {
      if (!this.hasOwnProperty(i)) continue;
      var value = this[i];
      if (iterator.call(context, value, i)) results.push(value);
    }
    return results;
  },

  forEach: function(iterator, context) {
    // show-in-doc
    for (var i = 0, len = this.length; i < len; i++) {
      iterator.call(context, this[i], i, this); }
  },

  some: function(iterator, context) {
    // show-in-doc
    return this.detect(iterator, context) !== undefined;
  },

  every: function(iterator, context) {
    // show-in-doc
    var result = true;
    for (var i = 0, len = this.length; i < len; i++) {
      result = result && !! iterator.call(context, this[i], i);
      if (!result) break;
    }
    return result;
  },

  map: function(iterator, context) {
    // show-in-doc
    var results = [];
    this.forEach(function(value, index) {
      results.push(iterator.call(context, value, index));
    });
    return results;
  },

  reduce: function(iterator, memo, context) {
    // show-in-doc
    var start = 0;
    if (!arguments.hasOwnProperty(1)) { start = 1; memo = this[0]; }
    for (var i = start; i < this.length; i++)
      memo = iterator.call(context, memo, this[i], i, this);
    return memo;
  },

  reduceRight: function(iterator, memo, context) {
    // show-in-doc
    var start = this.length-1;
    if (!arguments.hasOwnProperty(1)) { start--; memo = this[this.length-1]; }
    for (var i = start; i >= 0; i--)
      memo = iterator.call(context, memo, this[i], i, this);
    return memo;
  }

};

// variety of functions for Arrays
var arr = exports.arr = {

  // -=-=-=-=-=-=-=-
  // array creations
  // -=-=-=-=-=-=-=-

  range: function(begin, end, step) {
    // Examples:
    //   arr.range(0,5) // => [0,1,2,3,4,5]
    //   arr.range(0,10,2) // => [0,2,4,6,8,10]
    step = step || 1
    var result = [];
    for (var i = begin; i <= end; i += step)
      result.push(i);
    return result;
  },

  from: function(iterable) {
    // Makes JS arrays out of array like objects like `arguments` or DOM `childNodes`
    if (!iterable) return [];
    if (Array.isArray(iterable)) return iterable;
    if (iterable.toArray) return iterable.toArray();
    var length = iterable.length,
        results = new Array(length);
    while (length--) results[length] = iterable[length];
    return results;
  },

  withN: function(n, obj) {
    // Example:
    //   arr.withN(3, "Hello") // => ["Hello","Hello","Hello"]
    var result = new Array(n);
    while (n > 0) result[--n] = obj;
    return result;
  },

  genN: function(n, generator) {
    // Number -> Function -> Array
    // Takes a generator function that is called for each `n`.
    // Example:
    //   arr.genN(3, num.random) // => [46,77,95]
    var result = new Array(n);
    while (n > 0) result[--n] = generator(n);
    return result;
  },

  // -=-=-=-=-
  // filtering
  // -=-=-=-=-

  filter: function(array, iterator, context) {
    // [a] -> (a -> Boolean) -> c? -> [a]
    // Calls `iterator` for each element in `array` and returns a subset of it
    // including the elements for which `iterator` returned a truthy value.
    // Like `Array.prototype.filter`.
    return array.filter(iterator, context);
  },

  detect: function(arr, iterator, context) {
    // [a] -> (a -> Boolean) -> c? -> a
    // returns the first occurrence of an element in `arr` for which iterator
    // returns a truthy value
    for (var value, i = 0, len = arr.length; i < len; i++) {
      value = arr[i];
      if (iterator.call(context, value, i)) return value;
    }
    return undefined;
  },

  filterByKey: function(arr, key) {
    // [a] -> String -> [a]
    // Example:
    //   var objects = [{x: 3}, {y: 4}, {x:5}]
    //   arr.filterByKey(objects, "x") // => [{x: 3},{x: 5}]
    return arr.filter(function(ea) { return !!ea[key]; });
  },

  grep: function(arr, filter, context) {
    // [a] -> String|RegExp -> [a]
    // `filter` can be a String or RegExp. Will stringify each element in
    // Example:
    // ["Hello", "World", "Lively", "User"].grep("l") // => ["Hello","World","Lively"]
    if (typeof filter === 'string') filter = new RegExp(filter, 'i');
    return arr.filter(filter.test.bind(filter))
  },

  mask: function(array, mask) {
    // select every element in array for which array's element is truthy
    // Example: [1,2,3].mask([false, true, false]) => [2]
    return array.filter(function(_, i) { return !!mask[i]; });
  },

  reject: function(array, func, context) {
    // show-in-doc
    function iterator(val, i) { return !func.call(context, val, i); }
    return array.filter(iterator);
  },

  rejectByKey: function(array, key) {
    // show-in-doc
    return array.filter(function(ea) { return !ea[key]; });
  },

  without: function(array, elem) {
    // non-mutating
    // Example:
    // arr.without([1,2,3,4,5,6], 3) // => [1,2,4,5,6]
    return array.filter(function(value) { return value !== elem; });
  },

  withoutAll: function(array, otherArr) {
    // non-mutating
    // Example:
    // arr.withoutAll([1,2,3,4,5,6], [3,4]) // => [1,2,5,6]
    return array.filter(function(value) {
      return otherArr.indexOf(value) === -1;
    });
  },

  uniq: function(array, sorted) {
    // non-mutating
    // Removes duplicates from array.
    return array.inject([], function(a, value, index) {
      if (0 === index || (sorted ? a.last() != value : !a.include(value)))
        a.push(value);
      return a;
    });
  },

  uniqBy: function(array, comparator, context) {
    // like `arr.uniq` but with custom equality: `comparator(a,b)` returns
    // BOOL. True if a and be should be regarded equal, false otherwise.
    var result = arr.clone(array);
    for (var i = 0; i < result.length; i++) {
      var item = array[i];
      for (var j = i+1; j < result.length; j++) {
        if (comparator.call(context, item, result[j])) {
          arr.removeAt(result, j); j--;
        }
      }
    }
    return result;
  },

  compact: function(array) {
    // removes falsy values
    // Example:
    // arr.compact([1,2,undefined,4,0]) // => [1,2,4]
    return array.filter(function(ea) { return !!ea; });
  },

  mutableCompact: function(array) {
    // fix gaps that were created with 'delete'
    var i = 0, j = 0, len = array.length;
    while (i < len) {
      if (array.hasOwnProperty(i)) array[j++] = array[i];
      i++;
    }
    while (j++ < len) array.pop();
    return array;
  },

  // -=-=-=-=-
  // iteration
  // -=-=-=-=-

  forEach: function(array, iterator, context) {
    // [a] -> (a -> Undefined) -> c? -> Undefined
    // `iterator` is called on each element in `array` for side effects. Like
    // `Array.prototype.forEach`.
    return array.forEach(iterator, context);
  },

  zip: function(/*arr, arr2, arr3*/) {
    // Takes any number of lists as arguments. Combines them elment-wise.
    // Example:
    // arr.zip([1,2,3], ["a", "b", "c"], ["A", "B"])
    // // => [[1,"a","A"],[2,"b","B"],[3,"c",undefined]]
    var args = arr.from(arguments),
        array = args.shift(),
        iterator = typeof arr.last(args) === 'function' ?
          args.pop() : function(x) { return x; },
        collections = [array].concat(args).map(arr.from);
    return array.map(function(value, index) {
      return iterator(arr.pluck(collections, index), index); });
  },

  flatten: function flatten(array) {
    // Turns a nested collection into a flat one.
    // Example:
    // arr.flatten([1, [2, [3,4,5], [6]], 7,8])
    // // => [1,2,3,4,5,6,7,8]
    return array.reduce(function(flattened, value) {
      return flattened.concat(Array.isArray(value) ?
        flatten(value) : [value]);
    }, []);
  },

  delimWith: function(array, delim) {
    return array.reduce(function(xs, x) {
      if (xs.length > 0) xs.push(delim)
      xs.push(x); return xs;
    }, []);
  },

  // -=-=-=-=-
  // mapping
  // -=-=-=-=-

  map: function(array, iterator, context) {
    // [a] -> (a -> b) -> c? -> [b]
    // Applies `iterator` to each element of `array` and returns a new Array
    // with the results of those calls. Like `Array.prototype.some`.
    return array.map(iterator, context);
  },

  invoke: function(array, method, arg1, arg2, arg3, arg4, arg5, arg6) {
    // Calls `method` on each element in `array`, passing all arguments. Often
    // a handy way to avoid verbose `map` calls.
    // Example: arr.invoke(["hello", "world"], "toUpperCase") // => ["HELLO","WORLD"]
    return array.map(function(ea) {
      return ea[method](arg1, arg2, arg3, arg4, arg5, arg6);
    });
  },

  pluck: function(array, property) {
    // Returns `property` or undefined from each element of array. For quick
    // `map`s and similar to `invoke`.
    // Example: arr.pluck(["hello", "world"], 0) // => ["h","w"]
    return array.map(function(ea) { return ea[property]; });
  },

  // -=-=-=-=-
  // folding
  // -=-=-=-=-

  reduce: function(array, iterator, memo, context) {
    // Array -> Function -> Object? -> Object? -> Object?
    // Applies `iterator` to each element of `array` and returns a new Array
    // with the results of those calls. Like `Array.prototype.some`.
    return array.reduce(iterator, memo, context);
  },

  reduceRight: function(array, iterator, memo, context) {
    // show-in-doc
    return array.reduceRight(iterator, memo, context);
  },

  // -=-=-=-=-
  // testing
  // -=-=-=-=-

  isArray: Array.isArray,

  include: function(array, object) {
    // Example: arr.include([1,2,3], 2) // => true
    return array.indexOf(object) !== -1;
  },

  some: function(array, iterator, context) {
    // [a] -> (a -> Boolean) -> c? -> Boolean
    // Returns true if there is at least one abject in `array` for which
    // `iterator` returns a truthy result. Like `Array.prototype.some`.
    return array.some(iterator, context);
  },

  every: function(array, iterator, context) {
    // [a] -> (a -> Boolean) -> c? -> Boolean
    // Returns true if for all abjects in `array` `iterator` returns a truthy
    // result. Like `Array.prototype.every`.
    return array.every(iterator, context);
  },

  equals: function(array, otherArray) {
    // Returns true iff each element in `array` is equal (`==`) to its
    // corresponding element in `otherArray`
    var len = array.length;
    if (!otherArray || len !== otherArray.length) return false;
    for (var i = 0; i < len; i++) {
      if (array[i] && otherArray[i] && array[i].equals && otherArray[i].equals) {
        if (!array[i].equals(otherArray[i])) {
          return false;
        } else {
          continue;
        }
      }
      if (array[i] != otherArray[i]) return false;
    }
    return true;
  },

  // -=-=-=-=-
  // sorting
  // -=-=-=-=-

  sort: function(array, sortFunc) {
    // [a] -> (a -> Number)? -> [a]
    // Just `Array.prototype.sort`
    return array.sort(sortFunc);
  },

  sortBy: function(array, iterator, context) {
    // Example:
    // arr.sortBy(["Hello", "Lively", "User"], function(ea) {
    //   return ea.charCodeAt(ea.length-1); }) // => ["Hello","User","Lively"]
    return arr.pluck(
      array.map(function(value, index) {
        return {value: value,criteria: iterator.call(context, value, index)};
      }).sort(function(left, right) {
        var a = left.criteria, b = right.criteria;
        return a < b ? -1 : a > b ? 1 : 0;
      }), 'value');
  },

  sortByKey: function(array, key) {
    // Example:
    // lively.lang.arr.sortByKey([{x: 3}, {x: 2}, {x: 8}], "x")
    // // => [{x: 2},{x: 3},{x: 8}]
    return arr.sortBy(array, function(ea) { return ea[key]; });
  },

  reverse: function(array) { return array.reverse(); },

  reversed: function(array) { return arr.clone(array).reverse(); },

  // -=-=-=-=-=-=-=-=-=-=-=-=-
  // RegExp / String matching
  // -=-=-=-=-=-=-=-=-=-=-=-=-

  reMatches: function(arr, re, stringifier) {
    // convert each element in arr into a string and apply re to match it.
    // result might include null items if re did not match (usful for masking)
    // Example:
    //   var morphs = $world.withAllSubmorphsDo(function(x) { return x; ;
    //   morphs.mask(morphs.reMatches(/code/i))
    stringifier = stringifier || String
    return arr.map(function(ea) { return stringifier(ea).match(re); });
  },

  // -=-=-=-=-=-
  // accessors
  // -=-=-=-=-=-

  first: function(array) { return array[0]; },

  last: function(array) { return array[array.length - 1]; },

  // -=-=-=-=-=-=-=-
  // Set operations
  // -=-=-=-=-=-=-=-

  intersect: function(array1, array2) {
    // set-like intersection
    return arr.uniq(array1).filter(function(item) {
      return array2.indexOf(item) > -1; });
  },

  union: function(array1, array2) {
    // set-like union
    var result = arr.clone(array1);
    for (var i = 0; i < array2.length; i++) {
      var item = array2[i];
      if (result.indexOf(item) === -1) result.push(item);
    }
    return result;
  },

  pushAt: function(array, item, index) {
    // inserts `item` at `index`, mutating
    array.splice(index, 0, item);
  },

  removeAt: function(array, index) {
    // inserts item at `index`, mutating
    array.splice(index, 1);
  },

  remove: function(array, item) {
    // removes first occurrence of item in `array`, mutating
    var index = array.indexOf(item);
    if (index >= 0) arr.removeAt(array, index);
    return item;
  },

  pushAll: function(array, items) {
    // appends all `items`, mutating
    for (var i = 0; i < items.length; i++)
      array.push(items[i]);
    return array;
  },

  pushAllAt: function(array, items, idx) {
    // inserts all `items` at `idx`, mutating
    array.splice.apply(array, [idx, 0].concat(items))
  },

  pushIfNotIncluded: function(array, item) {
    // only appends `item` if its not already in `array`, mutating
    if (!arr.include(array, item)) array.push(item);
  },

  replaceAt: function(array, item, index) {
    // mutating
    array.splice(index, 1, item); },

  clear: function(array) {
    // removes all items, mutating
    array.length = 0; return array;
  },

  // -=-=-=-=-=-=-=-=-=-=-=-
  // asynchronous iteration
  // -=-=-=-=-=-=-=-=-=-=-=-
  doAndContinue: function(array, iterator, endFunc, context) {
    // Iterates over array but instead of consecutively calling iterator,
    // iterator gets passed in the invocation for the next iteration step
    // as a function as first parameter. This allows to wait arbitrarily
    // between operation steps, great for managing dependencies between tasks.
    // Related is [`fun.composeAsync`]().
    // Example:
    // arr.doAndContinue([1,2,3,4], function(next, n) {
    //   alert("At " + n);
    //   setTimeout(next, 100);
    // }, function() { alert("Done"); })
    // // If the elements are functions you can leave out the iterator:
    // arr.doAndContinue([
    //   function(next) { alert("At " + 1); next(); },
    //   function(next) { alert("At " + 2); next(); }
    // ], null, function() { alert("Done"); });
    endFunc = endFunc || Functions.Null;
    context = context || (typeof window !== 'undefined' ? window : global);
    iterator = iterator || function(next, ea, idx) { ea.call(context, next, idx); };
    return array.reduceRight(function(nextFunc, ea, idx) {
      return function() { iterator.call(context, nextFunc, ea, idx); }
    }, endFunc)();
  },

  nestedDelay: function(array, iterator, waitSecs, endFunc, context, optSynchronChunks) {
    // Calls `iterator` for every element in `array` and waits between iterator
    // calls `waitSecs`. Eventually `endFunc` is called. When passing a number n
    // as `optSynchronChunks`, only every nth iteration is delayed.
    endFunc = endFunc || function() {};
    return array.clone().reverse().inject(endFunc, function(nextFunc, ea, idx) {
      return function() {
        iterator.call(context || (typeof window !== 'undefined' ? window : global), ea, idx);
        // only really delay every n'th call optionally
        if (optSynchronChunks && (idx % optSynchronChunks !== 0)) {
          nextFunc()
        } else {
          nextFunc.delay(waitSecs);
        }
      }
    })();
  },

  forEachShowingProgress: function(/*array, progressBar, iterator, labelFunc, whenDoneFunc, context or spec*/) {
    // ignore-in-doc
    var args = Array.from(arguments),
      array = args.shift(),
      steps = array.length,
      progressBar, iterator, labelFunc, whenDoneFunc, context,
      progressBarAdded = false;

    // init args
    if (args.length === 1) {
      progressBar = args[0].progressBar;
      iterator = args[0].iterator;
      labelFunc = args[0].labelFunction;
      whenDoneFunc = args[0].whenDone;
      context = args[0].context;
    } else {
      progressBar = args[0];
      iterator = args[1];
      labelFunc = args[2];
      whenDoneFunc = args[3];
      context = args[4];
    }
    if (!context) context = typeof window !== 'undefined' ? window : global;
    if (!labelFunc) labelFunc = function(x) { return x; };

    // init progressbar
    if (!progressBar) {
      progressBarAdded = true;
      var Global = typeof window !== 'undefined' ? window : global;
      var world = Global.lively && lively.morphic && lively.morphic.World.current();
      progressBar = world ? world.addProgressBar() : {
        setValue: function(val) {},
        setLabel: function() {},
        remove: function() {}
      };
    }
    progressBar.setValue(0);

    // nest functions so that the iterator calls the next after a delay
    (array.reduceRight(function(nextFunc, item, idx) {
      return function() {
        try {
          progressBar.setValue(idx / steps);
          if (labelFunc) progressBar.setLabel(labelFunc.call(context, item, idx));
          iterator.call(context, item, idx);
        } catch (e) {
          console.error(
            'Error in forEachShowingProgress at %s (%s)\n%s\n%s',
            idx, item, e, e.stack);
        }
        nextFunc.delay(0);
      };
    }, function() {
      progressBar.setValue(1);
      if (progressBarAdded) (function() { progressBar.remove(); }).delay(0);
      if (whenDoneFunc) whenDoneFunc.call(context);
    }))();

    return array;
  },

  swap: function(array, index1, index2) {
    // mutating
    // Example:
    // var a = [1,2,3,4];
    // arr.swap(a, 3, 1);
    // a // => [1,4,3,2]
    if (index1 < 0) index1 = array.length + index1;
    if (index2 < 0) index2 = array.length + index2;
    var temp = array[index1];
    array[index1] = array[index2];
    array[index2] = temp;
    return array;
  },

  rotate: function(array, times) {
    // non-mutating
    // Example:
    // arr.rotate([1,2,3]) // => [2,3,1]
    times = times || 1;
    return array.slice(times).concat(array.slice(0,times));
  },

  // -=-=-=-=-
  // grouping
  // -=-=-=-=-

  groupBy: function(array, iterator, context) {
    // Applies `iterator` to each element in `array`, and puts the return value
    // into a collection (the group) associated to it's stringified representation
    // (the "hash").
    // See [`Group.prototype`] for available operations on groups.
    // Example:
    // Example 1: Groups characters by how often they occur in a string:
    // var chars = arr.from("Hello World");
    // arr.groupBy(arr.uniq(chars), function(c) {
    //   return arr.count(chars, c); })
    // // => {
    // //   "1": ["H","e"," ","W","r","d"],
    // //   "2": ["o"],
    // //   "3": ["l"]
    // // }
    // // Example 2: Group numbers by a custom qualifier:
    // arr.groupBy([3,4,1,7,4,3,8,4], function(n) {
    //   if (n <= 3) return "small";
    //   if (n <= 7) return "medium";
    //   return "large";
    // });
    // // => {
    // //   large: [8],
    // //   medium: [4,7,4,4],
    // //   small: [3,1,3]
    // // }
    return Group.fromArray(array, iterator, context);
  },

  groupByKey: function(array, key) {
    // var objects = [{x: }]
    // arr.groupBy(arr.uniq(chars), function(c) {
    //   return arr.count(chars, c); })
    // // => {
    // //   "1": ["H","e"," ","W","r","d"],
    // //   "2": ["o"],
    // //   "3": ["l"]
    // // }
    return arr.groupBy(array, function(ea) { return ea[key]; });
  },

  partition: function(array, iterator, context) {
    // Example:
    // var array = [1,2,3,4,5,6];
    // arr.partition(array, function(ea) { return ea > 3; })
    // // => [[1,2,3,4],[5,6]]
    iterator = iterator || function(x) { return x; };
    var trues = [], falses = [];
    array.forEach(function(value, index) {
      (iterator.call(context, value, index) ? trues : falses).push(value);
    });
    return [trues, falses];
  },

  batchify: function(array, constrainedFunc, context) {
    // Takes elements and fits them into subarrays (= batches) so that for
    // each batch constrainedFunc returns true. Note that contrained func
    // should at least produce 1-length batches, otherwise an error is raised
    // Example:
    // // Assume you have list of things that have different sizes and you want to
    // // create sub-arrays of these things, with each sub-array having if possible
    // // less than a `batchMaxSize` of combined things in it:
    // var sizes = [
    //   Math.pow(2, 15), // 32KB
    //   Math.pow(2, 29), // 512MB
    //   Math.pow(2, 29), // 512MB
    //   Math.pow(2, 27), // 128MB
    //   Math.pow(2, 26), // 64MB
    //   Math.pow(2, 26), // 64MB
    //   Math.pow(2, 24), // 16MB
    //   Math.pow(2, 26)] // 64MB
    // var batchMaxSize = Math.pow(2, 28)/*256MB*/;
    // function batchConstrained(batch) {
    //   return batch.length == 1 || batch.sum() < batchMaxSize;
    // }
    // var batches = sizes.batchify(batchConstrained);
    // batches.pluck('length') // => [4,1,1,2]
    // batches.map(arr.sum).map(num.humanReadableByteSize) // => ["208.03MB","512MB","512MB","128MB"]

    return findBatches([], array);

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    function extractBatch(batch, sizes) {
      // Array -> Array -> Array[Array,Array]
      // case 1: no sizes to distribute, we are done
      if (!sizes.length) return [batch, []];
      var first = sizes[0], rest = sizes.slice(1);
      // if batch is empty we have to take at least one
      // if batch and first still fits, add first
      var candidate = batch.concat([first]);
      if (constrainedFunc.call(context, candidate)) return extractBatch(candidate, rest);
      // otherwise leave first out for now
      var batchAndSizes = extractBatch(batch, rest);
      return [batchAndSizes[0], [first].concat(batchAndSizes[1])];
    }

    function findBatches(batches, sizes) {
      if (!sizes.length) return batches;
      var extracted = extractBatch([], sizes);
      if (!extracted[0].length)
        throw new Error('Batchify constrained does not ensure consumption '
                + 'of at least one item per batch!');
      return findBatches(batches.concat([extracted[0]]), extracted[1]);
    }
  },

  toTuples: function(array, tupleLength) {
    // Creates sub-arrays with length `tupleLength`
    // Example:
    // arr.toTuples(["H","e","l","l","o"," ","W","o","r","l","d"], 4)
    // // => [["H","e","l","l"],["o"," ","W","o"],["r","l","d"]]
    tupleLength = tupleLength || 1;
    return arr.range(0,Math.ceil(array.length/tupleLength)-1).map(function(n) {
      return array.slice(n*tupleLength, n*tupleLength+tupleLength);
    }, array);
  },

  // -=-=-=-=-=-
  // randomness
  // -=-=-=-=-=-

  shuffle: function(array) {
    // Ramdomize the order of elements of array. Does not mutate array.
    // Example:
    // arr.shuffle([1,2,3,4,5]) // => [3,1,2,5,4]
    var unusedIndexes = arr.range(0, array.length-1);
    return array.reduce(function(shuffled, ea, i) {
      var shuffledIndex = unusedIndexes.splice(Math.round(Math.random() * (unusedIndexes.length-1)), 1);
      shuffled[shuffledIndex] = ea;
      return shuffled;
    }, Array(array.length));
  },

  // -=-=-=-=-=-=-=-
  // Number related
  // -=-=-=-=-=-=-=-

  max: function(array, iterator, context) {
    // Example:
    //   var array = [{x:3,y:2}, {x:5,y:1}, {x:1,y:5}];
    //   arr.max(array, function(ea) { return ea.x; }) // => {x: 5, y: 1}
    iterator = iterator || function(x) { return x; };
    var result;
    array.reduce(function(max, ea, i) {
      var val = iterator.call(context, ea, i);
      if (typeof val !== "number" || val <= max) return max;
      result = ea; return val;
    }, -Infinity);
    return result;
  },

  min: function(array, iterator, context) {
    // Similar to `arr.max`.
    iterator = iterator || function(x) { return x; };
    return arr.max(array, function(ea, i) {
      return -iterator.call(context, ea, i); });
  },

  sum: function(array) {
    // show-in-doc
    var sum = 0;
    for (var i = 0; i < array.length; i++) sum += array[i];
    return sum;
  },

  count: function(array, item) {
    return array.reduce(function(count, ea) {
      return ea === item ? count + 1 : count; }, 0);
  },

  size: function(array) { return array.length; },

  histogram: function(data, binSpec) {
    // ignore-in-doc
    // Without a `binSpec` argument partition the data
    // var numbers = arr.genN(10, num.random);
    // var numbers = arr.withN(10, "a");
    // => [65,73,34,94,92,31,27,55,95,48]
    // => [[65,73],[34,94],[92,31],[27,55],[95,48]]
    // => [[82,50,16],[25,43,77],[40,64,31],[51,39,13],[17,34,87],[51,33,30]]
    if (typeof binSpec === 'undefined' || typeof binSpec === 'number') {
      var binNumber = binSpec || (function sturge() {
        return Math.ceil(Math.log(data.length) / Math.log(2) + 1);
      })(data);
      var binSize = Math.ceil(Math.round(data.length / binNumber));
      return arr.range(0, binNumber-1).map(function(i) {
        return data.slice(i*binSize, (i+1)*binSize);
      });
    } else if (binSpec instanceof Array) {
      // ignore-in-doc
      // bins specifies n threshold values that will create n-1 bins.
      // Each data value d is placed inside a bin i if:
      // threshold[i] >= d && threshold[i+1] < d
      var thresholds = binSpec;
      return data.reduce(function(bins, d) {
        if (d < thresholds[1]) { bins[0].push(d); return bins; }
        for (var i = 1; i < thresholds.length; i++) {
          if (d >= thresholds[i] && (!thresholds[i+1] || d <= thresholds[i+1])) {
            bins[i].push(d); return bins;
          }
        }
        throw new Error(Strings.format('Histogram creation: Cannot group data %s into thresholds %o', d, thresholds));
      }, arr.range(1,thresholds.length).map(function() { return []; }))
    }
  },

  // -=-=-=-=-
  // Copying
  // -=-=-=-=-

  clone: function(array) {
    // shallow copy
    return [].concat(array);
  },

  // -=-=-=-=-=-
  // conversion
  // -=-=-=-=-=-

  toArray: function(array) { return arr.from(array); },

  // -=-=-=-=-=-
  // DEPRECATED
  // -=-=-=-=-=-

  each: function(arr, iterator, context) {
    return arr.forEach(iterator, context);
  },

  all: function(arr, iterator, context) {
    return arr.every(iterator, context);
  },

  any: function(arr, iterator, context) {
    return arr.some(iterator, context);
  },

  collect: function(arr, iterator, context) {
    return arr.map(iterator, context);
  },

  findAll: function(arr, iterator, context) {
    return arr.filter(iterator, context);
  },

  inject: function(array, memo, iterator, context) {
    if (context) iterator = iterator.bind(context);
    return array.reduce(iterator, memo);
  },

  // asynch methods
  mapAsyncSeries: function(array, iterator, callback) {
    // Apply `iterator` over `array`. Unlike `mapAsync` the invocation of
    // the iterator happens step by step in the order of the items of the array
    // and not concurrently.

    // ignore-in-doc
    // Could simply be:
    // return exports.arr.mapAsync(array, {parallel: 1}, iterator, callback);
    // but the version below is 2x faster

    var result = [], callbackTriggered = false;
    return array.reduceRight(function(nextFunc, ea, idx) {
      if (callbackTriggered) return;
      return function(err, eaResult) {
        if (err) return maybeDone(err);
        if (idx > 0) result.push(eaResult);
        try {
          iterator(ea, idx, exports.fun.once(nextFunc));
        } catch (e) { maybeDone(e); }
      }
    }, function(err, eaResult) {
      result.push(eaResult);
      maybeDone(err, true);
    })();

    function maybeDone(err, finalCall) {
      if (callbackTriggered || (!err && !finalCall)) return;
      callbackTriggered = true;
      try { callback(err, result); } catch (e) {
        console.error("Error in mapAsyncSeries - callback invocation error:\n" + (e.stack || e));
      }
    }
  },

  mapAsync: function(array, options, iterator, callback) {
    // Apply `iterator` over `array`. In each iterator gets a callback as third
    // argument that should be called when the iteration is done. After all
    // iterators have called their callbacks, the main `callback` function is
    // invoked with the result array.
    // Example:
    // lively.lang.arr.mapAsync([1,2,3,4],
    //   function(n, i, next) { setTimeout(function() { next(null, n + i); }, 20); },
    //   function(err, result) { /* result => [1,3,5,7] */ });

    if (typeof options === "function") {
      callback = iterator;
      iterator = options;
      options = null;
    }
    options = options || {};
    if (!options.parallel) options.parallel = array.length-1;

    var results = [], completed = [],
        callbackTriggered = false,
        lastIteratorIndex = 0,
        nActive = 0;

    var iterators = array.map(function(item, i) {
      return function() {
        nActive++;
        try {
          iterator(item, i, exports.fun.once(function(err, result) {
            results[i] = err || result;
            maybeDone(i, err);
          }));
        } catch (e) { maybeDone(i, e); }
      }
    });

    return activate();

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

    function activate() {
      while (nActive < options.parallel && lastIteratorIndex < array.length)
        iterators[lastIteratorIndex++]();
    }

    function maybeDone(idx, err) {
      if (completed.indexOf(idx) > -1) return;
      completed.push(idx);
      nActive--;
      if (callbackTriggered) return;
      if (!err && completed.length < array.length) { activate(); return; }
      callbackTriggered = true;
      try { callback && callback(err, results); } catch (e) {
        console.error("Error in mapAsync - main callback invocation error:\n" + (e.stack || e));
      }
    }
  },
}

// A Grouping is created by arr.groupBy and maps keys to Arrays.
var Group = exports.Group = function Group() {}

Group.by = exports.arr.groupBy;

Group.fromArray = function(array, hashFunc, context) {
  // Example:
  // Group.fromArray([1,2,3,4,5,6], function(n) { return n % 2; })
  // // => {"0": [2,4,6], "1": [1,3,5]}
  var grouping = new Group();
  for (var i = 0, len = array.length; i < len; i++) {
    var hash = hashFunc.call(context, array[i], i);
    if (!grouping[hash]) grouping[hash] = [];
    grouping[hash].push(array[i]);
  }
  return grouping;
}

Group.prototype.toArray = function() {
  // Example:
  // var group = arr.groupBy([1,2,3,4,5], function(n) { return n % 2; })
  // group.toArray(); // => [[2,4],[1,3,5]]
  return this.reduceGroups(function(all, _, group) {
    return all.concat([group]); }, []);
}

Group.prototype.forEach = function(iterator, context) {
  // Iteration for each item in each group, called like `iterator(groupKey, groupItem)`
  var groups = this;
  Object.keys(groups).forEach(function(groupName) {
    groups[groupName].forEach(iterator.bind(context, groupName));
  });
  return groups;
}

Group.prototype.forEachGroup = function(iterator, context) {
  // Iteration for each group, called like `iterator(groupKey, group)`
  var groups = this;
  Object.keys(groups).forEach(function(groupName) {
    iterator.call(context, groupName, groups[groupName]);
  });
  return groups;
}

Group.prototype.map = function(iterator, context) {
  // Map for each item in each group, called like `iterator(groupKey, group)`
  var result = new Group();
  this.forEachGroup(function(groupName, group) {
    result[groupName] = group.map(iterator.bind(context, groupName));
  });
  return result;
}

Group.prototype.mapGroups = function(iterator, context) {
  // Map for each group, called like `iterator(groupKey, group)`
  var result = new Group();
  this.forEachGroup(function(groupName, group) {
    result[groupName] = iterator.call(context, groupName, group);
  });
  return result;
}

Group.prototype.keys = function() {
  // show-in-docs
  return Object.keys(this);
}

Group.prototype.reduceGroups = function(iterator, carryOver, context) {
  // Reduce/fold for each group, called like `iterator(carryOver, groupKey, group)`
  this.forEachGroup(function(groupName, group) {
    carryOver = iterator.call(context, carryOver, groupName, group); });
  return carryOver;
}

Group.prototype.count = function() {
  // counts the elements of each group
  return this.reduceGroups(function(groupCount, groupName, group) {
    groupCount[groupName] = group.length;
    return groupCount;
  }, {});
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

// A grid is just a two-dimaensional array, representing a table-like data
var grid = exports.grid = {

  create: function(rows, columns, initialObj) {
    // Example:
    // grid.create(3, 2, "empty")
    // // => [["empty","empty"],
    // //     ["empty","empty"],
    // //     ["empty","empty"]]
    var result = new Array(rows);
    while (rows > 0) result[--rows] = arr.withN(columns, initialObj);
    return result;
  },

  mapCreate: function(rows, cols, func, context) {
    // like `grid.create` but takes generator function for cells
    var result = new Array(rows);
    for (var i = 0; i < rows; i++) {
      result[i] = new Array(cols);
      for (var j = 0; j < cols; j ++) {
        result[i][j] = func.call(context || this, i, j);
      }
    }
    return result;
  },

  forEach: function(grid, func, context) {
    // iterate, `func` is called as `func(cellValue, i, j)`
    grid.forEach(function(row, i) {
      row.forEach(function(val, j) {
        func.call(context || this, val, i, j);
      });
    })
  },

  map: function(grid, func, context) {
    // map, `func` is called as `func(cellValue, i, j)`
    var result = new Array(grid.length);
    grid.forEach(function(row, i) {
      result[i] = new Array(row.length);
      row.forEach(function(val, j) {
        result[i][j] = func.call(context || this, val, i, j);
      });
    });
    return result;
  },

  toObjects: function(grid) {
    // The first row of the grid defines the propNames
    // for each following row create a new object with those porperties
    // mapped to the cells of the row as values
    // Example:
    // grid.toObjects([['a', 'b'],[1,2],[3,4]])
    // // => [{a:1,b:2},{a:3,b:4}]
    var props = grid[0], objects = new Array(grid.length-1);
    for (var i = 1; i < grid.length; i++) {
      var obj = objects[i-1] = {};
      for (var j = 0; j < props.length; j++) obj[props[j]] = grid[i][j];
    }
    return objects;
  },

  tableFromObjects: function(objects, valueForUndefined) {
    // Reverse operation to `grid.toObjects`. Useful for example to convert objectified
    // SQL result sets into tables that can be printed via Strings.printTable.
    // Objects are key/values like [{x:1,y:2},{x:3},{z:4}]. Keys are interpreted as
    // column names and objects as rows.
    // Example:
    // grid.tableFromObjects([{x:1,y:2},{x:3},{z:4}])
    // // => [["x","y","z"],
    // //    [1,2,null],
    // //    [3,null,null],
    // //    [null,null,4]]

    if (!Array.isArray(objects)) objects = [objects];
    var table = [[]], columns = table[0],
      rows = objects.reduce(function(rows, ea) {
        return rows.concat([Object.keys(ea).reduce(function(row, col) {
          var colIdx = columns.indexOf(col);
          if (colIdx === -1) { colIdx = columns.length; columns.push(col); }
          row[colIdx] = ea[col];
          return row;
        }, [])]);
      }, []);
    valueForUndefined = arguments.length === 1 ? null : valueForUndefined;
    rows.forEach(function(row) {
      // fill cells with no value with null
      for (var i = 0; i < columns.length; i++)
        if (!row[i]) row[i] = valueForUndefined;
    });
    return table.concat(rows);
  },

  benchmark: function() {
    // ignore-in-doc
    var results = [], t;

    var g = grid.create(1000, 200, 1),
        addNum = 0;
        t = lively.lang.fun.timeToRunN(function() {
    grid.forEach(g, function(n) { addNum += n; }) }, 10);
    results.push(exports.string.format('grid.forEach: %ims', t));

    var mapResult;
    t  = Functions.timeToRunN(function() {
      mapResult = grid.map(grid, function(n, i, j) {
        return i+j + Math.round(Math.random() * 100); });
    }, 10);
    results.push(exports.string.format('grid.map: %ims', t));

    var mapResult2 = grid.create(1000, 2000);
    t  = Functions.timeToRunN(function() {
      mapResult2 = new Array(1000);
      for (var i = 0; i < 1000; i++) mapResult2[i] = new Array(2000);
      grid.forEach(g, function(n, i, j) { mapResult2[i][j] = i+j + Math.round(Math.random() * 100); });
    }, 10);

    results.push('grid.map with forEach: ' + t + 'ms');

    results.push('--= 2012-09-22 =--\n'
          + "grid.forEach: 14.9ms\n"
          + "grid.map: 19.8ms\n"
          + "grid.map with forEach: 38.7ms\n");
    return results.join('\n');
  }
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

// Intervals are arrays whose first two elements are numbers and the
// first element should be less or equal the second element, see
// [`interval.isInterval`](). This abstraction is useful when working with text
// ranges in rich text, for example.
var interval = exports.interval = {

  isInterval: function(object) {
    // Example:
    // interval.isInterval([1,12]) // => true
    // interval.isInterval([1,12, {property: 23}]) // => true
    // interval.isInterval([1]) // => false
    // interval.isInterval([12, 1]) // => false
    return Array.isArray(object)
        && object.length >= 2
        && object[0] <= object[1];
  },

  sort: function(intervals) {
    // Sorts intervals according to rules defined in [`interval.compare`]().
    return intervals.sort(interval.compare);
  },

  compare: function(a, b) {
    // How [`interval.sort`]() compares.
    // We assume that `a[0] <= a[1] and b[0] <= b[1]` according to `isInterval`
    // ```
    // -3: a < b and non-overlapping, e.g [1,2] and [3,4]
    // -2: a < b and intervals border at each other, e.g [1,3] and [3,4]
    // -1: a < b and overlapping, e.g, [1,3] and [2,4] or [1,3] and [1,4]
    //  0: a = b, e.g. [1,2] and [1,2]
    //  1: a > b and overlapping, e.g. [2,4] and [1,3]
    //  2: a > b and share border, e.g [1,4] and [0,1]
    //  3: a > b and non-overlapping, e.g [2,4] and [0,1]
    // ```
    if (a[0] < b[0]) { // -3 || -2 || -1
      if (a[1] < b[0]) return -3;
      if (a[1] === b[0]) return -2;
      return -1;
    }
    if (a[0] === b[0]) { // -1 || 0 || 1
      if (a[1] === b[1]) return 0;
      return a[1] < b[1] ? -1 : 1;
    }
    // we know a[0] > b[0], 1 || 2 || 3
    return -1 * interval.compare(b, a);
  },

  coalesce: function(interval1, interval2, optMergeCallback) {
    // Turns two interval into one iff compare(interval1, interval2) ∈ [-2,
    // -1,0,1, 2] (see [`inerval.compare`]()).
    // Otherwise returns null. Optionally uses merge function.
    // Examples:
    //   interval.coalesce([1,4], [5,7]) // => null
    //   interval.coalesce([1,2], [1,2]) // => [1,2]
    //   interval.coalesce([1,4], [3,6]) // => [1,6]
    //   interval.coalesce([3,6], [4,5]) // => [3,6]
    var cmpResult = this.compare(interval1, interval2);
    switch (cmpResult) {
      case -3:
      case  3: return null;
      case  0:
        optMergeCallback && optMergeCallback(interval1, interval2, interval1);
        return interval1;
      case  2:
      case  1: var temp = interval1; interval1 = interval2; interval2 = temp; // swap
      case -2:
      case -1:
        var coalesced = [interval1[0], Math.max(interval1[1], interval2[1])];
        optMergeCallback && optMergeCallback(interval1, interval2, coalesced);
        return coalesced;
      default: throw new Error("Interval compare failed");
    }
  },

  coalesceOverlapping: function(intervals, mergeFunc) {
    // Like `coalesce` but accepts an array of intervals.
    // Example:
    //   interval.coalesceOverlapping([[9,10], [1,8], [3, 7], [15, 20], [14, 21]])
    //   // => [[1,8],[9,10],[14,21]]
    var condensed = [], len = intervals.length;
    while (len > 0) {
      var ival = intervals.shift(); len--;
      for (var i = 0; i < len; i++) {
        var otherInterval = intervals[i],
            coalesced = interval.coalesce(ival, otherInterval, mergeFunc);
        if (coalesced) {
          ival = coalesced;
          intervals.splice(i, 1);
          len--; i--;
        }
      }
      condensed.push(ival);
    }
    return this.sort(condensed);
  },

  mergeOverlapping: function(intervalsA, intervalsB, mergeFunc) {
    var result = [];
    while (intervalsA.length > 0) {
      var intervalA = intervalsA.shift();

      var toMerge = intervalsB.map(function(intervalB) {
        var cmp = interval.compare(intervalA, intervalB);
        return cmp === -1 || cmp === 0 || cmp === 1;
      });

      result.push(mergeFunc(intervalA, toMerge[0]))

      result.push(intervalA);

    }
    return result;
  },

  intervalsInRangeDo: function(start, end, intervals, iterator, mergeFunc, context) {
      // Merges and iterates through sorted intervals. Will "fill up"
      // intervals. This is currently used for computing text chunks in
      // lively.morphic.TextCore.
      // Example:
      // interval.intervalsInRangeDo(
      //   2, 10, [[0, 1], [5,8], [2,4]],
      //   function(i, isNew) { i.push(isNew); return i; })
      // // => [[2,4,false],[4,5,true],[5,8,false],[8,10,true]]

    context = context || (typeof window !== 'undefined' ? window : global);
    // need to be sorted for the algorithm below
    intervals = this.sort(intervals);
    var free = [], nextInterval, collected = [];
    // merged intervals are already sorted, simply "negate" the interval array;
    while ((nextInterval = intervals.shift())) {
      if (nextInterval[1] < start) continue;
      if (nextInterval[0] < start) {
        nextInterval = Array.prototype.slice.call(nextInterval);
        nextInterval[0] = start;
      };
      var nextStart = end < nextInterval[0] ? end : nextInterval[0];
      if (start < nextStart) {
        collected.push(iterator.call(context, [start, nextStart], true));
      };
      if (end < nextInterval[1]) {
        nextInterval = Array.prototype.slice.call(nextInterval);
        nextInterval[1] = end;
      }
      // special case, the newly constructed interval has length 0,
      // happens when intervals contains doubles at the start
      if (nextInterval[0] === nextInterval[1]) {
        var prevInterval;
        if (mergeFunc && (prevInterval = collected.slice(-1)[0])) {
          // arguments: a, b, merged, like in the callback of #merge
          mergeFunc.call(context, prevInterval, nextInterval, prevInterval);
        }
      } else {
        collected.push(iterator.call(context, nextInterval, false));
      }
      start = nextInterval[1];
      if (start >= end) break;
    }
    if (start < end) collected.push(iterator.call(context, [start, end], true));
    return collected;
  },

  intervalsInbetween: function(start, end, intervals) {
    // Computes "free" intervals between the intervals given in range start - end
    // currently used for computing text chunks in lively.morphic.TextCore
    // Example:
    // interval.intervalsInbetween(0, 10,[[1,4], [5,8]])
    // // => [[0,1],[4,5],[8,10]]
    return interval
      .intervalsInRangeDo(start, end,
        interval.coalesceOverlapping(Array.prototype.slice.call(intervals)),
        function(interval, isNew) { return isNew ? interval : null })
      .filter(function(ea) { return !!ea });
  },

  mapToMatchingIndexes:  function(intervals, intervalsToFind) {
    // Returns an array of indexes of the items in intervals that match
    // items in `intervalsToFind`.
    // Note: We expect intervals and intervals to be sorted according to [`interval.compare`]()!
    // This is the optimized version of:
    // ```
    // return intervalsToFind.collect(function findOne(toFind) {
    //    var startIdx, endIdx;
    //    var start = intervals.detect(function(ea, i) {
    //       startIdx = i; return ea[0] === toFind[0]; });
    //    if (start === undefined) return [];
    //    var end = intervals.detect(function(ea, i) {
    //       endIdx = i; return ea[1] === toFind[1]; });
    //    if (end === undefined) return [];
    //    return Array.range(startIdx, endIdx);
    // });
    // ```

    var startIntervalIndex = 0, endIntervalIndex, currentInterval;
    return intervalsToFind.map(function(toFind) {
      while ((currentInterval = intervals[startIntervalIndex])) {
        if (currentInterval[0] < toFind[0]) { startIntervalIndex++; continue };
        break;
      }
      if (currentInterval && currentInterval[0] === toFind[0]) {
        endIntervalIndex = startIntervalIndex;
        while ((currentInterval = intervals[endIntervalIndex])) {
          if (currentInterval[1] < toFind[1]) { endIntervalIndex++; continue };
          break;
        }
        if (currentInterval && currentInterval[1] === toFind[1]) {
          return arr.range(startIntervalIndex, endIntervalIndex);
        }
      }
      return [];
    });
  },

  benchmark: function() {
    // ignore-in-doc
    // Used for developing the code above. If you change the code, please
    // make sure that you don't worsen the performance!
    // See also lively.lang.tests.ExtensionTests.IntervallTest
    function benchmarkFunc(name, args, n) {
      return Strings.format(
        '%s: %sms',
        name,
        Functions.timeToRunN(function() { interval[name].apply(interval, args, 100000) }, n));
    }
    return [
      "Friday, 20. July 2012:",
      "coalesceOverlapping: 0.0003ms",
      "intervalsInbetween: 0.002ms",
      "mapToMatchingIndexes: 0.02ms",
      'vs.\n' + new Date() + ":",
      benchmarkFunc("coalesceOverlapping", [[[9,10], [1,8], [3, 7], [15, 20], [14, 21]]], 100000),
      benchmarkFunc("intervalsInbetween", [0, 10, [[8, 10], [0, 2], [3, 5]]], 100000),
      benchmarkFunc("mapToMatchingIndexes", [Array.range(0, 1000).collect(function(n) { return [n, n+1] }), [[4,8], [500,504], [900,1004]]], 1000)
    ].join('\n');
  }
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

// Accessor to sub-ranges of arrays. This is used, for example, for rendering
// large lists or tables in which only a part of the items should be used for
// processing or rendering. An array projection provides convenient access and
// can apply operations to sub-ranges.
var arrayProjection = exports.arrayProjection = {

  create: function(array, length, optStartIndex) {
    // Example:
    // arrayProjection.create([1,2,3,4,5,6,7,8,9], 4, 1)
    // // => { array: [/*...*/], from: 1, to: 5 }
    var startIndex = optStartIndex || 0
    if (startIndex + length > array.length)
      startIndex -= startIndex + length - array.length;
    return {array: array, from: startIndex, to: startIndex+length}
  },

  toArray: function(projection) {
    // show-in-doc
    return projection.array.slice(projection.from, projection.to);
  },

  originalToProjectedIndex: function(projection, index) {
    // Maps index from original Array to projection.
    // Example:
    //   var proj = arrayProjection.create([1,2,3,4,5,6,7,8,9], 4, 3);
    //   arrayProjection.originalToProjectedIndex(proj, 1) // => null
    //   arrayProjection.originalToProjectedIndex(proj, 3) // => 0
    //   arrayProjection.originalToProjectedIndex(proj, 5) // => 2
    if (index < projection.from || index >= projection.to) return null;
    return index - projection.from;
  },

  projectedToOriginalIndex: function(projection, index) {
    // Inverse to `originalToProjectedIndex`.
    // Example:
    //   var proj = arrayProjection.create([1,2,3,4,5,6,7,8,9], 4, 3);
    //   arrayProjection.projectedToOriginalIndex(proj, 1) // => 4
    if (index < 0  || index > projection.to - projection.from) return null;
    return projection.from + index;
  },

  transformToIncludeIndex: function(projection, index) {
    // Computes how the projection needs to shift minimally (think "scroll"
    // down or up) so that index becomes "visible" in projection.
    // Example:
    // var proj = arrayProjection.create([1,2,3,4,5,6,7,8,9], 4, 3);
    // arrayProjection.transformToIncludeIndex(proj, 1)
    // // => { array: [/*...*/], from: 1, to: 5 }
    if (!(index in projection.array)) return null;
    var delta = 0;
    if (index < projection.from) delta = -projection.from+index;
    if (index >= projection.to) delta = index-projection.to+1;
    if (delta === 0) return projection;
    return arrayProjection.create(
      projection.array,
      projection.to-projection.from,
      projection.from+delta);
  }
}

})(typeof lively !== 'undefined' && lively.lang ? lively.lang : require('./base'));
;
/*
 * Methods for traversing and transforming tree structures.
 */
;(function(exports) {
"use strict";

var tree = exports.tree = {

  detect: function(treeNode, testFunc, childGetter) {
    // Traverses a `treeNode` recursively and returns the first node for which
    // `testFunc` returns true. `childGetter` is a function to retrieve the
    // children from a node.
    if (testFunc(treeNode)) return treeNode;
    var found;
    exports.arr.detect(childGetter(treeNode) || [],
      function(ea) { return found = tree.detect(ea, testFunc, childGetter); });
    return found;
  },

  filter: function(treeNode, testFunc, childGetter) {
    // Traverses a `treeNode` recursively and returns all nodes for which
    // `testFunc` returns true. `childGetter` is a function to retrieve the
    // children from a node.
    var result = [];
    if (testFunc(treeNode)) result.push(treeNode);
    return result.concat(
      exports.arr.flatten((childGetter(treeNode) || []).map(function(n) {
        return tree.filter(n, testFunc, childGetter); })));
  },

  map: function(treeNode, mapFunc, childGetter) {
    // Traverses a `treeNode` recursively and call `mapFunc` on each node. The
    // return values of all mapFunc calls is the result. `childGetter` is a
    // function to retrieve the children from a node.
    var result = [mapFunc(treeNode)];
    return result.concat(
      exports.arr.flatten((childGetter(treeNode) || []).map(function(n) {
        return tree.map(n, mapFunc, childGetter); })));
  }

}

})(typeof lively !== 'undefined' && lively.lang ? lively.lang : require('./base'));
;/*global clearTimeout, setTimeout*/

/*
 * Abstractions around first class functions like augmenting and inspecting
 * functions as well as to control function calls like dealing with asynchronous
 * control flows.
 */

;(function(exports) {
"use strict";

// show-in-doc
var fun = exports.fun = {

  // -=-=-=-=-=-=-=-=-
  // static functions
  // -=-=-=-=-=-=-=-=-

  get Empty() { /*`function() {}`*/ return function() {}; },
  get K() { /*`function(arg) { return arg; }`*/ return function(arg) { return arg; }; },
  get Null() { /*`function() { return null; }`*/ return function() { return null; }; },
  get False() { /*`function() { return false; }`*/ return function() { return false; }; },
  get True() { /*`function() { return true; }`*/ return function() { return true; }; },
  get notYetImplemented() { return function() { throw new Error('Not yet implemented'); }; },

  // -=-=-=-=-=-
  // accessing
  // -=-=-=-=-=-
  all: function(object) {
    // Returns all property names of `object` that reference a function.
    // Example:
    // var obj = {foo: 23, bar: function() { return 42; }};
    // fun.all(obj) // => ["bar"]
    var a = [];
    for (var name in object) {
      if (!object.__lookupGetter__(name)
       && typeof object[name] === 'function') a.push(name);
    }
    return a;
  },

  own: function(object) {
    // Returns all local (non-prototype) property names of `object` that
    // reference a function.
    // Example:
    // var obj1 = {foo: 23, bar: function() { return 42; }};
    // var obj2 = {baz: function() { return 43; }};
    // obj2.__proto__ = obj1
    // fun.own(obj2) // => ["baz"]
    // /*vs.*/ fun.all(obj2) // => ["baz","bar"]
    var a = [];
    for (var name in object) {
      if (!object.__lookupGetter__(name)
       && object.hasOwnProperty(name)
       && typeof object[name] === 'function') a.push(name);
    }
    return a;
  },

  // -=-=-=-=-=-
  // inspection
  // -=-=-=-=-=-

  argumentNames: function(f) {
    // Example:
    // fun.argumentNames(function(arg1, arg2) {}) // => ["arg1","arg2"]
    // fun.argumentNames(function(/*var args*/) {}) // => []
    if (f.superclass) return []; // it's a class...
    var headerMatch = f.toString().match(/^[\s\(]*function[^(]*\(([^)]*)\)/);
    if (!headerMatch || !headerMatch[1]) return [];
    var names = headerMatch[1]
      .replace(/\/\/.*?[\r\n]|\/\*(?:.|[\r\n])*?\*\//g, '')
      .replace(/\s+/g, '').split(',');
    return names.length == 1 && !names[0] ? [] : names;
  },

  qualifiedMethodName: function(f) {
    // ignore-in-doc
    var objString = "";
    if (f.declaredClass) {
      objString += f.declaredClass + '>>';
    } else if (f.declaredObject) {
      objString += f.declaredObject + '.';
    }
    return objString + (f.methodName || f.displayNameName || f.name || "anonymous");
  },

  extractBody: function(func) {
    // Returns the body of func as string, removing outer function code and
    // superflous indent. Useful when you have to stringify code but not want
    // to construct strings by hand.
    // Example:
    // fun.extractBody(function(arg) {
    //   var x = 34;
    //   alert(2 + arg);
    // }) => "var x = 34;\nalert(2 + arg);"
    var codeString = String(func)
        .replace(/^function[^\{]+\{\s*/, '')
        .replace(/\}$/, '')
        .trim();
    var indent = codeString.split(/\n|\r/)
        .map(function(line) { var m = line.match(/^\s*/); return m && m[0]; })
        .filter(function(ea) { return !!ea; })
        .reduce(function(indent, ea) { return ea.length < indent.length ? ea : indent; });
    return codeString.replace(new RegExp("^" + indent, 'gm'), '');
  },

  // -=-=-=-
  // timing
  // -=-=-=-

  timeToRun: function(func) {
    // returns synchronous runtime of calling `func` in ms
    // Example:
    // fun.timeToRun(function() { new WebResource("http://google.de").beSync().get() });
    // // => 278 (or something else...)
    var startTime = Date.now();
    func();
    return Date.now() - startTime;
  },

  timeToRunN: function(func, n) {
    // Like `timeToRun` but calls function `n` times instead of once. Returns
    // the average runtime of a call in ms.
    var startTime = Date.now();
    for (var i = 0; i < n; i++) func();
    return (Date.now() - startTime) / n;
  },

  delay: function(func, timeout/*, arg1...argN*/) {
    // Delays calling `func` for `timeout` seconds(!).
    // Example:
    // (function() { alert("Run in the future!"); }).delay(1);
    var args = Array.prototype.slice.call(arguments),
        __method = args.shift(),
        timeout = args.shift() * 1000;
    return setTimeout(function delayed() {
      return __method.apply(__method, args);
    }, timeout);
  },

  // these last two methods are Underscore.js 1.3.3 and are slightly adapted
  // Underscore.js license:
  // (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
  // Underscore is distributed under the MIT license.

  throttle: function(func, wait) {
    // Exec func at most once every wait ms even when called more often
    // useful to calm down eagerly running updaters and such.
    // Example:
    // var i = 0;
    // var throttled = fun.throttle(function() { alert(++i + '-' + Date.now()) }, 500);
    // Array.range(0,100).forEach(function(n) { throttled() });
    var context, args, timeout, throttling, more, result,
        whenDone = fun.debounce(wait, function() { more = throttling = false; });
    return function() {
      context = this; args = arguments;
      var later = function() {
        timeout = null;
        if (more) func.apply(context, args);
        whenDone();
      };
      if (!timeout) timeout = setTimeout(later, wait);
      if (throttling) {
        more = true;
      } else {
        result = func.apply(context, args);
      }
      whenDone();
      throttling = true;
      return result;
    };
  },

  debounce: function(wait, func, immediate) {
    // Call `func` after `wait` milliseconds elapsed since the last invocation.
    // Unlike `throttle` an invocation will restart the wait period. This is
    // useful if you have a stream of events that you want to wait for to finish
    // and run a subsequent function afterwards. When you pass arguments to the
    // debounced functions then the arguments from the last call will be use for
    // the invocation.
    // 
    // With `immediate` set to true, immediately call `func` but when called again during `wait` before
    // wait ms are done nothing happens. E.g. to not exec a user invoked
    // action twice accidentally.
    // Example:
    // var start = Date.now();
    // var f = fun.debounce(200, function(arg1) {
    //   alert("running after " + (Date.now()-start) + "ms with arg " + arg1);
    // });
    // f("call1");
    // fun.delay(f.curry("call2"), 0.1);
    // fun.delay(f.curry("call3"), 0.15);
    // // => Will eventually output: "running after 352ms with arg call3"
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      if (immediate && !timeout) func.apply(context, args);
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  throttleNamed: function(name, wait, func) {
    // Like `throttle` but remembers the throttled function once created and
    // repeated calls to `throttleNamed` with the identical name will use the same
    // throttled function. This allows to throttle functions in a central place
    // that might be called various times in different contexts without having to
    // manually store the throttled function.
    var store = fun._throttledByName || (fun._throttledByName = {});
    if (store[name]) return store[name];
    function throttleNamedWrapper() {
      // cleaning up
      fun.debounceNamed(name, wait, function() { delete store[name]; })();
      func.apply(this, arguments);
    }
    return store[name] = fun.throttle(throttleNamedWrapper, wait);
  },

  debounceNamed: function(name, wait, func, immediate) {
    // Like `debounce` but remembers the debounced function once created and
    // repeated calls to `debounceNamed` with the identical name will use the same
    // debounced function. This allows to debounce functions in a central place
    // that might be called various times in different contexts without having to
    // manually store the debounced function.
    var store = fun._debouncedByName || (fun._debouncedByName = {});
    if (store[name]) return store[name];
    function debounceNamedWrapper() {
      // cleaning up
      delete store[name];
      func.apply(this, arguments);
    }
    return store[name] = fun.debounce(wait, debounceNamedWrapper, immediate);
  },

  createQueue: function(id, workerFunc) {
    // A simple queue with an attached asynchronous `workerFunc` to process
    // queued tasks. Calling `createQueue` will return an object with the
    // following interface:
    // ```js
    // {
    //   push: function(task) {/**/},
    //   pushAll: function(tasks) {/**/},
    //   handleError: function(err) {}, // Overwrite to handle errors
    //   dran: function() {}, // Overwrite to react when the queue empties
    // }
    // Example:
    // var sum = 0;
    // var q = fun.createQueue("example-queue", function(arg, thenDo) { sum += arg; thenDo(); });
    // q.pushAll([1,2,3]);
    // queues will be remembered by their name
    // fun.createQueue("example-queue").push(4);
    // sum // => 6

    var store = fun._queues || (fun._queues = {});

    var queue = store[id] || (store[id] = {
        _workerActive: false,
        worker: workerFunc, tasks: [],
        drain: null, // can be overwritten by a function
        push: function(task) {
          queue.tasks.push(task);
          queue.activateWorker();
        },
        pushAll: function(tasks) {
          tasks.forEach(function(ea) { queue.tasks.push(ea); });
          queue.activateWorker();
        },
        pushNoActivate: function(task) {
          queue.tasks.push(task);
        },
        handleError: function(err) {
          // can be overwritten
          err && console.error('Error in queue: ' + err);
        },
        activateWorker: function() {
          function callback(err) { queue.handleError(err); queue.activateWorker(); }
          var tasks = queue.tasks, active = queue._workerActive;
          if (tasks.length === 0) {
            if (active) {
              queue._workerActive = false;
              if (typeof queue.drain === 'function') queue.drain();
            }
            delete store[id];
          } else {
            if (!active) queue._workerActive = true;
            try {
              queue.worker(tasks.shift(), callback);
            } catch(err) { callback(err); }
          }
        }
    });

    return queue;
  },

  workerWithCallbackQueue: function(id, workerFunc, optTimeout) {
    // This functions helps when you have a long running computation that
    // multiple call sites (independent from each other) depend on. This
    // function does the housekeeping to start the long running computation
    // just once and returns an object that allows to schedule callbacks
    // once the workerFunc is done.
    // Example:
    // var worker = fun.workerWithCallbackQueue("example",
    //   function slowFunction(thenDo) {
    //     var theAnswer = 42;
    //     setTimeout(function() { thenDo(null, theAnswer); });
    //   });
    // // all "call sites" depend on `slowFunction` but don't have to know about
    // // each other
    // worker.whenDone(function callsite1(err, theAnswer) { alert("callback1: " + theAnswer); })
    // worker.whenDone(function callsite2(err, theAnswer) { alert("callback2: " + theAnswer); })
    // fun.workerWithCallbackQueue("example").whenDone(function callsite3(err, theAnswer) { alert("callback3: " + theAnswer); })
    // // => Will eventually show: callback1: 42, callback2: 42 and callback3: 42


    // ignore-in-doc
    // This is how it works:
    // If `id` does not exist, workerFunc is called, otherwise ignored.
    // workerFunc is expected to call thenDoFunc with arguments: error, arg1, ..., argN
    // if called subsequently before workerFunc is done, the other thenDoFunc
    // will "pile up" and called with the same arguments as the first
    // thenDoFunc once workerFunc is done
    var store = fun._queueUntilCallbacks || (fun._queueUntilCallbacks = {}),
        queueCallbacks = store[id],
        isRunning = !!queueCallbacks;

    if (isRunning) return queueCallbacks;

    var callbacksRun = false, canceled = false;

    function cleanup() {
      if (timeoutProc) clearTimeout(timeoutProc);
      callbacksRun = true;
      delete store[id];
    }

    function runCallbacks(args) {
      if (callbacksRun) return;
      cleanup();
      queueCallbacks.callbacks.forEach(function(cb) {
        try { cb.apply(null, args); } catch (e) {
          console.error(
              "Error when invoking callbacks in queueUntil ["
            + id + "]:\n"
            + (String(e.stack || e)));
        }
      });
    }

    // timeout
    if (optTimeout) {
      var timeoutProc = setTimeout(function() {
        if (callbacksRun) return;
        runCallbacks([new Error("timeout")]);
      }, optTimeout);
    }

    // init the store
    queueCallbacks = store[id] = {
      callbacks: [],
      cancel: function() {
        canceled = true;
        cleanup();
      },
      whenDone: function(cb) {
        queueCallbacks.callbacks.push(cb);
        return queueCallbacks;
      }
    };

    // call worker, but delay so we can immediately return
    setTimeout(function() {
      if (canceled) return;
      try {
        workerFunc(function(/*args*/) { runCallbacks(arguments); });
      } catch (e) { runCallbacks([e]); }
    }, 0);

    return queueCallbacks;
  },

  composeAsync: function(/*functions*/) {
    // Composes functions that are asynchronous and expecting continuations to
    // be called in node.js callback style (error is first argument, real
    // arguments follow).
    // A call like `fun.composeAsync(f,g,h)(arg1, arg2)` has a flow of control like:
    //  `f(arg1, arg2, thenDo1)` -> `thenDo1(err, fResult)`
    // -> `g(fResult, thenDo2)` -> `thenDo2(err, gResult)` ->
    // -> `h(fResult, thenDo3)` -> `thenDo2(err, hResult)`
    // Example:
    // fun.composeAsync(
    //   function(a,b, thenDo) { thenDo(null, a+b); },
    //   function(x, thenDo) { thenDo(x*4); }
    //  )(3,2, function(err, result) { alert(result); });

    var toArray = Array.prototype.slice,
        functions = toArray.call(arguments),
        endCallback, intermediateResult;

    return functions.reverse().reduce(function(prevFunc, func) {
      var nextActivated = false;
      return function() {
        var args = toArray.call(arguments);
        if (!endCallback) endCallback = args.length === 0 ? function() {} : args.pop();

        function next(/*err and args*/) {
          nextActivated = true;
          var args = toArray.call(arguments),
              err = args.shift();
          if (err) endCallback && endCallback(err);
          else prevFunc.apply(null, args);
        }

        try {
          func.apply(this, args.concat([next]));
        } catch (e) {
          console.error('composeAsync: ', e.stack || e);
          !nextActivated && endCallback && endCallback(e);
        }
      }
    }, function() {
      endCallback.apply(
        null,
        [null].concat(toArray.call(arguments)));
    });
  },

  compose: function(/*functions*/) {
    // Composes synchronousefunctions:
    // `fun.compose(f,g,h)(arg1, arg2)` = `h(g(f(arg1, arg2)))`
    // Example:
      // fun.compose(
      //   function(a,b) { return a+b; },
      //   function(x) {return x*4}
      // )(3,2) // => 20

    var functions = Array.prototype.slice.call(arguments);
    return functions.reverse().reduce(
      function(prevFunc, func) {
        return function() {
          return prevFunc(func.apply(this, arguments));
        }
      }, function(x) { return x; });
  },

  flip: function(f) {
    // Swaps the first two args
    // Example:
    // fun.flip(function(a, b, c) {
    //   return a + b + c; })(' World', 'Hello', '!') // => "Hello World!"
    return function flipped(/*args*/) {
      var args = Array.prototype.slice.call(arguments),
        flippedArgs = [args[1], args[0]].concat(args.slice(2));
      return f.apply(null, flippedArgs);
    }
  },

  waitFor: function(timeoutMs, waitTesterFunc, thenDo) {
    // Wait for waitTesterFunc to return true, then run thenDo, passing
    // failure/timout err as first parameter. A timout occurs after
    // timeoutMs. During the wait period waitTesterFunc might be called
    // multiple times.
    var start = Date.now();
    var timeStep = 50;
    if (!thenDo) {
      thenDo = waitTesterFunc;
      waitTesterFunc = timeoutMs;
      timeoutMs = undefined;
    }
    (function test() {
      if (waitTesterFunc()) return thenDo();
      if (timeoutMs) {
        var duration = Date.now() - start,
            timeLeft = timeoutMs - duration;
        if (timeLeft <= 0) return thenDo(new Error('timeout'));
        if (timeLeft < timeStep) timeStep = timeLeft;
      }
      setTimeout(test, timeStep);
    })();
  },

  waitForAll: function(options, funcs, thenDo) {
    // Wait for multiple asynchronous functions. Once all have called the
    // continuation, call `thenDo`.
    // options can be: `{timeout: NUMBER}` (how long to wait in milliseconds).

    if (!thenDo) { thenDo = funcs; funcs = options; options = null; }
    options = options || {};

    var results = funcs.map(function() { return null; });
    if (!funcs.length) { thenDo(null, results); return; }

    var leftFuncs = Array.prototype.slice.call(funcs);

    funcs.forEach(function(f, i) {
      try {
        f(function(/*err and args*/) {
          var args = Array.prototype.slice.call(arguments);
          var err = args.shift();
          markAsDone(f, i, err, args);
        });
      } catch (e) { markAsDone(f, i, e, null); }
    });

    if (options.timeout) {
      setTimeout(function() {
        if (!leftFuncs.length) return;
        var missing = results
          .map(function(ea, i) { return ea === null && i; })
          .filter(function(ea) { return typeof ea === 'number'; })
          .join(', ');
        var err = new Error("waitForAll timed out, functions at " + missing + " not done");
        markAsDone(null, null, err, null);
      }, options.timeout);
    }

    function markAsDone(f, i, err, result) {
      if (!leftFuncs.length) return;

      var waitForAllErr = null;
      var fidx = leftFuncs.indexOf(f);
      (fidx > -1) && leftFuncs.splice(fidx, 1);
      if (err) {
        leftFuncs.length = 0;
        waitForAllErr = new Error("in waitForAll at"
          + (typeof i === 'number' ? " " + i : "")
          + ": \n" + (err.stack || String(err)));
      } else if (result) results[i] = result;
      if (!leftFuncs.length) setTimeout(function() {
        thenDo(waitForAllErr, results);
      }, 0);
    }
  },

  // -=-=-=-=-
  // wrapping
  // -=-=-=-=-

  curry: function(func, arg1, arg2, argN/*func and curry args*/) {
    // Return a version of `func` with args applied.
    // Example:
    // var add1 = (function(a, b) { return a + b; }).curry(1);
    // add1(3) // => 4
    
    if (arguments.length <= 1) return arguments[0];
    var args = Array.prototype.slice.call(arguments),
        func = args.shift();
    function wrappedFunc() {
      return func.apply(this, args.concat(Array.prototype.slice.call(arguments)));
    }
    wrappedFunc.isWrapper = true;
    wrappedFunc.originalFunction = func;
    return wrappedFunc;
  },

  wrap: function(func, wrapper) {
    // A `wrapper` is another function that is being called with the arguments
    // of `func` and a proceed function that, when called, runs the originally
    // wrapped function.
    // Example:
    // function original(a, b) { return a+b }
    // var wrapped = fun.wrap(original, function logWrapper(proceed, a, b) {
    //   alert("original called with " + a + "and " + b);
    //   return proceed(a, b);
    // })
    // wrapped(3,4) // => 7 and a message will pop up
    var __method = func;
    var wrappedFunc = function wrapped() {
      var args = Array.prototype.slice.call(arguments);
      var wrapperArgs = wrapper.isWrapper ?
        args : [__method.bind(this)].concat(args);
      return wrapper.apply(this, wrapperArgs);
    }
    wrappedFunc.isWrapper = true;
    wrappedFunc.originalFunction = __method;
    return wrappedFunc;
  },

  getOriginal: function(func) {
    // Get the original function that was augmented by `wrap`. `getOriginal`
    // will traversed as many wrappers as necessary.
    while (func.originalFunction) func = func.originalFunction;
    return func;
  },

  wrapperChain: function(method) {
      // Function wrappers used for wrapping, cop, and other method
      // manipulations attach a property "originalFunction" to the wrapper. By
      // convention this property references the wrapped method like wrapper
      // -> cop wrapper -> real method.
      // tThis method gives access to the linked list starting with the outmost
      // wrapper.
      var result = [];
      do {
          result.push(method);
          method = method.originalFunction;
      } while (method);
      return result;
  },

  replaceMethodForOneCall: function(obj, methodName, replacement) {
    // Change an objects method for a single invocation.
    // Example:
    // var obj = {foo: function() { return "foo"}};
    // lively.lang.fun.replaceMethodForOneCall(obj, "foo", function() { return "bar"; });
    // obj.foo(); // => "bar"
    // obj.foo(); // => "foo"
    replacement.originalFunction = obj[methodName];
    var reinstall = obj.hasOwnProperty(methodName);
    obj[methodName] = function() {
      if (reinstall) obj[methodName] = replacement.originalFunction
      else delete obj[methodName];
      return replacement.apply(this, arguments);
    };
    return obj;
  },

  once: function(func) {
    // Ensure that `func` is only executed once. Multiple calls will not call
    // `func` again but will return the original result.
    if (!func) return undefined;
    if (typeof func !== 'function')
      throw new Error("fun.once() expecting a function");
    var invoked = false, result;
    return function() {
      if (invoked) return result;
      invoked = true;
      return result = func.apply(this, arguments);
    }
  },

  either: function(/*funcs*/) {
    // Accepts multiple functions and returns an array of wrapped
    // functions. Those wrapped functions ensure that only one of the original
    // function is run (the first on to be invoked).
    // 
    // This is useful if you have multiple asynchronous choices of how the
    // control flow might continue but want to ensure that a continuation
    // is  only triggered once, like in a timeout situation:
    // 
    // ```js
    // function outerFunction(callback) {
    //   function timeoutAction() { callback(new Error('timeout!')); }
    //   function otherAction() { callback(null, "All OK"); }
    //   setTimeout(timeoutAction, 200);
    //   doSomethingAsync(otherAction);
    // }
    // ```
    // 
    // To ensure that `callback` only runs once you would normally have to write boilerplate like this:
    // 
    // ```js
    // var ran = false;
    // function timeoutAction() { if (ran) return; ran = true; callback(new Error('timeout!')); }
    // function otherAction() { if (ran) return; ran = true; callback(null, "All OK"); }
    // ```
    // 
    // Since this can get tedious an error prone, especially if more than two choices are involved, `either` can be used like this:
    // Example:
    // function outerFunction(callback) {
    //   var actions = fun.either(
    //     function() { callback(new Error('timeout!')); },
    //     function() { callback(null, "All OK"); });
    //   setTimeout(actions[0], 200);
    //   doSomethingAsync(actions[1]);
    // }
    var funcs = Array.prototype.slice.call(arguments), wasCalled = false;
    return funcs.map(function(func) {
      return function() {
        if (wasCalled) return undefined;
        wasCalled = true;
        return func.apply(this, arguments);
      }
    });
  },

  eitherNamed: function(name, func) {
    // Works like [`either`](#) but usage does not require to wrap all
    // functions at once:
    // Example:
    // var log = "", name = "either-example-" + Date.now();
    // function a() { log += "aRun"; };
    // function b() { log += "bRun"; };
    // function c() { log += "cRun"; };
    // setTimeout(fun.eitherNamed(name, a), 100);
    // setTimeout(fun.eitherNamed(name, b), 40);
    // setTimeout(fun.eitherNamed(name, c), 80);
    // setTimeout(function() { alert(log); /* => "bRun" */ }, 150);
    var funcs = Array.prototype.slice.call(arguments);
    var registry = fun._eitherNameRegistry || (fun._eitherNameRegistry = {});
    var name = funcs.shift();
    var eitherCall = registry[name] || (registry[name] = {wasCalled: false, callsLeft: 0});
    eitherCall.callsLeft++;
    return function() {
      eitherCall.callsLeft--;
      // cleanup the storage if all registered functions fired
      if (eitherCall.callsLeft <= 0) delete registry[name];
      if (eitherCall.wasCalled) return undefined;
      eitherCall.wasCalled = true;
      return func.apply(this, arguments);
    }
  },

  // -=-=-=-=-
  // creation
  // -=-=-=-=-
  evalJS: function(src) { return eval(src); },

  fromString: function(funcOrString) {
    // Example:
    // fun.fromString("function() { return 3; }")() // => 3
    return fun.evalJS('(' + funcOrString.toString() + ');');
  },

  asScript: function(func, optVarMapping) {
    // Lifts `func` to become a `Closure`, that is that free variables referenced
    // in `func` will be bound to the values of an object that can be passed in as
    // the second parameter. Keys of this object are mapped to the free variables.
    //
    // Please see [`Closure`](#) for a more detailed explanation and examples.
    return Closure.fromFunction(func, optVarMapping).recreateFunc();
  },

  asScriptOf: function(f, obj, optName, optMapping) {
    // Like `asScript` but makes `f` a method of `obj` as `optName` or the name
    // of the function.
    var name = optName || f.name;
    if (!name) {
      throw Error("Function that wants to be a script needs a name: " + this);
    }
    var proto = Object.getPrototypeOf(obj),
        mapping = {"this": obj};
    if (optMapping) mapping = exports.obj.merge([mapping, optMapping]);
    if (proto && proto[name]) {
      var superFunc = function() {
        try {
          // FIXME super is supposed to be static
          return Object.getPrototypeOf(obj)[name].apply(obj, arguments);
        } catch (e) {
          if (typeof $world !== undefined) $world.logError(e, 'Error in $super call')
          else alert('Error in $super call: ' + e + '\n' + e.stack);
          return null;
        }
      };
      mapping["$super"] = Closure.fromFunction(superFunc, {
        "obj": obj,
        name: name
      }).recreateFunc();
    }
    return fun.addToObject(fun.asScript(f, mapping), obj, name);
  },

  // -=-=-=-=-=-=-=-=-
  // closure related
  // -=-=-=-=-=-=-=-=-
  addToObject: function(f, obj, name) {
    // ignore-in-doc
    f.displayName = name;

    var methodConnections = obj.attributeConnections ?
      obj.attributeConnections.filter(function(con) {
        return con.getSourceAttrName() === 'update'; }) : [];

    if (methodConnections)
      methodConnections.forEach(function(ea) { ea.disconnect(); });

    obj[name] = f;

    if (typeof exports.obj) f.declaredObject = exports.obj.safeToString(obj);

    // suppport for tracing
    if (typeof lively !== "undefined" && exports.obj && lively.Tracing && lively.Tracing.stackTracingEnabled) {
      lively.Tracing.instrumentMethod(obj, name, {
        declaredObject: exports.obj.safeToString(obj)
      });
    }

    if (methodConnections)
      methodConnections.forEach(function(ea) { ea.connect(); });

    return f;
  },

  binds: function(f, varMapping) {
    // ignore-in-doc
    // convenience function
    return Closure.fromFunction(f, varMapping || {}).recreateFunc();
  },

  setLocalVarValue: function(f, name, value) {
    // ignore-in-doc
    if (f.hasLivelyClosure) f.livelyClosure.funcProperties[name] = value;
  },

  getVarMapping: function(f) {
    // ignore-in-doc
    if (f.hasLivelyClosure) return f.livelyClosure.varMapping;
    if (f.isWrapper) return f.originalFunction.varMapping;
    if (f.varMapping) return f.varMapping;
    return {};
  },

  setProperty: function(func, name, value) {
    func[name] = value;
    if (func.hasLivelyClosure) func.livelyClosure.funcProperties[name] = value;
  },

  // -=-=-=-=-=-=-=-=-=-=-=-=-
  // class-related functions
  // -=-=-=-=-=-=-=-=-=-=-=-=-
  functionNames: function(klass) {
    // Treats passed function as class (constructor).
    // Example:
    // var Klass1 = function() {}
    // Klass1.prototype.foo = function(a, b) { return a + b; };
    // Klass1.prototype.bar = function(a) { return this.foo(a, 3); };
    // Klass1.prototype.baz = 23;
    // fun.functionNames(Klass1); // => ["bar","foo"]

    var result = [], lookupObj = klass.prototype;
    while (lookupObj) {
      result = Object.keys(lookupObj).reduce(function(result, name) {
        if (typeof lookupObj[name] === 'function' && result.indexOf(name) === -1)
          result.push(name);
        return result;
      }, result);
      lookupObj = Object.getPrototypeOf(lookupObj);
    }
    return result;
  },

  localFunctionNames: function(func) {
    return Object.keys(func.prototype)
      .filter(function(name) { return typeof func.prototype[name] === 'function'; });
  },

  // -=-=-=-=-=-=-=-=-=-=-
  // tracing and logging
  // -=-=-=-=-=-=-=-=-=-=-

  logErrors: function(func, prefix) {
    var advice = function logErrorsAdvice(proceed /*,args*/ ) {
        var args = Array.prototype.slice.call(arguments);
        args.shift();
        try {
          return proceed.apply(func, args);
        } catch (er) {
          if (typeof lively !== "undefined" && lively.morphic && lively.morphic.World && lively.morphic.World.current()) {
            lively.morphic.World.current().logError(er)
            throw er;
          }

          if (prefix) console.warn("ERROR: %s.%s(%s): err: %s %s", func, prefix, args, er, er.stack || "");
          else console.warn("ERROR: %s %s", er, er.stack || "");
          if (typeof logStack !== "undefined") logStack();
          if (typeof printObject !== "undefined") console.warn("details: " + printObject(er));
          throw er;
        }
      }

    advice.methodName = "$logErrorsAdvice";
    var result = fun.wrap(func, advice);
    result.originalFunction = func;
    result.methodName = "$logErrorsWrapper";
    return result;
  },

  logCompletion: function(func, module) {
    var advice = function logCompletionAdvice(proceed) {
        var args = Array.prototype.slice.call(arguments);
        args.shift();
        try {
          var result = proceed.apply(func, args);
        } catch (er) {
          console.warn('failed to load ' + module + ': ' + er);
          if (typeof lively !== 'undefined' && lively.lang.Execution)
            lively.lang.Execution.showStack();
          throw er;
        }
        console.log('completed ' + module);
        return result;
      }

    advice.methodName = "$logCompletionAdvice::" + module;

    var result = fun.wrap(func, advice);
    result.methodName = "$logCompletionWrapper::" + module;
    result.originalFunction = func;
    return result;
  },

  logCalls: function(func, isUrgent) {
    var original = func,
      advice = function logCallsAdvice(proceed) {
        var args = Array.prototype.slice.call(arguments);
        args.shift(), result = proceed.apply(func, args);
        if (isUrgent) {
          console.warn('%s(%s) -> %s', fun.qualifiedMethodName(original), args, result);
        } else {
          console.log('%s(%s) -> %s', fun.qualifiedMethodName(original), args, result);
        }
        return result;
      }

    advice.methodName = "$logCallsAdvice::" + fun.qualifiedMethodName(func);

    var result = fun.wrap(func, advice);
    result.originalFunction = func;
    result.methodName = "$logCallsWrapper::" + fun.qualifiedMethodName(func);
    return result;
  },

  traceCalls: function(func, stack) {
    var advice = function traceCallsAdvice(proceed) {
        var args = Array.prototype.slice.call(arguments);
        args.shift();
        stack.push(args);
        var result = proceed.apply(func, args);
        stack.pop();
        return result;
      };
    return fun.wrap(func, advice);
  },

  webkitStack: function() {
    // this won't work in every browser
    try {
      throw new Error()
    } catch (e) {
      // remove "Error" and this function from stack, rewrite it nicely
      return String(e.stack)
        .split(/\n/)
        .slice(2)
        .map(function(line) { return line.replace(/^\s*at\s*([^\s]+).*/, '$1'); })
        .join('\n');
    }
  }

};


function Closure() {
  // A `Closure` is a representation of a JavaScript function that controls what
  // values are bound to out-of-scope variables. By default JavaScript has no
  // reflection capabilities over closed values in functions. When needing to
  // serialize execution or when behavior should become part of the state of a
  // system it is often necessary to have first-class control over this language
  // aspect.
  //
  // Typically closures aren't created directly but with the help of [`asScriptOf`](#)
  // 
  // Example:
  // function func(a) { return a + b; }
  // var closureFunc = Closure.fromFunction(func, {b: 3}).recreateFunc();
  // closureFunc(4) // => 7
  // var closure = closureFunc.livelyClosure // => {
  // //   varMapping: { b: 3 },
  // //   originalFunc: function func(a) {/*...*/}
  // // }
  // closure.lookup("b") // => 3
  // closure.getFuncSource() // => "function func(a) { return a + b; }"
  this.initialize.apply(this, arguments);
}

exports.Closure = Closure;

exports.obj.extend(Closure, {
  superclass: Object,
  type: 'Closure',
  categories: {}
});

Closure.prototype.isLivelyClosure = true;

// -=-=-=-=-=-=-=-
// serialization
// -=-=-=-=-=-=-=-
Closure.prototype.doNotSerialize = ['originalFunc'];

// -=-=-=-=-=-=-
// initializing
// -=-=-=-=-=-=-
Closure.prototype.initialize = function(func, varMapping, source, funcProperties) {
  this.originalFunc = func;
  this.varMapping = varMapping || {};
  this.source = source;
  this.setFuncProperties(func || funcProperties);
}

Closure.prototype.setFuncSource = function(src) { /*show-in-doc*/ this.source = src };

Closure.prototype.getFuncSource = function() { /*show-in-doc*/ return this.source || String(this.originalFunc); }

Closure.prototype.hasFuncSource = function() { /*show-in-doc*/ return this.source && true }

Closure.prototype.getFunc = function() { /*show-in-doc*/ return this.originalFunc || this.recreateFunc(); }

Closure.prototype.getFuncProperties = function() {
  // ignore-in-doc
  // a function may have state attached
  if (!this.funcProperties) this.funcProperties = {};
  return this.funcProperties;
}

Closure.prototype.setFuncProperties = function(obj) {
  // ignore-in-doc
  var props = this.getFuncProperties();
  for (var name in obj) {
    // The AST implementation assumes that Function objects are some
    // kind of value object. When their identity changes cached state
    // should not be carried over to new function instances. This is a
    // pretty intransparent way to invalidate attributes that are used
    // for caches.
    // @cschuster, can you please fix this by making invalidation more
    // explicit?
    if (obj.hasOwnProperty(name) && name != "_cachedAst") {
      props[name] = obj[name];
    }
  }
}

Closure.prototype.lookup = function(name) { /*show-in-doc*/ return this.varMapping[name]; }

Closure.prototype.parameterNames = function(methodString) {
  // ignore-in-doc
  var parameterRegex = /function\s*\(([^\)]*)\)/,
      regexResult = parameterRegex.exec(methodString);
  if (!regexResult || !regexResult[1]) return [];
  var parameterString = regexResult[1];
  if (parameterString.length == 0) return [];
  var parameters = parameterString.split(',').map(function(str) {
    return exports.string.removeSurroundingWhitespaces(str);
  }, this);
  return parameters;
}

Closure.prototype.firstParameter = function(src) {
  // ignore-in-doc
  return this.parameterNames(src)[0] || null;
}

// -=-=-=-=-=-=-=-=-=-
// function creation
// -=-=-=-=-=-=-=-=-=-
Closure.prototype.recreateFunc = function() {
  // Creates a real function object
  return this.recreateFuncFromSource(this.getFuncSource(), this.originalFunc);
}

Closure.prototype.recreateFuncFromSource = function(funcSource, optFunc) {
  // ignore-in-doc
  // what about objects that are copied by value, e.g. numbers?
  // when those are modified after the originalFunc we captured
  // varMapping then we will have divergent state
  var closureVars = [],
      thisFound = false,
      specificSuperHandling = this.firstParameter(funcSource) === '$super';
  for (var name in this.varMapping) {
    if (!this.varMapping.hasOwnProperty(name)) continue;
    if (name == 'this') {
      thisFound = true;
      continue;
    }
    closureVars.push(name + '=this.varMapping["' + name + '"]');
  }

  // ignore-in-doc
  // FIXME: problem with rewriting variables when _2 is rewritten by eval below
  // if (this.originalFunc && this.originalFunc.livelyDebuggingEnabled) {
  //     var scopeObject = this.originalFunc._cachedScopeObject,
  //   depth = -1,
  //   path = ''
  //     while (scopeObject && scopeObject != Global) {
  //   depth++;
  //   scopeObject = scopeObject[2]; // descend in scope
  //     }
  //     scopeObject = this.originalFunc._cachedScopeObject;
  //     var path = 'this.originalFunc._cachedScopeObject';
  //     for (var i = depth; i >= 0; i--) {
  //   closureVars.push('_' + depth + '=' + path + '[1]');
  //   closureVars.push('__' + depth + '=' + path);
  //   path += '[2]';
  //     }
  // }

  var src = closureVars.length > 0 ? 'var ' + closureVars.join(',') + ';\n' : '';
  if (specificSuperHandling) src += '(function superWrapperForClosure() { return ';
  src += '(' + funcSource + ')';
  if (specificSuperHandling) src += '.apply(this, [$super.bind(this)].concat(Array.from(arguments))) })';

  // ignore-in-doc
  // FIXME!!!
  if (typeof lively !== 'undefined' && lively.Config && lively.Config.get('loadRewrittenCode')) {
      module('lively.ast.Rewriting').load(true);
      var namespace = '[runtime]';
      if (optFunc && optFunc.sourceModule)
        namespace = new URL(optFunc.sourceModule.findUri()).relativePathFrom(URL.root);
      var fnAst = lively.ast.acorn.parse(src),
          rewrittenAst = lively.ast.Rewriting.rewrite(fnAst, lively.ast.Rewriting.getCurrentASTRegistry(), namespace),
          retVal = rewrittenAst.body[0].block.body.last();

      // ignore-in-doc
      // FIXME: replace last ExpressionStatement with ReturnStatement
      retVal.type = 'ReturnStatement';
      retVal.argument = retVal.expression;
      delete retVal.expression;

      src = '(function() { ' + escodegen.generate(rewrittenAst) + '}).bind(this)();';
  }

  try {
    var func = fun.evalJS.call(this, src) || this.couldNotCreateFunc(src);
    this.addFuncProperties(func);
    this.originalFunc = func;
    if (typeof lively !== 'undefined' && lively.Config && lively.Config.get('loadRewrittenCode')) {
      func._cachedAst.source = funcSource;
      // FIXME: adjust start and end of FunctionExpression (because of brackets)
      func._cachedAst.start++;
      func._cachedAst.end--;
    }
    return func;
  } catch (e) {
      var msg = 'Cannot create function ' + e + ' src: ' + src;
      console.error(msg);
      throw new Error(msg);
  }
}

Closure.prototype.addFuncProperties = function(func) {
  // ignore-in-doc
  var props = this.getFuncProperties();
  for (var name in props) {
    if (props.hasOwnProperty(name)) func[name] = props[name];
  }
  this.addClosureInformation(func);
}

Closure.prototype.couldNotCreateFunc = function(src) {
  // ignore-in-doc
  var msg = 'Could not recreate closure from source: \n' + src;
  console.error(msg);
  return function() { throw new Error(msg); };
}

// -=-=-=-=-=-
// conversion
// -=-=-=-=-=-
Closure.prototype.asFunction = function() {
  /*ignore-in-doc*/
  return this.recreateFunc();
}

// -=-=-=-=-=-=-=-=-=-=-=-
// function modification
// -=-=-=-=-=-=-=-=-=-=-=-
Closure.prototype.addClosureInformation = function(f) {
  /*ignore-in-doc-in-doc*/
  f.hasLivelyClosure = true;
  f.livelyClosure = this;
  return f;
}

Closure.fromFunction = function(func, varMapping) {
  /*show-in-doc*/
  return new Closure(func, varMapping || {});
}

Closure.fromSource = function(source, varMapping) {
  /*show-in-doc*/
  return new Closure(null, varMapping || {}, source);
}

})(typeof lively !== 'undefined' && lively.lang ? lively.lang : require('./base'));
;/*global*/

// String utility methods for printing, parsing, and converting strings.
;(function(exports) {

// show-in-doc
var string = exports.string = {

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // printing and formatting strings
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  format: function strings$format() {
    // String+ -> String
    // Takes a variable number of arguments. The first argument is the format
    // string. Placeholders in the format string are marked with `"%s"`.
    // Example:
    //   lively.lang.string.format("Hello %s!", "Lively User"); // => "Hello Lively User!"
    return string.formatFromArray(Array.prototype.slice.call(arguments));
  },

  formatFromArray: function strings$formatFromArray(objects) {
    var self = objects.shift();
    if (!self) { console.log("Error in Strings>>formatFromArray, first arg is undefined"); };

    function appendText(object, string) { return "" + object; }

    function appendInteger(value, string) { return value.toString(); }

    function appendFloat(value, string, precision) {
      if (precision > -1) return value.toFixed(precision);
      else return value.toString();
    }

    function appendObject(value, string) { return exports.obj.inspect(value); }

    var appenderMap = {s: appendText, d: appendInteger, i: appendInteger, f: appendFloat, o: appendObject};
    var reg = /((^%|[^\\]%)(\d+)?(\.)([a-zA-Z]))|((^%|[^\\]%)([a-zA-Z]))/;

    function parseFormat(fmt) {
      var oldFmt = fmt;
      var parts = [];

      for (var m = reg.exec(fmt); m; m = reg.exec(fmt)) {
        var type = m[8] || m[5],
          appender = type in appenderMap ? appenderMap[type] : appendObject,
          precision = m[3] ? parseInt(m[3]) : (m[4] == "." ? -1 : 0);
        parts.push(fmt.substr(0, m[0][0] == "%" ? m.index : m.index + 1));
        parts.push({appender: appender, precision: precision});

        fmt = fmt.substr(m.index + m[0].length);
      }
      if (fmt)
        parts.push(fmt.toString());

      return parts;
    };

    var parts = parseFormat(self),
      str = "",
      objIndex = 0;

    for (var i = 0; i < parts.length; ++i) {
      var part = parts[i];
      if (part && typeof(part) == "object") {
        var object = objects[objIndex++];
        str += (part.appender || appendText)(object, str, part.precision);
      } else {
        str += appendText(part, str);
      }
    }
    return str;
  },

  indent: function (str, indentString, depth) {
    // String -> String -> String? -> String
    // Example:
    //   string.indent("Hello", "  ", 2) // => "    Hello"
    if (!depth || depth <= 0) return str;
    while (depth > 0) { depth--; str = indentString + str; }
    return str;
  },

  removeSurroundingWhitespaces: function(str) {
    // Example:
    //   string.removeSurroundingWhitespaces("  hello\n  world  ") // => "hello\nworld"
    function removeTrailingWhitespace(s) {
      while (s.length > 0 && /\s|\n|\r/.test(s[s.length - 1]))
        s = s.substring(0, s.length - 1);
      return s;
    }
    function removeLeadingWhitespace(string) {
      return string.replace(/^[\n\s]*(.*)/, '$1');
    }
    return removeLeadingWhitespace(removeTrailingWhitespace(str));
  },

  quote: function(str) {
    // Example:
    //   string.print("fo\"o") // => "\"fo\\\"o\""
    return '"' + str.replace(/"/g, '\\"') + '"';
  },

  print: function print(obj) {
    // Prints Arrays and escapes quotations. See `obj.inspect` for how to
    // completely print / inspect JavaScript data strcutures
    // Example:
    //   string.print([[1,2,3], "string", {foo: 23}])
    //      // => [[1,2,3],"string",[object Object]]
    if (obj && Array.isArray(obj)) return '[' + obj.map(print) + ']';
    if (typeof obj !== "string") return String(obj);
    var result = String(obj);
    result = result.replace(/\n/g, '\\n\\\n');
    result = result.replace(/(")/g, '\\$1');
    result = '\"' + result + '\"';
    return result;
  },

  printNested: function(list, depth) {
    // Example:
    //   string.printNested([1,2,[3,4,5]]) // => "1\n2\n  3\n  4\n  5\n"
    depth = depth || 0;
    var s = ""
    list.forEach(function(ea) {
      if (ea instanceof Array) {
        s += string.printNested(ea, depth + 1)
      } else {
        s +=  string.indent(ea +"\n", '  ', depth);
      }
    })
    return s
  },

  pad: function(string, n, left) {
    // Examples:
    // string.pad("Foo", 2) // => "Foo  "
    // string.pad("Foo", 2, true) // => "  Foo"
    return left ? ' '.times(n) + string : string + ' '.times(n);
  },

  printTable: function(tableArray, options) {
    // Array -> Object? -> String
    // Takes a 2D Array and prints a table string. Kind of the reverse
    // operation to `strings.tableize`
    // Example:
    //   string.printTable([["aaa", "b", "c"], ["d", "e","f"]])
    //    // =>
    //    // aaa b c
    //    // d   e f
    var columnWidths = [],
      separator = (options && options.separator) || ' ',
      alignLeftAll = !options || !options.align || options.align === 'left',
      alignRightAll = options && options.align === 'right';
    function alignRight(columnIndex) {
      if (alignLeftAll) return false;
      if (alignRightAll) return true;
      return options
        && Object.isArray(options.align)
        && options.align[columnIndex] === 'right';
    }
    tableArray.forEach(function(row) {
      row.forEach(function(cellVal, i) {
        if (columnWidths[i] === undefined) columnWidths[i] = 0;
        columnWidths[i] = Math.max(columnWidths[i], String(cellVal).length);
      });
    });
    return tableArray.collect(function(row) {
      return row.collect(function(cellVal, i) {
        var cellString = String(cellVal);
        return string.pad(cellString,
                   columnWidths[i] - cellString.length,
                   alignRight(i));
      }).join(separator);
    }).join('\n');
  },

  printTree: function(rootNode, nodePrinter, childGetter, indent) {
    // Object -> Function -> Function -> Number? -> String
    // A generic function to print a tree representation from a nested data structure.
    // Receives three arguments:
    // - `rootNode` an object representing the root node of the tree
    // - `nodePrinter` is a function that gets a tree node and should return stringified version of it
    // - `childGetter` is a function that gets a tree node and should return a list of child nodes
    // Example:
    // var root = {name: "a", subs: [{name: "b", subs: [{name: "c"}]}, {name: "d"}]};
    // string.printTree(root, function(n) { return n.name; }, function(n) { return n.subs; });
    // // =>
    // // a
    // // |-b
    // // | \-c
    // // \-d

    var nodeList = [];
    indent = indent || '  ';
    iterator(0, 0, rootNode);
    return nodeList.join('\n');
    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    function iterator(depth, index, node) {
      // 1. Create stringified representation of node
      nodeList[index] = (string.times(indent, depth)) + nodePrinter(node, depth);
      var children = childGetter(node, depth),
        childIndex = index + 1;
      if (!children || !children.length) return childIndex;
      // 2. If there are children then assemble those linear inside nodeList
      // The childIndex is the pointer of the current items of childList into
      // nodeList.
      var lastIndex = childIndex,
        lastI = children.length - 1;
      children.forEach(function(ea, i) {
        childIndex = iterator(depth+1, childIndex, ea);
        // 3. When we have printed the recursive version then augment the
        // printed version of the direct children with horizontal slashes
        // directly in front of the represented representation
        var isLast = lastI === i,
          cs = nodeList[lastIndex].split(''),
          fromSlash = (depth*indent.length)+1,
          toSlash = (depth*indent.length)+indent.length;
        for (var i = fromSlash; i < toSlash; i++) cs[i] = '-';
        if (isLast) cs[depth*indent.length] = '\\';
        nodeList[lastIndex] = cs.join('');
        // 4. For all children (direct and indirect) except for the
        // last one (itself and all its children) add vertical bars in
        // front of each at position of the current nodes depth. This
        // makes is much easier to see which child node belongs to which
        // parent
        if (!isLast)
          nodeList.slice(lastIndex, childIndex).forEach(function(ea, i) {
            var cs2 = ea.split('');
            cs2[depth*indent.length] = '|';
            nodeList[lastIndex+i] = cs2.join(''); });
        lastIndex = childIndex;
      });
      return childIndex;
    }
  },

  toArray: function(s) {
    // Example:
    // string.toArray("fooo") // => ["f","o","o","o"]
    return s.split('');
  },

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // parsing strings into other entities
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  lines: function(str) {
    // Example: string.lines("foo\nbar\n\rbaz") // => ["foo","bar","baz"]
    return str.split(/\n\r?/);
  },

  paragraphs: function(string, options) {
    // Examples:
    // var text = "Hello, this is a pretty long sentence\nthat even includes new lines."
    //         + "\n\n\nThis is a sentence in  a new paragraph.";
    // string.paragraphs(text) // => [
    //   // "Hello, this is a pretty long sentence\nthat even includes new lines.",
    //   // "This is a sentence in  a new paragraph."]
    // string.paragraphs(text, {keepEmptyLines: true}) // => [
    //   // "Hello, this is a pretty long sentence\n that even includes new lines.",
    //   // "\n ",
    //   // "This is a sentence in  a new paragraph."]
    var sep = options ? options.sep : '\n\n';
    if (!options || !options.keepEmptyLines) return string.split(new RegExp(sep + '+'));
    function isWhiteSpace(s) { return (/^\s*$/).test(s); }
    return string.split('\n').concat('').reduce(function(parasAndLast, line) {
      var paras = parasAndLast[0], last = parasAndLast[1];
      if (isWhiteSpace(last) === isWhiteSpace(line)) {
        last += '\n' + line;
      } else {
         last.length && paras.push(last); last = line;
      }
      return [paras, last];
    }, [[], ''])[0];
  },

  nonEmptyLines: function(str) {
    // Example: string.nonEmptyLines("foo\n\nbar\n") // => ["foo","bar"]
    return string.lines(str).compact();
  },

  tokens: function(str, regex) {
    // Example:
    // string.tokens(' a b c') => ['a', 'b', 'c']
    return str.split(regex || /\s+/).filter(function(tok) {
      return !(/^\s*$/).test(tok); });
  },

  tableize: function(s, options) {
    // String -> Object? -> Array
    // Takes a String representing a "table" and parses it into a 2D-Array (as
    // accepted by the `collection.Grid` methods or `string.printTable`)
    // ```js
    // options = {
    //     convertTypes: BOOLEAN, // automatically convert to Numbers, Dates, ...?
    //     cellSplitter: REGEXP // how to recognize "cells", by default just spaces
    // }
    // ```
    // Examples:
    // string.tableize('a b c\nd e f')
    // // => [["a","b","c"],["d","e","f"]]
    // // can also parse csv like
    // var csv = '"Symbol","Name","LastSale",\n'
    //         + '"FLWS","1-800 FLOWERS.COM, Inc.","5.65",\n'
    //         + '"FCTY","1st Century Bancshares, Inc","5.65",'
    // string.tableize(csv, {cellSplitter: /^\s*"|","|",?\s*$/g})
    // // => [["Symbol","Name","LastSale"],
    // //     ["FLWS","1-800 FLOWERS.COM, Inc.",5.65],
    // //     ["FCTY","1st Century Bancshares, Inc",5.65]]

    options = options || {};
    var splitter = options.cellSplitter || /\s+/,
        emptyStringRe = /^\s*$/,
        convertTypes = options.hasOwnProperty('convertTypes') ? !!options.convertTypes : true,
        lines = string.lines(s), table = [];
    for (var i = 0; i < lines.length; i++) {
      var tokens = string.tokens(lines[i], splitter);
      if (convertTypes) {
        tokens = tokens.map(function(tok) {
          if (tok.match(emptyStringRe)) return tok;
          var num = Number(tok);
          if (!isNaN(num)) return num;
          var date = new Date(tok);
          if (!isNaN(+date)) return date;
          return tok.trim();
        });
      }
      if (tokens.length > 0) table.push(tokens);
    }
    return table;
  },

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // (un)escape / encoding / decoding
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  unescapeCharacterEntities: function(s) {
    // Converts [character entities](http://dev.w3.org/html5/html-author/charref)
    // into utf-8 strings
    // Example:
    //   string.unescapeCharacterEntities("foo &amp;&amp; bar") // => "foo && bar"
    if (typeof document === 'undefined') throw new Error("Cannot unescapeCharacterEntities");
    var div = document.createElement('div');
    div.innerHTML = s;
    return div.textContent;
  },

  toQueryParams: function(s, separator) {
    // Example:
    // string.toQueryParams("http://example.com?foo=23&bar=test")
    //   // => {bar: "test", foo: "23"}
    var match = s.trim().match(/([^?#]*)(#.*)?$/);
    if (!match) return {};

    var hash = match[1].split(separator || '&').inject({}, function(hash, pair) {
      if ((pair = pair.split('='))[0]) {
        var key = decodeURIComponent(pair.shift());
        var value = pair.length > 1 ? pair.join('=') : pair[0];
        if (value != undefined) value = decodeURIComponent(value);

        if (key in hash) {
          if (!Array.isArray(hash[key])) hash[key] = [hash[key]];
          hash[key].push(value);
        } else hash[key] = value;
      }
      return hash;
    });
    return hash;
  },

  // -=-=-=-=-=-=-=-=-=-=-=-=-
  // file system path support
  // -=-=-=-=-=-=-=-=-=-=-=-=-
  joinPath: function(/*paths*/) {
    // Joins the strings passed as paramters together so that ea string is
    // connected via a single "/".
    // Example:
    // string.joinPath("foo", "bar") // => "foo/bar";
    var args = Array.prototype.slice.call(arguments);
    return args.reduce(function(path, ea) {
      return typeof ea === "string" ?
        path.replace(/\/*$/, "") + "/" + ea.replace(/^\/*/, "") : path;
    });
  },

  // -=-=-=-=-=-=-=-=-
  // ids and hashing
  // -=-=-=-=-=-=-=-=-

  newUUID: function() {
    // Example:
    //   string.newUUID() // => "3B3E74D0-85EA-45F2-901C-23ECF3EAB9FB"
    var id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    }).toUpperCase();
    return id;
  },

  createDataURI: function(content, mimeType) {
    // String -> String -> String
    // Takes some string representing content and a mime type.
    // For a list of mime types see: [http://www.iana.org/assignments/media-types/media-types.xhtml]()
    // More about data URIs: [https://developer.mozilla.org/en-US/docs/Web/HTTP/data_URIs]()
    // Example:
    //   window.open(string.createDataURI('<h1>test</h1>', 'text/html'));
    mimeType = mimeType || "text/plain";
    return "data:" + mimeType
       + ";base64," + btoa(content);
  },

  hashCode: function(s) {
    // [http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/]()
    // Example: string.hashCode("foo") // => 101574
    var hash = 0, len = s.length;
    if (len == 0) return hash;
    for (var i = 0; i < len; i++) {
      var c = s.charCodeAt(i);
      hash = ((hash<<5)-hash) + c;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  },

  md5: function (string) {
    // © Joseph Myers [http://www.myersdaily.org/joseph/javascript/md5-text.html]()
    // Example:
    //   string.md5("foo") // => "acbd18db4cc2f85cedef654fccc4a4d8"

    /* ignore-in-doc
		this function is much faster,
		so if possible we use it. Some IEs
		are the only ones I know of that
		need the idiotic second function,
		generated by an if clause.  */
    // var add32 = hex(md51("hello")) === "5d41402abc4b2a76b9719d911017c592" ?
    //   function add32(a, b) { return (a + b) & 0xFFFFFFFF; } :
		var add32 = function add32(x, y) {
			var lsw = (x & 0xFFFF) + (y & 0xFFFF),
			msw = (x >> 16) + (y >> 16) + (lsw >> 16);
			return (msw << 16) | (lsw & 0xFFFF);
		}

  	function cmn(q, a, b, x, s, t) {
			a = add32(add32(a, q), add32(x, t));
			return add32((a << s) | (a >>> (32 - s)), b);
		}

		function ff(a, b, c, d, x, s, t) {
			return cmn((b & c) | ((~b) & d), a, b, x, s, t);
		}

		function gg(a, b, c, d, x, s, t) {
			return cmn((b & d) | (c & (~d)), a, b, x, s, t);
		}

		function hh(a, b, c, d, x, s, t) {
			return cmn(b ^ c ^ d, a, b, x, s, t);
		}

		function ii(a, b, c, d, x, s, t) {
			return cmn(c ^ (b | (~d)), a, b, x, s, t);
		}

		function md5cycle(x, k) {
			var a = x[0], b = x[1], c = x[2], d = x[3];

			a = ff(a, b, c, d, k[0], 7, -680876936);
			d = ff(d, a, b, c, k[1], 12, -389564586);
			c = ff(c, d, a, b, k[2], 17,  606105819);
			b = ff(b, c, d, a, k[3], 22, -1044525330);
			a = ff(a, b, c, d, k[4], 7, -176418897);
			d = ff(d, a, b, c, k[5], 12,  1200080426);
			c = ff(c, d, a, b, k[6], 17, -1473231341);
			b = ff(b, c, d, a, k[7], 22, -45705983);
			a = ff(a, b, c, d, k[8], 7,  1770035416);
			d = ff(d, a, b, c, k[9], 12, -1958414417);
			c = ff(c, d, a, b, k[10], 17, -42063);
			b = ff(b, c, d, a, k[11], 22, -1990404162);
			a = ff(a, b, c, d, k[12], 7,  1804603682);
			d = ff(d, a, b, c, k[13], 12, -40341101);
			c = ff(c, d, a, b, k[14], 17, -1502002290);
			b = ff(b, c, d, a, k[15], 22,  1236535329);

			a = gg(a, b, c, d, k[1], 5, -165796510);
			d = gg(d, a, b, c, k[6], 9, -1069501632);
			c = gg(c, d, a, b, k[11], 14,  643717713);
			b = gg(b, c, d, a, k[0], 20, -373897302);
			a = gg(a, b, c, d, k[5], 5, -701558691);
			d = gg(d, a, b, c, k[10], 9,  38016083);
			c = gg(c, d, a, b, k[15], 14, -660478335);
			b = gg(b, c, d, a, k[4], 20, -405537848);
			a = gg(a, b, c, d, k[9], 5,  568446438);
			d = gg(d, a, b, c, k[14], 9, -1019803690);
			c = gg(c, d, a, b, k[3], 14, -187363961);
			b = gg(b, c, d, a, k[8], 20,  1163531501);
			a = gg(a, b, c, d, k[13], 5, -1444681467);
			d = gg(d, a, b, c, k[2], 9, -51403784);
			c = gg(c, d, a, b, k[7], 14,  1735328473);
			b = gg(b, c, d, a, k[12], 20, -1926607734);

			a = hh(a, b, c, d, k[5], 4, -378558);
			d = hh(d, a, b, c, k[8], 11, -2022574463);
			c = hh(c, d, a, b, k[11], 16,  1839030562);
			b = hh(b, c, d, a, k[14], 23, -35309556);
			a = hh(a, b, c, d, k[1], 4, -1530992060);
			d = hh(d, a, b, c, k[4], 11,  1272893353);
			c = hh(c, d, a, b, k[7], 16, -155497632);
			b = hh(b, c, d, a, k[10], 23, -1094730640);
			a = hh(a, b, c, d, k[13], 4,  681279174);
			d = hh(d, a, b, c, k[0], 11, -358537222);
			c = hh(c, d, a, b, k[3], 16, -722521979);
			b = hh(b, c, d, a, k[6], 23,  76029189);
			a = hh(a, b, c, d, k[9], 4, -640364487);
			d = hh(d, a, b, c, k[12], 11, -421815835);
			c = hh(c, d, a, b, k[15], 16,  530742520);
			b = hh(b, c, d, a, k[2], 23, -995338651);

			a = ii(a, b, c, d, k[0], 6, -198630844);
			d = ii(d, a, b, c, k[7], 10,  1126891415);
			c = ii(c, d, a, b, k[14], 15, -1416354905);
			b = ii(b, c, d, a, k[5], 21, -57434055);
			a = ii(a, b, c, d, k[12], 6,  1700485571);
			d = ii(d, a, b, c, k[3], 10, -1894986606);
			c = ii(c, d, a, b, k[10], 15, -1051523);
			b = ii(b, c, d, a, k[1], 21, -2054922799);
			a = ii(a, b, c, d, k[8], 6,  1873313359);
			d = ii(d, a, b, c, k[15], 10, -30611744);
			c = ii(c, d, a, b, k[6], 15, -1560198380);
			b = ii(b, c, d, a, k[13], 21,  1309151649);
			a = ii(a, b, c, d, k[4], 6, -145523070);
			d = ii(d, a, b, c, k[11], 10, -1120210379);
			c = ii(c, d, a, b, k[2], 15,  718787259);
			b = ii(b, c, d, a, k[9], 21, -343485551);

			x[0] = add32(a, x[0]);
			x[1] = add32(b, x[1]);
			x[2] = add32(c, x[2]);
			x[3] = add32(d, x[3]);

		}

		function md51(s) {
			var n = s.length,
			state = [1732584193, -271733879, -1732584194, 271733878], i;
			for (i=64; i<=n; i+=64) {
				md5cycle(state, md5blk(s.substring(i-64, i)));
			}
			s = s.substring(i-64);
			var tail = [0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0], sl=s.length;
			for (i=0; i<sl; i++) 	tail[i>>2] |= s.charCodeAt(i) << ((i%4) << 3);
			tail[i>>2] |= 0x80 << ((i%4) << 3);
			if (i > 55) {
				md5cycle(state, tail);
				i=16;
				while (i--) { tail[i] = 0 }
	//			for (i=0; i<16; i++) tail[i] = 0;
			}
			tail[14] = n*8;
			md5cycle(state, tail);
			return state;
		}

		/* ignore-in-doc
		 * there needs to be support for Unicode here,
		 * unless we pretend that we can redefine the MD-5
		 * algorithm for multi-byte characters (perhaps
		 * by adding every four 16-bit characters and
		 * shortening the sum to 32 bits). Otherwise
		 * I suggest performing MD-5 as if every character
		 * was two bytes--e.g., 0040 0025 = @%--but then
		 * how will an ordinary MD-5 sum be matched?
		 * There is no way to standardize text to something
		 * like UTF-8 before transformation; speed cost is
		 * utterly prohibitive. The JavaScript standard
		 * itself needs to look at this: it should start
		 * providing access to strings as preformed UTF-8
		 * 8-bit unsigned value arrays.
		 */
		function md5blk(s) { 		/* I figured global was faster.   */
			var md5blks = [], i; 	/* Andy King said do it this way. */
			for (i=0; i<64; i+=4) {
			md5blks[i>>2] = s.charCodeAt(i)
			+ (s.charCodeAt(i+1) << 8)
			+ (s.charCodeAt(i+2) << 16)
			+ (s.charCodeAt(i+3) << 24);
			}
			return md5blks;
		}

		var hex_chr = '0123456789abcdef'.split('');

		function rhex(n)
		{
			var s='', j=0;
			for(; j<4; j++)	s += hex_chr[(n >> (j * 8 + 4)) & 0x0F]	+ hex_chr[(n >> (j * 8)) & 0x0F];
			return s;
		}

		function hex(x) {
			var l=x.length;
			for (var i=0; i<l; i++)	x[i] = rhex(x[i]);
			return x.join('');
		}

		return hex(md51(string));
	},

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-
  // matching strings / regexps
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-

  reMatches: function(string, re) {
    // Different to the native `match` function this method returns an object
    // with `start`, `end`, and `match` fields
    // Example:
    //   string.reMatches("Hello World", /o/g)
    //   // => [{start: 4, end: 5, match: "o"},{start: 7, end: 8, match: "o"}]
    var matches = [];
    string.replace(re, function(match, idx) {
      matches.push({match: match, start: idx, end: idx + match.length}); });
    return matches;
  },

  stringMatch: function(s, patternString, options) {
    // returns `{matched: true}` if success otherwise
    // `{matched: false, error: EXPLANATION, pattern: STRING|RE, pos: NUMBER}`
    // Example:
    //   string.stringMatch("foo 123 bar", "foo __/[0-9]+/__ bar") // => {matched: true}
    //   string.stringMatch("foo aaa bar", "foo __/[0-9]+/__ bar")
    //     // => {
    //     //   error: "foo <--UNMATCHED-->aaa bar",
    //     //   matched: false,
    //     //   pattern: /[0-9]+/,
    //     //   pos: 4
    //     // }
    options = options || {};
    if (!!options.normalizeWhiteSpace) s = s.replace(/\s+/g, ' ');
    if (!!options.ignoreIndent) {
      s = s.replace(/^\s+/gm, '');
      patternString = patternString.replace(/^\s+/gm, '');
    }
    return s == patternString ?
      {matched: true} : embeddedReMatch(s , patternString);

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    function splitInThree(string, start, end, startGap, endGap) {
      // split string at start and end
      // return (0, start), (start, end), (end, ...)
      startGap = startGap || 0; endGap = endGap || 0;
      return [string.slice(0, start),
          string.slice(start+startGap, end-endGap),
          string.slice(end)]
    }

    function matchStringForward(s, pattern) {
      // try to match pattern at beginning of string. if matched, return
      // result object with {
      //   match: STRING,
      //   REST: STRING -- remaining string after pattern was consumed
      // }
      if (pattern.constructor !== RegExp) {
        var idx = s.indexOf(pattern);
        if (idx === 0) return {match: pattern, rest: s.slice(pattern.length)}
        // no match
        for (var i = 0; i < pattern.length; i++) // figure out where we failed
          if (pattern[i] != s[i])
            return {match: null, pos: i};
        return {match: null};
      }
      var matches = string.reMatches(s, pattern);
      // show(matches)
      // show(string.slice(matches[0].end));
      return (!matches || !matches.length || matches[0].start !== 0) ?
        {match: null} :
        {match: matches[0].match, rest: s.slice(matches[0].end)};
    }

    function matchStringForwardWithAllPatterns(s, patterns) {
      // like matchStringForward, just apply list of patterns
      var pos = 0;
      for (var i = 0; i < patterns.length; i++) {
        var p = patterns[i],
          result = matchStringForward(s, p);
        if (!result.match) return {matched: false, pos: pos + (result.pos || 0), pattern: p}
        pos += result.match.length;
        s = result.rest;
      }
      return s.length ? {matched: false, pos: pos} : {matched: true}
    }

    function splitIntoPatterns(matcher) {
      var starts = string.reMatches(matcher, /__\//g),
          ends = string.reMatches(matcher, /\/__/g);
      if (starts.length !== ends.length) {
        throw new Error("pattern invalid: "
                + matcher
                + " cannot be split into __/.../__ embedded RegExps"
                + "\nstarts: " + JSON.stringify(starts)
                + '\nvs ends:\n' + JSON.stringify(ends));
      }
      var consumed = 0;
      return starts.reduce(function(patterns, start, i) {
        var end = ends[i];
        var matcher = patterns.pop();
        var splitted = splitInThree(
          matcher,
          start.start-consumed,
          end.end-consumed,
          3, 3);
        if (splitted[0].length) {
          patterns.push(splitted[0]);
          consumed += splitted[0].length;
        }
        try {
          if (splitted[1].length) {
            patterns.push(new RegExp(splitted[1]));
            consumed += splitted[1].length + 3 + 3;
          }
        } catch(e) {
          throw new Error("Cannot create pattern re from: " + exports.obj.inspect(splitted))
        }
        if (splitted[2].length) { patterns.push(splitted[2]); }
        return patterns;
      }, [matcher]);
    }

    function embeddedReMatch(s, patternString) {
      // the main match func
      var patterns = splitIntoPatterns(patternString)
      var result = matchStringForwardWithAllPatterns(s, patterns);
      if (result.matched) return result;
      result.error = s.slice(0, result.pos) + '<--UNMATCHED-->' + s.slice(result.pos)
      return result;
    }
  },

  peekRight: function(s, start, needle) {
    // Finds the next occurence of `needle` (String or RegExp). Returns delta
    // index.
    // Example:
    // string.peekRight("Hello World", 0, /o/g) // => 4
    // string.peekRight("Hello World", 5, /o/) // => 2
    s = s.slice(start);
    if (typeof needle === 'string') {
      var idx = s.indexOf(needle);
      return idx === -1 ? null : idx + start;
    } else if (needle.constructor === RegExp) {
      var matches = string.reMatches(s, needle);
      return matches[0] ? matches[0].start : null;
    }
    return null;
  },

  peekLeft: function(s, start, needle) {
    // Similar to `peekRight`
    s = s.slice(0, start);
    if (typeof needle === 'string') {
      var idx = s.lastIndexOf(needle);
      return idx === -1 ? null : idx;
    } else if (needle.constructor === RegExp) {
      var matches = string.reMatches(s, needle);
      return exports.arr.last(matches) ? exports.arr.last(matches).start : null;
    }
    return null;
  },

  lineIndexComputer: function(s) {
    // String -> Function
    // For converting character positions to line numbers.
    // Returns a function accepting char positions. If the char pos is outside
    // of the line ranges -1 is returned.
    // Example:
    // var idxComp = string.lineIndexComputer("Hello\nWorld\n\nfoo");
    // idxComp(3) // => 0 (index 3 is "l")
    // idxComp(6) // => 1 (index 6 is "W")
    // idxComp(12) // => 2 (index 12 is "\n")

    // ignore-in-doc
    // line ranges: list of numbers, each line has two entries:
    // i -> start of line, i+1 -> end of line
    var lineRanges = string.lines(s).reduce(function(lineIndexes, line) {
      var lastPos = lineIndexes.slice(-1)[0] || -1;
      return lineIndexes.concat([lastPos+1, lastPos + 1 + line.length]);
    }, []);
    // ignore-in-doc
    // FIXME, this is O(n). Make cumputation more efficient, binary lookup?
    return function(pos) {
      for (var line = 0; line < lineRanges.length; line+=2)
        if (pos >= lineRanges[line] && pos <= lineRanges[line+1])
          return line / 2;
      return -1;
    }
  },

  // -=-=-=-=-
  // diffing
  // -=-=-=-=-

  diff: function(s1, s2) {
    if (typeof JsDiff === "undefined") return 'diff not supported';
    return JsDiff.convertChangesToXML(JsDiff.diffWordsWithSpace(s1, s2));
  },

  // -=-=-=-=-
  // testing
  // -=-=-=-=-

  empty: function(s) {
    // show-in-doc
    return s == '';
  },

  include: function(s, pattern) {
    // Example:
    // string.include("fooo!", "oo") // => true
    return s.indexOf(pattern) > -1;
  },

  startsWith: function(s, pattern) {
    // Example:
    // string.startsWith("fooo!", "foo") // => true
    return s.indexOf(pattern) === 0;
  },

  startsWithVowel: function(s) {
    // show-in-doc
    var c = s[0];
    return c === 'A' || c === 'E' || c === 'I' || c === 'O' || c === 'U'
      || c === 'a' || c === 'e' || c === 'i' || c === 'o' || c === 'u' || false;
  },

  endsWith: function(s, pattern) {
    // Example:
    // string.endsWith("fooo!", "o!") // => true
    var d = s.length - pattern.length;
    return d >= 0 && s.lastIndexOf(pattern) === d;
  },

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // string conversion and manipulation
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  withDecimalPrecision: function(str, precision) {
    // String -> Number -> String
    // Example: string.withDecimalPrecision("1.12345678", 3) // => "1.123"
    var floatValue = parseFloat(str);
    return isNaN(floatValue) ? str : floatValue.toFixed(precision);
  },

  capitalize: function(s) {
    // Example:
    // string.capitalize("foo bar") // => "Foo bar"
    return s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  },

  camelCaseString: function(s) {
    // Spaces to camels, including first char
    // Example: string.camelCaseString("foo bar baz") // => "FooBarBaz"
    return s.split(" ").invoke('capitalize').join("")
  },

  camelize: function(s) {
    // Dashes to camels, excluding first char
    // Example: string.camelize("foo-bar-baz") // => "fooBarBaz"
    var parts = s.split('-'),
        len = parts.length;
    if (len == 1) return parts[0];

    var camelized = s.charAt(0) == '-' ?
        parts[0].charAt(0).toUpperCase() + parts[0].substring(1) : parts[0];
    for (var i = 1; i < len; i++)
      camelized += parts[i].charAt(0).toUpperCase() + parts[i].substring(1);
    return camelized;
  },

  truncate: function(s, length, truncation) {
    // Enforces that s is not more then `length` characters long.
    // Example:
    // string.truncate("123456789", 5) // => "12..."
    length = length || 30;
    truncation = truncation === undefined ? '...' : truncation;
    return s.length > length ?
      s.slice(0, length - truncation.length) + truncation : String(s);
  },

  regExpEscape: function(s) {
    // For creating RegExps from strings and not worrying about proper escaping
    // of RegExp special characters to literally match those.
    // Example:
    // var re = new RegExp(string.regExpEscape("fooo{20}"));
    // re.test("fooo") // => false
    // re.test("fooo{20}") // => true
    return s.replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, '\\$1')
            .replace(/\x08/g, '\\x08');
  },

  succ: function(s) {
    // Uses char code.
    // Example:
    // string.succ("a") // => "b"
    // string.succ("Z") // => "["
    return s.slice(0, s.length - 1) + String.fromCharCode(s.charCodeAt(s.length - 1) + 1);
  },

  digitValue: function() {
    // ignore-in-doc
    return this.charCodeAt(0) - "0".charCodeAt(0);
  },

  times: function(s, count) {
    // Example:
    // string.times("test", 3) // => "testtesttest"
    return count < 1 ? '' : new Array(count + 1).join(s);
  }

}

})(typeof lively !== 'undefined' && lively.lang ? lively.lang : require('./base'));
;/*
 * Utility functions for JS Numbers.
 */
;(function(exports) {
"use strict";

var num = exports.num = {

  random: function(min, max) {
    // random number between (and including) `min` and `max`
    min = min || 0;
    max  = max || 100;
    return Math.round(Math.random() * (max-min) + min)
  },

  normalRandom: (function(mean, stdDev) {
    // returns randomized numbers in a normal distribution that can be
    // controlled ising the `mean` and `stdDev` parameters
    var spare, isSpareReady = false;
    return function(mean, stdDev) {
      if (isSpareReady) {
        isSpareReady = false;
        return spare * stdDev + mean;
      } else {
        var u, v, s;
        do {
          u = Math.random() * 2 - 1;
          v = Math.random() * 2 - 1;
          s = u * u + v * v;
        } while (s >= 1 || s == 0);
        var mul = Math.sqrt(-2.0 * Math.log(s) / s);
        spare = v * mul;
        isSpareReady = true;
        return mean + stdDev * u * mul;
      }
    }
  })(),

  randomSmallerInteger: function (n) { return Math.floor(Math.random() * n); },

  humanReadableByteSize: function(n) {
    // interpret `n` as byte size and print a more readable version
    // Example:
    //   num.humanReadableByteSize(Math.pow(2,32)) // => "4096MB"
    function round(n) { return Math.round(n * 100) / 100 }
    if (n < 1000) return String(round(n)) + 'B'
    n = n / 1024;
    if (n < 1000) return String(round(n)) + 'KB'
    n = n / 1024;
    return String(round(n)) + 'MB'
  },

  average: function(numbers) {
    // show-in-doc
    return numbers.reduce(function(sum, n) { return sum + n; }, 0) / numbers.length;
  },

  median: function(numbers) {
    // show-in-doc
    var sorted = numbers.sort(function(a,b) { return b - a; }),
        len = numbers.length;
    return len % 2 === 0 ?
      0.5 * (sorted[len/2-1] + sorted[len/2]) :
      sorted[(len-1)/2];
  },

  between: function(x, a, b, eps) {
    // is `a` <= `x` <= `y`?
    eps = eps || 0;
    var min, max;
    if (a < b) { min = a, max = b }
    else { max = a, min = b }
    return (max - x + eps >= 0) && (min - x - eps <= 0);
  },

  sort: function(arr) {
    // numerical sort, JavaScript native `sort` function is lexical by default.
    return arr.sort(function(a,b) { return a-b; });
  },

  parseLength: function(string, toUnit) {
    // This converts the length value to pixels or the specified `toUnit`.
    // length converstion, supported units are: mm, cm, in, px, pt, pc
    // Examples:
    // num.parseLength('3cm') // => 113.38582677165354
    // num.parseLength('3cm', "in") // => 1.1811023622047243
    toUnit = toUnit || 'px'
    var match = string.match(/([0-9\.]+)\s*(.*)/);
    if (!match || !match[1]) return undefined;
    var length = parseFloat(match[1]),
      fromUnit = match[2];
    return exports.num.convertLength(length, fromUnit, toUnit);
  },

  convertLength: (function() {
    // ignore-in-doc
    // num.convertLength(20, 'px', 'pt').roundTo(0.01)
    function toCm(n, unit) {
      // as defined in http://www.w3.org/TR/css3-values/#absolute-lengths
      if (unit === 'cm') return n;
      else if (unit === 'mm') return n*0.1;
      else if (unit === 'in') return n*2.54;
      else if (unit === 'px') return n*toCm(1/96, 'in');
      else if (unit === 'pt') return n*toCm(1/72, 'in');
      else if (unit === 'pc') return n*toCm(12, 'pt');
    }
    return function to(length, fromUnit, toUnit) {
      if (fromUnit === toUnit) return length;
      else if (toUnit === "cm") return toCm(length, fromUnit);
      else if (fromUnit === "cm") return length / toCm(1, toUnit);
      else return to(to(length, fromUnit, 'cm'), 'cm', toUnit);
    }
  })(),

  roundTo: function(n, quantum) {
    // `quantum` is something like 0.01,

    // for JS rounding to work we need the reciprocal
    quantum = 1 / quantum;
    return Math.round(n * quantum) / quantum;
  },

  detent: function(n, detent, grid, snap) {
    // This function is useful to implement smooth transitions and snapping.
    // Map all values that are within detent/2 of any multiple of grid to
    // that multiple. Otherwise, if snap is true, return self, meaning that
    // the values in the dead zone will never be returned. If snap is
    // false, then expand the range between dead zone so that it covers the
    // range between multiples of the grid, and scale the value by that
    // factor.
    // Examples:
    // // With snapping:
    // num.detent(0.11, 0.2, 0.5, true) // => 0.11
    // num.detent(0.39, 0.2, 0.5, true) // => 0.39
    // num.detent(0.55, 0.2, 0.5, true)  // => 0.5
    // num.detent(0.61, 0.2, 0.5, true)   // => 0.61
    // // Smooth transitions without snapping:
    // num.detent(0.1,  0.2, 0.5) // => 0
    // num.detent(0.11,  0.2, 0.5) // => 0.0166666
    // num.detent(0.34,  0.2, 0.5)  // => 0.4
    // num.detent(0.39,  0.2, 0.5) // => 0.4833334
    // num.detent(0.4,  0.2, 0.5) // => 0.5
    // num.detent(0.6,  0.2, 0.5) // => 0.5
    var r1 = exports.num.roundTo(n, grid); // Nearest multiple of grid
    if (Math.abs(n - r1) < detent / 2) return r1; // Snap to that multiple...
    if (snap) return n // ...and return n
    // or compute nearest end of dead zone
    var r2 = n < r1 ? r1 - (detent / 2) : r1 + (detent / 2);
    // and scale values between dead zones to fill range between multiples
    return r1 + ((n - r2) * grid / (grid - detent));
  },

  toDegrees: function(n) {
    // Example:
    // num.toDegrees(Math.PI/2) // => 90
    return (n * 180 / Math.PI) % 360;
  },

  toRadians: function(n) {
    // Example:
    // num.toRadians(180) // => 3.141592653589793
    return n / 180 * Math.PI;
  }

}

})(typeof lively !== 'undefined' && lively.lang ? lively.lang : require('./base'));
;/*
 * Util functions to print and work with JS date objects.
 */
;(function(exports) {
"use strict";

  var dateFormat = (function setupDateFormat() {

    /*
     * Date Format 1.2.3
     * (c) 2007-2009 Steven Levithan <stevenlevithan.com>
     * MIT license
     *
     * Includes enhancements by Scott Trenda <scott.trenda.net>
     * and Kris Kowal <cixar.com/~kris.kowal/>
     *
     * Accepts a date, a mask, or a date and a mask.
     * Returns a formatted version of the given date.
     * The date defaults to the current date/time.
     * The mask defaults to dateFormat.masks.default.
     */

    // http://blog.stevenlevithan.com/archives/date-time-format

    var dateFormat = (function() {
        var	token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
            timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
            timezoneClip = /[^-+\dA-Z]/g,
            pad = function (val, len) {
                val = String(val);
                len = len || 2;
                while (val.length < len) val = "0" + val;
                return val;
            };

        // Regexes and supporting functions are cached through closure
        return function (date, mask, utc) {
            var dF = dateFormat;

            // You can't provide utc if you skip other args (use the "UTC:" mask prefix)
            if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
                mask = date;
                date = undefined;
            }

            // Passing date through Date applies Date.parse, if necessary
            date = date ? new Date(date) : new Date;
            if (isNaN(date)) throw SyntaxError("invalid date");

            mask = String(dF.masks[mask] || mask || dF.masks["default"]);

            // Allow setting the utc argument via the mask
            if (mask.slice(0, 4) == "UTC:") {
                mask = mask.slice(4);
                utc = true;
            }

            var	_ = utc ? "getUTC" : "get",
                d = date[_ + "Date"](),
            D = date[_ + "Day"](),
                m = date[_ + "Month"](),
            y = date[_ + "FullYear"](),
                H = date[_ + "Hours"](),
            M = date[_ + "Minutes"](),
                s = date[_ + "Seconds"](),
            L = date[_ + "Milliseconds"](),
                o = utc ? 0 : date.getTimezoneOffset(),
                flags = {
                    d:    d,
                dd:   pad(d),
                    ddd:  dF.i18n.dayNames[D],
                    dddd: dF.i18n.dayNames[D + 7],
                    m:    m + 1,
                    mm:   pad(m + 1),
                    mmm:  dF.i18n.monthNames[m],
                    mmmm: dF.i18n.monthNames[m + 12],
                    yy:   String(y).slice(2),
                yyyy: y,
                    h:    H % 12 || 12,
                    hh:   pad(H % 12 || 12),
                    H:    H,
                HH:   pad(H),
                    M:    M,
                MM:   pad(M),
                    s:    s,
                ss:   pad(s),
                    l:    pad(L, 3),
                    L:    pad(L > 99 ? Math.round(L / 10) : L),
                    t:    H < 12 ? "a"  : "p",
                    tt:   H < 12 ? "am" : "pm",
                    T:    H < 12 ? "A"  : "P",
                    TT:   H < 12 ? "AM" : "PM",
                    Z:    utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
                    o:    (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
                    S:    ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
                };

            return mask.replace(token, function ($0) {
                return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
            });
        };
    })();

    // Some common format strings
    dateFormat.masks = {
        "default":      "ddd mmm dd yyyy HH:MM:ss",
        shortDate:      "m/d/yy",
        mediumDate:     "mmm d, yyyy",
        longDate:       "mmmm d, yyyy",
        fullDate:       "dddd, mmmm d, yyyy",
        shortTime:      "h:MM TT",
        mediumTime:     "h:MM:ss TT",
        longTime:       "h:MM:ss TT Z",
        isoDate:        "yyyy-mm-dd",
        isoTime:        "HH:MM:ss",
        isoDateTime:    "yyyy-mm-dd'T'HH:MM:ss",
        isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
    };

    // Internationalization strings
    dateFormat.i18n = {
        dayNames: [
            "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
            "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
        ],
        monthNames: [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
            "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
        ]
    };

    return dateFormat;

  })(); // end of setupDateFormat

exports.date = {

  format: (function(date, mask, utc) {
    // Custom date / time stringifier. Provides default masks:
    //
    // Mask           | Pattern
    // ---------------|--------------------------------
    // default        | `"ddd mmm dd yyyy HH:MM:ss"`
    // shortDate      | `"m/d/yy"`
    // mediumDate     | `"mmm d, yyyy"`
    // longDate       | `"mmmm d, yyyy"`
    // fullDate       | `"dddd, mmmm d, yyyy"`
    // shortTime      | `"h:MM TT"`
    // mediumTime     | `"h:MM:ss TT"`
    // longTime       | `"h:MM:ss TT Z"`
    // isoDate        | `"yyyy-mm-dd"`
    // isoTime        | `"HH:MM:ss"`
    // isoDateTime    | `"yyyy-mm-dd'T'HH:MM:ss"`
    // isoUtcDateTime | `"UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"`
    //
    // and internationalized strings via `date.format.i18n.dayNames`
    // and `date.format.i18n.dayNames`
    // Examples:
    //   date.format(new Date(), date.format.masks.longTime) // => "7:13:31 PM PDT"
    //   date.format(new Date(), "yyyy/mm/dd") // => "2014/10/09"
    return dateFormat;
  })(),

  equals: function(date, otherDate) {
    // show-in-doc
    return otherDate
      && otherDate instanceof Date
      && otherDate.getTime() === date.getTime();
  },

  relativeTo: function(date, otherDate) {
    // Prints a human readable difference of two Date objects. The older date
    // goes first.
    // Examples:
    //   var now = new Date();
    //   date.relativeTo(new Date(now-2000), now) // => "2 secs"
    //   date.relativeTo(new Date("10/11/2014"), new Date("10/12/2014")) // => "1 day"
    if (!(otherDate instanceof Date)) return '';
    if (otherDate < date) return '';
    if (otherDate === date) return 'now';
    var minuteString = 'min',
        secondString = 'sec',
        hourString   = 'hour',
        dayString    = 'day',
        diff         = otherDate - date,
        totalSecs    = Math.round(diff/1000),
        secs         = totalSecs % 60,
        mins         = Math.floor(totalSecs/60)%60,
        hours        = Math.floor(totalSecs/60/60)%24,
        days         = Math.floor(totalSecs/60/60/24),
        parts        = [];
    if (days > 0) {
      parts.push(days);
      if (days > 1) dayString += 's';
      parts.push(dayString);
    }
    if (hours > 0 && days < 2) {
      parts.push(hours);
      if (hours > 1) hourString += 's';
      parts.push(hourString);
    }
    if (mins > 0 && hours < 3 && days === 0) {
      parts.push(mins);
      if (mins > 1) minuteString += 's';
      parts.push(minuteString);
    }
    if (secs > 0 && mins < 3 && hours === 0 && days === 0) {
      parts.push(secs);
      if (secs > 1) secondString += 's';
      parts.push(secondString);
    }
    return parts.join(' ');
  }

};

})(typeof lively !== 'undefined' && lively.lang ? lively.lang : require('./base'));
;/*global process, global*/

/*
 * A lightweight class system that allows change classes at runtime.
 */

;(function(exports) {
"use strict";

var isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
var Global = typeof window !== "undefined" ? window : global;

// ignore-in-doc
var classHelper = exports.classHelper = {

  anonymousCounter: 0,

  defaultCategoryName: 'default category',

  initializerTemplate: typeof lively !== "undefined" && lively.Config && lively.Config.loadRewrittenCode ?
    (function CLASS(){ classHelper.initializer.apply(this, arguments) }).toStringRewritten().replace(/__0/g, 'Global').replace(/__1/g, '__1') :
    (function CLASS(){ classHelper.initializer.apply(this, arguments) }).toString(),

  newInitializer: function(name) {
    // ignore-in-doc
    // this hack ensures that class instances have a name
    var src = classHelper.initializerTemplate.replace(/function\s*(CLASS)?\(\)/, 'function ' + name + '()');
    if (typeof lively !== "undefined" && lively.Config && lively.Config.loadRewrittenCode) {
      var idx = src.match('.*storeFrameInfo\([^\)]*, ([0-9]+)\)')[2];
      src = '__createClosure("core/lively/Base.js", ' + idx + ', Global, ' + src + ');';
    } else src += ' ' + name;
    var initializer = eval(src);
    initializer.displayName = name;
    return initializer;
  },

  initializer: function initializer() {
    // ignore-in-doc
    var firstArg = arguments[0];
    if (firstArg && firstArg.isInstanceRestorer) {
      // for deserializing instances just do nothing
    } else {
      // automatically call the initialize method
      this.initialize.apply(this, arguments);
    }
  },

  isValidIdentifier: (function() {
    // ignore-in-doc
    // As defined in the Ecmascript standard (http://www.ecma-international.org/ecma-262/5.1/#sec-7.6)
    // JS identifiers can consist out of several unicode character classes.
    // The code below was generated using the MIT licensed CSET library, see http://inimino.org/~inimino/blog/javascript_cset
    // The code to produce the regexps:
    //
    // var specialStart = fromString('$_'),
    //   Lu = fromUnicodeGeneralCategory('Lu'),
    //   Ll = fromUnicodeGeneralCategory('Ll'),
    //   Lt = fromUnicodeGeneralCategory('Lt'),
    //   Lm = fromUnicodeGeneralCategory('Lm'),
    //   Lo = fromUnicodeGeneralCategory('Lo'),
    //   Nl = fromUnicodeGeneralCategory('Nl');
    //   joiner1 = fromString("\u200C"),
    //   joiner2 = fromString("\u200D"),
    //   Mn = fromUnicodeGeneralCategory("Mn"),
    //   Mc = fromUnicodeGeneralCategory("Mc"),
    //   Nd = fromUnicodeGeneralCategory("Nd"),
    //   Pc = fromUnicodeGeneralCategory("Pc"),
    //   startCharTester = toRegex([specialStart,Lu,Ll,Lt,Lm,Lo,Nl].reduce(union)),
    //   precedingCharTester = toRegex([specialStart, Lu,Ll,Lt,Lm,Lo,Nl, joiner1, joiner2,Mn, Mc, Nd, Pc].reduce(union));
    // console.log('var startChars = /%s/;', startCharTester);
    // console.log('var precedingCharTester = /^(?:%s)*$/;', precedingCharTester);
    var tester = /^(?!(?:do|if|in|for|let|new|try|var|case|else|enum|eval|false|null|this|true|void|with|break|catch|class|const|super|throw|while|yield|delete|export|import|public|return|static|switch|typeof|default|extends|finally|package|private|continue|debugger|function|arguments|interface|protected|implements|instanceof)$)[$A-Z\_a-z\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0\u08a2-\u08ac\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097f\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58\u0c59\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua697\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa80-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc][$A-Z\_a-z\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0\u08a2-\u08ac\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097f\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58\u0c59\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua697\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa80-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc0-9\u0300-\u036f\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u0669\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7\u06e8\u06ea-\u06ed\u06f0-\u06f9\u0711\u0730-\u074a\u07a6-\u07b0\u07c0-\u07c9\u07eb-\u07f3\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0859-\u085b\u08e4-\u08fe\u0900-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09cb-\u09cd\u09d7\u09e2\u09e3\u09e6-\u09ef\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2\u0ae3\u0ae6-\u0aef\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b62\u0b63\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c01-\u0c03\u0c3e-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0c66-\u0c6f\u0c82\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0ce6-\u0cef\u0d02\u0d03\u0d3e-\u0d44\u0d46-\u0d48\u0d4a-\u0d4d\u0d57\u0d62\u0d63\u0d66-\u0d6f\u0d82\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0df2\u0df3\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0e50-\u0e59\u0eb1\u0eb4-\u0eb9\u0ebb\u0ebc\u0ec8-\u0ecd\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e\u0f3f\u0f71-\u0f84\u0f86\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u102b-\u103e\u1040-\u1049\u1056-\u1059\u105e-\u1060\u1062-\u1064\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b4-\u17d3\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u18a9\u1920-\u192b\u1930-\u193b\u1946-\u194f\u19b0-\u19c0\u19c8\u19c9\u19d0-\u19d9\u1a17-\u1a1b\u1a55-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1b00-\u1b04\u1b34-\u1b44\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1b82\u1ba1-\u1bad\u1bb0-\u1bb9\u1be6-\u1bf3\u1c24-\u1c37\u1c40-\u1c49\u1c50-\u1c59\u1cd0-\u1cd2\u1cd4-\u1ce8\u1ced\u1cf2-\u1cf4\u1dc0-\u1de6\u1dfc-\u1dff\u200c\u200d\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2cef-\u2cf1\u2d7f\u2de0-\u2dff\u302a-\u302f\u3099\u309a\ua620-\ua629\ua66f\ua674-\ua67d\ua69f\ua6f0\ua6f1\ua802\ua806\ua80b\ua823-\ua827\ua880\ua881\ua8b4-\ua8c4\ua8d0-\ua8d9\ua8e0-\ua8f1\ua900-\ua909\ua926-\ua92d\ua947-\ua953\ua980-\ua983\ua9b3-\ua9c0\ua9d0-\ua9d9\uaa29-\uaa36\uaa43\uaa4c\uaa4d\uaa50-\uaa59\uaa7b\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uaaeb-\uaaef\uaaf5\uaaf6\uabe3-\uabea\uabec\uabed\uabf0-\uabf9\ufb1e\ufe00-\ufe0f\ufe20-\ufe26\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f]*$/
    return function(string) { return tester.test(string); }
  })(),

  isClass: function(object) {
    if (object === Object
      || object === Array
      || object === Function
      || object === String
      || object === Boolean
      || object === Date
      || object === RegExp
      || object === Number) {
      return true;
    }
    return (object instanceof Function) && (object.superclass !== undefined);
  },

  className: function(cl) {
    if (cl === Object) return "Object"
    if (cl === Array) return "Array"
    if (cl === Function) return "Function"
    if (cl === String) return "String"
    if (cl === Boolean) return "Boolean"
    if (cl === Date) return "Date"
    if (cl === RegExp) return "RegExp"
    if (cl === Number) return "Number"
    return cl.type;
  },

  forName: function forName(name) {
    // ignore-in-doc
    // lookup the class object given the qualified name
    var ns = classHelper.namespaceFor(name),
      shortName = classHelper.unqualifiedNameFor(name);
    return ns[shortName];
  },

  deleteObjectNamed: function(name) {
    var ns = classHelper.namespaceFor(name),
      shortName = classHelper.unqualifiedNameFor(name);
    delete ns[shortName];
  },

  unqualifiedNameFor: function(name) {
    // ignore-in-doc
    var lastDot = name.lastIndexOf('.'), // lastDot may be -1
        unqualifiedName = name.substring(lastDot + 1);
    if (!classHelper.isValidIdentifier(unqualifiedName)) throw new Error('not a name ' + unqualifiedName);
    return unqualifiedName;
  },

  namespaceFor: function(className) {
    // ignore-in-doc
    // get the namespace object given the qualified name
    var lastDot = className ? className.lastIndexOf('.') : -1;
    if (lastDot < 0) return Global;
    var nsName = className.slice(0, lastDot);
    if (typeof lively !== "undefined" && lively.module) return lively.module(nsName);
    var path = exports.Path(nsName),
        ns = path.get(Global);
    return ns || path.set(Global, {}, true);
  },

  withAllClassNames: function(scope, callback) {
    for (var name in scope) {
      try {
        if (classHelper.isClass(scope[name])) callback(name);
      } catch (er) { /*FF exceptions*/ }
    }
    callback("Object");
    callback("Global");
  },

  getConstructor: function(object) {
    var c = object.constructor;
    return (c && c.getOriginal) ? c.getOriginal() : c;
  },

  getPrototype: function(object) {
    return this.getConstructor(object).prototype;
  },

  applyPrototypeMethod: function(methodName, target, args) {
    var method = this.getPrototype(target);
    if (!method) throw new Error("method " + methodName + " not found");
    return method.apply(this, args);
  },

  getSuperConstructor: function(object) {
    return this.getConstructor(object).superclass;
  },

  getSuperPrototype: function(object) {
    var sup = this.getSuperConstructor(object);
    return sup && sup.prototype;
  },

  addPins: function(cls, spec) {
    // ignore-in-doc
    if (Global.Relay) {
      classHelper.addMixin(cls, Relay.newDelegationMixin(spec).prototype);
      return;
    }
    // ignore-in-doc
    // this is for refactoring away from Relay and friends
    if (!Object.isArray(spec)) throw new Error('Cannot deal with non-Array spec in addPins');
    function unstripName(name) { return name.replace(/[\+|\-]?(.*)/, '$1') };
    function needsSetter(name) { return !exports.string.startsWith(name, '-') };
    function needsGetter(name) { return !exports.string.startsWith(name, '+') };
    var mixinSpec = {};
    spec.forEach(function(specString) {
      var name = unstripName(specString);
      if (needsSetter(specString))
        mixinSpec['set' + name] = function(value) { return this['_' + name] = value }
      if (needsGetter(specString))
        mixinSpec['get' + name] = function() { return this['_' + name] }
    })
    classHelper.addMixin(cls, mixinSpec);
  },

  addMixin: function(cls, source) {
    var spec = {};
    for (var prop in source) {
      var value = source[prop];
      switch (prop) {
        case "constructor": case "initialize": case "deserialize": case "copyFrom":
        case "toString": case "definition": case "description":
          break;
        default:
          if (cls.prototype[prop] === undefined) // do not override existing values!
            spec[prop] = value;
      }
    }
    cls.addMethods(spec);
  }

};

// Methods for creating and modifying class objects.
exports.class
= {

  create: function(/*... */) {
    // Main method of the class system.
    // First argument can be the superclass or if no super class is specified
    // Object is the superclass. Second arg is the class name. The following
    // argument can be a JavaScript object whose keys and values will be
    // installed as attributes/methods of the class.
    // 
    // Note that when a class with the same name already exists it will be
    // modified so that interactive development is possible. To completely
    // remove a class use `lively.lang.class.remove(TheClass)`
    // Example:
    // lively.lang.class.create("NewClass", {
    //   method: function() { return 23; }
    // });
    // var instance = new NewClass();
    // instance.method() // => 23
    // //
    // // Alternatively class with superclass as first argument
    // lively.lang.class.create(NewClass, "NewClass2", {
    //   method: function($super) { return $super() + 2; }
    // });
    // var instance = new NewClass2();
    // instance.method() // => 25

    var args = exports.arr.from(arguments),
        superclass = args.shift(),
        className,
        targetScope = Global,
        shortName = null;

    if (!superclass || typeof superclass === "string") {
      className = superclass;
      superclass = Object;
    } else className = args.shift();

    if (className) {
      targetScope = classHelper.namespaceFor(className);
      shortName = classHelper.unqualifiedNameFor(className);
    }  else {
      shortName = "anonymous_" + (classHelper.anonymousCounter++);
      className = shortName;
    }

    var klass;
    if (className && targetScope[shortName] && (targetScope[shortName].superclass === superclass)) {
      // preserve the class to allow using the subclass construct in interactive development
      klass = targetScope[shortName];
    } else {
      klass = classHelper.newInitializer(shortName);
      klass.superclass = superclass;
      var protoclass = function() { }; // that's the constructor of the new prototype object
      protoclass.prototype = superclass.prototype;
      klass.prototype = new protoclass();
      klass.prototype.constructor = klass;
      klass.type = className; // KP: .name would be better but js ignores .name on anonymous functions
      klass.displayName = className; // for debugging, because name can not be assigned
      if (className) targetScope[shortName] = klass; // otherwise it's anonymous

      // remember the module that contains the class def
      if (typeof lively !== "undefined" && lively.Module && lively.Module.current)
        klass.sourceModule = lively.Module.current();

      // add a more appropriate toString implementation
      klass.toString = function() {
        var initCategory = exports.arr.detect(
                            Object.keys(klass.categories || {}),
                            function(category) {
                              return klass.categories[category].indexOf("initialize") > -1;
                            }) || "default category";
        return exports.string.format(
          'lively.lang.class.create(%s, "%s",\n"%s", {\n  initialize: %s\n}/*...*/)',
          klass.superclass.type || klass.superclass.name,
          klass.type, initCategory,
          klass.prototype.initialize);
      }
    };

    // the remaining args should be category strings or source objects
    exports.class.addMethods.apply(Global, [klass].concat(args));

    if (!klass.prototype.initialize)
      klass.prototype.initialize = function() {};

    return klass;
  },

  addMethods: function(/*...*/) {
    // Takes an exiting class and adds/replaces its methods by the supplied JS
    // object.

    var klass = arguments[0],
        args = arguments,
        category = classHelper.defaultCategoryName,
        traits = [];
    for (var i = 1; i < args.length; i++) {
      if (typeof args[i] === 'string') {
        category = args[i];
      } else if (Global.RealTrait && args[i] instanceof RealTrait) {
        // FIXME Traits are optional and defined in lively.Traits
        // This should go somewhere into lively.Traits...
        // we apply traits afterwards because they can override behavior
        traits.push(args[i]);
      } else {
        exports.class.addCategorizedMethods(klass, category,
          args[i] instanceof Function ? (args[i])() : args[i]);
      }
    }
    for (i = 0; i < traits.length; i++) traits[i].applyTo(klass);

    return klass;
  },

  addCategorizedMethods: function(klass, categoryName, source) {
    // first parameter is a category name
    // copy all the methods and properties from {source} into the
    // prototype property of the receiver, which is intended to be
    // a class constructor.    Method arguments named '$super' are treated
    // specially, see Prototype.js documentation for "classHelper.create()" for details.
    // derived from classHelper.Methods.addMethods() in prototype.js

    // prepare the categories
    if (!klass.categories) klass.categories = {};
    if (!klass.categories[categoryName]) klass.categories[categoryName] = [];
    var currentCategoryNames = klass.categories[categoryName];

    if (!source)
      throw dbgOn(new Error('no source in addCategorizedMethods!'));

    var ancestor = klass.superclass && klass.superclass.prototype;

    var className = klass.type || "Anonymous";

    for (var property in source) {

      if (property === 'constructor') continue;

      var getter = source.__lookupGetter__(property);
      if (getter) klass.prototype.__defineGetter__(property, getter);
      var setter = source.__lookupSetter__(property);
      if (setter) klass.prototype.__defineSetter__(property, setter);
      if (getter || setter) continue;

      currentCategoryNames.push(property);

      var value = source[property];
      // weirdly, RegExps are functions in Safari, so testing for
      // Object.isFunction on regexp field values will return true.
      // But they're not full-blown functions and don't
      // inherit argumentNames from Function.prototype

      var hasSuperCall = ancestor && typeof value === 'function' &&
          exports.fun.argumentNames(value)[0] == "$super";
      if (hasSuperCall) {
        // wrapped in a function to save the value of 'method' for advice
        (function() {
          var method = value;
          var advice = (function(m) {
            var cs = function callSuper() {
              var method = ancestor[m];
              if (!method) {
                throw new Error(exports.string.format('Trying to call super of' +
                  '%s>>%s but super method non existing in %s',
                  className, m, ancestor.constructor.type));
              }
              return method.apply(this, arguments);
            };
            cs.varMapping = {ancestor: ancestor, m: m};
            cs.isSuperCall = true;
            return cs;
          })(property);
  
          advice.methodName = "$super:" + (klass.superclass ? klass.superclass.type + ">>" : "") + property;
  
          value = exports.obj.extend(exports.fun.wrap(advice, method), {
            valueOf:  function() { return method; },
            toString: function() { return method.toString(); },
            originalFunction: method,
            methodName: advice.methodName,
            isSuperWrapper: true
          });
          // for lively.Closures
          method.varMapping = {$super: advice};
        })();
      }

      klass.prototype[property] = value;

      if (property === "formals") { // rk FIXME remove the cruft
        // special property (used to be pins, but now called formals to disambiguate old and new style
        classHelper.addPins(klass, value);
      } else if (typeof value === 'function') {
        // remember name for profiling in WebKit
        value.displayName = className + "$" + property;

        // remember where it was defined
        if (typeof lively !== "undefined" && lively.Module && lively.Module.current)
          value.sourceModule = lively.Module.current();

        for (; value; value = value.originalFunction) {
          value.declaredClass = klass.prototype.constructor.type;
          value.methodName = property;
        }
      }
    } // end of for (var property in source)

    return klass;
  },

  addProperties: function(klass, spec, recordType) {
    // ignore-in-doc
    classHelper.addMixin(klass, recordType.prototype.create(spec).prototype);
  },

  isSubclassOf: function(klassA, klassB) {
    // Is `klassA` a descendent of klassB?
    return exports.class.superclasses(klassA).indexOf(klassB) > -1;
  },

  superclasses: function(klass) {
    // show-in-doc
    if (!klass.superclass) return [];
    if (klass.superclass === Object) return [Object];
    return exports.class.superclasses(klass.superclass).concat([klass.superclass]);
  },

  categoryNameFor: function(klass, propName) {
    // ignore-in-doc
    for (var categoryName in klass.categories) {
      if (klass.categories[categoryName].indexOf(propName) > -1)
        return categoryName;
    }
    return null;
  },

  remove: function(klass) {
    // Remove `klass`, modifies the namespace the class is installed in.
    var ownerNamespace = classHelper.namespaceFor(klass.type),
        ownName = classHelper.unqualifiedNameFor(klass.type);
    delete ownerNamespace[ownName];
  }
}

})(typeof lively !== 'undefined' && lively.lang ? lively.lang : require('./base'));
;/*global clearTimeout, setTimeout, clearInterval, setInterval*/

/*
 * A pluggable interface to provide asynchronous, actor-like message
 * communication between JavaScript systems. Provides a unified message protocol
 * and send / receive methods.
 */
;(function(exports) {
"use strict";

var arr = exports.arr;
if (!arr) throw new Error("messenger.js needs collection.js!")

var fun = exports.fun;
if (!fun) throw new Error("messenger.js needs function.js!")

var string = exports.string;
if (!string) throw new Error("messenger.js needs string.js!")

var events = exports.events;
if (!events) throw new Error("messenger.js needs events.js!")

var obj = exports.obj;
if (!obj) throw new Error("messenger.js needs object.js!")

var OFFLINE = 'offline';
var ONLINE = 'online';
var CONNECTING = 'connecting';

/*

A messenger is an object that provides a common, message-based interface. Messengers expect you to provide an implementation of a small number of methods: `send`, `listen`, `close`, and `isOnline`. A messenger will then provide a unified interface for sending and receiving messages. Common boilerplate functionality such as queuing messages, error handling, dealing with instable connections, heartbeats, etc. is handled by the messenger object automatically (and can be parameterized).

This allows to use a single interface across a range of heterogeneous objects without having to implement every detail of the abstraction repeatedly. This is especially valuable when dealing with asynchronous or remote communication (web workers, XHR requests, WebSockets, node.js processes, ...).

To see a minimal example of how to use messengers for the local communication between JavaScript objects [see this example](#messenger-example).

A more sophisticated example of messengers is [the worker implementation](worker.js) which provides an actor-like worker interface that uses web workers in web browsers and child_process.fork in node.js.

```js
var msger = lively.lang.messenger.create({
  send: function(msg, onSendDone) { console.log(msg); onSendDone(); },
  listen: function(thenDo) { thenDo(); },
  close: function(thenDo) { thenDo(); },
  isOnline: function() { return true }
});
```

#### Messenger interface

The interface methods are build to enable an user to send and receive
messages. Each messenger provides the following methods:

##### msger.id()

Each msger has an id that can either be defined by the user when the
msger is created or is automatically assigned. The id should be unique for each
messenger in a messenger network. It is used as the `target` attribute to
address messages and internally in the messaging implementation for routing.
See the [message protocol](#messenger-message-protocol) description for more info.

##### msger.isOnline()

Can the msger send and receive messages right now?

##### msger.heartbeatEnabled()

Does the msger send automated heartbeat messages?

##### msger.listen(optionalCallback)

Brings the messenger "online": Starts listening for messages and brings it
into a state to send messages. `optionalCallback` is a function that is called
when listening begins. It should accept one argument `error` that is null if no
error occured when listening was started, an Error object otherwise.

##### msger.send(msg, onReceiveFunc)

Sends a message. The message should be structured according to the [message
protocol](#messenger-message-protocol). `onReceiveFunc` is triggered when the `msg` is being
answered. `onReceiveFunc` should take two arguments: `error` and `answer`.
`answer` is itself a message object.

##### msger.sendTo(target, action, data, onReceiveFunc)

A simpler `send`, the `msg` object is automatically assembled. `target`
should be an id of the receiver and `action` a string naming the service that
should be triggered on the receiver.

##### msger.answer(msg, data, expectMore, whenSend)

Assembles an answer message for `msg` that includes `data`. `expectMore`
should be truthy when multiple answers should be send (a streaming response,
see the [messaging protocol](#messenger-message-protocol)).

##### msger.close(thenDo)

Stops listening.

##### msger.whenOnline(thenDo)

Registers a callback that is triggered as soon as a listen attempt succeeds
(or when the messenger is listening already then it succeeds immediately).

##### msger.outgoingMessages()

Returns the messages that are currently inflight or not yet send.

##### msger.addServices(serviceSpec)

Add services to the messenger. `serviceSpec` should be  JS object whose keys
correspond to message actions:

```js
msg.addServices({
  helloWorld: function(msg, messenger) {
    messenger.answer(msg, "received a message!");
  }
});
```

See the examples below for more information.

##### *[event]* msger.on("message")

To allow users to receive messages that were not initiated by a send,
messengers are [event emitters](events.js) that emit `"message"` events
whenever they receive a new message.

The messenger object is used to create new messenger interfaces and ties
them to a specific implementation. Please see [worker.js]() for examples of
how web workers and node.js processes are wrapped to provide a cross-platform
interface to a worker abstraction.


#### <a name="messenger-message-protocol"></a>Message protocol

A message is a JSON object with the following fields:

```js
var messageSchema = {

    // REQUIRED selector for service lookup. By convention action gets
    // postfixed with "Result" for response messages
    action: STRING,

    // REQUIRED target of the message, the id of the receiver
    target: UUID,

    // OPTIONAL arguments
    data: OBJECT,

    // OPTIONAL identifier of the message, will be provided if not set by user
    messageId: UUID,

    // OPTIONAL sender of the message, will be provided if not set by user
    sender: UUID,

    // OPTIONAL identifier of a message that this message answers, will be provided
    inResponseTo: UUID,

    // OPTIONAL if message is an answer. Can be interpreted by the receiver as
    // a streaming response. Lively participants (tracker and clients) will
    // trigger data bindings and fire callbacks for a message for every streaming
    // response
    expectMoreResponses: BOOL,

    // EXPERIMENTAL UUIDs of trackers/sessions handlers that forwarded this
    // message
    route: ARRAY
}
```

The `sendTo` and `answer` methods of messengers will automatically create these
messages. If the user invokes the `send` method then a JS object according to
the schema above should be passed as the first argument.

#### <a name="messenger-example"></a>Messenger examples

The following code implements what is needed to use a messenger to communicate
between any number of local JavaScript objects. Instead of dispatching methods using
a local list of messengers you will most likely use an existing networking /
messaging mechanism.

See the [worker](#) and [its implementation](worker.js) for a real use case in
which forking processes in the browser using Web Workers and in node.js using
child_process.fork is unified.

```js
// spec that defines message sending in terms of receivers in the messengers list
var messengers = [];
var messengerSpec = {
  send: function(msg, onSendDone) {
    var err = null, recv = arr.detect(messengers, function(ea) {
          return ea.id() === msg.target; });
    if (recv) recv.onMessage(msg);
    else err = new Error("Could not find receiver " + msg.target);
    onSendDone(err);
  },
  listen: function(thenDo) { arr.pushIfNotIncluded(messengers, this); },
  close: function(thenDo) { arr.remove(messengers, this); },
  isOnline: function() { return arr.include(messengers, this); }
};

// Create the messengers and add a simple "service"
var msger1 = messenger.create(messengerSpec);
var msger2 = messenger.create(messengerSpec);
msger2.addServices({
  add: function(msg, msger) { msger.answer(msg, {result: msg.data.a + msg.data.b}); }
});

// turn'em on...
msger1.listen();
msger2.listen();

// ...and action!
msger1.sendTo(msger2.id(), 'add', {a: 3, b: 4},
  function(err, answer) { alert(answer.data.result); });
```

*/


var messenger = exports.messenger = {
  
  OFFLINE: OFFLINE,
  ONLINE: ONLINE,
  CONNECTING: CONNECTING,

  create: function(spec) {

    var expectedMethods = [
      {name: "send", args: ['msg', 'callback']},
      {name: "listen", args: ['messenger', 'callback']},
      {name: "close", args: ['messenger', 'callback']},
      {name: "isOnline", args: []}
    ];
    expectedMethods.forEach(function(exp) {
      if (spec[exp.name]) return;
        var msg = "message implementation needs function "
                + exp.name + "(" + (exp.args.join(',')) + ")";
        throw new Error(msg);
    });

    var heartbeatInterval = spec.sendHeartbeat && (spec.heartbeatInterval || 1000);
    var ignoreUnknownMessages = spec.hasOwnProperty("ignoreUnknownMessages") ? spec.ignoreUnknownMessages : false;

    var messenger = {

      _outgoing: [],
      _inflight: [],
      _id: spec.id || string.newUUID(),
      _ignoreUnknownMessages: ignoreUnknownMessages,
      _services: {},
      _messageCounter: 0,
      _messageResponseCallbacks: {},
      _whenOnlineCallbacks: [],
      _statusWatcherProc: null,
      _startHeartbeatProcessProc: null,
      _listenInProgress: null,
      _heartbeatInterval: heartbeatInterval,
      _status: OFFLINE,

      // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
      _runWhenOnlineCallbacks: function() {
        var cbs = arr.clone(messenger._whenOnlineCallbacks);
        messenger._whenOnlineCallbacks = [];
        cbs.forEach(function(ea) {
          try { ea.call(null, null, messenger); } catch (e) {
            console.error("error in _runWhenOnlineCallbacks: %s", e);
          }
        });
      },

      _ensureStatusWatcher: function() {
        if (messenger._statusWatcherProc) return;
        messenger._statusWatcherProc = setInterval(function() {
          if (messenger.isOnline() && messenger._whenOnlineCallbacks.length)
            messenger._runWhenOnlineCallbacks();
          var prevStatus = messenger._status;
          messenger._status = messenger.isOnline() ? ONLINE : OFFLINE;
          if (messenger._status !== ONLINE && messenger._statusWatcherProc) {
            messenger.reconnect();
          }
          if (messenger._status !== prevStatus && messenger.onStatusChange) {
            messenger.onStatusChange();
          }
        }, 20);
      },

      _addMissingData: function(msg) {
        if (!msg.target) throw new Error("Message needs target!");
        if (!msg.action) throw new Error("Message needs action!");
        if (!msg.data) msg.data = null;
        if (!msg.messageId) msg.messageId = string.newUUID();
        msg.sender = messenger.id();
        msg.messageIndex = messenger._messageCounter++;
        return msg;
      },

      _queueSend: function(msg, onReceiveFunc) {
        if (onReceiveFunc && typeof onReceiveFunc !== 'function')
          throw new Error("Expecing a when send callback, got: " + onReceiveFunc);
        messenger._outgoing.push([msg, onReceiveFunc]);
      },

      _deliverMessageQueue: function() {
        if (!spec.allowConcurrentSends && messenger._inflight.length) return;

        var queued = messenger._outgoing.shift();
        if (!queued) return;

        messenger._inflight.push(queued);
        if (messenger.isOnline()) deliver(queued);
        else messenger.whenOnline(function() { deliver(queued); });
        startTimeoutProc(queued);

        if (spec.allowConcurrentSends && messenger._outgoing.length)
          messenger._deliverMessageQueue();

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

        function deliver(queued) {
          if (messenger._inflight.indexOf(queued) === -1) return; // timed out
          var msg = queued[0], callback = queued[1];
          if (callback)
            messenger._messageResponseCallbacks[msg.messageId] = callback;

          spec.send.call(messenger, msg, function(err) {
            arr.remove(messenger._inflight, queued);
            if (err) onSendError(err, queued);
            messenger._deliverMessageQueue();
          });
        }

        function startTimeoutProc(queued) {
          if (typeof spec.sendTimeout !== 'number') return;
          setTimeout(function() {
            if (messenger._inflight.indexOf(queued) === -1) return; // delivered
            arr.remove(messenger._inflight, queued);
            onSendError(new Error('Timeout sending message'), queued);
            messenger._deliverMessageQueue();
          }, spec.sendTimeout);
        }

        function onSendError(err, queued) {
          var msg = queued[0], callback = queued[1];
          delete messenger._messageResponseCallbacks[msg.messageId];
          console.error(err);
          callback && callback(err);
        }
      },

      _startHeartbeatProcess: function() {
        if (messenger._startHeartbeatProcessProc) return;
        messenger._startHeartbeatProcessProc = setTimeout(function() {
          spec.sendHeartbeat.call(messenger, function(err, result) {
            messenger._startHeartbeatProcessProc = null;
            messenger._startHeartbeatProcess();
          })
        }, messenger._heartbeatInterval);
      },

      // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

      id: function() { return messenger._id; },

      isOnline: function() { return spec.isOnline.call(messenger); },

      heartbeatEnabled: function() {
        return typeof messenger._heartbeatInterval === 'number';
      },

      listen: function(thenDo) {
        if (messenger._listenInProgress) return;
        messenger._listenInProgress = true;
        messenger._ensureStatusWatcher();
        return spec.listen.call(messenger, function(err) {
          messenger._listenInProgress = null;
          thenDo && thenDo(err);
          if (messenger.heartbeatEnabled())
            messenger._startHeartbeatProcess();
        });
        return messenger;
      },

      reconnect: function() {
        if (messenger._status === ONLINE) return;
        messenger.listen();
        return messenger;
      },

      send: function(msg, onReceiveFunc) {
        messenger._addMissingData(msg);
        messenger._queueSend(msg, onReceiveFunc);
        messenger._deliverMessageQueue();
        return msg;
      },

      sendTo: function(target, action, data, onReceiveFunc) {
        var msg = {target: target, action: action, data: data};
        return messenger.send(msg, onReceiveFunc);
      },

      onMessage: function(msg) {
        messenger.emit("message", msg);
        if (msg.inResponseTo) {
          var cb = messenger._messageResponseCallbacks[msg.inResponseTo];
          if (cb && !msg.expectMoreResponses) delete messenger._messageResponseCallbacks[msg.inResponseTo];
          if (cb) cb(null, msg);
        } else {
          var action = messenger._services[msg.action];
          if (action) {
            try {
              action.call(null, msg, messenger);
            } catch (e) {
              console.error("Error invoking service: " + e);
              messenger.answer(msg, {error: String(e)});
            }
          } else if (!messenger._ignoreUnknownMessages) {
            var err = new Error("messageNotUnderstood: " + msg.action);
            messenger.answer(msg, {error: String(err)});
          }
        }
      },

      answer: function(msg, data, expectMore, whenSend) {
        if (typeof expectMore === 'function') {
          whenSend = expectMore; expectMore = false; }
        var answer = {
          target: msg.sender,
          action: msg.action + 'Result',
          inResponseTo: msg.messageId,
          data: data};
        if (expectMore) answer.expectMoreResponses = true;
        return messenger.send(answer, whenSend);
      },

      close: function(thenDo) {
        clearInterval(messenger._statusWatcherProc);
        messenger._statusWatcherProc = null;
        spec.close.call(messenger, function(err) {
          messenger._status = OFFLINE;
          thenDo && thenDo(err);
        });
        return messenger;
      },

      whenOnline: function(thenDo) {
        messenger._whenOnlineCallbacks.push(thenDo);
        if (messenger.isOnline()) messenger._runWhenOnlineCallbacks();
        return messenger;
      },

      outgoingMessages: function() {
        return arr.pluck(messenger._inflight.concat(messenger._outgoing), 0);
      },

      addServices: function(serviceSpec) {
        obj.extend(messenger._services, serviceSpec);
        return messenger;
      }
    }

    if (spec.services) messenger.addServices(spec.services);
    events.makeEmitter(messenger);

    return messenger;
  }

};

})(typeof lively !== 'undefined' && lively.lang ? lively.lang : require('./base'));
;/*global require, Worker, URL, webkitURL, Blob, BlobBuilder, process, require*/

/*
 * A platform-independent worker interface that will spawn new processes per
 * worker (if the platform you use it on supports it).
 */
;(function(exports) {
"use strict";

var isNodejs = typeof module !== 'undefined' && module.require;

// ignore-in-doc
// Code in worker setup is evaluated in the context of workers, it will get to
// workers in a stringified form(!).
var WorkerSetup = {

  loadDependenciesBrowser: function loadDependenciesBrowser(options) {
    importScripts.apply(this, options.scriptsToLoad || []);
  },

  loadDependenciesNodejs: function loadDependenciesNodejs(options) {
    var lv = global.lively || (global.lively = {});
    lv.lang = require(require("path").join(options.libLocation, "index"));
  },

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // yoshiki and robert, 05/08/13: Inserted code that sets up the lively context
  // and globals of Lively and other required objects:
  initBrowserGlobals: function initBrowserGlobals(options) {
    remoteWorker.send = function(msg) { postMessage(msg); };
    Global = this;
    Global.window = Global;
    Global.console = Global.console || (function() {
      var c = {};
      ['log', 'error', 'warn'].forEach(function(name) {
        c[name] = function(/*args*/) {
          var string = arguments[0];
          for (var i = 1; i < arguments.length; i++)
            string = string.replace('%s', arguments[i]);
          remoteWorker.send({
            type: name,
            message: ['[', name.toUpperCase(), '] ', string].join('')
          });
        };
      });
      return c;
    })();
  },

  initOnMessageHandler: function initOnMessageHandler(options) {
    if (remoteWorker.on) remoteWorker.on('message', onMessage);
    else remoteWorker.onmessage = onMessage;

    function onMessage(msg) {
      msg = msg.data.data ? msg.data : msg;
      if (remoteWorker.messenger) remoteWorker.messenger.onMessage(msg);
      else if (msg.action == "close") {
        remoteWorker.send({type: "closed", workerReady: false});
        remoteWorker.close();
        return;
      }
    }
  },

  initWorkerInterface: function initWorkerInterface(options) {
    remoteWorker.callStringifiedFunction = function(stringifiedFunc, args, thenDo) {
      // ignore-in-doc
      // runs stringified function and passing args. stringifiedFunc might
      // be asynchronous if it takes an addaitional argument. In this case a
      // callback to call when the work is done is passed, otherwise thenDo
      // will be called immediatelly after creating and calling the function

      var func;
      try { func = eval('(' + stringifiedFunc + ')'); } catch (e) {
        thenDo(new Error("Cannot create function from string: " + e.stack || e));
        return;
      }

      // ignore-in-doc
      // when it takes one more arg then we assume that this is the callback
      // to be called by the run func when it considers to be done
      var usesCallback = func.length === args.length + 1;
      var whenDone = lively.lang.fun.once(function(err, result) {
        remoteWorker.isBusy = false; thenDo(err, result); })
      remoteWorker.isBusy = true;

      if (usesCallback) args.push(whenDone);

      try { var result = func.apply(remoteWorker, args.concat([whenDone])); } catch (e) {
        whenDone(e, null); return;
      }

      if (!usesCallback) whenDone(null, result);
    }

    remoteWorker.httpRequest = function (options) {
      if (!options.url) {
        console.log("Error, httpRequest needs url");
        return;
      }
      var req = new XMLHttpRequest(),
          method = options.method || 'GET';
      function handleStateChange() {
        if (req.readyState === 4) {
          // req.status
          options.done && options.done(req);
        }
      }
      req.onreadystatechange = handleStateChange;
      req.open(method, options.url);
      req.send();
    }

    remoteWorker.terminateIfNotBusyIn = function(ms) {
      setTimeout(function() {
        if (remoteWorker.isBusy) { remoteWorker.terminateIfNotBusyIn(ms); return; }
        remoteWorker.send({type: "closed", workerReady: false});
        remoteWorker.close();
      }, ms);
    }
  },

  // ignore-in-doc
  // setting up the worker messenger interface, this is how the worker
  // should be communicated with
  initWorkerMessenger: function initWorkerMessenger(options) {
    if (!options.useMessenger) return null;
    if (!lively.lang.messenger)
      throw new Error("worker.create requires messenger.js to be loaded!")
    if (!lively.lang.events)
      throw new Error("worker.create requires events.js to be loaded!")

    return remoteWorker.messenger = lively.lang.messenger.create({
      services: {

        remoteEval: function(msg, messenger) {
          var result;
          try { result = eval(msg.data.expr); } catch (e) {
            result = e.stack || e; }
          messenger.answer(msg, {result: String(result)});
        },

        run: function(msg, messenger) {
          var funcString = msg.data.func,
              args = msg.data.args;
          if (!funcString) { messenger.answer(msg, {error: 'no funcString'}); return; }
          remoteWorker.callStringifiedFunction(funcString, args, function(err, result) {
            messenger.answer(msg, {error: err ? String(err) : null, result: result});
          });
        },

        close: function(msg, messenger) {
          messenger.answer(msg, {status: "OK"});
          remoteWorker.send({type: "closed", workerReady: false});
          remoteWorker.close();
        }
      },

      isOnline: function() { return true; },
      send: function(msg, whenSend) { remoteWorker.send(msg); whenSend(); },
      listen: function(whenListening) { whenListening(); },
      close: function(whenClosed) { remoteWorker.send({type: "closed", workerReady: false}); remoteWorker.close(); }

    });
  }

}

var BrowserWorker = {

  create: function(options) {
    // ignore-in-doc
    // this function instantiates a browser worker object. We provide a
    // messenger-based interface to the pure Worker. Please use create to get an
    // improved interface to a worker

    options = options || {};

    // ignore-in-doc
    // figure out where the other lang libs can be loaded from
    if (!options.libLocation && !options.scriptsToLoad) {
      var workerScript = document.querySelector("script[src$=\"worker.js\"]");
      if (!workerScript) throw new Error("Cannot find library path to start worker. Use worker.create({libLocation: \"...\"}) to explicitly define the path!");
      options.libLocation = workerScript.src.replace(/worker.js$/, '');
    }

    var workerSetupCode = String(workerSetupFunction).replace("__FUNCTIONDECLARATIONS__", [
      WorkerSetup.initBrowserGlobals,
      WorkerSetup.loadDependenciesBrowser,
      WorkerSetup.initOnMessageHandler,
      WorkerSetup.initWorkerInterface,
      WorkerSetup.initWorkerMessenger
    ].join('\n'));
    var workerCode = '(' + workerSetupCode + ')();';
    var worker = new Worker(makeDataURI(workerCode));
    init(options, worker);
    return worker;

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

    // ignore-in-doc
    // This code is triggered in the UI process directly after the
    // creation of the worker and sends the setup message to the worker
    // for initializing it.
    function init(options, worker) {
      exports.events.makeEmitter(worker);

      if (!options.scriptsToLoad) {
        options.scriptsToLoad = [
          'base.js',
          'events.js',
          'object.js',
          'collection.js',
          'function.js',
          'string.js',
          'number.js',
          'date.js',
          'messenger.js',
          'worker.js'].map(function(ea) {
            return options.libLocation + ea; });
      }

      var workerOptions = Object.keys(options).reduce(function(opts, key) {
        if (typeof options[key] !== 'function') opts[key] = options[key];
        return opts;
      }, {});

      worker.onmessage = function(evt) {
        if (evt.data.workerReady !== undefined) {
          worker.ready = !!evt.data.workerReady;
          if (worker.ready) worker.emit("ready");
          else worker.emit("close");
        } else worker.emit('message', evt.data);
      }

      worker.errors = [];
      worker.onerror = function(evt) {
        console.error(evt);
        worker.errors.push(evt);
        worker.emit("error", evt)
      }

      worker.postMessage({action: 'setup', options: workerOptions});
    }

    // ignore-in-doc
    // This code is run inside the worker and bootstraps the messenger
    // interface. It also installs a console.log method since since this is not
    // available by default.
    function workerSetupFunction() {
      var remoteWorker = self;
      remoteWorker.onmessage = function(evt) {
        if (evt.data.action !== "setup") {
          throw new Error("expected setup to be first message but got " + JSON.stringify(evt.data))
        }
        var options = evt.data.options || {};
        initBrowserGlobals(options);
        loadDependenciesBrowser(options);
        initOnMessageHandler(options);
        initWorkerInterface(options);
        initWorkerMessenger(options);
        postMessage({workerReady: true});
      }
      __FUNCTIONDECLARATIONS__
    }

    function makeDataURI(codeToInclude) {
      // ignore-in-doc
      // see http://stackoverflow.com/questions/10343913/how-to-create-a-web-worker-from-a-string
      var blob;
      try {
        blob = new Blob([codeToInclude], {type : "text/javascript"});
      } catch (e) { /* ignore-in-doc Backwards-compatibility*/
        window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
        blob = new BlobBuilder();
        blob.append(codeToInclude);
        blob = blob.getBlob();
      }
      var urlInterface = typeof webkitURL !== 'undefined' ? webkitURL : URL;
      return urlInterface.createObjectURL(blob);
    }

  }

}

var NodejsWorker = {

  debug: false,
  initCodeFileCreated: false,

  create: function(options) {
    options = options || {};

    // ignore-in-doc
    // figure out where the other lang libs can be loaded from
    // if (!options.libLocation && !options.scriptsToLoad) {
    //   var workerScript = document.querySelector("script[src$=\"worker.js\"]");
    //   if (!workerScript) throw new Error("Cannot find library path to start worker. Use worker.create({libLocation: \"...\"}) to explicitly define the path!");
    //   options.libLocation = workerScript.src.replace(/worker.js$/, '');
    // }

    var workerProc;
    var worker = exports.events.makeEmitter({
      ready: false,
      errors: [],

      postMessage: function(msg) {
        if (!workerProc) {
          worker.emit("error", new Error('nodejs worker process not yet created'));
          return;
        }
        if (!worker.ready) {
          worker.emit("error", new Error('nodejs worker process not ready or already closed'));
          return;
        }
        workerProc.send(msg);
      }
    });

    NodejsWorker.startWorker(options, function(err, _workerProc) {
      if (err) { worker.ready = false; worker.emit("error", err); return; }

      workerProc = _workerProc;

      workerProc.on('message', function(m) {
        NodejsWorker.debug && console.log('[WORKER PARENT] got message:', m);
        worker.emit("message", m);
      });

      workerProc.on('close', function() {
        console.log("[WORKER PARENT] worker closed");
        worker.emit("close");
      });

      workerProc.on('error', function(err) {
        console.log("[WORKER PARENT] error ", err);
        worker.errors.push(err);
        worker.emit("error", err);
      });

      worker.ready = true;
      worker.emit("ready");
    });

    return worker;
  },

  // this code is run in the context of the worker process
  workerSetupFunction: function workerSetupFunction() {
    var remoteWorker = process;
    var debug = true;
    var close = false;

    debug && console.log("[WORKER] Starting init");
    // ignore-in-doc
    // process.on('message', function(m) {
    //   debug && console.log('[WORKER] got message:', m);
    //   if (m.action === 'ping') process.send({action: 'pong', data: m});
    //   else if (m.action === 'close') close = true;
    //   else if (m.action === 'setup') setup(m.data);
    //   else console.error('[WORKER] unknown message: ', m);
    // });

    remoteWorker.on("message", function(msg) {
      if (msg.action !== "setup") {
        throw new Error("expected setup to be first message but got " + JSON.stringify(msg.data))
      }
      remoteWorker.removeAllListeners("message");
      var options = msg.data.options || {};
      debug && console.log("[WORKER] running setup with options", options);
      loadDependenciesNodejs(options);
      initOnMessageHandler(options);
      initWorkerInterface(options);
      initWorkerMessenger(options);
      remoteWorker.send({workerReady: true});
    })
    __FUNCTIONDECLARATIONS__
  },

  ensureInitCodeFile: function(options, initCode, thenDo) {
    var path = require("path");
    var os = require("os");
    var fs = require("fs");

    var workerTmpDir = path.join(os.tmpDir(), 'lively-nodejs-workers/');
    var fn = path.join(workerTmpDir, 'nodejs-worker-init.js');

    if (!NodejsWorker.initCodeFileCreated) NodejsWorker.createWorkerCodeFile(options, fn, initCode, thenDo);
    else fs.exists(fn, function(exists) {
      if (exists) thenDo(null, fn);
      else NodejsWorker.createWorkerCodeFile(options, fn, initCode, thenDo);
    });
  },

  createWorkerCodeFile: function(options, fileName, initCode, thenDo) {
    var path = require("path");
    var fs = require("fs");
    var exec = require("child_process").exec;

    exec("mkdir -p " + path.dirname(fileName), function(code, out, err) {
      if (code) {
        thenDo(new Error(["[WORKER PARENT] Could not create worker temp dir:", out, err].join('\n')))
        return;
      }
      fs.writeFile(fileName, initCode, function(err) {
        NodejsWorker.debug && console.log('worker code file %s created', fileName);
        NodejsWorker.initCodeFileCreated = true;
        thenDo(err, fileName); });
    });
  },

  startWorker: function(options, thenDo) {
    var util = require("util");
    var fork = require("child_process").fork;

    var workerSetupCode = String(NodejsWorker.workerSetupFunction).replace("__FUNCTIONDECLARATIONS__", [
      WorkerSetup.loadDependenciesNodejs,
      WorkerSetup.initOnMessageHandler,
      WorkerSetup.initWorkerInterface,
      WorkerSetup.initWorkerMessenger
    ].join('\n'));

    var initCode = util.format("(%s)();\n", workerSetupCode);
    NodejsWorker.ensureInitCodeFile(options, initCode, function(err, codeFileName) {
      if (err) return thenDo(err);
      var worker = fork(codeFileName, {});
      NodejsWorker.debug && console.log('worker forked');
      worker.on('message', function(m) {
        if (m.action === 'pong') console.log("[WORKER pong] ", m);
        else if (m.action === 'log') console.log("[Message from WORKER] ", m.data);
      });
      worker.once('message', function(m) {
        NodejsWorker.debug && console.log('worker setup done');
        thenDo(null, worker, m);
      });
      worker.on('close', function() {
        NodejsWorker.debug && console.log("[WORKER PARENT] worker closed");
      });
      worker.send({action: "setup", data: {options: options}});
      global.WORKER = worker;
    });
  }

}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// the worker interface, usable both in browser and node.js contexts
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

/*
Worker objects allow to fork processes in both Web and node.js JavaScript
environments. They provide this mechanism using web workers in the browser and
node.js child processes in node.js. The interface is unified for all platforms.
 */
var worker = exports.worker = {

  fork: function(options, workerFunc, thenDo) {
    // Fork automatically starts a worker and calls `workerFunc`. `workerFunc`
    // gets as a last paramter a callback, that, when invoked with an error and
    // result object, ends the worker execution.
    //
    // Options are the same as in `create` except for an `args` property that
    // can be an array of objects. These objects will be passed to `workerFunc`
    // as arguments.
    //
    // Note: `workerFunc` will not be able to capture outside variables (create a
    // closure).
    //
    // Example:
    // // When running this inside a browser: Note how the UI does not block.
    // worker.fork({args: [40]},
    //   function(n, thenDo) {
    //     function fib(n) { return n <= 1 ? n : fib(n-1) + fib(n-2); }
    //     thenDo(null, fib(n));
    //   },
    //   function(err, result) { show(err ? err.stack : result); })

    if (!thenDo) { thenDo = workerFunc; workerFunc = options; options = null; }
    options = options || {};
    var args = options.args || [];
    var w = worker.create(options);
    w.run.apply(w, [workerFunc].concat(args).concat(thenDo));
    return w;
  },

  create: function(options) {
    // Explicitly creates a first-class worker. Options:
    // ```js
    // {
    //   workerId: STRING, // optional, id for worker, will be auto assigned if not provided
    //   libLocation: STRING, // optional, path to where the lively.lang lib is located. Worker will try to find it automatically if not provided.
    //   scriptsToLoad: ARRAY // optional, list of path/urls to load. Overwrites `libLocation`
    // }
    // ```
    //
    // Example:
    // // this is just a helper function
    // function resultHandler(err, result) { alert(err ? String(err) : result); }
    //
    // // 1. Create the worker
    // var worker = lively.lang.worker.create({libLocation: baseURL});
    //
    // // 2. You can evaluate arbitrary JS code
    // worker.eval("1+2", function(err, result) { show(err ? String(err) : result); });
    //
    // // 3. Arbitrary functions can be called inside the worker context.
    // //    Note: functions shouldn't be closures / capture local state!) and passing
    // //    in arguments!
    // worker.run(
    //   function(a, b, thenDo) { setTimeout(function() { thenDo(null, a+b); }, 300); },
    //   19, 4, resultHandler);
    //
    // // 4. You can also install your own messenger services...
    // worker.run(
    //   function(thenDo) {
    //     self.messenger.addServices({
    //       foo: function(msg, messenger) { messenger.answer(msg, "bar!"); }
    //     });
    //     thenDo(null, "Service installed!");
    //   }, resultHandler);
    //
    // // ... and call them via the messenger interface
    // worker.sendTo("worker", "foo", {}, resultHandler);
    //
    // // 5. afterwards: shut it down
    // worker.close(function(err) { err && show(String(err)); alertOK("worker shutdown"); })

    options = options || {};
    options.useMessenger = true;

    if (!exports.messenger)
      throw new Error("worker.create requires messenger.js to be loaded!")
    if (!exports.events)
      throw new Error("worker.create requires events.js to be loaded!")
    if (!exports.obj)
      throw new Error("worker.create requires object.js to be loaded!")

    var workerId = options.workerId || exports.string.newUUID();

    var messenger = exports.messenger.create({
      sendTimeout: 5000,

      send: function(msg, whenSend) {
        messenger.worker.postMessage(msg);
        whenSend();
      },

      listen: function(whenListening) {
        var w = messenger.worker = isNodejs ? NodejsWorker.create(options) : BrowserWorker.create(options);
        w.on("message", function(msg) { messenger.onMessage(msg); });
        w.on('ready', function() { NodejsWorker.debug && console.log("WORKER READY!!!"); });
        w.on('close', function() { NodejsWorker.debug && console.log("WORKER CLOSED...!!!") ;});
        w.once('ready', whenListening);
      },

      close: function(whenClosed) {
        if (!messenger.worker.ready) return whenClosed(null);
        return messenger.sendTo(workerId, 'close', {}, function(err, answer) {
          err = err || answer.data.error;
          err && console.error("Error in worker messenger close: " + err.stack || err);
          if (err) whenClosed(err);
          else {
            var closed = false;
            messenger.worker.once('close', function() { closed = true; });
            exports.fun.waitFor(1000, function() { return !!closed; }, whenClosed);
          }
        });
      },

      isOnline: function() { return messenger.worker && messenger.worker.ready; }

    });

    exports.obj.extend(messenger, {

      eval: function(code, thenDo) {
        messenger.sendTo(workerId, "remoteEval", {expr: code}, function(err, answer) {
          thenDo(err, answer ? answer.data.result : null);
        });
      },

      run: function(/*runFunc, arg1, ... argN, thenDo*/) {
        var args = Array.prototype.slice.call(arguments),
            workerFunc = args.shift(),
            thenDo = args.pop();
        if (typeof workerFunc !== "function") throw new Error("run: no function that should run in worker passed");
        if (typeof thenDo !== "function") throw new Error("run: no callback passed");

        return messenger.sendTo(workerId, 'run',  {func: String(workerFunc), args: args}, function(err, answer) {
          thenDo(err || answer.data.error, answer ? answer.data.result : null);
        });
      }

    });

    messenger.listen();

    return messenger;
  }
}

})(typeof lively !== 'undefined' && lively.lang ? lively.lang : require('./base'));

//;
/*global THREE,ace*/

;(function() {

    // "imports"
  var aceHelper, rendering, canvas2d, domevents,
      mouseevents, commands, raycasting;
  // "imports" assigned here b/c they are first available after this module got defined
  function imports() {
    aceHelper           = THREE.CodeEditor.aceHelper,
    rendering           = THREE.CodeEditor.rendering,
    canvas2d            = THREE.CodeEditor.canvas2d,
    mouseevents         = THREE.CodeEditor.mouseevents;
    domevents           = THREE.CodeEditor.domevents;
    raycasting          = THREE.CodeEditor.raycasting;
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  if (!THREE.CodeEditor) {
    THREE.CodeEditor = function CodeEditor() { this.initialize.apply(this, arguments); }
    THREE.CodeEditor.prototype = Object.create(THREE.Mesh.prototype);
  } else imports();

  (function() {

    this.isCodeEditor3D = true;

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // initialize-release
    // -=-=-=-=-=-=-=-=-=-

    this.initialize = function(canvas3dElement, events, optAceEditor) {
      imports();

      this.events = events;

      // supported events: resize
      lively.lang.events.makeEmitter(this);

      var width = 400, height = 400;
      var editorGeo = plane(
        new THREE.Vector3(-width/2, height/2,0),
        new THREE.Vector3( width/2, height/2,0),
        new THREE.Vector3( width/2,-height/2,0),
        new THREE.Vector3(-width/2,-height/2,0));

      // building the html canvas that will be used as a texture
      var canvas = this.canvas2d = canvas2d.create(width, height),
          texture	= new THREE.Texture(canvas),
          material= new THREE.MeshBasicMaterial({
            color: "white", map: texture,
            side: THREE.DoubleSide});

      // var maxAnisotropy = renderer.getMaxAnisotropy();
    	// texture.anisotropy = 16;

      THREE.Mesh.call(this, editorGeo, material);

      editorGeo.computeBoundingBox();
      this.position.copy(editorGeo.boundingBox.center());

      // creating the ace editor instance that will work behind the scenes as our "model"
      var aceEditor;
      if (optAceEditor) this.aceEditor = aceEditor = optAceEditor
      else {
        aceEditor = this.aceEditor = aceHelper.createAceEditor(
          canvas3dElement.offsetLeft, canvas3dElement.offsetTop, width, height);
      }

      aceEditor.parent3d = this; // FIXME backlink for autocompleter

      var self = this;
      aceEditor.renderer.on("afterRender", function() { rendering.onAceEditorAfterRenderEvent(aceEditor, self); });
      aceEditor.renderer.on("themeChange", function() { self.invalidateScrollbar(); });
      aceEditor.renderer.on("resize",      function() { self.invalidateScrollbar(); });
      aceEditor.renderer.on("autosize",    function() { self.invalidateScrollbar(); });

      texture.needsUpdate	= true;

      this.addMouseEventListeners();
    }

    this.destroy = function() {
      // FIXME remove mouse handler...
      this.canvas2d.cleanup();
      this.canvas2d = null;
      this.aceEditor.cleanup();
      this.aceEditor = null;
    };

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // editor behavior
    // -=-=-=-=-=-=-=-=-=-

    this.setValue = function(text) {
      this.aceEditor.setValue(text);
    };

    this.insert = function(text, noTransform) {
      // insert text at cursor
      this.aceEditor.insert(text, noTransform);
    };

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // input events
    // -=-=-=-=-=-=-

    this.scrollSpeed = 1;

    this.addMouseEventListeners = function() {
      mouseevents.patchTHREExDOMEventInstance(this.events);
      if (this._onMouseDown || this._onMouseMove || this._onMouseWheel) this.removeMouseEventListeners();

      this._onMouseDown  = function(evt) { return this.onMouseDown(evt); }.bind(this);
      this._onMouseMove  = function(evt) { return this.onMouseMove(evt); }.bind(this);
      this._onMouseWheel = function(evt) { return this.onMouseWheel(evt); }.bind(this);
      this._onMouseOver = function(evt) {  return this.onMouseOver(evt); }.bind(this);
      this._onMouseOut = function(evt) { return this.onMouseOut(evt); }.bind(this);

      this.events.addEventListener(this, 'mousedown', this._onMouseDown, false);
      this.events.addEventListener(this, 'mousemove', this._onMouseMove, false);
      this.events.addEventListener(this, 'mousewheel', this._onMouseWheel, false);
      this.events.addEventListener(this, 'mouseover', this._onMouseOver, false);
      this.events.addEventListener(this, 'mouseout', this._onMouseOut, false);
    }

    this.removeMouseEventListeners = function() {
      this._onMouseDown  && this.events.removeEventListener(this, 'mousedown', this._onMouseDown, false);
      this._onMouseMove  && this.events.removeEventListener(this, 'mousemove', this._onMouseMove, false);
      this._onMouseWheel && this.events.removeEventListener(this, 'mousewheel', this._onMouseWheel, false);
      this._onMouseOver  && this.events.removeEventListener(this, "mouseover", this._onMouseOver, false);
      this._onMouseOut   && this.events.removeEventListener(this, "mouseout", this._onMouseOut, false);
      this._onMouseDown = null;
      this._onMouseMove = null;
      this._onMouseWheel = null;
      this._onMouseOver = null;
      this._onMouseOut = null;
    }

    this.onMouseDown = function(evt) {
      // clicked on scrollbar?
      if (mouseevents.processScrollbarMouseEvent(
          this.events, this, this.clickState, evt)) return true;

      var aceCoords = raycasting.raycastIntersectionToDomXY(evt.intersect, this.aceEditor.container);
      mouseevents.reemit3DMouseEvent(this.events, evt.origDomEvent, this.clickState, this, aceCoords);
    }

    this.onMouseMove = function(evt) {
      var aceCoords = raycasting.raycastIntersectionToDomXY(evt.intersect, this.aceEditor.container);
      mouseevents.reemit3DMouseEvent(this.events, evt.origDomEvent, this.clickState, this, aceCoords);
    }

    this.onMouseWheel = function(evt) {
      var aceCoords = raycasting.raycastIntersectionToDomXY(evt.intersect, this.aceEditor.container);
      mouseevents.reemit3DMouseEvent(this.events, evt.origDomEvent, this.clickState, this, aceCoords);
    }

    this.onMouseOver = function(evt) {
return;
      if (evt.target !== this) return;
      var noMouse = !mouseevents.isLeftMouseButtonPressed(evt)
                 && !mouseevents.isRightMouseButtonPressed(evt);
      if (noMouse) this.aceEditor.focus();
      if (noMouse) console.log("ficussed!!");
    };

    this.onMouseOut = function(evt) {
return;
      console.log("blur!!");
      this.aceEditor.blur();
    };

    this.getScrollbar = function() {
      return this.scrollbar || (this.scrollbar = createScrollbar(this.aceEditor));
    }

    this.invalidateScrollbar = function() { this.scrollbar = null; }

    this.clickState = {
      lastClickTime: 0,
      doubleClickTriggerTime: 500,
      scrollbarClickPoint: null
    };

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // geometry
    // -=-=-=-=-

    this.getWidth = function() { return this.getSize().x; };
    this.getHeight = function() { return this.getSize().y; };

    this.setHeight = function(height) { return this.setSize(this.getWidth(), height); };
    this.setWidth = function(width) { return this.setSize(width, this.getHeight()); };

    this.getSize = function() {
      this.geometry.computeBoundingBox();
      return this.geometry.boundingBox.size();
    };

    this.setSize = function(width, height) {
      this.aceEditor.container.style.width = width + "px";
      this.aceEditor.container.style.height = height + "px";
      this.canvas2d.width = width;
      this.canvas2d.height = height;
      this.geometry.vertices = [
        new THREE.Vector3(-width/2, height/2,0),
        new THREE.Vector3( width/2, height/2,0),
        new THREE.Vector3(-width/2,-height/2,0),
        new THREE.Vector3( width/2,-height/2,0)]

      this.material.map.needsUpdate = true;
      this.aceEditor.resize(true);
      this.geometry.verticesNeedUpdate = true;
      // for events:
      this.geometry.computeBoundingBox();
      this.geometry.computeBoundingSphere();
      this.emit("resize", {x: width, y: height});
    };

    this.getGlobalVertice = function(i) {
      return this.geometry.vertices[i].clone().applyMatrix4(this.matrixWorld);
    };

    this.topLeft = function() { return this.getGlobalVertice(0); };
    this.topRight = function() { return this.getGlobalVertice(1); };
    this.bottomLeft = function() { return this.getGlobalVertice(2); };
    this.bottomRight = function() { return this.getGlobalVertice(3); };

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // positioning
    // -=-=-=-=-=-=-
    this.alignWithCamera = function(leftRightOrCenter, camera) {
      // offset: // -1 left, 0 center, 1 right
      this.geometry.computeBoundingBox()
      var margin = 200;
      var size = this.geometry.boundingBox.size()
      var dist = (size.y+margin) / 2 / Math.tan(Math.PI * camera.fov / 360);
    	var center = raycasting.pickingRay({x:0,y:0}, camera).ray.at(dist);

      this.position.copy(center);
      this.lookAt(camera.position);

      if (leftRightOrCenter === "center") return;
    // 	var projectionPoint = raycasting.pickingRay({x:-1,y:0}, camera).ray.at(dist);
    // 	var delta = projectionPoint.clone().sub(center);
    //   align(this, this.topLeft(), projectionPoint)
    //   this.position.copy(projectionPoint.clone());
    //   this.lookAt(camera.position.clone().add(delta));
    //   this.position.add(this.topRight().clone().sub(this.topLeft()).multiplyScalar(.5));
    //   return;

      // move the editor to the left side until it reaches the screen border...
      // ugly! I should use fov and stuff to compute the coordinates but its soooo late already.... :P
      camera.updateMatrix()
      camera.updateMatrixWorld()
      var delta = camera.up.clone().cross(this.position.clone().sub(camera.position)).normalize()
      if (leftRightOrCenter === "right") delta.negate();
      var frustum = new THREE.Frustum();
      frustum.setFromMatrix( new THREE.Matrix4().multiply( camera.projectionMatrix, camera.matrixWorldInverse ) );
      var bounds = new THREE.Box3().setFromObject(this);
      do { // move left unti we "hit" the corner of the editor
        this.position.add(delta);
        this.updateMatrixWorld();
        var pointsToCheck = leftRightOrCenter === "right" ?
          [this.topRight(), this.bottomRight()] : [this.topLeft(), this.bottomLeft()]
      } while (pointsToCheck.every(function(p) { return frustum.containsPoint(p); }));

    }

    this.autoAlignWithCamera = function(dir, camera) {
      var cameraState, editorState, editor = this;;

      this.stopAutoAlignWithCamera();

      rememberState();
      editor.alignWithCamera(dir, camera);

      editor._autoAlignWithCameraInterval = setInterval(function() {
        if (!hasCameraChanged() && !hasEditorChanged()) return;
        rememberState();
        lively.lang.fun.debounceNamed("autoAlignWithCamera", 200,
          editor.alignWithCamera.bind(editor, dir, camera))();
      }, 100);

      function rememberState() {
        editorState = {wasResized: false, position: editor.position.clone()};
        editor.once("resize", function() { editorState.wasResized = true; });
        cameraState = lively.lang.obj.extract(
          ["position", "rotation", "fov", "aspect", "zoom"], camera,
          function(k, val) { return val && val.clone ? val.clone() : val; });
      }

      function hasCameraChanged() {
        return Object.keys(cameraState).some(function(k) {
          if (!cameraState[k]) return false;
          if (cameraState[k].equals) return !cameraState[k].equals(camera[k]);
          return cameraState[k] !== camera[k];
        });
      }

      function hasEditorChanged() {
        return editorState.wasResized || !editorState.position.equals(editor.position);
      }
    };

    this.stopAutoAlignWithCamera = function() {
      if (this._autoAlignWithCameraInterval) {
        clearInterval(this._autoAlignWithCameraInterval);
        delete this._autoAlignWithCameraInterval;
      }
    }
  }).call(THREE.CodeEditor.prototype);


  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // helper
  // -=-=-=-

  function align(object, x, y) { return object.position.add(y.clone().sub(x)); }

  function notYetImplemented() { console.warn("NOT YET IMPLEMENTED"); }

  function plane(a,b,c,d) {
    var vec1 = b.clone().sub(a), vec2 = d.clone().sub(a);
    return new THREE.PlaneGeometry(vec1.length(), vec2.length(), 1,1);
  }

  function createScrollbar(aceEditor) {
    var renderer       = aceEditor.renderer, scrollBarV = renderer.scrollBarV,
        editorStyle    = window.getComputedStyle(renderer.container),
        relativeHeight = scrollBarV.element.clientHeight / scrollBarV.inner.clientHeight,
        relativeTop    = scrollBarV.scrollTop / scrollBarV.inner.clientHeight,
        height         = scrollBarV.element.clientHeight,
        borderWidth    = 3,
        width          = 10,
        col            = new THREE.Color(editorStyle.backgroundColor),
        isDarkTheme    = (col.r+col.g+col.b)/3 < .5,
        backgroundColor = col.clone().add(col.clone().multiplyScalar(-.4)).getStyle();
    return {
        height: height * relativeHeight - borderWidth,
        width: width - borderWidth,
        get top() { return height * (scrollBarV.scrollTop / scrollBarV.inner.clientHeight) + borderWidth; },
        left: renderer.container.clientWidth - width - borderWidth,
        borderWidth: borderWidth,
        backgroundColor: backgroundColor,
        borderColor: isDarkTheme ? col.add(new THREE.Color('white').multiplyScalar(.2)).getStyle() : backgroundColor,
        borderRounding: 4
      };
  }

})(THREE);
;
;(function(exports) {

  exports.createAceEditor = createAceEditor;

  function createAceEditor(posX, posY, width, height) {
    var el = document.createElement("div");
    document.body.appendChild(el);
    el.style.width = width + "px"
    el.style.height = height + "px";
    el.style.left = (posX || 0) + "px";
    el.style.top = (posY || 0) + "px";
    el.style.zIndex = -1000;
    // el.style.visibility = "hidden";
    el.style.position = "fixed";
    var editor = ace.edit(el);
    editor.setOption("useWorker", false);
    editor.setOption("showGutter", false);
    editor.setOption("tabSize", 2);
  
    editor.cleanup = function() {
      editor.renderer.removeAllListeners("afterRender");
      el.parentNode.removeChild(editor.container);
      editor.destroy();
    }
  
    return editor;
  }

})(THREE.CodeEditor.aceHelper || (THREE.CodeEditor.aceHelper = {}));
;
;(function(exports) {

  exports.create = create;

  function create(width, height) {
    var el = document.createElement("canvas");
    document.body.appendChild(el);
    el.width = width; el.height = height;
    el.style.position = "absolute";
    el.style.left = 0;
    el.style.top = 0;
    el.style.width = width + "px";
    el.style.height = height + "px";
    el.style.visibility = 'hidden';
    el.cleanup = function() { el.parentNode.removeChild(el) };
    return el;
  }

})(THREE.CodeEditor.canvas2d || (THREE.CodeEditor.canvas2d = {}));
;
;(function(exports) {

  exports.retargetDOMEvent = retargetDOMEvent;
  exports.isFullscreen;

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  var isFirefox = !!navigator.userAgent.match(/Firefox\//);

  exports.isFullscreen = function isFullscreen() {
    return !!document.fullScreenElement
        || !!document.webkitFullScreenElement
        || !!document.mozFullScreenElement;
  };

  function retargetDOMEvent(evt, newTargetPos, newTargetEl) {
    newTargetPos = newTargetPos || {x:0, y:0};
    if (evt.hasCodeEditor3DPatch) return evt;

    var x = newTargetPos.x,
        y = newTargetPos.y,
        fakeEvt = Object.create(evt)

    if (isFirefox) { // Firefox throws errors when we try to access the inherited attributes...
      // https://developer.mozilla.org/en-US/docs/Web/API/UIEvent
      Object.defineProperty(fakeEvt, "detail",        {value: evt.detail});
      Object.defineProperty(fakeEvt, "view",          {value: evt.view});
      // https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent
      Object.defineProperty(fakeEvt, "altKey",        {value: evt.altKey});
      Object.defineProperty(fakeEvt, "button",        {value: evt.button});
      Object.defineProperty(fakeEvt, "buttons",       {value: evt.buttons});
      // Object.defineProperty(fakeEvt, "clientX",       {value: evt.clientX});
      // Object.defineProperty(fakeEvt, "clientY",       {value: evt.clientY});
      Object.defineProperty(fakeEvt, "ctrlKey",       {value: evt.ctrlKey});
      Object.defineProperty(fakeEvt, "metaKey",       {value: evt.metaKey});
      Object.defineProperty(fakeEvt, "movementX",     {value: evt.movementX});
      Object.defineProperty(fakeEvt, "movementY",     {value: evt.movementY});
      Object.defineProperty(fakeEvt, "mozMovementX",     {value: evt.mozMovementX});
      Object.defineProperty(fakeEvt, "mozMovementY",     {value: evt.mozMovementY});
      Object.defineProperty(fakeEvt, "relatedTarget", {value: evt.relatedTarget});
      Object.defineProperty(fakeEvt, "screenX",       {value: evt.screenX});
      Object.defineProperty(fakeEvt, "screenY",       {value: evt.screenY});
      Object.defineProperty(fakeEvt, "shiftKey",      {value: evt.shiftKey});
      Object.defineProperty(fakeEvt, "which",         {value: evt.which});

      Object.defineProperty(fakeEvt, "eventPhase",    {value: evt.eventPhase});
      Object.defineProperty(fakeEvt, "bubbles",       {value: evt.bubbles});
      Object.defineProperty(fakeEvt, "cancelable",    {value: evt.cancelable});
      Object.defineProperty(fakeEvt, "timeStamp",     {value: evt.timeStamp});
    }

    Object.defineProperty(fakeEvt, "pageX",                {value: x});
    Object.defineProperty(fakeEvt, "pageY",                {value: y});
    Object.defineProperty(fakeEvt, "clientX",              {value: x});
    Object.defineProperty(fakeEvt, "clientY",              {value: y});
    Object.defineProperty(fakeEvt, "x",                    {value: x});
    Object.defineProperty(fakeEvt, "y",                    {value: y});
    Object.defineProperty(fakeEvt, "layerX",               {value: x});
    Object.defineProperty(fakeEvt, "layerY",               {value: y});
    Object.defineProperty(fakeEvt, "target",               {value: newTargetEl});
    // Object.defineProperty(fakeEvt, "currentTarget", {value: evt.currentTarget});
    Object.defineProperty(fakeEvt, "srcElement",           {value: newTargetEl});
    Object.defineProperty(fakeEvt, "hasCodeEditor3DPatch", {value: true});
    Object.defineProperty(fakeEvt, "preventDefault",       {value: function() { evt.preventDefault(); }});
    Object.defineProperty(fakeEvt, "stopPropagation",       {value: function() { evt.stopPropagation(); }});
    Object.defineProperty(fakeEvt, "type",                 {value: evt.type});

    if (evt.type === 'mousewheel' || evt.type === 'wheel') patchWheelEvent(evt, fakeEvt);
    // if (evt.type === 'mousewheel') console.log("%s,%s", fakeEvt.wheelX, fakeEvt.wheelY);

    return fakeEvt;
  }

  var patchWheelEvent = (function() {
    var el = document.body;
    if ("onmousewheel" in el) {
      return function(origEvt, fakeEvt) {
        var factor = 8;
        if (origEvt.wheelDeltaX !== undefined) {
          fakeEvt.wheelX = -origEvt.wheelDeltaX / factor;
          fakeEvt.wheelY = -origEvt.wheelDeltaY / factor;
        } else {
          fakeEvt.wheelX = 0;
          fakeEvt.wheelY = -origEvt.wheelDelta / factor;
        }
      }
    } else if ("onwheel" in el) {
      return function(origEvt, fakeEvt) {
        var factor = 0.35;
        switch (origEvt.deltaMode) {
          case origEvt.DOM_DELTA_PIXEL:
            fakeEvt.wheelX = origEvt.deltaX * factor || 0;
            fakeEvt.wheelY = origEvt.deltaY * factor || 0;
              break;
          case origEvt.DOM_DELTA_LINE:
          case origEvt.DOM_DELTA_PAGE:
            fakeEvt.wheelX = (origEvt.deltaX || 0) * 5;
            fakeEvt.wheelY = (origEvt.deltaY || 0) * 5;
              break;
        }
      }
    } else {
      return function(origEvt, fakeEvt) {
        if (origEvt.axis && origEvt.axis == origEvt.HORIZONTAL_AXIS) {
          fakeEvt.wheelX = (origEvt.detail || 0) * 5;
          fakeEvt.wheelY = 0;
        } else {
          fakeEvt.wheelX = 0;
          fakeEvt.wheelY = (origEvt.detail || 0) * 5;
        }
      }
    }
  })();

})(THREE.CodeEditor.domevents || (THREE.CodeEditor.domevents = {}));
;
;(function(exports) {

  // "imports"
  var retargetDOMEvent = THREE.CodeEditor.domevents.retargetDOMEvent;
  var isFullscreen     = THREE.CodeEditor.domevents.isFullscreen;

  // "exports"
  exports.getRelativeMouseXY          = getRelativeMouseXY;
  exports.getRelativeMouseXYFromEvent = getRelativeMouseXYFromEvent;
  exports.domEventRaycast             = domEventRaycast;
  exports.pickObjFromDOMEvent         = pickObjFromDOMEvent;
  exports.pickingRay                  = pickingRay;
  exports.raycastIntersectionToDomXY  = raycastIntersectionToDomXY;
  exports.convertToBrowserCoords      = convertToBrowserCoords;
  exports.convertEventPos3DtoHTML     = convertEventPos3DtoHTML;

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-


  function convertXYToOcculusCoords(coords) {
    // FIXME!! Hack...
    if (!window.world || !window.world.vr || !window.world.vr.control) return coords;

    var x = coords.x, y = coords.y;

    var domainXMin = x < 0 ? -1 : 0, domainXMax = x < 0 ? 0 : 1;
    var domainYMin = -1, domainYMax = 1;

    var relX = (x + (domainXMax - domainXMin)) - domainXMax;
    var rangeXMin = -.9, rangeXMax = .9;

    var relY = (y + (domainYMax - domainYMin)) - domainYMax;
    var rangeYMin = -.8, rangeYMax = .8;

  // ((rangeYMax - rangeYMin) * relY) - (rangeYMax-rangeYMin)

    return {
      x: ((rangeXMax - rangeXMin) * relX) - rangeXMax,
      y: ((rangeYMax - rangeYMin) * relY) - (rangeYMax-rangeYMin),
      z: coords.z
    };
  }

  // convertXYToOcculusCoords({x: -0.2, y: 0})

  function getRelativeMouseXY(x, y, domElement) {
    // Converts the browser global (page) x/y coordinates
    // into relative -1/1 values. These can be used by THREE for raycasting.

		var rect = domElement.getBoundingClientRect(),
    		relX = (x - rect.left) / rect.width,
    		relY = (y - rect.top) / rect.height;

  	return convertXYToOcculusCoords({
  		x : (relX * 2) - 1,
  		y : -(relY * 2) + 1,
  		z: 0.5
  	});
  }

  function getRelativeMouseXYFromEvent(domEvent) {
    return getRelativeMouseXY(domEvent.pageX, domEvent.pageY, domEvent.target || domEvent.srcElement);
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  // see https://github.com/mrdoob/three.js/issues/5587
  function pickingRay(coords, camera) {
    var raycaster = new THREE.Raycaster();
    // the camera is assumed _not_ to be a child of a transformed object
    if ( camera instanceof THREE.PerspectiveCamera ) {
        raycaster.ray.origin.copy( camera.position );
        raycaster.ray.direction.set( coords.x, coords.y, 0.5 ).unproject( camera ).sub( camera.position ).normalize();
    } else if ( camera instanceof THREE.OrthographicCamera ) {
        raycaster.ray.origin.set( coords.x, coords.y, - 1 ).unproject( camera );
        raycaster.ray.direction.set( 0, 0, - 1 ).transformDirection( camera.matrixWorld );
    } else {
        console.error( 'ERROR: unknown camera type.' );
    }
    return raycaster;
  }

  function domEventRaycast(domEvent, camera) {
    var mouseCoords = getRelativeMouseXYFromEvent(domEvent),
      	vector	    = new THREE.Vector3(mouseCoords.x, mouseCoords.y, 0.5);
    return pickingRay(vector, camera);
  }


  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // mapping of scene positions
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-

  function pickObjFromDOMEvent(evt, camera, objsToPick) {
    var intersects = domEventRaycast(evt,camera).intersectObjects(objsToPick);
  	return intersects[0];
  }

  function raycastIntersectionToDomXY(intersection, domElement) {
    // Project the raycast result onto a DOM element and return the x/y coords
    // relative to domElements top left.
    if (!intersection) return null;
    var localCoords = convertToBrowserCoords(intersection, intersection.object);
    var aceCoords = {
      x: domElement.offsetLeft + localCoords.x,
      y: domElement.offsetTop + localCoords.y
    }
    return aceCoords;
  }

  function convertToBrowserCoords(intersection, mesh3D) {
    // Convert the raycast point on mesh3D into the top/left coordinate sytem
    // of the DOM. The result coords are local to the mesh3D, not its scene.
    if (!intersection) return null;
    var cache = intersection.cachedLocalBrowserCoords || (intersection.cachedLocalBrowserCoords = {});
    if (cache[mesh3D.uuid]) return cache[mesh3D.uuid];
    mesh3D.geometry.computeBoundingBox()
    var worldPoint            = intersection.point,
        size                  = mesh3D.geometry.boundingBox.size(),
        worldCenter           = mesh3D.position.clone().add(mesh3D.geometry.boundingBox.center()),
        localTopLeft          = mesh3D.worldToLocal(worldCenter).add(size.multiply(new THREE.Vector3(.5,-.5,.5))),
        localEvt              = mesh3D.worldToLocal(worldPoint.clone()),
        browserLocalTopLeft   = localTopLeft.clone().add(localEvt).multiply(new THREE.Vector3(1,-1,1))
    return cache[mesh3D.uuid] = browserLocalTopLeft;
  }

  function convertEventPos3DtoHTML(domEvent, camera, oldEventTargetEl, newEventTargetEl, sceneObject, offset) {
    // DOM evt on 3D scene -> 2D position onto dom element acting as a hypothetical target.
    // Note that `oldEventTargetEl` can be choosen by the caller, it does not
    // neet to be the actual domEvent.target. We use it when getting e.g. scroll
    // events from the ace editor (target is actually the ace editor element) but
    // while the mouse is over the 3d canvas. We then get the targeted object and
    // determine the position the event would have when we would have scrolled
    // over the ace editor directly.
    // ....
    // Takes a domEvent sent to a canvas3d element. Does a ray cast and figures
    // out if and where `sceneObject` was hit by the event (via the "intersection"
    // ray cast result). Then projects the position onto
    // `newEventTargetEl` and returns the local position where this object
    // would have been hit if it would be the actual event target.
    var offsetX = offset ? offset.x : 0,
        offsetY = offset ? offset.y : 0,
        intersection = pickObjFromDOMEvent(
          retargetDOMEvent(domEvent,
          {x: domEvent.pageX+offsetX, y: domEvent.pageY+offsetY},
          oldEventTargetEl),
          camera, [sceneObject]);
    return raycastIntersectionToDomXY(intersection, newEventTargetEl);
  }

})(THREE.CodeEditor.raycasting || (THREE.CodeEditor.raycasting = {}));
;
;(function(exports) {

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // "imports"
  var AceMouseEvent = ace.require("ace/mouse/mouse_event").MouseEvent;
  var aceEventLib   = ace.require("ace/lib/event");

  var retargetDOMEvent = THREE.CodeEditor.domevents.retargetDOMEvent;

  var pickingRay                  = THREE.CodeEditor.raycasting.pickingRay;
  var convertToBrowserCoords      = THREE.CodeEditor.raycasting.convertToBrowserCoords;
  var convertEventPos3DtoHTML     = THREE.CodeEditor.raycasting.convertEventPos3DtoHTML;
  var getRelativeMouseXYFromEvent = THREE.CodeEditor.raycasting.getRelativeMouseXYFromEvent;

  var isFirefox = !!navigator.userAgent.match(/Firefox\//);

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // "exports"
  exports.reemit3DMouseEvent         = reemit3DMouseEvent;
  exports.processScrollbarMouseEvent = processScrollbarMouseEvent;
  exports.patchTHREExDOMEventInstance = patchTHREExDOMEventInstance;
  exports.isLeftMouseButtonPressed;
  exports.isRightMouseButtonPressed;

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // implementation

  exports.isLeftMouseButtonPressed = (function() {
      return isFirefox ?
          function(evt3D) { var evt = evt3D.origDomEvent; return evt.buttons === 1; } :
          function(evt3D) { var evt = evt3D.origDomEvent; return evt.which === 1 || evt.buttons === 1; }
  })();
  exports.isRightMouseButtonPressed = (function() {
      return isFirefox ?
          function(evt3D) { var evt = evt3D.origDomEvent; return evt.which === 3 || evt.buttons === 2; } :
          function(evt3D) { var evt = evt3D.origDomEvent; return evt.which === 3 || evt.buttons === 2 }
  })();

  function patchTHREExDOMEventInstance(domEvents) {
    // see https://github.com/mrdoob/three.js/issues/5587
    domEvents._projector.pickingRay = pickingRay;
    THREEx.DomEvents.prototype._getRelativeMouseXY	= getRelativeMouseXYFromEvent;
  }

  function processScrollbarMouseEvent(THREExDOMEvents, codeEditor, clickState, evt3D) {
    if (evt3D.type !== 'mousedown') return false;
    var scrollbar = codeEditor.getScrollbar(),
        localBrowserPos = convertToBrowserCoords(evt3D.intersect, codeEditor),
        hit = scrollbar.left <= localBrowserPos.x && localBrowserPos.x <= scrollbar.left + scrollbar.width
           && scrollbar.top <= localBrowserPos.y && localBrowserPos.y <= scrollbar.top + scrollbar.height;

    if (!hit) return false;

    codeEditor.aceEditor.focus();
    clickState.scrollbarClickPoint = localBrowserPos;

    var evt = evt3D.origDomEvent;
    var lastMousePosY = evt.layerY || evt.pageY;
    var scrollSpeed = codeEditor.scrollSpeed ||  1;

    function releaseScrollbar(evt) {
      evt.stopPropagation();
      clickState.scrollbarClickPoint = null;
      window.removeEventListener('mouseup', releaseScrollbar, false);
      window.removeEventListener('mousemove', moveScrollbar, false);
    }

    function moveScrollbar(evt) {
      evt.stopPropagation();
      var posY = evt.layerY || evt.pageY;
      var MAGIC = 50; // FIXME, this is for zoom = 1, fov = 75
      var scrollSpeed = THREExDOMEvents.camera().position.distanceTo(codeEditor.position) / MAGIC * codeEditor.scrollSpeed;
      var yDiff = (posY - lastMousePosY) * scrollSpeed;
      lastMousePosY = posY;
      codeEditor.aceEditor.renderer.scrollBy(0, yDiff);
    }

    window.addEventListener('mouseup', releaseScrollbar, false);
    window.addEventListener('mousemove', moveScrollbar, false);
    return true;
  }

  function reemit3DMouseEvent(THREExDOMEvents, evt, clickState, codeEditor, globalPosForRealEditor) {
    // evt is a DOM event emitted when clicked on the 3D canvas. We patch it up
    // (for coords, target element, etc) and feed this to ace so that the normal ace
    // mouse handlers are invoked.
    // codeEditor is the 3D editor mesh object

    var aceEd   = codeEditor.aceEditor,
        type    = evt.type.replace(/^pointer/, "mouse").toLowerCase(),
        fakeEvt = retargetDOMEvent(evt, globalPosForRealEditor, aceEd.renderer.content);

    patchAceEventMethods(THREExDOMEvents, aceEd, codeEditor);

    if (type === 'mousedown') {
      if (Date.now()-clickState.lastClickTime <= clickState.doubleClickTriggerTime) {
        aceEd._emit("dblclick", new AceMouseEvent(fakeEvt, aceEd));
      }
      clickState.lastClickTime = Date.now();
    }

    if (type === 'mousedown') aceEd.$mouseHandler.onMouseEvent("mousedown", fakeEvt)
    else if (type === 'mousemove') aceEd.$mouseHandler.onMouseMove('mousemove', fakeEvt);
    else if ((type === 'mousewheel' || type === 'wheel') && aceEd.isFocused()) aceEd.$mouseHandler.onMouseWheel('mousewheel', fakeEvt);
    else aceEd._emit(type, new AceMouseEvent(fakeEvt, aceEd));

    // Is this really necessary?
    if (type === "mousedown") {
        if (!aceEd.isFocused() && aceEd.textInput)
            aceEd.textInput.moveToMouse(new AceMouseEvent(evt, aceEd));
        aceEd.focus();
    }

  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // event conversion
  // -=-=-=-=-=-=-=-=-=-

  function patchAceEventMethods(THREExDOMEvents, aceEd, codeEditor) {
    // ace internally installs new event handler when the mosue is clicked, which
    // e.g. track mouse moves and such. The events coming in are emitted from the 3D
    // environment and actually don't target the ace editor. We install patch
    // functions that will adapt the events so that they make sense for ace

    var chain = lively.lang.chain,
        aceEdEl = aceEd.renderer.content;

    // we patch methods so that we can install method patchers... uuuuha
    aceEd.$mouseHandler.captureMouse = chain(aceEd.$mouseHandler.captureMouse)
      .getOriginal().wrap(function(proceed, evt, mouseMoveHandler) {
        evt.domEvent = retargetDOMEvent(evt.domEvent, convertEventPos3DtoHTML(evt, THREExDOMEvents._camera, THREExDOMEvents._domElement, aceEdEl, codeEditor, {x:0,y:aceEd.renderer.layerConfig.offset}), aceEdEl);

        mouseMoveHandler = mouseMoveHandler && chain(mouseMoveHandler)
          .getOriginal()
          .wrap(function(proceed, evt) {
            return evt && proceed(
              retargetDOMEvent(evt, convertEventPos3DtoHTML(evt, THREExDOMEvents._camera, THREExDOMEvents._domElement, aceEdEl, codeEditor, {x:0,y:aceEd.renderer.layerConfig.offset}), aceEdEl));
          }).value();
        return proceed(evt, mouseMoveHandler);
      }).value();

    aceEventLib.capture = chain(aceEventLib.capture)
      .getOriginal().wrap(function(proceed, el, eventHandler, releaseCaptureHandler) {
        if (aceEd.container !== el) return proceed(el, eventHandler, releaseCaptureHandler);
        eventHandler = chain(eventHandler)
          .getOriginal()
          .wrap(function(proceed, evt) {
            return evt && proceed(
              retargetDOMEvent(evt, convertEventPos3DtoHTML(evt, THREExDOMEvents._camera, THREExDOMEvents._domElement, aceEdEl, codeEditor, {x:0,y:aceEd.renderer.layerConfig.offset}), aceEdEl));
          }).value();

        releaseCaptureHandler = chain(releaseCaptureHandler)
          .getOriginal()
          .wrap(function(proceed, evt) {
            return evt && proceed(
              retargetDOMEvent(evt, convertEventPos3DtoHTML(evt, THREExDOMEvents._camera, THREExDOMEvents._domElement, aceEdEl, codeEditor, {x:0,y:aceEd.renderer.layerConfig.offset}), aceEdEl));
          }).value();

        return proceed(el, eventHandler, releaseCaptureHandler);
      }).value();
  }

})(THREE.CodeEditor.mouseevents || (THREE.CodeEditor.mouseevents = {}));
;
;(function(exports) {

  exports.onAceEditorAfterRenderEvent = onAceEditorAfterRenderEvent;

  // features
  var FOLDSUPPORT = false;
  var SHOWINVISIBLES = false;
  var DISPLAYINDENTGUIDES = false;
  var GUTTERLAYER = false;

  function onAceEditorAfterRenderEvent(aceEditor, codeEditor) {
    // rendering on canvas using the ace editor "model".
    // codeEditor is an instance of THREE.CodeEditor, a mesh.
    // aceEditor is... an ace editor
    // Here we react to render events of ace and attempt to render a similar
    // document using the canvas element we control here;

    var ed = aceEditor;
    var canvasEditor = codeEditor.canvas2d;
    var ctx = canvasEditor.getContext("2d");

    // base style
    var scrollLeft = ed.renderer.getScrollLeft();
    var editorStyle = computeStyle(aceEditor.renderer.container);
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = editorStyle.backgroundColor;
    ctx.strokeStyle = editorStyle.borderColor;

    ctx.fillRect(0,0,canvasEditor.width,canvasEditor.height);

    drawMarkerLayer(ctx, ed, scrollLeft, ed.renderer.$markerBack);

    drawTextLayer(ctx, ed, scrollLeft);

    drawMarkerLayer(ctx, ed, scrollLeft, ed.renderer.$markerFront);

    drawCursorLayer(ctx, ed, scrollLeft, ed.renderer.$cursorLayer);

    drawScrollbar(ctx, codeEditor.getScrollbar());

    codeEditor.material.map.needsUpdate = true;
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // text layer
  // -=-=-=-=-=-

  function drawTextLayer(ctx, ed, scrollLeft) {
    // take the text and span dom elements, extract their text and style and
    // render them on the 2d canvas

    var r            = ed.renderer,
        bounds       = ed.renderer.container.getBoundingClientRect(),
        config       = ed.renderer.layerConfig,
        lineHeight   = config.lineHeight,
        screenPos    = ed.session.documentToScreenPosition(config.firstRowScreen, 0),
        lineElements = r.$textLayer.element.childNodes,
        localCoords  = {
          x: config.padding,
          y: (config.firstRowScreen*config.lineHeight) - r.scrollTop + r.$fontSize
        },
        leftOffset   = localCoords.x,
        fontStyle    = computeStyle(r.container);

    ctx.font = fontStyle.fontSize + " " + fontStyle.fontFamily;

    for (var i = 0; i < lineElements.length; i++) { // render lines
      var tokenEls = lineElements[i].childNodes;
      for (var j = 0; j < tokenEls.length; j++) { // render tokens
          var tokenEl = tokenEls[j];

          var cssDecl = tokenEl.nodeType === tokenEl.TEXT_NODE ?
            fontStyle : computeStyle(tokenEl);

          if (cssDecl) ctx.fillStyle = cssDecl.color;

          var text = tokenEl.textContent,
              measured = ctx.measureText(text);

          if (measured) {
            // ctx.strokeRect(localCoords.x, localCoords.y-r.$fontSize, measured.width, lineHeight);
            if (cssDecl && cssDecl.textAlign === 'right')
              localCoords.x = config.width - measured.width;

            ctx.fillText(text, localCoords.x - r.scrollLeft, localCoords.y);
            localCoords.x += measured.width;
          }
      }

      localCoords.x = leftOffset;
      localCoords.y += lineHeight;
    }
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // cursor layer
  // -=-=-=-=-=-

  function drawCursorLayer(ctx, ed, scrollLeft, cursorLayer) {
    var config = cursorLayer.config;

    var selections = cursorLayer.session.$selectionMarkers;
    var i = 0, cursorIndex = 0;

    if (selections === undefined || selections.length === 0){
        selections = [{cursor: null}];
    }

    var cursorEls = cursorLayer.element.querySelectorAll('.ace_cursor');

    for (var i = 0, n = selections.length; i < n; i++) {

        var pixelPos = cursorLayer.getPixelPosition(selections[i].cursor, true);
        if ((pixelPos.top > config.height + config.offset ||
             pixelPos.top < 0) && i > 1) {
            continue;
        }

        var style = computeStyle(cursorEls[i]);
        var width = config.characterWidth;
        // var style = (cursorLayer.cursors[cursorIndex++] || cursorLayer.addCursor()).style;
        if (style) {
          if (style.backgroundColor && style.backgroundColor !== "transparent") {
            ctx.fillStyle = style.backgroundColor;
          } else {
            ctx.fillStyle = style.color;
            width = parseInt(style.borderLeftWidth) || parseInt(style.width);
          }
          ctx.strokeStyle = style.color;
        }

        ctx.fillRect(
          pixelPos.left - scrollLeft,
          pixelPos.top-config.offset,
          width,config.lineHeight);
    }
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // marker layer
  // -=-=-=-=-=-

  function drawMarkerLayer(ctx, ed, scrollLeft, markerLayer) {
    var r = ed.renderer;
    var config = markerLayer.config
    for (var key in markerLayer.markers) {

        var marker = markerLayer.markers[key];
        if (!marker.range) {
            marker.updateCanvas3D && marker.updateCanvas3D(ctx, markerLayer, scrollLeft, markerLayer.session, config);
            continue;
        }
        var range = marker.range.clipRows(config.firstRow, config.lastRow);
        if (range.isEmpty()) continue;
        range = range.toScreenRange(markerLayer.session);
        if (marker.renderer && false) {
            var top = markerLayer.$getTop(range.start.row, config);
            var left = markerLayer.$padding + range.start.column * config.characterWidth;
            marker.renderer(markerLayer, range, left, top, config);
        } else if (marker.type == "fullLine") {
            drawFullLineMarker(ctx, markerLayer, scrollLeft, range, marker.clazz, config);
        } else if (marker.type == "screenLine") {
            drawScreenLineMarker(ctx, markerLayer, scrollLeft, range, marker.clazz, config);
        } else if (range.isMultiLine()) {
            if (marker.type == "text")
              markerLayer.drawTextMarker(ctx, markerLayer, scrollLeft, range, marker.clazz, config);
            else
              drawMultiLineMarker(ctx, markerLayer, scrollLeft, range, marker.clazz, config);
        } else {
          drawSingleLineMarker(ctx, markerLayer, scrollLeft, range, marker.clazz + " ace_start", config)
        }
    }
  }

  function markerGetTop(marker, range, layerConfig) {
    return marker.$getTop ?
      marker.$getTop(range.start.row, layerConfig) :
      (range.start.row - layerConfig.firstRowScreen) * layerConfig.lineHeight;
  }

  function drawMultiLineMarker(ctx, markerLayer, scrollLeft, range, clazz, config) {
    var padding = markerLayer.$padding;
    var height = config.lineHeight;
    var top = markerLayer.$getTop(range.start.row, config)-config.offset;
    var left = (padding + range.start.column * config.characterWidth) - scrollLeft;

    // firs line
    // console.log("drawMultiLineMarker %s", clazz);
    var markerEl = markerLayer.element.querySelector("."+clazz.replace(/ /g, "."));
    var style = markerEl && computeStyle(markerEl);
    if (style) {
      ctx.strokeStyle = style.borderColor;
      ctx.fillStyle = style.backgroundColor;
    }

    ctx.fillRect(left,top, config.width,height);

    top = markerLayer.$getTop(range.end.row, config)-config.offset;;
    var width = range.end.column * config.characterWidth;
    ctx.fillRect(padding,top,width,height);

    height = (range.end.row - range.start.row - 1) * config.lineHeight;
    if (height < 0) return;
    top = markerLayer.$getTop(range.start.row + 1, config)-config.offset;;
    ctx.fillRect(padding,top, config.width,height);
  }

  function drawScreenLineMarker(ctx, markerLayer, scrollLeft, range, clazz, config) {
    var top = markerLayer.$getTop(range.start.row, config) - config.offset;
    var height = config.lineHeight;
    var left = 0;

    // console.log("drawScreenLineMarker %s", clazz);
    var markerEl = markerLayer.element.querySelector("."+clazz.replace(/ /g, "."));
    var style = markerEl && computeStyle(markerEl);
    if (style) {
      ctx.strokeStyle = style.borderColor;
      ctx.fillStyle = style.backgroundColor;
    }
    ctx.fillRect(left,top, config.width,height);
  }

  function drawSingleLineMarker(ctx, markerLayer, scrollLeft, range, clazz, config, extraLength, extraStyle) {
    var height = config.lineHeight;
    var width = (range.end.column + (extraLength || 0) - range.start.column) * config.characterWidth;

    var top = markerLayer.$getTop(range.start.row, config)-config.offset;
    var left = (markerLayer.$padding + range.start.column * config.characterWidth) - scrollLeft;

    var markerEl = markerLayer.element.querySelector("."+clazz.replace(/ /g, "."));

    var style = markerEl && computeStyle(markerEl);
    if (style) {
      ctx.strokeStyle = style.borderColor;
      ctx.fillStyle = style.backgroundColor;
    }
    // console.log("drawSingleLineMarker %s %s", clazz, style.backgroundColor);
    // show("drawSingleLineMarker %s %s %s %s", left,top,width,height)
    ctx.fillRect(left,top,width,height);
  }

  function drawFullLineMarker(ctx, markerLayer, scrollLeft, range, clazz, config) {
    var top = markerLayer.$getTop(range.start.row, config);
    var height = config.lineHeight;
    if (range.start.row != range.end.row)
        height += markerLayer.$getTop(range.end.row, config) - top;

    var left = (markerLayer.$padding + range.start.column * config.characterWidth) - scrollLeft;
    var markerEl = markerLayer.element.querySelector("."+clazz.replace(/ /g, "."));
    var style = markerEl && computeStyle(markerEl);
    if (style) {
      ctx.strokeStyle = style.borderColor;
      ctx.fillStyle = style.backgroundColor;
    }
    ctx.fillRect(left,top, config.width,height);
  }

  function drawTextMarker(ctx, markerLayer, scrollLeft, range, clazz, config, extraStyle) {
      // selection start
      var row = range.start.row;

      var lineRange = new range.constructor(
          row, range.start.column,
          row, markerLayer.session.getScreenLastRowColumn(row)
      );

      // markerLayer.drawSingleLineMarker(stringBuilder, lineRange, clazz + " ace_start", layerConfig, 1, extraStyle);
      drawSingleLineMarker(ctx, markerLayer, scrollLeft, range, clazz, config, 1, extraStyle);

      // selection end
      row = range.end.row;
      lineRange = new range.constructor(row, 0, row, range.end.column);
      drawSingleLineMarker(ctx, markerLayer, scrollLeft, lineRange, clazz, config, 0, extraStyle);

      for (row = range.start.row + 1; row < range.end.row; row++) {
        lineRange.start.row = row;
        lineRange.end.row = row;
        lineRange.end.column = markerLayer.session.getScreenLastRowColumn(row);
        drawSingleLineMarker(ctx, markerLayer, scrollLeft, lineRange, clazz, config, 1, extraStyle);
      }
  }

  function drawScrollbar(ctx, scrollbar) {
    ctx.fillStyle = scrollbar.backgroundColor;
    ctx.strokeStyle = scrollbar.borderColor
    ctx.lineWidth = scrollbar.borderWidth;
    roundRect(ctx,
      scrollbar.left,scrollbar.top,
      scrollbar.width,scrollbar.height,
      scrollbar.borderRounding, true, true);
  }

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// rendering helper
// -=-=-=-=-=-=-=-=-
  function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof stroke == "undefined" ) stroke = true;
    if (typeof radius === "undefined") radius = 5;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (stroke) ctx.stroke();
    if (fill) ctx.fill();
  }

  function computeStyle(el) {
    if (el.nodeType === el.TEXT_NODE) return null;
    try { return window.getComputedStyle(el); } catch (e) {
      console.error("Cannot compute style of %s:\n%s", el.nodeType, e);
      return null;
    }
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // ace additions + patches
  var lang = ace.require("ace/lib/lang");
  var Range = ace.require("ace/range").Range;

  ace.require("ace/search_highlight").SearchHighlight.prototype.updateCanvas3D = function(ctx, markerLayer, scrollLeft, session, config) {
    if (!this.regExp)
        return;
    var start = config.firstRow, end = config.lastRow;

    for (var i = start; i <= end; i++) {
        var ranges = this.cache[i];
        if (ranges == null) {
            ranges = lang.getMatchOffsets(session.getLine(i), this.regExp);
            if (ranges.length > this.MAX_RANGES)
                ranges = ranges.slice(0, this.MAX_RANGES);
            ranges = ranges.map(function(match) {
                return new Range(i, match.offset, i, match.offset + match.length);
            });
            this.cache[i] = ranges.length ? ranges : "";
        }

        for (var j = ranges.length; j --; ) {
          drawSingleLineMarker(
              ctx, markerLayer, scrollLeft, ranges[j].toScreenRange(session), this.clazz, config);
        }
    }
  }

})(THREE.CodeEditor.rendering || (THREE.CodeEditor.rendering = {}));

//# sourceMappingURL=codeeditor3d.dev-bundle.js.map