import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import Component from "../../../components/PvObligationWizardStepPersonalInformation.vue";

config.global.mocks.$t = key => key;

describe("PvObligationWizardStepPersonalInformation.vue", () => {
    let wrapper;

    beforeEach(() => {
        wrapper = shallowMount(Component, {
            propsData: {
                wizardStepsFormData: {},
                wizardStepIsActive: true
            }
        });
    });

    it("could load the component and root HTML element contains correct ID", async () => {
        expect(wrapper.exists()).to.be.true;
        expect(wrapper.attributes().id).equals("pvObligationWizardStepPersonalInformation");
    });

    it("validates and returns false and sets errors for missing fields", () => {
        wrapper.setData({
            componentFormData: {
                propertyOwnerFullName: "",
                street: "",
                postalCode: "",
                city: "",
                email: "",
                phoneNumber: "",
                reportCreatedBy: ""
            }
        });

        const result = wrapper.vm.componentFormDataValidate();

        expect(result).to.be.false;

        expect(wrapper.vm.componentFormErrors.propertyOwnerFullName).equals("additional:modules.pvObligation.formErrors.genericMissingValue");
        expect(wrapper.vm.componentFormErrors.street).equals("additional:modules.pvObligation.formErrors.genericMissingValue");
        expect(wrapper.vm.componentFormErrors.postalCode).equals("additional:modules.pvObligation.formErrors.genericMissingValue");
        expect(wrapper.vm.componentFormErrors.city).equals("additional:modules.pvObligation.formErrors.genericMissingValue");
        expect(wrapper.vm.componentFormErrors.email).to.be.null;
        expect(wrapper.vm.componentFormErrors.phoneNumber).to.be.null;
        expect(wrapper.vm.componentFormErrors.reportCreatedBy).to.be.null;
    });

    it("validates and returns false and sets error for invalid fields", () => {
        wrapper.setData({
            componentFormData: {
                propertyOwnerFullName: "Max Mustermann",
                street: "Musterstraße",
                postalCode: "1234", // <- invalid value, too short
                city: "Musterstadt",
                email: "test@example.com",
                phoneNumber: "123456789",
                reportCreatedBy: "Max Mustermann"
            }
        });

        const result = wrapper.vm.componentFormDataValidate();

        expect(result).to.be.false;

        expect(wrapper.vm.componentFormErrors.propertyOwnerFullName).to.be.null;
        expect(wrapper.vm.componentFormErrors.street).to.be.null;
        expect(wrapper.vm.componentFormErrors.postalCode).equals("additional:modules.pvObligation.formErrors.genericInvalidValue");
        expect(wrapper.vm.componentFormErrors.city).to.be.null;
        expect(wrapper.vm.componentFormErrors.email).to.be.null;
        expect(wrapper.vm.componentFormErrors.phoneNumber).to.be.null;
        expect(wrapper.vm.componentFormErrors.reportCreatedBy).to.be.null;
    });

    it("validates and returns true for valid data", () => {
        wrapper.setData({
            componentFormData: {
                propertyOwnerFullName: "Max Mustermann",
                street: "Musterstraße",
                postalCode: "12345",
                city: "Musterstadt",
                email: "test@example.com",
                phoneNumber: "123456789",
                reportCreatedBy: "Max Mustermann"
            }
        });
        const result = wrapper.vm.componentFormDataValidate();

        expect(result).to.be.true;
    });
});
