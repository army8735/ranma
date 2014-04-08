##A converter between CommonJS/AMD/CMD/other

[![NPM version](https://badge.fury.io/js/ranma.png)](https://npmjs.org/package/ranma)
[![Build Status](https://travis-ci.org/army8735/ranma.svg?branch=master)](https://travis-ci.org/army8735/ranma)
[![Coverage Status](https://coveralls.io/repos/army8735/ranma/badge.png)](https://coveralls.io/r/army8735/ranma)
[![Dependency Status](https://david-dm.org/army8735/ranma.png)](https://david-dm.org/army8735/ranma)

为满足所写的代码能同时运行于server环境和web环境，而不需手动修改，所以做了个转换方法，使得几者之间的模块能够互相等价转化。
需要注意的是AMD模块的写法应遵守文件和模块一对一的原则。

##INSTALL

```js
npm install ranma
```

##API

ranma.cjsify(code:String):String
将代码转换为CommonJS

ranma.amdify(code:String):String
将代码转换为AMD

ranma.cmdify(code:String):String
将代码转换为CMD

ranma.type.isCommonJS(code:String):Boolean
code是否是CommonJS

ranma.type.isAMD(code:String):Boolean
code是否是AMD

ranma.type.isCMD(code:String):Boolean
code是否是CMD

## License

[MIT License]