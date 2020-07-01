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
        <h2 v-if="this.mode === 'user'">Мои ведомости учета рабочего времени</h2>
        <h2 v-else>Ведомости учета рабочего времени</h2>
        <v-data-table
                @click:row="viewItem"
                :items="reports"
                :group-desc="true"
                group-by="UF_DATE"
                :headers="computedHeaders"
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
        </v-data-table>


    </v-container>
</template>

<script>
    import moment from 'moment'

    export default {
        name: 'WorkTimeReport',
        data: function () {
            return {
                loaderDialog: false,
                userID: null,
                reportsLoader: false,
                reports: [],
                mode: null,
                headers: [
                    //{ text: 'ID', value: 'ID' },
                    //{text: 'Автор', value: 'UF_USER'},
                    {text: 'Направление', value: 'DIRECTION', sortable: false},
                    {text: 'Дата', value: 'UF_DATE'},
                    {text: 'Статус', value: 'STATUS', sortable: false},
                    {text: 'Действия', value: 'actions', sortable: false},
                ],
            }
        },
        computed: {
            computedHeaders: function () {
                let headers = this.headers
                if (this.$route.query.mode === 'pir' || this.$route.query.mode === 'smo') headers.push({
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
            viewItem: function (data) {
                console.log('view item', data)
                if(data.UF_DIRECTION.VALUE === 'smo') {
                    let mode
                    if(this.mode === 'superBoss') {
                        mode = 'smo'
                    } else {
                        mode = this.mode
                    }
                    this.$router.push(`/reports/worktime/smo/${data.ID}?mode=${mode}`)
                } else {
                    let mode
                    if(this.mode === 'superBoss') {
                        mode = 'pir'
                    } else {
                        mode = this.mode
                    }
                    this.$router.push(`/reports/worktime/pir/${data.ID}?mode=${mode}`)
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
                        type: 'timeReport',
                        userMode: this.mode
                    }

                    if (this.mode === 'user') params.user = this.userID
                    console.log('params', params)

                    const r = await this.$http.post(`${this.$store.getters.bxapi}pcs.reports.list`, params)
                    this.reports = r.data.result
                    console.log('reports', r.data)
                } catch (e) {
                    console.log('get Reports err', e)
                }
                this.reportsLoader = false
                this.loaderDialog = false
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
        },
        async mounted() {
            /*this.userID = 9
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
                    });
                })
            }
        }
    }
</script>

<style scoped>

</style>