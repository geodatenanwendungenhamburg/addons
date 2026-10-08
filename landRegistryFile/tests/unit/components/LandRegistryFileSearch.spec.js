import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import {createStore} from "vuex";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";

import Component from "../../../components/LandRegistryFileSearch.vue";

describe("addons/landRegistryFile/tests/unit/components/LandRegistryFileSearch.spec.js", () => {
    let wrapper,
        store;

    const oafSchema = {
        properties: {
            geschaeftszeichen: {
                title: "Geschäftszeichen"
            },
            adresse: {
                title: "Adresse"
            },
            sonstige_anlage: {
                title: "sonstige Anlage"
            }
        }
    };

    beforeEach(() => {
        store = createStore({
            modules: {
                namespaced: true,
                Modules: {
                    namespaced: true,
                    modules: {
                        LandRegistryFile: {
                            namespaced: true,
                            state: () => ({
                                showLoadingSpinner: false,
                                oafParams: {
                                    filters: {
                                        textSearchFields: [
                                            "adresse",
                                            "geschaeftszeichen"
                                        ],
                                        select: {
                                            options: [
                                                "Bauakte",
                                                "Straßenakte"
                                            ]
                                        }
                                    }
                                },
                                landRegistryFileFeatures: []
                            }),
                            getters: {
                                showLoadingSpinner: state => state.showLoadingSpinner,
                                oafParams: state => state.oafParams,
                                oafSchema: () => oafSchema,
                                landRegistryFileFeatures: state => state.landRegistryFileFeatures
                            },
                            mutations: {
                                setShowLoadingSpinner (state, payload) {
                                    state.showLoadingSpinner = payload;
                                },
                                setLandRegistryFileFeatures (state, payload) {
                                    state.landRegistryFileFeatures = payload;
                                }
                            },
                            actions: {
                                updateSelectionLayer: () => Promise.resolve()
                            }
                        }
                    }
                }
            }
        });

        wrapper = shallowMount(Component, {
            props: {
            },
            global: {
                mocks: {
                    $t: key => key
                },
                plugins: [store],
                stubs: {
                    SwitchInput: false
                }
            }
        });
    });

    afterEach(() => {
        if (wrapper) {
            wrapper.unmount();
        }
    });

    it("should exist", () => {
        expect(wrapper.exists()).to.be.true;
    });

    describe("handle search extent switch", () => {
        it("form should react on search extent switch", async () => {
            expect(wrapper.find("input#idSearchInExtentSwitch").exists()).to.be.true;

            expect(wrapper.find("div.buttons-footer > div.searchExtentHint > p").exists()).to.be.true;
            expect(wrapper.find("div.buttons-footer > div.searchExtentHint > p").text()).to.equal("additional:modules.landRegistryFile.tabs.tabSearch.searchModeInExtent");

            wrapper.find("input#idSearchInExtentSwitch").setChecked(false);
            await wrapper.vm.$nextTick();

            expect(wrapper.find("div.buttons-footer > div.searchExtentHint > p").text()).to.equal("additional:modules.landRegistryFile.tabs.tabSearch.searchModeOverall");

            wrapper.find("input#idSearchInExtentSwitch").setChecked(true);
            await wrapper.vm.$nextTick();

            expect(wrapper.find("div.buttons-footer > div.searchExtentHint > p").text()).to.equal("additional:modules.landRegistryFile.tabs.tabSearch.searchModeInExtent");
        });

        it("should reset switch on reset form", async () => {
            expect(wrapper.vm.searchForm.searchInExtent).to.be.true;

            wrapper.find("input#idSearchInExtentSwitch").setChecked(false);
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.searchForm.searchInExtent).to.be.false;

            wrapper.vm.resetForm();
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.searchForm.searchInExtent).to.be.true;
            expect(wrapper.find("input#idSearchInExtentSwitch").element.checked).to.be.true;
        });
    });

    describe("validate year inputs and set error messages", () => {
        it("should detect alphanumerical input and give correct error hints", () => {
            wrapper.vm.validateInputs();

            expect(wrapper.vm.allInputsValid).to.be.true;

            wrapper.vm.searchForm.yearFrom = "abc";
            wrapper.vm.validateInputs();
            expect(wrapper.vm.allInputsValid).to.be.false;
            expect(wrapper.vm.errorMessages.yearFrom).to.equal("additional:modules.landRegistryFile.tabs.tabSearch.errors.errorYearDigit");

            wrapper.vm.searchForm.yearFrom = "123a";
            wrapper.vm.validateInputs();
            expect(wrapper.vm.allInputsValid).to.be.false;
            expect(wrapper.vm.errorMessages.yearFrom).to.equal("additional:modules.landRegistryFile.tabs.tabSearch.errors.errorYearDigit");

            wrapper.vm.searchForm.yearFrom = "+/3a";
            wrapper.vm.validateInputs();
            expect(wrapper.vm.allInputsValid).to.be.false;
            expect(wrapper.vm.errorMessages.yearFrom).to.equal("additional:modules.landRegistryFile.tabs.tabSearch.errors.errorYearDigit");

            wrapper.vm.searchForm.yearFrom = "1234";
            wrapper.vm.searchForm.yearTo = "abc";
            wrapper.vm.validateInputs();
            expect(wrapper.vm.allInputsValid).to.be.false;
            expect(wrapper.vm.errorMessages.yearTo).to.equal("additional:modules.landRegistryFile.tabs.tabSearch.errors.errorYearDigit");
        });

        it("should detect numbers differing vom 4 digits and give correct error hints", () => {
            wrapper.vm.searchForm.yearFrom = "12";
            wrapper.vm.validateInputs();
            expect(wrapper.vm.allInputsValid).to.be.false;
            expect(wrapper.vm.errorMessages.yearFrom).to.equal("additional:modules.landRegistryFile.tabs.tabSearch.errors.errorYearDigit");

            wrapper.vm.searchForm.yearFrom = "12345";
            wrapper.vm.validateInputs();
            expect(wrapper.vm.allInputsValid).to.be.false;
            expect(wrapper.vm.errorMessages.yearFrom).to.equal("additional:modules.landRegistryFile.tabs.tabSearch.errors.errorYearDigit");

            wrapper.vm.searchForm.yearFrom = "1234";
            wrapper.vm.searchForm.yearTo = "12345";
            wrapper.vm.validateInputs();
            expect(wrapper.vm.allInputsValid).to.be.false;
            expect(wrapper.vm.errorMessages.yearTo).to.equal("additional:modules.landRegistryFile.tabs.tabSearch.errors.errorYearDigit");

            wrapper.vm.searchForm.yearFrom = "";
            wrapper.vm.searchForm.yearTo = "1345";
            wrapper.vm.validateInputs();
            expect(wrapper.vm.allInputsValid).to.be.false;
            expect(wrapper.vm.errorMessages.yearFrom).to.equal("additional:modules.landRegistryFile.tabs.tabSearch.errors.errorYearBoth");

            wrapper.vm.searchForm.yearFrom = "1234";
            wrapper.vm.searchForm.yearTo = "";
            wrapper.vm.validateInputs();
            expect(wrapper.vm.allInputsValid).to.be.false;
            expect(wrapper.vm.errorMessages.yearTo).to.equal("additional:modules.landRegistryFile.tabs.tabSearch.errors.errorYearBoth");

            wrapper.vm.searchForm.yearFrom = "1234";
            wrapper.vm.searchForm.yearTo = "1235";
            wrapper.vm.validateInputs();
            expect(wrapper.vm.allInputsValid).to.be.true;
            expect(wrapper.vm.errorMessages.yearFrom).to.equal("");
            expect(wrapper.vm.errorMessages.yearTo).to.equal("");

            wrapper.vm.searchForm.yearFrom = "1237";
            wrapper.vm.searchForm.yearTo = "1235";
            wrapper.vm.validateInputs();
            expect(wrapper.vm.allInputsValid).to.be.false;
            expect(wrapper.vm.errorMessages.yearFrom).to.equal("");
            expect(wrapper.vm.errorMessages.yearTo).to.equal("additional:modules.landRegistryFile.tabs.tabSearch.errors.errorYearOrder");
        });

        it("should reset form and empty all error hints", () => {
            wrapper.vm.searchForm.yearFrom = "12345";
            wrapper.vm.searchForm.yearTo = "1235";
            wrapper.vm.searchForm.selectedRecords = ["Bauakte"];
            wrapper.vm.validateInputs();
            expect(wrapper.vm.allInputsValid).to.be.false;
            expect(wrapper.vm.errorMessages.yearFrom).to.equal("additional:modules.landRegistryFile.tabs.tabSearch.errors.errorYearDigit");

            wrapper.vm.resetForm();
            expect(wrapper.vm.allInputsValid).to.be.true;
            expect(wrapper.vm.searchForm.yearFrom).to.equal("");
            expect(wrapper.vm.searchForm.yearTo).to.equal("");
            expect(wrapper.vm.errorMessages.yearFrom).to.equal("");
            expect(wrapper.vm.errorMessages.yearTo).to.equal("");
            expect(wrapper.vm.searchForm.selectedRecords).to.deep.equal([]);
        });

        it("should disable search button if form is invalid", async () => {
            expect(wrapper.find("#landRegistrySearchButton").exists()).to.be.true;
            expect(wrapper.find("#landRegistrySearchButton").attributes("disabled")).to.equal("false");

            wrapper.vm.searchForm.yearFrom = "12345";
            wrapper.vm.validateInputs();

            await wrapper.vm.$nextTick();
            expect(wrapper.find("#landRegistrySearchButton").attributes("disabled")).to.equal("true");

            wrapper.vm.searchForm.yearFrom = "1234";
            wrapper.vm.searchForm.yearTo = "1235";
            wrapper.vm.validateInputs();

            await wrapper.vm.$nextTick();
            expect(wrapper.find("#landRegistrySearchButton").attributes("disabled")).to.equal("false");
        });
    });

    describe("validate text input, set error message and handle text search hint", () => {
        it("should validate the text input and find out forbidden characters", () => {
            wrapper.vm.validateInputs();

            expect(wrapper.vm.allInputsValid).to.be.true;

            wrapper.vm.searchForm.searchText = "abc";
            wrapper.vm.validateInputs();
            expect(wrapper.vm.allInputsValid).to.be.true;
            expect(wrapper.vm.errorMessages.searchText).to.equal("");

            wrapper.vm.searchForm.searchText = "abcdé 19 §36a - f HBauO";
            wrapper.vm.validateInputs();
            expect(wrapper.vm.allInputsValid).to.be.true;
            expect(wrapper.vm.errorMessages.searchText).to.equal("");

            wrapper.vm.searchForm.searchText = "Bu/BA3/00521/";
            wrapper.vm.validateInputs();
            expect(wrapper.vm.allInputsValid).to.be.true;
            expect(wrapper.vm.errorMessages.searchText).to.equal("");

            wrapper.vm.searchForm.searchText = "abc@";
            wrapper.vm.validateInputs();
            expect(wrapper.vm.allInputsValid).to.be.false;
            expect(wrapper.vm.errorMessages.searchText).to.equal("additional:modules.landRegistryFile.tabs.tabSearch.errors.errorInvalidChars");

            wrapper.vm.searchForm.searchText = "<html>";
            wrapper.vm.validateInputs();
            expect(wrapper.vm.allInputsValid).to.be.false;
            expect(wrapper.vm.errorMessages.searchText).to.equal("additional:modules.landRegistryFile.tabs.tabSearch.errors.errorInvalidChars");

            wrapper.vm.searchForm.searchText = "";
            wrapper.vm.validateInputs();
            expect(wrapper.vm.allInputsValid).to.be.true;
            expect(wrapper.vm.errorMessages.searchText).to.equal("");
        });

        it("should handle search hint", () => {
            expect(wrapper.vm.fieldNamesForTextSearch).to.deep.equal(["Adresse", "Geschäftszeichen"]);
            expect(wrapper.vm.showTextSearchInfo).to.be.false;

            const infoButton = wrapper.findComponent(IconButton);

            expect(infoButton.exists()).to.be.true;

            infoButton.trigger("click");
            wrapper.vm.$nextTick();
            expect(wrapper.vm.showTextSearchInfo).to.be.true;

        });
    });

    describe("search criteria submission", () => {
        it("copies the form criteria when a valid search is submitted", () => {
            const submittedCriteria = {
                searchInExtent: false,
                yearFrom: "2020",
                yearTo: "2024",
                selectedRecords: ["Bauakte"],
                searchText: "abc"
            };
            let searchWasInitiatedByUser = false;

            wrapper.vm.searchForm = {
                ...submittedCriteria,
                selectedRecords: [...submittedCriteria.selectedRecords]
            };
            wrapper.vm.prepareSearch = initiatedByUser => {
                searchWasInitiatedByUser = initiatedByUser;
            };

            wrapper.vm.initiateSearchByUser();

            expect(searchWasInitiatedByUser).to.be.true;
            expect(wrapper.vm.activeSearchCriteria).to.deep.equal(submittedCriteria);

            wrapper.vm.searchForm.selectedRecords.push("Straßenakte");
            expect(wrapper.vm.activeSearchCriteria.selectedRecords).to.deep.equal(["Bauakte"]);
        });

        it("resets the form and submitted criteria together", async () => {
            wrapper.vm.searchForm = {
                searchInExtent: false,
                yearFrom: "2020",
                yearTo: "2024",
                selectedRecords: ["Bauakte"],
                searchText: "abc"
            };
            wrapper.vm.activeSearchCriteria = {
                ...wrapper.vm.searchForm,
                selectedRecords: [...wrapper.vm.searchForm.selectedRecords],
                searchText: "def"
            };
            wrapper.vm.searchInitiated = true;

            expect(wrapper.vm.showUnsubmittedSearchWarning).to.be.true;

            wrapper.vm.resetForm();
            await wrapper.vm.$nextTick();

            const defaultCriteria = {
                searchInExtent: true,
                yearFrom: "",
                yearTo: "",
                selectedRecords: [],
                searchText: ""
            };

            expect(wrapper.vm.searchForm).to.deep.equal(defaultCriteria);
            expect(wrapper.vm.activeSearchCriteria).to.deep.equal(defaultCriteria);
            expect(wrapper.vm.showUnsubmittedSearchWarning).to.be.false;
        });

        it("shows the unsubmitted-search warning when the form differs from submitted criteria", async () => {
            wrapper.vm.searchForm.searchText = "abc";
            wrapper.vm.activeSearchCriteria = {
                ...wrapper.vm.searchForm,
                selectedRecords: [...wrapper.vm.searchForm.selectedRecords]
            };

            expect(wrapper.vm.showUnsubmittedSearchWarning).to.be.false;

            wrapper.vm.searchForm.searchText = "def";
            wrapper.vm.searchInitiated = true;
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.showUnsubmittedSearchWarning).to.be.true;
        });
    });
});
