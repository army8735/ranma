var ranma = require('./ranma');

var fs = require('fs');
var s = fs.readFileSync('./ranma.js', { encoding: 'utf-8' });

console.log(ranma.type(s));