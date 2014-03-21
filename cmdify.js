var type = require('./type');
var cjsify = require('./cjsify');

var homunculus = require('homunculus');
var JsNode = homunculus.getClass('node', 'js');

//将 &&define.amd 判断移除，只判断第一个出现的，不支持多define
function removeAmd(context) {
  if(context.defineAmd) {
    var parent = context.defineAmd.parent();
    if(parent.name() == JsNode.MMBEXPR) {
      var prev = parent.prev();
      if(prev && prev.name() == JsNode.TOKEN && prev.token().content() == '&&') {
        var end = context.defineAmd.next().next().token();
        return [prev.token().sIndex(), end.sIndex() + end.content().length];
      }
    }
  }
  else {
    var index;
    context.getChildren().forEach(function(child) {
      index = index || removeAmd(child);
    });
    return index;
  }
}
exports.convert = function(code, tp) {
  tp = tp || type.analyse(code);
  if(tp.isAMD) {
    var context = tp.context;
    var index = removeAmd(context);
    return code.slice(0, index[0]) + code.slice(index[1]);
  }
  else if(tp.isCMD) {
    return code;
  }
  else if(tp.isCommonJS) {
    return 'define(function(require, exports, module) {' + code + '});';
  }
  else {
    return 'define(function(require, exports, module) {' + cjsify.convert(code, tp) + '});';
  }
};