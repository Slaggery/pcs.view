<template>
    <v-container fluid>
        <v-row>
            <v-col cols="3">
                <v-btn color="orange" @click="backToList" dark>Вернуться в список</v-btn>
            </v-col>
            <v-col cols="9" v-if="userData !== null" class="text-right">
                {{ userData.NAME }} {{ userData.LAST_NAME }}, {{ userData.WORK_POSITION }} | {{ reportDate | humanizeDate }}
                <br>Закончите заполнение до: {{this.finalDateTime | humanizeServerTime }}
            </v-col>
        </v-row>
        <h2>Ведомость учета рабочего времени</h2>
        <v-row>
            <v-col cols="3">
                <v-text-field type="date" dense v-model="reportDate" :disabled="true" :min="minDate"
                              label="Дата отчета"></v-text-field>
            </v-col>
            <v-col cols="3">
                <v-select v-model="direction" dense :items="directions" label="Направление"
                          placeholder="Выберите направление" :disabled=true></v-select>
            </v-col>
            <v-col cols="3" class="text-center">
                <v-btn color="success" :disabled="disableEditMode" small
                       @click.stop="openAddDialog(authorData.value)">Добавить проект
                </v-btn>
            </v-col>
        </v-row>
        <v-row>
            <v-col cols="12">
                <v-data-table
                        v-if="authorData !== null"
                        :headers="computedHeaders"
                        :items="projects"
                        sort-by="project"
                        :items-per-page="100"
                        hide-default-footer
                        group-by="employee"
                >
                    <template v-slot:item.actions="{item}">
                        <v-btn small icon @click="deleteItem(item)" :disabled="disableEditMode">
                            <v-icon small>mdi-delete</v-icon>
                        </v-btn>
                    </template>
                    <template v-slot:group.header="{ group, isOpen, toggle, items }">
                        <td class="yellow darken-2 pt-2 pb-2" :colspan="headers.length">
                            <b>ФИО:</b> {{authorData.text}} <b>должн.:</b> {{authorData.job}}
                            <b>Рук:</b> {{authorData.boss}}
                        </td>
                    </template>

                </v-data-table>
            </v-col>

            <v-col cols="6" class="offset-3">
                <v-textarea :disabled="disableEditMode" v-model="comment" outlined dense label="Комментарий"
                            background-color="white" placeholder="Введите комментарий"></v-textarea>
            </v-col>

            <v-col cols="12" v-if="mode !== 'user'" class="text-center">
                <v-btn color="success" class="mr-2" @click="agree" :disabled="disableBossEditMode">Согласовать</v-btn>
                <v-btn color="error" class="ml-2" @click="returnReport" :disabled="disableBossEditMode">Вернуть на доработку</v-btn>
            </v-col>
            <v-col cols="12" v-else class="text-right">
                <v-btn @click="sendReport" color="info" :disabled="disableEditMode">Отправить отчет на проверку!</v-btn>
            </v-col>

        </v-row>


        <v-dialog v-model="addDialog" persistent width="500">
            <v-card>
                <v-card-title class="headline grey lighten-2" primary-title>
                    Выбери проект
                </v-card-title>

                <v-card-text>
                    <v-row>
                        <v-col cols="12">
                            <v-autocomplete :items="projectsFromAPI" v-model="itemInEditor.project"
                                            :loading="projectsLoading"
                                            placeholder="начните вводить название проекта"></v-autocomplete>
                        </v-col>
                        <v-col cols="3">
                            <v-text-field type="number" min="0" v-model="itemInEditor.workhours"
                                          label="Часы норм."></v-text-field>
                        </v-col>
                        <v-col cols="4">
                            <v-text-field type="number" min="0" v-model="itemInEditor.overworkhours"
                                          label="Часы переработки."></v-text-field>
                        </v-col>
                        <v-col cols="5">
                            <v-text-field type="number" min="0" v-model="itemInEditor.otheraccruals"
                                          label="Прочие начисления, руб."></v-text-field>
                        </v-col>
                    </v-row>
                </v-card-text>

                <v-divider></v-divider>

                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" text @click="addDialog = false">Отмена</v-btn>
                    <v-btn color="primary" text :disabled="disableAddRowButton" @click="saveProjectRow">Добавить</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

    </v-container>
</template>

