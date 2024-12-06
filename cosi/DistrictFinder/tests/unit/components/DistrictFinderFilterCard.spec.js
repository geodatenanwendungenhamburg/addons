import {config, shallowMount, createLocalVue} from "@vue/test-utils";
import {expect} from "chai";
import Vue from "vue";
import Vuetify from "vuetify";
import Vuex from "vuex";
import DistrictFinderFilterCard from "../../../components/DistrictFinderFilterCard.vue";

config.mocks.$t = key => key;

Vue.use(Vuetify);
const localVue = createLocalVue();

localVue.use(Vuex);

describe("addons/cosi/DistrictFinder/components/DistrictFinderFilterCard.vue", () => {
    const store = new Vuex.Store({
            namespaced: true,
            modules: {
                Tools: {
                    namespaced: true,
                    modules: {
                        DistrictSelector: {
                            namespaced: true,
                            mutations: {},
                            getters: {}
                        }
                    }
                }
            }
        }),
        vuetify = new Vuetify(),
        factory = {
            getShallowMount: (values = {}) => {
                return shallowMount(DistrictFinderFilterCard, {
                    data () {
                        return {
                            ...values
                        };
                    },
                    props: {
                        conditionId: 0
                    },
                    store,
                    vuetify,
                    localVue
                });
            }
        };

    describe("Component DOM", () => {

        it("exists", () => {
            const wrapper = factory.getShallowMount();

            expect(wrapper.exists()).to.be.true;
        });
    });

    describe("Methods", () => {

        describe("comparisonFunction", () => {

            it("should return false in case of unexpected parameters", () => {
                const wrapper = factory.getShallowMount();

                expect(wrapper.vm.comparisonFunction()).to.be.false;
                expect(wrapper.vm.comparisonFunction("><", 0, 0)).to.be.false;
            });

            it("should return expected results", () => {
                const wrapper = factory.getShallowMount();

                expect(wrapper.vm.comparisonFunction("=", 99, 99)).to.be.true;
                expect(wrapper.vm.comparisonFunction("=", 99, 100)).to.be.false;
                expect(wrapper.vm.comparisonFunction("=", 99, 100, 1)).to.be.true;
                expect(wrapper.vm.comparisonFunction("<", 99, 100)).to.be.true;
                expect(wrapper.vm.comparisonFunction("<", 100, 99)).to.be.false;
                expect(wrapper.vm.comparisonFunction(">", 99, 100)).to.be.false;
                expect(wrapper.vm.comparisonFunction(">", 100, 99)).to.be.true;
            });
        });
    });
});
