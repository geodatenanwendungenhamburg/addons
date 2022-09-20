<script>
import beautifyKey from "../../../../src/utils/beautifyKey";

export default {
    name: "AddressTheme",
    props: {
        feature: {
            type: Object,
            required: true
        }
    },
    data: () => {
        return {
        };
    },
    computed: {
        attributes: function () {
            return this.feature.getMappedProperties();
        }
    },
    methods: {
        beautifyKey
    }
};
</script>

<template>
    <div id="gif-theme-address">
        <table
            class="table table-hover"
        >
            <tbody>
                <tr
                    v-for="(value, key) in attributes"
                    :key="key"
                >
                    <td>
                        {{ beautifyKey(key) }}
                    </td>
                    <td>
                        {{ value }}
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>


<style lang="scss" scoped>
@import "~variables";

.table > tbody > tr > td {
    padding: 5px 8px;
    font-size: 12px;
    &.bold{
        font-family: $font_family_accent;
    }
}

.table {
    margin-bottom: 0;
}
</style>
