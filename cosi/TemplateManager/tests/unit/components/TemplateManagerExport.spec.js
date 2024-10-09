import {config, shallowMount, createLocalVue} from "@vue/test-utils";
import Vuex from "vuex";
import {expect} from "chai";
import TemplateManagerExport from "../../../components/TemplateManagerExport.vue";
import Vuetify from "vuetify";
import sinon from "sinon";
import {baseFixedTemplateForHamburg, baseProportionTemplate, mapfishServerConfig} from "../../../js/mapfishUtils";
import PDFMaker from "../../../js/createPdf";
import {Point} from "ol/geom.js";
import Feature from "ol/Feature.js";
import axios from "axios";

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

    describe("methods", () => {
        describe("addOverViewPageToReport", () => {
            const mockGetters = {
                    projection: () => {
                        return {
                            getCode: () => "12345"
                        };
                    }
                }
            let store = new Vuex.Store({
                namespaces: true,
                modules: {
                    Maps: {
                        namespaced: true,
                        getters: mockGetters
                    },
                    Tools: {
                        namespaced: true,
                        modules: {
                            DistrictSelector: {
                                namespaced: true,
                                getters: {
                                    selectedFeatures: () => ["fooo"]
                                }
                            }
                        }
                    }
                }
            });
            it("should call prepareImage with expected params", async () => {
                const wrapper = shallowMount(TemplateManagerExport, {
                    vuetify,
                    localVue,
                    store
                }),
                prepareImageStub = sinon.stub(wrapper.vm, "prepareImage");
                sinon.stub(PDFMaker.prototype, "addChapter");
                sinon.stub(PDFMaker.prototype, "addImageByUrl");

                wrapper.vm.addOverViewPageToReport();
                await wrapper.vm.$nextTick();
                expect(prepareImageStub.getCall(0).args).to.deep.equal(["fooo", {...baseProportionTemplate}, "12345", "overviewMap", {...mapfishServerConfig}]);
                wrapper.destroy();
                sinon.restore();
            });
            it("should call prepareImage with other template", async() => {
                const store = new Vuex.Store({
                        namespaces: true,
                        modules: {
                            Maps: {
                                namespaced: true,
                                getters: mockGetters
                            },
                            Tools: {
                                namespaced: true,
                                modules: {
                                    DistrictSelector: {
                                        namespaced: true,
                                        getters: {
                                            selectedFeatures: () => []
                                        }
                                    }
                                }
                            }
                        }
                    }),
                    wrapper = shallowMount(TemplateManagerExport, {
                        vuetify,
                        localVue,
                        store
                    }),
                    prepareImageStub = sinon.stub(wrapper.vm, "prepareImage");
                    sinon.stub(PDFMaker.prototype, "addChapter");
                    sinon.stub(PDFMaker.prototype, "addImageByUrl");

                wrapper.vm.addOverViewPageToReport();
                await wrapper.vm.$nextTick();
                expect(prepareImageStub.getCall(0).args).to.deep.equal([undefined, {...baseFixedTemplateForHamburg}, "12345", "overviewMap", {...mapfishServerConfig}]);
                wrapper.destroy();
                sinon.restore();
            });
            it("should call addChapter and addImageByUrl if prepareImage resolves an string", async () => {
                const wrapper = shallowMount(TemplateManagerExport, {
                    vuetify,
                    localVue,
                    store
                }),
                addChapterStub = sinon.stub(PDFMaker.prototype, "addChapter"),
                addImageByUrlStub = sinon.stub(PDFMaker.prototype, "addImageByUrl");

                sinon.stub(wrapper.vm, "prepareImage").resolves("test.url.de");

                wrapper.vm.addOverViewPageToReport();
                await wrapper.vm.$nextTick();
                expect(addChapterStub.getCall(0).args[0]).to.be.equal("Übersichtskarte");
                expect(addImageByUrlStub.getCall(0).args[0]).to.be.equal("test.url.de");
                wrapper.destroy();
                sinon.restore();
            })
        });
        describe("prepareImage", () => {
            it("should call prepareImages and get a string as result", async () => {
                sinon.stub(axios, "get").returns(Promise.resolve({status: 200, data: {status: "finished"}}));
                sinon.stub(axios, "post").returns(Promise.resolve({status: 200, data: {}}))
                const mockGetters = {
                    projection: () => {
                        return {
                            getCode: () => "12345"
                        };
                        }
                    },
                    store = new Vuex.Store({
                        namespaces: true,
                        modules: {
                            Maps: {
                                namespaced: true,
                                getters: mockGetters
                            },
                            Tools: {
                                namespaced: true,
                                modules: {
                                    DistrictSelector: {
                                        namespaced: true,
                                        getters: {
                                            selectedFeatures: () => ["fooo"]
                                        }
                                    }
                                }
                            }
                        },
                        getters: {
                            getRestServiceById: () => sinon.stub().returns("foourl")
                        }
                    }),
                    wrapper = shallowMount(TemplateManagerExport, {
                        vuetify,
                        localVue,
                        store
                    }),
                    result = await wrapper.vm.prepareImage(new Feature(new Point([1, 1])), baseProportionTemplate, "1234", "imageName", mapfishServerConfig);

                expect(result).to.be.a("string");
                wrapper.destroy();
                sinon.restore();
            });
        })
    });
});
