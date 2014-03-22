var Class = require('./util/Class');
var cid = 0;
//TODO 放到homunculus里
var Context = Class(function(parent, name) {
  this.cid = cid++;
  this.parent = parent || null; //父上下文，如果是全局则为空
  this.name = name || null; //上下文名称，即函数名，函数表达式为空，全局也为空
  this.thisIs = null; //上下文环境中this的值，函数表达式中可能会赋值
  this.children = []; //函数声明或函数表达式所产生的上下文
  this.childrenMap = {}; //键是函数名，值是对应的node
  this.variables = []; //变量var声明
  this.variablesMap = {};
  this.params = []; //形参，函数上下文才有，即全局无
  this.paramsMap = {};
  this.aParams = []; //实参，函数表达式才有
  this.aParamsMap = {};
  this.vids = []; //上下文环境里用到的变量id
  this.vidsMap = {}; //键为id字面量，值是它的token
  this.returns = []; //上下文环境里return语句
  this.require = false; //当前上下文中是否使用了这些变量，以此判断规范类型（需参照上下文中是否有过声明），保存它们的token引用
  this.module = false;
  this.exports = false;
  this.define = false;
  this.defineAmd = false;
  this.defineFactory = null; //保存factory的上下文
  if(!this.isTop()) {
    this.parent.addChild(this);
    this.setThis(this.parent.getThis());
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
  getThis: function() {
    return this.thisIs;
  },
  setThis: function(t) {
    this.thisIs = t;
    return this;
  },
  isTop: function() {
    return !this.parent;
  },
  isFnexpr: function() {
    return !this.isTop() && !this.name;
  },
  hasParam: function(p) {
    return this.paramsMap.hasOwnProperty(p);
  },
  getParams: function() {
    return this.params;
  },
  addParam: function(p) {
    //形参不可能重复，无需判断
    this.paramsMap[p] = this.params.length;
    this.params.push(p);
    return this;
  },
  getAParams: function() {
    return this.aParams;
  },
  addAParam: function(ap) {
    //只记录单字面量参数和this，其它传入null占位
    if(ap !== null) {
      this.aParamsMap[ap] = this.aParams.length;
    }
    this.aParams.push(ap);
    return this;
  },
  getChildren: function() {
    return this.children;
  },
  //仅支持有name的函数声明，表达式无法查找
  hasChild: function(name) {
    return this.childrenMap.hasOwnProperty(name);
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
  //仅支持有name的函数声明，表达式无法删除
  delChild: function(name) {
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
    //赋值拥有最高优先级，会覆盖掉之前的函数声明和var
    if(assign) {
      this.delVar(v);
      this.delChild(v);
    }
    //仅仅是var声明无赋值，且已有过声明或函数，忽略之
    else if(this.hasVar(v) || this.hasChild(v)) {
      return this;
    }
    this.variablesMap[v] = true;
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
  getVars: function() {
    return this.variables;
  },
  addReturn: function(v) {
    this.returns.push(v);
    return this;
  },
  getReturns: function() {
    return this.returns;
  },
  hasVid: function(v) {
    return this.vidsMap.hasOwnProperty(v);
  },
  addVid: function(token) {
    var content = token.content();
    if(this.vidsMap.hasOwnProperty(content)) {
      return;
    }
    this.vids.push(token);
    this.vidsMap[content] = token;
    return this;
  },
  getVids: function() {
    return this.vids;
  }
});
module.exports = Context;