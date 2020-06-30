<template>
    <!--<component class="compSense" v-if="componentName !== null" :is="componentName"></component>-->
    <div ref="mainbxblock">
        <v-row v-if="!editMode">
            <v-col cols="12" v-for="(doc, i) in docs" :key="i">
                <v-row>
                    <v-col cols="12" class="body-2 ma-0">
                        <span v-if="doc.fields.UF_NAME">{{ doc.fields.UF_NAME.value }}</span>&nbsp;
                        <span v-if="doc.fields.UF_NUMBER">№{{ doc.fields.UF_NUMBER.value }}</span>
                        от &nbsp; <span v-if="doc.fields.UF_DATE">{{ doc.fields.UF_DATE.value }}</span>
                    </v-col>
                    <v-col cols="12">
                        <div class="body-2" v-if="doc.fields.UF_LIST">{{doc.fields.UF_LIST.label}}:
                            <div class="pl-5" v-for="(item, ind) in doc.fields.UF_LIST.value" :key="ind">{{doc.fields.UF_LIST.value[ind]}}</div>
                        </div>
                        <div class="body-2" v-if="doc.fields.UF_TYPE">{{doc.fields.UF_TYPE.label}}: {{ doc.fields.UF_TYPE.value | type }}</div>
                        <div class="body-2" v-if="doc.fields.LINK">{{doc.fields.UF_SCAN.label}}: <a target="_blank" :href="doc.fields.LINK">Скачать</a></div>
                        <div class="body-2" v-if="doc.fields.UF_ORIG">{{doc.fields.UF_ORIG.label}}: {{ doc.fields.UF_ORIG.value | original }}</div>
                        <div class="body-2" v-if="doc.fields.UF_COMM">{{doc.fields.UF_COMM.label}}: <div class="body-2">{{ doc.fields.UF_COMM.value }}</div></div>
                    </v-col>
                </v-row>
            </v-col>
        </v-row>
        <v-row v-if="!!editMode">
            <v-col cols="12">
                <v-col cols="12" v-for="(doc, ind) in docs" :key="ind">
                    <div v-if="!docs[ind].uploaded && !docs[ind].deleted">
                        <div v-if="doc.fields.UF_NAME">
                            <v-text-field :label="doc.fields.UF_NAME.label" v-model="doc.fields.UF_NAME.value" background-color="white" color="blue lighten-1" outlined dense></v-text-field>
                        </div>
                        <div v-if="doc.fields.UF_NUMBER">
                            <v-text-field :label="doc.fields.UF_NUMBER.label" v-model="doc.fields.UF_NUMBER.value" background-color="white" color="blue lighten-1" outlined dense></v-text-field>
                        </div>
                        <div v-if="doc.fields.UF_DATE">
                            <v-text-field type="date" v-model="dateForEdit" :label="doc.fields.UF_DATE.label" background-color="white" color="blue lighten-1" outlined dense></v-text-field>
                        </div>
                        <div v-if="doc.fields.UF_LIST">
                            <v-text-field v-for="(item, i) in doc.fields.UF_LIST.value" :key="i" :label="doc.fields.UF_LIST.label" v-model="doc.fields.UF_LIST.value[i]" background-color="white" color="blue lighten-1" append-icon="mdi-delete-outline" @click:append="removeListItem(i, ind)" outlined dense></v-text-field>
                            <div class="text-center pb-5">
                                <v-btn color="info" small @click="addListElement(ind)">Добавить документ в список</v-btn>
                            </div>
                        </div>
                        <div v-if="doc.fields.UF_TYPE">
                            <v-select :items="contractTypes" :label="doc.fields.UF_TYPE.label" background-color="white" color="blue lighten-1" v-model="doc.fields.UF_TYPE.value" outlined dense></v-select>
                        </div>
                        <div v-if="doc.fields.UF_ORIG">
                            <v-select :items="contractOriginal" :label="doc.fields.UF_ORIG.label" background-color="white" color="blue lighten-1" outlined dense v-model="doc.fields.UF_ORIG.value"></v-select>
                        </div>
                        <div v-if="doc.fields.UF_SCAN && doc.ID !== null">
                            <v-file-input :label="doc.fields.UF_SCAN.label" v-model="doc.fileField" background-color="white" color="blue lighten-1" outlined dense></v-file-input>
                        </div>
                        <div v-if="doc.fields.UF_SCAN && doc.ID === null && !showChangeFile">
                            <v-file-input :label="doc.fields.UF_SCAN.label" v-model="doc.fileField" background-color="white" color="blue lighten-1" outlined dense></v-file-input>
                        </div>
                        <div v-if="doc.fields.UF_COMM">
                            <v-textarea :label="doc.fields.UF_COMM.label" v-model="doc.fields.UF_COMM.value" background-color="white" color="blue lighten-1" outlined dense></v-textarea>
                        </div>
                        <div v-if="doc.ID !== null" class="text-center">
                            <p><v-btn color="info" @click="updateItem(ind)">Обновить документ</v-btn></p>
                            <p><v-btn color="error" @click="deleteItem(ind)">Удалить документ</v-btn></p>
                        </div>
                        <div v-else class="text-center">
                            <p><v-btn color="info" @click="addItem(ind)">Создать документ</v-btn></p>
                        </div>
                    </div>
                    <v-alert v-if="!!docs[ind].uploaded" outlined type="success" text>Документ загружен. Не забудьте нажать кнопку
                        "Сохранить"!
                    </v-alert>
                    <v-alert v-if="!!docs[ind].deleted" outlined type="error" text>Документ Удален. Не забудьте нажать кнопку "Сохранить"!
                    </v-alert>
                </v-col>
                <div v-if="!!multiple" class="text-center">
                    <v-btn color="info" small @click="addMultiDoc">Добавить еще документ</v-btn>
                </div>
            </v-col>
        </v-row>

    </div>
