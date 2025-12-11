<template>
    <div class="time-series-chart">
        <div class="chart-header">
            <h4>{{ title }}</h4>
            <div class="chart-legend">
                <div class="legend-item">
                    <span
                        class="legend-color"
                        style="background: #0066cc;"
                    />
                    <span>Gesamt</span>
                </div>
                <div class="legend-item">
                    <span
                        class="legend-color"
                        style="background: #4287f5;"
                    />
                    <span>Zu Fuß</span>
                </div>
                <div class="legend-item">
                    <span
                        class="legend-color"
                        style="background: #28a745;"
                    />
                    <span>Leihrad</span>
                </div>
            </div>
        </div>
        <div
            ref="chartContainer"
            class="chart-container"
            @click="handleChartClick"
        >
            <svg
                ref="chartSvg"
                :width="chartWidth"
                :height="chartHeight"
                class="chart-svg"
            >
                <!-- Grid lines -->
                <g class="grid">
                    <line
                        v-for="(line, index) in gridLines"
                        :key="'grid-' + index"
                        :x1="line.x1"
                        :y1="line.y1"
                        :x2="line.x2"
                        :y2="line.y2"
                        class="grid-line"
                    />
                </g>

                <!-- Y-axis labels -->
                <g class="y-axis-labels">
                    <text
                        v-for="(label, index) in yAxisLabels"
                        :key="'y-label-' + index"
                        :x="padding.left - 10"
                        :y="label.y"
                        text-anchor="end"
                        dominant-baseline="middle"
                        class="axis-label"
                    >
                        {{ label.text }}
                    </text>
                </g>

                <!-- X-axis labels -->
                <g class="x-axis-labels">
                    <text
                        v-for="(label, index) in xAxisLabels"
                        :key="'x-label-' + index"
                        :x="label.x"
                        :y="chartHeight - padding.bottom + 20"
                        text-anchor="middle"
                        class="axis-label"
                    >
                        {{ label.text }}
                    </text>
                </g>

                <!-- Data lines -->
                <path
                    v-if="totalLinePath"
                    :d="totalLinePath"
                    class="data-line line-total"
                />
                <path
                    v-if="walkingLinePath"
                    :d="walkingLinePath"
                    class="data-line line-walking"
                />
                <path
                    v-if="rentalBikeLinePath"
                    :d="rentalBikeLinePath"
                    class="data-line line-rental-bike"
                />

                <!-- Current time indicator -->
                <line
                    v-if="currentTimeX !== null"
                    :x1="currentTimeX"
                    :y1="padding.top"
                    :x2="currentTimeX"
                    :y2="chartHeight - padding.bottom"
                    class="current-time-line"
                />

                <!-- Data points -->
                <g class="data-points">
                    <circle
                        v-for="(point, index) in dataPoints"
                        :key="'point-' + index"
                        :cx="point.x"
                        :cy="point.y"
                        :r="3"
                        :class="'point-' + point.type"
                        @mouseenter="showTooltip(point, $event)"
                        @mouseleave="hideTooltip"
                    />
                </g>
            </svg>

            <!-- Tooltip -->
            <div
                v-if="tooltip.visible"
                class="chart-tooltip"
                :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
            >
                <div class="tooltip-time">
                    {{ tooltip.time }}
                </div>
                <div class="tooltip-value">
                    {{ tooltip.label }}: {{ tooltip.value }}
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import {mapState, mapGetters} from "vuex";

