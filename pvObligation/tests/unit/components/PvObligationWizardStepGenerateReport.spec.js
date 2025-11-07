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
                    PVObligation: {
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
});
