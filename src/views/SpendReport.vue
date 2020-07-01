<template>
    <v-container fluid>
        <v-dialog
                v-model="loaderDialog"
                hide-overlay
                persistent
                width="300"
        >
            <v-card
                    color="primary"
                    dark
            >
                <v-card-text>
                    Загрузка
                    <v-progress-linear
                            indeterminate
                            color="white"
                            class="mb-0"
                    ></v-progress-linear>
                </v-card-text>
            </v-card>
        </v-dialog>
        <h2 v-if="mode === 'user'">Мои ведомости по внутренним затратам на проекты</h2>
        <h2 v-else>Ведомости по внутренним затратам на проекты</h2>
        <v-row v-if="mode === 'pir' || mode === 'smo' || mode === 'superBoss'">
            <v-col cols="3">
                <v-select v-if="mode === 'superBoss'" v-model="direction" dense :items="directions" label="Направление"
                          placeholder="Выберите направление"></v-select>
            </v-col>
            <v-col cols="3" class="text-right">
                <v-btn @click="createReport" color="info" :disabled="createDisabled">Создать ведомость</v-btn>
            </v-col>
        </v-row>
        <v-data-table
                @click:row="viewItem"
                :items="reports"
                :group-desc="true"
                group-by="UF_DATE"
                :headers="computedHeaders"
                :items-per-page="30"
                :loading="reportsLoader"
                dense
        >
            <template v-slot:group.header="{ group, isOpen, toggle, items }">
                <td class="yellow darken-2 pt-2 pb-2" :colspan="headers.length">
                    <b>{{ group | humanizeDate }}</b>
                </td>
            </template>
            <template v-slot:item.UF_USER="{item}">
                {{ item.UF_USER.NAME }} {{ item.UF_USER.LAST_NAME }}, {{ item.UF_USER.WORK_POSITION }}
            </template>
            <template v-slot:item.actions="{item}">
                <v-btn small icon>
                    <v-icon small>mdi-eye-outline</v-icon>
                </v-btn>
            </template>
            <template v-slot:item.UF_DATE="{item}">
                {{ item.UF_DATE | humanizeDate }}
            </template>
            <template v-slot:item.STATUS="{item}">
                <v-chip small :color="statusColor(item.UF_STATUS.VALUE)">{{ item.UF_STATUS.TEXT }}</v-chip>
            </template>
            <template v-slot:item.DIRECTION="{item}">
                {{ item.UF_DIRECTION.TEXT }}
            </template>
            <template v-slot:item.comment="{item}">
                {{ JSON.parse(item.UF_DATA).comment }}
            </template>
        </v-data-table>

    </v-container>
</template>

<script>
    import moment from 'moment'

    export default {
        name: 'SpendReport',
        data: function () {
            return {
                loaderDialog:false,
                direction: null,
                directions: [
                    {text: 'ПИР', value: 'pir'},
                    {text: 'СМО', value: 'smo'},
                ],
                userID: null,
                reportsLoader: false,
                reports: [],
                mode: null,
                headers: [
                    //{ text: 'ID', value: 'ID' },
                    //{text: 'Автор', value: 'UF_USER'},
                    //{text: 'Проект', value: 'PROJECT'},
                    {text: 'Дата', value: 'UF_DATE'},
                    {text: 'Направление', value: 'DIRECTION', sortable: false},
                    {text: 'Статус', value: 'STATUS', sortable: false},
                    {text: 'Комментарий', value: 'comment', sortable: false},
                    {text: 'Действия', value: 'actions', sortable: false},
                ],
            }
        },
        computed: {
            createDisabled() {
                if (this.mode ==='superBoss') return this.direction === null;
            },
            computedHeaders: function () {
                let headers = this.headers
                let mode = this.mode === 'pir' || this.mode === 'smo' || this.mode === 'superBoss'
                if (!!mode) headers.unshift({
                    text: 'Автор',
                    value: 'UF_USER',
                    sortable: false
                })
                return headers
            }
        },
        filters: {
            humanizeDate(val) {
                return moment(val).format('DD.MM.YYYY')
            }
        },
        methods: {
            createReport: async function () {
                this.loaderDialog = true
                try {
                    let direction = this.mode
                    if (this.mode === 'superBoss') direction = this.direction

                    let params = {
                        type: 'spend',
                        user: this.userID,
                        direction: direction
                    }
                    console.log('created params', params)
                    const r = await this.$http.post(`${this.$store.getters.bxapi}pcs.reports.createDefault`, params)
                    console.log('created', r.data)
                    await this.getReports()
                } catch (e) {
                    console.log('create report err', e)
                }
                this.loaderDialog = false
            },
            viewItem: function (data) {
                console.log('view item', data)
                if (data.UF_DIRECTION.VALUE === 'smo') {
                    let mode
                    if(this.mode === 'superBoss') {
                        mode = 'smo'
                    } else {
                        mode = this.mode
                    }
                    this.$router.push(`/reports/spend/smo/${data.ID}?mode=${mode}`)
                } else {
                    let mode
                    if(this.mode === 'superBoss') {
                        mode = 'pir'
                    } else {
                        mode = this.mode
                    }
                    this.$router.push(`/reports/spend/pir/${data.ID}?mode=${mode}`)
                }
            },
            statusColor: function (status) {
                let color = 'grey'
                if (status === 'submitted') color = 'info'
                if (status === 'agree') color = 'success'
                if (status === 'creation') color = 'yellow'
                if (status === 'late') color = 'error'
                if (status === 'returned') color = 'orange darken-3'
                return color
            },
            getReports: async function () {
                this.reportsLoader = true
                this.loaderDialog = true
                try {
                    let params = {
                        userMode: this.mode,
                        type: 'spend'
                    }

                    if (this.mode === 'user') params.user = this.userID
                    console.log('params', params)
                    const r = await this.$http.post(`${this.$store.getters.bxapi}pcs.reports.list`, params)
                    this.reports = r.data.result
                    this.reports.sort((a, b) => a.UF_DATE < b.UF_DATE ? 1 : -1)
                    console.log('reports', r.data)
                } catch (e) {
                    console.log('get Reports err', e)
                }
                this.reportsLoader = false
                this.loaderDialog = false
            },
            getUserMode: async function () {
                try {
                    const r = await this.$http.get(`${this.$store.getters.bxapi}pcs.reports.getUserMode?id=${this.userID}&type=spend`)
                    //this.reports = r.data.result
                    console.log('user', this.userID)
                    this.mode = r.data.result
                    console.log('mode', r.data.result)
                } catch (e) {
                    console.log('get Reports err', e)
                }
            },
        },
        async mounted() {
            /*this.userID = 3
            await this.getUserMode()
            await this.getReports()*/
            if (window.BX24) {
                let BX24 = window.BX24
                let self = this

                BX24.init(async function () {

                    BX24.callMethod('user.current', {}, async function (res) {
                        console.log('user', res.data())
                        self.userID = res.data().ID
                        await self.getUserMode()
                        await self.getReports()
                    })
                    BX24.fitWindow((res) => {
                        console.log('fitwindow', res)
                    })
                })
            }
        }
    }
</script>

<style scoped>

</style>