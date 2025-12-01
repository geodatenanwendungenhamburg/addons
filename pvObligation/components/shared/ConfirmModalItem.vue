<script>
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";

export default {
    name: "ConfirmModalItem",
    components: {
        FlatButton
    },
    props: {
        /** Modal title, overwrite with slot if HTML is required. */
        modalTitle: {
            type: [String, null],
            default: null
        },
        /** Modal text, overwrite with slot if HTML is required. */
        modalText: {
            type: [String, null],
            default: null
        },
        /** Button "confirm" label */
        buttonConfirmLabel: {
            type: String,
            default: "OK"
        },
        /** Button "confirm" icon */
        buttonConfirmIcon: {
            type: [String, null],
            default: "bi-check-lg"
        },
        /** Button "confirm" hidden */
        buttonConfirmHidden: {
            type: Boolean,
            default: false
        },
        /** Button "cancel" label */
        buttonCancelLabel: {
            type: String,
            default: "Cancel"
        },
        /** Button "cancel" icon */
        buttonCancelIcon: {
            type: [String, null],
            default: null
        },
        /** Button "cancel" hidden */
        buttonCancelHidden: {
            type: Boolean,
            default: false
        },
        /** Set CSS inline styles for the inner wrapper */
        modalInnerWrapperStyle: {
            type: String,
            default: ""
        },
        /** Set CSS inline styles for the content container */
        modalContentContainerStyle: {
            type: String,
            default: ""
        },
        showModal: {
            type: Boolean,
            default: false
        }
    },
    emits: [
        "modalHid",
        "clickedConfirm",
        "clickedCancel"
    ],
    data: function () {
        return {
            showing: false
        };
    },
    computed: {
        showingClass () {
            return this.showing ? "showing" : "";
        }
    },
    watch: {
        showModal: {
            immediate: true,
            handler: function (newShowing) {
                if (newShowing !== this.showing) {
                    this.showing = newShowing;
                }
            }
        },
        // Trigger modalHid to parent component
        showing: function (newShowing) {
            if (!newShowing) {
                this.$emit("modalHid");
            }
            else {
                this.$nextTick(() => {
                    if (this.$refs.discard) {
                        this.$refs.discard.focus();
                    }
                });
            }
        }
    },
    mounted () {
        document.getElementsByTagName("body")[0].appendChild(this.$el);
    },
    methods: {
        handleClickConfirm () {
            this.$emit("clickedConfirm");
        },
        handleClickCancel () {
            this.$emit("clickedCancel");
        }
    }
};
</script>

<template lang="html">
    <div
        id="modal-1-container"
        :class="[showingClass]"
        role="alert"
    >
        <div id="modal-1-overlay" />

        <button
            id="modal-1-outer-wrapper"
            @mousedown="discardByClickOutside"
            @dragenter.prevent="discardByClickOutside"
        >
            <div
                id="modal-1-inner-wrapper"
                ref="discard"
                tabindex="0"
                :style="modalInnerWrapperStyle"
                class="modal-rounded-dialog"
            >
                <div
                    id="modal-1-header-container"
                >
                    <div
                        v-if="$slots.header"
                        class="headerConfirm"
                    >
                        <slot name="header" />
                    </div>

                    <div
                        v-else-if="modalTitle"
                        class="headerConfirm"
                    >
                        {{ modalTitle }}
                    </div>
                </div>

                <div
                    v-if="$slots.default || modalText"
                    id="modal-1-content-container"
                    :style="modalContentContainerStyle"
                >
                    <template v-if="$slots.default">
                        <slot />
                    </template>

                    <template v-else-if="modalText">
                        <p>
                            {{ modalText }}
                        </p>
                    </template>
                </div>

                <div id="modal-1-footer-container">
                    <div
                        class="confirmActions"
                        :class="{'withhoutContentSlot': !$slots.default && !modalText }"
                    >
                        <FlatButton
                            v-if="!buttonCancelHidden"
                            :text="buttonCancelLabel"
                            :icon="buttonCancelIcon"
                            :secondary="true"
                            :interaction="() => handleClickCancel()"
                        />

                        <FlatButton
                            v-if="!buttonConfirmHidden"
                            :text="buttonConfirmLabel"
                            :icon="buttonConfirmIcon"
                            :interaction="() => handleClickConfirm()"
                        />
                    </div>

                    <slot name="footer" />
                </div>
            </div>
        </button>
    </div>
</template>

<style lang="scss" scoped>
    @import "~variables";

    .modal-rounded-dialog {
        border-radius: 0.3em;
    }

    #modal-1-container{
        display: none;

        &.showing{
            display: block;
        }

        .bootstrap-icon {
            font-size: $font_size_big;
            padding: 5px;
            color:#555555;
        }
    }

    #modal-1-overlay{
        background-color:rgba(0, 0, 0, 0.4);
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 1000;
    }

    #modal-1-outer-wrapper {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        text-align: center;
        z-index: 10000;
        background-color: rgb(1, 1, 1, 0);
        border: none;
        cursor: default;

        &:before {
            content: '';
            display: inline-block;
            height: 100%;
            vertical-align: middle;
            margin-right: -0.25rem;
        }
    }

    #modal-1-inner-wrapper {
        text-align: left;
        background-color: $white;
        display: inline-block;
        vertical-align: middle;
        max-width: 90%;
        position: relative;
        padding: 5px;

        #modal-1-header-container {
            div.headerConfirm {
                font-weight: bold;
                padding: 24px 24px 6px 24px;
            }
        }

        #modal-1-content-container {
            max-height: 80vh;
            overflow: auto;
        }

        #modal-1-footer-container {
            .confirmActions {
                display: flex;
                justify-content: end;
                margin: 0 1rem -1rem 1rem;
                padding-bottom: 1rem;
                gap: 1rem;

                &.withhoutContentSlot {
                    padding-top: 16px;
                }
            }
        }

        .bootstrap-icon {
            position: absolute;
            right: 2px;
            top: 4px;
            z-index: 4;

            &:hover {
                cursor: pointer;
            }
        }
    }

    #modal-1-content-container {
        padding:12px 24px 12px 24px;
    }
</style>
