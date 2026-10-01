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
        const {landRegistryFileFeatures: features, sorting} = state;

        if (!Array.isArray(features)) {
            return [];
        }
        if (!sorting?.columnName || sorting.order === "origin") {
            return features;
        }

        const sorted = getAlphanumericalSortedItems(features, sorting.columnName);

        return sorting.order === "asc" ? sorted : sorted.reverse();
    }
};

export default getters;
