<script>
import {mapGetters} from "vuex";
import PvObligationWizard from "./PvObligationWizard.vue";

export default {
    name: "PvObligation",
    components: {
        PvObligationWizard
    },
    computed: {
        ...mapGetters("Modules/PvObligation", [])
    }
};
</script>

<template lang="html">
    <div id="pvObligation">
        <PvObligationWizard />
    </div>
</template>

<style lang="scss" scoped>
    @import "~variables";

    #pvObligation{
    }
</style>

