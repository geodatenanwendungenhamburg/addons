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
                                }
                            }),
                            getters: {
                                showLoadingSpinner: state => state.showLoadingSpinner,
                                oafParams: state => state.oafParams,
                                oafSchema: () => oafSchema
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

            expect(wrapper.find("div.buttons-footer > div > p").exists()).to.be.true;
            expect(wrapper.find("div.buttons-footer > div > p").text()).to.equal("additional:modules.landRegistryFile.tabs.tabSearch.searchModeInExtent");

            wrapper.find("input#idSearchInExtentSwitch").setChecked(false);
            await wrapper.vm.$nextTick();

            expect(wrapper.find("div.buttons-footer > div > p").text()).to.equal("additional:modules.landRegistryFile.tabs.tabSearch.searchModeOverall");

            wrapper.find("input#idSearchInExtentSwitch").setChecked(true);
            await wrapper.vm.$nextTick();

            expect(wrapper.find("div.buttons-footer > div > p").text()).to.equal("additional:modules.landRegistryFile.tabs.tabSearch.searchModeInExtent");
        });

        it("should reset switch on reset form", async () => {
            expect(wrapper.vm.searchInExtent).to.be.true;

            wrapper.find("input#idSearchInExtentSwitch").setChecked(false);
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.searchInExtent).to.be.false;

            wrapper.vm.resetForm();
            await wrapper.vm.$nextTick();

            expect(wrapper.vm.searchInExtent).to.be.true;
            expect(wrapper.find("input#idSearchInExtentSwitch").element.checked).to.be.true;
        });
    });

    describe("validate year inputs and set error messages", () => {
        beforeEach(() => {
            wrapper.vm.yearFrom = "";
            wrapper.vm.yearTo = "";
        });

        it("should detect alphanumerical input and give correct error hints", () => {
            wrapper.vm.validateInputs();

            expect(wrapper.vm.allInputsValid).to.be.true;

            wrapper.vm.yearFrom = "abc";
            wrapper.vm.validateInputs();
            expect(wrapper.vm.allInputsValid).to.be.false;
            expect(wrapper.vm.errorMessages.yearFrom).to.equal("additional:modules.landRegistryFile.tabs.tabSearch.errors.errorYearDigit");

            wrapper.vm.yearFrom = "123a";
            wrapper.vm.validateInputs();
            expect(wrapper.vm.allInputsValid).to.be.false;
            expect(wrapper.vm.errorMessages.yearFrom).to.equal("additional:modules.landRegistryFile.tabs.tabSearch.errors.errorYearDigit");

            wrapper.vm.yearFrom = "+/3a";
            wrapper.vm.validateInputs();
            expect(wrapper.vm.allInputsValid).to.be.false;
            expect(wrapper.vm.errorMessages.yearFrom).to.equal("additional:modules.landRegistryFile.tabs.tabSearch.errors.errorYearDigit");

            wrapper.vm.yearFrom = "1234";
            wrapper.vm.yearTo = "abc";
            wrapper.vm.validateInputs();
            expect(wrapper.vm.allInputsValid).to.be.false;
            expect(wrapper.vm.errorMessages.yearTo).to.equal("additional:modules.landRegistryFile.tabs.tabSearch.errors.errorYearDigit");
        });

        it("should detect numbers differing vom 4 digits and give correct error hints", () => {
            wrapper.vm.yearFrom = "12";
            wrapper.vm.validateInputs();
            expect(wrapper.vm.allInputsValid).to.be.false;
            expect(wrapper.vm.errorMessages.yearFrom).to.equal("additional:modules.landRegistryFile.tabs.tabSearch.errors.errorYearDigit");

            wrapper.vm.yearFrom = "12345";
            wrapper.vm.validateInputs();
            expect(wrapper.vm.allInputsValid).to.be.false;
            expect(wrapper.vm.errorMessages.yearFrom).to.equal("additional:modules.landRegistryFile.tabs.tabSearch.errors.errorYearDigit");

            wrapper.vm.yearFrom = "1234";
            wrapper.vm.yearTo = "12345";
            wrapper.vm.validateInputs();
            expect(wrapper.vm.allInputsValid).to.be.false;
            expect(wrapper.vm.errorMessages.yearTo).to.equal("additional:modules.landRegistryFile.tabs.tabSearch.errors.errorYearDigit");

            wrapper.vm.yearFrom = "";
            wrapper.vm.yearTo = "1345";
            wrapper.vm.validateInputs();
            expect(wrapper.vm.allInputsValid).to.be.false;
            expect(wrapper.vm.errorMessages.yearFrom).to.equal("additional:modules.landRegistryFile.tabs.tabSearch.errors.errorYearBoth");

            wrapper.vm.yearFrom = "1234";
            wrapper.vm.yearTo = "";
            wrapper.vm.validateInputs();
            expect(wrapper.vm.allInputsValid).to.be.false;
            expect(wrapper.vm.errorMessages.yearTo).to.equal("additional:modules.landRegistryFile.tabs.tabSearch.errors.errorYearBoth");

            wrapper.vm.yearFrom = "1234";
            wrapper.vm.yearTo = "1235";
            wrapper.vm.validateInputs();
            expect(wrapper.vm.allInputsValid).to.be.true;
            expect(wrapper.vm.errorMessages.yearFrom).to.equal("");
            expect(wrapper.vm.errorMessages.yearTo).to.equal("");

            wrapper.vm.yearFrom = "1237";
            wrapper.vm.yearTo = "1235";
            wrapper.vm.validateInputs();
            expect(wrapper.vm.allInputsValid).to.be.false;
            expect(wrapper.vm.errorMessages.yearFrom).to.equal("");
            expect(wrapper.vm.errorMessages.yearTo).to.equal("additional:modules.landRegistryFile.tabs.tabSearch.errors.errorYearOrder");
        });

        it("should reset form and empty all error hints", () => {
            wrapper.vm.yearFrom = "12345";
            wrapper.vm.yearTo = "1235";
            wrapper.vm.selectedRecords = ["Bauakte"];
            wrapper.vm.validateInputs();
            expect(wrapper.vm.allInputsValid).to.be.false;
            expect(wrapper.vm.errorMessages.yearFrom).to.equal("additional:modules.landRegistryFile.tabs.tabSearch.errors.errorYearDigit");

            wrapper.vm.resetForm();
            expect(wrapper.vm.allInputsValid).to.be.true;
            expect(wrapper.vm.yearFrom).to.equal("");
            expect(wrapper.vm.yearTo).to.equal("");
            expect(wrapper.vm.errorMessages.yearFrom).to.equal("");
            expect(wrapper.vm.errorMessages.yearTo).to.equal("");
            expect(wrapper.vm.selectedRecords).to.deep.equal([]);
        });

        it("should disable search button if form is invalid", async () => {
            expect(wrapper.find("#landRegistrySearchButton").exists()).to.be.true;
            expect(wrapper.find("#landRegistrySearchButton").attributes("disabled")).to.equal("false");

            wrapper.vm.yearFrom = "12345";
            wrapper.vm.validateInputs();

            await wrapper.vm.$nextTick();
            expect(wrapper.find("#landRegistrySearchButton").attributes("disabled")).to.equal("true");

            wrapper.vm.yearFrom = "1234";
            wrapper.vm.yearTo = "1235";
            wrapper.vm.validateInputs();

            await wrapper.vm.$nextTick();
            expect(wrapper.find("#landRegistrySearchButton").attributes("disabled")).to.equal("false");
        });
    });

    describe("validate text input, set error message and handle text search hint", () => {
        beforeEach(() => {
            wrapper.vm.searchText = "";
        });

        it("should validate the text input and find out forbidden characters", () => {
            wrapper.vm.validateInputs();

            expect(wrapper.vm.allInputsValid).to.be.true;

            wrapper.vm.searchText = "abc";
            wrapper.vm.validateInputs();
            expect(wrapper.vm.allInputsValid).to.be.true;
            expect(wrapper.vm.errorMessages.searchText).to.equal("");

            wrapper.vm.searchText = "abcdé 19 §36a - f HBauO";
            wrapper.vm.validateInputs();
            expect(wrapper.vm.allInputsValid).to.be.true;
            expect(wrapper.vm.errorMessages.searchText).to.equal("");

            wrapper.vm.searchText = "Bu/BA3/00521/";
            wrapper.vm.validateInputs();
            expect(wrapper.vm.allInputsValid).to.be.true;
            expect(wrapper.vm.errorMessages.searchText).to.equal("");

            wrapper.vm.searchText = "abc@";
            wrapper.vm.validateInputs();
            expect(wrapper.vm.allInputsValid).to.be.false;
            expect(wrapper.vm.errorMessages.searchText).to.equal("additional:modules.landRegistryFile.tabs.tabSearch.errors.errorInvalidChars");

            wrapper.vm.searchText = "<html>";
            wrapper.vm.validateInputs();
            expect(wrapper.vm.allInputsValid).to.be.false;
            expect(wrapper.vm.errorMessages.searchText).to.equal("additional:modules.landRegistryFile.tabs.tabSearch.errors.errorInvalidChars");

            wrapper.vm.searchText = "";
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
});
