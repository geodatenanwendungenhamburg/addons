<script>
import ButtonGroup from "@shared/modules/buttons/components/ButtonGroup.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";

export default {
    name: "PotentialDamagedBuilding",
    components: {
        ButtonGroup,
        InputText
    },
    data () {
        return {};
    },
    computed: {},
    methods: {}
};
</script>

<template lang="html">
    <div>
        {{ $t("additional:modules.potentialDamagedBuilding.description") }}
        <h4>
            {{ $t("additional:modules.potentialDamagedBuilding.building_attributes") }}
        </h4>
        <ButtonGroup
            :buttons="[{name: 'Gebäude'}, {name: 'Unterirdische Bauwerke'}]"
            group="building_attributes"
        />
        <h4>
            {{ $t("additional:modules.potentialDamagedBuilding.overview") }}
        </h4>
        <div class="d-flex justify-content-center flex-wrap gap-5">
            <div class="read-only-card rounded p-3 text-center">
                <span class="value fs-2 fw-bold">3</span>
                <br>
                <span>Schadenspotenzialklasse</span>
                <br>
                <span class="comment">aktuell verwendet  </span>
                <i class="bi bi-info-circle" />
            </div>
            <div class="read-only-card rounded p-3 text-center">
                <span class="value fs-4 fw-bold">10.03.2025</span>
                <br>
                <span>Aktualisierungsdatum</span>
                <br>
                <span class="comment">letzte Aktualisierung  </span>
                <i class="bi bi-info-circle" />
            </div>
            <div class="read-only-card rounded p-3 text-center">
                <span class="value fs-2 fw-bold">4</span>
                <br>
                <span>Schadenspotenzialklasse</span>
                <br>
                <span class="comment">ALKIS-basiert abgeleitet  </span>
                <i class="bi bi-info-circle" />
            </div>
        </div>
        <h4 class="blue">
            <i class="bi bi-pencil-fill" />
            Daten aktualisieren – Gebäude
        </h4>
        <div class="d-flex flex-wrap gap-3">
            <div class="card shadow">
                <div class="card-body">
                    <h5 class="card-title">
                        Angepasste Schadenspotenzialklasse
                    </h5>
                    <span>
                        Die letzte Eingabe der ortsspezifischer Werte für die angepasste Schadenspotenzialklasse pro Objekt oder Fläche.
                    </span>
                    <InputText
                        id="angepasste-schadenspotenzialklasse"
                        type="number"
                        label="nfdv"
                        placeholder="jsbajks"
                    />
                </div>
            </div>
            <div class="card shadow">
                <div class="card-body">
                    kjbvfs
                </div>
            </div>
        </div>
        <div class="card shadow">
            <div class="card-body">
                kjbvfs
            </div>
        </div>
        <h4 class="blue">
            <i class="bi bi-clipboard-data" />
            Informationen zum Schadenspotenzial – Gebäude
        </h4>
    </div>
</template>

<style lang="scss" scoped>
    .read-only-card {
        background-color: $primary;
        width: 199px;
        height: 112px;
        .value {
            color: $secondary;
            font-size: 24px;
        }
        .comment {
            color: $dark-grey;
            font-size: 11px;
        }
    }
    h4.blue {
        color: $secondary;
        font-weight: 700;
    }
    h5.card-title {
        color: $secondary;
        font-size: 14px;
        font-weight: 700;
    }
</style>

