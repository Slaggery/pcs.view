<template>
  <v-app class="backgroundBx">
      <router-view></router-view>
  </v-app>
</template>

<script>
export default {
  name: 'App',
  components: {

  },
  data: () => ({
    //
  }),
};
</script>

<style>
    body {
        background-color: #F9FAFB !important;
    }
    .backgroundBx {
        background-color: #F9FAFB !important;
    }
    .v-application--wrap {
        min-height: 30vh !important;
    }
</style>