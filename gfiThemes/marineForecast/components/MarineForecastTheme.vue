<script>
import {mapMutations} from "vuex";
import {isHTML} from "@shared/js/utils/isHTML.js";

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
        },
        useIframeForWfs () {
            const params = this.feature.getTheme?.()?.params || {};

            return Boolean(params.forceIframe);
        },
        htmlContent () {
            if (this.mimeType === "text/html") {
                return this.feature.getDocument();
            }

            // Try to find an HTML string within properties for WFS/JSON GFIs
            let props = {};

            if (typeof this.feature.getMappedProperties === "function") {
                props = this.feature.getMappedProperties();
            }
            else if (typeof this.feature.getProperties === "function") {
                props = this.feature.getProperties();
            }

            if (props && typeof props === "object") {
                // Collect all HTML-like strings; prefer specific keys first if present
                const preferredKeys = ["html", "content", "forecast", "beschreibung", "description"],
                    collected = [];

                preferredKeys.forEach(key => {
                    if (typeof props[key] === "string" && isHTML(props[key])) {
                        collected.push(props[key]);
                    }
                });
                Object.entries(props).forEach(([, value]) => {
                    if (typeof value === "string" && isHTML(value)) {
                        collected.push(value);
                    }
                });

                // De-duplicate while preserving order
                if (collected.length > 0) {
                    return Array.from(new Set(collected)).join("<hr>");
                }
            }
            return "";
        },
        renderInIframe () {
            if (this.mimeType === "text/html") {
                return true;
            }
            // For WFS/JSON: enable iframe either via theme param or when the content contains a table
            return this.useIframeForWfs || (typeof this.htmlContent === "string" && (/<table[\s\S]*?>/i).test(this.htmlContent));
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
            const iframe = this.$el.querySelector(".marine-iframe"),
                content = this.mimeType === "text/html" ? this.feature.getDocument() : this.htmlContent;

            if (typeof content === "string" && content.length > 0) {
                if (!iframe) {
                    return;
                }

                const style = `
                    <style>
                        body { color: #000; background: #e9e9e9; text-align: center; }
                        table.featureInfo tbody { color: #000; background: #e9e9e9; text-align: center; }
                        table.featureInfo tbody tr:nth-child(even) { background: #f1f1f1; }
                        table.featureInfo tbody td:first-child, table.featureInfo tbody th:first-child {
                            color: #e1e1e1; background: #4070a0; font-weight: bold;
                        }
                    </style>`,
                    doc = `<!doctype html><html><head><meta charset="utf-8">${style}</head><body>${content}</body></html>`;

                iframe.contentWindow.document.open();
                iframe.contentWindow.document.write(doc);
                iframe.contentWindow.document.close();
            }
        }
    }
};
</script>

<template>
    <div>
        <iframe
            v-if="renderInIframe"
            class="marine-iframe"
            title="Marine Forecast"
        />
        <div v-else>
            <div
                v-if="htmlContent"
                class="marine-html"
                v-html="htmlContent"
            />
            <p v-else>
                No HTML content available.
            </p>
        </div>
    </div>
</template>

<style scoped>
.marine-iframe {
    width: 100%;
    height: 800px;
}
.marine-html {
    overflow-x: auto;
    overflow-y: auto;
    line-height: normal;
    max-height: 80vh;
}
.marine-html table {
    width: max-content;
    border-collapse: collapse;
}
.marine-html td,
.marine-html th {
    white-space: nowrap;
}
/* Theming for inline HTML tables */
.marine-html {
    color: #000;
    background: #e9e9e9;
    text-align: center;
}
.marine-html table.featureInfo tbody tr:nth-child(even) {
    background: #f1f1f1;
}
.marine-html table.featureInfo tbody td:first-child,
.marine-html table.featureInfo tbody th:first-child {
    color: #e1e1e1;
    background: #4070a0;
    font-weight: bold;
}
</style>
