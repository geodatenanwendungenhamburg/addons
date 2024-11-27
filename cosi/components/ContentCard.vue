<script>
export default {
    name: "ContentCard",
    props: {
        id: {
            type: String,
            required: true
        },
        title: {
            type: String,
            required: false,
            default: undefined
        },
        subtitle: {
            type: String,
            required: false,
            default: undefined
        },
        closeIcon: {
            type: String,
            required: false,
            default: "bi bi-x"
        }
    }
};
</script>

<template>
    <div
        class="card pb-1"
    >
        <div
            class="row"
        >
            <div class="col-11 pb-0">
                <slot name="header" />
            </div>
            <button class="col-1 close-button pt-1 pb-0">
                <i
                    class="close"
                    :class="closeIcon"
                />
            </button>
        </div>
        <div class="card-body">
            <h5
                v-if="title !== undefined"
                class="card-title"
            >
                {{ title }}
            </h5>
            <h6
                v-if="subtitle !== undefined"
                class="card-subtitle mb-2 text-muted"
            >
                {{ subtitle }}
            </h6>
            <p class="card-text">
                <slot name="body" />
            </p>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    @import "~/css/mixins.scss";
    @import "~variables";

    .card {
        border-radius: 5px;
        box-shadow: rgba(0, 0, 0, 0.15) 0px 5px 15px 0px;
    }

    .close-button i {
        font-size: 16px;
        color: #646262;
    }

</style>
