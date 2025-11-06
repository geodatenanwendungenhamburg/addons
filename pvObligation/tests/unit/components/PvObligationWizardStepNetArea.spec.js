import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import Component from "../../../components/PvObligationWizardStepNetArea.vue";

config.global.mocks.$t = key => key;

describe("addons/pvObligation/components/PvObligationWizardStepNetArea.vue", () => {
    it("could load the component and root HTML element contains correct ID", async () => {
        const wrapper = shallowMount(Component, {
            propsData: {
                wizardStepsFormData: {},
                wizardStepIsActive: true
            }
        });

        expect(wrapper.exists()).to.be.true;
        expect(wrapper.attributes().id).equals("pvObligationWizardStepNetArea");
    });
});
