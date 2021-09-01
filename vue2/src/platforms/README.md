
<!--                platforms文件及其子文件解释说明
                            web:web平台
      entry-runtime.js：运行时构建的入口，不包含模板( template)到render函数的编译器，所以不支持 ` template` 选项，我们使用vue默认导出的就是这个运行 时的版本。大家使用的时候要注意
     
      entry-runtime-with-compiler.js：独立构建版本的入口， 它在 entry-runtime 的基础上添加了模板(template)到 render函数的编译器 

      entry-compiler.js：vue-template-compiler 包的入口文件 
     
      entry-server-renderer.js：vue-server-renderer 包的入口 文件
     
      entry-server-basic-renderer.js：输出 packages/vue- server-renderer/
     
      basic.js 文件

                           weex：混合应 
-->



<!-- serve 服务端渲染，包含(server-side rendering)的相关 代码 -->
<!-- shared: 共享代码，包含整个代码库通用的代码 -->
<!-- sfc: 包含单文件组件( .vue 文件)的解析逻辑，用于vue- template-compiler包 -->