<script>
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";

export default {
    name: "ConfirmModal",
    components: {
        FlatButton,
        IconButton
    },
    props: {
        /** Modal title, overwrite with slot "title" if HTML is required. */
        modalTitle: {
            type: String,
            default: ""
        },
        /** Modal content, overwrite with slot "default" if HTML is required. */
        modalContent: {
            type: String,
            default: ""
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
        /** Button "cancel" hidden. Hides also the x button on top of the modal */
        buttonCancelHidden: {
            type: Boolean,
            default: false
        },
        /** Button "close" hidden. X button in the top right corner of the modal */
        buttonCloseHidden: {
            type: Boolean,
            default: false
        },
        /** Set CSS class for the modal */
        modalClass: {
            type: String,
            default: ""
        },
        /** Set CSS inline styles for the modal */
        modalStyle: {
            type: String,
            default: ""
        },
        /** Set CSS class for the content */
        modalContentClass: {
            type: String,
            default: ""
        },
        /** Set CSS inline styles for the content */
        modalContentStyle: {
            type: String,
            default: ""
        },
        /** Set modal visible */
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
    watch: {
        showModal (isVisible) {
            if (!isVisible) {
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

        document.addEventListener("keydown", this.handleKeydown);
    },
    beforeUnmount () {
        document.removeEventListener("keydown", this.handleKeydown);

        if (this.$el && this.$el.parentNode) {
            this.$el.parentNode.removeChild(this.$el);
        }
    },
    methods: {
        handleClickConfirm () {
            this.$emit("clickedConfirm");
        },
        handleClickCancel () {
            this.$emit("clickedCancel");
        },
        handleKeydown (event) {
            if (!this.showModal) {
                return;
            }

            if (event.key === "Escape") {
                this.handleClickCancel();
            }

            if (event.key === "Tab") {
                this.trapFocus(event);
            }
        },
        trapFocus (event) {
            const modal = this.$refs.discard;

            if (!modal) {
                return;
            }

            // eslint-disable-next-line
            const focusableSelectors = [
                    "a[href]",
                    "area[href]",
                    "input:not([disabled])",
                    "select:not([disabled])",
                    "textarea:not([disabled])",
                    "button:not([disabled])",
                    "iframe",
                    "object",
                    "embed",
                    "[tabindex]:not([tabindex=\"-1\"])",
                    "[contenteditable]"
                ],
                focusableEls = modal.querySelectorAll(focusableSelectors.join(",")),
                focusable = Array.prototype.slice.call(focusableEls).filter(el => el.offsetParent !== null);

            if (focusable.length === 0) {
                return;
            }

            // eslint-disable-next-line
            const first = focusable[0],
                last = focusable[focusable.length - 1],
                active = document.activeElement;

            if (!event.shiftKey && active === last) {
                event.preventDefault();
                first.focus();
            }
            else if (event.shiftKey && active === first) {
                event.preventDefault();
                last.focus();
            }
        }
    }
};
</script>

<template lang="html">
    <div
        id="modal-confirm"
        :class="{showing: showModal}"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-confirm-title"
        aria-describedby="modal-confirm-content"
    >
        <div class="modal-backdrop" />

        <div class="modal-outer-wrapper">
            <div
                ref="discard"
                class="modal-inner-wrapper"
                tabindex="0"
                :style="modalStyle"
                :class="modalClass"
            >
                <div class="modal-title-wrapper">
                    <div
                        id="modal-confirm-title"
                        class="modal-title"
                    >
                        <template v-if="$slots.title">
                            <slot name="title" />
                        </template>

                        <template v-else-if="modalTitle">
                            {{ modalTitle }}
                        </template>
                    </div>

                    <IconButton
                        v-if="!buttonCloseHidden"
                        class="discard-icon-button"
                        :class-array="['btn-light', 'bootstrap-icon']"
                        :title="buttonCancelLabel"
                        :aria="buttonCancelLabel"
                        :icon="'bi-x'"
                        :interaction="() => handleClickCancel()"
                    />
                </div>

                <div
                    v-if="$slots.default || modalContent"
                    id="modal-confirm-content"
                    class="modal-content"
                    :style="modalContentStyle"
                    :class="modalContentClass"
                >
                    <template v-if="$slots.default">
                        <slot name="default" />
                    </template>

                    <template v-else-if="modalContent">
                        <p>
                            {{ modalContent }}
                        </p>
                    </template>
                </div>

                <div
                    v-if="!buttonCancelHidden || !buttonConfirmHidden"
                    class="modal-actions"
                    :class="{'without-content-slot': !$slots.default && !modalContent }"
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
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    @import "~variables";

    #modal-confirm {
        display: none;

        &.showing {
            display: block;
        }

        div.modal-backdrop {
            background-color:rgba(0, 0, 0, 0.4);
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 1000;
        }

        div.modal-outer-wrapper {
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

            div.modal-inner-wrapper {
                text-align: left;
                background-color: $white;
                display: inline-block;
                vertical-align: middle;
                max-width: 90%;
                position: relative;
                padding: .3125rem;
                border-radius: 0.3em;

                div.modal-title-wrapper {
                    display: flex;
                    justify-content: space-between;

                    div.modal-title {
                        font-weight: bold;
                        padding: 1.5rem 1.5rem 0.375rem 1.5rem;
                    }
                }

                div.modal-content {
                    max-height: 80vh;
                    overflow: auto;
                    padding: 0.75rem 1.5rem 0.75rem 1.5rem;
                }

                div.modal-actions {
                    display: flex;
                    justify-content: end;
                    margin: 0 1rem 0 1rem;
                    padding-bottom: 1rem;
                    gap: 1rem;

                    &.without-content-slot {
                        padding-top: 1rem;
                    }

                    button.flat-button {
                        // This important is required in order to overwrite the FlatButton mb-3
                        margin-bottom: 0 !important;

                        &:focus-visible {
                            border-color: var(--bs-btn-active-border-color);
                        }
                    }
                }
            }
        }
    }
</style>
