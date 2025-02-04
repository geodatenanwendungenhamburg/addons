<script>

export default {
    name: "DistrictFinderLoadingSpinner"
};
</script>

<template lang="html">
    <div class="d-flex justify-content-center">
        <div
            class="spinner-border"
            role="status"
        >
            <span class="sr-only">...</span>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@import "~variables";

.spinner-border {
    color: $dark_blue;
    .sr-only {
        visibility: hidden;
    }
}

.center-in-screen {
    position: absolute;
    left: 50%;
    top: 50%;
}
</style>
