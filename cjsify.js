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

exports.convert = function(code, tp) {
  tp = tp || type.analyse(code);
  if(tp.isCommonJS) {
    return code;
  }
  //todo 对define的if判断语句移除
  else if(tp.isAMD) {
    var res = cmdify.convert(code, tp);
    return exports.convert(res);
  }
  else if(tp.isAMD || tp.isCMD) {
    if(tp.isAMD) {
      code = cmdify.convert(code, tp);
    }
    var context = tp.context;
    var defFact = getDefineAndFactory(context);
    var defBlock = pushToken(defFact.define.parent().parent());
    var facBlock = pushToken(defFact.factory);
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
              var s = 'module.exports =' + ((v.name() == JsNode.TOKEN) ? 'null' : '');
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
    //factory为非函数时，直接添加module.exports
    //TODO 也可能为传入的函数引用变量，暂且不考虑
    return code.slice(0, defBlock[0])
      + 'module.exports = '
      + code.slice(facBlock[0], facBlock[facBlock.length - 1])
      + code.slice(defBlock[defBlock.length - 1]);
  }
  else {
    var context = tp.context;
    //全局变量，包括全局函数
    var gVars = context.getVars();
    var gChildren = context.getChildren();
    gChildren.forEach(function(child) {
      if(child.getName()) {
        gVars.push(child.getName());
      }
    });
    //没有全局变量赋值null，只有一个则直接赋给module.exports；否则将变量名作为key加上值组成hash赋给exports
    if(gVars.length == 0) {
      return code + ';module.exports = null;'
    }
    else if(gVars.length == 1) {
      return code + ';module.exports = ' + gVars[0] + ';';
    }
    else {
      var res = code + ';';
      gVars.forEach(function(v) {
        res += 'exports["' + v + '"] = ' + 'v;';
      });
    }
  }
};