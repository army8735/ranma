//var Lexer = require('./lexer/Lexer');
//var EsRule = require('./lexer/rule/EcmascriptRule');
//var Token = require('./lexer/Token');
//var character = require('./util/character');
//
//var lexer = new Lexer(new EsRule());
//
//var type = require('./type');
//var cmdify = require('./cmdify');
//
//var fs = require('fs');
//
//exports.convert = function(code, tp) {
//  var tokens = lexer.parse(code);
//  var s = '';
//
//  if(tp == type.AMD || tp == type.CMD) {
//    s += fs.readFileSync('./template/define.js', { encoding: 'utf-8' });
//    if(tp == type.AMD) {
//      return s + cmdify.convert(code, type.AMD);
//    }
//    else {
//      return s + code;
//    }
//  }
//  else if(tp == type.UNKNOW) {
//
//  }
//};