import Vue from 'vue'
import Meta from 'vue-meta'
import Router from 'vue-router'
import Home from '../views/Home'
import Error from '../views/Error'
/*! scaffold:import:route */

Vue.use(Meta)
Vue.use(Router)

export default new Router({
  mode: 'hash',
  routes: [
    {
      path: '/',
      component: Home
    },
    /*! scaffold:insert:route */
    {
      path: '*',
      name: 'NotFound',
      component: Error
    }
  ]
})
