import "./assets/main.css";
import "@mdi/font/css/materialdesignicons.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

import "vuetify/styles";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";

import { aliases, fa } from "vuetify/iconsets/fa";
import { mdi } from "vuetify/iconsets/mdi";

const app = createApp(App);

app.use(router);

const vuetify = createVuetify({
  components,
  directives,
  // icons: {
  //   defaultSet: 'mdi',
  //   aliases,
  //   sets: {
  //     fa, mdi
  //   },
  // },
});

app.use(vuetify).mount("#app");
