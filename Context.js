var Class = require('./util/Class');
var cid = 0;
var Context = Class(function(parent, name) {
  this.cid = cid++;
  this.parent = parent;
  this.name = name;
  this.children = [];
  this.childrenMap = {};
  this.variables = [];
  this.variablesMap = {};
  this.params = [];
  this.paramsMap = {};
  if(!this.isTop()) {
    this.parent.addChild(this);
  }
}).methods({
  getCid: function() {
    return this.cid;
  },
  getName: function() {
    return this.name;
  },
  getParent: function() {
    return this.parent;
  },
  hasParam: function(p) {
    return this.paramsMap.hasOwnProperty(p);
  },
  getParam: function() {
    return this.params;
  },
  addParam: function(p) {
    this.paramsMap[p] = this.params.length;
    this.params.push(p);
  },
  getChildren: function() {
    return this.children;
  },
  isTop: function() {
    return !this.parent;
  },
  hasChild: function(child) {
    return this.childrenMap.hasOwnProperty(child);
  },
  addChild: function(child) {
    var name = child.getName();
    if(this.hasChild(name)) {
      this.children.splice(this.childrenMap[name], 1);
      delete  this.childrenMap[name];
    }
    this.childrenMap[name] = this.children.length;
    this.children.push(child);
  },
  hasVar: function(v) {
    return this.variablesMap.hasOwnProperty(v);
  },
  addVar: function(v) {
    if(this.hasVar(v)) {
      this.variables.splice(this.variablesMap[v], 1);
      delete this.variablesMap[v];
    }
    this.variablesMap[v] = this.variables.length;
    this.variables.push(v);
  },
  getVars: function(noParams) {
    var self = this;
    if(noParams) {
      var arr = self.variables.filter(function(v) {
        return !self.hasParam(v);
      });
    }
    return self.variables;
  }
});
module.exports = Context;