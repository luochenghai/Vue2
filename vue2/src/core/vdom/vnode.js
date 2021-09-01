/* @flow */
/**
 *  Virtual DOM（虚拟 dom）: 本质上是一个原 生的 JS 对象，用 class 来 定义.
 *    1. 核心定义：几个关键属性，标签名、数据、子节点、键值等，其它属性都是
 *       都是用来扩展 VNode 的灵活性以 及实现一些特殊 feature 的。
 *    2. 映射到真实的 DOM ，实际上要经历 VNode 的 create、diff、patch 等过。
 *    3. createElement： 创建 VNode
 *         3.1  children 的规范化：由于 Virtual DOM 实际上是一个树状结构，每一 个
 *              VNode 可能会有若干个子节点， 这些子节点应该也是 VNode 的类 型。因
 *              为子节点 children 是任意类型 的，因此需要把它们规范成 VNode 类型。
 *                3.1.1 simpleNormalizeChildren：调用场景是 render 函数是 编译生成的
 *                3.1.2 normalizeChildren
 *                     3.1.2.1  一个场景是 render 函数是用 户手写的，当 children 只有一个 节点的时候，
 *                              Vue.js 从接口层面 允许用户把 children 写成基础类 型用来创建单个简单的
 *                              文本节 点，这种情况会调用 createTextVNode 创建一个文本 节点的 VNode。
 *                     3.1.2.2  另一个场景是当编 译 slot、v-for 的时候 会产生嵌套数组的情 况，会调用
 *                              normalizeArrayChildre n 方法，遍历 children (可能会递归调 用normalizeArrayChildre n )。
 *                     3.1.2.3  总结 经过对 children 的规范化，children 变成了一个类型为 VNode 的 Array
 *
 *          3.2  VNode 的创建 规范化 children 后， 会去创建一个 VNode 的实例。
 *               3.2.1   直接创建一个普通 VNode。
 *               3.2.2   或者通过 createComponent 创建一个组件类 型的 VNode，本质上它还是返回了一个 VNode。
 *               3.2.3   总结 每个 VNode 有 children，children 每个元素也是一个 VNode，这样就形成了一个 VNode Tree，
 *                        它很好的描述 了我们的 DOM Tree
 *
 *          3.3  update：通过 Vue 的 _update 方法，_update 方法的 作用是把 VNode 渲染成真实的 DOM。_update 的核心就
 *               是调用 vm.__patch__ 方法，__patch__在不同的平台，比 如 web 和 weex 上的定义是不一样的。
 * **/
export default class VNode {
  tag: string | void;
  data: VNodeData | void;
  children: ?Array<VNode>;
  text: string | void;
  elm: Node | void;
  ns: string | void;
  context: Component | void; // rendered in this component's scope
  key: string | number | void;
  componentOptions: VNodeComponentOptions | void;
  componentInstance: Component | void; // component instance
  parent: VNode | void; // component placeholder node

  // strictly internal
  raw: boolean; // contains raw HTML? (server only)
  isStatic: boolean; // hoisted static node
  isRootInsert: boolean; // necessary for enter transition check
  isComment: boolean; // empty comment placeholder?
  isCloned: boolean; // is a cloned node?
  isOnce: boolean; // is a v-once node?
  asyncFactory: Function | void; // async component factory function
  asyncMeta: Object | void;
  isAsyncPlaceholder: boolean;
  ssrContext: Object | void;
  fnContext: Component | void; // real context vm for functional nodes
  fnOptions: ?ComponentOptions; // for SSR caching
  devtoolsMeta: ?Object; // used to store functional render context for devtools
  fnScopeId: ?string; // functional scope id support

  constructor(
    tag?: string,
    data?: VNodeData,
    children?: ?Array<VNode>,
    text?: string,
    elm?: Node,
    context?: Component,
    componentOptions?: VNodeComponentOptions,
    asyncFactory?: Function
  ) {
    this.tag = tag;
    this.data = data;
    this.children = children;
    this.text = text;
    this.elm = elm;
    this.ns = undefined;
    this.context = context;
    this.fnContext = undefined;
    this.fnOptions = undefined;
    this.fnScopeId = undefined;
    this.key = data && data.key;
    this.componentOptions = componentOptions;
    this.componentInstance = undefined;
    this.parent = undefined;
    this.raw = false;
    this.isStatic = false;
    this.isRootInsert = true;
    this.isComment = false;
    this.isCloned = false;
    this.isOnce = false;
    this.asyncFactory = asyncFactory;
    this.asyncMeta = undefined;
    this.isAsyncPlaceholder = false;
  }

  // DEPRECATED: alias for componentInstance for backwards compat.
  /* istanbul ignore next */
  get child(): Component | void {
    return this.componentInstance;
  }
}

export const createEmptyVNode = (text: string = "") => {
  const node = new VNode();
  node.text = text;
  node.isComment = true;
  return node;
};

export function createTextVNode(val: string | number) {
  return new VNode(undefined, undefined, undefined, String(val));
}

// optimized shallow clone
// used for static nodes and slot nodes because they may be reused across
// multiple renders, cloning them avoids errors when DOM manipulations rely
// on their elm reference.
export function cloneVNode(vnode: VNode): VNode {
  const cloned = new VNode(
    vnode.tag,
    vnode.data,
    // #7975
    // clone children array to avoid mutating original in case of cloning
    // a child.
    vnode.children && vnode.children.slice(),
    vnode.text,
    vnode.elm,
    vnode.context,
    vnode.componentOptions,
    vnode.asyncFactory
  );
  cloned.ns = vnode.ns;
  cloned.isStatic = vnode.isStatic;
  cloned.key = vnode.key;
  cloned.isComment = vnode.isComment;
  cloned.fnContext = vnode.fnContext;
  cloned.fnOptions = vnode.fnOptions;
  cloned.fnScopeId = vnode.fnScopeId;
  cloned.asyncMeta = vnode.asyncMeta;
  cloned.isCloned = true;
  return cloned;
}
