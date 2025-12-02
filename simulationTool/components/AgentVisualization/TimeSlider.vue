<script>
export default {
    name: "TimeSlider",
    props: {
        timeSteps: {
            type: Array,
            required: true
        },
        currentStep: {
            type: Number,
            default: 0
        },
        isPlaying: {
            type: Boolean,
            default: false
        }
    },
    emits: ["update:currentStep", "play", "pause", "reset"],
    methods: {
        /**
         * Handle slider change
         * @param {Event} event - Input event
         * @returns {void}
         */
        onSliderChange (event) {
            this.$emit("update:currentStep", parseInt(event.target.value, 10));
        },

        /**
         * Emit play event
         * @returns {void}
         */
        emitPlay () {
            this.$emit("play");
        },

        /**
         * Emit pause event
         * @returns {void}
         */
        emitPause () {
            this.$emit("pause");
        },

        /**
         * Emit reset event
         * @returns {void}
         */
        emitReset () {
            this.$emit("reset");
        }
    }
};
</script>

<template>
    <div class="time-slider-component">
        <!-- Play Controls -->
        <div class="play-controls mb-2">
            <button
                type="button"
                class="btn btn-sm btn-outline-secondary"
                :disabled="currentStep === 0"
                @click="emitReset"
            >
                <i class="bi bi-skip-start-fill" />
            </button>
            <button
                v-if="!isPlaying"
                type="button"
                class="btn btn-sm btn-primary"
                :disabled="currentStep >= timeSteps.length - 1"
                @click="emitPlay"
            >
                <i class="bi bi-play-fill" /> Play
            </button>
            <button
                v-else
                type="button"
                class="btn btn-sm btn-warning"
                @click="emitPause"
            >
                <i class="bi bi-pause-fill" /> Pause
            </button>
        </div>

        <!-- Slider -->
        <div class="slider-container">
            <input
                type="range"
                class="form-range time-range"
                :min="0"
                :max="Math.max(0, timeSteps.length - 1)"
                :value="currentStep"
                @input="onSliderChange"
            >
            <div class="slider-labels">
                <span class="label-start">{{ timeSteps[0] || '' }}</span>
                <span class="label-end">{{ timeSteps[timeSteps.length - 1] || '' }}</span>
            </div>
        </div>

        <!-- Current Time Display -->
        <div class="time-display mt-2">
            <span class="badge bg-info">
                Step {{ currentStep + 1 }} / {{ timeSteps.length }}
            </span>
            <span class="current-time-text">
                {{ timeSteps[currentStep] || '' }}
            </span>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.time-slider-component {
    padding: 1rem;
    background-color: #2d2d2d;
    border-radius: 0.5rem;
    color: #ffffff;
}

.play-controls {
    display: flex;
    gap: 0.5rem;
    justify-content: center;

    .btn {
        min-width: 80px;
    }
}

.slider-container {
    position: relative;

    .time-range {
        width: 100%;
        accent-color: #ffc107;
    }

    .slider-labels {
        display: flex;
        justify-content: space-between;
        margin-top: 0.25rem;
        font-size: 0.75rem;
        color: #adb5bd;
    }
}

.time-display {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .current-time-text {
        font-family: monospace;
        font-size: 0.875rem;
    }
}
</style>
