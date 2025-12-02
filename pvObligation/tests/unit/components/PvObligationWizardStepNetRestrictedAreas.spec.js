import {shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import Component from "../../../components/PvObligationWizardStepNetRestrictedAreas.vue";
import sinon from "sinon";
import {createStore} from "vuex";

describe("addons/pvObligation/components/PvObligationWizardStepNetRestrictedAreas.vue", () => {
    let wrapper,
        store;

    beforeEach(() => {
        store = createStore({
            modules: {
                Maps: {
                    namespaced: true,
                    actions: {
                        addNewLayerIfNotExists: sinon.stub(),
                        addInteraction: sinon.stub(),
                        removeInteraction: sinon.stub()
                    }
                },
                Modules: {
                    namespaced: true,
                    modules: {
                        PvObligation: {
                            namespaced: true,
                            state: {
                                isDrawing: false
                            },
                            getters: {
                                isDrawing: state => state.isDrawing
                            }
                        }
                    }
                }
            }
        });

        wrapper = shallowMount(Component, {
            propsData: {
                wizardStepsFormData: {
                    PvObligationWizardStepGrossArea: {
                        isValid: true
                    }
                },
                wizardStepIsActive: true
            },
            global: {
                plugins: [store],
                mocks: {
                    $t: key => key
                }
            }
        });
    });

    afterEach(() => {
        wrapper?.unmount();
    });

    it("could load the component and root HTML element contains correct ID", async () => {
        expect(wrapper.exists()).to.be.true;
        expect(wrapper.attributes().id).equals("pvObligationWizardStepNetRestrictedAreas");
    });

    it("does not render net restricted area texts when wizardStepsFormData is invalid", async () => {
        await wrapper.setProps({
            wizardStepsFormData: {
                PvObligationWizardStepGrossArea: {
                    isValid: false
                }
            },
            wizardStepIsActive: true
        });

        const paragraphs = wrapper.findAll("p").map(p => p.text());

        expect(paragraphs.some(text => text.includes("missingStepGrossArea"))).to.be.true;
    });

    it("renders texts when wizardStepsFormData is valid", async () => {
        await wrapper.setProps({
            wizardStepsFormData: {
                PvObligationWizardStepGrossArea: {
                    isValid: true
                }
            },
            wizardStepIsActive: true
        });

        const paragraphs = wrapper.findAll("p").map(p => p.text());

        expect(paragraphs.some(text => text.includes("introduction"))).to.be.true;
        expect(paragraphs.some(text => text.includes("additionalInfo"))).to.be.true;
    });
});
