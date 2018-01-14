import Vue from 'vue'
import Vuex from 'vuex'

import options from 'store/options'
/*! scaffold:import:module */

Vue.use(Vuex)

const modules = {
  /*! scaffold:insert:module */
  options
}

const getters = {
}

const store = new Vuex.Store({
  modules,
  getters
})

export default store
