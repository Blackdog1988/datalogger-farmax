/* ============================================================
   Mapa de dataloggers — lógica de vencimento de bateria
   Regra: a bateria vence 24 meses (2 anos) após a última troca.
   Dados extraídos da planilha "Mapeameno - Dattaloger",
   aba "Mapa Dattalogr".
   ============================================================ */

'use strict';

/* ---------- 1. Parâmetros ---------- */

const VIDA_UTIL_MESES = 24;   // 2 anos de bateria
const PRAZO_ATENCAO   = 90;   // dias para o aviso amarelo
const PRAZO_CRITICO   = 30;   // dias para o aviso vermelho

/* ---------- 2. Dados da planilha ---------- */
/* ultimaTroca / validadeCert: data "AAAA-MM-DD" ou null quando não registrada
   certificado: número do certificado, string vazia enquanto não preenchido    */

const DATALOGGERS = [
  { id: 'DATA 001', endereco: 'R2-02-N5',   serie: 'CM7251100015', modelo: 'Tlog B100H', ultimaTroca: null, certificado: '', validadeCert: null },
  { id: 'DATA 002', endereco: 'R2-30-05',   serie: 'CM7251100006', modelo: 'Tlog B100H', ultimaTroca: null, certificado: '', validadeCert: null },
  { id: 'DATA 003', endereco: 'R4-20-N5',   serie: 'CM7251100012', modelo: 'Tlog B100H', ultimaTroca: null, certificado: '', validadeCert: null },
  { id: 'DATA 004', endereco: 'R6-30-N5',   serie: 'CM7259100126', modelo: 'Tlog B100H', ultimaTroca: null, certificado: '', validadeCert: null },
  { id: 'DATA 005', endereco: 'R8-20-N5',   serie: 'CM7259100140', modelo: 'Tlog B100H', ultimaTroca: null, certificado: '', validadeCert: null },
  { id: 'DATA 006', endereco: 'R10-01-N5',  serie: 'CM7251100014', modelo: 'Tlog B100H', ultimaTroca: null, certificado: '', validadeCert: null },
  { id: 'DATA 007', endereco: 'R16-01-N5',  serie: 'CM7259100139', modelo: 'Tlog B100H', ultimaTroca: null, certificado: '', validadeCert: null },
  { id: 'DATA 008', endereco: 'R16-30-N5',  serie: 'CM7251100049', modelo: 'Tlog B100H', ultimaTroca: null, certificado: '', validadeCert: null },
  { id: 'DATA 009', endereco: 'R18-20-N5',  serie: 'CM7251100013', modelo: 'Tlog B100H', ultimaTroca: null, certificado: '', validadeCert: null },
  { id: 'DATA 010', endereco: 'R22-01-N5',  serie: 'CM7259100123', modelo: 'RC-4HC',     ultimaTroca: null, certificado: '', validadeCert: null },
  { id: 'DATA 011', endereco: 'R22-30-N5',  serie: 'CM7251100011', modelo: 'Tlog B100H', ultimaTroca: null, certificado: '', validadeCert: null },
  { id: 'DATA 012', endereco: 'R24-20-N5',  serie: 'CM7259100141', modelo: 'Tlog B100H', ultimaTroca: null, certificado: '', validadeCert: null },
  { id: 'DATA 013', endereco: 'R28-01-N5',  serie: 'CM723B100003', modelo: 'Tlog B100H', ultimaTroca: null, certificado: '', validadeCert: null },
  { id: 'DATA 014', endereco: 'R28-30-N5',  serie: 'EF7223100213', modelo: 'RC-4HC',     ultimaTroca: null, certificado: '', validadeCert: null },
  { id: 'DATA 015', endereco: 'R30-20-N5',  serie: 'CM7251100010', modelo: 'Tlog B100H', ultimaTroca: null, certificado: '', validadeCert: null },
  { id: 'DATA 016', endereco: 'R32-01-N5',  serie: 'EF7226107849', modelo: 'RC-4HC',     ultimaTroca: null, certificado: '', validadeCert: null },
  { id: 'DATA 017', endereco: 'R32-30-N5',  serie: 'EF7225101125', modelo: 'RC-4HC',     ultimaTroca: null, certificado: '', validadeCert: null },
  { id: 'DATA 018', endereco: 'R14-20-N3',  serie: 'CM7259100127', modelo: 'RC-4HC',     ultimaTroca: null, certificado: '', validadeCert: null },
  { id: 'DATA 019', endereco: 'R20-01-N3',  serie: 'CM7259100138', modelo: 'Tlog B100H', ultimaTroca: null, certificado: '', validadeCert: null },
  { id: 'DATA 020', endereco: 'R20-30-N3',  serie: 'CM723B100002', modelo: 'RC-4HC',     ultimaTroca: null, certificado: '', validadeCert: null },
  { id: 'DATA 021', endereco: 'R26-20-N3',  serie: 'EF7223100247', modelo: 'RC-4HC',     ultimaTroca: '2026-04-17', certificado: '', validadeCert: null },
  { id: 'DATA 022', endereco: 'R6-01-N1',   serie: 'CM7251100009', modelo: 'Tlog B100H', ultimaTroca: null, certificado: '', validadeCert: null },
  { id: 'DATA 023', endereco: 'R10-30-N1',  serie: 'EF7225101104', modelo: 'RC-4HC',     ultimaTroca: null, certificado: '', validadeCert: null },
  { id: 'DATA 024', endereco: 'R-12-20-N1', serie: 'CM7259100124', modelo: 'Tlog B100H', ultimaTroca: null, certificado: '', validadeCert: null }
];

