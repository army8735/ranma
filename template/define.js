function define(id, deps, factory) {
  var len = arguments.length;

  if(len == 1) factory = id;
  else if(len == 2) factory = deps;

  var ret = factory(require, module, exports);
  if(typeof ret != 'undefined') module.exports = ret;
}
define.amd = define.cmd = true;