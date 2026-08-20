# Mapa de Dataloggers

Painel web para controle de vencimento de bateria e de certificado de calibração dos dataloggers usados no mapeamento térmico de um armazém.

Feito em HTML, CSS e JavaScript puros. Sem framework, sem build, sem dependência: basta abrir o `index.html` no navegador.

---

## O problema

O controle era uma planilha com o número do equipamento, o endereço no porta-palete, o número de série e uma coluna de "última troca da bateria" quase sempre vazia.

A planilha guarda o dado, mas não avisa. A bateria do datalogger tem vida útil de 24 meses a partir da troca, e o vencimento costuma ser descoberto tarde demais — em auditoria, ou quando o equipamento já parou de registrar temperatura.

## O que o painel faz

- Calcula o vencimento da bateria somando **24 meses** à data da troca
- Classifica cada equipamento em cinco situações: `vencida`, `vence em até 30 dias`, `vence em até 90 dias`, `no prazo` e `sem data registrada`
- Exibe um alerta no topo nomeando os equipamentos que precisam de ação
- Mostra uma régua de 24 meses com a posição de cada equipamento na vida útil da bateria
- Registra **número e validade do certificado de calibração**, com as mesmas faixas de alerta
- Permite editar as datas direto na tabela, com botão "Troquei hoje" para o registro rápido
- Filtra por situação (bateria ou certificado), por modelo e por busca livre
- Exporta em **CSV** (separador `;` e BOM, abre direto no Excel em pt-BR) e salva/carrega o registro em **JSON**

## Regra de negócio

```
vencimento da bateria = data da última troca + 24 meses
```

Dois pontos que exigiram cuidado:

**Fuso horário.** `new Date("2026-04-17")` é interpretado como UTC e, dependendo do fuso, devolve o dia anterior. O parse é feito componente a componente:

```js
function paraData(texto) {
  if (!texto) return null;
  const [a, m, d] = texto.split('-').map(Number);
  const data = new Date(a, m - 1, d);
  return isNaN(data) ? null : data;
}
```

**Fim de mês.** Somar 24 meses não é somar 730 dias. Uma troca em 31/01/2024 vence em 31/01/2026; uma em 29/02/2024 precisa cair em 28/02/2026, porque 2026 não é bissexto:

```js
function somarMeses(data, meses) {
  const dia = data.getDate();
  const nova = new Date(data.getFullYear(), data.getMonth() + meses, 1);
  const ultimoDia = new Date(nova.getFullYear(), nova.getMonth() + 1, 0).getDate();
  nova.setDate(Math.min(dia, ultimoDia));
  return nova;
}
```

A validade do certificado **não** é calculada: usa a data informada no próprio documento de calibração, porque o período varia entre laboratórios e presumir um prazo fixo mascararia um vencimento real.

## Estrutura

```
.
├── index.html     estrutura da página
├── styles.css     estilo (paleta de papel de registrador térmico)
└── app.js         dados, cálculo de vencimento e renderização
```

Tudo em uma pasta só. Sem servidor, sem instalação.

## Como usar

1. Baixe os três arquivos na mesma pasta
2. Abra o `index.html` no navegador
3. Preencha as datas de troca e os dados do certificado direto na tabela
4. Clique em **Salvar registro** antes de fechar a aba, e em **Carregar registro** na próxima vez

### Alterando a lista de equipamentos

Os dados ficam no início do `app.js`, no array `DATALOGGERS`:

```js
{ id: 'DATA 001', endereco: 'R2-02-N5', serie: 'CM7251100015',
  modelo: 'Tlog B100H', ultimaTroca: null, certificado: '', validadeCert: null }
```

Datas no formato `AAAA-MM-DD` ou `null` quando não registradas.

### Alterando os prazos

No topo do `app.js`:

```js
const VIDA_UTIL_MESES = 24;   // vida útil da bateria
const PRAZO_ATENCAO   = 90;   // dias para o aviso amarelo
const PRAZO_CRITICO   = 30;   // dias para o aviso vermelho
```

## Limitações conhecidas

- Os dados ficam em memória: sem clicar em "Salvar registro", o preenchimento se perde ao fechar a aba
- Sem controle de acesso ou histórico de alterações — não substitui um registro validado da qualidade
- Uso individual; não há sincronização entre máquinas

## Próximos passos

- [ ] Persistência local (`localStorage`) para dispensar o salvamento manual
- [ ] Histórico de trocas por equipamento, em vez de apenas a última
- [ ] Importação direta da planilha `.xlsx`
- [ ] Impressão em uma página, para anexar ao registro físico

## Licença

MIT

---

Desenvolvido por **CodeDog**
