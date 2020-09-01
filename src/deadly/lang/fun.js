export function debounce(wait, func, immediate) {
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
}

export function debounceNamed(name, wait, func, immediate) {
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
  return store[name] = debounce(wait, debounceNamedWrapper, immediate);
}

export function wrap(func, wrapper) {
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
}

export function getOriginal(func) {
  // Get the original function that was augmented by `wrap`. `getOriginal`
  // will traversed as many wrappers as necessary.
  while (func.originalFunction) func = func.originalFunction;
  return func;
}

export default {
  wrap, getOriginal
}