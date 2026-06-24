<script>
export default {
    name: "TrafficCountFooter",
    props: {
        currentTabId: {
            type: String,
            required: true
        }
    },
    data () {
        return {
            customStyle: {}
        };
    },
    computed: {
        indication: function () {
            return this.$t("additional:modules.tools.gfi.themes.trafficCount.notice");
        },

        tableIndication: function () {
            return this.$t("additional:modules.tools.gfi.themes.trafficCount.holidaySign");
        }
    },
    watch: {
        currentTabId: function (newVal) {
            if (newVal !== "info" && newVal !== "downloads") {
                this.fixIndicationPosition();
            }
        }
    },
    methods: {
        /**
         * Making the indication position always fixed when the window is scrolled
         * @returns {void}
         */
        fixIndicationPosition: function () {
            const gfiContent = document.querySelector(".gfi-content");

            if (gfiContent) {
                gfiContent.addEventListener("scroll", () => {
                    this.customStyle = {
                        "left": gfiContent.scrollLeft + "px"
                    };
                });
            }
        }
    }
};
</script>

<template>
    <div>
        <div
            v-if="currentTabId !== 'info' && currentTabId !== 'downloads'"
            class="tableIndication"
            :style="customStyle"
        >
            * {{ tableIndication }}
        </div>
        <div
            v-if="currentTabId !== 'info' && currentTabId !== 'downloads'"
            class="indication"
            :style="customStyle"
        >
            {{ indication }}
        </div>
    </div>
</template>

<style lang="scss" scoped>
@import "/src/assets/css/variables";
    .tableIndication, .trucksStatusIndication, .indication {
        font-size: 10px;
    }
    .trucksStatusIndication {
        display: none;
    }
</style>
