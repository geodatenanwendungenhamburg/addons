import {generateSimpleGetters} from "../../../../src/app-store/utils/generators";
import districtFinderState from "./stateDistrictFinder";

const getters = {
    ...generateSimpleGetters(districtFinderState)
};


export default getters;
