var ranma = require('../');

var expect = require('expect.js');
var fs = require('fs');
var path = require('path');

describe('simple test', function() {
  describe('type', function() {
    it('define outer wrap', function() {
      var type = ranma.type.analyse('define(function(){});');
      expect(type.isCommonJS).to.not.ok();
      expect(type.isAMD).to.ok();
      expect(type.isCMD).to.not.ok();
    });
    it('define factory has a name', function() {
      var type = ranma.type.analyse('define(function a(){});');
      expect(type.isCommonJS).to.not.ok();
      expect(type.isAMD).to.ok();
      expect(type.isCMD).to.not.ok();
    });
    it('define an object', function() {
      var type = ranma.type.analyse('define({});');
      expect(type.isCommonJS).to.not.ok();
      expect(type.isAMD).to.not.ok();
      expect(type.isCMD).to.ok();
    });
    it('define inner', function() {
      var type = ranma.type.analyse('function a(){};define(a);');
      expect(type.isCommonJS).to.not.ok();
      expect(type.isAMD).to.not.ok();
      expect(type.isCMD).to.ok();
    });
    it('define with if', function() {
      var type = ranma.type.analyse('if(typeof define !== "undefined"){define({})}');
      expect(type.isCommonJS).to.not.ok();
      expect(type.isAMD).to.not.ok();
      expect(type.isCMD).to.ok();
    });
    it('define with if no {}', function() {
      var type = ranma.type.analyse('if(typeof define !== "undefined")define({})');
      expect(type.isCommonJS).to.not.ok();
      expect(type.isAMD).to.not.ok();
      expect(type.isCMD).to.ok();
    });
    it('define.amd with if', function() {
      var type = ranma.type.analyse('if(typeof define !== "undefined" && define.amd){define({})}');
      expect(type.isCommonJS).to.not.ok();
      expect(type.isAMD).to.ok();
      expect(type.isCMD).to.not.ok();
    });
    it('define factory by amd style', function() {
      var type = ranma.type.analyse('define(["dep"], function(dep) {})');
      expect(type.isCommonJS).to.not.ok();
      expect(type.isAMD).to.ok();
      expect(type.isCMD).to.not.ok();
    });
    it('require is a function', function() {
      var type = ranma.type.analyse('function require(p){}require("a")');
      expect(type.isCommonJS).to.not.ok();
      expect(type.isAMD).to.not.ok();
      expect(type.isCMD).to.not.ok();
    });
    it('use require', function() {
      var type = ranma.type.analyse('require("a")');
      expect(type.isCommonJS).to.ok();
      expect(type.isAMD).to.not.ok();
      expect(type.isCMD).to.not.ok();
    });
    it('use module', function() {
      var type = ranma.type.analyse('module.exports = a');
      expect(type.isCommonJS).to.ok();
      expect(type.isAMD).to.not.ok();
      expect(type.isCMD).to.not.ok();
    });
    it('use exports', function() {
      var type = ranma.type.analyse('exports.a = a');
      expect(type.isCommonJS).to.ok();
      expect(type.isAMD).to.not.ok();
      expect(type.isCMD).to.not.ok();
    });
    it('compact', function() {
      var type = ranma.type.analyse('if(typeof define !== "undefined" && define.amd){define({})}else if(typeof exports !== "undefined"){exports = {}}');
      expect(type.isCommonJS).to.ok();
      expect(type.isAMD).to.ok();
      expect(type.isCMD).to.not.ok();
    });
    it('normal js', function() {
      var type = ranma.type.analyse('var a = 1;');
      expect(type.isCommonJS).to.not.ok();
      expect(type.isAMD).to.not.ok();
      expect(type.isCMD).to.not.ok();
    });
    it('define is a var', function() {
      var type = ranma.type.analyse('var define = function(){};define();');
      expect(type.isCommonJS).to.not.ok();
      expect(type.isAMD).to.not.ok();
      expect(type.isCMD).to.not.ok();
    });
    it('define is a param', function() {
      var type = ranma.type.analyse('function a(define) {define();}');
      expect(type.isCommonJS).to.not.ok();
      expect(type.isAMD).to.not.ok();
      expect(type.isCMD).to.not.ok();
    });
    it('module is a var', function() {
      var type = ranma.type.analyse('var module = {};module.exports = 1;');
      expect(type.isCommonJS).to.not.ok();
      expect(type.isAMD).to.not.ok();
      expect(type.isCMD).to.not.ok();
    });
    it('module is a param', function() {
      var type = ranma.type.analyse('function a(module) {module.exports = 1;}');
      expect(type.isCommonJS).to.not.ok();
      expect(type.isAMD).to.not.ok();
      expect(type.isCMD).to.not.ok();
    });
    it('module in define', function() {
      var type = ranma.type.analyse('define(function(require, exports, module){});');
      expect(type.isCommonJS).to.not.ok();
      expect(type.isAMD).to.not.ok();
      expect(type.isCMD).to.ok();
    });
    it('#isCommonJs', function() {
      expect(ranma.type.isCommonJS('exports.a = 1;')).to.be.ok();
    });
    it('#isAMD', function() {
      expect(ranma.type.isAMD('if(typeof define !== "undefined" && define.amd){define({})}')).to.be.ok();
    });
    it('#isCMD', function() {
      expect(ranma.type.isCMD('define(1);')).to.be.ok();
    });
  });
  describe('cjsify', function() {
    it('define outer wrap', function() {
      var res = ranma.cjsify('define([], function(){});');
      expect(res).to.eql(';');
    });
    it('define with function return', function() {
      var res = ranma.cjsify('define(function(){return a;});');
      expect(res).to.eql('module.exports = a;;');
    });
    it('define with function return undefined', function() {
      var res = ranma.cjsify('define(function(){return;});');
      expect(res).to.eql('module.exports = undefined;;');
    });
    it('define with function return and exports', function() {
      var res = ranma.cjsify('define(function(){if(a)return 1;else module.exports = b})');
      expect(res).to.eql('if(a)module.exports = 1;else module.exports = b');
    });
    it('define with function multi return', function() {
      var res = ranma.cjsify('define(function(){if(a)return 1;else return b});');
      expect(res).to.eql('if(a)module.exports = 1;else module.exports = b;');
    });
    it('define an object', function() {
      var res = ranma.cjsify('define({a:1});');
      expect(res).to.eql('module.exports = {a:1};');
    });
    it('define an number', function() {
      var res = ranma.cjsify('define(123);');
      expect(res).to.eql('module.exports = 123;');
    });
    it('define a string', function() {
      var res = ranma.cjsify('define("");');
      expect(res).to.eql('module.exports = "";');
    });
    it('define an array', function() {
      var res = ranma.cjsify('define([]);');
      expect(res).to.eql('module.exports = [];');
    });
    it('define a ref', function() {
      var res = ranma.cjsify('define(a);');
      expect(res).to.eql('if(Object.prototype.toString.call(a) == "[object Function]") { ~function(){ var res = a();if(typeof res != "undefined") { module.exports = res } }() } else { module.exports = a };');
    });
    it('define inner', function() {
      var res = ranma.cjsify('var a = 1;define(a);');
      expect(res).to.eql('var a = 1;if(Object.prototype.toString.call(a) == "[object Function]") { ~function(){ var res = a();if(typeof res != "undefined") { module.exports = res } }() } else { module.exports = a };')
    });
    it('define amd', function() {
      var res = ranma.cjsify('if(typeof define !== "undefined" && define.amd){define(function(){return 1;})}');
      expect(res).to.eql('module.exports = 1;');
    });
    it('define with if', function() {
      var res = ranma.cjsify('if(typeof define !== "undefined")define({})');
      expect(res).to.eql('module.exports = {}');
    });
    it('normal js with var', function() {
      var res = ranma.cjsify('var a = 1;');
      expect(res).to.eql('var a = 1;;module.exports = a;')
    });
    it('normal js with function', function() {
      var res = ranma.cjsify('function a(){}');
      expect(res).to.eql('function a(){};module.exports = a;')
    });
    it('normal js with deps', function() {
      var res = ranma.cjsify('var a = b;');
      expect(res).to.eql('var b = require("b");var a = b;;module.exports = a;');
    });
    it('normal js with multi global vars', function() {
      var res = ranma.cjsify('var a = b, c = d;');
      expect(res).to.eql('var b = require("b");var d = require("d");var a = b, c = d;;exports["a"] = a;exports["c"] = c;');
    });
    it('normala js without var', function() {
      var res = ranma.cjsify('b.f();');
      expect(res).to.eql('var b = require("b");b.f();');
    });
    it('global vars need ignore', function() {
      var res = ranma.cjsify('var a = window, b = document; b = c;');
      expect(res).to.eql('var c = require("c");var a = window, b = document; b = c;;exports["a"] = a;exports["b"] = b;');
    });
    it('multi global vars', function() {
      var res = ranma.cjsify('var a = b;var a = b;');
      expect(res).to.eql('var b = require("b");var a = b;var a = b;;module.exports = a;');
    });
    it('global fnexpr', function() {
      var res = ranma.cjsify('~function(g1, g2, o){g1.a = 1;g2.a = 1;g2.b = 2;o.c = 3;}(this, window, {})');
      expect(res).to.eql('~function(g1, g2, o){g1.a = 1;g2.a = 1;g2.b = 2;o.c = 3;}(this, window, {});exports["a"] = this.a;;exports["b"] = this.b;');
    });
    it('global fnexpr call this', function() {
      var res = ranma.cjsify('~function(){this.a = 1;}.call(this)');
      expect(res).to.eql('~function(){this.a = 1;}.call(this);module.exports = this.a;')
    });
    it('global fnexpr call null', function() {
      var res = ranma.cjsify('~function(){this.a = 1;}.call(null)');
      expect(res).to.eql('~function(){this.a = 1;}.call(null);module.exports = this.a;')
    });
    it('global fnexpr apply window', function() {
      var res = ranma.cjsify('~function(){this.a = 1;}.apply(window)');
      expect(res).to.eql('~function(){this.a = 1;}.apply(window);module.exports = this.a;')
    });
    it('global fnexpr apply params', function() {
      var res = ranma.cjsify('~function(g){this.a = 1;g.b = 2;}.apply(window, [window])');
      expect(res).to.eql('~function(g){this.a = 1;g.b = 2;}.apply(window, [window]);exports["a"] = this.a;;exports["b"] = this.b;');
    });
    it('global fnexpr use window or this direct', function() {
      var res = ranma.cjsify('~function(){this.a = 1;window.b = 2;}()');
      expect(res).to.eql('~function(){this.a = 1;window.b = 2;}();exports["a"] = this.a;;exports["b"] = this.b;');
    });
  });
  describe('cmdify', function() {
    it('define.amd', function() {
      var res = ranma.cmdify('if(typeof define !== "undefined" && define.amd){define(function(){})}');
      expect(res).to.eql('if(typeof define !== "undefined" ){define(function(require, exports, module){})}');
    });
    it('define.amd && define.amd.xxx', function() {
      var res = ranma.cmdify('if(typeof define !== "undefined" && define.amd && define.amd.jQuery){define(function(){})}');
      expect(res).to.eql('if(typeof define !== "undefined" ){define(function(require, exports, module){})}');
    });
    it('define factory in amd style', function() {
      var res = ranma.cmdify('define(["a", "b"], function(a, b) {})');
      expect(res).to.eql('define(["a", "b"], function(require, exports, module) {var a = require("./a");var b = require("./b");})');
    });
    it('define deps not compact to params', function() {
      var res = ranma.cmdify('~function(){define(["a", "b"], function f(a){})}()');
      expect(res).to.eql('~function(){define(["a", "b"], function f(require, exports, module){var a = require("./a");})}()');
    });
    it('commonjs', function() {
      var res = ranma.cmdify('module.exports = a;');
      expect(res).to.eql('define(function(require, exports, module) {module.exports = a;});');
    });
    it('cmd', function() {
      var res = ranma.cmdify('define(function(require, exports, module) {module.exports = a;});');
      expect(res).to.eql('define(function(require, exports, module) {module.exports = a;});');
    });
  });
  describe('cjsify', function() {
    it('commonjs', function() {
      var res = ranma.cjsify('module.exports = a;');
      expect(res).to.eql('module.exports = a;');
    });
    it('cmd', function() {
      var res = ranma.cjsify('define(function(require, exports, module) {module.exports = a;});');
      expect(res).to.eql('module.exports = a;;');
    });
    it('cmd with deps', function() {
      var res = ranma.cjsify('define(["b"], function(require, exports, module) {var b = require("b");module.exports = a;});');
      expect(res).to.eql('var b = require("b");module.exports = a;;');
    });
  });
  describe('amdify', function() {
    it('cmd is compact to amd', function() {
      var s = 'define(function(require, exports, module){})';
      var res = ranma.amdify(s);
      expect(res).to.eql(s);
    });
  });
});
describe('jslib test', function() {
  describe('Class', function() {
    var s = fs.readFileSync(path.join(__dirname, './src/Class.js'), { encoding: 'utf-8' });
    var type = ranma.type.analyse(s);
    it('type isCommonJS', function() {
      expect(type.isCommonJS).to.eql(false);
    });
    it('type isAMD', function() {
      expect(type.isAMD).to.eql(true);
    });
    it('type isCMD', function() {
      expect(type.isCMD).to.eql(false);
    });
    it('cjsify', function() {
      var res = ranma.cjsify(s);
//      fs.writeFileSync(path.join(__dirname, './cjs/Class.js'), res, { encoding: 'utf-8' });
      expect(res).to.eql(fs.readFileSync(path.join(__dirname, './cjs/Class.js'), { encoding: 'utf-8' }));
    });
    it('cmdify', function() {
      var res = ranma.cmdify(s);
//      fs.writeFileSync(path.join(__dirname, './cmd/Class.js'), res, { encoding: 'utf-8' });
      expect(res).to.eql(fs.readFileSync(path.join(__dirname, './cmd/Class.js'), { encoding: 'utf-8' }));
    });
    it('amdify', function() {
      var res = ranma.amdify(s);
      expect(res).to.eql(s);
    });
  });
  describe('backbone', function() {
    var s = fs.readFileSync(path.join(__dirname, './src/backbone.js'), { encoding: 'utf-8' });
    var type = ranma.type.analyse(s);
    it('type isCommonJS', function() {
      expect(type.isCommonJS).to.eql(true);
    });
    it('type isAMD', function() {
      expect(type.isAMD).to.eql(false);
    });
    it('type isCMD', function() {
      expect(type.isCMD).to.eql(false);
    });
    it('cjsify', function() {
      var res = ranma.cjsify(s);
      expect(res).to.eql(s);
    });
    it('cmdify', function() {
      var res = ranma.cmdify(s);
//      fs.writeFileSync(path.join(__dirname, './cmd/backbone.js'), res, { encoding: 'utf-8' });
      expect(res).to.eql(fs.readFileSync(path.join(__dirname, './cmd/backbone.js'), { encoding: 'utf-8' }));
    });
    it('amdify', function() {
      var res = ranma.amdify(s);
//      fs.writeFileSync(path.join(__dirname, './amd/backbone.js'), res, { encoding: 'utf-8' });
      expect(res).to.eql(fs.readFileSync(path.join(__dirname, './amd/backbone.js'), { encoding: 'utf-8' }));
    });
  });
  describe('expect', function() {
    var s = fs.readFileSync(path.join(__dirname, './src/expect.js'), { encoding: 'utf-8' });
    var type = ranma.type.analyse(s);
    it('type isCommonJS', function() {
      expect(type.isCommonJS).to.eql(true);
    });
    it('type isAMD', function() {
      expect(type.isAMD).to.eql(false);
    });
    it('type isCMD', function() {
      expect(type.isCMD).to.eql(false);
    });
    it('cjsify', function() {
      var res = ranma.cjsify(s);
      expect(res).to.eql(s);
    });
    it('cmdify', function() {
      var res = ranma.cmdify(s);
//      fs.writeFileSync(path.join(__dirname, './cmd/expect.js'), res, { encoding: 'utf-8' });
      expect(res).to.eql(fs.readFileSync(path.join(__dirname, './cmd/expect.js'), { encoding: 'utf-8' }));
    });
    it('amdify', function() {
      var res = ranma.amdify(s);
//      fs.writeFileSync(path.join(__dirname, './amd/expect.js'), res, { encoding: 'utf-8' });
      expect(res).to.eql(fs.readFileSync(path.join(__dirname, './amd/expect.js'), { encoding: 'utf-8' }));
    });
  });
  describe('handlebars', function() {
    var s = fs.readFileSync(path.join(__dirname, './src/handlebars.js'), { encoding: 'utf-8' });
    var type = ranma.type.analyse(s);
    it('type isCommonJS', function() {
      expect(type.isCommonJS).to.eql(false);
    });
    it('type isAMD', function() {
      expect(type.isAMD).to.eql(false);
    });
    it('type isCMD', function() {
      expect(type.isCMD).to.eql(false);
    });
    it('cjsify', function() {
      var res = ranma.cjsify(s);
//      fs.writeFileSync(path.join(__dirname, './cjs/handlebars.js'), res, { encoding: 'utf-8' });
      expect(res).to.eql(fs.readFileSync(path.join(__dirname, './cjs/handlebars.js'), { encoding: 'utf-8' }));
    });
    it('cmdify', function() {
      var res = ranma.cmdify(s);
//      fs.writeFileSync(path.join(__dirname, './cmd/handlebars.js'), res, { encoding: 'utf-8' });
      expect(res).to.eql(fs.readFileSync(path.join(__dirname, './cmd/handlebars.js'), { encoding: 'utf-8' }));
    });
    it('amdify', function() {
      var res = ranma.cmdify(s);
//      fs.writeFileSync(path.join(__dirname, './amd/handlebars.js'), res, { encoding: 'utf-8' });
      expect(res).to.eql(fs.readFileSync(path.join(__dirname, './amd/handlebars.js'), { encoding: 'utf-8' }));
    });
  });
  describe('Uri', function() {
    var s = fs.readFileSync(path.join(__dirname, './src/Uri.js'), { encoding: 'utf-8' });
    var type = ranma.type.analyse(s);
    it('type isCommonJS', function() {
      expect(type.isCommonJS).to.eql(true);
    });
    it('type isAMD', function() {
      expect(type.isAMD).to.eql(true);
    });
    it('type isCMD', function() {
      expect(type.isCMD).to.eql(false);
    });
    it('cjsify', function() {
      var res = ranma.cjsify(s);
      expect(res).to.eql(s);
    });
    it('amdify', function() {
      var res = ranma.amdify(s);
      expect(res).to.eql(s);
    });
    it('cmdify', function() {
      var res = ranma.cmdify(s);
//      fs.writeFileSync(path.join(__dirname, './cmd/Uri.js'), res, { encoding: 'utf-8' });
      expect(res).to.eql(fs.readFileSync(path.join(__dirname, './cmd/Uri.js'), { encoding: 'utf-8' }));
    });
  });
  describe('jquery-1.8.3', function() {
    var s = fs.readFileSync(path.join(__dirname, './src/jquery-1.8.3.js'), { encoding: 'utf-8' });
    var type = ranma.type.analyse(s);
    it('type isCommonJS', function() {
      expect(type.isCommonJS).to.eql(false);
    });
    it('type isAMD', function() {
      expect(type.isAMD).to.eql(true);
    });
    it('type isCMD', function() {
      expect(type.isCMD).to.eql(false);
    });
    it('cjsify', function() {
      var res = ranma.cjsify(s);
      fs.writeFileSync(path.join(__dirname, './cjs/jquery-1.8.3.js'), res, { encoding: 'utf-8' });
      expect(res).to.eql(fs.readFileSync(path.join(__dirname, './cjs/jquery-1.8.3.js'), { encoding: 'utf-8' }));
    });
    it('amdify', function() {
      var res = ranma.amdify(s);
      expect(res).to.eql(s);
    });
    it('cmdify', function() {
      var res = ranma.cmdify(s);
//      fs.writeFileSync(path.join(__dirname, './cmd/jquery-1.8.3.js'), res, { encoding: 'utf-8' });
      expect(res).to.eql(fs.readFileSync(path.join(__dirname, './cmd/jquery-1.8.3.js'), { encoding: 'utf-8' }));
    });
  });
  describe('bootstrap', function() {
    var s = fs.readFileSync(path.join(__dirname, './src/bootstrap.js'), { encoding: 'utf-8' });
    var type = ranma.type.analyse(s);
    it('type isCommonJS', function() {
      expect(type.isCommonJS).to.eql(false);
    });
    it('type isAMD', function() {
      expect(type.isAMD).to.eql(false);
    });
    it('type isCMD', function() {
      expect(type.isCMD).to.eql(false);
    });
    it('cjsify', function() {
      var res = ranma.cjsify(s);
//      fs.writeFileSync(path.join(__dirname, './cjs/bootstrap.js'), res, { encoding: 'utf-8' });
      expect(res).to.eql(fs.readFileSync(path.join(__dirname, './cjs/bootstrap.js'), { encoding: 'utf-8' }));
    });
    it('amdify', function() {
      var res = ranma.amdify(s);
//      fs.writeFileSync(path.join(__dirname, './amd/bootstrap.js'), res, { encoding: 'utf-8' });
      expect(res).to.eql(fs.readFileSync(path.join(__dirname, './amd/bootstrap.js'), { encoding: 'utf-8' }));
    });
    it('cmdify', function() {
      var res = ranma.cmdify(s);
//      fs.writeFileSync(path.join(__dirname, './cmd/bootstrap.js'), res, { encoding: 'utf-8' });
      expect(res).to.eql(fs.readFileSync(path.join(__dirname, './cmd/bootstrap.js'), { encoding: 'utf-8' }));
    });
  });
  describe('formatter', function() {
    var s = fs.readFileSync(path.join(__dirname, './src/formatter.js'), { encoding: 'utf-8' });
    var type = ranma.type.analyse(s);
    it('type isCommonJS', function() {
      expect(type.isCommonJS).to.eql(true);
    });
    it('type isAMD', function() {
      expect(type.isAMD).to.eql(true);
    });
    it('type isCMD', function() {
      expect(type.isCMD).to.eql(false);
    });
    it('cjsify', function() {
      var res = ranma.cjsify(s);
      expect(res).to.eql(s);
    });
    it('amdify', function() {
      var res = ranma.amdify(s);
      expect(res).to.eql(s);
    });
    it('cmdify', function() {
      var res = ranma.cmdify(s);
//      fs.writeFileSync(path.join(__dirname, './cmd/formatter.js'), res, { encoding: 'utf-8' });
      expect(res).to.eql(fs.readFileSync(path.join(__dirname, './cmd/formatter.js'), { encoding: 'utf-8' }));
    });
  });
  describe('html5shiv', function() {
    var s = fs.readFileSync(path.join(__dirname, './src/html5shiv.js'), { encoding: 'utf-8' });
    var type = ranma.type.analyse(s);
    it('type isCommonJS', function() {
      expect(type.isCommonJS).to.eql(false);
    });
    it('type isAMD', function() {
      expect(type.isAMD).to.eql(false);
    });
    it('type isCMD', function() {
      expect(type.isCMD).to.eql(false);
    });
    it('cjsify', function() {
      var res = ranma.cjsify(s);
//      fs.writeFileSync(path.join(__dirname, './cjs/html5shiv.js'), res, { encoding: 'utf-8' });
      expect(res).to.eql(fs.readFileSync(path.join(__dirname, './cjs/html5shiv.js'), { encoding: 'utf-8' }));
    });
    it('amdify', function() {
      var res = ranma.amdify(s);
//      fs.writeFileSync(path.join(__dirname, './amd/html5shiv.js'), res, { encoding: 'utf-8' });
      expect(res).to.eql(fs.readFileSync(path.join(__dirname, './amd/html5shiv.js'), { encoding: 'utf-8' }));
    });
    it('cmdify', function() {
      var res = ranma.cmdify(s);
//      fs.writeFileSync(path.join(__dirname, './cmd/html5shiv.js'), res, { encoding: 'utf-8' });
      expect(res).to.eql(fs.readFileSync(path.join(__dirname, './cmd/html5shiv.js'), { encoding: 'utf-8' }));
    });
  });
  describe('keymaster', function() {
    var s = fs.readFileSync(path.join(__dirname, './src/keymaster.js'), { encoding: 'utf-8' });
    var type = ranma.type.analyse(s);
    it('type isCommonJS', function() {
      expect(type.isCommonJS).to.eql(true);
    });
    it('type isAMD', function() {
      expect(type.isAMD).to.eql(false);
    });
    it('type isCMD', function() {
      expect(type.isCMD).to.eql(false);
    });
    it('cjsify', function() {
      var res = ranma.cjsify(s);
//      fs.writeFileSync(path.join(__dirname, './cjs/keymaster.js'), res, { encoding: 'utf-8' });
      expect(res).to.eql(fs.readFileSync(path.join(__dirname, './cjs/keymaster.js'), { encoding: 'utf-8' }));
    });
    it('amdify', function() {
      var res = ranma.amdify(s);
//      fs.writeFileSync(path.join(__dirname, './amd/keymaster.js'), res, { encoding: 'utf-8' });
      expect(res).to.eql(fs.readFileSync(path.join(__dirname, './amd/keymaster.js'), { encoding: 'utf-8' }));
    });
    it('cmdify', function() {
      var res = ranma.cmdify(s);
//      fs.writeFileSync(path.join(__dirname, './cmd/keymaster.js'), res, { encoding: 'utf-8' });
      expect(res).to.eql(fs.readFileSync(path.join(__dirname, './cmd/keymaster.js'), { encoding: 'utf-8' }));
    });
  });
  describe('keypress', function() {
    var s = fs.readFileSync(path.join(__dirname, './src/keypress.js'), { encoding: 'utf-8' });
    var type = ranma.type.analyse(s);
    it('type isCommonJS', function() {
      expect(type.isCommonJS).to.eql(false);
    });
    it('type isAMD', function() {
      expect(type.isAMD).to.eql(false);
    });
    it('type isCMD', function() {
      expect(type.isCMD).to.eql(false);
    });
    it('cjsify', function() {
      var res = ranma.cjsify(s);
//      fs.writeFileSync(path.join(__dirname, './cjs/keypress.js'), res, { encoding: 'utf-8' });
      expect(res).to.eql(fs.readFileSync(path.join(__dirname, './cjs/keypress.js'), { encoding: 'utf-8' }));
    });
    it('amdify', function() {
      var res = ranma.amdify(s);
//      fs.writeFileSync(path.join(__dirname, './amd/keypress.js'), res, { encoding: 'utf-8' });
      expect(res).to.eql(fs.readFileSync(path.join(__dirname, './amd/keypress.js'), { encoding: 'utf-8' }));
    });
    it('cmdify', function() {
      var res = ranma.cmdify(s);
//      fs.writeFileSync(path.join(__dirname, './cmd/keypress.js'), res, { encoding: 'utf-8' });
      expect(res).to.eql(fs.readFileSync(path.join(__dirname, './cmd/keypress.js'), { encoding: 'utf-8' }));
    });
  });
  describe('md5', function() {
    var s = fs.readFileSync(path.join(__dirname, './src/md5.js'), { encoding: 'utf-8' });
    var type = ranma.type.analyse(s);
    it('type isCommonJS', function() {
      expect(type.isCommonJS).to.eql(false);
    });
    it('type isAMD', function() {
      expect(type.isAMD).to.eql(true);
    });
    it('type isCMD', function() {
      expect(type.isCMD).to.eql(false);
    });
    it('cjsify', function() {
      var res = ranma.cjsify(s);
//      fs.writeFileSync(path.join(__dirname, './cjs/md5.js'), res, { encoding: 'utf-8' });
      expect(res).to.eql(fs.readFileSync(path.join(__dirname, './cjs/md5.js'), { encoding: 'utf-8' }));
    });
    it('amdify', function() {
      var res = ranma.amdify(s);
      expect(res).to.eql(s);
    });
    it('cmdify', function() {
      var res = ranma.cmdify(s);
//      fs.writeFileSync(path.join(__dirname, './cmd/md5.js'), res, { encoding: 'utf-8' });
      expect(res).to.eql(fs.readFileSync(path.join(__dirname, './cmd/md5.js'), { encoding: 'utf-8' }));
    });
  });
  describe('jQuery', function() {
    var s = fs.readFileSync(path.join(__dirname, './src/jQuery-watch.js'), { encoding: 'utf-8' });
    var type = ranma.type.analyse(s);
    it('type isCommonJS', function() {
      expect(type.isCommonJS).to.eql(false);
    });
    it('type isAMD', function() {
      expect(type.isAMD).to.eql(false);
    });
    it('type isCMD', function() {
      expect(type.isCMD).to.eql(false);
    });
    it('cjsify', function() {
      var res = ranma.cjsify(s);
//      fs.writeFileSync(path.join(__dirname, './cjs/jQuery-watch.js'), res, { encoding: 'utf-8' });
      expect(res).to.eql(fs.readFileSync(path.join(__dirname, './cjs/jQuery-watch.js'), { encoding: 'utf-8' }));
    });
    it('amdify', function() {
      var res = ranma.amdify(s);
//      fs.writeFileSync(path.join(__dirname, './amd/jQuery-watch.js'), res, { encoding: 'utf-8' });
      expect(res).to.eql(fs.readFileSync(path.join(__dirname, './amd/jQuery-watch.js'), { encoding: 'utf-8' }));
    });
    it('cmdify', function() {
      var res = ranma.cmdify(s);
//      fs.writeFileSync(path.join(__dirname, './cmd/jQuery-watch.js'), res, { encoding: 'utf-8' });
      expect(res).to.eql(fs.readFileSync(path.join(__dirname, './cmd/jQuery-watch.js'), { encoding: 'utf-8' }));
    });
  });
});