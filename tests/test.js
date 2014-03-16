var ranma = require('../ranma');

var expect = require('expect.js');
var fs = require('fs');
var path = require('path');

describe('jslib test', function() {
  describe('handlebars', function() {
    it('cc', function() {
      var s = fs.readFileSync(path.join(__dirname, './src/handlebars.js'), { encoding: 'utf-8' });
    });
  });
});