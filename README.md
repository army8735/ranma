A converter between CommonJS/AMD/CMD/Module/other
====

ranma取自同名动漫人物乱马，意指同一个事物的不同形式。

[![NPM version](https://badge.fury.io/js/ranma.png)](https://npmjs.org/package/ranma)
[![Build Status](https://travis-ci.org/army8735/ranma.svg?branch=master)](https://travis-ci.org/army8735/ranma)
[![Coverage Status](https://coveralls.io/repos/army8735/ranma/badge.png)](https://coveralls.io/r/army8735/ranma)
[![Dependency Status](https://david-dm.org/army8735/ranma.png)](https://david-dm.org/army8735/ranma)

为满足所写的代码能同时运行于server环境和web环境，而不需手动修改，所以做了个转换方法，使得几者之间的模块能够互相等价转化。

需要注意的是AMD模块的写法应遵守文件和模块一对一的原则。

## INSTALL

```js
npm install ranma
```

## API

* cjsify(code:String):String
  * 将代码转换为`CommonJS`
  * 对于`AMD`和`CMD`，会将define的factory提取，改写return为module.exports并删除define，如果define父语句有if判断也会删除
  * 对于`es6 module`，会将module和import变为require，export变为exports，export default变为module.exports
  * 对于普通文件，会将全局声明的变量作为exports，全局使用的未声明变量作为require

* amdify(code:String):String
  * 将代码转换为`AMD`
  * 在cjsify的基础上进行define包裹
  * 如果代码是`CMD`不做修改，因为`AMD`兼容这种写法

* cmdify(code:String):String
  * 将代码转换为`CMD`
  * 在cjsify的基础上进行define包裹
  * 如果code是`AMD`类型，会进行依赖转化——即将factory的参数改为`CMD`的require, exports, module固定参数，同时依赖变为require变量声明

* type.isCommonJS(code:String):Boolean
  * code是否是`CommonJS`

* type.isAMD(code:String):Boolean
  * code是否是`AMD`

* type.isCMD(code:String):Boolean
  * code是否是`CMD`
  
* type.isModule(code:String):Boolean
  * code是否是`es6 module`

#### AMD和CMD的区分依据
* 是否出现`define.amd`的判断
* factory的参数是否为固定的`require, exports, module`

## License

[MIT License]