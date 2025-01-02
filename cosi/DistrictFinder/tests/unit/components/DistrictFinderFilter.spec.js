import {config, shallowMount, createLocalVue} from "@vue/test-utils";
import DistrictFinderFilter from "../../../components/DistrictFinderFilter.vue";
import {expect} from "chai";
import sinon from "sinon";
import Vuex from "vuex";

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
                                selectedDistrictNames: () => ["Altona", "Bergedorf", "Harburg"],
                                selectedDistrictLevelId: () => "Super Mario"
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

        it("should find filter export component", () => {
            const wrapper = factory.getShallowMount(),
                exportWrapper = wrapper.find("districtfinderfilterexport-stub");

            expect(exportWrapper.exists()).to.be.true;
        });

        it("should find filter import component", () => {
            const wrapper = factory.getShallowMount(),
                importWrapper = wrapper.find("districtfinderfilterimport-stub");

            expect(importWrapper.exists()).to.be.true;
        });

        it("should find the button to add a condition'", () => {
            const wrapper = factory.getShallowMount(),
                buttonWrapperArray = wrapper.findAll("button"),
                foundButton = buttonWrapperArray.wrappers.find(wrapper => {
                    return wrapper.text() === "additional:modules.tools.cosi.districtFinder.button.addCondition";
                });

            expect(foundButton.exists()).to.be.true;
        });
        it("should render results if areas were found", async () => {
            const wrapper = factory.getShallowMount();

                await wrapper.setData({
                    resultList: ["Gebiet1", "Gebiet2", "Gebiet3" ]
                });

            expect(wrapper.find(".found-areas").exists()).to.be.true;
        });
        it("should not render results if no areas were found", async () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.find(".found-areas").exists()).to.be.false;
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

        describe("resetCardList", () => {
            it("should reset the card(condition) list", () => {
                const wrapper = factory.getShallowMount();

                wrapper.vm.resetCardList();
                expect(wrapper.vm.cardList).to.be.an("array").that.is.empty;
            });
        });

        describe("getExportedData", () => {
            it("should return the right exported data without areas", () => {
                const wrapper = factory.getShallowMount(),
                    expectedData = {
                        meta: {
                            name: "Ross",
                            date: "01.01.1999"
                        },
                        districtSelector: {
                            selectedDistrictLevelId: "Super Mario",
                            selectedDistrictNames: []
                        },
                        data: []
                    },
                    data = wrapper.vm.getExportedData("Ross", "01.01.1999", false, []);

                wrapper.vm.getExportedData();
                expect(data).to.deep.equal(expectedData);
            });

            it("should return the right exported data with areas ", () => {
                const wrapper = factory.getShallowMount(),
                    expectedData = {
                        meta: {
                            name: "Ross",
                            date: "01.01.1999"
                        },
                        districtSelector: {
                            selectedDistrictLevelId: "Super Mario",
                            selectedDistrictNames: ["Altona", "Bergedorf", "Harburg"]
                        },
                        data: []
                    },
                    data = wrapper.vm.getExportedData("Ross", "01.01.1999", true, []);

                wrapper.vm.getExportedData();
                expect(data).to.deep.equal(expectedData);
            });
        });

        describe("setCardAttributes", () => {
            it("should update results correctly", () => {
                const wrapper = factory.getShallowMount({
                    cardList: [{
                        id: "0",
                        operator: "or",
                        number: 1
                    }]
                });

                wrapper.vm.setCardAttributes("0", ["Altona", "Harburg"]);

                expect(wrapper.vm.cardList[0].districts).to.deep.equal(["Altona", "Harburg"]);
                expect(wrapper.vm.resultList).to.deep.equal(["Altona", "Harburg"]);
            });
        });

        describe("setCardList", () => {
            it("should set the card(condition) list", async () => {
                const wrapper = factory.getShallowMount(),
                    cardList = [{
                        id: "123",
                        operator: "and",
                        number: 1
                    }, {
                        id: "456",
                        operator: "or",
                        number: 2
                    }];

                wrapper.vm.setCardList(cardList);
                await wrapper.vm.$nextTick();
                expect(wrapper.vm.cardList).to.deep.equal(cardList);
            });

            it("should call 'resetCardList' and 'updateResultList'", async () => {
                const wrapper = factory.getShallowMount(),
                    spyResetCardList = sinon.spy(wrapper.vm, "resetCardList"),
                    spyUpdateResultList = sinon.spy(wrapper.vm, "updateResultList"),
                    cardList = [{
                        id: "123",
                        operator: "and",
                        number: 1
                    }, {
                        id: "456",
                        operator: "or",
                        number: 2
                    }];

                wrapper.vm.setCardList(cardList);
                await wrapper.vm.$nextTick();
                expect(spyResetCardList.calledOnce).to.be.true;
                expect(spyUpdateResultList.calledOnce).to.be.true;
                sinon.restore();
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

        describe("setConditionDate", () => {
            it("should set the date of the condition/card", async () => {
                const wrapper = factory.getShallowMount();

                wrapper.vm.setConditionDate("01.01.1999");
                expect(wrapper.vm.conditionDate).to.equal("01.01.1999");
            });
        });

        describe("setConditionTitle", () => {
            it("should set the title of the condition/card", async () => {
                const wrapper = factory.getShallowMount();

                wrapper.vm.setConditionTitle("Ho ho ho");
                expect(wrapper.vm.conditionTitle).to.equal("Ho ho ho");
            });
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
        describe("getCommaSeparatedAreaNames", () => {
            it("should return comma separated results", async () => {
                const wrapper = factory.getShallowMount(),
                    result="Gebiet1, Gebiet2, Gebiet3";

                await wrapper.setData({
                    resultList: ["Gebiet1", "Gebiet2", "Gebiet3" ]
                });

                expect(wrapper.vm.getCommaSeparatedAreaNames()).to.deep.equal(result);
            }),
            it("should return a limited number of areas if showMoreAreas is false", async () => {
                const wrapper = factory.getShallowMount(),
                    result="Gebiet1, Gebiet2, Gebiet3";

                await wrapper.setData({
                    numberOfLimitedAreas: 3,
                    resultList: ["Gebiet1", "Gebiet2", "Gebiet3", "Gebiet4", "Gebiet5", "Gebiet6"]
                });

                expect(wrapper.vm.getCommaSeparatedAreaNames()).to.deep.equal(result);
            }),
            it("should return all areas if showMoreAreas is true", async () => {
                const wrapper = factory.getShallowMount(),
                    result="Gebiet1, Gebiet2, Gebiet3, Gebiet4, Gebiet5, Gebiet6";

                await wrapper.setData({
                    numberOfLimitedAreas: 3,
                    showMoreAreas: true,
                    resultList: ["Gebiet1", "Gebiet2", "Gebiet3", "Gebiet4", "Gebiet5", "Gebiet6"]
                });

                expect(wrapper.vm.getCommaSeparatedAreaNames()).to.deep.equal(result);
            })
        });

        describe("toggleCardActive", () => {
            it("should set the active id", async () => {
                const wrapper = factory.getShallowMount();

                await wrapper.setData({
                    activeCardId: ""
                });
                wrapper.vm.toggleCardActive(0);
                await wrapper.vm.$nextTick()

                expect(wrapper.vm.activeCardId).to.be.equal(0);
            });
        });
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