/* ---------- 3. Funções de data ---------- */

const HOJE = zerarHora(new Date());

function zerarHora(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Converte "AAAA-MM-DD" em Date local (evita o desvio de fuso do construtor ISO). */
function paraData(texto) {
  if (!texto) return null;
  const [a, m, d] = texto.split('-').map(Number);
  const data = new Date(a, m - 1, d);
  return isNaN(data) ? null : data;
}

/** Soma meses preservando o fim do mês (31/01 + 24 meses = 31/01). */
function somarMeses(data, meses) {
  const dia = data.getDate();
  const nova = new Date(data.getFullYear(), data.getMonth() + meses, 1);
  const ultimoDia = new Date(nova.getFullYear(), nova.getMonth() + 1, 0).getDate();
  nova.setDate(Math.min(dia, ultimoDia));
  return nova;
}

function diasEntre(inicio, fim) {
  return Math.round((zerarHora(fim) - zerarHora(inicio)) / 86400000);
}

function formatarData(data) {
  return data ? data.toLocaleDateString('pt-BR') : '—';
}

function paraTextoISO(data) {
  const p = n => String(n).padStart(2, '0');
  return `${data.getFullYear()}-${p(data.getMonth() + 1)}-${p(data.getDate())}`;
}

/* ---------- 4. Cálculo da situação ---------- */

/**
 * Devolve o item com vencimento, dias restantes e situação.
 * status (bateria) e statusCert (certificado):
 * sem-registro | vencido | critico | atencao | ok
 */
function avaliar(item) {
  const troca = paraData(item.ultimaTroca);
  const base = {
    ...item,
    troca: null, vencimento: null, diasRestantes: null, status: 'sem-registro',
    ...avaliarCertificado(item)
  };

  if (!troca) return base;

  const vencimento = somarMeses(troca, VIDA_UTIL_MESES);
  const diasRestantes = diasEntre(HOJE, vencimento);

  return { ...base, troca, vencimento, diasRestantes, status: faixa(diasRestantes) };
}

/** Situação do certificado: usa a validade informada, sem cálculo de prazo. */
function avaliarCertificado(item) {
  const validade = paraData(item.validadeCert);
  if (!validade) {
    return { validade: null, diasCert: null, statusCert: 'sem-registro' };
  }
  const diasCert = diasEntre(HOJE, validade);
  return { validade, diasCert, statusCert: faixa(diasCert) };
}

/** Traduz dias restantes em faixa de alerta. */
function faixa(dias) {
  if (dias < 0)                return 'vencido';
  if (dias <= PRAZO_CRITICO)   return 'critico';
  if (dias <= PRAZO_ATENCAO)   return 'atencao';
  return 'ok';
}

const ROTULO_STATUS = {
  'vencido':      'Vencida',
  'critico':      'Vence em breve',
  'atencao':      'Atenção',
  'ok':           'No prazo',
  'sem-registro': 'Sem data'
};

const ROTULO_CERT = {
  'vencido':      'Vencido',
  'critico':      'Vence em breve',
  'atencao':      'Atenção',
  'ok':           'No prazo',
  'sem-registro': 'Sem registro'
};

function textoRestante(dias, semRegistro) {
  if (dias === null || dias === undefined) return semRegistro;
  if (dias < 0)   return `vencido há ${Math.abs(dias)} dia${Math.abs(dias) === 1 ? '' : 's'}`;
  if (dias === 0) return 'vence hoje';
  if (dias < 60)  return `faltam ${dias} dia${dias === 1 ? '' : 's'}`;
  return `faltam ${Math.floor(dias / 30)} meses`;
}

/* ---------- 5. Estado da tela ---------- */

const filtros = { busca: '', status: 'todos', modelo: 'todos' };

const el = {
  dataHoje:   document.getElementById('dataHoje'),
  alerta:     document.getElementById('alertaGlobal'),
  resumo:     document.getElementById('resumo'),
  marcadores: document.getElementById('reguaMarcadores'),
  bandeja:    document.getElementById('bandeja'),
  corpo:      document.getElementById('corpoTabela'),
  vazio:      document.getElementById('vazio'),
  contagem:   document.getElementById('contagem'),
  busca:      document.getElementById('busca'),
  fStatus:    document.getElementById('filtroStatus'),
  fModelo:    document.getElementById('filtroModelo'),
  aviso:      document.getElementById('aviso')
};

function avaliados() {
  return DATALOGGERS.map(avaliar);
}

function filtrados(lista) {
  const busca = filtros.busca.trim().toLowerCase();
  const [campo, valor] = filtros.status.includes(':') ? filtros.status.split(':') : [null, null];

  return lista.filter(av => {
    if (campo === 'bat'  && av.status     !== valor) return false;
    if (campo === 'cert' && av.statusCert !== valor) return false;
    if (filtros.modelo !== 'todos' && av.modelo !== filtros.modelo) return false;
    if (!busca) return true;
    return [av.id, av.endereco, av.serie, av.modelo, av.certificado]
      .join(' ').toLowerCase().includes(busca);
  });
}

/* ---------- 6. Renderização ---------- */

function renderAlerta(lista) {
  const vencidos = lista.filter(a => a.status === 'vencido');
  const criticos = lista.filter(a => a.status === 'critico');
  const atencao  = lista.filter(a => a.status === 'atencao');
  const sem      = lista.filter(a => a.status === 'sem-registro');

  el.alerta.classList.toggle('tem-vencido', vencidos.length > 0);
  el.alerta.classList.toggle('tem-proximo', vencidos.length === 0 && (criticos.length > 0 || atencao.length > 0));

  let titulo, detalhe;

  if (vencidos.length) {
    titulo = `${vencidos.length} bateria${vencidos.length > 1 ? 's' : ''} fora do prazo de 24 meses`;
    detalhe = `Trocar: ${vencidos.map(a => `${a.id} (${a.endereco})`).join(' · ')}`;
  } else if (criticos.length) {
    titulo = `${criticos.length} bateria${criticos.length > 1 ? 's vencem' : ' vence'} nos próximos 30 dias`;
    detalhe = criticos.map(a => `${a.id} — ${formatarData(a.vencimento)}`).join(' · ');
  } else if (atencao.length) {
    titulo = `${atencao.length} bateria${atencao.length > 1 ? 's vencem' : ' vence'} nos próximos 90 dias`;
    detalhe = atencao.map(a => `${a.id} — ${formatarData(a.vencimento)}`).join(' · ');
  } else {
    titulo = 'Nenhuma bateria vencida ou próxima do vencimento';
    detalhe = 'Todas as datas registradas estão dentro dos 24 meses.';
  }

  if (sem.length) {
    detalhe += `${detalhe ? ' — ' : ''}${sem.length} equipamento${sem.length > 1 ? 's' : ''} ainda sem data de troca registrada.`;
  }

  el.alerta.innerHTML = `
    <p class="alerta-texto">${titulo}
      <span class="alerta-detalhe">${detalhe}</span>
      <span class="alerta-detalhe">${textoCertificados(lista)}</span>
    </p>`;
}

/** Frase de situação dos certificados, exibida junto ao alerta da bateria. */
function textoCertificados(lista) {
  const vencidos = lista.filter(a => a.statusCert === 'vencido');
  const proximos = lista.filter(a => a.statusCert === 'critico' || a.statusCert === 'atencao');
  const sem      = lista.filter(a => a.statusCert === 'sem-registro');

  const partes = [];
  if (vencidos.length) partes.push(`Certificados vencidos: ${vencidos.map(a => a.id).join(', ')}.`);
  if (proximos.length) partes.push(`${proximos.length} certificado${proximos.length > 1 ? 's vencem' : ' vence'} nos próximos 90 dias: ${proximos.map(a => `${a.id} — ${formatarData(a.validade)}`).join(' · ')}.`);
  if (sem.length)      partes.push(`${sem.length} de ${lista.length} equipamentos ainda sem número e validade de certificado.`);
  if (!partes.length)  partes.push('Todos os certificados estão registrados e dentro da validade.');

  return partes.join(' ');
}

function renderResumo(lista) {
  const cont = t => lista.filter(a => a.status === t).length;
  const contCert = t => lista.filter(a => a.statusCert === t).length;
  const cartoes = [
    { rotulo: 'Equipamentos no mapa',   valor: lista.length,             tom: 'neutro'  },
    { rotulo: 'Baterias vencidas',      valor: cont('vencido'),          tom: 'vencido' },
    { rotulo: 'Baterias vencem em 30 dias', valor: cont('critico'),      tom: 'critico' },
    { rotulo: 'Baterias vencem em 90 dias', valor: cont('atencao'),      tom: 'atencao' },
    { rotulo: 'Baterias sem data',      valor: cont('sem-registro'),     tom: 'neutro'  },
    { rotulo: 'Certificados vencidos',  valor: contCert('vencido'),      tom: 'vencido' },
    { rotulo: 'Certificados registrados', valor: lista.length - contCert('sem-registro'), tom: 'ok' }
  ];

  el.resumo.innerHTML = cartoes.map(c => `
    <div class="cartao" data-tom="${c.tom}">
      <span class="cartao-numero">${String(c.valor).padStart(2, '0')}</span>
      <span class="cartao-rotulo">${c.rotulo}</span>
    </div>`).join('');
}

function renderRegua(lista) {
  const comData = lista.filter(a => a.status !== 'sem-registro');
  const semData = lista.filter(a => a.status === 'sem-registro');

  el.marcadores.innerHTML = comData.map((av, i) => {
    const decorridos = (VIDA_UTIL_MESES * 30.44 - av.diasRestantes) / 30.44;
    const pct = Math.min(100, Math.max(0, (decorridos / VIDA_UTIL_MESES) * 100));
    const altura = 26 + (i % 4) * 16;   // escalona a haste para não sobrepor rótulos
    return `
      <div class="pino" style="left:${pct.toFixed(1)}%; bottom:0"
           data-status="${av.status}" tabindex="0"
           title="${av.id} · ${av.endereco} · vence ${formatarData(av.vencimento)}">
        <span class="pino-rotulo">${av.id} · ${formatarData(av.vencimento)}</span>
        <span class="pino-haste" style="height:${altura}px"></span>
        <span class="pino-ponto"></span>
      </div>`;
  }).join('');

  el.bandeja.innerHTML = semData.length
    ? `<strong>${semData.length} sem data de troca</strong> — não entram na régua até o registro:
       <div class="bandeja-lista">${semData.map(a => `<span class="ficha">${a.id}</span>`).join('')}</div>`
    : 'Todos os equipamentos têm data de troca registrada.';
}

function renderTabela(lista) {
  el.corpo.innerHTML = lista.map(av => `
    <tr data-status="${av.status}">
      <td class="cel-id"    data-rotulo="Datalogger">${av.id}</td>
      <td class="cel-end"   data-rotulo="Endereço">${av.endereco}</td>
      <td class="cel-serie" data-rotulo="Nº de série">${av.serie}</td>
      <td data-rotulo="Modelo">${av.modelo}</td>
      <td data-rotulo="Nº do certificado">
        <input type="text" class="cert-numero" value="${escapar(av.certificado)}"
               placeholder="a preencher" data-id="${av.id}"
               aria-label="Número do certificado do ${av.id}">
      </td>
      <td data-rotulo="Validade do certificado">
        <input type="date" class="data-troca cert-validade" value="${av.validadeCert || ''}"
               data-id="${av.id}" aria-label="Validade do certificado do ${av.id}">
        <span class="selo selo-cert" data-status="${av.statusCert}">${ROTULO_CERT[av.statusCert]}</span>
      </td>
      <td data-rotulo="Última troca">
        <input type="date" class="data-troca" value="${av.ultimaTroca || ''}"
               data-id="${av.id}" aria-label="Última troca de bateria do ${av.id}">
      </td>
      <td class="cel-venc" data-rotulo="Vence em">
        ${formatarData(av.vencimento)}
        <span class="restante">${textoRestante(av.diasRestantes, 'registre a troca')}</span>
      </td>
      <td data-rotulo="Situação">
        <span class="selo" data-status="${av.status}">${ROTULO_STATUS[av.status]}</span>
      </td>
      <td>
        <button type="button" class="btn btn-linha" data-trocar="${av.id}">Troquei hoje</button>
      </td>
    </tr>`).join('');

  el.vazio.hidden = lista.length > 0;
  el.contagem.textContent = `Exibindo ${lista.length} de ${DATALOGGERS.length} equipamentos.`;
}

function renderTudo() {
  const todos = avaliados();
  renderAlerta(todos);
  renderResumo(todos);
  renderRegua(todos);
  renderTabela(filtrados(todos));
}

/* ---------- 7. Ações ---------- */

function avisar(texto) {
  el.aviso.textContent = texto;
  el.aviso.hidden = false;
  clearTimeout(avisar._t);
  avisar._t = setTimeout(() => { el.aviso.hidden = true; }, 3200);
}

function definirTroca(id, valorISO) {
  const item = DATALOGGERS.find(d => d.id === id);
  if (!item) return;
  item.ultimaTroca = valorISO || null;
  renderTudo();
  if (valorISO) {
    const venc = somarMeses(paraData(valorISO), VIDA_UTIL_MESES);
    avisar(`${id}: bateria vence em ${formatarData(venc)}.`);
  } else {
    avisar(`${id}: data de troca removida.`);
  }
}

function definirCertificado(id, numero) {
  const item = DATALOGGERS.find(d => d.id === id);
  if (!item) return;
  item.certificado = numero.trim();
  renderTudo();
  avisar(item.certificado
    ? `${id}: certificado ${item.certificado} registrado.`
    : `${id}: número do certificado removido.`);
}

function definirValidadeCert(id, valorISO) {
  const item = DATALOGGERS.find(d => d.id === id);
  if (!item) return;
  item.validadeCert = valorISO || null;
  renderTudo();
  avisar(valorISO
    ? `${id}: certificado válido até ${formatarData(paraData(valorISO))}.`
    : `${id}: validade do certificado removida.`);
}

el.corpo.addEventListener('change', e => {
  const alvo = e.target;
  const id = alvo.dataset.id;
  if (alvo.matches('.cert-validade'))     definirValidadeCert(id, alvo.value);
  else if (alvo.matches('.cert-numero'))  definirCertificado(id, alvo.value);
  else if (alvo.matches('.data-troca'))   definirTroca(id, alvo.value);
});

el.corpo.addEventListener('click', e => {
  const botao = e.target.closest('[data-trocar]');
  if (botao) definirTroca(botao.dataset.trocar, paraTextoISO(HOJE));
});

el.busca.addEventListener('input', e => {
  filtros.busca = e.target.value;
  renderTabela(filtrados(avaliados()));
});

el.fStatus.addEventListener('change', e => {
  filtros.status = e.target.value;
  renderTabela(filtrados(avaliados()));
});

el.fModelo.addEventListener('change', e => {
  filtros.modelo = e.target.value;
  renderTabela(filtrados(avaliados()));
});

/* ---------- 8. Exportar e carregar ---------- */

function baixar(nome, conteudo, tipo) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}

