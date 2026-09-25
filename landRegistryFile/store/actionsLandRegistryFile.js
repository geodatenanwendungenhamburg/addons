import getOAFFeature from "@shared/js/api/oaf/getOAFFeature.js";

export default {
    /**
         * Queries the OAF feature service with the provided parameters.
         * @param {Object} context - The Vuex context object.
         * @param {Function} context.commit Vuex commit function.
         * @param {Object} context.state Vuex module state.
         * @param {Function} context.dispatch Vuex dispatch function.
         * @param {Object} payload - The payload containing the query parameters.
         * @param {Object} payload.params - The values for filtering the OAF query.
         * @param {string|null} [payload.params.startDate] - The start date for filtering in YYYY-MM-DD format.
         * @param {string|null} [payload.params.endDate] - The end date for filtering in YYYY-MM-DD format.
         * @param {string|null} [payload.params.textValue] - The text value for text search filtering.
         * @param {Array<string>|null} [payload.params.selectedOptions] - The selected options for select filtering.
         * @param {Array} [payload.params.bbox] - The bounding box for spatial filtering.
         * @param {string} [payload.params.crs] - The coordinate reference system.
         * @returns {Promise<boolean>} A promise that resolves to true if the query was successful, or false if an error occurred.
         */
    async queryOaf ({commit, state, dispatch}, {params}) {
        const oafParams = state.oafParams,
            filters = oafParams.filters;
        const filterStrings = [];

        if (params.startDate && params.endDate) {
            const dateField = filters.dateRangeField;

            filterStrings.push(`(${dateField} >= DATE('${params.startDate}') AND ${dateField} <= DATE('${params.endDate}'))`);
        }

        if (params.textValue) {
            const textFilter = filters.textSearchFields
                .map(field => `CASEI(${field}) LIKE CASEI('%${params.textValue}%')`)
                .join(" OR ");

            filterStrings.push(`(${textFilter})`);
        }

        if (params.selectedOptions) {
            const select = filters.select;
            const selectedOptionsStrings = [];

            params.selectedOptions.forEach(selectedOption => {
                if (!select.options.includes(selectedOption)) {
                    return;
                }

                selectedOptionsStrings.push(`${select.field} = '${selectedOption}'`);
            });

            filterStrings.push(`(${selectedOptionsStrings.join(" OR ")})`);
        }

        const completeFilterString = filterStrings.join(" AND ");

        const queryParams = {
            limit: 10000,
            filter: completeFilterString !== "" ? completeFilterString : undefined,
            bbox: params.bbox,
            bboxCrs: params.crs,
            filterCrs: params.crs
        };

        try {
            const landRegistryFileFeatures = await getOAFFeature.getOAFFeatureGet(
                oafParams.url,
                oafParams.collection,
                queryParams
            );

            commit("setLandRegistryFileFeatures", landRegistryFileFeatures);

            return true;
        }
        catch (error) {
            dispatch("Alerting/addSingleAlert", {
                category: "error",
                content: "Fehler beim Abrufen der Grundstücksakten. Bitte versuchen Sie es erneut."
            }, {root: true});

            return false;
        }
    }
};
