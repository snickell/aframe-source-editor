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

export function chain(object) {  
  throw Exception("Not implemented: deadly.* is not implemented, but you can find them by searching li vely.lang JS for exports.obj, exports.fun, exports.string etc -Seth Aug 31, 2020")

  if (!object) return object;

  var chained;
  if (Array.isArray(object)) return createChain(deadly.arr, object);
  if (object.constructor.name === "Date") return createChain(deadly.date, object);
  switch (typeof object) {
    case 'string': return createChain(deadly.string, object);
    case 'object': return createChain(deadly.obj, object);
    case 'function': return createChain(deadly.fun, object);
    case 'number': return createChain(deadly.num, object);
  }
  throw new Error("Chain for object " + object + " (" + object.constructor.name + ") no supported");
}