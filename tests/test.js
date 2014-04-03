var ranma = require('../ranma');

var expect = require('expect.js');
var fs = require('fs');
var path = require('path');

describe('simple test', function() {
  describe('type', function() {
    it('define outer wrap', function() {
      var type = ranma.type.analyse('define(function(){});');
      expect(type.isCommonJS).to.not.ok();
      expect(type.isAMD).to.not.ok();
      expect(type.isCMD).to.ok();
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
    it('define.amd with if', function() {
      var type = ranma.type.analyse('if(typeof define !== "undefined" && define.amd){define({})}');
      expect(type.isCommonJS).to.not.ok();
      expect(type.isAMD).to.ok();
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
      var res = ranma.cjsify('define(function(){});');
      expect(res).to.eql(';');
    });
    it('define with function return', function() {
      var res = ranma.cjsify('define(function(){return a;});');
      expect(res).to.eql('module.exports = a;;');
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
    it('define inner', function() {
      var res = ranma.cjsify('var a = 1;define(a);');
      expect(res).to.eql('var a = 1;module.exports = a;')
    });
    it('define amd', function() {
      var res = ranma.cjsify('if(typeof define !== "undefined" && define.amd){define(function(){return 1;})}');
      expect(res).to.eql('module.exports = 1;');
    });
  });
  describe('cmdify', function() {
    it('define.amd', function() {
      var res = ranma.cmdify('if(typeof define !== "undefined" && define.amd){define(function(){})}');
      expect(res).to.eql('if(typeof define !== "undefined" ){define(function(){})}');
    });
    it('define.amd.xxx', function() {
      var res = ranma.cmdify('if(typeof define !== "undefined" && define.amd && define.amd.jQuery){define(function(){})}');
      expect(res).to.eql('if(typeof define !== "undefined" ){define(function(){})}');
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
  });
  describe('amdify', function() {
    it.skip('as same sa cjsify', function() {
      //
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
      expect(type.isAMD).to.eql(false);
    });
    it('type isCMD', function() {
      expect(type.isCMD).to.eql(true);
    });
    it('cjsify', function() {
      var res = ranma.cjsify(s);
//      fs.writeFileSync(path.join(__dirname, './cjs/Class.js'), res, { encoding: 'utf-8' });
      expect(res).to.eql(fs.readFileSync(path.join(__dirname, './cjs/Class.js'), { encoding: 'utf-8' }));
    });
    it('cmdify', function() {
      var res = ranma.cmdify(s);
      expect(res).to.eql(s);
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
});