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
                            getters: {
                                keyOfAttrNameStats: () => "stats",
                                selectedDistrictNames: () => []
                            }
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
                        id: 1,
                        conditionId: 0,
                        cardNumber: 0
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

        describe("getYearsForTemporalExtent", () => {
            it("should return an empty array in case of unexpected parameters", () => {
                const wrapper = factory.getShallowMount();

                expect(wrapper.vm.getYearsForTemporalExtent()).to.be.an("array").that.is.empty;
                expect(wrapper.vm.getYearsForTemporalExtent([])).to.be.an("array").that.is.empty;
                expect(wrapper.vm.getYearsForTemporalExtent([[]])).to.be.an("array").that.is.empty;
                expect(wrapper.vm.getYearsForTemporalExtent([[new Date()]])).to.be.an("array").that.is.empty;
                expect(wrapper.vm.getYearsForTemporalExtent([[new Date(), new Date(), new Date()]])).to.be.an("array").that.is.empty;
            });
            it("should return expected results", () => {
                const wrapper = factory.getShallowMount(),
                    extent = [
                        [new Date("2000"), new Date("2000")],
                        [new Date("2010"), new Date("2011")],
                        [new Date("2020"), new Date("2022")]
                    ],
                    expectedResult = [2000, 2010, 2011, 2020, 2021, 2022];

                expect(wrapper.vm.getYearsForTemporalExtent(extent)).to.deep.equal(expectedResult);
            });
            it("should return expected results", () => {
                const wrapper = factory.getShallowMount(),
                    extent = [
                        [new Date("2000"), new Date("2000")],
                        [new Date("2010"), new Date("2011")],
                        [new Date("2020"), new Date("2022")]
                    ],
                    expectedResult = [2000, 2010, 2011, 2020, 2021, 2022];

                expect(wrapper.vm.getYearsForTemporalExtent(extent)).to.deep.equal(expectedResult);
            });
        });

        describe("sortedData", () => {
            it("return sorted data for chart", async () => {
                const wrapper = factory.getShallowMount(),
                expectedSorting = [{"category": 200, "stats": "Gebiet3"},  {"category": 1000, "stats": "Gebiet2"}, {"category": 2000, "stats": "Gebiet1"}];

            await wrapper.setData({
                    features: [{properties: {"category": 2000, "stats": "Gebiet1"}}, {properties: {"category": 1000, "stats": "Gebiet2"}}, {properties: {"category": 200, "stats": "Gebiet3"}}],
                    selectedCategory: "category"
            });
            wrapper.vm.$nextTick();

            expect(wrapper.vm.sortedData()).to.deep.equal(expectedSorting);
            });
        });
    });
});