export default {
    name: "TimeSeriesChart",
    props: {
        title: {
            type: String,
            default: "Agenten über Zeit"
        },
        timeEngine: {
            type: Object,
            required: true
        }
    },
    data () {
        return {
            chartWidth: 600,
            chartHeight: 250,
            padding: {
                top: 20,
                right: 20,
                bottom: 40,
                left: 50
            },
            tooltip: {
                visible: false,
                x: 0,
                y: 0,
                time: "",
                label: "",
                value: 0
            }
        };
    },
    computed: {
        ...mapState("agentVisualization", [
            "currentTime",
            "timeSeriesMetrics"
        ]),
        ...mapGetters("agentVisualization", [
            "timeRange"
        ]),

        /**
         * Get chart dimensions
         */
        chartArea () {
            return {
                width: this.chartWidth - this.padding.left - this.padding.right,
                height: this.chartHeight - this.padding.top - this.padding.bottom
            };
        },

        /**
         * Get max value for Y scale
         */
        maxValue () {
            if (!this.timeSeriesMetrics || this.timeSeriesMetrics.length === 0) {
                return 10;
            }

            const max = Math.max(...this.timeSeriesMetrics.map(m => m.totalCount));

            return Math.ceil(max * 1.1);
        },

        /**
         * Convert time to X coordinate
         */
        timeToX () {
            return (time) => {
                const range = this.timeRange;

                if (range.max === range.min) {
                    return this.padding.left;
                }

                const ratio = (time - range.min) / (range.max - range.min);

                return this.padding.left + ratio * this.chartArea.width;
            };
        },

        /**
         * Convert value to Y coordinate
         */
        valueToY () {
            return (value) => {
                const ratio = value / this.maxValue;

                return this.chartHeight - this.padding.bottom - ratio * this.chartArea.height;
            };
        },

        /**
         * Generate grid lines
         */
        gridLines () {
            const lines = [],
                numLines = 5;

            for (let i = 0; i <= numLines; i++) {
                const y = this.padding.top + (i / numLines) * this.chartArea.height;

                lines.push({
                    x1: this.padding.left,
                    y1: y,
                    x2: this.chartWidth - this.padding.right,
                    y2: y
                });
            }

            return lines;
        },

        /**
         * Generate Y-axis labels
         */
        yAxisLabels () {
            const labels = [],
                numLabels = 5;

            for (let i = 0; i <= numLabels; i++) {
                const value = Math.round((1 - i / numLabels) * this.maxValue),
                    y = this.padding.top + (i / numLabels) * this.chartArea.height;

                labels.push({
                    text: value,
                    y: y
                });
            }

            return labels;
        },

        /**
         * Generate X-axis labels
         */
        xAxisLabels () {
            if (!this.timeSeriesMetrics || this.timeSeriesMetrics.length === 0) {
                return [];
            }

            const labels = [],
                numLabels = Math.min(5, this.timeSeriesMetrics.length),
                step = Math.floor(this.timeSeriesMetrics.length / numLabels);

            for (let i = 0; i < numLabels; i++) {
                const index = i * step,
                    metric = this.timeSeriesMetrics[Math.min(index, this.timeSeriesMetrics.length - 1)],
                    time = new Date(metric.time),
                    x = this.timeToX(metric.time);

                labels.push({
                    text: time.toLocaleTimeString("de-DE", {
                        hour: "2-digit",
                        minute: "2-digit"
                    }),
                    x: x
                });
            }

            return labels;
        },

        /**
         * Generate total line path
         */
        totalLinePath () {
            return this.generateLinePath(m => m.totalCount);
        },

        /**
         * Generate walking line path
         */
        walkingLinePath () {
            return this.generateLinePath(m => m.walkingCount);
        },

        /**
         * Generate rental bike line path
         */
        rentalBikeLinePath () {
            return this.generateLinePath(m => m.rentalBikeCount);
        },

        /**
         * Get current time X position
         */
        currentTimeX () {
            if (!this.currentTime || !this.timeRange) {
                return null;
            }

            return this.timeToX(this.currentTime);
        },

        /**
         * Generate data points for hover
         */
        dataPoints () {
            if (!this.timeSeriesMetrics) {
                return [];
            }

            const points = [];

            this.timeSeriesMetrics.forEach(metric => {
                const x = this.timeToX(metric.time);

                points.push({
                    x: x,
                    y: this.valueToY(metric.totalCount),
                    type: "total",
                    time: metric.time,
                    value: metric.totalCount,
                    label: "Gesamt"
                });

                points.push({
                    x: x,
                    y: this.valueToY(metric.walkingCount),
                    type: "walking",
                    time: metric.time,
                    value: metric.walkingCount,
                    label: "Zu Fuß"
                });

                points.push({
                    x: x,
                    y: this.valueToY(metric.rentalBikeCount),
                    type: "rental-bike",
                    time: metric.time,
                    value: metric.rentalBikeCount,
                    label: "Leihrad"
                });
            });

            return points;
        }
    },
    mounted () {
        this.updateDimensions();
        window.addEventListener("resize", this.updateDimensions);
    },
    beforeUnmount () {
        window.removeEventListener("resize", this.updateDimensions);
    },
    methods: {
        /**
         * Update chart dimensions
         */
        updateDimensions () {
            if (this.$refs.chartContainer) {
                this.chartWidth = this.$refs.chartContainer.clientWidth;
            }
        },

        /**
         * Generate SVG path for line
         */
        generateLinePath (valueGetter) {
            if (!this.timeSeriesMetrics || this.timeSeriesMetrics.length === 0) {
                return "";
            }

            const points = this.timeSeriesMetrics.map(metric => {
                return {
                    x: this.timeToX(metric.time),
                    y: this.valueToY(valueGetter(metric))
                };
            });

            let path = `M ${points[0].x} ${points[0].y}`;

            for (let i = 1; i < points.length; i++) {
                path += ` L ${points[i].x} ${points[i].y}`;
            }

            return path;
        },

        /**
         * Handle chart click
         */
        handleChartClick (event) {
            const rect = this.$refs.chartSvg.getBoundingClientRect(),
                x = event.clientX - rect.left,

                // Convert X to time
                ratio = (x - this.padding.left) / this.chartArea.width,
                range = this.timeRange,
                clickedTime = range.min + ratio * (range.max - range.min);

            this.timeEngine.jumpToTime(clickedTime);
        },

        /**
         * Show tooltip
         */
        showTooltip (point, event) {
            const rect = this.$refs.chartContainer.getBoundingClientRect(),
                time = new Date(point.time);

            this.tooltip = {
                visible: true,
                x: event.clientX - rect.left + 10,
                y: event.clientY - rect.top - 10,
                time: isNaN(time.getTime()) ? "00:00:00" : time.toLocaleTimeString("de-DE"),
                label: point.label,
                value: point.value
            };
        },

        /**
         * Hide tooltip
         */
        hideTooltip () {
            this.tooltip.visible = false;
        }
    }
};
</script>

