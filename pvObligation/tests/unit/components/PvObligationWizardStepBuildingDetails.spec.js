import {config, shallowMount} from "@vue/test-utils";
import {createStore} from "vuex";
import {expect} from "chai";
import Component from "../../../components/PvObligationWizardStepBuildingDetails.vue";

config.global.mocks.$t = key => key;

describe("PvObligationWizardStepBuildingDetails.vue", () => {
    let wrapper,
        store;

    beforeEach(() => {
        store = createStore({
            modules: {
                Modules: {
                    namespaced: true,
                    modules: {
                        PvObligation: {
                            namespaced: true,
                            state: {
                                selectedRoofId: null
                            },
                            getters: {
                                selectedRoofId: (state) => {
                                    return state.selectedRoofId;
                                }
                            }
                        }
                    }
                }
            }
        });

        wrapper = shallowMount(Component, {
            props: {
                wizardStepsFormData: {},
                wizardStepIsActive: true
            },
            global: {
                plugins: [store]
            }
        });
    });

    it("could load the component and root HTML element contains correct ID", async () => {
        expect(wrapper.exists()).to.be.true;
        expect(wrapper.attributes().id).equals("pvObligationWizardStepBuildingDetails");
    });

    it("validates and returns false and sets errors for missing fields", () => {
        wrapper.setData({
            componentFormData: {
                propertyOwnerFullName: "",
                street: "",
                postalCode: "",
                city: "",
                houseNumber: ""
            }
        });

        const result = wrapper.vm.componentFormDataValidate();

        expect(result).to.be.false;

        expect(wrapper.vm.componentFormErrors.propertyOwnerFullName).equals("additional:modules.pvObligation.formErrors.genericMissingValue");
        expect(wrapper.vm.componentFormErrors.street).equals("additional:modules.pvObligation.formErrors.genericMissingValue");
        expect(wrapper.vm.componentFormErrors.postalCode).equals("additional:modules.pvObligation.formErrors.genericMissingValue");
        expect(wrapper.vm.componentFormErrors.city).equals("additional:modules.pvObligation.formErrors.genericMissingValue");
        expect(wrapper.vm.componentFormErrors.houseNumber).equals("additional:modules.pvObligation.formErrors.genericMissingValue");
    });

    it("validates and returns false and sets error for invalid fields", () => {
        wrapper.setData({
            componentFormData: {
                propertyOwnerFullName: "Max Mustermann",
                street: "Musterstraße",
                postalCode: "1234", // <- invalid value, too short
                city: "Musterstadt",
                houseNumber: "21"
            }
        });

        const result = wrapper.vm.componentFormDataValidate();

        expect(result).to.be.false;

        expect(wrapper.vm.componentFormErrors.propertyOwnerFullName).to.be.null;
        expect(wrapper.vm.componentFormErrors.street).to.be.null;
        expect(wrapper.vm.componentFormErrors.postalCode).equals("additional:modules.pvObligation.formErrors.genericInvalidValue");
        expect(wrapper.vm.componentFormErrors.city).to.be.null;
        expect(wrapper.vm.componentFormErrors.houseNumber).to.be.null;
    });

    it("validates and returns true for valid data", () => {
        wrapper.setData({
            componentFormData: {
                propertyOwnerFullName: "Max Mustermann",
                street: "Musterstraße",
                postalCode: "12345",
                city: "Musterstadt",
                houseNumber: "21"
            }
        });
        const result = wrapper.vm.componentFormDataValidate();

        expect(result).to.be.true;
    });
});
