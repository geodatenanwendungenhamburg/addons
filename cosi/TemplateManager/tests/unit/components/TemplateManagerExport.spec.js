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

        it("should not find a hint if report title is valid", async () => {
            const wrapper = factory.getShallowMount();

            await wrapper.setData({
                reportTitle: "Ein kurzer Titel"
            });

            expect(wrapper.find("span.hint").exists()).to.be.false;
            wrapper.destroy();
        });

        it("should find a hint if report title is invalid", async () => {
            const wrapper = factory.getShallowMount();

            await wrapper.setData({
                reportTitle: "Ein sehr sehr sehr sehr sehr mega großer langer Titel"
            });

            expect(wrapper.find("span.hint").exists()).to.be.true;
            expect(wrapper.find("span.hint").text()).to.be.equal("additional:modules.tools.cosi.templateManager.errors.invalidReportTitle");
            wrapper.destroy();
        });

        it("should not find a hint if selected areas name is valid", async () => {
            const wrapper = factory.getShallowMount();

            await wrapper.setData({
                selectedAreasName: "Die sieben Königslanden"
            });

            expect(wrapper.find("span.hint").exists()).to.be.false;
            wrapper.destroy();
        });

        it("should find a hint if selected areas name is invalid", async () => {
            const wrapper = factory.getShallowMount();

            await wrapper.setData({
                selectedAreasName: "Das Königreich von Berg und Grünem Tal"
            });

            expect(wrapper.find("span.hint").exists()).to.be.true;
            expect(wrapper.find("span.hint").text()).to.be.equal("additional:modules.tools.cosi.templateManager.errors.invalidSelectedAreasName");
            wrapper.destroy();
        });

        it("should not find a hint if author is valid", async () => {
            const wrapper = factory.getShallowMount();

            await wrapper.setData({
                author: "George R. R. Martin"
            });

            expect(wrapper.find("span.hint").exists()).to.be.false;
            wrapper.destroy();
        });

        it("should find a hint if author is invalid", async () => {
            const wrapper = factory.getShallowMount();

            await wrapper.setData({
                author: "George Raymond Richard Martin from Bayonne"
            });

            expect(wrapper.find("span.hint").exists()).to.be.true;
            expect(wrapper.find("span.hint").text()).to.be.equal("additional:modules.tools.cosi.templateManager.errors.invalidAuthor");
            wrapper.destroy();
        });
    });

    describe("Computed", () => {
        it("should set 'isReportTitleValid' to true, if 'reportTitle' was changed", async () => {
            const wrapper = factory.getShallowMount();

            await wrapper.setData({
                reportTitle: "Ein kurzer Titel"
            });
            expect(wrapper.vm.isReportTitleValid).to.be.true;
            wrapper.destroy();
        });

        it("should set 'isReportTitleValid' to false, if 'reportTitle' was changed", async () => {
            const wrapper = factory.getShallowMount();

            await wrapper.setData({
                reportTitle: "Ein sehr sehr sehr sehr sehr mega großer langer Titel"
            });
            expect(wrapper.vm.isReportTitleValid).to.be.false;
            wrapper.destroy();
        });

        it("should set 'isSelectedAreasNameValid' to true, if 'selectedAreasName' was changed", async () => {
            const wrapper = factory.getShallowMount();

            await wrapper.setData({
                selectedAreasName: "Die sieben Königslanden"
            });
            expect(wrapper.vm.isSelectedAreasNameValid).to.be.true;
            wrapper.destroy();
        });

        it("should set 'isSelectedAreasNameValid' to false, if 'selectedAreasName' was changed", async () => {
            const wrapper = factory.getShallowMount();

            await wrapper.setData({
                selectedAreasName: "Das Königreich von Berg und Grünem Tal"
            });
            expect(wrapper.vm.isSelectedAreasNameValid).to.be.false;
            wrapper.destroy();
        });

        it("should set 'isAuthorValid' to true, if 'author' was changed", async () => {
            const wrapper = factory.getShallowMount();

            await wrapper.setData({
                author: "George R. R. Martin"
            });
            expect(wrapper.vm.isAuthorValid).to.be.true;
            wrapper.destroy();
        });

        it("should set 'isAuthorValid' to false, if 'author' was changed", async () => {
            const wrapper = factory.getShallowMount();

            await wrapper.setData({
                author: "George Raymond Richard Martin from Bayonne"
            });
            expect(wrapper.vm.isAuthorValid).to.be.false;
            wrapper.destroy();
        });
    });

    describe("User Interactions", () => {
        it("should call 'manageProgressBar', if user click the button to create the report", async () => {
            const wrapper = factory.getShallowMount(),
                buttonWrapper = wrapper.find("button"),
                stubManageProgressBarView = sinon.stub(wrapper.vm, "manageProgressBarView");

            await buttonWrapper.trigger("click");

            expect(stubManageProgressBarView.calledOnce).to.be.true;
            wrapper.destroy();
        });

        it("should set 'showProgressBar' to true, if user click the button to create the report", async () => {
            const wrapper = factory.getShallowMount(),
                buttonWrapper = wrapper.find("button");

            await buttonWrapper.trigger("click");

            expect(wrapper.vm.showProgressBar).to.be.true;
            wrapper.destroy();
        });
    });

    describe("methods", () => {
        describe("manageProgressBarView", () => {
            it("should set 'showProgressBar' to false", () => {
                const wrapper = factory.getShallowMount();

                wrapper.vm.manageProgressBarView(false);
                expect(wrapper.vm.showProgressBar).to.be.false;
                wrapper.destroy();
            });

            it("should emit 'toggleTemplateImport' with true, if 'showProgressBar' is false", () => {
                const wrapper = factory.getShallowMount();

                wrapper.vm.manageProgressBarView(false);
                expect(wrapper.emitted()).to.have.property("toggleTemplateImport");
                expect(wrapper.emitted()["toggleTemplateImport"][0]).to.deep.equal([true]);
                wrapper.destroy();
            });

            it("should set 'showProgressBar' to true", () => {
                const wrapper = factory.getShallowMount();

                wrapper.vm.manageProgressBarView(true);
                expect(wrapper.vm.showProgressBar).to.be.true;
                wrapper.destroy();
            });

            it("should emit 'toggleTemplateImport' with false, if 'showProgressBar' is true", () => {
                const wrapper = factory.getShallowMount();

                wrapper.vm.manageProgressBarView(true);
                expect(wrapper.emitted()).to.have.property("toggleTemplateImport");
                expect(wrapper.emitted()["toggleTemplateImport"][0]).to.deep.equal([false]);
                wrapper.destroy();
            });

            it("should call 'createReport', if 'showProgressBar is true", () => {
                const wrapper = factory.getShallowMount(),
                    stubCreateReport = sinon.stub(wrapper.vm, "createReport");

                wrapper.vm.manageProgressBarView(true);
                expect(stubCreateReport.calledOnce).to.be.true;
                wrapper.destroy();
                sinon.restore();
            });
        });
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
