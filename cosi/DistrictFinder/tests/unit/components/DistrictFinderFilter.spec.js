import {config, shallowMount, createLocalVue} from "@vue/test-utils";
import {expect} from "chai";
import Vuex from "vuex";
import DistrictFinderFilter from "../../../components/DistrictFinderFilter.vue";

config.mocks.$t = key => key;

const localVue = createLocalVue();

localVue.use(Vuex);

describe("addons/cosi/DistrictFinder/components/DistrictFinderFilter.vue", () => {
    const store = new Vuex.Store({
            namespaced: true,
            modules: {
                Tools: {
                    namespaced: true,
                    modules: {
                        DistrictSelector: {
                            namespaced: true,
                            mutations: {
                                setDistrictsByName: () => sinon.stub()
                            },
                            getters: {
                                selectedDistrictNames: () => ["Altona", "Bergedorf", "Harburg"]
                            }
                        }
                    }
                }
            }
        }),
        factory = {
            getShallowMount: (values = {}) => {
                return shallowMount(DistrictFinderFilter, {
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

        it("should find a filter title", () => {
            const wrapper = factory.getShallowMount(),
                filterTitleWrapper = wrapper.find(".filter-title");

            expect(filterTitleWrapper.exists()).to.be.true;
        });

        it("should find a filter date", () => {
            const wrapper = factory.getShallowMount(),
            filterDateWrapper = wrapper.find(".filter-title");

            expect(filterDateWrapper.exists()).to.be.true;
        });

        it("should find icon button component with id 'reset-button'", () => {
            const wrapper = factory.getShallowMount(),
                iconButtonWrapper = wrapper.find("iconbutton-stub#reset-button");

            expect(iconButtonWrapper.exists()).to.be.true;
        });

        it("should find icon button component with id 'export-button'", () => {
            const wrapper = factory.getShallowMount(),
                iconButtonWrapper = wrapper.find("iconbutton-stub#export-button");

            expect(iconButtonWrapper.exists()).to.be.true;
        });

        it("should find the button to add a condition'", () => {
            const wrapper = factory.getShallowMount(),
                buttonWrapperArray = wrapper.findAll("button"),
                foundButton = buttonWrapperArray.wrappers.find(wrapper => {
                    return wrapper.text() === "additional:modules.tools.cosi.districtFinder.button.addCondition";
                });

            expect(foundButton.exists()).to.be.true;
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
        describe("updateResults", () => {
            it("should update results correctly", async () => {
                const wrapper = factory.getShallowMount();

                await wrapper.setData({
                    resultNamesArray: [["Altona"]]
                });
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

                expect(wrapper.vm.getResultList()).to.deep.equal([]);
                expect(wrapper.vm.getResultList(null, ["or"])).to.deep.equal([]);
                expect(wrapper.vm.getResultList([["Hamm"], ["Schlump"]], null)).to.deep.equal([]);
                expect(wrapper.vm.getResultList([], ["or"])).to.deep.equal([]);
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

    describe("User Interactions", () => {
        it("should increase the 'numberOfConditions' by One if the user click the button to add a condition", async () => {
            const wrapper = factory.getShallowMount(),
                buttonWrapperArray = wrapper.findAll("button"),
                foundButton = buttonWrapperArray.wrappers.find(wrapper => {
                    return wrapper.text() === "additional:modules.tools.cosi.districtFinder.button.addCondition";
                });

            await foundButton.trigger("click");
            expect(wrapper.vm.numberOfConditions).to.be.equal(2);
        });
    })
});
