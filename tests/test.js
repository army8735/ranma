var ranma = require('../ranma');

var expect = require('expect.js');
var fs = require('fs');
var path = require('path');

describe('jslib test', function() {
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
      var cjsify = fs.readFileSync(path.join(__dirname, './dist/handlebars-cjsify.js'), { encoding: 'utf-8' });
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
    });
  });
});