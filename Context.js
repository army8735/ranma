var Class = require('./util/Class');
var cid = 0;
var Context = Class(function(parent, name) {
  this.cid = cid++;
  this.parent = parent || null;
  this.name = name || null;
  this.children = [];
  this.childrenMap = {};
  this.variables = [];
  this.variablesMap = {};
  this.params = [];
  this.paramsMap = {};
  this.aParams = [];
  this.aParamsMap = {};
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
    return this;
  },
  getAParam: function() {
    return this.aParams;
  },
  addAParam: function(ap) {
    this.aParamsMap[ap] = this.aParams.length;
    this.aParams.push(ap);
    return this;
  },
  getChildren: function() {
    return this.children;
  },
  isTop: function() {
    return !this.parent;
  },
  hasChild: function(child) {
    var name = child;
    if(child instanceof Context) {
      name = child.getName();
    }
    return this.childrenMap.hasOwnProperty(child);
  },
  addChild: function(child) {
    var name = child.getName();
    //函数表达式名字为空无法删除
    if(name) {
      this.delChild(name);
      this.childrenMap[name] = child;
    }
    this.children.push(child);
    return this;
  },
  delChild: function(child) {
    var name = child;
    if(child instanceof Context) {
      name = child.getName();
    }
    if(this.hasChild(name)) {
      var i = this.children.indexOf(this.childrenMap[name]);
      this.children.splice(i, 1);
      delete this.childrenMap[name];
    }
    return this;
  },
  hasVar: function(v) {
    return this.variablesMap.hasOwnProperty(v);
  },
  addVar: function(v, assign) {
    //赋值拥有最高优先级，会覆盖掉之前的函数和var
    if(assign) {
      this.delVar(v);
      this.delChild(v);
    }
    //仅仅是var声明无赋值，且已有过声明或函数，忽略之
    else if(this.hasVar(v) || this.hasChild(v)) {
      return this;
    }
    this.variablesMap[v] = v;
    this.variables.push(v);
    return this;
  },
  delVar: function(v) {
    if(this.hasVar(v)) {
      var i = this.variables.indexOf(this.variablesMap[v]);
      this.variables.splice(i, 1);
      delete this.variablesMap[v];
    }
    return this;
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