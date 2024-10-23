<script>
import {mapActions} from "vuex";

export default {
    name: "TemplateManagerCard",
    components: {
    },
    props: {
        title: {
            type: String,
            required: true
        },
        cardId: {
            type: String,
            required: true
        },
        created: {
            type: String,
            required: true
        },
        selectedTemplate: {
            type: Boolean,
            required: false,
            default: false
        },
        activeTemplate: {
            type: Boolean,
            required: false,
            default: false
        },
        isEnabled: {
            type: Boolean,
            required: false,
            default: true
        }
    },
    methods: {
        ...mapActions("Alerting", ["addSingleAlert"]),

        /**
         * Emits which card has been activated and selects it.
         * @returns {void}
         */
        checkActive () {
            this.$emit("showTemplate", this.title);
            this.$emit("activateTemplate", this.title);
        },

        /**
         * Shows alert info if there are no districts existed.
         * @param {Boolean} val - the flag if this template is enabled.
         * @returns {void}
         */
        showDistrictInfo (val) {
            if (!val) {
                this.addSingleAlert({
                    content: `${this.$t("additional:modules.tools.cosi.templateManager.errors.templateName")} ${this.title} ${this.$t("additional:modules.tools.cosi.templateManager.errors.notAllowLoaded")}`,
                    category: "Warning",
                    displayClass: "warning"
                });
            }
        }
    }
};
</script>
<template lang="html">
    <div
        class="col col-md-12"
    >
        <div
            class="card h-100"
            :isSelected="selectedTemplate"
            :isActive="activeTemplate"
        >
            <div class="card-body p-3">
                <div class="container p-1">
                    <div
                        class="header row"
                    >
                        <i
                            class="card-icon justify-content-center col col-md-1 h4 p-0 align-self-center mb-0"
                            :class="activeTemplate ? 'bi bi-file-earmark-text' : 'bi bi-file-earmark-x' "
                        />
                        <button
                            class="title-button btn pe-0 py-0 btn-block col col-md-8"
                            @click.prevent="$emit('showTemplate', title)"
                        >
                            <h5 class=" card-title pe-0 mb-0">
                                {{ title }}
                            </h5>
                            <div class="created-section mt-0">
                                {{ created }}
                            </div>
                        </button>
                        <div
                            class="form-check form-switch col col-md-3 p-auto align-items-end"
                            role="button"
                            tabindex="0"
                            @click="showDistrictInfo(isEnabled)"
                            @keydown="showDistrictInfo(isEnabled)"
                        >
                            <input
                                :id="`flexSwitchCheckChecked-${cardId}`"
                                :v-model="activeTemplate"
                                class="form-check-input flexSwitch"
                                type="radio"
                                :aria-checked="activeTemplate === true"
                                role="switch"
                                :disabled="!isEnabled ? 'disabled' : false"
                                :checked="activeTemplate === true"
                                @change="activeTemplate !== true ? checkActive() : ''"
                            >
                            <label
                                class="form-check-label"
                                for="flexSwitchCheckDefault"
                            > {{ activeTemplate === true ? $t("additional:modules.tools.cosi.templateManager.label.enable") : $t("additional:modules.tools.cosi.templateManager.label.disable") }}</label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<style lang="scss" scoped>
@import "~variables";
.card {
    border: 1px solid $light_grey;
    border-radius: 5px;
       i {
            color: #6E7174;
            font-size: 30px;
       }
        &:hover {
            background-color: #DCE2F3;
        }
        .title-button {
            box-shadow: none;
            text-align: left;
            &:enabled {
                border: none;
                outline: 0;
            }
        }
        .card-title {
            font-size: 12px;
            color: #6E7174;
            font-family: $font_family_accent;
        }
        .created-section {
            font-size: 11px;
            color: #6E7174;
        }
        .card-text {
            color: #5A5A5A;
            font-size: 11px;
        }
        .template-label {
            font-family: $font_family_accent;
        }
        .form-text {
            display: block;
            width: 200px;
        }
        .form-switch {
            display: inline-block;
            padding-left: 30px;
        }
        .flexSwitch {
            border-radius: 10px;
            cursor: pointer;
        }
}
.card[isActive='true'] {
    border: 2px solid $light_blue;
        .card-title {
            color: $light_blue;
        }
        i {
            color: $light_blue
        }
}
.card[isSelected='true'] {
    background-color: #DCE2F3;
}
</style>
