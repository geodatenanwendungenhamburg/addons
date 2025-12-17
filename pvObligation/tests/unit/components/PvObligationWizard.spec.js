import {nextTick} from "vue";
import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import Component from "../../../components/PvObligationWizard.vue";

config.global.mocks.$t = key => key;

describe("addons/pvObligation/components/PvObligationWizard.vue", () => {
    let wrapper;

    beforeEach(() => {
        wrapper = shallowMount(Component);
    });

    afterEach(() => {
        wrapper?.unmount();
    });

    /**
     * Create a list of wizard steps
     * @returns {Array} List of wizard steps
     */
    function createWizardSteps () {
        return [
            {
                title: "grossArea",
                isOpen: true,
                isError: false,
                component: {name: "StepOneComponent"},
                componentFormData: null
            },
            {
                title: "netArea",
                isOpen: false,
                isError: false,
                component: {name: "StepTwoComponent"},
                componentFormData: null
            }
        ];
    }

    it("could load the component and root HTML element contains correct ID", async () => {
        expect(wrapper.exists()).to.be.true;
        expect(wrapper.attributes().id).equals("pvObligationWizard");
    });

    it("renders two wizard steps and changes the active step successful", async () => {
        wrapper.vm.wizardSteps = createWizardSteps();
        await nextTick();

        let accordionItems = wrapper.findAll("div.wizard div.wizardContent div.steps accordion-item-stub");

        expect(accordionItems[0].attributes().title).equal("additional:modules.pvObligation.wizard.step.grossArea.wizardTitle");
        expect(accordionItems[0].attributes().isopen).equal("true");

        expect(accordionItems[1].attributes().title).equal("additional:modules.pvObligation.wizard.step.netArea.wizardTitle");
        expect(accordionItems[1].attributes().isopen).equal("false");

        wrapper.vm.openWizardStep({
            target: {
                classList: {
                    contains: (cls) => cls === "accordion-button" && cls !== "collapsed"
                }
            }
        }, 1);

        await nextTick();

        accordionItems = wrapper.findAll("div.wizard div.wizardContent div.steps accordion-item-stub");

        expect(accordionItems[0].attributes().title).equal("additional:modules.pvObligation.wizard.step.grossArea.wizardTitle");
        expect(accordionItems[0].attributes().isopen).equal("false");

        expect(accordionItems[1].attributes().title).equal("additional:modules.pvObligation.wizard.step.netArea.wizardTitle");
        expect(accordionItems[1].attributes().isopen).equal("true");
    });

    it("disables accordion items and footer buttons when disableAccordion is true", async () => {
        wrapper.vm.wizardSteps = createWizardSteps();
        await nextTick();
        await wrapper.setProps({disableAccordion: true});

        const accordionItems = wrapper.findAll("div.wizard div.wizardContent div.steps accordion-item-stub");

        expect(accordionItems[1].attributes().class).to.contain("disabledAccordionItem");
        expect(wrapper.vm.disableFooterButtons).to.be.true;
    });
});
