/* @flow */

import { ASSET_TYPES } from 'shared/constants'
import { isPlainObject, validateComponentName } from '../util/index'

export function initAssetRegisters (Vue: GlobalAPI) {
  /**
   * Create asset registration methods.
   */
  ASSET_TYPES.forEach(type => {
    // 声明静态方法：Vue.component=function() {}
    // Vue.component('comp',{})
    Vue[type] = function (
      id: string, //声明的组件名 comp
      definition: Function | Object
    ): Function | Object | void {
      if (!definition) {
        return this.options[type + 's'][id]
      } else {
        /* istanbul ignore if */
        if (process.env.NODE_ENV !== 'production' && type === 'component') {
          validateComponentName(id)
        }
        if (type === 'component' && isPlainObject(definition)) {
         // name 设置
          definition.name = definition.name || id
         // Vue.extend({})=> 组件构造函数Ctor
         // new Ctor()
         // 将传入的组件配置对象转换为组件的构造函数
          definition = this.options._base.extend(definition)
        }
        if (type === 'directive' && typeof definition === 'function') {
          definition = { bind: definition, update: definition }
        }
        // 向全局的选项中加入全局组件配置对象
        // components[id] = Ctor
        this.options[type + 's'][id] = definition
        return definition
      }
    }
  })
}
