import {config, shallowMount, createLocalVue} from "@vue/test-utils";
import Vuex from "vuex";
import {expect} from "chai";
import TemplateManagerExport from "../../../components/TemplateManagerExport.vue";
import Vuetify from "vuetify";

config.mocks.$t = key => key;

const localVue = createLocalVue();

localVue.use(Vuex);

describe("addons/cosi/TemplateManager/components/TemplateManagerExport.vue", () => {
    let vuetify;

    const factory = {
        getShallowMount: () => {
            return shallowMount(TemplateManagerExport, {
                vuetify,
                localVue
            });
        }
    };

    beforeEach(() => {
        vuetify = new Vuetify();
    });

    describe("Component DOM", () => {
        it("should exist", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.exists()).to.be.true;
            wrapper.destroy();
        });
        it("should find form", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.find("form").exists()).to.be.true;
            wrapper.destroy();
        });
        it("should find generate button", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.find("button .bi-play-circle").exists()).to.be.true;
            wrapper.destroy();
        });

    });
});
