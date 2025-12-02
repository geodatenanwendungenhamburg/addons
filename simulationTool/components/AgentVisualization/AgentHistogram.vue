<script>
export default {
    name: "AgentHistogram",
    props: {
        timeSteps: {
            type: Array,
            required: true
        },
        histogram: {
            type: Object,
            required: true
        },
        currentStep: {
            type: Number,
            default: 0
        }
    },
    emits: ["stepClick"],
    computed: {
        /**
         * Get maximum count for scaling
         * @returns {Number} Maximum count
         */
        maxCount () {
            return Math.max(...Object.values(this.histogram), 1);
        },

        /**
         * Get bar heights as percentages
         * @returns {Array} Array of percentage heights
         */
        barHeights () {
            return this.timeSteps.map(time => {
                const count = this.histogram[time] || 0;

                return (count / this.maxCount) * 100;
            });
        }
    },
    methods: {
        /**
         * Handle bar click
         * @param {Number} index - Index of clicked bar
         * @returns {void}
         */
        onBarClick (index) {
            this.$emit("stepClick", index);
        },

        /**
         * Get tooltip for bar
         * @param {Number} index - Index of bar
         * @returns {String} Tooltip text
         */
        getTooltip (index) {
            const time = this.timeSteps[index],
                count = this.histogram[time] || 0;

            return `${time}\n${count} agents`;
        }
    }
};
</script>

<template>
    <div class="agent-histogram">
        <h6 class="histogram-title">
            {{ $t('additional:modules.tools.simulationTool.agentDistribution') }}
        </h6>
        <div class="histogram-container">
            <div class="histogram-bars">
                <button
                    v-for="(height, index) in barHeights"
                    :key="index"
                    type="button"
                    class="histogram-bar"
                    :class="{ active: index === currentStep }"
                    :style="{ height: `${height}%` }"
                    :title="getTooltip(index)"
                    @click="onBarClick(index)"
                />
            </div>
            <div class="histogram-axis">
                <span class="axis-label">0</span>
                <span class="axis-label">{{ maxCount }}</span>
            </div>
        </div>
        <div class="histogram-legend">
            <div class="legend-item">
                <div class="legend-color active" />
                <span>Current</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" />
                <span>Other</span>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.agent-histogram {
    background-color: #2d2d2d;
    padding: 1rem;
    border-radius: 0.5rem;
    color: #ffffff;
}

.histogram-title {
    margin-bottom: 0.75rem;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #adb5bd;
}

.histogram-container {
    display: flex;
    gap: 0.5rem;
}

.histogram-bars {
    display: flex;
    align-items: flex-end;
    flex: 1;
    height: 120px;
    gap: 1px;
    background-color: #1a1a1a;
    border: 1px solid #495057;
    border-radius: 0.25rem;
    padding: 0.25rem;
}

.histogram-bar {
    flex: 1;
    background-color: #0d6efd;
    opacity: 0.4;
    transition: all 0.2s ease;
    min-height: 2px;
    cursor: pointer;
    border: none;
    padding: 0;

    &.active {
        background-color: #ffc107;
        opacity: 1;
    }

    &:hover {
        opacity: 0.7;
    }
}

.histogram-axis {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    font-size: 0.625rem;
    color: #6c757d;
    padding: 0.25rem 0;

    .axis-label {
        text-align: right;
        min-width: 30px;
    }
}

.histogram-legend {
    display: flex;
    gap: 1rem;
    margin-top: 0.75rem;
    font-size: 0.75rem;
}

.legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.legend-color {
    width: 20px;
    height: 12px;
    background-color: #0d6efd;
    opacity: 0.4;
    border-radius: 2px;

    &.active {
        background-color: #ffc107;
        opacity: 1;
    }
}
</style>
