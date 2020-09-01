/* AutoComplete.prototype.commands = deadly.lang.obj.merge(AutoComplete.prototype.commands, {
  "Alt-Shift-,": function(editor) { editor.completer.goTo("start"); },
  "Alt-Shift-.": function(editor) { editor.completer.goTo("end"); },
  "Alt-V": function(editor) { editor.completer.popup.gotoPageUp(); },
  "Ctrl-V": function(editor) { editor.completer.popup.gotoPageDown(); }
});
*/
export function merge(objs) {
  // `objs` can be a list of objects. The return value will be a new object,
  // containing all properties of all objects. If the same property exist in
  // multiple objects, the right-most property takes precedence.
  //
  // Like `extend` but will not mutate objects in `objs`.

  // if objs are arrays just concat them
  // if objs are real objs then merge propertdies
  if (arguments.length > 1) {
    return merge(Array.prototype.slice.call(arguments));
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

export function inspect(object, options, depth) {
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
}

export function extract(properties, object, mapFunc) {
  return properties.reduce(function(extracted, name) {
    if (object.hasOwnProperty(name)) {
      var val = mapFunc ? mapFunc(name, object[name]) : object[name];
      extracted[name] = val;
    }
    return extracted;
  }, {});
}