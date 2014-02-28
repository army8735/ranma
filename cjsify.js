var Lexer = require('./lexer/Lexer');
var EsRule = require('./lexer/rule/EcmascriptRule');
var Token = require('./lexer/Token');
var character = require('./util/character');

var lexer = new Lexer(new EsRule());

exports.convert = function(code) {
    return code;
}