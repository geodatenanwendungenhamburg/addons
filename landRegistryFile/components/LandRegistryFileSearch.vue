<script>
import {mapGetters, mapMutations} from "vuex";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";

export default {
    name: "LandRegistryFileSearch",
    components: {
        FlatButton
    },
    computed: {
        ...mapGetters("Modules/LandRegistryFile", [
            "showLoadingSpinner"
        ])
    },
    methods: {
        ...mapMutations("Modules/LandRegistryFile", [
            "setShowLoadingSpinner"
        ]),
        startSearch () {
            console.warn("startSearch: Noch nicht implementiert!");
        },
        resetForm () {
            console.warn("resetForm: Noch nicht implementiert!");
        }
    }
};
</script>

<template lang="html">
    <div
        id="landRegistryFileSearch"
        class="InnerLayoutFrame"
    >
        <div class="ScrollableContent">
            <p>Suche</p>
        </div>

        <div class="FixedContent buttons-footer">
            <div
                class="spacer-div"
            />
            <FlatButton
                :aria-label="$t('additional:modules.landRegistryFile.tabs.tabSearch.searchButtonLabel')"
                text="Suche"
                @click="startSearch()"
            />

            <FlatButton
                :aria-label="$t('additional:modules.landRegistryFile.tabs.tabSearch.resetButtonLabel')"
                text="Zurücksetzen"
                :secondary="true"
                @click="resetForm()"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
    #landRegistryFileSearch{
        height: 100%;

        p {
            background-color: white;
            white-space: pre-line;
            padding: 1.5rem;
        }

        div.spacer-div {
            flex: 1;
        }
    }
</style>
