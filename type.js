var homunculus = require('homunculus');
var Token = homunculus.getClass('token');
var JsNode = homunculus.getClass('node', 'js');

var exist = require('./exist');

var isCommonJS;
var isAMD;
var isCMD;

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
        && par.next().name() == JsNode.ARGS) {
        isCMD = true;
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

  var context = homunculus.getContext('js');
  context.parse(code);
  //分析上下文
  analyse(context);

  return {
    'isCommonJS': isCommonJS,
    'isAMD': isAMD,
    'isCMD': isCMD,
    'context': context,
    'ast': context.parser.ast()
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