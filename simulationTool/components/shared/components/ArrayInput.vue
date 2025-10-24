<template>
    <div class="array-input">
        <label :for="id">{{ label }}</label>
        <input
            :id="id"
            v-model="rawValues"
            type="text"
            @blur="onBlur"
            @change="isChanged = true"
        >
    </div>
</template>

<script>
export default {
    name: "ArrayInput",
    props: {
        id: {type: String, required: true},
        label: {type: String, required: true},
        arrayObject: {type: Object, required: true}
    },
    emits: ["update:arrayValue"],
    data () {
        return {
            isChanged: false,
            rawValues: "",
            valueType: "string"
        };
    },
    watch: {
        arrayObject: {
            handler (newVal) {
                this.isChanged = false;
                // set values
                if (newVal && newVal.items && Array.isArray(newVal.items)) {
                    this.rawValues = newVal.items.join(", ");
                }
                else {
                    this.rawValues = "";
                }

                // set type
                if (newVal?.type) {
                    if (newVal.type !== "string" && newVal.type !== "number" && newVal.type !== "boolean") {
                        console.warn(`[ArrayInput] Unsupported type for ${this.id}: ${newVal.type}. Defaulting to string.`);
                    }
                    this.valueType = newVal.type;
                }
                else {
                    this.valueType = "string";
                }

            },
            immediate: true,
            deep: true
        }
    },
    methods: {
        parseValues (raw) {
            const parts = raw.split(",").map(s => s.trim()).filter(s => s.length > 0);

            console.log("Parsing values for", {raw, parts, valueType: this.valueType});
            switch (this.valueType) {
                case "number":
                    return parts.map(p => {
                        const n = Number(p);

                        if (isNaN(n)) {
                            console.warn(`[ArrayInput] Unable to parse value "${p}" as number for ${this.id}. Using NaN.`);
                        }
                        return n;
                    });
                case "boolean":
                    return parts.map(p => {
                        const lower = p.toLowerCase();

                        if (lower === "true" || lower === "1") {
                            return true;
                        }
                        if (lower === "false" || lower === "0") {
                            return false;
                        }
                        console.warn(`[ArrayInput] Unable to parse value "${p}" as boolean for ${this.id}. Using false.`);
                        return false;
                    });
                case "string":
                default:
                    return parts;
            }
        },
        onBlur () {
            if (!this.isChanged) {
                return;
            }
            this.$emit("update:arrayValue", this.parseValues(this.rawValues));
            this.isChanged = false;
        }
    }
};
</script>

<style scoped>
.array-input label {
    display: block;
}
</style>
