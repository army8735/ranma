var type = require('./type');
var cmdify = require('./cmdify');

var homunculus = require('homunculus');
var JsNode = homunculus.getClass('node', 'js');
var Token = homunculus.getClass('token');

function pushToken(node, arr) {
  arr = arr || [];
  var isToken = node.name() == JsNode.TOKEN;
  var isVirtual = isToken && node.token().type() == Token.VIRTUAL;
  if(isToken) {
    if(!isVirtual) {
      var token = node.token();
      arr.push(token.sIndex());
      arr.push(token.sIndex() + token.content().length);
    }
  }
  else {
    node.leaves().forEach(function(leaf) {
      pushToken(leaf, arr);
    });
  }
  return arr;
}

//获取define(factory)的节点
function getDefineAndFactory(context) {
  if(context.hasVid('define')) {
    var define = context.getVid('define');
    for(var i = 0; i < define.length; i++) {
      var par = define[i].parent();
      if(par
        && par.next()
        && par.next().name() == JsNode.ARGS) {
        var factory = par.next().leaves()[1].leaves().slice(-1)[0];
        var deps = null;
        if(factory.prev()
          && factory.prev().prev()
          && factory.prev().prev().name() == JsNode.PRMREXPR
          && factory.prev().prev().leaves()[0].name() == JsNode.ARRLTR) {
          deps = factory.prev().prev().leaves()[0];
        }
        return {
          'define': define[i],
          'deps': deps,
          'factory': factory,
          'context': context
        };
      }
    }
  }
  else {
    var res;
    context.getChildren().forEach(function(child) {
      res = res || getDefineAndFactory(child);
    });
    return res;
  }
}

var globalVars = Object.create(null);
['window',
  'global',
  'Error',
  'document',
  'navigator',
  'this',
  'undefined',
  'null',
  'location',
  'console'].forEach(function(o) {
  globalVars[o] = true;
});
var globalParam = Object.create(null);
['window', 'this'].forEach(function(o) {
  globalParam[o] = true;
});

