# watson-analytic-generator

Serviço criado para capturar todos os registros das interações realizadas ao Watson Assistant no dia informado, filtrar as informações necessárias e por fim, exporta-las a um arquivo CSV.

Executando via container Docker:

```
docker run --rm --name watson-analytic-extractor \
    -e WATSON_API_KEY="<API KEY>" \
    -e WATSON_ASSISTANT_ID="<ASSISTANT ID>" \
    -e WATSON_SERVICE_URL="https://api.<LOCALIZAÇÃO DO SERVIÇO>.assistant.watson.cloud.ibm.com/instances/<KEY DA URL>" \
    -e DAY="<QUATIDADE DE DIAS A SER SUBTRAíDA. EX.: 2 == LOGS DE 2 DIAS ATRÁS>" \
    -e HOST="NOT_USED" \
    -e PORT="NOT_USED" \
    --mount type=bind,source=$(pwd),target=/home/node/app/ \
    --name watson-analytic-extractor \
    amaralfelipe1522/watson-analytic-extractor
```
