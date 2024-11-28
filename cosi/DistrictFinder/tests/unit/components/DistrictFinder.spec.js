import {config, shallowMount, createLocalVue, createWrapper} from "@vue/test-utils";
import {expect} from "chai";
import Vuex from "vuex";
import Vuetify from "vuetify";
import Vue from "vue";
import DistrictFinder from "../../../components/DistrictFinder.vue";

config.mocks.$t = key => key;

const localVue = createLocalVue();

Vue.use(Vuetify);
localVue.use(Vuex);

describe("addons/cosi/DistrictFinder/components/DistrictFinder.vue", () => {
    let vuetify;

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
                                selectedDistrictLevelId: () => "123",
                                selectedDistrictNames: () => ["Altona", "Bergedorf", "Harburg"]
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
                    localVue,
                    vuetify
                });
            }
        };

        beforeEach(() => {
            vuetify = new Vuetify();
        });

    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.exists()).to.be.true;
        });

        it("should find accordion component with id 'district-selection'", () => {
            const wrapper = factory.getShallowMount(),
                accordionWrapper = wrapper.find("accordionitem-stub#district-selection");

            expect(accordionWrapper.exists()).to.be.true;
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
        it("should find ContentCard component", () => {
            const wrapper = factory.getShallowMount(),
                contentCardWrapper = wrapper.findComponent({name: "ContentCard"});

            expect(contentCardWrapper.exists()).to.be.true;
        });
    });

    describe("Watchers", () => {
        describe("numberOfConditions", () => {
            it("should not change results when number is raised", async () => {
                const wrapper = factory.getShallowMount();

                await wrapper.setData({numberOfConditions: 2});
                expect(wrapper.vm.resultNamesArray).to.have.lengthOf(0);
            });

            it("should cut off results when number is reduced", async () => {
                const wrapper = factory.getShallowMount();

                await wrapper.setData({resultNamesArray: [[], [], []]})
                await wrapper.setData({numberOfConditions: 2});
                expect(wrapper.vm.resultNamesArray).to.deep.equal([[], []]);
            });
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

        describe("updateResults", () => {
            it("should update results correctly", async () => {
                const wrapper = factory.getShallowMount();

                await wrapper.setData({resultNamesArray: [["Altona"]]});
                wrapper.vm.updateResults(1, ["Harburg"]);

                expect(wrapper.vm.resultNamesArray).to.deep.equal([["Altona"], ["Harburg"]]);

                expect(wrapper.vm.resultList).to.deep.equal(["Altona", "Harburg"]);
            });
        });

        describe("updateOperator", () => {
            it("should update component data correctly on operator change event", async () => {
                const wrapper = factory.getShallowMount();

                wrapper.vm.updateOperator(0, "and");
                wrapper.vm.updateOperator(1, "and");
                wrapper.vm.updateOperator(0, "or");

                expect(wrapper.vm.operators).to.deep.equal(["or", "and"]);
            })
        });

        describe("getResultList", () => {
            it("should return empty array in case of unexpected parameters", () => {
                const wrapper = factory.getShallowMount();

                expect(wrapper.vm.getResultList(null, [])).to.deep.equal([]);
                expect(wrapper.vm.getResultList([[], null], ["or"])).to.deep.equal([]);
                expect(wrapper.vm.getResultList([[], []], null)).to.deep.equal([]);
                expect(wrapper.vm.getResultList([[], []], ["and", "and"])).to.deep.equal([]);
            });

            it("should return expected result", () => {
                const wrapper = factory.getShallowMount(),
                    resultNamesArray = [
                        ["Altona", "Bergedorf"],
                        ["Eimsbüttel", "Harburg"],
                        ["Harburg", "Wandsbek"]
                    ],
                    operators = ["or", "and"];

                expect(wrapper.vm.getResultList(resultNamesArray, operators)).to.deep.equal(
                    ["Altona", "Bergedorf", "Harburg"]
                );
            })
        })
    });
});
