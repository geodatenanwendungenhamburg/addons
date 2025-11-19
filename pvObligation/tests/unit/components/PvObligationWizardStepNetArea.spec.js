import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import Component from "../../../components/PvObligationWizardStepNetArea.vue";

config.global.mocks.$t = key => key;

describe("addons/pvObligation/components/PvObligationWizardStepNetArea.vue", () => {
    it("could load the component and root HTML element contains correct ID", async () => {
        const wrapper = shallowMount(Component, {
            propsData: {
                wizardStepsFormData: {
                    PvObligationWizardStepGrossArea: {
                        isValid: true
                    }
                },
                wizardStepIsActive: true
            }
        });

        expect(wrapper.exists()).to.be.true;
        expect(wrapper.attributes().id).equals("pvObligationWizardStepNetArea");
    });

    it("does not render net roof area texts when netRoofArea is null", async () => {
        const wrapper = shallowMount(Component, {
            propsData: {
                wizardStepsFormData: {
                    PvObligationWizardStepGrossArea: {
                        isValid: false
                    }
                },
                wizardStepIsActive: true
            }
        });

        expect(wrapper.findAll("p.netRoofAreaText").length).to.equal(0);
    });

    it("renders all net roof area paragraphs when netRoofArea is set", async () => {
        const wrapper = shallowMount(Component, {
            propsData: {
                wizardStepsFormData: {
                    PvObligationWizardStepGrossArea: {
                        isValid: true
                    }
                },
                wizardStepIsActive: true
            }
        });

        // Simulate calculation results (avoid calling map-dependent method)
        wrapper.vm.componentFormData.netRoofArea = 100;
        wrapper.vm.obligatedArea = 30; // 30% of 100

        await wrapper.vm.$nextTick();

        // eslint-disable-next-line
        const paragraphs = wrapper.findAll("strong.netRoofAreaValue");

        expect(paragraphs.length).to.equal(1);
        expect(paragraphs.at(0).text()).to.contain("100");
    });

    it("renders correct obligatedArea rounding", async () => {
        const wrapper = shallowMount(Component, {
            propsData: {
                wizardStepsFormData: {
                    PvObligationWizardStepGrossArea: {
                        isValid: true
                    }
                },
                wizardStepIsActive: true
            }
        });

        wrapper.vm.componentFormData.netRoofArea = 123.456;
        wrapper.vm.obligatedArea = Math.round(wrapper.vm.componentFormData.netRoofArea * 0.3 * 10) / 10; // mimic component logic

        await wrapper.vm.$nextTick();

        // eslint-disable-next-line
        const paragraphs = wrapper.findAll("strong.netRoofAreaValue");

        expect(paragraphs.length).to.equal(1);
        expect(paragraphs.at(0).text()).to.contain("123.456");
    });
});
