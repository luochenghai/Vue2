/* @flow */

import { hasOwn } from "shared/util";
import { warn, hasSymbol } from "../util/index";
import { defineReactive, toggleObserving } from "../observer/index";

export function initProvide(vm: Component) {
  const provide = vm.$options.provide;
  if (provide) {
    vm._provided = typeof provide === "function" ? provide.call(vm) : provide;
  }
}
// 初始化inject，就是使用 inject 配置的key从当前组件中读取内容，读不到则读取它父组件，以此类推。inject 是一个自底向上读取内容的过程，最终将读取到的内容保存在到实例(this)上。
export function initInjections(vm: Component) {
  // resolveInject 函数的作用：通过用户配置的inject，自底向上搜索可用的注入内容，并将搜索结果返回。
  const result = resolveInject(vm.$options.inject, vm);
  if (result) {
    toggleObserving(false); //通知 defineReactive 函数不要将内容转换成响应式
    // 接下来，把注入的内容的设置成响应式数据：循环 result ，依次调用 defineReactive 将它们设置到vue.js 上。
    Object.keys(result).forEach((key) => {
      /* istanbul ignore else */
      if (process.env.NODE_ENV !== "production") {
        defineReactive(vm, key, result[key], () => {
          warn(
            `Avoid mutating an injected value directly since the changes will be ` +
              `overwritten whenever the provided component re-renders. ` +
              `injection being mutated: "${key}"`,
            vm
          );
        });
      } else {
        defineReactive(vm, key, result[key]);
      }
    });
    toggleObserving(true);
  }
}
// resolveInject函数原理：读取用户在当前组件inject 中设置的key ,然后循环key,将每一key 从当前起，不断的向父组件查找是否有值，最终将所有key对相应的值一起返回。
export function resolveInject(inject: any, vm: Component): ?Object {
  if (inject) {
    // inject is :any because flow is not smart enough to figure out cached
    const result = Object.create(null);
    // 如果浏览器原生支持 Symbol 就用 Reflect.ownKeys 获取key,如果不支持则用 Object.keys 获取key.
    // 两者的区别：Reflect.ownKeys 可以读取Symbol 类型的属性，而 Object.keys 不能。
    const keys = hasSymbol ? Reflect.ownKeys(inject) : Object.keys(inject);

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      // #6574 in case the inject object is observed...
      if (key === "__ob__") continue;
      // 通过from 属性得到provide 源属性，然后通过源属性使用while 来循环搜索内容。
      const provideKey = inject[key].from;
      let source = vm; //刚开始，源属性为当前组件实例
      // while 循环自底向上搜索值
      while (source) {
        // 如果原始属性在 source._provided 中找到对应值，将设置到 result 中，并退出当前循环。
        if (source._provided && hasOwn(source._provided, provideKey)) {
          result[key] = source._provided[provideKey];
          break;
        }
        // 如果原始属性在 source._provided 中没找到对应值，则将source 设置为父组件实例进行下一轮循环，依此类推。
        source = source.$parent;
      }
      // 我们知道，inject 是可以设置默认值的。如果在所有祖先组件实例中都没有搜索到注入内容时，如果用户设置了默认值就将使用默认值。
      if (!source) {
        if ("default" in inject[key]) {
          const provideDefault = inject[key].default;
          // 默认值支持函数，所以需要判断默认值类型是不是函数，如果是函数，则需要将函数的返回值设置给 result[key]
          result[key] =
            typeof provideDefault === "function"
              ? provideDefault.call(vm)
              : provideDefault;
        } else if (process.env.NODE_ENV !== "production") {
          warn(`Injection "${key}" not found`, vm);
        }
      }
    }
    return result;
  }
}
