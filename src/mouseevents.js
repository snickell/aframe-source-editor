
import { wrap, getOriginal } from './deadly/lang/fun.js'
import { DOMEvents as THREExDOMEvents } from './vendor/threex.domevents.js'
import { retargetDOMEvent } from './domevents.js'
import { pickingRay, convertToBrowserCoords, convertEventPos3DtoHTML, getRelativeMouseXYFromEvent } from './raycasting.js'
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// "imports"
var AceMouseEvent = ace.require("ace/mouse/mouse_event").MouseEvent;
var aceEventLib   = ace.require("ace/lib/event");

var isFirefox = !!navigator.userAgent.match(/Firefox\//);

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// implementation

export const isLeftMouseButtonPressed = (function() {
    return isFirefox ?
        function(evt3D) { var evt = evt3D.origDomEvent; return evt.buttons === 1; } :
        function(evt3D) { var evt = evt3D.origDomEvent; return evt.which === 1 || evt.buttons === 1; }
})();
export const isRightMouseButtonPressed = (function() {
    return isFirefox ?
        function(evt3D) { var evt = evt3D.origDomEvent; return evt.which === 3 || evt.buttons === 2; } :
        function(evt3D) { var evt = evt3D.origDomEvent; return evt.which === 3 || evt.buttons === 2 }
})();

export function patchTHREExDOMEventInstance(codeEditor) {
  // see https://github.com/mrdoob/three.js/issues/5587
  //codeEditor.events._projector.pickingRay = pickingRay;
  /*THREEx.DomEvents.prototype._getRelativeMouseXY = codeEditor.vr ?
    function(evt) { return getRelativeMouseXYFromEvent(evt, true); } :
    getRelativeMouseXYFromEvent;*/
}

export function processScrollbarMouseEvent(THREExDOMEvents, codeEditor, clickState, evt3D) {
  console.warn("DISABLING PROCESSSCROLLBARMOUSEVENT");
  return;
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

export function reemit3DMouseEvent(THREExDOMEvents, evt, clickState, codeEditor, globalPosForRealEditor) {
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

  var aceEdEl = aceEd.renderer.content;

  // we patch methods so that we can install method patchers... uuuuha
  aceEd.$mouseHandler.captureMouse = wrap(
    getOriginal(aceEd.$mouseHandler.captureMouse),
    function(proceed, evt, mouseMoveHandler) {
      evt.domEvent = retargetDOMEvent(evt.domEvent, convertEventPos3DtoHTML(evt, THREExDOMEvents._camera, THREExDOMEvents._domElement, aceEdEl, codeEditor, {x:0,y:aceEd.renderer.layerConfig.offset}, !!codeEditor.vr), aceEdEl);

      mouseMoveHandler = mouseMoveHandler && wrap(
        getOriginal(mouseMoveHandler),
        function(proceed, evt) {
          return evt && proceed(
            retargetDOMEvent(evt, convertEventPos3DtoHTML(evt, THREExDOMEvents._camera, THREExDOMEvents._domElement, aceEdEl, codeEditor, {x:0,y:aceEd.renderer.layerConfig.offset}, !!codeEditor.vr), aceEdEl));
        }
      )
      return proceed(evt, mouseMoveHandler);
    }
  )

  aceEventLib.capture = wrap(
    getOriginal(aceEventLib.capture),
    function(proceed, el, eventHandler, releaseCaptureHandler) {
      if (aceEd.container !== el) return proceed(el, eventHandler, releaseCaptureHandler);
      eventHandler = wrap(
        getOriginal(eventHandler),
        function(proceed, evt) {
          return evt && proceed(
            retargetDOMEvent(evt, convertEventPos3DtoHTML(evt, THREExDOMEvents._camera, THREExDOMEvents._domElement, aceEdEl, codeEditor, {x:0,y:aceEd.renderer.layerConfig.offset}, !!codeEditor.vr), aceEdEl));
        }
      )

      releaseCaptureHandler = wrap(
        getOriginal(releaseCaptureHandler),
        function(proceed, evt) {
          return evt && proceed(
            retargetDOMEvent(evt, convertEventPos3DtoHTML(evt, THREExDOMEvents._camera, THREExDOMEvents._domElement, aceEdEl, codeEditor, {x:0,y:aceEd.renderer.layerConfig.offset}, !!codeEditor.vr), aceEdEl));
        }
      )

      return proceed(el, eventHandler, releaseCaptureHandler);
    }
  )
}
