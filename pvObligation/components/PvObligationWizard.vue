<script>
import {markRaw} from "vue";
import {mapGetters} from "vuex";
import AccordionItem from "@shared/modules/accordion/components/AccordionItem.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import PvObligationWizardStepGrossArea from "./PvObligationWizardStepGrossArea.vue";
import PvObligationWizardStepNetArea from "./PvObligationWizardStepNetArea.vue";
import PvObligationWizardStepNetRestrictedAreas from "./PvObligationWizardStepNetRestrictedAreas.vue";
import PvObligationWizardStepPersonalInformation from "./PvObligationWizardStepPersonalInformation.vue";
import PvObligationWizardStepPersonalNotes from "./PvObligationWizardStepPersonalNotes.vue";
import PvObligationWizardStepGenerateReport from "./PvObligationWizardStepGenerateReport.vue";

export default {
    name: "PvObligationWizard",
    components: {
        AccordionItem,
        FlatButton,
        PvObligationWizardStepGrossArea,
        PvObligationWizardStepNetArea,
        PvObligationWizardStepNetRestrictedAreas,
        PvObligationWizardStepPersonalInformation,
        PvObligationWizardStepPersonalNotes,
        PvObligationWizardStepGenerateReport

    },
    data () {
        return {
            wizardSteps: [
                {
                    title: this.$t("additional:modules.pvObligation.wizard.step.grossArea.wizardTitle"),
                    isOpen: true,
                    isError: false,
                    component: markRaw(PvObligationWizardStepGrossArea),
                    componentFormData: null
                },
                {
                    title: this.$t("additional:modules.pvObligation.wizard.step.netArea.wizardTitle"),
                    isOpen: false,
                    isError: false,
                    component: markRaw(PvObligationWizardStepNetArea),
                    componentFormData: null
                },
                {
                    title: this.$t("additional:modules.pvObligation.wizard.step.netRestrictedAreas.wizardTitle"),
                    isOpen: false,
                    isError: false,
                    component: markRaw(PvObligationWizardStepNetRestrictedAreas),
                    componentFormData: null
                },
                {
                    title: this.$t("additional:modules.pvObligation.wizard.step.personalInformation.wizardTitle"),
                    isOpen: false,
                    isError: false,
                    component: markRaw(PvObligationWizardStepPersonalInformation),
                    componentFormData: null
                },
                {
                    title: this.$t("additional:modules.pvObligation.wizard.step.personalNotes.wizardTitle"),
                    isOpen: false,
                    isError: false,
                    component: markRaw(PvObligationWizardStepPersonalNotes),
                    componentFormData: null
                },
                {
                    title: this.$t("additional:modules.pvObligation.wizard.step.generateReport.wizardTitle"),
                    isOpen: false,
                    isError: false,
                    component: markRaw(PvObligationWizardStepGenerateReport),
                    componentFormData: null
                }
            ],
            showNextWizardStepButton: true,
            showPreviousWizardStepButton: false
        };
    },
    computed: {
        ...mapGetters("Modules/PvObligation", []),
        wizardStepsFormData () {
            const wizardStepsFormData = {};

            this.wizardSteps.forEach((step) => {
                wizardStepsFormData[step.component.name] = step.componentFormData;
            });

            return wizardStepsFormData;
        }
    },
    mounted () {
        this.collectFormDataFromWizardSteps();
    },
    methods: {
        wizardStepIsActive (componentName) {
            return this.wizardSteps.find((step) => step.isOpen)?.component?.name === componentName;
        },
        openWizardStep (event, index) {
            if (event.target.classList.contains("accordion-button") && !event.target.classList.contains("collapsed")) {
                this.wizardStepIsValid(
                    this.wizardSteps.find(item => item.isOpen)
                );

                this.wizardSteps.forEach((item) => {
                    item.isOpen = false;
                });

                this.wizardSteps[index].isOpen = true;

                this.updateWizardStepNavigationButtons();
                this.collectFormDataFromWizardSteps();

                if (this.wizardSteps.length === index + 1) {
                    this.validateAllStepsOnFinalStep();
                }
            }
        },
        nextWizardStep () {
            if (this.wizardStepIsValid()) {
                for (let i = 0; i < this.wizardSteps.length; i++) {
                    if (this.wizardSteps[i].isOpen === true) {
                        this.wizardSteps[i].isOpen = false;
                        this.wizardSteps[i + 1].isOpen = true;
                        this.updateWizardStepNavigationButtons();
                        this.collectFormDataFromWizardSteps();

                        if (this.wizardSteps.length === i + 2) {
                            this.validateAllStepsOnFinalStep();
                        }

                        break;
                    }
                }
            }
        },
        previousWizardStep () {
            if (this.wizardStepIsValid()) {
                for (let i = 0; i < this.wizardSteps.length; i++) {
                    if (this.wizardSteps[i].isOpen === true) {
                        this.wizardSteps[i].isOpen = false;
                        this.wizardSteps[i - 1].isOpen = true;

                        this.updateWizardStepNavigationButtons();
                        this.collectFormDataFromWizardSteps();

                        break;
                    }
                }
            }
        },
        updateWizardStepNavigationButtons () {
            for (let i = 0; i < this.wizardSteps.length; i++) {
                if (this.wizardSteps[i].isOpen === true) {
                    this.showNextWizardStepButton = i + 1 < this.wizardSteps.length;
                    this.showPreviousWizardStepButton = i > 0;
                    break;
                }
            }
        },
        collectFormDataFromWizardSteps () {
            this.wizardSteps.forEach(step => {
                const refArr = this.$refs[`ref${step.component.name}`],
                    instance = Array.isArray(refArr) ? refArr[0] : refArr;

                step.componentFormData = instance?.componentFormData;
            });
        },
        wizardStepIsValid (selectedStep = null) {
            const currentStep = selectedStep ?? this.wizardSteps.find(step => step.isOpen),
                refArr = this.$refs[`ref${currentStep.component.name}`],
                instance = Array.isArray(refArr) ? refArr[0] : refArr,
                stepIsValid = typeof instance?.componentFormDataValidate === "function"
                    ? instance.componentFormDataValidate()
                    : true;

            currentStep.isError = !stepIsValid;

            return stepIsValid;
        },
        handleWizardStepError (data) {
            const index = this.wizardSteps.findIndex(step => step.component.name === data.componentName);

            this.wizardSteps[index].isError = !data.isValid;
        },
        validateAllStepsOnFinalStep () {
            this.wizardSteps.forEach(step => this.wizardStepIsValid(step));
        }
    }
};
</script>