<style lang="scss" scoped>
.time-series-chart {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    background: #ffffff;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;

    h4 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: #2c3e50;
    }
}

.chart-legend {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

.legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #6c757d;
}

.legend-color {
    width: 12px;
    height: 12px;
    border-radius: 2px;
}

.chart-container {
    position: relative;
    height: 250px;
    width: 100%;
}

.chart-svg {
    display: block;
}

.grid-line {
    stroke: #e9ecef;
    stroke-width: 1;
}

.axis-label {
    font-size: 0.75rem;
    fill: #6c757d;
}

.data-line {
    fill: none;
    stroke-width: 2;
}

.line-total {
    stroke: #0066cc;
}

.line-walking {
    stroke: #4287f5;
}

.line-rental-bike {
    stroke: #28a745;
}

.current-time-line {
    stroke: #dc3545;
    stroke-width: 2;
    stroke-dasharray: 4;
}

.data-points {
    circle {
        cursor: pointer;
        transition: r 0.2s;

        &:hover {
            r: 5;
        }
    }

    .point-total {
        fill: #0066cc;
    }

    .point-walking {
        fill: #4287f5;
    }

    .point-rental-bike {
        fill: #28a745;
    }
}

.chart-tooltip {
    position: absolute;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    pointer-events: none;
    white-space: nowrap;
    z-index: 1000;

    .tooltip-time {
        font-weight: 600;
        margin-bottom: 0.25rem;
    }

    .tooltip-value {
        color: #e9ecef;
    }
}
</style>
