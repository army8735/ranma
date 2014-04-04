var type = require('./type');
var cjsify = require('./cjsify');
var exist = require('./exist');

var homunculus = require('homunculus');
var JsNode = homunculus.getClass('node', 'js');

//将 &&define.amd 判断移除，只判断第一个出现的，不支持多define
function removeAmd(context) {
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
        var res = [define[i].token().sIndex()];
        //将&& define.amd移除
        var mmb = par.parent();
        if(mmb.name() == JsNode.MMBEXPR) {
          var prev = mmb.prev();
          if(prev && prev.name() == JsNode.TOKEN && prev.token().content() == '&&') {
            res[0] = [prev.token().sIndex()];
            var end = par.next().next();
            end = end.token();
            res[1] = end.sIndex() + end.content().length;
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
                    res[1] = end.sIndex() + end.content().length;
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
      index = index || removeAmd(child);
    });
    return index;
  }
}

exports.convert = function(code, tp) {
  tp = tp || type.analyse(code);
  if(tp.isAMD) {
    var context = tp.context;
    var index = removeAmd(context);
    //amd以define.amd作为判断一定会出现
    return code.slice(0, index[0]) + code.slice(index[1]);
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