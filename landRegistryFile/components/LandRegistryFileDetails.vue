<script>
import {mapGetters} from "vuex";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import {TAB_SET_CURRENT} from "@shared/modules/tabs/components/TabContainer.vue";

export default {
    name: "LandRegistryFileDetails",
    components: {
        FlatButton
    },
    inject: {
        setCurrentTab: {from: TAB_SET_CURRENT, default: null}
    },
    computed: {
        ...mapGetters("Modules/LandRegistryFile", [
            "selectedDetail"
        ])
    }
};
</script>

<template lang="html">
    <div
        id="LandRegistryFileDetails"
        class="InnerLayoutFrame"
    >
        <div class="ScrollableContent">
            <p>{{ selectedDetail }}</p>
        </div>

        <div class="FixedContent buttons-footer">
            <FlatButton
                :aria-label="$t('additional:modules.landRegistryFile.tabs.tabDetails.backToResultsButtonLabel')"
                :text="$t('additional:modules.landRegistryFile.tabs.tabDetails.backToResultsButtonLabel')"
                :secondary="true"
                @click="setCurrentTab('tabResults')"
            />

            <FlatButton
                :aria-label="$t('additional:modules.landRegistryFile.tabs.tabDetails.backToSearchButtonLabel')"
                :text="$t('additional:modules.landRegistryFile.tabs.tabDetails.backToSearchButtonLabel')"
                :secondary="true"
                @click="setCurrentTab('tabSearch')"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
    #LandRegistryFileDetails{
        height: 100%;

        p {
            background-color: white;
            white-space: pre-line;
            padding: 1.5rem;
        }
    }
</style>
