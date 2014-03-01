var Lexer = require('./lexer/Lexer');
var EsRule = require('./lexer/rule/EcmascriptRule');
var Token = require('./lexer/Token');
var character = require('./util/character');

var lexer = new Lexer(new EsRule());

var cjsify = require('./cjsify')

exports.UNKNOW = 0;
exports.COMMONJS = 1;
exports.AMD = 2;
exports.CMD = 3;

exports.type = function(code) {
    var tokens = lexer.parse(code);
    //忽略ignore类型
    tokens = tokens.filter(function(token) {
        return token.type() != Token.IGNORE;
    });

    var type = exports.UNKNOW;
    var token;
    outer:
    for(var i = 0, len = tokens.length; i < len; i++) {
        token = tokens[i];
        if(token.type() == Token.ID) {
            if(token.val() == 'define') {
                //可能是xxx.define，需忽略，但window.define等类似变量赋值无法做到，需语义分析
                var prev = tokens[i-1];
                if(prev && prev.val() == '.') {
                    continue;
                }
                //define(
                token = tokens[++i];
                if(token && token.val() != '(') {
                    continue;
                }
                //define(id,?
                if(token && token.type() == Token.STRING) {
                    i++;
                    token = tokens[++i];
                }
                var depsNum = 0;
                //define(id,? deps,?
                if(token && token.val() == '[') {
                    i++;
                    for(; i < len; i++) {
                        token = token[i];
                        if(token.type() == Token.STRING) {
                            depsNum++;
                        }
                        else if(token.val() == ']') {
                            i += 2;
                            token = tokens[i];
                            break;
                        }
                    }
                }
                //define(id,? deps,? factory
                if(token) {
                    if(token.val() == 'function') {
                        if(depsNum == 0) {
                            return exports.CMD;
                        }
                        //有deps并且factory的形参超出require,module,exports的为AMD
                        i += 2;
                        for(; i < len; i++) {
                            token = tokens[i];
                            if(token.val() == ',' || ['require', 'exports', 'module'].indexOf(token.val()) > -1) {
                                continue;
                            }
                            else if(token.type() == Token.ID) {
                                return exports.AMD;
                            }
                            else {
                                return exports.CMD;
                            }
                        }
                    }
                    else if([Token.ID, Token.STRING, Token.NUMBER, Token.REG, Token.TEMPLATE].indexOf(token.type()) > -1) {
                        return exports.CMD;
                    }
                }
            }
            else if(['require', 'exports', 'module'].indexOf(token.val()) > -1) {
                //可能是xxx.require，需忽略，但window.require等类似变量赋值无法做到，需语义分析
                var prev = tokens[i-1];
                if(prev && prev.val() == '.') {
                    continue;
                }
                type = exports.COMMONJS;
            }
        }
    }
    return type;
}


exports.cjsify = function(code) {
    var type = exports.type(code);
    if(type == exports.UNKNOW) {
        return cjsify.convert(code);
    }
    else if(type == exports.AMD) {

    }
    else if(type == exports.CMD) {

    }
    //default is cj
    return code;
}
exports.amdify = function(code) {
    var type = exports.type(code);
    if(type == exports.COMMONJS) {
    }
    else if(type == exports.CMD) {
    }
    else if(type == exports.UNKNOW) {
    }
    //default is amd
    return code;
}
exports.cmdify = function(code) {
    var type = exports.type(code);
    if(type == exports.COMMONJS) {
    }
    else if(type == exports.AMD) {
    }
    else if(type == exports.UNKNOW) {
    }
    //default is cmd
    return code;
}