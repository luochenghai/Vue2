/* @flow */

import config from "../config";
import { initProxy } from "./proxy";
import { initState } from "./state";
import { initRender } from "./render";
import { initEvents } from "./events";
import { mark, measure } from "../util/perf";
import { initLifecycle, callHook } from "./lifecycle";
import { initProvide, initInjections } from "./inject";
import { extend, mergeOptions, formatComponentName } from "../util/index";

let uid = 0;
// 实现_init 初始化方法
export function initMixin(Vue: Class<Component>) {
  Vue.prototype._init = function (options?: Object) {
    const vm: Component = this;
    // a uid
    vm._uid = uid++;

    let startTag, endTag;
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== "production" && config.performance && mark) {
      startTag = `vue-perf-start:${vm._uid}`;
      endTag = `vue-perf-end:${vm._uid}`;
      mark(startTag);
    }

    // a flag to avoid this being observed
    vm._isVue = true;
    // merge options
    // 合并选项 是因为系统有默认的选项，要和用户写的选项进行合并(系统默认选项有：conponents(有KeepAlive,Transition,TransitionGroup 可以全局直接使用) ,direactives(有module,show) , filter)
    /****
     *合并配置： 1.外部调用场景(外部我们的代码主动调用new Vue(options)的方式实例化一个Vue 对象)
     *          2.组件场景(组件的过程中内部通过Vue(new Vue(options)实例化子组件))
     *          3.总结：子组件初始化过程通过 initInternalComponent 方式要比外部初始化Vue 通过 mergeOptions 的过程要快，合并完的结果保留在 vm.$options
     * ***/
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      initInternalComponent(vm, options);
    } else {
      vm.$options = mergeOptions(
        /***
         * resolveConstructorOptions 函数的作用：获取当前实例中构造函数的options选项及其所有父级的构造函数的options。
         * 之所以有父级是因为当前Vue.js 的实例可能是个子组件，它的的父组件就是它的父级。
         * ***/
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      );
    }
    // 做代理
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== "production") {
      initProxy(vm);
    } else {
      vm._renderProxy = vm;
    }
    // expose real self
    // 初始化核心代码(在生命周期钩子 beforeCreate 触发之前先执行了initLifecycle，initEvents，initRender ，也就是先初始化事件和熟悉)
    vm._self = vm;
    initLifecycle(vm); //生命周期相关 $parent $root $childern
    initEvents(vm); //自定义事件的监听
    initRender(vm); // $slots $createElment
    // callHook 的作用：触发用户设置的生命周期的钩子，而用户设置的生命周期的钩子在执行new Vue()时通过参数 options 传递给Vue.js
    callHook(vm, "beforeCreate"); // 该生命周期钩子后才是状态数据的初始化  （new Vue() 时初始化事件和生命周期，事件是指老爹中的事件，生命周期是 $parent $root 等）
    initInjections(vm); // resolve injections before data/props //在data/props 前初始化Inject
    initState(vm); // methods props data computed watch
    initProvide(vm); // resolve provide after data/props // 在data/props 后初始化provide
    callHook(vm, "created");

    /* istanbul ignore if */
    if (process.env.NODE_ENV !== "production" && config.performance && mark) {
      vm._name = formatComponentName(vm, false);
      mark(endTag);
      measure(`vue ${vm._name} init`, startTag, endTag);
    }
    // 当设置了 el 选项时 自动调用$mount，$mount 的作用：挂在真实的DOM
    // 如果用户在实例化Vue.js 时传递了el 选项，则自动开启模板编译阶段与挂载阶段
    // 如果没有传递el选项，则不进入下一个生命周期流程
    // 用户需要执行vm.$mount 方法，手动开启模板编译阶段与挂载阶段
    if (vm.$options.el) {
      vm.$mount(vm.$options.el);
    }
  };
}
/**
 *   合并配置:
 *         1. 外部调用场景 外部我们的代码主动调用 new Vue(options) 的方式实例 化一个 Vue 对象。
 *         2. 组件场景 上一节分析的组件过程中内部通过 new Vue(options) 实 例化子组件。
 *         3. 总结：子组件初始化过程通过 initInternalComponent 方式要比 外部初始化 Vue 通过 mergeOptions
 *            的过程要快，合并 完的结果保留在 vm.$options 中
 *
 * ***/
export function initInternalComponent(
  vm: Component,
  options: InternalComponentOptions
) {
  const opts = (vm.$options = Object.create(vm.constructor.options));
  // doing this because it's faster than dynamic enumeration.
  const parentVnode = options._parentVnode;
  opts.parent = options.parent;
  opts._parentVnode = parentVnode;

  const vnodeComponentOptions = parentVnode.componentOptions;
  opts.propsData = vnodeComponentOptions.propsData;
  opts._parentListeners = vnodeComponentOptions.listeners;
  opts._renderChildren = vnodeComponentOptions.children;
  opts._componentTag = vnodeComponentOptions.tag;

  if (options.render) {
    opts.render = options.render;
    opts.staticRenderFns = options.staticRenderFns;
  }
}

export function resolveConstructorOptions(Ctor: Class<Component>) {
  let options = Ctor.options;
  if (Ctor.super) {
    const superOptions = resolveConstructorOptions(Ctor.super);
    const cachedSuperOptions = Ctor.superOptions;
    if (superOptions !== cachedSuperOptions) {
      // super option changed,
      // need to resolve new options.
      Ctor.superOptions = superOptions;
      // check if there are any late-modified/attached options (#4976)
      const modifiedOptions = resolveModifiedOptions(Ctor);
      // update base extend options
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions);
      }
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions);
      if (options.name) {
        options.components[options.name] = Ctor;
      }
    }
  }
  return options;
}

function resolveModifiedOptions(Ctor: Class<Component>): ?Object {
  let modified;
  const latest = Ctor.options;
  const sealed = Ctor.sealedOptions;
  for (const key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) modified = {};
      modified[key] = latest[key];
    }
  }
  return modified;
}
