var cjsify = require('./cjsify');
var cmdify = require('./cmdify');
var amdify = require('./amdify');

var type = require('./type');

exports.type = type;

exports.cjsify = function(code) {
  return cjsify.convert(code);
};
exports.amdify = function(code) {
  return amdify.convert(code);
};
exports.cmdify = function(code) {
  return cmdify.convert(code);
};