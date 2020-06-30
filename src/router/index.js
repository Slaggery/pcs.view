import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/handlers/:handler',
    name: 'MHandlers',
    component: () => import('../views/ModernHandler.vue')
  },
  {
    path: '/install',
    name: 'Install',
    component: () => import('../views/Install.vue')
  },
  {
    path: '/reports/worktime',
    name: 'WorkTimeReport',
    component: () => import('../views/WorkTimeReport.vue')
  },
  {
    path: '/reports/worktime/smo/:id',
    name: 'WorkTimeReportSMO',
    component: () => import('../views/WorkTimeReportSMO.vue')
  },
  {
    path: '/reports/worktime/pir/:id',
    name: 'WorkTimeReportPIR',
    component: () => import('../views/WorkTimeReportPIR.vue')
  },
  {
    path: '/reports/spend',
    name: 'SpendReport',
    component: () => import('../views/SpendReport.vue')
  },
  {
    path: '/reports/spend/smo/:id',
    name: 'SpendReportSMO',
    component: () => import('../views/SpendReportSMO.vue')
  },
  {
    path: '/reports/spend/pir/:id',
    name: 'SpendReportPIR',
    component: () => import('../views/SpendReportPIR.vue')
  },
  {
    path: '/reports/spend/:id',
    name: 'SpendReportView',
    component: () => import('../views/SpendReportView.vue')
  },
  {
    path: '/reports/salary',
    name: 'salaryReport',
    component: () => import('../views/salaryReport.vue')
  },
  {
    path: '/reports/project',
    name: 'projectReport',
    component: () => import('../views/projectReport.vue')
  },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
