import {config, shallowMount, createLocalVue} from "@vue/test-utils";
import Vuex from "vuex";
import {expect} from "chai";
import ContentCard from "../../ContentCard.vue";
config.mocks.$t = key => key;
const localVue = createLocalVue();
localVue.use(Vuex);
describe("addons/cosi/components/ContentCard.vue", () => {
    const factory = {
        getShallowMount: () => {
            return shallowMount(ContentCard, {
                localVue,
                propsData: {
                    id: "12345"
                }
            });
        }
    };
    describe("Component DOM", () => {
        it("should render card", () => {
            const wrapper = factory.getShallowMount();
            expect(wrapper.find(".card").exists()).to.be.true;
            wrapper.destroy();
        });
        it("should render card title", async () => {
            const wrapper = factory.getShallowMount();
            await wrapper.setProps({
                title: "Test Tittle"
            });
            expect(wrapper.find(".card-title").exists()).to.be.true;
            wrapper.destroy();
        });
        it("should render card title", async () => {
            const wrapper = factory.getShallowMount();
            await wrapper.setProps({
                subtitle: "Test Subtittle"
            });
            expect(wrapper.find(".card-subtitle").exists()).to.be.true;
            wrapper.destroy();
        });
        it("should render card text", () => {
            const wrapper = factory.getShallowMount();
            expect(wrapper.find(".card-text").exists()).to.be.true;
            wrapper.destroy();
        });
        it("should render close icon", () => {
            const wrapper = factory.getShallowMount();
            expect(wrapper.find(".bi-x").exists()).to.be.true;
            wrapper.destroy();
        });
    });
});
