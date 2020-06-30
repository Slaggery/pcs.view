<template>
    <v-container fluid>
        <v-row>
            <v-col cols="2">
                <v-text-field dense label="Дата начала" v-model="startDate" type="date"></v-text-field>
            </v-col>
            <v-col cols="2">
                <v-text-field dense label="Дата окончания" v-model="finalDate" type="date"></v-text-field>
            </v-col>
            <v-col cols="3" class="text-center">
                <v-btn color="info" @click="createReport" :disabled="startDate === null || finalDate === null">Сформировать</v-btn>
            </v-col>
            <v-col cols="5">
                <v-select
                        :items="projects"
                        label="Проект(ы)"
                        multiple
                        item-text="name"
                        item-value="id"
                        v-model="projectFilter"
                        dense
                >
                </v-select>
            </v-col>
        </v-row>
        <v-row>
            <v-col cols="6">
                <v-text-field v-model="search" append-icon="mdi-magnify" label="Поиск" single-line hide-details></v-text-field>
            </v-col>
            <v-col cols="6">
                <v-btn @click="xlsx" small color="success"><v-icon small class="mr-2">mdi-file-table</v-icon> Сохранить отчет</v-btn>
            </v-col>
            <v-col cols="12">
                <v-data-table
                        :search="search"
                        ref="xlreport"
                        :headers="headers"
                        :items="filteredItems"
                        :items-per-page="15"
                        class="elevation-1">

                    <template v-slot:body.append>
                        <tr class="yellow darken-2">
                            <th colspan="2">
                                Всего:
                            </th>
                            <th>
                                {{total.salaryRegular}}
                            </th>
                            <th>
                                {{total.salaryPlus}}
                            </th>
                            <th>
                                {{total.otherProfits}}
                            </th>
                            <th>
                                {{total.Summary}}
                            </th>
                        </tr>
                    </template>
                </v-data-table>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>
    import XLSX from 'xlsx'
    import moment from 'moment'
    export default {
        name: "SalaryReport",
        data: function () {
            return {
                search: null,
                headers: [
                    {text: "ФИО сотрудника", value: 'employee'},
                    {text: "Проект", value: 'project'},
                    {text: 'Сумма з/платы', value: 'salaryRegular'},
                    {text: 'Сумма сверхурочной з/платы', value: 'salaryPlus'},
                    {text: 'Прочие начисления', value: 'otherProfits'},
                    {text: 'ИТОГОВАЯ СУММА', value: 'Summary'},
                ],
                items: [],
                projects: [],
                projectFilter: [],
                startDate: null,
                finalDate: null,
            }
        },
        computed: {
            filteredItems() {
                if (this.projectFilter.length > 0) {
                    console.log('pf', this.projectFilter)
                    return this.items.filter(item => this.projectFilter.indexOf(item.projectId) > -1)
                }
                return []
            },
            total() {
                return {
                    salaryRegular: this.filteredItems.reduce((summ, current) => +summ + +current.salaryRegular, 0),
                    salaryPlus: this.filteredItems.reduce((summ, current) => +summ + +current.salaryPlus, 0),
                    otherProfits: this.filteredItems.reduce((summ, current) => +summ + +current.otherProfits, 0),
                    Summary: this.filteredItems.reduce((summ, current) => +summ + +current.Summary, 0)
                }
            }
        },
        methods: {
            xlsx: function doit(type, fn, dl) {
                let elt = document.getElementsByTagName('table')[0]
                console.log('elt', elt)
                let wb = XLSX.utils.table_to_book(elt, {sheet:"Main"})
                return dl ?
                    XLSX.write(wb, {bookType:type, bookSST:true, type: 'base64'}) :
                    XLSX.writeFile(wb, `SalaryReport_${moment().format('YYYY-MM-DD')}.xlsx`)
            },
            createReport: async function () {
                //Получаем все ведомости зарплаты за выбранный период
                try {
                    const r = await this.$http.post(`${this.$store.getters.bxapi}pcs.reports.list`, {
                        type: 'timeReport',
                        mode: 'full',
                        startDate: moment(this.startDate).format('DD.MM.YYYY'),
                        endDate: moment(this.finalDate).format('DD.MM.YYYY'),
                    })

                    let reports = r.data.result.map(r => {
                        r.UF_DATA = JSON.parse(r.UF_DATA)
                        return r
                    })

                    this.items = []

                    let preRows = []

                    for(let report of reports) {
                        let employee = report.UF_DATA.employee
                        console.log('empl', employee)
                        for(let i in report.UF_DATA.table) {
                            let filteredEmployee = employee.filter(e => +e.value === +report.UF_DATA.table[i].employee)
                            preRows.push({
                                employeeId: filteredEmployee[0].value,
                                employee: filteredEmployee[0].text,
                                project: report.UF_DATA.table[i].project,
                                projectId: +report.UF_DATA.table[i].projectId,
                                salaryRegular: +report.UF_DATA.table[i].workhours,
                                salaryPlus: +report.UF_DATA.table[i].overworkhours,
                                otherProfits: 0,
                                Summary: +report.UF_DATA.table[i].workhours + +report.UF_DATA.table[i].overworkhours,
                                type: report.UF_DIRECTION.VALUE,

                            })
                        }
                    }

                    preRows = preRows.map((el, index) => {
                        el.rowId = +index + 1
                        return el
                    })

                    const r2 = await this.$http.post(`${this.$store.getters.bxapi}pcs.reports.salary`, {
                        data: preRows.map((r, index) => {
                            let row = {
                                employeeid: r.employeeId,
                                type: r.type,
                                workhours: r.salaryRegular,
                                overworkhours: r.salaryPlus,
                                projectID: r.projectId,
                                rowId: r.rowId
                            }
                            return row
                        })
                    })

                    console.log('r2', r2.data.result)
                    console.log('preRows', preRows)


                    for(let i in preRows) {
                        let resultRow = r2.data.result.filter(row => +row.rowId === +preRows[i].rowId)
                        preRows[i].salaryPlus = resultRow[0].salaryPlus
                        preRows[i].salaryRegular = resultRow[0].salaryRegular
                        preRows[i].Summary = resultRow[0].Summary
                    }

                    this.items = preRows

                } catch (e) {
                    console.log('reportrs err:', e)
                }
                //Формируем список выстроенный по проектам



                //Подтягиваем данные о зарплате



                //Формируем итоговый спсиок
            },
            getProjects: async function () {
                try {
                    const r = await this.$http.get(`${this.$store.getters.bxapi}pcs.reports.projects.list`)
                    this.projects = r.data.result.map(p => {
                        p.id = +p.id
                        return p
                    })
                } catch (e) {
                    console.log('get projects err', e)
                }
            },
        },
        async mounted() {
            await this.getProjects()
        }
    }
</script>

<style scoped>

</style>