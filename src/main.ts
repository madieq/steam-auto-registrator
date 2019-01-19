import Vue from 'vue'
import VueRouter from 'vue-router'

import App from './components/App.vue'

Vue.config.productionTip = false;
// Vue.use(VueRouter)
// const routes = [{ path: '/', component: App }]
// let router = new VueRouter({
//   mode: 'hash',
//   routes
// })
new Vue({
  el: '#app',
  // router,
  // render: h => h(App),
  components: { App },
  // mounted() {
  //   // Prevent blank screen in Electron builds
  //   this.$router.push('/')
  // }
})