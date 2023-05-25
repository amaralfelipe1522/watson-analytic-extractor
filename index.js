require("dotenv").config();
const moment = require("moment");
const AssistantV2 = require("ibm-watson/assistant/v2");
const { IamAuthenticator } = require("ibm-watson/auth");
const _ = require("lodash");
const fs = require("fs").promises;
const tunnel = require("tunnel");

let days = process.env.DAY || 1;

const fileName = moment().subtract(days, "day").format("YYYY-MM-DD_23_59_59");

const now = moment().subtract(days, "day");
const startDate = now.startOf("day").toISOString();
const endDate = now.endOf("day").toISOString();

const logs = async (cursor) => {
  if (process.env.HOST != "NOT_USED" || process.env.PORT != "NOT_USED") {
    console.log("Usando HOST e/ou PORT na extração");

    const httpsAgent = tunnel.httpOverHttp({
      proxy: {
        host: process.env.HOST,
        port: process.env.PORT,
      },
    });

    const assistant = new AssistantV2({
      version: process.env.WATSON_VERSION || "2020-04-01",
      authenticator: new IamAuthenticator({
        apikey: process.env.WATSON_API_KEY,
        httpsAgent, // not necessary if using Basic or BearerToken authentication
        proxy: false,
      }),
      httpsAgent, // not necessary if using Basic or BearerToken authentication
      proxy: false,
      serviceUrl: process.env.WATSON_SERVICE_URL,
    });

    console.log(
      `Logs sendo extraídos entre o período de ${startDate} até ${endDate}`
    );

    const rawLog = await assistant.listLogs({
      assistantId: process.env.WATSON_ASSISTANT_ID,
      cursor: cursor || "",
      filter: `response_timestamp>${startDate},response_timestamp<${endDate}`,
      pageLimit: 9999,
    });

    return rawLog;
  } else {
    const assistant = new AssistantV2({
      version: process.env.WATSON_VERSION || "2020-04-01",
      authenticator: new IamAuthenticator({
        apikey: process.env.WATSON_API_KEY,
        proxy: false,
      }),
      proxy: false,
      serviceUrl: process.env.WATSON_SERVICE_URL,
    });

    console.log(
      `Logs sendo extraídos entre o período de ${startDate} até ${endDate}`
    );
    const rawLog = await assistant.listLogs({
      assistantId: process.env.WATSON_ASSISTANT_ID,
      cursor: cursor || "",
      filter: `response_timestamp>${startDate},response_timestamp<${endDate}`,
      pageLimit: 9999,
    });
    return rawLog;
  }
};

async function returnLog() {
  try {
    const fileName = moment()
      .subtract(days, "day")
      .format("YYYY-MM-DD_23_59_59");
    let res = await logs();
    let arrReturn = { logs: [] };
    let retry = 1;
    for (let i = 0; i < retry; ) {
      if (res.result.pagination.next_cursor) {
        res.result.logs.forEach((x) => {
          if (x.response.output.text.length > 0) {
            arrReturn.logs.push(x);
          }
        });
        res = await logs(res.result.pagination.next_cursor);
      } else {
        if (res.result.logs) {
          res.result.logs.forEach((x) => {
            if (x.response.output.text.length > 0) {
              arrReturn.logs.push(x);
            }
          });
          i++;
        }
      }
    }
    const tratativaLog = _.chain(arrReturn.logs)
      .flatMap((x) => {
        let trat = [
          x.session_id,
          moment(x.request_timestamp).format("YYYY-MM-DD HH:mm:ss.SSS"),
          moment(x.response_timestamp).format("YYYY-MM-DD HH:mm:ss.SSS"),
          x.request.input.text,
          x.response.output.text
            ? x.response.output.text.length > 0
              ? x.response.output.text.length > 1
                ? x.response.output.text.join(" ").replace(/\n/g, " ")
                : x.response.output.text[0].replace(/\n/g, "")
              : "-"
            : "-",
          x.response.output.intents[0]
            ? x.response.output.intents[0].confidence < 0.2
              ? "-"
              : x.response.output.intents[0].intent
            : "-",
          x.response.output.intents[0]
            ? x.response.output.intents[0].confidence
            : "-",
          x.response.output.entities[0]
            ? x.response.output.entities[0].value
            : "-",
          x.response.context.skills["main skill"]?.user_defined.not_found
            ? x.response.context.skills["main skill"]?.user_defined.not_found
            : "-",
        ];

        // Tratativa abaixo usada quando necessário substituir manualmente os valores após capturados

        // switch (trat[4].toString()) {
        //   case 'controle_watson':
        //     switch (trat[6].toString()) {
        //       case 'cartao_recebimento':
        //         trat[4] = 'cartao_recebimento'
        //         break;
        //       case 'cartao_antecipação':
        //         trat[4] = 'cartao_antecipação'
        //         break;
        //       case '-':
        //         trat[4] = '-'
        //         break;
        //     }
        //     switch (trat[8].toString()) {
        //       case 'fatura':
        //         trat[4] = 'fatura_desambiguação'
        //         break;
        //       case !'fatura':
        //         trat[4] = '-'
        //         break;
        //     }
        // }

        return trat.join(";");
      })
      .unshift(
        "session_id;request_timestamp;response_timestamp;input;output;intent;intent_confidence;entities;not_found"
      )
      .join("\n")
      .value();

    await fs.writeFile(
      `${__dirname}/${fileName}.csv`,
      "\ufeff" + tratativaLog,
      { encoding: "utf8" }
    );

    return {
      sucess: true,
      path: `${fileName}.csv`,
    };
  } catch (error) {
    return { sucess: false, error: error };
  }
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

(async () => {
  let users = await returnLog();
  let tentativas = 0;

  for (i = 0; i < 1; ) {
    if (users.sucess == true) {
      console.log(`Logs do dia ${moment().subtract(days, "day")}`);
      console.log(`Logs enviados após ${tentativas} erro(s)`);
      i++;
      console.log(`\n** Arquivo ${fileName}.csv gerado com sucesso. **`);
    } else {
      console.log(
        "Houve um erro, quantidade de erros: ",
        tentativas++,
        "O erro foi: ",
        users.error
      );
      await sleep(12000);
      users = await returnLog();
    }
  }
})();
