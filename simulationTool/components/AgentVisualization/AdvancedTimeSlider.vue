<template>
    <div class="advanced-time-slider">
        <!-- Live Timestamp Display -->
        <div class="timestamp-display">
            <span class="timestamp-value">{{ formattedCurrentTime }}</span>
        </div>

        <!-- Time Slider -->
        <div class="slider-container">
            <div
                ref="sliderTrack"
                class="slider-track"
                @click="handleTrackClick"
            >
                <!-- Progress bar -->
                <div
                    class="slider-progress"
                    :style="{ width: progressPercent + '%' }"
                />

                <!-- Timestep markers -->
                <div
                    v-for="(step, index) in timeSteps"
                    :key="index"
                    class="timestep-marker"
                    :style="{ left: getMarkerPosition(step) + '%' }"
                    :title="formatTime(step)"
                />

                <!-- Drag handle -->
                <div
                    ref="sliderHandle"
                    class="slider-handle"
                    :style="{ left: progressPercent + '%' }"
                    @mousedown="startDrag"
                    @touchstart="startDrag"
                >
                    <div class="handle-tooltip">{{ formattedCurrentTime }}</div>
                </div>
            </div>

            <!-- Time axis labels -->
            <div class="time-axis">
                <span class="axis-label axis-label-start">{{ formatTime(timeRange.min) }}</span>
                <span class="axis-label axis-label-end">{{ formatTime(timeRange.max) }}</span>
            </div>
        </div>

        <!-- Playback Controls -->
        <div class="playback-controls">
            <!-- Skip to start -->
            <button
                class="control-btn"
                :disabled="isAtStart"
                @click="skipToStart"
                title="Zum Start springen"
            >
                <i class="bi bi-skip-start-fill" />
            </button>

            <!-- Skip backward -->
            <button
                class="control-btn"
                :disabled="isAtStart"
                @click="skipBackward"
                title="Einen Schritt zurück"
            >
                <i class="bi bi-skip-backward-fill" />
            </button>

            <!-- Play/Pause -->
            <button
                class="control-btn control-btn-primary"
                @click="togglePlay"
                :title="isPlaying ? 'Pause' : 'Abspielen'"
            >
                <i :class="isPlaying ? 'bi bi-pause-fill' : 'bi bi-play-fill'" />
            </button>

            <!-- Skip forward -->
            <button
                class="control-btn"
                :disabled="isAtEnd"
                @click="skipForward"
                title="Einen Schritt vor"
            >
                <i class="bi bi-skip-forward-fill" />
            </button>

            <!-- Skip to end -->
            <button
                class="control-btn"
                :disabled="isAtEnd"
                @click="skipToEnd"
                title="Zum Ende springen"
            >
                <i class="bi bi-skip-end-fill" />
            </button>

            <!-- Speed control -->
            <div class="speed-control">
                <label for="speed-select">Geschwindigkeit:</label>
                <select
                    id="speed-select"
                    v-model="playbackSpeed"
                    @change="updateSpeed"
                    class="form-select form-select-sm"
                >
                    <option :value="0.1">0.1x</option>
                    <option :value="0.25">0.25x</option>
                    <option :value="0.5">0.5x</option>
                    <option :value="1">1x</option>
                    <option :value="2">2x</option>
                    <option :value="5">5x</option>
                    <option :value="10">10x</option>
                </select>
            </div>

            <!-- Loop toggle -->
            <div class="loop-toggle">
                <div class="form-check form-switch">
                    <input
                        id="loop-switch"
                        v-model="loopEnabled"
                        type="checkbox"
                        class="form-check-input"
                        @change="updateLoop"
                    >
                    <label
                        class="form-check-label"
                        for="loop-switch"
                    >
                        Wiederholen
                    </label>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import {mapState, mapGetters} from "vuex";

