<script>
export default {
    name: "PvObligationSimpleTable",
    props: {
        /**
         * Array of {label, value} objects to display in the table
         */
        rows: {
            type: Array,
            required: true
        }
    }
};
</script>

<template lang="html">
    <table id="PvObligationSimpleTable">
        <tbody>
            <tr
                v-for="(row, index) in rows"
                :key="`simpleTableRow-${index}`"
            >
                <td class="cellLabel">
                    {{ row.label }}
                </td>

                <td class="cellValue">
                    {{ row.value }}
                </td>
            </tr>
        </tbody>
    </table>
</template>

<style lang="scss" scoped>
    table#PvObligationSimpleTable {
        font-size: 1.125rem;
        border: solid 0.0625rem $light_grey;
        width: 100%;
        margin: 1.5rem 0;

        td {
            border: solid 0.0625rem $light_grey;
            padding: 1rem;
        }

        td.cellLabel {
            padding-right: 1rem;
        }

        td.cellValue {
            text-align: right;
            font-weight: bold;
            white-space: nowrap;
        }
    }
</style>
