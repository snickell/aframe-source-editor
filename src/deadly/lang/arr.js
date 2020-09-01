//       var maxScore = deadly.lang.arr.max(result, function(ea) { return ea.score; }).score;
export function max(array, iterator, context) {
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
}

/*
  var method = deadly.lang.arr.detect(
    ["cancelFullScreen","mozCancelFullScreen","webkitCancelFullScreen"],
    function(m) { return document[m]; });
*/
export function detect(arr, iterator, context) {
  // [a] -> (a -> Boolean) -> c? -> a
  // returns the first occurrence of an element in `arr` for which iterator
  // returns a truthy value
  for (var value, i = 0, len = arr.length; i < len; i++) {
    value = arr[i];
    if (iterator.call(context, value, i)) return value;
  }
  return undefined;
}