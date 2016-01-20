# demo_tnpm
一个作为tnpm的演示库,含有package.json的文件需要npm install或者tnpm install方可

> 为什么要打包
1.性能追求。(合并压缩)
2.模块化的开发（依赖解析）
3.编译器，语法糖，新技术的出现（先做解析）

## 浏览器端
### 1.最原始的方式(origin目录)

进入origin文件夹(类似于邮政快递)
－ 通过script标签
－ 通过闭包将环境变量做一定限度的隔离
[写上邮件地址,客户端就可以接收到内容]

### 2.seajs(seajs目录) 注意需要在node4版本使用

进入模块化编程(类似于仓储纷发)
- 通过引入seajs文件添加形成组件和引用的define require export方法
- 在主文件中加入入口文件的引用方式 seajs.use
- 入口文件用define来进行区分
- 利用自动化工具grunt,gulp进行打包
[通过系统来对相应的仓储中心进行配货,或分发到最近的地址,自提]

### 3.webpack到来(webpack,webpackBabel目录注意需要在node5版本使用)

- 通过建立webpack.config.js(或用命令行)对某一种工程进行个性化定制
- 将文件打包集成到文件
- 通过script标签引入打包后的入口文件
[通过系统来对相应的仓储中心进行配货,个性化要求,分发到最近的地址,发送到用户的手里]

## 非浏览器端(common目录)

npm(主要commonjs规范)
- 利用npm安装模块
- 通过require以及module.exports来进行模块的加载和迁跃

> 我们的项目中也是经过前端的演化，到今天利用webpack对其封装
有很多衍生产品 spm tnpm dora
解决前端工程化安装组件包，起前端服务，调试。

## 整体解决方案及配合后端sofa解决方案

### spm@3.6.12(seajs->webpack的过渡产品)

- 通过配置好的package.json中的spm字段来进行打包的处理
- 用spm install来安装spm模块
- 通过spm-webpack@0.8.0模块进行打包
- 通过spm-server命令进行起服务调试

### tnpm(spm3tnpm目录)

- 用tnpm进行安装模块
- 通过spm-webpack@0.9.0模块进行打包
- 用spm@3.0beta-3进行的spm-server进行查看

### atool-build(atoolbuild目录)

- 配置好的webpack
- 可通过自定义webpack进行配置

### dora(dora目录)

- 包裹的koa服务器，通过安装插件来进行打包，调试各种服务自动化。

### 配合项目
sofax
uisvr,velocity,sofax项目配置。
上传编译后的代码（一定要本地调试完成）
