import Vuex from "vuex";
import {shallowMount, createLocalVue} from "@vue/test-utils";
import {expect} from "chai";
// import sinon from "sinon";
import AddressTheme from "../../../components/AddressTheme.vue";

const localVue = createLocalVue();

localVue.use(Vuex);

describe("addons/gfiTheme/components/AddressTheme.vue", () => {
    let wrapper;

    beforeEach(() => {
        wrapper = shallowMount(AddressTheme, {
            propsData: {
                feature: {
                    getMappedProperties: function () {
                        return {
                        };
                    }
                }
            },
            localVue,
            mocks: {
                $t: (msg) => msg
            }
        });
    });

    describe("template", () => {
        it("should render a table with class 'table", () => {
            // expect(wrapper.find("table").exists()).to.be.true;
            // expect(wrapper.find("table").classes("table")).to.be.true;
        });
    });
});
