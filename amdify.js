var type = require('./type');
var cmdify = require('./cmdify');

exports.convert = function(code, tp) {
  tp = tp || type.analyse(code);
  if(tp.isAMD) {
    return code;
  }
  else if(tp.isCMD) {
    return code;
  }
  else if(tp.isCommonJS) {
    return cmdify.convert(code, tp);
  }
  else {
    return cmdify.convert(code, tp);
  }
};