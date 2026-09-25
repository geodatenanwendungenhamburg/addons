<script>
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import {TAB_SET_CURRENT} from "@shared/modules/tabs/components/TabContainer.vue";

export default {
    name: "LandRegistryFileResults",
    components: {
        FlatButton
    },
    inject: {
        setCurrentTab: {from: TAB_SET_CURRENT, default: null}
    }
};
</script>

<template lang="html">
    <div
        id="LandRegistryFileResults"
        class="InnerLayoutFrame"
    >
        <div class="ScrollableContent">
            <p>Ergebnisse</p>
        </div>

        <div class="FixedContent buttons-footer">
            <FlatButton
                :aria-label="$t('additional:modules.landRegistryFile.tabs.tabResults.backToSearchButtonLabel')"
                :text="$t('additional:modules.landRegistryFile.tabs.tabResults.backToSearchButtonLabel')"
                :secondary="true"
                @click="setCurrentTab('tabSearch')"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
    #LandRegistryFileResults{
        height: 100%;

        p {
            background-color: white;
            white-space: pre-line;
            padding: 1.5rem;
        }
    }
</style>