<template lang="html">
    <div id="pvObligationWizard">
        <div class="wizard">
            <div class="introduction">
                {{ $t("additional:modules.pvObligation.wizard.introduction") }}

                <a
                    href="https://geodienste.hamburg.de/lgv-config/about-files/datenschutzerklaerung.pdf"
                    target="_blank"
                >
                    {{ $t("additional:modules.pvObligation.wizard.introductionLinkPrivacyPolicy") }}
                </a>
            </div>

            <div class="steps">
                <AccordionItem
                    v-for="(step, index) in wizardSteps"
                    :id="`wizard-item-${index}`"
                    :key="index"
                    :title="step.title"
                    :is-open="step.isOpen"
                    :icon="step.isError ? 'bi-exclamation-triangle-fill' : ''"
                    :coloured-header="true"
                    :class="step.isError ? 'error' : ''"
                    @click="openWizardStep($event, index)"
                >
                    <component
                        :is="step.component"
                        v-if="step.component"
                        :ref="`ref${step.component.name}`"
                        :wizard-steps-form-data="wizardStepsFormData"
                        :wizard-step-is-active="wizardStepIsActive(step.component.name)"
                        @stepError="handleWizardStepError"
                    />
                </AccordionItem>
            </div>

            <div class="navigation">
                <FlatButton
                    v-if="showPreviousWizardStepButton"
                    :aria-label="$t('additional:modules.pvObligation.wizard.buttons.back')"
                    :text="$t('additional:modules.pvObligation.wizard.buttons.back')"
                    icon="bi-backspace"
                    @click="previousWizardStep()"
                />

                <div class="spacer-div" />

                <FlatButton
                    v-if="showNextWizardStepButton"
                    :aria-label="$t('additional:modules.pvObligation.wizard.buttons.next')"
                    :text="$t('additional:modules.pvObligation.wizard.buttons.next')"
                    icon="bi-backspace-reverse"
                    @click="nextWizardStep()"
                />
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    @import "~variables";

    :deep(.invalid-feedback) {
        display: block;
    }

    #pvObligationWizard {
        div.wizard {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            flex: 1;
            overflow: hidden;

            div.introduction {
                margin-bottom: 0.5rem;
            }

            div.steps {
                display: flex;
                flex-direction: column;
                justify-content: left;
                flex: 1;
                overflow: auto;

                :deep(.error button.accordion-button) {
                    color: $light_red;
                }
            }

            div.navigation {
                display: flex;
                flex-direction: row;
                justify-content: space-between;
                width: 100%;
                padding-top: 1rem;
            }
        }
    }
</style>

