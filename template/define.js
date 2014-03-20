function define(id, deps, factory) {
  var len = arguments.length;

  if(len == 1) {
    factory = id;
  }
  else if(len == 2) {
    factory = deps;
    if(Array.isArray) {
      deps = id;
      id = undefined;
    }
    else {
      deps = undefined;
    }
  }

  var ret = Object.prototype.toString.call(factory) == '[object Function]' ? factory(require, module, exports) : factory;
  module.exports = ret;
}