import {generateSimpleGetters} from "../../../../src/utils/generators";
import state from "./stateTrafficCount";

const getters = {
    ...generateSimpleGetters(state)
};

export default getters;
