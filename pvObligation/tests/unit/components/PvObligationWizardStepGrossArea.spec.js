import {createStore} from "vuex";
import {config, shallowMount} from "@vue/test-utils";
import {expect} from "chai";
import Component from "../../../components/PvObligationWizardStepGrossArea.vue";
import axios from "axios";
import sinon from "sinon";

config.global.mocks.$t = key => key;

sinon.stub(axios, "get").resolves({
    data: [
        {
            styleId: "dachflaechen",
            rules: [{style: {}}]
        }
    ]
});

describe("addons/pvObligation/components/PvObligationWizardStepGrossArea.vue", () => {
    const store = createStore({
        getters: {
            configJs: () => ({
                styleConf: "/dummy/url"
            })
        },
        modules: {
            PvObligation: {
                namespaced: true,
                getters: {
                    isCreatingReport: () => sinon.stub()
                },
                mutations: {
                    setSelectedRoofId: () => sinon.stub()
                },
                actions: {
                    dissolveRoofFeaturesAndCalculateArea: sinon.stub()
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

    it("does not render grossRoofArea or too small text when grossRoofArea is null", async () => {
        const wrapper = shallowMount(Component, {
            propsData: {
                wizardStepsFormData: {},
                wizardStepIsActive: true
            },
            global: {
                plugins: [store]
            }
        });

        expect(wrapper.find("p.grossRoofAreaText").exists()).to.be.false;
        expect(wrapper.find("p.noOblicagionText").exists()).to.be.false;
    });

    it("renders grossRoofArea text and 'too small' text when grossRoofArea < 50", async () => {
        const wrapper = shallowMount(Component, {
            propsData: {
                wizardStepsFormData: {},
                wizardStepIsActive: true
            },
            global: {
                plugins: [store]
            }
        });

        // Simulate selection result
        wrapper.vm.componentFormData.grossRoofArea = 49.8;
        wrapper.vm.displayGrossRoofArea = "49,8";

        await wrapper.vm.$nextTick();

        // eslint-disable-next-line
        const grossAreaEl = wrapper.find("strong.grossRoofAreaValue"),
            tooSmallEl = wrapper.find("p.noOblicagionText");

        expect(grossAreaEl.exists()).to.be.true;
        expect(grossAreaEl.text()).to.contain("49,8");
        expect(tooSmallEl.exists()).to.be.true;
    });

    it("renders only grossRoofArea text when grossRoofArea >= 50", async () => {
        const wrapper = shallowMount(Component, {
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

        // eslint-disable-next-line
        const grossAreaElement = wrapper.find("strong.grossRoofAreaValue"),
            tooSmallElement = wrapper.find("p.noOblicagionText");

        expect(grossAreaElement.exists()).to.be.true;
        expect(grossAreaElement.text()).to.contain("120");
        expect(tooSmallElement.exists()).to.be.false;
    });
});