exports.convert = function(code, tp) {
  tp = tp || type.analyse(code);
  if(tp.isCommonJS) {
    return code;
  }
  else if(tp.isModule) {
    return tp.code;
  }
  else if(tp.es6) {
    return exports.convert(tp.code);
  }
  else if(tp.isAMD) {
    var res = cmdify.convert(code, tp);
    return exports.convert(res);
  }
  else if(tp.isCMD) {
    var context = tp.context;
    var defFact = getDefineAndFactory(context);
    var defBlock = pushToken(defFact.define.parent().parent());
    var facBlock = pushToken(defFact.factory);
    //如果define的父语句是ifstmt，则将其删除
    if(defFact.define.parent().name() == JsNode.PRMREXPR
      && defFact.define.parent().parent()
      && defFact.define.parent().parent().name() == JsNode.CALLEXPR
      && defFact.define.parent().parent().parent()
      && defFact.define.parent().parent().parent().name() == JsNode.EXPRSTMT) {
      if(defFact.define.parent().parent().parent().parent()
        && defFact.define.parent().parent().parent().parent().name() == JsNode.IFSTMT) {
        defBlock = pushToken(defFact.define.parent().parent().parent().parent());
      }
      else if(defFact.define.parent().parent().parent().parent()
        && defFact.define.parent().parent().parent().parent().name() == JsNode.BLOCK
        && defFact.define.parent().parent().parent().parent().parent()
        && defFact.define.parent().parent().parent().parent().parent().name() == JsNode.IFSTMT) {
        defBlock = pushToken(defFact.define.parent().parent().parent().parent().parent());
      }
    }
    //将factory代码提取出来，删除define语句
    //factory为函数时，将return语句改为module.exports
    if(defFact.factory.name() == JsNode.FNEXPR) {
      var fnbody = defFact.factory.leaves().slice(-2)[0];
      var blockStart = fnbody.prev();
      var blockEnd = fnbody.next();
      var fac = code.slice(blockStart.token().sIndex() + 1, blockEnd.token().sIndex());
      //遍历子上下文，找到属于factory的那个，从而找到return语句
      var children = defFact.context.getChildren();
      for(var i = 0; i < children.length; i++) {
        var ctx = children[i];
        if(ctx.isFnexpr() && ctx.getNode() == defFact.factory) {
          var rets = ctx.getReturns();
          if(rets.length) {
            var index = blockStart.token().sIndex() + 1;
            //倒序删除return语句并添加module.exports
            rets.reverse().forEach(function(ret) {
              var token = ret.token();
              var v = ret.next();
              //return;语句可能无返回值，设为undefined
              var s = 'module.exports =' + ((v.name() == JsNode.TOKEN) ? ' undefined' : '');
                fac = fac.slice(0, token.sIndex() - index)
                  + s
                  + fac.slice(token.sIndex() - index + token.content().length);
            });
          }
          break;
        }
      }
      return code.slice(0, defBlock[0])
        + fac
        + code.slice(defBlock[defBlock.length - 1]);
    }
    //factory为非函数时
    else {
      var node = defFact.factory.leaves()[0];
      //factory为变量引用需特殊处理
      if(node.name() == JsNode.TOKEN && node.token().type() == Token.ID) {
        return code.slice(0, defBlock[0])
          + 'if(Object.prototype.toString.call(' + node.token().content() + ') == "[object Function]") { '
            + '~function(){ var res = ' + node.token().content() + '();'
              + 'if(typeof res != "undefined") { module.exports = res } }'
            + '()'
          + ' } else { ' + 'module.exports = '
            + code.slice(facBlock[0], facBlock[facBlock.length - 1])
          + ' }'
          + code.slice(defBlock[defBlock.length - 1]);
      }
      //其它情况直接返回
      else {
        return code.slice(0, defBlock[0])
          + 'module.exports = '
          + code.slice(facBlock[0], facBlock[facBlock.length - 1])
          + code.slice(defBlock[defBlock.length - 1]);
      }
    }
  }
  else {
    var context = tp.context;
    //全局变量，包括全局函数
    var gVars = context.getVars().map(function(v) {
      return v.leaves()[0].token().content();
    });
    var gChildren = context.getChildren();
    gChildren.forEach(function(child) {
      if(child.getName()) {
        gVars.push(child.getName());
      }
    });
    //全局使用的未声明的变量
    var hash = Object.create(null);
    var reqs = context.getVids().map(function(v) {
      return v.token().content();
    }).filter(function(v) {
      if(!context.hasVar(v) && !context.hasChild(v) && !(v in globalVars)) {
        if(v in hash) {
          return false;
        }
        hash[v] = true;
        return true;
      }
    });
    var requires = '';
    reqs.forEach(function(req) {
      requires += 'var ' + req + ' = require("' + req + '");';
    });
    //没有全局变量检查匿名函数的写法，即全局只有一个匿名函数上下文
    if(gVars.length == 0) {
      var exp = '';
      if(gChildren.length == 1 && gChildren[0].isFnexpr()) {
        var aparams = gChildren[0].getAParams();
        var params = gChildren[0].getParams();
        var globalRef = Object.create(null);
        //实参为this或window则说明传入全局引用
        aparams.forEach(function(aparam, i) {
          if(aparam.name() == JsNode.PRMREXPR
            && aparam.leaves().length == 1
            && aparam.leaves()[0].name() == JsNode.TOKEN
            && aparam.leaves()[0].token().content() in globalParam) {
            globalRef[params[i]] = true;
          }
        });
        var thisIs = gChildren[0].getThis();
        //call或者apply的写法中要检查第一个参数是否是this或者window或者null
        if(thisIs === null
          || (thisIs.name() == JsNode.PRMREXPR
            && thisIs.leaves().length == 1
            && thisIs.leaves()[0].name() == JsNode.TOKEN
            && (thisIs.leaves()[0].token().content() in globalParam
              || thisIs.leaves()[0].token().content() == 'null'))) {
          globalRef['this'] = true;
        }
        //直接使用window且参数中无window
        if(!gChildren[0].hasParam('window')) {
          globalRef['window'] = true;
        }
        var hash = Object.create(null);
        var arr = [];
        //使用值为全局的参数引用，并且在这个引用的属性上赋值，相当于全局声明变量
        gChildren[0].getVids().forEach(function(vid) {
          if(vid.token().content() in globalRef
            && vid.parent().name() == JsNode.PRMREXPR
            && vid.parent().parent().name() == JsNode.MMBEXPR
            && vid.parent().parent().parent().name() == JsNode.ASSIGNEXPR
            && vid.parent().next()
            && vid.parent().next().token().content() == '.'
            && vid.parent().next().next()
            && vid.parent().next().next().token().type() == Token.ID
            && !vid.parent().next().next().next()) {
            var v = vid.parent().next().next().token().content();
            if(!(v in hash)) {
              hash[v] = true;
              arr.push(v);
            }
          }
        });
        if(arr.length == 1) {
          exp = ';module.exports = this.' + arr[0] + ';';
        }
        else if(arr.length > 1) {
          arr.forEach(function(v) {
            exp += ';exports["' + v + '"] = this.' + v + ';';
          });
        }
      }
      return requires + code + exp;
    }
    //只有一个则直接赋给module.exports
    else if(gVars.length == 1) {
      return requires + code + ';module.exports = ' + gVars[0] + ';';
    }
    //有多个将变量名作为key加上值组成hash赋给exports
    else {
      var res = requires + code + ';';
      gVars.forEach(function(v) {
        res += 'exports["' + v + '"] = ' + v + ';';
      });
      return res;
    }
  }
};