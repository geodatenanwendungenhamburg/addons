import {generateSimpleGetters} from "@shared/js/utils/generators.js";
import stateLandRegistryFile from "./stateLandRegistryFile.js";
import {getAlphanumericalSortedItems} from "../utils/sortFeatures.js";

const getters = {
    ...generateSimpleGetters(stateLandRegistryFile),
    /**
     * Returns the sorted features from the state's landRegistryFileFeatures based on the sorting configuration.
     * @param {Object} state - The Vuex state object.
     * @returns {function(): Array} - A function that returns the sorted features array, or an empty array if features are not available.
     */
    getSortedFeatures: state => {
        const {landRegistryFileFeatures: features, sorting, mapClickedFeatureIds} = state;

        if (!Array.isArray(features)) {
            return [];
        }

        // Apply sorting
        let sortedFeatures = features;

        if (sorting?.columnName && sorting.order !== "origin") {
            const sorted = getAlphanumericalSortedItems(features, sorting.columnName);

            sortedFeatures = sorting.order === "asc" ? sorted : sorted.reverse();
        }

        // Only reorder if selection came from map, not from table button
        if (mapClickedFeatureIds?.length) {
            const selectedFeatures = sortedFeatures.filter(f => mapClickedFeatureIds.includes(f.id));
            const nonSelectedFeatures = sortedFeatures.filter(f => !mapClickedFeatureIds.includes(f.id));

            return [...selectedFeatures, ...nonSelectedFeatures];
        }

        return sortedFeatures;
    }
};

export default getters;
