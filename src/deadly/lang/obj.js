/* AutoComplete.prototype.commands = deadly.lang.obj.merge(AutoComplete.prototype.commands, {
  "Alt-Shift-,": function(editor) { editor.completer.goTo("start"); },
  "Alt-Shift-.": function(editor) { editor.completer.goTo("end"); },
  "Alt-V": function(editor) { editor.completer.popup.gotoPageUp(); },
  "Ctrl-V": function(editor) { editor.completer.popup.gotoPageDown(); }
});
*/
function merge(objs) {
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
}