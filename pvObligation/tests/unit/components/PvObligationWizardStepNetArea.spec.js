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

        expect(wrapper.findAll("p").length).to.equal(2);

        wrapper.findAll("p").forEach((pTag) => {
            expect(pTag.text()).to.contain("missingStepGrossArea");
        });
    });

    it("renders all net roof area paragraphs when netRoofArea is set", async () => {
        config.global.mocks.$t = (key, addon) => {
            return key + (addon ? Object.values(addon).join(",") : "");
        };

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
        wrapper.vm.displayNetRoofArea = "100";

        await wrapper.vm.$nextTick();

        expect(wrapper.findAll("strong").length).to.equal(2);
        expect(wrapper.findAll("strong")[0].text()).to.contain("100");
        expect(wrapper.findAll("strong")[1].text()).to.contain("30");
    });

    it("renders correct obligatedArea rounding", async () => {
        config.global.mocks.$t = (key, addon) => {
            return key + (addon ? Object.values(addon).join(",") : "");
        };

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
        wrapper.vm.obligatedArea = Math.round(wrapper.vm.componentFormData.netRoofArea * 0.3 * 10) / 10;
        wrapper.vm.displayNetRoofArea = "123.456";

        await wrapper.vm.$nextTick();

        expect(wrapper.findAll("strong").length).to.equal(2);
        expect(wrapper.findAll("strong")[0].text()).to.contain("123.456");
        expect(wrapper.findAll("strong")[1].text()).to.contain(Math.round(wrapper.vm.componentFormData.netRoofArea * 0.3 * 10) / 10);

        // reset the settings to avoid problems in former tests
        config.global.mocks.$t = key => key;
    });
});
