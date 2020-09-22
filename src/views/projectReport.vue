<template>
    <v-container fluid>
        <v-row>
            <v-col cols="4">
                <v-autocomplete :items="projects" v-model="project"
                                :loading="projectsLoading" dense
                                item-value="id" item-text="name"
                                :search-input.sync="searchProject"
                                placeholder="начните вводить название проекта"></v-autocomplete>
            </v-col>
            <v-col cols="2">
                <v-text-field label="Общие затраты на проект" dense v-model="summedSpend" type="number"
                              min="0"></v-text-field>
            </v-col>
            <v-col cols="2">
                <v-text-field label="Коэфф" type="number" dense v-model="ratio" min="0"></v-text-field>
            </v-col>
            <v-col cols="2">
                <v-text-field label="НДС" type="number" dense v-model="taxes" min="0"></v-text-field>
            </v-col>
            <v-col cols="2">
                <v-btn color="info" @click="createReport" :disabled="disableCreateButton">Сформировать</v-btn>
            </v-col>
        </v-row>
        <v-row>
            <v-col cols="6">
                <v-text-field v-model="search" append-icon="mdi-magnify" label="Поиск" single-line hide-details></v-text-field>
            </v-col>
            <v-col cols="6">
                <v-btn @click="xlsx" small color="success">
                    <v-icon small class="mr-2">mdi-file-table</v-icon>
                    Сохранить отчет
                </v-btn>
            </v-col>

            <v-col cols="12">
                <v-data-table
                        :search="search"
                        :headers="headers"
                        group-by="typeExpenses"
                        :items="items"
                        :items-per-page="15"
                        class="elevation-1">
                    <template v-slot:group.header="{ group, isOpen, toggle, items }">
                        <td class="yellow darken-2 pt-2 pb-2" :colspan="headers.length">
                            <b>{{group}}</b> | Сумма затрат: {{ getSpendSumm(items) }}
                        </td>
                    </template>
                </v-data-table>
            </v-col>
        </v-row>
        <v-row>
            <v-col cols="12">
                <v-data-iterator
                        :items="calculate"
                        hide-default-footer
                >
                    <template v-slot:default="props">
                        <v-row>
                            <v-col
                                    v-for="(item, index) in props.items"
                                    :key="`itm${index}`"
                                    cols="12"
                                    sm="6"
                                    md="4"
                                    lg="3"
                            >
                                <v-card>
                                    <v-list dense>
                                        <v-list-item>
                                            <v-list-item-content>Итого затрат по проекту:</v-list-item-content>
                                            <v-list-item-content class="align-end">{{ item.totalSpend }}
                                            </v-list-item-content>
                                        </v-list-item>
                                        <v-list-item>
                                            <v-list-item-content>Сумма по договору общая:</v-list-item-content>
                                            <v-list-item-content class="align-end">{{ item.totalSumm }}
                                            </v-list-item-content>
                                        </v-list-item>
                                        <v-list-item>
                                            <v-list-item-content>Сумма по договору общая, без НДС:</v-list-item-content>
                                            <v-list-item-content class="align-end">{{ item.totalSummWOTaxes }}
                                            </v-list-item-content>
                                        </v-list-item>
                                        <v-list-item>
                                            <v-list-item-content>Общие затраты:</v-list-item-content>
                                            <v-list-item-content class="align-end">{{ item.spendGeneral }}
                                            </v-list-item-content>
                                        </v-list-item>
                                        <v-list-item>
                                            <v-list-item-content>Прибыль:</v-list-item-content>
                                            <v-list-item-content class="align-end">{{ item.profit }}
                                            </v-list-item-content>
                                        </v-list-item>
                                        <v-list-item>
                                            <v-list-item-content>Коэффицент прибыльности:</v-list-item-content>
                                            <v-list-item-content class="align-end">{{ item.profitRatio }}
                                            </v-list-item-content>
                                        </v-list-item>
                                    </v-list>
                                </v-card>
                            </v-col>
                        </v-row>
                    </template>
                </v-data-iterator>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
    import XLSX from "xlsx";
    import moment from "moment";

    export default {
        name: "projectReport",
        data: function () {
            return {
                search: null,
                projectsLoading: false,
                searchProject: null,
                project: null,
                projects: [],
                summedSpend: 0,
                contractSummWithOutTaxes: 0,
                ratio: 1.2,
                taxes: 20,
                headers: [
                    {text: "Вид затрат", value: 'typeExpenses'},
                    {text: "Раздел документации", value: 'typeDocumentation'},
                    {text: 'Исполнитель', value: 'assigned'},
                    {text: 'Стоимость общая', value: 'price'},
                    //{text: 'Итого по виду затрат', value: 'allExpenses'},
                    {text: 'Кол-во часов', value: 'hours'},
                    {text: 'Стои-мость часа', value: 'hoursPrice'},
                ],
                items: [],
                startDate: null,
                finalDate: null,
            }
        },

        computed: {
            disableCreateButton() {
                return this.summedSpend === null || this.ratio === null || this.project === null
            },
            calculate() {
                return [
                    {
                        totalSpend: +this.items.reduce((t, c) => +t + +c.price, 0),
                        totalSumm: +this.contractSummWithOutTaxes + (+this.contractSummWithOutTaxes * +this.taxes / 100),
                        totalSummWOTaxes: +this.contractSummWithOutTaxes,
                        spendGeneral: +this.summedSpend,
                        profit: +this.contractSummWithOutTaxes - +this.items.reduce((t, c) => +t + +c.price, 0) - +this.summedSpend,
                        profitRatio: (+this.contractSummWithOutTaxes - +this.items.reduce((t, c) => +t + +c.price, 0) - +this.summedSpend) / +this.contractSummWithOutTaxes,
                    }
                ]
            },
        },
        methods: {
            xlsx: function doit(type, fn, dl) {
                let elt = document.getElementsByTagName('table')[0]
                console.log('elt', elt)
                let wb = XLSX.utils.table_to_book(elt, {sheet: "Main"})
                console.log('wb:', wb)
                let newSheetData = {
                    cols: [{name: "A", key: 0}, {name: "B", key: 1}],
                    data: [
                        ["id", "name"],
                        [1, "sheetjs"],
                        [2, "js-xlsx"]
                    ]
                }

                let ws = XLSX.utils.json_to_sheet([
                    { A: "Параметр", B: "Значение" }
                ], {header: ["A", "B"], skipHeader: true})

                XLSX.utils.sheet_add_json(ws, [
                    { A: "Итого затрат по проекту", B: this.calculate[0].totalSpend },
                    { A: "Сумма по договору общая", B: this.calculate[0].totalSumm },
                    { A: "Сумма по договору общая, без НДС", B: this.calculate[0].totalSummWOTaxes },
                    { A: "Общие затраты", B: this.calculate[0].spendGeneral },
                    { A: "Прибыль", B: this.calculate[0].profit },
                    { A: "Коэффицент прибыльности", B: this.calculate[0].profitRatio },
                ], {skipHeader: true, origin: "A2"})
                console.log('ws', ws)
                XLSX.utils.book_append_sheet(wb, ws, "Total")
                return XLSX.writeFile(wb, `ProjectReport_${moment().format('YYYY-MM-DD')}.xlsx`)
            },
            getSpendSumm: function (items) {
                return +items.reduce((t, c) => +t + +c.price, 0)
            },
            getProjects: async function () {
                try {
                    const r = await this.$http.get(`${this.$store.getters.bxapi}pcs.reports.projects.list`)
                    this.projects = r.data.result.map(p => {
                        p.id = +p.id
                        return p
                    })
                    console.log('this projects', this.projects)
                } catch (e) {
                    console.log('get projects err', e)
                }
            },
            createReport: async function () {
                //pcs.reports.getCostReport
                try {
                    const r = await this.$http.post(`${this.$store.getters.bxapi}pcs.reports.getCostReport`, {
                        projectID: this.project
                    })
                    console.log('createReport', r.data.result)
                    this.items = r.data.result.spends.map(s => {
                        if(s.typeExpenses.indexOf('ФОТ') > -1) s.price = parseFloat((+s.price * +this.ratio).toFixed(2))
                        return s
                    })
                    this.contractSummWithOutTaxes = +(r.data.result.contractSummWithOutTaxes.replace(/\D/gi, ''))
                    console.log('cs', this.contractSummWithOutTaxes)
                } catch (e) {
                    console.log('getRows err', e)
                }
                console.log('create project')
            }
        },
        async mounted() {
            await this.getProjects()
        },
    }
</script>

<style scoped>

</style>