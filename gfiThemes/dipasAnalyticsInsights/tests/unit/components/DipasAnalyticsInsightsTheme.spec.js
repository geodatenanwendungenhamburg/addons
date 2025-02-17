import {shallowMount, createLocalVue} from "@vue/test-utils";
import {expect} from "chai";
import DipasAnalyticsInsightsTheme from "../../../components/DipasAnalyticsInsightsTheme.vue";

const localVue = createLocalVue();

describe("addons/dipasAnalyticsInsights/components/DipasAnalyticsInsightsTheme.vue", () => {
    let wrapper;

    beforeEach(() => {
        wrapper = shallowMount(DipasAnalyticsInsightsTheme, {
            propsData: {
                feature: {
                    getMappedProperties: function () {
                        return {
                            "description": "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
                            "title": "Ein Beitragstitel",
                            "categories": ["Umwelt", "Verkehr"]
                        }
                    }
                }
            },
            localVue,
            mocks: {
                $t: (msg) => msg
            }
        })
    });

    it("should render the DipasAnalyticsInsightsTheme", () => {
        expect(wrapper.find(".dipas-analytics-insights-theme").exists()).to.be.true;
    });

    it("should form the label for the categories of the contribution correctly", () => {
        const vm = wrapper.vm;

        expect (vm.categories).to.equal("additional:addons.gfiThemes.dipasAnalyticsInsights.categories" + ": Umwelt, Verkehr")
    });

    it("should render the title of the contribution correctly", () => {
        expect(wrapper.find(".dipas-analytics-insights-title").text()).to.equals("Ein Beitragstitel");
    });

    it("should render the contribution text correctly", () => {
        expect(wrapper.find(".dipas-analytics-insights-contribution-text").text()).to.equals("Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.");
    });
});

