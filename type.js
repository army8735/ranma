var homunculus = require('homunculus');

var Token = homunculus.getClass('token');
var JsNode = homunculus.getClass('node', 'js');

var isCommonJS;
var isAMD;
var isCMD;

var varables;
var depth;

function recursion(node) {
  var isToken = node.name() == JsNode.TOKEN;
  var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
  if(isToken) {
    if(!isVirtual) {
    }
  }
  else {
    if(node.name() == JsNode.VARDECL) {
      vardecl(node);
    }
    else if(node.name() == JsNode.FNDECL) {
      fndecl(node);
      depth++;
      varables.push([]);
    }
    node.leaves().forEach(function(leaf, i) {
      recursion(leaf);
    });
    if(node.name() == JsNode.FNDECL) {
      depth--;
    }
  }
}
function vardecl(node) {
  var v = node.leaves()[0].leaves().content();
  var arr = varables[depth];
  if(arr.indexOf(v) == -1) {
    arr.push(v);
  }
}
function fndecl(node) {
  var v = node.leaves()[1].leaves().content();
  var arr = varables[depth];
  if(arr.indexOf(v) == -1) {
    arr.push(v);
  }
}

exports.type = function(code) {
  isCommonJS = false;
  isAMD = false;
  isCMD = false;

  varables = [[]];
  depth = 0;

  var parser = homunculus.getParser('js');
  var node = parser.parse(code);
  recursion(node);console.log(varables)
};

exports.isCommonJS = function(code) {
  if(code) {
    exports.type(code);
  }
  return isCommonJS;
};

exports.isAMD = function(code) {
  if(code) {
    exports.type(code);
  }
  return isAMD;
};
//
//exports.type = function(code) {
//  var token;
//  outer:
//    for(var i = 0, len = tokens.length; i < len; i++) {
//      token = tokens[i];
//      if(token.type() == Token.ID) {
//        if(token.val() == 'define') {
//          //可能是xxx.define，需忽略，但window.define等类似变量赋值无法做到，需语义分析
//          var prev = tokens[i-1];
//          if(prev && prev.val() == '.') {
//            continue;
//          }
//          //define(
//          token = tokens[++i];
//          if(token && token.val() != '(') {
//            continue;
//          }
//          //define(id,?
//          if(token && token.type() == Token.STRING) {
//            i++;
//            token = tokens[++i];
//          }
//          var depsNum = 0;
//          //define(id,? deps,?
//          if(token && token.val() == '[') {
//            i++;
//            for(; i < len; i++) {
//              token = token[i];
//              if(token.type() == Token.STRING) {
//                depsNum++;
//              }
//              else if(token.val() == ']') {
//                i += 2;
//                token = tokens[i];
//                break;
//              }
//            }
//          }
//          //define(id,? deps,? factory
//          if(token) {
//            if(token.val() == 'function') {
//              if(depsNum == 0) {
//                return exports.CMD;
//              }
//              //有deps并且factory的形参超出require,module,exports的为AMD
//              i += 2;
//              for(; i < len; i++) {
//                token = tokens[i];
//                if(token.val() == ',' || ['require', 'exports', 'module'].indexOf(token.val()) > -1) {
//                  continue;
//                }
//                else if(token.type() == Token.ID) {
//                  return exports.AMD;
//                }
//                else {
//                  return exports.CMD;
//                }
//              }
//            }
//            else if([Token.ID, Token.STRING, Token.NUMBER, Token.REG, Token.TEMPLATE].indexOf(token.type()) > -1) {
//              return exports.CMD;
//            }
//          }
//        }
//        else if(['require', 'exports', 'module'].indexOf(token.val()) > -1) {
//          //可能是xxx.require，需忽略，但window.require等类似变量赋值无法做到，需语义分析
//          var prev = tokens[i-1];
//          if(prev && prev.val() == '.') {
//            continue;
//          }
//          if(tp == exports.UNKNOW) {
//            tp = exports.COMMONJS;
//          }
//        }
//      }
//    }
//  return tp;
//};