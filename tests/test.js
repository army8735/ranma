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
      expect(res).to.eql('if(typeof define !== "undefined" ){module.exports = 1;}');
    });
  });
  describe('cmdify', function() {
    it('define.amd', function() {
      var res = ranma.cmdify('if(typeof define !== "undefined" && define.amd){define(function(){})}');
      expect(res).to.eql('if(typeof define !== "undefined" ){define(function(){})}');
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
  });return;
  describe('backbone', function() {
    var s = fs.readFileSync(path.join(__dirname, './src/backbone.js'), { encoding: 'utf-8' });
    it('type', function() {
      var type = ranma.type.analyse(s);
      expect(type.isCommonJS).to.eql(true);
      expect(type.isAMD).to.eql(false);
      expect(type.isCMD).to.eql(false);
    });
    it('cjsify', function() {
      var res = ranma.cjsify(s);
      expect(res).to.eql(s);
    });
  });
  describe('expect', function() {
    var s = fs.readFileSync(path.join(__dirname, './src/expect.js'), { encoding: 'utf-8' });
    it('type', function() {
      var type = ranma.type.analyse(s);
      expect(type.isCommonJS).to.eql(true);
      expect(type.isAMD).to.eql(false);
      expect(type.isCMD).to.eql(false);
    });
    it('cjsify', function() {
      var res = ranma.cjsify(s);
      expect(res).to.eql(s);
    });
  });
  describe('handlebars', function() {
    var s = fs.readFileSync(path.join(__dirname, './src/handlebars.js'), { encoding: 'utf-8' });
    it('type', function() {
      var type = ranma.type.analyse(s);
      expect(type.isCommonJS).to.eql(false);
      expect(type.isAMD).to.eql(false);
      expect(type.isCMD).to.eql(false);
    });
    it('cjsify', function() {
      var res = ranma.cjsify(s);
      var cjsify = fs.readFileSync(path.join(__dirname, './cjs/handlebars.js'), { encoding: 'utf-8' });
      expect(res).to.eql(cjsify);
    });
  });
  describe('Uri', function() {
    var s = fs.readFileSync(path.join(__dirname, './src/Uri.js'), { encoding: 'utf-8' });
    var type = ranma.type.analyse(s);
    it('type', function() {
      expect(type.isCommonJS).to.eql(true);
      expect(type.isAMD).to.eql(true);
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
      var cmdify = fs.readFileSync(path.join(__dirname, './cmd/Uri.js'), { encoding: 'utf-8' });
      expect(res).to.eql(cmdify);
    });
  });
  describe('jquery-1.8.3', function() {
    var s = fs.readFileSync(path.join(__dirname, './src/jquery-1.8.3.js'), { encoding: 'utf-8' });
    var type = ranma.type.analyse(s);
    it('type', function() {
      expect(type.isCommonJS).to.eql(false);
      expect(type.isAMD).to.eql(true);
      expect(type.isCMD).to.eql(false);
    });
    it('cjsify', function() {
      var res = ranma.cjsify(s);
      var cjsify = fs.readFileSync(path.join(__dirname, './cjs/jquery-1.8.3.js'), { encoding: 'utf-8' });
      expect(res).to.eql(cjsify);
    });
  });
});