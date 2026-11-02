import SupersetDashboard from "./components/SupersetDashboard.vue";
import {useSupersetDashboardStore} from "./store/supersetDashboardStore.js";
import deLocale from "./locales/de/additional.json";
import enLocale from "./locales/en/additional.json";

export default {
    component: SupersetDashboard,
    piniaStore: useSupersetDashboardStore,
    locales: {
        de: deLocale,
        en: enLocale
    }
};
