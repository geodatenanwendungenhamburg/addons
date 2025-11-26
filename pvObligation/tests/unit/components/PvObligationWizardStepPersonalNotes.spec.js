import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import Component from "../../../components/PvObligationWizardStepPersonalNotes.vue";

config.global.mocks.$t = key => key;

describe("addons/pvObligation/components/PvObligationWizardStepPersonalNotes.vue", () => {
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
        expect(wrapper.attributes().id).equals("pvObligationWizardStepPersonalNotes");
    });

    it("should reset correct wizard step data", async () => {
        wrapper.setData({
            componentFormData: {
                personalNote: "Hello World"
            }
        });

        wrapper.vm.resetWizardStepData();

        expect(wrapper.vm.componentFormData.personalNote === "").to.be.true;
    });
});

