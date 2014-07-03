var homunculus = require('homunculus');
var Token = homunculus.getClass('token');
var JsNode = homunculus.getClass('node', 'js');
var Es6Node = homunculus.getClass('node', 'es6');

var jsdc = require('jsdc');

var exist = require('./exist');

var isCommonJS;
var isAMD;
var isCMD;
var isModule;

function analyse(context) {
  if(!isCommonJS) {
    if(context.hasVid('require') && !exist.isExist('require', context) && !exist.inDefine(context)) {
      isCommonJS = true;
    }
    if(context.hasVid('module') && !exist.isExist('module', context) && !exist.inDefine(context)) {
      isCommonJS = true;
    }
    if(context.hasVid('exports') && !exist.isExist('exports', context) && !exist.inDefine(context)) {
      isCommonJS = true;
    }
  }
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
        isCMD = false;
        isAMD = true;
      }
      else if(!isAMD
        && par
        && par.next()
        && par.next().name() == JsNode.ARGS
        && par.next().leaves().length == 3) {
        //检查factory的参数是否是require,exports,module的CMD写法；
        var arglist = par.next().leaves()[1];
        var factory = arglist.leaves().slice(-1)[0];
        if(factory.name() == JsNode.FNEXPR) {
          var fnparams = factory.leaves()[2];
          if(fnparams.name() == JsNode.TOKEN && fnparams.token().content() == '(') {
            fnparams = fnparams.next();
          }
          if(fnparams.name() == JsNode.FNPARAMS) {
            var params = [];
            fnparams.leaves().forEach(function(leaf, i) {
              if(i % 2 == 0) {
                var name = leaf.token().content();
                params.push(name);
              }
            });
            if(params.join(',') != 'require,exports,module') {
              isAMD = true;
            }
          }
          //factory无参数是AMD
          else {
            isAMD = true;
          }
        }
        if(!isAMD) {
          isCMD = true;
        }
      }
    }
  }
  context.getChildren().forEach(function(child) {
    analyse(child);
  });
}

exports.analyse = function(code) {
  isCommonJS = false;
  isAMD = false;
  isCMD = false;
  isModule = false;

  var ast;
  jsdc.reset();
  var es6 = jsdc.parse(code);
  //jsdc编译不会动es5部分，只要有修改就是es6语法
  if(code && es6 != code) {
    ast = jsdc.ast();
    if(ast.first() && ast.first().name() == Es6Node.MODULEBODY) {
      isModule = true;
    }
  }
  else {
    var context = homunculus.getContext('js');
    context.parse(code);
    //分析上下文
    analyse(context);
    ast = context.parser.ast();
  }

  return {
    'code': es6,
    'es6': code && es6 != code,
    'isCommonJS': isCommonJS,
    'isAMD': isAMD,
    'isCMD': isCMD,
    'isModule': isModule,
    'context': context || null,
    'ast': ast
  };
};

exports.isCommonJS = function(code) {
  exports.analyse(code || '');
  return isCommonJS;
};

exports.isAMD = function(code) {
  exports.analyse(code || '');
  return isAMD;
};

exports.isCMD = function(code) {
  exports.analyse(code || '');
  return isCMD;
};

exports.isModule = function(code) {
  exports.analyse(code || '');
  return isModule;
};