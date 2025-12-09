<template>
    <div class="enum-input">
        <label :for="id">
            {{ label }}
        </label>
        <select
            :id="id"
            class="form-select m-2"
            :value="selectedIndex"
            @change="onChange"
        >
            <option
                v-for="(option, index) in options"
                :key="index"
                :value="index"
            >
                {{ option }}
            </option>
        </select>
    </div>
</template>

<script>
export default {
    name: "EnumInput",
    props: {
        id: {type: String, required: true},
        label: {type: String, required: true},
        enumObject: {type: Object, required: true}
    },
    emits: ["update:enumValue"],
    data () {
        return {
            options: [],
            selectedIndex: 0
        };
    },
    watch: {
        enumObject: {
            handler (newVal) {
                if (!newVal || typeof newVal !== "object" && !Array.isArray(newVal)) {
                    console.warn(`[EnumInput] enumObject for ${this.id} is not a valid object or array: `, newVal);
                    this.options = [];
                    return;
                }

                switch (typeof newVal) {
                    case "object":
                        if (newVal.enum && Array.isArray(newVal.enum)) {
                            this.options = newVal.enum;
                        }
                        if (newVal.value) {
                            this.selectedIndex = this.options.indexOf(newVal.value);
                        }
                        else {
                            this.selectedIndex = 0;
                        }
                        break;
                    case "array":
                        this.options = newVal;
                        this.selectedIndex = 0;
                        break;
                    default:
                        console.warn(`[EnumInput] enumObject for ${this.id} is not a valid array or object: `, newVal);
                        this.options = [];
                        this.selectedIndex = 0;
                }
            },
            immediate: true
        }
    },
    methods: {
        onChange (event) {
            this.selectedIndex = parseInt(event.target.value, 10);
            this.$emit("update:enumValue", this.options[this.selectedIndex]);
        }
    }
};
</script>

<style scoped>
.enum-input label {
    display: block;
}
</style>
