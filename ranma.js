var cjsify = require('./cjsify');
var cmdify = require('./cmdify');

var type = require('./type');
exports.type = type;

exports.cjsify = function(code) {
  var tp = type.type(code);
  if(tp != type.COMMONJS) {
    return cjsify.convert(code, tp);
  }
  //default is cj
  return code;
};
exports.amdify = function(code) {
  //default is amd
  return code;
};
exports.cmdify = function(code) {
  //default is cmd
  return code;
};