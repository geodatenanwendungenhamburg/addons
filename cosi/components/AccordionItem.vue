<script>
export default {
    name: "AccordionItem",
    props: {
        id: {
            type: String,
            required: true
        },
        title: {
            type: String,
            required: true
        },
        titleBadge: {
            type: [String, Number, Boolean],
            required: false,
            default: false
        },
        icon: {
            type: [Boolean, String],
            required: false,
            default: false
        },
        isOpen: {
            type: Boolean,
            required: false,
            default: false
        }
    }
};
</script>

<template>
    <div
        :id="`accordion-container-${id}`"
        class="accordion accordion-bg accordion-flush"
    >
        <div class="accordion-item border-0">
            <div
                v-if="title"
                :id="`flush-heading-${id}`"
                class="accordion-header ms-0"
            >
                <button
                    :class="['accordion-button ps-0 pb-2', !isOpen? 'collapsed' : '']"
                    type="button"
                    data-bs-toggle="collapse"
                    :data-bs-target="`#flush-collapse-${id}`"
                    aria-expanded="true"
                    :aria-controls="`#flush-collapse-${id}`"
                >
                    <i
                        v-if="icon"
                        :class="`${icon} mt-1 me-3`"
                    />
                    {{ title }}
                    <span
                        v-if="titleBadge"
                        class="badge ms-2 rounded-pill fs-6"
                    >
                        {{ titleBadge }}
                    </span>
                </button>
            </div>
            <div
                :id="`flush-collapse-${id}`"
                :class="`accordion-collapse collapse ${isOpen ? 'show' : ''}`"
                :aria-labelledby="`flush-heading-${id}`"
                :data-bs-parent="`#accordion-container-${id}`"
            >
                <div class="accordion-body pt-0 pb-2">
                    <slot />
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@import "~variables";

    .accordion {
        --bs-border-color: $white;
        --bs-accordion-active-bg: $white;
        --bs-accordion-btn-focus-box-shadow: none;
        .accordion-button {
            font-size: $font_size_icon_lg;
            .badge {
                background-color: $light_blue;
            }
        }
    }
</style>
