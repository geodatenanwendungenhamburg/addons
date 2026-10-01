import {generateSimpleMutations} from "@shared/js/utils/generators.js";
import stateLandRegistryFile from "./stateLandRegistryFile.js";

const mutations = {
    /**
     * Creates from every state-key a setter.
     * For example, given a state object {key: value}, an object
     * {setKey:   (state, payload) => *   state[key] = payload * }
     * will be returned.
     */
    ...generateSimpleMutations(stateLandRegistryFile),
    /**
     * Sets the land registry file features in the state and sets the selectedDetailFeatureId to null if necessary.
     * @param {Object} state - The current state object.
     * @param {Array} features - The array of land registry file features to be set in the state.
     */
    setLandRegistryFileFeatures (state, features) {
        state.landRegistryFileFeatures = features;

        if (!features.some(feature => feature.id === state.selectedDetailFeatureId)) {
            state.selectedDetailFeatureId = null;
        }
    }
};

export default mutations;
