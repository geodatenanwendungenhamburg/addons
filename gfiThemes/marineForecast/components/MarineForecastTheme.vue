<script>
import {mapMutations} from "vuex";

export default {
    name: "MarineForecastTheme",
    props: {
        feature: {
            type: Object,
            required: true
        }
    },
    computed: {
        mimeType () {
            return this.feature.getMimeType();
        }
    },
    watch: {
        feature () {
            this.$nextTick(this.injectHtmlContent);
        }
    },
    mounted () {
        this.setCurrentMenuWidth({side: "secondaryMenu", width: "35%"});
        this.$nextTick(this.injectHtmlContent);
    },
    unmounted () {
        this.setCurrentMenuWidth({side: "secondaryMenu", width: "25%"});
    },
    methods: {
        ...mapMutations("Menu", ["setCurrentMenuWidth"]),
        injectHtmlContent () {
            if (this.mimeType === "text/html") {
                const iframe = this.$el.querySelector(".marine-iframe");

                if (iframe) {
                    iframe.contentWindow.document.open();
                    iframe.contentWindow.document.write(this.feature.getDocument());
                    iframe.contentWindow.document.close();
                }
            }
        }
    }
};
</script>

<template>
    <div>
        <iframe
            v-if="mimeType === 'text/html'"
            class="marine-iframe"
            title="Marine Forecast"
        />
        <div v-else>
            <p>No HTML content available.</p>
        </div>
    </div>
</template>

<style scoped>
.marine-iframe {
    width: 100%;
    height: 800px;
}
</style>
