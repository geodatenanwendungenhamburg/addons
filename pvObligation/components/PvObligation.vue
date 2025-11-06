<script>
import {mapGetters} from "vuex";

export default {
    name: "PvObligation",
    computed: {
        ...mapGetters("Modules/PvObligation", [])
    }
};
</script>

<template lang="html">
    <div id="pvObligation">
    </div>
</template>

<style lang="scss">
#pvObligation{
}
</style>

