var homunculus = require('homunculus');
var Token = homunculus.getClass('token');
var JsNode = homunculus.getClass('node', 'js');

//检测的缓存
var cache = {};
function hasCache(v, context, type) {
  cache[type] = cache[type] || {};
  var id = context.getId();
  return cache[type][id + v] !== undefined;
}
function getCache(v, context, type) {
  cache[type] = cache[type] || {};
  var id = context.getId();
  return cache[type][id + v];
}
function setCache(v, context, type, val) {
  cache[type] = cache[type] || {};
  var id = context.getId();
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
//检测是否出现在define()中
function inDefine(context) {
  if(hasCache('define', context, 'inDefine')) {
    return getCache('define', context, 'inDefine');
  }
  var node = context.getNode();
  if(node && node.name() == JsNode.FNEXPR) {
    var par = node.parent();
    if(par.name() == JsNode.ARGLIST) {
      par = par.parent();
      if(par.name() == JsNode.ARGS) {
        var pre = par.prev();
        if(pre && pre.name() == JsNode.PRMREXPR) {
          var name = pre.leaves()[0].token().content();
          if(name == 'define') {
            setCache('define', context, 'inDefine', true);
            return true;
          }
        }
      }
    }
  }
  var p = context.getParent();
  if(p) {
    return inDefine(p);
  }
  setCache('define', context, 'inDefine', false);
  return false;
}

module.exports = {
  'isExist': isExist,
  'isDeclared': isDeclared,
  'isChild': isChild,
  'isParam': isParam,
  'inDefine': inDefine
};