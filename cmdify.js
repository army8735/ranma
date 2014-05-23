var type = require('./type');
var cjsify = require('./cjsify');
var exist = require('./exist');

var homunculus = require('homunculus');
var JsNode = homunculus.getClass('node', 'js');

//将 &&define.amd 判断移除，只判断第一个出现的，不支持多define
function getDefineAmd(context) {
  if(context.hasVid('define') && !exist.isExist('define', context)) {
    var define = context.getVid('define');
    for(var i = 0; i < define.length; i++) {
      var par = define[i].parent();
      if(par
        && par.next()
        && par.next().name() == JsNode.TOKEN
        && par.next().token().content() == '.'
        && par.next().next()
        && par.next().next().name() == JsNode.TOKEN
        && par.next().next().token().content() == 'amd') {
        var res = {
          'start': define[i].token().sIndex(),
          'end': define[i].token().sIndex(),
          'context': context
        };
        //将&& define.amd移除
        var mmb = par.parent();
        if(mmb.name() == JsNode.MMBEXPR) {
          var prev = mmb.prev();
          if(prev && prev.name() == JsNode.TOKEN && prev.token().content() == '&&') {
            res.start = [prev.token().sIndex()];
            var end = par.next().next();
            end = end.token();
            res.end = end.sIndex() + end.content().length;
            //后面多个&& define.amd.xxx判断也需移除
            while(mmb = mmb.next()) {
              if(mmb.name() == JsNode.TOKEN && mmb.token().content() == '&&') {
                mmb = mmb.next();
                if(mmb.name() == JsNode.MMBEXPR) {
                  var leaves = mmb.leaves();
                  if(leaves[0].name() == JsNode.PRMREXPR
                    && leaves[0].leaves()[0].name() == JsNode.TOKEN
                    && leaves[0].leaves()[0].token().content() == 'define') {
                    end = leaves[0];
                    while(end.next()) {
                      end = end.next();
                    }
                    end = end.token();
                    res.end = end.sIndex() + end.content().length;
                  }
                }
              }
            }
            return res;
          }
        }
      }
    }
  }
  else {
    var index;
    context.getChildren().forEach(function(child) {
      index = index || getDefineAmd(child);
    });
    return index;
  }
}
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
function getDefineDeps(defFact) {
  var res = {
    'array': null,
    'params': null
  };
  //factory为函数时，将依赖改写为cmd形式的require
  if(defFact.factory.name() == JsNode.FNEXPR) {
    if(defFact.deps) {
      var leaves = defFact.deps.leaves();
      res.array = {
        'start': leaves[0].token().sIndex(),
        'end': defFact.factory.prev().token().sIndex() + 1,
        'source': []
      };
      if(leaves.length > 2) {
        leaves.forEach(function(leaf, i) {
          if(i % 2 == 1) {
            res.array.source.push(leaf.leaves()[0].token().content());
          }
        });
      }
    }
    var fnparams = defFact.factory.leaves()[2];
    if(fnparams.name() == JsNode.TOKEN && fnparams.token().content() == '(') {
      fnparams = fnparams.next();
    }
    //记录原本参数位置
    if(fnparams.name() == JsNode.FNPARAMS) {
      var leaves = fnparams.leaves();
      res.params = {
        'start': leaves[0].token().sIndex(),
        'source': []
      }
      leaves.forEach(function(leaf, i) {
        if(i % 2 == 0) {
          res.params.end = leaf.token().sIndex() + leaf.token().content().length;
          res.params.source.push(leaf.token().content());
        }
      });
    }
    //没有参数的情况
    else {
      res.params = {
        'start': fnparams.token().sIndex(),
        'end': fnparams.token().sIndex(),
        'source': []
      };
    }
    res.fnbody = defFact.factory.leaves().slice(-3)[0].token().sIndex() + 1;
  }
  return res;
}

exports.convert = function(code, tp) {
  tp = tp || type.analyse(code);
  if(tp.isAMD) {
    var context = tp.context;
    var defAmd = getDefineAmd(context);
    //factory会在define.amd后出现
    var defFact = getDefineAndFactory(defAmd ? defAmd.context : context);
    var defDeps = getDefineDeps(defFact);
    if(defDeps) {
      if(defDeps.params) {
        var req = '';
        defDeps.params.source.forEach(function(d, i) {
          if(d != 'require' && d != 'exports' && d != 'module') {
            //AMD和CMD有区别，非绝对路径都是相对当前路径，即"a"->"./a"
            var s = defDeps.array.source[i];
            if(/^['"][^./]/.test(s)) {
              s = s.charAt(0) + './' + s.slice(1)
            }
            req += 'var ' + d + ' = require(' + s + ');';
          }
        });
        code = (defDeps.array ? (code.slice(0, defDeps.array.start)
            + code.slice(defDeps.array.start, defDeps.array.end).replace(/(["']).+?\1/g, function(s) {
              if(/^['"][^./]/.test(s)) {
                s = s.charAt(0) + './' + s.slice(1);
              }
              return s;
            })
            + code.slice(defDeps.array.end, defDeps.params.start)
          ) : code.slice(0, defDeps.params.start))
          + 'require, exports, module' + code.slice(defDeps.params.end, defDeps.fnbody)
          + req
          + code.slice(defDeps.fnbody);
      }
    }
    //将可能的define.amd删除
    if(defAmd) {
      code = code.slice(0, defAmd.start) + code.slice(defAmd.end);
    }
    return code;
  }
  else if(tp.isCMD) {
    return code;
  }
  else if(tp.isCommonJS) {
    return 'define(function(require, exports, module) {' + code + '});';
  }
  else {
    return 'define(function(require, exports, module) {' + cjsify.convert(code, tp) + '});';
  }
};