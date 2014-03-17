var homunculus = require('homunculus');

var Token = homunculus.getClass('token');
var JsNode = homunculus.getClass('node', 'js');

var isCommonJS;
var isAMD;
var isCMD;

var Context = require('./Context');

function recursion(node, context, global) {
  var isToken = node.name() == JsNode.TOKEN;
  var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
  if(isToken) {
    if(!isVirtual) {
      var token = node.token();
      var s = token.content();
      if(['require', 'module', 'exports', 'define'].indexOf(s) > -1) {
        var parent = node.parent();
        if(parent && parent.name() == JsNode.PRMREXPR) {
          context[s] = true;
          if(s == 'define') {
            var next = parent.next();
            if(next && next.name() == JsNode.TOKEN && next.token().content() == '.') {
              next = next.next();
              if(next && next.name() == JsNode.TOKEN && next.token().content() == 'amd') {
                context.defineAmd = true;
              }
            }
          }
        }
      }
    }
  }
  else {
    if(node.name() == JsNode.VARDECL) {
      vardecl(node, context);
    }
    else if(node.name() == JsNode.FNDECL) {
      context = fndecl(node, context);
    }
    else if(node.name() == JsNode.FNEXPR) {
      context = fnexpr(node, context);
    }
    node.leaves().forEach(function(leaf, i) {
      recursion(leaf, context, global);
    });
  }
}
function vardecl(node, context) {
  var leaves = node.leaves();
  var v = leaves[0].leaves().content();
  var assign = !!leaves[1];
  context.addVar(v, assign);
}
function fndecl(node, context) {
  var v = node.leaves()[1].leaves().content();
  var child = new Context(context, v);
  var params = node.leaves()[3];
  if(params.name() == JsNode.PARAMS) {
    addParam(params, child);
  }
  return child;
}
function fnexpr(node, context) {
  //函数表达式name为空
  var child = new Context(context, null);
  var params;
  var v = node.leaves()[1];
  if(v.name() == JsNode.TOKEN) {
    params = node.leaves()[3];
  }
  else {
    params = node.leaves()[2];
  }
  if(params.name() == JsNode.PARAMS) {
    addParam(params, child);
  }
  //匿名函数检查形参传入情况
  var next = node.next();
  //!function(){}()形式
  if(next && next.name() == JsNode.ARGS) {
    var leaves = next.leaves();
    //长度2为()空参数，长度3有参数，第2个节点
    if(leaves.length == 3) {
      addAParam(leaves[1], child);
    }
  }
  //(function(){})()形式
  else {
    var prmr = node.parent();
    var prev = node.prev();
    if(prmr.name() == JsNode.PRMREXPR && prev && prev.name() == JsNode.TOKEN && prev.token().content() == '(') {
      next = prmr.next();
      if(next && next.name() == JsNode.ARGS) {
        var leaves = next.leaves();
        //长度2为()空参数，长度3有参数，第2个节点
        if(leaves.length == 3) {
          addAParam(leaves[1], child);
        }
      }
    }
  }
  return child;
}
function addParam(params, child) {
  params.leaves().forEach(function(leaf, i) {
    if(i % 2 == 0) {
      if(leaf.name() == JsNode.TOKEN) {
        child.addParam(leaf.token().content());
      }
      else if(leaf.name() == JsNode.RESTPARAM) {
        child.addParam(leaf.leaves()[1].token().content());
      }
      else if(leaf.name() == JsNode.BINDELEMENT) {
        child.addParam(leaf.leaves()[1].leaves().token().content());
      }
    }
  });
}
function addAParam(params, child) {
  params.leaves().forEach(function(leaf, i) {
    if(i % 2 == 0) {
      //仅检查prmrexpr，即直接字面变量，常量、复杂、表达式、对象属性等运行时忽略，传入null
      if(leaf.name() == JsNode.PRMREXPR) {
        var token = leaf.leaves()[0].token();
        if(token.type() == Token.ID || token.content() == 'this') {
          child.addAParam(token.content());
        }
        else {
          child.addAParam(null);
        }
      }
      else {
        child.addAParam(null);
      }
    }
  });
}

function analyse(context) {
  if(!isCommonJS && context.require && !context.getVars(true)['require'] && !context.getChildren()['require']) {
    isCommonJS = true;
  }
  if(!isCommonJS && context.module && !context.getVars(true)['module'] && !context.getChildren()['module']) {
    isCommonJS = true;
  }
  if(!isCommonJS && context.exports && !context.getVars(true)['exports'] && !context.getChildren()['exports']) {
    isCommonJS = true;
  }
  if(!isAMD && context.define && context.defineAmd && !context.getVars(true)['define'] && !context.getChildren()['define']) {
    isAMD = true;
  }
  if(!isCMD && !isAMD && context.define && !context.getVars(true)['define'] && !context.getChildren()['define']) {
    isCMD = true;
  }
  context.getChildren().forEach(function(child) {
    analyse(child);
  });
}

exports.analyse = function(code) {
  isCommonJS = false;
  isAMD = false;
  isCMD = false;

  var parser = homunculus.getParser('js');
  var node = parser.parse(code);
  var global = new Context();
  recursion(node, global, global);

  analyse(global);

  return {
    'isCommonJS': isCommonJS,
    'isAMD': isAMD,
    'isCMD': isCMD
  };
};

exports.isCommonJS = function(code) {
  if(code) {
    exports.analyse(code);
  }
  return isCommonJS;
};

exports.isAMD = function(code) {
  if(code) {
    exports.analyse(code);
  }
  return isAMD;
};

exports.isCMD = function(code) {
  if(code) {
    exports.analyse(code);
  }
  return isCMD;
};