<script>

    import moment from 'moment'

    export default {
        name: 'WorkTimeReportView',
        data: function () {
            return {
                searchEmployee: null,
                searchProject: null,
                reportID: null,
                userID: null,
                mode: null,
                comment: null,
                finalDateTime: null,
                userData: null,
                authorData: null,
                reportStatus: null,
                employeeLoading: false,
                projectsLoading: false,
                itemInEditor: {employee: null, project: null, workhours: 0, overworkhours: 0, otheraccruals: 0},
                defaultItemInEditor: {employee: null, project: null, workhours: 0, overworkhours: 0, otheraccruals: 0},
                addDialog: false,

                projects: [],
                headers: [
                    {text: 'Сотрудник', value: 'employee'},
                    {text: 'Проект', value: 'project'},
                    {text: 'Часы в раб. время', value: 'workhours'},
                    {text: 'Часы переработки', value: 'overworkhours'},
                    {text: 'Прочие начисления, руб.', value: 'otheraccruals'},
                    {text: 'Действия', value: 'actions'},
                ],
                selectedEmployee: [],
                defaultSelectedEmployee: [],
                emplToReport: null,
                employee: [],
                direction: 'pir',
                reportDate: moment().format('YYYY-MM-DD'),
                returnedTimer: null,
                minDate: moment().subtract(4, 'days').format('YYYY-MM-DD'),
                directions: [
                    {text: 'ПИР', value: 'pir'},
                    {text: 'СМО', value: 'smo'},
                ],
                projectsFromBx: [],
            }
        },
        filters: {
            humanizeDate(val) {
                return moment(val).format('DD.MM.YYYY')
            },
            humanizeServerTime(val) {
                return moment(val, 'YYYY-MM-DD[ ]kk:mm:ss').add(11, 'hours').format('DD.MM.YYYY kk:mm')
            }
        },
        computed: {
            disableReturnButton() {
                return this.comment === null || this.comment.length < 3
            },
            computedHeaders() {
                let headers = this.headers.map(hdr => {
                    if (this.mode !== 'user') {
                        return hdr
                    } else {
                        return hdr
                    }
                })
                console.log('this.mode', this.mode)
                return headers
            },
            disableEditMode() {
                let edit = false

                if(this.mode === 'user') {
                    edit = this.reportStatus === 'agree'
                        || this.reportStatus === 'late'
                } else {
                    edit = this.reportStatus === 'agree'
                }
                return edit
            },
            disableBossEditMode() {
                return (this.reportStatus !== null
                    && this.reportStatus !== 'creation'
                    && this.reportStatus !== 'submitted'
                    && this.reportStatus !== 'late'
                    && this.reportStatus !== 'returned')
            },
            disableReportDateField() {
                return this.reportStatus !== null && this.reportStatus !== 'creation'
            },
            employeeFromAPI() {
                return this.employee.map(empl => empl)
            },
            projectsFromAPI() {
                return this.projectsFromBx.map(project => project)
            },
            filteredProject: function () {
                let emplId = this.itemInEditor.employee //1

                let projectsInTable = this.projects.filter(p => +(p.employee) === +(emplId)).map(p => +(p.projectId)) // [123, 4324, 46546]

                //TODO: Подставляем значения проектов из Б24

                let filteredProjects = this.projectsFromBx.filter(p => projectsInTable.indexOf(+(p.value)) < 0)

                return filteredProjects
            },
            disableAddRowButton: function () {
                return this.itemInEditor.project === null
                    || this.itemInEditor.workhours < 0
                    || this.itemInEditor.overworkhours < 0
            },
            disableAddEmployeeButton: function () {
                return this.direction === null || this.emplToReport === null || (this.projects.length > 0 && this.direction === 'pir')
            }
        },
        watch: {
            searchEmployee(val) {
                // Items have already been loaded
                //if (this.employeeFromAPI.length > 0) return
                if (val === null) return
                if (val.length < 3) return
                // Items have already been requested
                if (this.employeeLoading) return

                this.employeeLoading = true

                // Lazily load input items
                this.$http.get(`${this.$store.getters.bxapi}pcs.reports.employye.list?name=${val}`)
                    .then(r => {
                        this.employee = r.data.result.map(empl => {
                            let newEmpl = {
                                text: empl.name,
                                value: empl.id,
                                boss: empl.boss,
                                job: empl.job
                            }
                            return newEmpl
                        })
                    }).catch(err => {
                    console.log('get empl err', err)
                })
                    .finally(() => {
                        this.employeeLoading = false
                    })
            },
            searchProject(val) {
                // Items have already been loaded
                //if (this.employeeFromAPI.length > 0) return
                //if (val === null) return
                //if (val.length < 3) return
                // Items have already been requested
                if (this.projectsLoading) return

                this.projectsLoading = true

                // Lazily load input items
                this.$http.get(`${this.$store.getters.bxapi}pcs.reports.projects.list?name=`)
                    .then(r => {
                        this.projectsFromBx = r.data.result.map(p => {
                            let item = {text: p.name, value: p.id}
                            return item
                        })
                    }).catch(err => {
                    console.log('get empl err', err)
                })
                    .finally(() => {
                        this.projectsLoading = false
                    })
            },

        },
        methods: {
            getProjects: async function () {
                try {
                    const r = await this.$http.get(`${this.$store.getters.bxapi}pcs.reports.projects.list?name=`)
                    this.projectsFromBx = r.data.result.map(p => {
                        let item = {text: p.name, value: p.id}
                        return item
                    })
                } catch (e) {
                    console.log('get reports err', e)
                }
            },
            backToList: async function () {
                this.$router.push(`/reports/worktime?mode=${this.mode}`)
            },
            getData: async function () {
                if (this.reportID !== null && +(this.reportID) !== 0) {
                    try {
                        const r = await this.$http.get(`${this.$store.getters.bxapi}pcs.reports.get?id=${this.reportID}&mode=full&userMode=${this.mode}&type=timeReport`)
                        console.log('report from bx:', r.data.result)
                        let jsonData = JSON.parse(r.data.result.UF_DATA)
                        this.selectedEmployee = jsonData.employee || [this.authorData]
                        this.reportStatus = r.data.result.UF_STATUS.VALUE || null
                        this.reportDate = r.data.result.UF_DATE || null
                        this.direction = r.data.result.UF_DIRECTION.VALUE || null
                        this.userData = r.data.result.UF_USER || null
                        this.finalDateTime = moment(r.data.result.UF_FINAL_DATE, 'YYYY-MM-DD kk:mm:ss').add(11, 'hours').format('YYYY-MM-DD kk:mm:ss') || null/// Y-m-d H:i:s
                        this.comment = jsonData.comment || null
                        this.projects = jsonData.table || []
                        this.returnedTimer = jsonData.returnedTimer || null
                    } catch (e) {
                        console.log('get report data err', e)
                    }
                }
            },
            saveReport: async function (status = 'creation', finalTime = null) {
                if (this.reportStatus !== null && status === 'creation') status = this.reportStatus

                let report = {
                    type: "worktime",
                    report_id: null,
                    direction: this.direction,
                    status: status,
                    date: moment(this.reportDate).format('DD.MM.YYYY'),
                    data: JSON.stringify({
                        table: this.projects,
                        employee: [this.authorData],
                        comment: this.comment,
                        returnedTimer: this.returnedTimer
                    }),
                    user: this.authorData.value
                }

                if (finalTime !== null) report.finalDateTime = finalTime
                if (+(this.reportID) !== 0) report.report_id = this.reportID

                //let sendAccept = false

                if (status === 'submitted') {
                    //TODO: Запросить время и сравнить его с допустимым временем сохранения отчета
                    //pcs.reports.gettime
                    let time = null
                    try {
                        const r = await this.$http.get(`${this.$store.getters.bxapi}pcs.reports.gettime`)
                        time = moment(r.data.result, 'YYYY-MM-DD kk:mm:ss').add(11, 'hours').format('YYYY-MM-DD[T]kk:mm:ss')
                    } catch (e) {
                        console.log('savereport err', e)
                    }

                    let timeToReport = moment(this.finalDateTime, 'YYYY-MM-DD kk:mm:ss').add(11, 'hours')
                    //console.log('timeToReport', timeToReport.format('YYYY-MM-DD[T]kk:mm:ss'))
                    let diff = moment(time).diff(timeToReport, 'minutes')

                    console.log({
                        rdate: timeToReport.format('YYYY-MM-DD kk:mm:ss'),
                        now: moment().format('YYYY-MM-DD kk:mm:ss'),
                        diff
                    })

                    if (diff > 0) {
                        alert('Вы опоздали!')
                        //TODO: изменить статус на late
                        status = 'late'
                        report.status = 'late'
                    }
                }

                try {
                    const r = await this.$http.post(`${this.$store.getters.bxapi}pcs.reports.save`, report)
                    if (r.data.result.mode === 'create') {
                        this.reportID = r.data.result.result.ID
                        this.reportStatus = status
                    }
                    console.log('report saved', r.data)
                } catch (e) {
                    console.log('savereport err', e)
                }

            },
            projectsCosts: async function(){
                try {
                    let report = {
                        direction: 'pir',
                        data: this.projects,
                        date: this.reportDate
                    }
                    console.log('projectsCosts', report)
                    const r = await this.$http.post(`${this.$store.getters.bxapi}pcs.reports.projectsCostsList`, report)
                    console.log('projectCostResult: ', r.data.result)
                } catch (e) {
                    console.log('projectsCosts error', e)
                }
            },
            returnReport: async function () {
                let time = null
                try {
                    const r = await this.$http.get(`${this.$store.getters.bxapi}pcs.reports.gettime`)
                    time = moment(r.data.result, 'YYYY-MM-DD kk:mm:ss').add(3, 'hours').format('DD.MM.YYYY kk:mm:ss')
                } catch (e) {
                    console.log('savereport err', e)
                }
                await this.saveReport('returned', time)
                this.backToList()
            },
            agree: async function () {
                await this.saveReport('agree')
                await this.projectsCosts()
                this.backToList()
            },
            sendReport: async function () {
                await this.saveReport('submitted')
                this.backToList()
            },
            deleteItem: function (item) {
                this.projects.splice(item.index, 1)
                this.projects = this.projects.map((row, index) => {
                    row.index = index
                    return row
                })
                this.saveReport()
            },
            saveProjectRow: function () {
                let newItem = Object.assign({}, this.itemInEditor)
                if (+(this.itemInEditor.project) > 0) {
                    let filteredProjects = this.projectsFromBx.filter(p => +(p.value) === +(newItem.project))
                    console.log('filtered', filteredProjects)
                    newItem.project = filteredProjects[0].text
                    newItem.projectId = filteredProjects[0].value

                    let employee = this.authorData
                    this.selectedEmployee.push(employee)
                    this.projects.push(newItem)
                    this.projects = this.projects.map((row, index) => {
                        row.index = index
                        return row
                    })
                    this.addDialog = false
                    this.itemInEditor = Object.assign({}, this.defaultItemInEditor)
                    this.saveReport()
                } else {
                    alert('Заполни проект!!!')
                }
            },
            openAddDialog: function (id) {
                this.itemInEditor.employee = id
                this.addDialog = true
            },
            getUserMode: async function () {
                try {
                    const r = await this.$http.get(`${this.$store.getters.bxapi}pcs.reports.getUserMode?id=${this.userID}&type=work`)
                    //this.reports = r.data.result
                    console.log('user', this.userID)
                    this.mode = r.data.result
                    console.log('mode', r.data.result)
                } catch (e) {
                    console.log('get Reports err', e)
                }
            },
            getAuthorData: async function () {
                try {
                    console.log('pre author data', {
                        id: this.userData.ID
                    })
                    const r = await this.$http.get(`${this.$store.getters.bxapi}pcs.reports.getDefaultEmployee?id=${this.userData.ID}`)
                    console.log('get authorData', r.data.result)
                    this.authorData = r.data.result
                } catch (e) {
                    console.log('get default employee error', e)
                }
            },
        },
        async mounted() {
            /*this.userID = 3
            this.reportID = this.$route.params.id
            await this.getUserMode()
            await this.getData()
            await this.getAuthorData()*/

            if (window.BX24) {
                let BX24 = window.BX24
                let self = this
                BX24.init(async function () {
                    BX24.callMethod('user.current', {}, async function (res) {
                        self.userID = res.data().ID
                        self.reportID = self.$route.params.id
                        await self.getUserMode()
                        await self.getProjects()
                        await self.getData()
                        await self.getAuthorData()
                    });
                })
            }
        }
    }
</script>

<style scoped>

</style>