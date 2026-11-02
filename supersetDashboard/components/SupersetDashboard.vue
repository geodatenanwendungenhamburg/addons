<script>
import {mapState} from "pinia";
import {useSupersetDashboardStore} from "../store/supersetDashboardStore.js";

/**
 * Embeds an Apache Superset dashboard into the configured menu.
 * @module addons/supersetDashboard/components/SupersetDashboard
 * @vue-computed {String} dashboardUrl - The URL of the configured dashboard.
 */
export default {
    name: "SupersetDashboard",
    computed: {
        ...mapState(useSupersetDashboardStore, [])
    }
};
</script>

<template lang="html">
    <div id="superset-dashboard">
        superset dashboard
    </div>
</template>

<style lang="scss" scoped>
    #superset-dashboard {
        height: 100%;

        #dashboard-iframe {
            border: 0;
            height: 100%;
            min-height: 60vh;
            width: 100%;
        }
    }
</style>
