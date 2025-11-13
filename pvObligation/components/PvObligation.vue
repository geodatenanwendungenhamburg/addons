<script>
import {mapGetters} from "vuex";
import PvObligationWizard from "./PvObligationWizard.vue";
import SpinnerItem from "@shared/modules/spinner/components/SpinnerItem.vue";

export default {
    name: "PvObligation",
    components: {
        PvObligationWizard,
        SpinnerItem
    },
    computed: {
        ...mapGetters("Modules/PvObligation", [
            "isCreatingReport"
        ])
    }
};
</script>

<template lang="html">
    <div id="pvObligation">
        <PvObligationWizard />

        <div
            v-if="isCreatingReport"
            class="filterSpinner"
        >
            <SpinnerItem
                custom-class="spinner"
                class="ms-3"
            />

            <p> {{ $t("additional:modules.pvObligation.generateReportSpinner") }}</p>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    @import "~variables";

    #pvObligation{
        position: relative;
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;

        div.filterSpinner {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            gap: 2rem;
            align-items: center;
            justify-content: center;
            background: rgba(255,255,255,0.7);
            z-index: 2;

            div.spinner {
                width: 4rem;
                height: 4rem;
            }

            p {
                background-color: white;
            }
        }
    }
</style>

