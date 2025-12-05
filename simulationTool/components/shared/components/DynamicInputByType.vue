<script>
import InputText from "../../../../../src/shared/modules/inputs/components/InputText.vue";
import SliderItem from "../../../../../src/shared/modules/slider/components/SliderItem.vue";
import SwitchInput from "../../../../../src/shared/modules/checkboxes/components/SwitchInput.vue";
import DatetimeInput from "./DatetimeInput.vue";
import GeometryInput from "./GeometryInput.vue";
import CycleTravelerLayerInput from "./CycleTravelerLayerInput.vue";

export default {
    name: "DynamicInputByType",
    components: {
        InputText,
        SliderItem,
        SwitchInput,
        DatetimeInput,
        GeometryInput,
        CycleTravelerLayerInput
    },
    props: {
        aria: {
            type: String,
            default: ""
        },
        checked: {
            type: Boolean,
            default: false
        },
        id: {
            type: String,
            required: true
        },
        inputType: {
            type: String,
            default: "string"
        },
        label: {
            type: String,
            required: true
        },
        max: {
            type: [Number, String],
            default: 100
        },
        min: {
            type: [Number, String],
            default: 0
        },
        placeholder: {
            type: String,
            default: ""
        },
        step: {
            type: Number,
            default: 1
        },
        value: {
            type: [String, Number, Boolean, Object],
            default: undefined,
            required: false
        },
        geometryType: {
            type: String,
            default: "Polygon"
        },
        fillColor: {
            type: String,
            default: "rgba(0, 123, 255, 0.3)"
        },
        strokeColor: {
            type: String,
            default: "rgba(0, 123, 255, 0.8)"
        },
        nestedProperties: {
            type: Object,
            default: null
        }
    },
    emits: ["update:value", "update:checked"],
    computed: {
        enumValues () {
            if (this.inputType !== "enum") {
                return [];
            }
            if (this.value && typeof this.value === "object" && Array.isArray(this.value.enum)) {
                return this.value.enum;
            }
            if (Array.isArray(this.value)) {
                return this.value;
            }
            return [];
        },
        selectedEnumValue () {
            if (this.inputType !== "enum") {
                return this.value;
            }
            if (this.value && typeof this.value === "object" && Object.prototype.hasOwnProperty.call(this.value, "value")) {
                return this.value.value;
            }
            if (Array.isArray(this.value)) {
                return this.value[0];
            }
            return this.value;
        }
    },
    methods: {
        /**
         * Updates the geometry part of a GeoJSON Feature.
         * @param {Object} geometry - The new geometry object.
         * @returns {void}
         */
        updateFeatureGeometry (geometry) {
            const feature = {
                type: "Feature",
                geometry: geometry,
                properties: this.value?.properties || {}
            };

            this.$emit("update:value", feature);
        }
    }
};
</script>

<template>
    <div>
        <template v-if="inputType === 'string'">
            <InputText
                :id="id"
                class="form-control mb-3"
                :label="label"
                :placeholder="placeholder"
                :model-value="value"
                @update:modelValue="$emit('update:value', $event)"
            />
        </template>
        <template v-else-if="inputType === 'enum'">
            <label :for="id">
                {{ label }}
            </label>
            <select
                :id="id"
                class="form-select m-2"
                :aria-label="label"
                :value="selectedEnumValue"
                @change="$emit('update:value', $event.target.value)"
            >
                <option
                    v-for="(val, index) in enumValues"
                    :key="index"
                    :value="val"
                >
                    {{ val }}
                </option>
            </select>
        </template>
        <template v-else-if="inputType === 'boolean'">
            <div class="form-switch">
                <SwitchInput
                    :id="id"
                    :label="label"
                    :aria="aria"
                    :checked="checked"
                    :interaction="(event) => $emit('update:checked', event.target.checked)"
                />
            </div>
        </template>
        <template v-else-if="inputType === 'number' || inputType === 'integer'">
            <label :for="id">
                {{ label }}
            </label>
            <div class="d-flex justify-content-between value">
                <span>{{ min }}</span>
                <span><b>{{ value }}</b></span>
                <span>{{ max }}</span>
            </div>
            <SliderItem
                :id="id"
                :aria="aria"
                :class-array="['mb-3']"
                :min="min"
                :max="max"
                :step="step"
                :value="value"
                :interaction="($event) => $emit('update:value', Number($event.target.value))"
            />
        </template>
        <template v-else-if="inputType === 'datetime'">
            <DatetimeInput
                :id="id"
                :label="label"
                :value="value"
                :min="min"
                :max="max"
                @update:value="$emit('update:value', $event)"
            />
        </template>
        <template v-else-if="inputType === 'geometry'">
            <GeometryInput
                :id="id"
                :label="label"
                :value="value"
                :geometry-type="geometryType"
                :fill-color="fillColor"
                :stroke-color="strokeColor"
                @update:value="$emit('update:value', $event)"
            />
        </template>
        <template v-else-if="inputType === 'geojson-geometry'">
            <GeometryInput
                :id="id"
                :label="label"
                :value="value"
                :geometry-type="geometryType"
                :fill-color="fillColor"
                :stroke-color="strokeColor"
                @update:value="$emit('update:value', $event)"
            />
        </template>
        <template v-else-if="inputType === 'geojson-feature'">
            <div class="geojson-feature-input">
                <GeometryInput
                    :id="id + '_geometry'"
                    :label="label"
                    :value="value?.geometry"
                    :geometry-type="geometryType"
                    :fill-color="fillColor"
                    :stroke-color="strokeColor"
                    @update:value="updateFeatureGeometry($event)"
                />
                <slot name="properties" />
            </div>
        </template>
        <template v-else-if="inputType === 'cycleTravelerLayer'">
            <CycleTravelerLayerInput
                :id="id"
                :label="label"
                :value="value"
                @update:value="$emit('update:value', $event)"
            />
        </template>
    </div>
</template>
