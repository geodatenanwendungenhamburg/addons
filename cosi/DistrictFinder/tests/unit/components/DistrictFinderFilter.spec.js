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

    describe("Computed Properties", () => {
        it("should get 'allOperators'", () => {
            const wrapper = factory.getShallowMount({
                cardList: [{
                    id: "0",
                    operator: "or",
                    number: 1
                },
                {
                    id: "1",
                    operator: "and",
                    number: 1
                }]
            });

            expect(wrapper.vm.allOperators).to.deep.equal(["or", "and"]);
        });

        it("should get 'allDistricts'", () => {
            const wrapper = factory.getShallowMount({
                cardList: [{
                    id: "0",
                    operator: "or",
                    number: 0,
                    districts: ["Mordor"]
                },
                {
                    id: "1",
                    operator: "and",
                    number: 1,
                    districts: ["Wunderland"]
                }]
            });

            expect(wrapper.vm.allDistricts).to.deep.equal([["Mordor"], ["Wunderland"]]);
        });
    });

    describe("Methods", () => {
        describe("addCard", () => {
            it("should have two cards", () => {
                const wrapper = factory.getShallowMount();

                wrapper.vm.addCard();

                expect(wrapper.vm.cardList.length).to.be.equal(2);
            });
        });

        describe("deleteCard", () => {
            it("should delete one card", () => {
                const wrapper = factory.getShallowMount({
                    cardList: [{
                        id: "0",
                        operator: "or",
                        number: 1
                    }, {
                        id: "1",
                        operator: "or",
                        number: 2
                    }]
                });

                wrapper.vm.deleteCard("0");
                expect(wrapper.vm.cardList).to.deep.equal([{
                    id: "1",
                    operator: "or",
                    number: 2
                }]);
            });
        });
        describe("setCardDistricts", () => {
            it("should update results correctly", () => {
                const wrapper = factory.getShallowMount({
                    cardList: [{
                        id: "0",
                        operator: "or",
                        number: 1
                    }]
                });

                wrapper.vm.setCardDistricts("0", ["Altona", "Harburg"]);

                expect(wrapper.vm.cardList[0].districts).to.deep.equal(["Altona", "Harburg"]);
                expect(wrapper.vm.resultList).to.deep.equal(["Altona", "Harburg"]);
            });
        });

        describe("setCardOperator", () => {
            it("should update component data correctly on operator change event", () => {
                const wrapper = factory.getShallowMount({
                    cardList: [{
                        id: "0",
                        operator: "or",
                        number: 1
                    }, {
                        id: "1",
                        operator: "or",
                        number: 2
                    }]
                });

                wrapper.vm.setCardOperator("0", "and");
                wrapper.vm.setCardOperator("1", "and");
                wrapper.vm.setCardOperator("0", "or");

                expect(wrapper.vm.cardList[0].operator).to.equal("or");
                expect(wrapper.vm.cardList[1].operator).to.equal("and");
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
                    operators = ["", "or", "and"];

                expect(wrapper.vm.getResultList(resultNamesArray, operators)).to.deep.equal(
                    ["Altona", "Bergedorf", "Harburg"]
                );
            })
        })
    });

    describe("User Interactions", () => {
        it("should call 'addCard' if the user click the button to add a card", async () => {
            const wrapper = factory.getShallowMount(),
                buttonWrapperArray = wrapper.findAll("button"),
                foundButton = buttonWrapperArray.wrappers.find(wrapper => {
                    return wrapper.text() === "additional:modules.tools.cosi.districtFinder.button.addCondition";
                });

            await foundButton.trigger("click");
            expect(wrapper.vm.cardList.length).to.be.equal(2);
        });
    })
});