/** Protege o valor digitado antes de devolvê-lo ao HTML. */
function escapar(texto) {
  return String(texto || '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

document.getElementById('exportarCsv').addEventListener('click', () => {
  const cab = ['Numero datalogger', 'Endereco', 'No serie', 'Modelo',
               'No certificado', 'Validade do certificado', 'Situacao do certificado',
               'Ultima troca', 'Vencimento da bateria', 'Situacao da bateria'];
  const linhas = avaliados().map(av => [
    av.id, av.endereco, av.serie, av.modelo,
    av.certificado,
    av.validade ? formatarData(av.validade) : '',
    ROTULO_CERT[av.statusCert],
    av.troca ? formatarData(av.troca) : '',
    av.vencimento ? formatarData(av.vencimento) : '',
    ROTULO_STATUS[av.status]
  ].map(c => `"${String(c).replace(/"/g, '""')}"`).join(';'));

  baixar(`dataloggers-${paraTextoISO(HOJE)}.csv`,
         '\uFEFF' + [cab.join(';'), ...linhas].join('\r\n'),
         'text/csv;charset=utf-8');
  avisar('CSV baixado.');
});

document.getElementById('exportarJson').addEventListener('click', () => {
  const dados = DATALOGGERS.map(({ id, endereco, serie, modelo, ultimaTroca, certificado, validadeCert }) =>
    ({ id, endereco, serie, modelo, ultimaTroca, certificado, validadeCert }));
  baixar(`dataloggers-${paraTextoISO(HOJE)}.json`, JSON.stringify(dados, null, 2), 'application/json');
  avisar('Registro salvo. Guarde o arquivo para carregar depois.');
});

document.getElementById('importarJson').addEventListener('change', e => {
  const arquivo = e.target.files[0];
  if (!arquivo) return;

  const leitor = new FileReader();
  leitor.onload = () => {
    try {
      const dados = JSON.parse(leitor.result);
      if (!Array.isArray(dados)) throw new Error('formato');

      let aplicados = 0;
      dados.forEach(reg => {
        const item = DATALOGGERS.find(d => d.id === reg.id);
        if (item) {
          item.ultimaTroca  = reg.ultimaTroca  || null;
          item.certificado  = reg.certificado  || '';
          item.validadeCert = reg.validadeCert || null;
          aplicados++;
        }
      });

      renderTudo();
      avisar(`${aplicados} registro(s) carregado(s).`);
    } catch {
      avisar('Arquivo inválido. Use um registro salvo por esta página.');
    }
    e.target.value = '';
  };
  leitor.readAsText(arquivo);
});

/* ---------- 9. Início ---------- */

el.dataHoje.textContent = formatarData(HOJE);

[...new Set(DATALOGGERS.map(d => d.modelo))].sort().forEach(m => {
  const op = document.createElement('option');
  op.value = m;
  op.textContent = m;
  el.fModelo.appendChild(op);
});

renderTudo();
