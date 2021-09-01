/* @flow */

import { warn, invokeWithErrorHandling } from "core/util/index";
import { cached, isUndef, isTrue, isPlainObject } from "shared/util";
// normalizeEvent 函数的作用：将事假修饰符解析出来，在模板编译阶段解析标签上的属性时会将事件修饰符变成对应的符号加在事件名前面。
const normalizeEvent = cached((name: string): {
  name: string,
  once: boolean,
  capture: boolean,
  passive: boolean,
  handler?: Function,
  params?: Array<any>,
} => {
  const passive = name.charAt(0) === "&";
  name = passive ? name.slice(1) : name;
  const once = name.charAt(0) === "~"; // Prefixed last, checked first
  name = once ? name.slice(1) : name;
  const capture = name.charAt(0) === "!";
  name = capture ? name.slice(1) : name;
  // 最终输出的对象中保存了事假名和一些事假修饰符，如果这些修饰符为 true,说明事件使用了此事件修饰符
  return {
    name,
    once,
    capture,
    passive,
  };
});

export function createFnInvoker(
  fns: Function | Array<Function>,
  vm: ?Component
): Function {
  function invoker() {
    const fns = invoker.fns;
    if (Array.isArray(fns)) {
      const cloned = fns.slice();
      for (let i = 0; i < cloned.length; i++) {
        invokeWithErrorHandling(cloned[i], null, arguments, vm, `v-on handler`);
      }
    } else {
      // return handler return value for single handlers
      return invokeWithErrorHandling(fns, null, arguments, vm, `v-on handler`);
    }
  }
  invoker.fns = fns;
  return invoker;
}

export function updateListeners(
  on: Object,
  oldOn: Object,
  add: Function,
  remove: Function,
  createOnceHandler: Function,
  vm: Component
) {
  let name, def, cur, old, event;
  // 第一部分：循环on,判断那些事件在oldOn 中不存在时就调用 add 来注册这些事件
  for (name in on) {
    def = cur = on[name];
    old = oldOn[name];
    event = normalizeEvent(name);
    /* istanbul ignore if */
    if (__WEEX__ && isPlainObject(def)) {
      cur = def.handler;
      event.params = def.params;
    }
    // isUndef 函数用判断传入的参数是否是 undefined 或者 null
    // 判断事件名是否是 undefined 或者 null,如果是则在控制台发出警告
    if (isUndef(cur)) {
      process.env.NODE_ENV !== "production" &&
        warn(
          `Invalid handler for event "${event.name}": got ` + String(cur),
          vm
        );
    } else if (isUndef(old)) {
      if (isUndef(cur.fns)) {
        cur = on[name] = createFnInvoker(cur, vm);
      }
      if (isTrue(event.once)) {
        cur = on[name] = createOnceHandler(event.name, cur, event.capture);
      }
      add(event.name, cur, event.capture, event.passive, event.params);
    } else if (cur !== old) {
      old.fns = cur;
      on[name] = old;
    }
  }
  //第二部分：循环oldOn ,判断那些事件在on中不存在，调用remove 移除这些事件
  for (name in oldOn) {
    if (isUndef(on[name])) {
      // normalizeEvent 函数的作用：将事件修饰符解析出来
      event = normalizeEvent(name);
      remove(event.name, oldOn[name], event.capture);
    }
  }
}
