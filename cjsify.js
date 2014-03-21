var type = require('./type');

var homunculus = require('homunculus');
var JsNode = homunculus.getClass('node', 'js');
var Token = homunculus.getClass('token');

function removeAmd(context) {
  if(context.defineAmd) {
    var parent = context.defineAmd;
    while(parent = parent.parent()) {
      if(parent.name() == JsNode.IFSTMT) {
        //将判断define.amd的if语句的全部token的sIndex依次放入数组，取首尾即得区间
        var arr = [];
        pushToken(parent, arr);
        return [arr[0], arr[arr.length - 1]];
      }
    }
  }
  else {
    var index;
    context.getChildren().forEach(function(child) {
      index = index || removeAmd(child);
    });
    return index;
  }
}
function removeDefine(context) {
  if(context.define) {
    var parent = context.define.parent();
    //将判断define(的callexpr的全部token的sIndex依次放入数组，取首尾即得区间
    var arr = [];
    pushToken(parent, arr);
    return [arr[0], arr[arr.length - 1]];
  }
  else {
    var index;
    context.getChildren().forEach(function(child) {
      index = index || removeDefine(child);
    });
    return index;
  }
}
//提取出define(..factory)，只判断第一个出现的，不支持多define
function getFactory(context) {
  if(context.define) {
    var args = context.define.next().leaves()[1].leaves();
    var factory = args[args.length - 1];
    //将factory的全部token的sIndex依次放入数组，取首尾即得区间
    var arr = [];
    pushToken(factory, arr);
    var deps = [];
    var params = [];
    var isFn = factory.name() == JsNode.FNEXPR;
    //提取依赖文本
    if(args.length > 1) {
      var node = args[args.length - 3];
      if(node.name() == JsNode.ARRLTR) {
        node.leaves().forEach(function(param, i) {
          if(i % 2 == 1) {
            deps.push({
              v: param.leaves()[0].token().content()
            });
          }
        });
      }
      //提取factory的依赖变量
      if(isFn) {
        node = factory.leaves()[2];
        if(node.name() == JsNode.TOKEN && node.token().content() == '(') {
          node = node.next();
        }
        if(node.name() == JsNode.FNPARAMS) {
          node.leaves().forEach(function(param, i) {
            if(i % 2 == 0) {
              params.push(param.token().content());
            }
          });
        }
      }
    }
    //如果是fn提取block区间
    var blockStart, blockEnd;
    if(isFn) {
      var leaves = factory.leaves();
      blockStart = leaves[0].token().sIndex(); //todo
      blockEnd = leaves[leaves.length - 1].token().sIndex();
    }
    return {
      start: arr[0],
      end: arr[arr.length - 1],
      context: context.defineFactory,
      factory: factory,
      deps: deps,
      params: params,
      isFn: isFn,
      blockStart: blockStart,
      blockEnd: blockEnd
    };
  }
  else {
    var res;
    context.getChildren().forEach(function(child) {
      res = res || getFactory(child);
    });
    return res;
  }
}
function pushToken(node, arr) {
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
}
function hasExports(context) {
  return context.module || context.exports;
}

exports.convert = function(code, tp) {
  tp = tp || type.analyse(code);
  if(tp.isCommonJS) {
    return code;
  }//todo
  else if(tp.isAMD) {
    var context = tp.context;
    var index = getFactory(context);
    var factory = code.slice(index[0], index[1]);
    //函数形式的factory将其改写为执行
    if(/^function\b/.test(factory)) {
      factory = '(' + factory + ')()';
    }
    var amdIndex = removeAmd(context);
    return code.slice(0, amdIndex[0]) + 'module.exports = ' + factory + ';' + code.slice(amdIndex[1]);
  }
  else if(tp.isCMD) {
    var context = tp.context;
    var factory = getFactory(context);
    //factory不是函数时，直接将对象赋给exports
    if(!factory.isFn) {
      return 'module.expors = ' + code.slice(factory.start, factory.end);
    }
    //当factory有exports时直接返回
    if(hasExports(factory.context)) {
      return code.slice(factory.blockStart + 1, factory.blockEnd);
    }//todo
    //没有将可能存在的return改写为exports
    var rets = getReturns();
    index = removeDefine(context);
    return code.slice(0, index[0]) + 'module.exports = ' + factory + ';' + code.slice(index[1]);
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