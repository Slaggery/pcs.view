import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    bxapi: 'https://crm.pcsib.ru/rest/1/orjj6h7vsqbpz4ht/',
  },
  mutations: {
  },
  actions: {
  },
  getters: {
    bxapi:
      state => state.bxapi,
  },
  modules: {
  }
})
