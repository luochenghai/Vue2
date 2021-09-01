import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'
/**
 * 总结： vue 本质上就是一个用 Function 实现的 Class，然后在它 的原型
 * prototype 以及它本身上扩展了一系列的方法和属 性。Vue 不用 ES6 的 Class
 * 去实现的原因：按功能区分，把 功能扩展分散到多个模块中去实现，然后挂载中
 * vue 的 原型 prototype 上，也有在 Vue 这个对象本身 上。而不是在一个模块
 * 里实现所有，这种方式是用 Class 难以 实现的。这么做的好处是非常方便代码的
 * 维护和管理。
 *
 * **/
// 1.声明vue 构造函数
function Vue (options) {
  //安全检查，非生产环境，没使用new 关键字来调用 Vue 剖出警告提示要用 new 关键字，生产环境的代码都是已经经过编译后的原生代码
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  // 当 new Vue() 执行后，触发的一系列初始化流程都是在_init 方法中启动的。
  this._init(options) // _init 的实现在 initMixin中
}
//2. 实例属性 实例方法
initMixin(Vue)  //_init 的实现在 initMixin中
stateMixin(Vue) // $data $set() $delete() $props $watch()
eventsMixin(Vue) // $on $off $emit $once
lifecycleMixin(Vue) // _update()  $forceUpdate() $destory()  生命周期相关
renderMixin(Vue) //$nextTick()异步更新   _render

export default Vue

/**
 *    1.new Vue =>  var app = new Vue({
 *                    el: '#app',
 *                    data: { message: 'Hello Vue!' }
 *                  })
 *     2.init => 调用 this._init(options) 进行初始化
 *               mergeOptions 合并配置
 *               initLifecycle(vm) 初始化生命周期，调用生命周期钩子函数 callHook(vm, 'beforeCreate')
 *               initEvents(vm) 初始化事件中心
 *               initRender(vm) 初始化渲染 初始化 data、props、computed、watcher 等等。
 *
 *    3. 总结 初始化 Vue 到最终渲染的整个过程：new Vue => init => $mounted => compile => render => vnode => patch => DOM
 *
 * **/
