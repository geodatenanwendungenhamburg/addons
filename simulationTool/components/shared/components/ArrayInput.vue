<template>
    <div class="array-input">
        <label :for="id">{{ label }}</label>
        <input
            :id="id"
            :value="inputValue"
            type="text"
            @input="onInput"
            @focus="onFocus"
            @blur="onBlur"
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
            inputValue: "",
            valueType: "string",
            isFocused: false,
            initializedValue: ""
        };
    },
    watch: {
        arrayObject: {
            handler (newVal) {
                // set type
                if (newVal?.type) {
                    this.valueType = newVal.type;
                }
                else {
                    this.valueType = "string";
                }
                if (!this.isFocused) {
                    let newItems = [];

                    if (Array.isArray(newVal)) {
                        newItems = newVal;
                    }
                    else if (newVal && newVal.items && Array.isArray(newVal.items)) {
                        newItems = newVal.items;
                    }

                    const newDisplayValue = newItems.length > 0 ? newItems.join(", ") : "";

                    if (this.initializedValue !== newDisplayValue) {
                        this.inputValue = newDisplayValue;
                        this.initializedValue = newDisplayValue;
                    }
                }
            },
            immediate: true,
            deep: true
        }
    },
    methods: {
        parseValues (raw) {
            const parts = raw.split(",").map(s => s.trim()).filter(s => s.length > 0);

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
        onInput (event) {
            this.inputValue = event.target.value;
        },
        onFocus () {
            this.isFocused = true;
        },
        onBlur () {
            const currentDisplayValue = this.inputValue;

            if (currentDisplayValue !== this.initializedValue) {
                const parsedValues = this.parseValues(currentDisplayValue);

                this.initializedValue = currentDisplayValue;
                this.$emit("update:arrayValue", parsedValues);
            }
            this.$nextTick(() => {
                this.isFocused = false;
            });
        }
    }
};
</script>

<style scoped>
.array-input label {
    display: block;
}
</style>
