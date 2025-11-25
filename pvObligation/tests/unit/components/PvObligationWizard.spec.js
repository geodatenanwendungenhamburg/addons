import {nextTick} from "vue";
import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import Component from "../../../components/PvObligationWizard.vue";

config.global.mocks.$t = key => key;

describe("addons/pvObligation/components/PvObligationWizard.vue", () => {

    /**
     * Create a list of wizard steps
     * @returns {Array} List of wizard steps
     */
    function createWizardSteps () {
        return [
            {
                title: "Step 1",
                isOpen: true,
                isError: false,
                component: {name: "StepOneComponent"},
                componentFormData: null
            },
            {
                title: "Step 2",
                isOpen: false,
                isError: false,
                component: {name: "StepTwoComponent"},
                componentFormData: null
            }
        ];
    }

    it("could load the component and root HTML element contains correct ID", async () => {
        const wrapper = shallowMount(Component);

        expect(wrapper.exists()).to.be.true;
        expect(wrapper.attributes().id).equals("pvObligationWizard");
    });

    it("renders two wizard steps and changes the active step successful", async () => {
        const wrapper = shallowMount(Component, {
            data () {
                return {
                    wizardSteps: createWizardSteps()
                };
            }
        });

        let accordionItems = wrapper.findAll("div.wizard div.wizardContent div.steps accordion-item-stub");

        expect(accordionItems[0].attributes().title).equal("Step 1");
        expect(accordionItems[0].attributes().isopen).equal("true");

        expect(accordionItems[1].attributes().title).equal("Step 2");
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

        expect(accordionItems[0].attributes().title).equal("Step 1");
        expect(accordionItems[0].attributes().isopen).equal("false");

        expect(accordionItems[1].attributes().title).equal("Step 2");
        expect(accordionItems[1].attributes().isopen).equal("true");
    });
});
