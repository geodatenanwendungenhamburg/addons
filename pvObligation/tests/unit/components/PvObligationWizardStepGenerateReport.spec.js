import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import sinon from "sinon";
import Component from "../../../components/PvObligationWizardStepGenerateReport.vue";

config.global.mocks.$t = key => key;

describe("addons/pvObligation/components/PvObligationWizardStepGenerateReport.vue", () => {
    const store = createStore({
        modules: {
            namespaced: true,
            Modules: {
                namespaced: true,
                modules: {
                    PvObligation: {
                        namespaced: true,
                        getters: {
                            isCreatingReport () {
                                return false;
                            }
                        },
                        mutations: {
                            setIsCreatingReport () {
                                return false;
                            }
                        },
                        actions: {
                            exportPDF: () => sinon.stub()
                        }
                    }
                }
            }
        }
    });

    it("could load the component and root HTML element contains correct ID", async () => {
        const wrapper = shallowMount(Component, {
            propsData: {
                wizardStepsFormData: {},
                wizardStepIsActive: true
            },
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.exists()).to.be.true;
        expect(wrapper.attributes().id).equals("pvObligationWizardStepGenerateReport");
    });

    it("returns false if any wizard step is invalid", async () => {
        const wrapper = shallowMount(Component, {
            propsData: {
                wizardStepsFormData: {
                    "component_1": {
                        isValid: true
                    },
                    "component_2": {
                        isValid: false
                    },
                    "component_3": {
                        isValid: true
                    }
                },
                wizardStepIsActive: true
            },
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.vm.allWizardStepsValid).to.be.false;
    });

    it("returns true if every wizard step is valid", async () => {
        const wrapper = shallowMount(Component, {
            propsData: {
                wizardStepsFormData: {
                    "component_1": {
                        isValid: true
                    },
                    "component_2": {
                        isValid: true
                    },
                    "component_3": {
                        isValid: true
                    }
                },
                wizardStepIsActive: true
            },
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.vm.allWizardStepsValid).to.be.true;
    });
});
