<script>
export default {
    name: "DipasAnalyticsInsightsTheme",
    props: {
        feature: {
            type: Object,
            required: true
        }
    },
    data () {
        return {
            headingTitleElement: null
        };
    },
    computed: {
        attributes () {
            return this.feature.getMappedProperties();
        },
        categories () {
            const categoryString = this.attributes.categories.join(", ");

            return this.$t("additional:addons.gfiThemes.dipasAnalyticsInsights.categories") + ": " + categoryString;
        }
    },
    watch: {
        attributes: {
            handler () {
                this.headingTitleElement.innerHTML = this.categories;
            },
            deep: true
        }
    },
    mounted () {
        if (document.getElementsByClassName("heading-element").length) {
            this.headingTitleElement = document.querySelector(".tool-window-heading-title");
            this.headingTitleElement.innerHTML = this.categories;
        }
        else if (document.getElementsByClassName("modal-header").length) {
            this.headingTitleElement = document.querySelector(".modal-title");
            this.headingTitleElement.innerHTML = this.categories;
            this.headingTitleElement.style.textAlign = "right";
        }
    }
};
</script>

<template>
    <div class="dipas-analytics-insights-theme">
        <h3 class="dipas-analytics-insights-title">
            {{ attributes.title }}
        </h3>

        <div class="dipas-analytics-insights-contribution-text">
            {{ /* Masterportal replaces newlines with pipes automatically. Split the text into paragraphs again. */ }}
            <template v-for="(textBlock, index) in attributes.description.split('|')">
                <p
                    v-if="textBlock.length"
                    :key="`textBlock_${index}`"
                >
                    {{ textBlock }}
                </p>
            </template>
        </div>
    </div>
</template>

<style lang="scss">
div.dipas-analytics-insights-theme {
    font-size: 1rem;
    padding: 1rem;
    max-width: 600px;

    h3.dipas-analytics-insights-title {
        font-size: 1rem;
        font-weight: bold;
        line-height: 2rem;
        border: none;
        padding: 0;
        color: #003063;
    }

    div.dipas-analytics-insights-contribution-text {
        p {
            color: #003063;
            margin-bottom: 0.5rem;
            font-size: 1rem;
        }
    }
}
</style>