export default {
    name: "AdvancedTimeSlider",
    props: {
        timeEngine: {
            type: Object,
            required: true
        }
    },
    data () {
        return {
            isDragging: false,
            playbackSpeed: 1,
            loopEnabled: false
        };
    },
    computed: {
        ...mapState("agentVisualization", [
            "currentTime",
            "isPlaying",
            "timeSteps",
            "speed",
            "loop"
        ]),
        ...mapGetters("agentVisualization", [
            "timeRange",
            "formattedCurrentTime",
            "isAtStart",
            "isAtEnd"
        ]),

        /**
         * Calculate progress percentage
         */
        progressPercent () {
            const range = this.timeRange;

            if (range.max === range.min) {
                return 0;
            }

            return ((this.currentTime - range.min) / (range.max - range.min)) * 100;
        }
    },
    mounted () {
        this.playbackSpeed = this.speed;
        this.loopEnabled = this.loop;
    },
    methods: {
        /**
         * Format timestamp
         */
        formatTime (timestamp) {
            if (!timestamp) {
                return "--:--:--";
            }

            const date = new Date(timestamp);

            if (isNaN(date.getTime())) {
                return "--:--:--";
            }

            return date.toLocaleTimeString("de-DE", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            });
        },

        /**
         * Get marker position percentage
         */
        getMarkerPosition (step) {
            const range = this.timeRange;

            if (range.max === range.min) {
                return 0;
            }

            return ((step - range.min) / (range.max - range.min)) * 100;
        },

        /**
         * Handle track click
         */
        handleTrackClick (event) {
            const rect = this.$refs.sliderTrack.getBoundingClientRect(),
                clickX = event.clientX - rect.left,
                percent = clickX / rect.width,
                range = this.timeRange,
                newTime = range.min + (range.max - range.min) * percent;

            this.timeEngine.jumpToTime(newTime);
        },

        /**
         * Start dragging
         */
        startDrag (event) {
            event.preventDefault();
            this.isDragging = true;

            const handleMove = (e) => {
                    if (!this.isDragging) {
                        return;
                    }

                    const rect = this.$refs.sliderTrack.getBoundingClientRect(),
                        clientX = e.clientX || (e.touches && e.touches[0].clientX),
                        moveX = clientX - rect.left,
                        percent = Math.max(0, Math.min(1, moveX / rect.width)),
                        range = this.timeRange,
                        newTime = range.min + (range.max - range.min) * percent;

                    this.timeEngine.jumpToTime(newTime);
                },
                handleEnd = () => {
                    this.isDragging = false;
                    document.removeEventListener("mousemove", handleMove);
                    document.removeEventListener("mouseup", handleEnd);
                    document.removeEventListener("touchmove", handleMove);
                    document.removeEventListener("touchend", handleEnd);
                };

            document.addEventListener("mousemove", handleMove);
            document.addEventListener("mouseup", handleEnd);
            document.addEventListener("touchmove", handleMove);
            document.addEventListener("touchend", handleEnd);
        },

        /**
         * Toggle play/pause
         */
        togglePlay () {
            if (this.isPlaying) {
                this.timeEngine.pause();
            }
            else {
                this.timeEngine.play();
            }
        },

        /**
         * Skip to start
         */
        skipToStart () {
            this.timeEngine.jumpToTime(this.timeRange.min);
        },

        /**
         * Skip backward
         */
        skipBackward () {
            this.timeEngine.skipBackward();
        },

        /**
         * Skip forward
         */
        skipForward () {
            this.timeEngine.skipForward();
        },

        /**
         * Skip to end
         */
        skipToEnd () {
            this.timeEngine.jumpToTime(this.timeRange.max);
        },

        /**
         * Update speed
         */
        updateSpeed () {
            this.timeEngine.setSpeed(this.playbackSpeed);
        },

        /**
         * Update loop
         */
        updateLoop () {
            this.timeEngine.setLoop(this.loopEnabled);
        }
    }
};
</script>

<style lang="scss" scoped>
.advanced-time-slider {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    background: #ffffff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.timestamp-display {
    text-align: center;
    font-size: 1.5rem;
    font-weight: 600;
    color: #2c3e50;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.05em;
}

.slider-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.slider-track {
    position: relative;
    height: 8px;
    background: #e9ecef;
    border-radius: 4px;
    cursor: pointer;
    margin: 1rem 0;
}

.slider-progress {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: linear-gradient(90deg, #0066cc, #0099ff);
    border-radius: 4px;
    transition: width 0.05s linear;
}

.timestep-marker {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 2px;
    height: 12px;
    background: #adb5bd;
    border-radius: 1px;
}

.slider-handle {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 20px;
    height: 20px;
    background: #ffffff;
    border: 3px solid #0066cc;
    border-radius: 50%;
    cursor: grab;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: transform 0.1s;

    &:hover {
        transform: translate(-50%, -50%) scale(1.2);
    }

    &:active {
        cursor: grabbing;
    }
}

.handle-tooltip {
    position: absolute;
    top: -35px;
    left: 50%;
    transform: translateX(-50%);
    background: #2c3e50;
    color: #ffffff;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.75rem;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s;
}

.slider-handle:hover .handle-tooltip {
    opacity: 1;
}

.time-axis {
    display: flex;
    justify-content: space-between;
    font-size: 0.875rem;
    color: #6c757d;
}

.playback-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    justify-content: center;
    flex-wrap: wrap;
}

.control-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 1.25rem;

    &:hover:not(:disabled) {
        background: #e9ecef;
        border-color: #adb5bd;
    }

    &:active:not(:disabled) {
        transform: scale(0.95);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    &.control-btn-primary {
        width: 50px;
        height: 50px;
        background: #0066cc;
        color: #ffffff;
        border-color: #0066cc;

        &:hover:not(:disabled) {
            background: #0052a3;
            border-color: #0052a3;
        }
    }
}

.speed-control {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-left: 1rem;

    label {
        font-size: 0.875rem;
        color: #6c757d;
        margin: 0;
    }

    select {
        width: auto;
        min-width: 80px;
    }
}

.loop-toggle {
    margin-left: 1rem;

    .form-check {
        margin: 0;
    }

    .form-check-label {
        font-size: 0.875rem;
        color: #6c757d;
    }
}
</style>
