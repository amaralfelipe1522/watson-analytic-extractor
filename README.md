# watson-analytic-generator

Serviço criado para capturar todos os registros das interações realizadas ao Watson Assistant no período informado, filtrar as informações necessárias e por fim, exporta-las a um arquivo CSV.

> As variáveis HOST e PORT são opcionais, caso não seja necessário usa-las, manter no .ENV com o valor NOT_USED

## Executando via container Docker

1. Crie um volume

```
docker volume create watson-analytic-output
```

2. Inclua todas as credenciais necessárias no comando abaixo:

```
docker run --rm --name watson-analytic-extractor \
    -e WATSON_API_KEY="<API KEY>" \
    -e WATSON_ASSISTANT_ID="<ASSISTANT ID>" \
    -e WATSON_SERVICE_URL="https://api.<LOCALIZAÇÃO DO SERVIÇO>.assistant.watson.cloud.ibm.com/instances/<KEY DA URL>" \
    -e DAY="<QUATIDADE DE DIAS A SER SUBTRAíDA. EX.: 2 == LOGS DE 2 DIAS ATRÁS>" \
    -e HOST="NOT_USED" \
    -e PORT="NOT_USED" \
    --mount source=watson-analytic-output,destination=/app \
    --name watson-analytic-extractor \
    amaralfelipe1522/watson-analytic-extractor:2.5
```

3. Caso tenha dúvidas sobre o destino da estração, verifique o Mountpoint:

```
docker volume inspect watson-analytic-output
```

Exemplo de retorno:

    [
        {
        "CreatedAt": "2023-05-08T15:54:03-03:00",
        "Driver": "local",
        "Labels": {},
        "Mountpoint": "/var/lib/docker/volumes/watson-analytic-output/_data",
        "Name": "watson-analytic-output",
        "Options": {},
        "Scope": "local"
        }
    ]
