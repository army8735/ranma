var type = require('./type');

var fs = require('fs');
var define = fs.readFileSync('./template/define.js');
var defineAmd = define + 'define.amd = true;';

exports.convert = function(code, tp) {
  tp = tp || type.analyse(code);
  if(tp.isCommonJS) {
    return code;
  }
  else if(tp.isAMD) {
    return defineAmd + code;
  }
  else if(tp.isCMD) {
    return define + code;
  }
  else {
    var context = tp.context;
    var gVars = context.getVars(true);
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