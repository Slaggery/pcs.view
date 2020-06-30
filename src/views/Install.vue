<template>
    <v-container fluid>
        <v-card flat>
            <v-card-title>Установка</v-card-title>
            <v-card-text>
                <v-simple-table>
                    <template v-slot:default>
                        <thead>
                        <tr>
                            <th class="text-left">Название модуля</th>
                            <th class="text-left">Статус</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr v-for="(item, index) in modules" :key="index">
                            <td>{{ item.name }}</td>
                            <td>
                                <v-chip class="ma-2" color="secondary">
                                    {{ item.status }}
                                </v-chip>
                            </td>
                        </tr>
                        </tbody>
                    </template>
                </v-simple-table>
            </v-card-text>
        </v-card>
    </v-container>
</template>

<script>
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

  export default {
    name: 'Install',
    data: function () {
      return {
        modules: [
          {
            name: 'Договор',
            status: 'Установка...',
            USER_TYPE_ID: 'contract',
            HANDLER: 'pcscontracts',
          },
          {
            name: 'Банковская гарантия',
            status: 'Установка...',
            USER_TYPE_ID: 'bankGuarantee',
            HANDLER: 'pcsbankguarantee',
          },
          {
            name: 'Смета',
            status: 'Установка...',
            USER_TYPE_ID: 'estimate',
            HANDLER: 'pcsestimate',
          },
          {
            name: 'Акт выполненных работ',
            status: 'Установка...',
            USER_TYPE_ID: 'completion',
            HANDLER: 'pcscertificateofcompletion',
          },
          {
            name: 'Накладная курьерская',
            status: 'Установка...',
            USER_TYPE_ID: 'deliverynote',
            HANDLER: 'pcsdeliverynote',
          },
          {
            name: 'Акт приема передачи',
            status: 'Установка...',
            USER_TYPE_ID: 'acceptanceAct',
            HANDLER: 'pcsacceptanceact',
          },
          {
            name: 'Счет на оплату',
            status: 'Установка...',
            USER_TYPE_ID: 'billsforpay',
            HANDLER: 'pcsbillsforpay',
          },
          {
            name: 'Форма КС-14',
            status: 'Установка...',
            USER_TYPE_ID: 'formKS14',
            HANDLER: 'pcsformks14',
          },
          {
            name: 'Форма КС-2',
            status: 'Установка...',
            USER_TYPE_ID: 'formKS2',
            HANDLER: 'pcsformks2',
          },
          {
            name: 'Форма КС-3',
            status: 'Установка...',
            USER_TYPE_ID: 'formKS3',
            HANDLER: 'pcsformks3',
          },
          {
            name: 'Счет-фактура',
            status: 'Установка...',
            USER_TYPE_ID: 'invoice',
            HANDLER: 'pcsinvoice',
          },
          {
            name: 'Платежное поручение',
            status: 'Установка...',
            USER_TYPE_ID: 'PCSPaymentOrder',
            HANDLER: 'PCSPaymentOrder',
          },
          {
            name: 'Доверенность',
            status: 'Установка...',
            USER_TYPE_ID: 'PCSPowerOfAttorney',
            HANDLER: 'PCSPowerOfAttorney',
          },
          {
            name: 'Акт сверки',
            status: 'Установка...',
            USER_TYPE_ID: 'PCSReconciliationAct',
            HANDLER: 'PCSReconciliationAct',
          },
          {
            name: 'Накладная техническая',
            status: 'Установка...',
            USER_TYPE_ID: 'PCSTechnicalInvoice',
            HANDLER: 'PCSTechnicalInvoice',
          },
          {
            name: 'Тех условия',
            status: 'Установка...',
            USER_TYPE_ID: 'PCSTechnicalSpecifications',
            HANDLER: 'PCSTechnicalSpecifications',
          },
          {
            name: 'Тех задание',
            status: 'Установка...',
            USER_TYPE_ID: 'PCSTechnicalTask',
            HANDLER: 'PCSTechnicalTask',
          },
        ],
      }
    },
    methods: {
      installApps: async function () {
        if (window.BX24) {
          for(let module of this.modules) {
            try {
              await callBx24Method('userfieldtype.delete', {
                USER_TYPE_ID: module.USER_TYPE_ID,
              })
            } catch (e) {
              console.log('usertype to delete not found')
            }
            try {
              await callBx24Method('userfieldtype.add', {
                USER_TYPE_ID: module.USER_TYPE_ID + 'Field',
                HANDLER: 'https://app.pcsib.ru/handlers/' + module.HANDLER.toLowerCase(),
                TITLE: module.name,
                DESCRIPTION: 'Поле для создания и отображения элемента в блоке ' + module.name
              })
            } catch (e) {
              console.log('Install err', e)
            }
            module.status = 'Установлено!'
            console.log('install apps')
          }
          console.log('apps was installed')
        }
      }
    },
    mounted () {
      this.installApps()
    }
  }
</script>

<style scoped>

</style>