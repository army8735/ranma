var ranma = require('./ranma');

var fs = require('fs');
var s = fs.readFileSync('./type.js', { encoding: 'utf-8' });

ranma.type.type(s);