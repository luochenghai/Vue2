/*
 * not type checking this file because flow doesn't play well with
 * dynamically accessing methods on Array prototype
 */

import { def } from '../util/index'
// 1.获取数组原型
const arrayProto = Array.prototype
// 2.克隆副本，不能直接修改数组原型
export const arrayMethods = Object.create(arrayProto)
// 3.定义7个要重写的数组方法
const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]

/**
 * Intercept mutating methods and emit events
 */
// 4.遍历覆盖
methodsToPatch.forEach(function (method) {
  // cache original method
  // 5.获取原始方法
  const original = arrayProto[method]
  // 6.覆盖该方法，所谓的覆盖就是扩展
  def(arrayMethods, method, function mutator (...args) {
    // 7.先执行原始方法
    const result = original.apply(this, args)
    // 8.扩展逻辑：变更通知
    const ob = this.__ob__
    let inserted
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args
        break
      case 'splice':
        inserted = args.slice(2)
        break
    }
    if (inserted) ob.observeArray(inserted)
    // notify change
    // 大管家通知小管家去更新
    ob.dep.notify()
    return result
  })
})
