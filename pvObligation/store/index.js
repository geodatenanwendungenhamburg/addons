import getters from "./gettersPvObligation";
import state from "./statePvObligation";
import actions from "./actionsPvObligation";
import mutations from "./mutationsPvObligation";

export default {
    namespaced: true,
    state: {...state},
    getters,
    actions,
    mutations
};

