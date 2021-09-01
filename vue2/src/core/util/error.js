/* @flow */

import config from "../config";
import { warn } from "./debug";
import { inBrowser, inWeex } from "./env";
import { isPromise } from "shared/util";
import { pushTarget, popTarget } from "../observer/dep";
// vue.js 会捕获所有用户抛出的错误，会调用 handleError 函数来处理这些错误。
export function handleError(err: Error, vm: any, info: string) {
  // Deactivate deps tracking while processing error handler to avoid possible infinite rendering.
  // See: https://github.com/vuejs/vuex/issues/1505
  pushTarget();
  try {
    if (vm) {
      let cur = vm;
      // 通过while 语句自底向上不停地循环获取父组件，指直到根组件。
      while ((cur = cur.$parent)) {
        const hooks = cur.$options.errorCaptured; //读取 errorCaptured 钩子函数列表，遍历执行列表中的每一个 errorCaptured钩子函数。
        if (hooks) {
          for (let i = 0; i < hooks.length; i++) {
            try {
              // errorCaptured 钩子函数能够返回 false 来阻止错误继续向上传播。
              // 它会阻止其它被这个错误唤起的 errorCaptured 钩子函数和全局的config.errorHandler。
              const capture = hooks[i].call(cur, err, vm, info) === false;
              if (capture) return;
            } catch (e) {
              globalHandleError(e, cur, "errorCaptured hook");
            }
          }
        }
      }
    }
    globalHandleError(err, vm, info);
  } finally {
    popTarget();
  }
}

export function invokeWithErrorHandling(
  handler: Function,
  context: any,
  args: null | any[],
  vm: any,
  info: string
) {
  let res;
  try {
    res = args ? handler.apply(context, args) : handler.call(context);
    if (res && !res._isVue && isPromise(res) && !res._handled) {
      res.catch((e) => handleError(e, vm, info + ` (Promise/async)`));
      // issue #9511
      // avoid catch triggering multiple times when nested calls
      res._handled = true;
    }
  } catch (e) {
    handleError(e, vm, info);
  }
  return res;
}
// callHook 在触发生命周期钩子时，函数内可能发生错误需要handleError捕获
// 全局错误处理相关的代码在此函数中处理
function globalHandleError(err, vm, info) {
  if (config.errorHandler) {
    try {
      return config.errorHandler.call(null, err, vm, info);
    } catch (e) {
      // if the user intentionally throws the original error in the handler,
      // do not log it twice
      if (e !== err) {
        logError(e, null, "config.errorHandler");
      }
    }
  }
  logError(err, vm, info);
}

function logError(err, vm, info) {
  if (process.env.NODE_ENV !== "production") {
    warn(`Error in ${info}: "${err.toString()}"`, vm);
  }
  /* istanbul ignore else */
  if ((inBrowser || inWeex) && typeof console !== "undefined") {
    console.error(err);
  } else {
    throw err;
  }
}