</template>
<script>
  import moment from 'moment'

  const aTimeout = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  const callBx24Method = async (method, data) => {
    return new Promise((resolve, reject) => {
      if (window.BX24) {
        let BX24 = window.BX24
        BX24.callMethod(method, data, function (res) {
          if (res.error()) {
            reject(new Error(res.error()))
          }
          if (res.data()) {
            resolve(res.data())
          }
        })
      } else {
        reject(new Error('Модуль BX24 не найден'))
      }
    })
  }

  const fileToBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)

    reader.onload = () => resolve(reader.result
      .replace('data:', '')
      .replace(/^.+,/, ''))
    reader.onerror = error => reject(error)
  })

  export default {
    name: 'ModernHandler',
    components: {},
    data: () => ({
      docs: [],
      site: null,
      multiple: false,
      hlElementId: null,
      showChangeFile: false,
      editMode: false,
      deleted: false,
      dateForEdit: null,
      fileForEdit: null,
      componentName: null,
      uploaded: false,
      contractTypes: [
        { text: 'ПИР', value: 'PIR' },
        { text: 'СМР', value: 'SMR' },
        { text: 'Услуги', value: 'SERV' },
      ],
      contractOriginal: [
        { text: 'Есть', value: 1 },
        { text: 'Нет', value: 0 },
      ],
      docTypes: [
        {
          ID: null,
          title: 'Банковская гарантия',
          block: 'PCSBankGuarantee',
          fields: {
            UF_NAME: { label: 'Название', value: null },
            UF_NUMBER: { label: 'Номер', value: null },
            UF_DATE: { label: 'Дата', value: null },
            UF_SCAN: { label: 'Скан', value: null },
          },
          fileField: null,
          deleted: false,
          uploaded: false
        },
        {
          ID: null,
          title: 'Смета',
          block: 'PCSEstimate',
          fields: {
            UF_NAME: { label: 'Название', value: null },
            UF_NUMBER: { label: 'Номер', value: null },
            UF_DATE: { label: 'Дата', value: null },
            UF_SCAN: { label: 'Скан', value: null },
          },
          fileField: null,
          deleted: false,
          uploaded: false
        },
        {
          ID: null,
          title: 'Договор',
          block: 'PCSContracts',
          fields: {
            UF_NUMBER: { label: 'Номер', value: null },
            UF_DATE: { label: 'Дата', value: null },
            UF_SCAN: { label: 'Скан', value: null },
            UF_ORIG: { label: 'Оригинал', value: null },
            UF_COMM: { label: 'Комментарий', value: null },
            UF_TYPE: { label: 'Вид договора', value: null },
          },
          fileField: null,
          deleted: false,
          uploaded: false
        },
        {
          ID: null,
          title: 'Накладная курьерская',
          block: 'PCSDeliveryNote',
          fields: {
            UF_NUMBER: { label: 'Номер', value: null },
            UF_DATE: { label: 'Дата', value: null },
            UF_SCAN: { label: 'Скан', value: null },
            UF_NAME: { label: 'Название', value: null },
            UF_LIST: { label: 'Список документов', value: [null] },
          },
          fileField: null,
          deleted: false,
          uploaded: false
        },
        {
          ID: null,
          title: 'Акт выполненных работ',
          block: 'PCSCertificateOfCompletion',
          fields: {
            UF_NUMBER: { label: 'Номер', value: null },
            UF_DATE: { label: 'Дата', value: null },
            UF_SCAN: { label: 'Скан', value: null },
            UF_ORIG: { label: 'Оригинал', value: null },
            UF_COMM: { label: 'Комментарий', value: null },
            UF_NAME: { label: 'Наименование', value: null },
          },
          fileField: null,
          deleted: false,
          uploaded: false
        },
        {
          ID: null,
          title: 'Акт приема передач',
          block: 'pcsacceptanceact',
          fields: {
            UF_NAME: { label: 'Название', value: null },
            UF_NUMBER: { label: 'Номер', value: null },
            UF_DATE: { label: 'Дата', value: null },
            UF_SCAN: { label: 'Скан', value: null },
          },
          fileField: null,
          deleted: false,
          uploaded: false
        },
        {
          ID: null,
          title: 'Счет на оплату',
          block: 'pcsbillsforpay',
          fields: {
            UF_NAME: { label: 'Название', value: null },
            UF_NUMBER: { label: 'Номер', value: null },
            UF_DATE: { label: 'Дата', value: null },
            UF_SCAN: { label: 'Скан', value: null },
          },
          fileField: null,
          deleted: false,
          uploaded: false
        },
        {
          ID: null,
          title: 'Форма КС-14',
          block: 'pcsformks14',
          fields: {
            UF_NAME: { label: 'Название', value: null },
            UF_NUMBER: { label: 'Номер', value: null },
            UF_DATE: { label: 'Дата', value: null },
            UF_SCAN: { label: 'Скан', value: null },
          },
          fileField: null,
          deleted: false,
          uploaded: false
        },
        {
          ID: null,
          title: 'Форма КС-2',
          block: 'pcsformks2',
          fields: {
            UF_NAME: { label: 'Название', value: null },
            UF_NUMBER: { label: 'Номер', value: null },
            UF_DATE: { label: 'Дата', value: null },
            UF_SCAN: { label: 'Скан', value: null },
          },
          fileField: null,
          deleted: false,
          uploaded: false
        },
        {
          ID: null,
          title: 'Форма КС-3',
          block: 'pcsformks3',
          fields: {
            UF_NAME: { label: 'Название', value: null },
            UF_NUMBER: { label: 'Номер', value: null },
            UF_DATE: { label: 'Дата', value: null },
            UF_SCAN: { label: 'Скан', value: null },
          },
          fileField: null,
          deleted: false,
          uploaded: false
        },
        {
          ID: null,
          title: 'Счет-фактура',
          block: 'pcsinvoice',
          fields: {
            UF_NAME: { label: 'Название', value: null },
            UF_NUMBER: { label: 'Номер', value: null },
            UF_DATE: { label: 'Дата', value: null },
            UF_SCAN: { label: 'Скан', value: null },
          },
          fileField: null,
          deleted: false,
          uploaded: false
        },
        {
          ID: null,
          title: 'Платежное поручение',
          block: 'PCSPaymentOrder',
          fields: {
            UF_NAME: { label: 'Название', value: null },
            UF_NUMBER: { label: 'Номер', value: null },
            UF_DATE: { label: 'Дата', value: null },
            UF_SCAN: { label: 'Скан', value: null },
          },
          fileField: null,
          deleted: false,
          uploaded: false
        },
        {
          ID: null,
          title: 'Доверенность',
          block: 'PCSPowerOfAttorney',
          fields: {
            UF_NAME: { label: 'Название', value: null },
            UF_NUMBER: { label: 'Номер', value: null },
            UF_DATE: { label: 'Дата', value: null },
            UF_SCAN: { label: 'Скан', value: null },
          },
          fileField: null,
          deleted: false,
          uploaded: false
        },
        {
          ID: null,
          title: 'Акт сверки',
          block: 'PCSReconciliationAct',
          fields: {
            UF_NAME: { label: 'Название', value: null },
            UF_NUMBER: { label: 'Номер', value: null },
            UF_DATE: { label: 'Дата', value: null },
            UF_SCAN: { label: 'Скан', value: null },
          },
          fileField: null,
          deleted: false,
          uploaded: false
        },
        {
          ID: null,
          title: 'Накладная техническая',
          block: 'PCSTechnicalInvoice',
          fields: {
            UF_NAME: { label: 'Название', value: null },
            UF_NUMBER: { label: 'Номер', value: null },
            UF_DATE: { label: 'Дата', value: null },
            UF_SCAN: { label: 'Скан', value: null },
          },
          fileField: null,
          deleted: false,
          uploaded: false
        },
        {
          ID: null,
          title: 'Тех условия',
          block: 'PCSTechnicalSpecifications',
          fields: {
            UF_NAME: { label: 'Название', value: null },
            UF_NUMBER: { label: 'Номер', value: null },
            UF_DATE: { label: 'Дата', value: null },
            UF_SCAN: { label: 'Скан', value: null },
          },
          fileField: null,
          deleted: false,
          uploaded: false
        },
        {
          ID: null,
          title: 'Тех задание',
          block: 'PCSTechnicalTask',
          fields: {
            UF_NAME: { label: 'Название', value: null },
            UF_NUMBER: { label: 'Номер', value: null },
            UF_DATE: { label: 'Дата', value: null },
            UF_SCAN: { label: 'Скан', value: null },
          },
          fileField: null,
          deleted: false,
          uploaded: false
        },
      ]
    }),
    filters: {
      original: function (val) {
        return +(val) === 1 ? 'Есть' : 'нет'
      },
      type: function (val) {
        let result = 'ПИР'
        if (val === 'PIR') result = 'ПИР'
        if (val === 'SMR') result = 'СМР'
        if (val === 'SERV') result = 'Услуги'
        return result
      }
    },
    computed: {
      docType () {
        return this.docTypes.filter(t => t.block.toLowerCase() === this.componentName.toLowerCase())[0]
      }
    },
    methods: {
      removeListItem: function(listIndex, docIndex) {
        this.docs[docIndex].fields.UF_LIST.value.splice(listIndex, 1)
      },
      addMultiDoc: async function () {
        this.docs.push(JSON.parse(JSON.stringify(this.docType)))
        await this.setSize()
      },
      addListElement: async function (docIndex) {
        this.docs[docIndex].fields.UF_LIST.value.push(null)
        await this.setSize()
      },
      setSize: async function () {
        await aTimeout(30)
        let height = this.$refs.mainbxblock.clientHeight
        if (window.BX24) {
          let BX24 = window.BX24
          let bxSize = BX24.getScrollSize()
          await aTimeout(30)
          //console.log('resized pre', height)
          BX24.resizeWindow(bxSize.scrollWidth, height)
          await aTimeout(40)
          //console.log('resized fact', BX24.getScrollSize())
        }
      },
      addItem: async function (index) {
        let final = {}
        if (this.docs[index].fileField !== null) {
          //console.log('fileee', this.fileForEdit)
          let b64file = await fileToBase64(this.docs[index].fileField)
          final.file = {
            name: this.docs[index].fileField.name,
            code: b64file
          }
        }
        if (this.docs[index].fields.UF_NAME) final.UF_NAME = this.docs[index].fields.UF_NAME.value
        if (this.docs[index].fields.UF_NUMBER) final.UF_NUMBER = this.docs[index].fields.UF_NUMBER.value
        if (this.docs[index].fields.UF_COMM) final.UF_COMM = this.docs[index].fields.UF_COMM.value
        if (this.docs[index].fields.UF_ORIG) final.UF_ORIG = this.docs[index].fields.UF_ORIG.value
        if (this.docs[index].fields.UF_SCAN) final.UF_SCAN = this.docs[index].fields.UF_SCAN.value
        if (this.docs[index].fields.UF_TYPE) final.UF_TYPE = this.docs[index].fields.UF_TYPE.value
        if (this.docs[index].fields.UF_LIST) final.UF_LIST = this.docs[index].fields.UF_LIST.value
        if (this.dateForEdit) final.UF_DATE = moment(this.dateForEdit).format('DD.MM.YYYY')
        //console.log('to create', final)

        try {
          const r = await callBx24Method('dealdocs.add', {
            block: this.docs[index].block,
            fields: final
          })
          //console.log('addItem data', r)
          if (r.ID) {
            this.docs[index].ID = r.ID

            if(!!this.multiple) {
              //this.docs.splice(index, 1)
              let newFieldValue = this.docs.filter(doc => !doc.deleted).map(doc => doc.ID)
              await this.setValueToField(newFieldValue)
            } else {
              await this.setValueToField(r.ID)
            }

            this.docs[index].uploaded = true
            await this.setSize()
          }
        } catch (e) {
          console.log('addItem error', e)
        }

      },
      updateItem: async function (index) {
        let final = {}
        if (this.docs[index].fileField !== null) {
          //console.log('fileee', this.fileForEdit)
          let b64file = await fileToBase64(this.docs[index].fileField)
          final.file = {
            name: this.docs[index].fileField.name,
            code: b64file
          }
        }
        if (this.docs[index].fields.UF_NAME) final.UF_NAME = this.docs[index].fields.UF_NAME.value
        if (this.docs[index].fields.UF_NUMBER) final.UF_NUMBER = this.docs[index].fields.UF_NUMBER.value
        if (this.docs[index].fields.UF_COMM) final.UF_COMM = this.docs[index].fields.UF_COMM.value
        if (this.docs[index].fields.UF_ORIG) final.UF_ORIG = this.docs[index].fields.UF_ORIG.value
        if (this.docs[index].fields.UF_SCAN) {
          //console.log('scan is', this.docs[index].fields.UF_SCAN)
          final.UF_SCAN = this.docs[index].fields.UF_SCAN.value
        }
        if (this.docs[index].fields.UF_TYPE) final.UF_TYPE = this.docs[index].fields.UF_TYPE.value
        if (this.docs[index].fields.UF_LIST) final.UF_LIST = this.docs[index].fields.UF_LIST.value
        if (this.dateForEdit) final.UF_DATE = moment(this.dateForEdit).format('DD.MM.YYYY')
        //console.log('to create', final)

        try {
          const r = await callBx24Method('dealdocs.update', {
            id: this.docs[index].ID,
            block: this.docs[index].block,
            fields: final
          })
          //.log('update data', r)
          this.docs[index].uploaded = true
          await this.setSize()
          if (r.documentBefore) {
            this.docs[index].ID = r.ID
            await this.setValueToField(r.ID)
          }
        } catch (e) {
          console.log('update error', e)
        }
      },
      deleteItem: async function (index) {
        //.log('delete item', this.docs[index].ID)

        try {
          const r = await callBx24Method('dealdocs.delete', {
            id: this.docs[index].ID,
            block: this.docs[index].block,
          })

          this.docs[index].deleted = true

          await this.setSize()

          let place = window.BX24.placement.info()

          let upd = {
            id: place.options.ENTITY_VALUE_ID,
            fields: {}
          }
          if(!!this.multiple) {
            //this.docs.splice(index, 1)
            let newFieldValue = this.docs.filter(doc => !doc.deleted).map(doc => doc.ID)
            if(newFieldValue.length > 0) {
              for(let i in newFieldValue) {
                upd.fields[`${place.options.FIELD_NAME}`][i] = newFieldValue[i]
              }
            } else {
                upd.fields[`${place.options.FIELD_NAME}`][0] = ""
            }
            await this.setValueToField(newFieldValue)
          } else {
            await this.setValueToField('')
            upd.fields[`${place.options.FIELD_NAME}`] = ''
          }
          await callBx24Method('crm.deal.update', upd)
        } catch (e) {
          console.log('deleted error', e)
        }

      },
      changeFile: async function () {
        this.showChangeFile = true
        this.setSize()
      },
      setValueToField: async function (newValue) {
        if (window.BX24) {
          let BX24 = window.BX24
          BX24.placement.call('setValue', newValue, function () {

          })
          BX24.placement.call('getValue', function () {

          })
          await aTimeout(50)
        }
      },
      getInfo: async function () {
        if (window.BX24) {
          let info = window.BX24.placement.info()
          //console.log('info', this.docType.title, info)
          if (info.options.MULTIPLE === 'Y') {
            this.multiple = true
            if (+(info.options.VALUE[0]) === 0) {
              //Значения нет
              this.editMode = true
              this.docs = [JSON.parse(JSON.stringify(this.docType))]
            } else {
              //Значение есть
              if (info.options.MODE === 'edit') this.editMode = true
              for (let id of info.options.VALUE) {
                this.docs.push(await this.getData(id))
              }
            }
          } else {
            if (+(info.options.VALUE) === 0) {
              //Значения нет
              this.editMode = true
              this.docs = [JSON.parse(JSON.stringify(this.docType))]
            } else {
              //Значение есть
              if (info.options.MODE === 'edit') this.editMode = true
              this.docs = [await this.getData(info.options.VALUE)]
            }
          }
          await this.setSize()

        }
      },
      getData: async function (hlElementId) {
        try {
          const r = await callBx24Method('dealdocs.get', {
            id: hlElementId,
            block: this.docType.block.toLowerCase()
          })

          //console.log('doc:', r.document)

          let returnedDoc = JSON.parse(JSON.stringify(this.docType))

          if (r.document) {
            let doc = r.document
            if (doc.ID) returnedDoc.ID = doc.ID
            if (doc.UF_NAME) returnedDoc.fields.UF_NAME.value = doc.UF_NAME
            if (doc.UF_NUMBER) returnedDoc.fields.UF_NUMBER.value = doc.UF_NUMBER
            if (doc.UF_DATE) {
              this.dateForEdit = moment(doc.UF_DATE, 'DD.MM.YYYY').format('YYYY-MM-DD')
              returnedDoc.fields.UF_DATE.value = doc.UF_DATE
            }
            if (doc.UF_LIST) returnedDoc.fields.UF_LIST.value = doc.UF_LIST
            if (doc.UF_ORIG) returnedDoc.fields.UF_ORIG.value = +(doc.UF_ORIG)
            if (doc.UF_COMM) returnedDoc.fields.UF_COMM.value = doc.UF_COMM
            if (doc.UF_TYPE) returnedDoc.fields.UF_TYPE.value = doc.UF_TYPE
            if (doc.UF_SCAN) {
              returnedDoc.fields.UF_SCAN.value = doc.UF_SCAN
            }
            if (doc.LINK) returnedDoc.fields.LINK = `https://crm.pcsib.ru${doc.LINK}`
          }
          return returnedDoc
        } catch (e) {
          console.log('err get doc', e)
          return JSON.parse(JSON.stringify(this.docType))
        }
      },
      setComponentName () {
        this.componentName = this.$route.params.handler
      }
    },
    created () {
      this.setComponentName()
    },
    async mounted () {
      await this.getInfo()
      //await this.getData()
    }
  }
</script>

<style scoped>
    .edit {
        background: #fff;
    }

    .normal {

    }
</style>