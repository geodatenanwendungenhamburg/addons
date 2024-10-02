<script>
export default {
    name: "TemplateManagerExportProgressBar",
    props: {
        downloadName: {
            type: String,
            required: false,
            default: ""
        }
    },
    data: () => ({
        percentage: 50
    })
};
</script>

<template lang="html">
    <div
        class="progress-section col col-md-12"
    >
        <div
            class="export-infos row mb-1"
        >
            <i class="export-icon bi bi-file-earmark-pdf col col-md-1" />
            <div class="col col-md-8">
                <div
                    class="downloadName bold-headline"
                >
                    {{ downloadName }}
                </div>
                <span class="creatingReport">
                    {{ $t("additional:modules.tools.cosi.templateManager.creatingReport") }}
                </span>
            </div>
            <div class="col col-md-3">
                <button
                    class="btn btn-outline lh-1 fs-5 px-2 py-1 mt-2"
                    @click.prevent="$emit('closeProgressBar')"
                >
                    <i
                        class="bi bi-x"
                    />
                    {{ $t("additional:modules.tools.cosi.templateManager.cancel") }}
                </button>
            </div>
        </div>
        <div
            class="progress"
        >
            <div
                class="progress-bar bg-primary"
                role="progressbar"
                :style="`width: ${percentage}%`"
                :aria-valuenow="percentage"
                aria-valuemin="0"
                aria-valuemax="100"
            >
                <span class="progress-percentage">{{ percentage > 2 ? `${percentage} %` : '' }}</span>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
@import "~variables";

.progress {
    background-color: $light_grey;
    color: white;
    text-align: center;
    height: 20px;
    font-size: 14px;
}
.progress-bar {
    height: 100%;
}

.progress-percentage {
    font-family: $font_family_accent;
    white-space: nowrap;
}
.export-icon {
    font-size: 40px;
}
.downloadName {
    font-size: 14px;
}
.creatingReport {
    color: $secondary_contrast;
}
.btn-outline {
    border-color: $light_blue;
    color: $light_blue;
}
.btn-outline:hover {
        cursor: pointer;
        background-color: $light_blue;
        color: $white;
}

</style>
