var type = require('./type');
var cjsify = require('./cjsify');

exports.convert = function(code, tp) {
  tp = tp || type.analyse(code);
  if(tp.isAMD) {
    var context = tp.context;
    return code;
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