import {config, shallowMount, createLocalVue, createWrapper} from "@vue/test-utils";
import {expect} from "chai";
import Vuex from "vuex";
import DistrictFinder from "../../../components/DistrictFinder.vue";

config.mocks.$t = key => key;

const localVue = createLocalVue();

localVue.use(Vuex);

describe("addons/cosi/DistrictFinder/components/DistrictFinder.vue", () => {
    const store = new Vuex.Store({
            namespaced: true,
            modules: {
                Tools: {
                    namespaced: true,
                    modules: {
                        DistrictFinder: {
                            namespaced: true,
                            getters: {
                                deactivateGFI: () => true,
                                active: () => true,
                                icon: () => "small",
                                renderToWindow: () => false,
                                resizableWindow: () => false
                            }
                        },
                        DistrictSelector: {
                            namespaced: true,
                            getters: {
                                districtLevels: () => [],
                                selectedDistrictLevelId: () => "123"
                            }
                        }
                    }
                }
            }
        }),
        factory = {
            getShallowMount: (values = {}) => {
                return shallowMount(DistrictFinder, {
                    data () {
                        return {
                            ...values
                        };
                    },
                    store,
                    localVue
                });
            }
        };

    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.exists()).to.be.true;
        });

        it("should find district selector level component", () => {
            const wrapper = factory.getShallowMount(),
                districtSelectorLevelWrapper = wrapper.find("districtselectorlevel-stub");

            expect(districtSelectorLevelWrapper.exists()).to.be.true;
        });

        it("should find district selector filter component", () => {
            const wrapper = factory.getShallowMount(),
                districtSelectorFilterWrapper = wrapper.find("districtselectorfilter-stub");

            expect(districtSelectorFilterWrapper.exists()).to.be.true;
        });
    });

    describe("Methods", () => {
        describe("emitSelectedDistricts", () => {
            it("should emit 'updateSelectedDistricts' correctly to root", () => {
                const wrapper = factory.getShallowMount(),
                    rootWrapper = createWrapper(wrapper.vm.$root);

                wrapper.vm.emitSelectedDistricts(["Altona"]);
                expect(rootWrapper.emitted()).to.have.property("updateSelectedDistricts");
                expect(rootWrapper.emitted()["updateSelectedDistricts"][0]).to.deep.equal([["Altona"]]);
            });
        });
    });
});
