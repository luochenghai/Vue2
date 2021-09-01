/* @flow */

import config from "core/config";
import { warn, cached } from "core/util/index";
import { mark, measure } from "core/util/perf";

import Vue from "./runtime/index";
import { query } from "./util/index";
import { compileToFunctions } from "./compiler/index";
import {
  shouldDecodeNewlines,
  shouldDecodeNewlinesForHref,
} from "./util/compat";

const idToTemplate = cached((id) => {
  const el = query(id);
  return el && el.innerHTML;
});

// 扩展$mount 的作用：处理可能存在的template 或者 el 选项
/**
 *  1. 它对 el 做了限制，Vue 不能挂载在 body、html 这样的根节 点上。
 *  2. 如果没有定义 render 方法，则会调用 compileToFunctions 方法把 el 或者 template 字符串转换成 render 方法。
 *  3. mountComponent：核心就是先实例化一个渲染Watcher，在它的回调函数中会调用 updateComponent 方法，在此方法中调用 vm._render 方法先生成虚拟 Node，最终调用 vm._update 更新 DOM。
 *  4. 将 vm._isMounted 设置为 true，表示已经挂载
 *  5. 执行 mounted 钩子函数：callHook(vm, 'mounted')
 * **/
const mount = Vue.prototype.$mount;
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  el = el && query(el);

  /* istanbul ignore if */
  if (el === document.body || el === document.documentElement) {
    process.env.NODE_ENV !== "production" &&
      warn(
        `Do not mount Vue to <html> or <body> - mount to normal elements instead.`
      );
    return this;
  }
  // 用户配置的选项
  const options = this.$options;
  // resolve template/el and convert to render function
  //查找render 选项 render > template > el,如果用户没有设置render 选项时会查找 template
  if (!options.render) {
    //获取template 选项
    let template = options.template;
    if (template) {
      // 判断 template 是否字符串
      if (typeof template === "string") {
        // 是否是 id 选择器，根据选择器也可以拿到模板，例如平常我们写的 #app
        if (template.charAt(0) === "#") {
          template = idToTemplate(template);
          /* istanbul ignore if */
          if (process.env.NODE_ENV !== "production" && !template) {
            warn(
              `Template element not found or is empty: ${options.template}`,
              this
            );
          }
        }
      } else if (template.nodeType) {
        template = template.innerHTML;
      } else {
        if (process.env.NODE_ENV !== "production") {
          warn("invalid template option:" + template, this);
        }
        return this;
      }
    }
    // 当template 没有被用户设置时就会查找 el
    else if (el) {
      template = getOuterHTML(el);
    }
    // 获取到HTML 的模板字符串后，执行编译过程，这种带编译器编译的过程是
    // 我们刚开始学习Vue 时写html 页面，引入 vue.js 文件，运行在浏览器环境实时编译，也就是运行时编译
    // 像我们平常的写的项目中单文件组件.vue 文件 是不带编译器的，因为webpack 中的vue-loader 已经把我们写的template 标签里的内容已经编译成渲染函数了，这种就 预编译
    if (template) {
      /* istanbul ignore if */
      if (process.env.NODE_ENV !== "production" && config.performance && mark) {
        mark("compile");
      }
      //将我们设置的 template 模板 在这里编译成渲染函数
      const { render, staticRenderFns } = compileToFunctions(
        template,
        {
          outputSourceRange: process.env.NODE_ENV !== "production",
          shouldDecodeNewlines,
          shouldDecodeNewlinesForHref,
          delimiters: options.delimiters,
          comments: options.comments,
        },
        this
      );
      options.render = render;//编译完成后，将render函数重新设置到选项上去
      options.staticRenderFns = staticRenderFns;

      /* istanbul ignore if */
      if (process.env.NODE_ENV !== "production" && config.performance && mark) {
        mark("compile end");
        measure(`vue ${this._name} compile`, "compile", "compile end");
      }
    }
  }
  // 执行挂在
  return mount.call(this, el, hydrating);
};

/**
 * Get outerHTML of elements, taking care
 * of SVG elements in IE as well.
 */
function getOuterHTML(el: Element): string {
  if (el.outerHTML) {
    return el.outerHTML;
  } else {
    const container = document.createElement("div");
    container.appendChild(el.cloneNode(true));
    return container.innerHTML;
  }
}

Vue.compile = compileToFunctions;

export default Vue;
