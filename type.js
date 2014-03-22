var homunculus = require('homunculus');
var Token = homunculus.getClass('token');
var JsNode = homunculus.getClass('node', 'js');

var isCommonJS;
var isAMD;
var isCMD;
var context;
var ast;

var Context = require('./Context');

function recursion(node, context, global) {
  var isToken = node.name() == JsNode.TOKEN;
  var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
  if(isToken) {
    if(!isVirtual) {
      var token = node.token();
      var s = token.content();
      //4个需记录的变量需判断是否是独立的PRMREXPR，否则忽略之（如a.require为MMBEXPR的后缀）
      if(['require', 'module', 'exports', 'define'].indexOf(s) > -1) {
        var parent = node.parent();
        if(parent && parent.name() == JsNode.PRMREXPR) {
          context[s] = parent;
          if(s == 'define') {
            context[s] = false;
            //define.amd判断是amd
            var next = parent.next();
            if(next && next.name() == JsNode.TOKEN && next.token().content() == '.') {
              next = next.next();
              if(next && next.name() == JsNode.TOKEN && next.token().content() == 'amd') {
                context.defineAmd = parent;
              }
            }
            //define(判断是xmd
            if(parent.parent().name() == JsNode.CALLEXPR) {
              context[s] = parent;
            }
          }
        }
      }
      //记录return语句
      else if(s == 'return') {
        context.addReturn(token);
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
    else if(node.name() == JsNode.PRMREXPR) {
      prmrexpr(node, context);
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
  //如果是define(的factory记录之
  var parent = node.parent();
  if(parent.name() == JsNode.ARGLIST) {
    parent = parent.parent();
    if(parent.name() == JsNode.ARGS) {
      var prev = parent.prev();
      if(prev && prev.name() == JsNode.PRMREXPR && prev.leaves()[0].token().content() == 'define') {
        context.defineFactory = child;
      }
    }
  }
  //记录形参
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
  //匿名函数检查实参传入情况
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
function prmrexpr(node, context) {

}

function analyse(context) {
  if(!isCommonJS && context.require && !isExist('require', context) && !inDefine(context.module)) {
    isCommonJS = true;
  }
  if(!isCommonJS && context.module && !isExist('module', context) && !inDefine(context.module)) {
    isCommonJS = true;
  }
  if(!isCommonJS && context.exports && !isExist('exports', context) && !inDefine(context.module)) {
    isCommonJS = true;
  }
  if(!isAMD && context.define && context.defineAmd && !isExist('define', context)) {
    isAMD = true;
  }
  if(!isCMD && !isAMD && context.define && !isExist('define', context)) {
    isCMD = true;
  }
  context.getChildren().forEach(function(child) {
    analyse(child);
  });
}

//检测的缓存
var cache = {};
function hasCache(v, context, type) {
  cache[type] = cache[type] || {};
  var id = context.getCid();
  return cache[type][id + v] !== undefined;
}
function getCache(v, context, type) {
  cache[type] = cache[type] || {};
  var id = context.getCid();
  return cache[type][id + v];
}
function setCache(v, context, type, val) {
  cache[type] = cache[type] || {};
  var id = context.getCid();
  cache[type][id + v] = val;
}
//检测变量是否存在
function isExist(v, context) {
  return isDeclared(v, context) || isChild(v, context) || isParam(v, context);
}
//检测变量在当前上下文中是否是声明，需递归向上
function isDeclared(v, context) {
  if(hasCache(v, context, 'var')) {
    return getCache(v, context, 'var');
  }
  var res = context.hasVar(v);
  setCache(v, context, 'var', res);
  var p = context.getParent();
  if(res) {
    return true;
  }
  else if(p) {
    return isDeclared(v, p);
  }
  return res;
}
//检测变量在当前上下文中是否是函数名，需递归向上
function isChild(v, context) {
  if(hasCache(v, context, 'child')) {
    return getCache(v, context, 'child');
  }
  var res = context.hasChild(v);
  setCache(v, context, 'child', res);
  var p = context.getParent();
  if(res) {
    return true;
  }
  else if(p) {
    return isChild(v, p);
  }
  return res;
}
//检测变量在当前上下文中是否是形参，需递归向上
function isParam(v, context) {
  if(hasCache(v, context, 'param')) {
    return getCache(v, context, 'param');
  }
  var res = context.hasParam(v);
  setCache(v, context, 'param', res);
  var p = context.getParent();
  if(res) {
    return true;
  }
  else if(p) {
    return isParam(v, p);
  }
  return res;
}
//检测require，module和exports是否出现在define(中
function inDefine(token) {
  while(token = token.parent()) {
    if(token.name() == JsNode.CALLEXPR) {
      var id = token.leaves()[0].leaves()[0];
      if(id.name() == JsNode.TOKEN && id.token().content() == 'define') {
        return true;
      }
    }
  }
  return false;
}

exports.analyse = function(code) {
  isCommonJS = false;
  isAMD = false;
  isCMD = false;

  var parser = homunculus.getParser('js');
  ast = parser.parse(code);
  context = new Context();
  //根据ast生成上下文
  recursion(ast, context, context);
  //分析上下文
  analyse(context);

  return {
    'isCommonJS': isCommonJS,
    'isAMD': isAMD,
    'isCMD': isCMD,
    'context': context,
    'ast': ast
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