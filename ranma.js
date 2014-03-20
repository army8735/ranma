var cjsify = require('./cjsify');
var cmdify = require('./cmdify');

var type = require('./type');

exports.type = type;

exports.cjsify = function(code) {
  return cjsify.convert(code);
};
exports.amdify = function(code) {
  return code;
};
exports.cmdify = function(code) {
  return cmdify.convert(code);
};