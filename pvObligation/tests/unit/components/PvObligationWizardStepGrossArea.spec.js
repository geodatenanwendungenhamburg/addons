import {createStore} from "vuex";
import {config, mount, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import Component from "../../../components/PvObligationWizardStepGrossArea.vue";
import sinon from "sinon";

config.global.mocks.$t = key => key;

describe("addons/pvObligation/components/PvObligationWizardStepGrossArea.vue", () => {
    const store = createStore({
        getters: {
            configJs: () => ({
                styleConf: "./resources/style.json"
            })
        },
        modules: {
            Modules: {
                namespaced: true,
                modules: {
                    PvObligation: {
                        namespaced: true,
                        getters: {
                            isCreatingReport: () => sinon.stub(),
                            styleJson: () => ({
                                data: [
                                    {
                                        styleId: "dachflaechen",
                                        rules: [{style: { }}]
                                    }
                                ]
                            })
                        },
                        mutations: {
                            setSelectedRoofId: () => sinon.stub()
                        },
                        actions: {
                            dissolveRoofFeaturesAndCalculateArea: sinon.stub().resolves(123),
                            getStyleJson: sinon.stub().resolves()
                        }
                    }
                }
            },
            Maps: {
                namespaced: true,
                getters: {
                    isCreatingReport: () => sinon.stub()
                },
                mutations: {
                    setSelectedRoofId: () => sinon.stub()
                },
                actions: {
                    addNewLayerIfNotExists: sinon.stub(),
                    addInteraction: sinon.stub()
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
        expect(wrapper.attributes().id).equals("pvObligationWizardStepGrossArea");
    });

    it("renders only the right label and value for grossRoofArea >= 50 or <= 50", async () => {
        const wrapper = mount(Component, {
            propsData: {
                wizardStepsFormData: {},
                wizardStepIsActive: true
            },
            global: {
                plugins: [store]
            }
        });

        wrapper.vm.componentFormData.grossRoofArea = 120;
        wrapper.vm.displayGrossRoofArea = "120";

        await wrapper.vm.$nextTick();

        expect(wrapper.findAll("table#PvObligationSimpleTable tr")[0].find("td.cellLabel").text() === "additional:modules.pvObligation.wizard.step.grossArea.component.tableCellGrossAreaLabel");
        expect(wrapper.findAll("table#PvObligationSimpleTable tr")[0].find("td.cellValue").text()).to.contain("120 m²");

        wrapper.vm.componentFormData.grossRoofArea = 33;
        wrapper.vm.displayGrossRoofArea = "33";

        await wrapper.vm.$nextTick();

        expect(wrapper.findAll("table#PvObligationSimpleTable tr")[0].find("td.cellLabel").text() === "additional:modules.pvObligation.wizard.step.grossArea.component.tooSmallAreaText");
        expect(wrapper.findAll("table#PvObligationSimpleTable tr")[0].find("td.cellValue").text()).to.contain("33 m²");
    });
});
