import {generateSimpleGetters} from "../../../../src/app-store/utils/generators";
import state from "./stateTrafficCount";

const getters = {
    ...generateSimpleGetters(state)
};

export default getters;
