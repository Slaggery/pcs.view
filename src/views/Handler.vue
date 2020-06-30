<template>
    <component class="compSense" v-if="componentName !== null" :is="componentName"></component>
</template>
<script>
  import contractfield from '../components/handlers/contractfield'
  import bankguarantee from '../components/handlers/bankguarantee'
  import estimate from '../components/handlers/estimate'

  export default {
    name: 'Handler',
    components: {
      contractfield,
      bankguarantee,
      estimate
    },
    data: () => ({
      componentName: null
    }),
    methods: {
      setComponentName () {
        this.componentName = this.$route.params.handler
      }
    },
    mounted () {
      this.setComponentName()
    }
  }
</script>

<style scoped>

</style>