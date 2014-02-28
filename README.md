##A converter between CommonJS and AMD/CMD

The javascript lexer bases on jssc: https://github.com/army8735/jssc

为满足所写的模块能同时运行于server环境和web环境，而不需手动修改，所以做了个转换方法，使得二者之间的模块能够互相等价转化。
原理即CommonJS模块头尾加上define，反之去掉。如果是转为AMD，还会提取依赖并解析为factory的形参。
需要注意的是AMD模块的写法应遵守文件和模块一对一的原则。AMD和CMD之间的转化同理。

##INSTALL

npm install ranma

##API

ranma.cj2amd(code:String):String
将CommonJS模块代码转换为AMD

ranma.cj2cmd(code:String):String
将CommonJS模块代码转换为CMD

ranma.amd2cj(code:String):String
将AMD模块代码转换为CommonJS

ranma.cmd2cj(code:String):String
将CMD模块代码转换为CommonJS

ranma.amd2cmd(code:String):String
将AMD模块代码转换为CMD

ranma.cmd2amd(code:String):String
将CMD模块代码转换为AMD

# License

[MIT License]