/**
 * USET Brasil — Cronograma de Montagem
 * Google Apps Script: Setup automático da planilha
 *
 * COMO USAR:
 *  1. Abra uma planilha Google Sheets em branco
 *  2. Clique em Extensões > Apps Script
 *  3. Cole este código no editor (substitua todo o conteúdo)
 *  4. Clique em "Executar" (função: setupPlanilha)
 *  5. Autorize as permissões solicitadas
 *  6. Aguarde ~30 segundos — todas as abas serão criadas automaticamente
 */

// ============================================================
// PONTO DE ENTRADA
// ============================================================
function setupPlanilha() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  criarAbaEventos(ss);
  criarAbaProdutores(ss);
  criarAbaEstandes(ss);
  criarAbaTarefas(ss);
  criarAbaLog(ss);
  criarAbaDashboard(ss);
  removerAbaDefault(ss);

  SpreadsheetApp.getUi().alert(
    '✅ Planilha criada com sucesso!\n\n' +
    'Próximo passo: acesse appsheet.com e conecte esta planilha.\n\n' +
    'Consulte o arquivo appsheet/config-guide.md no repositório.'
  );
}

// ============================================================
// UTILITÁRIOS
// ============================================================

function getOuCriarAba(ss, nome) {
  let aba = ss.getSheetByName(nome);
  if (!aba) {
    aba = ss.insertSheet(nome);
  } else {
    aba.clearContents();
    aba.clearFormats();
  }
  return aba;
}

function removerAbaDefault(ss) {
  const abaDefault = ss.getSheetByName('Página1') || ss.getSheetByName('Sheet1');
  if (abaDefault && ss.getSheets().length > 1) {
    ss.deleteSheet(abaDefault);
  }
}

function estilizarCabecalho(sheet, numColunas) {
  const cabecalho = sheet.getRange(1, 1, 1, numColunas);
  cabecalho.setBackground('#1a1a2e');
  cabecalho.setFontColor('#ffffff');
  cabecalho.setFontWeight('bold');
  cabecalho.setFontSize(10);
  sheet.setFrozenRows(1);
}

function adicionarDropdown(sheet, linha, coluna, numLinhas, opcoes) {
  const range = sheet.getRange(linha, coluna, numLinhas, 1);
  const regra = SpreadsheetApp.newDataValidation()
    .requireValueInList(opcoes, true)
    .setAllowInvalid(false)
    .build();
  range.setDataValidation(regra);
}

// ============================================================
// ABA: Eventos
// ============================================================
function criarAbaEventos(ss) {
  const sheet = getOuCriarAba(ss, 'Eventos');

  const cabecalhos = [
    'ID_Evento', 'Nome_Evento', 'Local', 'Data_Inicio', 'Data_Fim', 'Status_Evento'
  ];
  sheet.getRange(1, 1, 1, cabecalhos.length).setValues([cabecalhos]);
  estilizarCabecalho(sheet, cabecalhos.length);

  adicionarDropdown(sheet, 2, 6, 500, [
    'Planejado', 'Em Montagem', 'Concluído', 'Cancelado'
  ]);

  sheet.getRange(2, 4, 500, 2).setNumberFormat('dd/MM/yyyy');

  sheet.setColumnWidth(1, 100);
  sheet.setColumnWidth(2, 220);
  sheet.setColumnWidth(3, 220);
  sheet.setColumnWidth(4, 110);
  sheet.setColumnWidth(5, 110);
  sheet.setColumnWidth(6, 130);

  sheet.getRange(2, 1, 1, 6).setValues([
    ['EVT-001', 'FEICON 2025', 'Expo Center Norte — Hall A',
     new Date('2025-03-10'), new Date('2025-03-14'), 'Em Montagem']
  ]);

  const regra = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=MOD(ROW(),2)=0')
    .setBackground('#f8f9fa')
    .setRanges([sheet.getRange('A2:F1000')])
    .build();
  sheet.setConditionalFormatRules([regra]);
}

// ============================================================
// ABA: Produtores
// ============================================================
function criarAbaProdutores(ss) {
  const sheet = getOuCriarAba(ss, 'Produtores');

  const cabecalhos = ['ID_Produtor', 'Nome', 'Email', 'Telefone', 'Ativo'];
  sheet.getRange(1, 1, 1, cabecalhos.length).setValues([cabecalhos]);
  estilizarCabecalho(sheet, cabecalhos.length);

  const regraCheckbox = SpreadsheetApp.newDataValidation()
    .requireCheckbox()
    .build();
  sheet.getRange(2, 5, 500, 1).setDataValidation(regraCheckbox);

  sheet.setColumnWidth(1, 110);
  sheet.setColumnWidth(2, 180);
  sheet.setColumnWidth(3, 230);
  sheet.setColumnWidth(4, 140);
  sheet.setColumnWidth(5, 70);

  sheet.getRange(2, 1, 2, 5).setValues([
    ['PRD-01', 'Carlos Silva', 'carlos.silva@uset.com.br', '(11) 99999-0001', true],
    ['PRD-02', 'Ana Souza',   'ana.souza@uset.com.br',   '(11) 99999-0002', true]
  ]);

  sheet.getRange('C1')
    .setFontColor('#ff6b35')
    .setNote(
      'CRÍTICO: Este e-mail deve ser exatamente o e-mail Google do produtor.\n' +
      'O AppSheet usa este campo para autenticação e filtros de segurança.'
    );
}

// ============================================================
// ABA: Estandes
// ============================================================
function criarAbaEstandes(ss) {
  const sheet = getOuCriarAba(ss, 'Estandes');

  const cabecalhos = [
    'ID_Estande',              // A
    'ID_Evento',               // B
    'Numero_Estande',          // C
    'Nome_Expositor',          // D
    'Metros_Quadrados',        // E
    'ID_Produtor_Responsavel', // F
    'Status_Estande',          // G
    'Tarefas_Concluidas',      // H — fórmula automática
    'Total_Tarefas',           // I — fórmula automática
    'Percentual_Conclusao',    // J — fórmula automática
    'Observacoes_Gerais'       // K
  ];
  sheet.getRange(1, 1, 1, cabecalhos.length).setValues([cabecalhos]);
  estilizarCabecalho(sheet, cabecalhos.length);

  adicionarDropdown(sheet, 2, 7, 500, [
    'Não Iniciado', 'Em Andamento', 'Concluído', 'Bloqueado'
  ]);

  for (let row = 2; row <= 501; row++) {
    sheet.getRange(row, 8).setFormula(
      `=IF(A${row}="","",COUNTIFS(Tarefas!$C:$C,A${row},Tarefas!$G:$G,"Concluído"))`
    );
    sheet.getRange(row, 9).setFormula(
      `=IF(A${row}="","",COUNTIF(Tarefas!$C:$C,A${row}))`
    );
    sheet.getRange(row, 10).setFormula(
      `=IFERROR(IF(A${row}="","",H${row}/I${row}),0)`
    );
  }

  sheet.getRange(2, 10, 500, 1).setNumberFormat('0%');

  const regras = [
    SpreadsheetApp.newConditionalFormatRule()
      .whenNumberEqualTo(1)
      .setBackground('#d4edda').setFontColor('#155724')
      .setRanges([sheet.getRange('J2:J1000')]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenNumberGreaterThanOrEqualTo(0.5)
      .setBackground('#fff3cd').setFontColor('#856404')
      .setRanges([sheet.getRange('J2:J1000')]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenNumberLessThan(0.5)
      .setBackground('#f8d7da').setFontColor('#721c24')
      .setRanges([sheet.getRange('J2:J1000')]).build()
  ];
  sheet.setConditionalFormatRules(regras);

  sheet.getRange('H1:J1')
    .setBackground('#5a5a8a')
    .setNote('Colunas calculadas automaticamente. Não edite manualmente.');
  sheet.getRange(2, 8, 500, 3).setBackground('#f0f0f0');

  const larguras = [110, 100, 130, 200, 130, 180, 130, 150, 120, 160, 220];
  larguras.forEach((w, i) => sheet.setColumnWidth(i + 1, w));

  sheet.getRange(2, 1, 2, 7).setValues([
    ['EST-001', 'EVT-001', 'A-42', 'Expositor Alpha Ltda', 36, 'PRD-01', 'Em Andamento'],
    ['EST-002', 'EVT-001', 'B-15', 'Beta Soluções S/A',   24, 'PRD-02', 'Não Iniciado']
  ]);
}

// ============================================================
// ABA: Tarefas
// ============================================================
function criarAbaTarefas(ss) {
  const sheet = getOuCriarAba(ss, 'Tarefas');

  const cabecalhos = [
    'ID_Tarefa',          // A
    'ID_Evento',          // B
    'ID_Estande',         // C
    'Nome_Tarefa',        // D
    'Categoria',          // E
    'ID_Produtor',        // F
    'Status',             // G — AppSheet escreve via Action
    'Prioridade',         // H
    'Data_Prevista',      // I
    'Data_Inicio_Real',   // J — AppSheet escreve via Action
    'Data_Conclusao_Real',// K — AppSheet escreve via Action
    'Observacoes',        // L
    'Foto_Evidencia',     // M — URL do Drive (AppSheet gerencia)
    'Criado_Em'           // N — timestamp automático
  ];
  sheet.getRange(1, 1, 1, cabecalhos.length).setValues([cabecalhos]);
  estilizarCabecalho(sheet, cabecalhos.length);

  adicionarDropdown(sheet, 2, 5, 500, [
    'Estrutura', 'Elétrica', 'Marcenaria', 'Acabamento', 'Limpeza', 'Vistoria'
  ]);
  adicionarDropdown(sheet, 2, 7, 500, [
    'Pendente', 'Em Andamento', 'Concluído', 'Bloqueado'
  ]);
  adicionarDropdown(sheet, 2, 8, 500, [
    'Alta', 'Média', 'Baixa'
  ]);

  sheet.getRange(2, 9, 500, 1).setNumberFormat('dd/MM/yyyy');
  sheet.getRange(2, 10, 500, 2).setNumberFormat('dd/MM/yyyy HH:mm:ss');
  sheet.getRange(2, 14, 500, 1).setNumberFormat('dd/MM/yyyy HH:mm:ss');

  const statusCores = [
    { valor: 'Concluído',    bg: '#d4edda', fg: '#155724' },
    { valor: 'Em Andamento', bg: '#cce5ff', fg: '#004085' },
    { valor: 'Bloqueado',    bg: '#f8d7da', fg: '#721c24' },
    { valor: 'Pendente',     bg: '#fff3cd', fg: '#856404' }
  ];
  const regras = statusCores.map(r =>
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(r.valor)
      .setBackground(r.bg).setFontColor(r.fg)
      .setRanges([sheet.getRange('G2:G1000')])
      .build()
  );
  sheet.setConditionalFormatRules(regras);

  ['J1:K1', 'M1:N1'].forEach(range => {
    sheet.getRange(range)
      .setBackground('#5a5a8a')
      .setNote('Preenchido automaticamente pelo AppSheet. Não edite manualmente.');
  });
  sheet.getRange(2, 10, 500, 2).setBackground('#f0f0f0');
  sheet.getRange(2, 13, 500, 2).setBackground('#f0f0f0');

  const larguras = [110, 100, 110, 260, 120, 120, 120, 90, 110, 160, 160, 220, 140, 160];
  larguras.forEach((w, i) => sheet.setColumnWidth(i + 1, w));

  sheet.getRange(2, 1, 4, 9).setValues([
    ['TAR-0001', 'EVT-001', 'EST-001', 'Montagem da estrutura metálica',  'Estrutura',  'PRD-01', 'Em Andamento', 'Alta',  new Date('2025-03-11')],
    ['TAR-0002', 'EVT-001', 'EST-001', 'Instalação elétrica do painel',   'Elétrica',   'PRD-01', 'Pendente',     'Alta',  new Date('2025-03-12')],
    ['TAR-0003', 'EVT-001', 'EST-001', 'Aplicação do revestimento',       'Acabamento', 'PRD-01', 'Pendente',     'Média', new Date('2025-03-13')],
    ['TAR-0004', 'EVT-001', 'EST-002', 'Montagem do piso elevado',        'Estrutura',  'PRD-02', 'Pendente',     'Alta',  new Date('2025-03-11')]
  ]);
  sheet.getRange(2, 14, 4, 1).setValue(new Date());
}

// ============================================================
// ABA: Log_Atualizacoes
// ============================================================
function criarAbaLog(ss) {
  const sheet = getOuCriarAba(ss, 'Log_Atualizacoes');

  const cabecalhos = [
    'ID_Log', 'ID_Tarefa', 'Email_Usuario',
    'Status_Anterior', 'Status_Novo', 'Timestamp', 'Dispositivo'
  ];
  sheet.getRange(1, 1, 1, cabecalhos.length).setValues([cabecalhos]);
  estilizarCabecalho(sheet, cabecalhos.length);

  sheet.getRange(2, 6, 500, 1).setNumberFormat('dd/MM/yyyy HH:mm:ss');

  sheet.getRange('A1').setNote(
    'AUDITORIA AUTOMÁTICA\n' +
    'ID_Log: gerado pelo AppSheet com UNIQUEID()\n' +
    'Todas as colunas são preenchidas pela Action "Registrar Log".\n' +
    'Não edite esta aba manualmente.'
  );

  const larguras = [130, 110, 230, 130, 130, 160, 160];
  larguras.forEach((w, i) => sheet.setColumnWidth(i + 1, w));

  const protection = sheet.protect().setDescription('Auditoria — apenas AppSheet pode escrever');
  protection.setWarningOnly(true);
}

// ============================================================
// ABA: DASHBOARD
// ============================================================
function criarAbaDashboard(ss) {
  const sheet = getOuCriarAba(ss, 'DASHBOARD');

  sheet.getRange('A1:G1').merge()
    .setValue('USET Brasil — Painel de Controle de Montagem')
    .setBackground('#1a1a2e')
    .setFontColor('#ffffff')
    .setFontSize(14)
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
  sheet.setRowHeight(1, 40);

  sheet.getRange('A2').setValue('Evento Ativo (ID):').setFontWeight('bold');
  sheet.getRange('B2')
    .setValue('EVT-001')
    .setBackground('#fff3cd')
    .setFontWeight('bold')
    .setNote('Altere este valor para filtrar todos os KPIs por evento.');

  const kpis = [
    { label: 'Total de Tarefas',
      formula: '=COUNTIF(Tarefas!$B:$B,$B$2)',
      cor: '#cce5ff', fg: '#004085', row: 5 },
    { label: 'Tarefas Concluídas',
      formula: '=COUNTIFS(Tarefas!$B:$B,$B$2,Tarefas!$G:$G,"Concluído")',
      cor: '#d4edda', fg: '#155724', row: 7 },
    { label: '⚠ Tarefas Bloqueadas',
      formula: '=COUNTIFS(Tarefas!$B:$B,$B$2,Tarefas!$G:$G,"Bloqueado")',
      cor: '#f8d7da', fg: '#721c24', row: 9 },
    { label: 'Em Andamento',
      formula: '=COUNTIFS(Tarefas!$B:$B,$B$2,Tarefas!$G:$G,"Em Andamento")',
      cor: '#e2d9f3', fg: '#5a1e8c', row: 11 },
    { label: '% Conclusão Geral',
      formula: '=IFERROR(COUNTIFS(Tarefas!$B:$B,$B$2,Tarefas!$G:$G,"Concluído")/COUNTIF(Tarefas!$B:$B,$B$2),0)',
      cor: '#d1ecf1', fg: '#0c5460', row: 13, formato: '0%' },
    { label: 'Estandes 100% Prontos',
      formula: '=COUNTIFS(Estandes!$B:$B,$B$2,Estandes!$J:$J,1)',
      cor: '#d4edda', fg: '#155724', row: 15 }
  ];

  kpis.forEach(kpi => {
    sheet.getRange(`A${kpi.row}`).setValue(kpi.label).setFontWeight('bold');
    const cell = sheet.getRange(`B${kpi.row}`);
    cell.setFormula(kpi.formula)
      .setBackground(kpi.cor)
      .setFontColor(kpi.fg)
      .setFontSize(14)
      .setFontWeight('bold')
      .setHorizontalAlignment('center');
    if (kpi.formato) cell.setNumberFormat(kpi.formato);
    sheet.setRowHeight(kpi.row, 35);
  });

  sheet.getRange('D4:G4').merge()
    .setValue('Progresso por Produtor')
    .setBackground('#343a40').setFontColor('#ffffff')
    .setFontWeight('bold').setHorizontalAlignment('center');

  sheet.getRange(5, 4, 1, 4).setValues([['Produtor', 'Total', 'Concluídas', '% Feito']])
    .setBackground('#495057').setFontColor('#ffffff').setFontWeight('bold');

  sheet.getRange('D6').setFormula(
    '=IFERROR(QUERY({Produtores!$B:$B,' +
    'ARRAYFORMULA(COUNTIFS(Tarefas!$F:$F,Produtores!$A:$A,Tarefas!$B:$B,$B$2)),' +
    'ARRAYFORMULA(COUNTIFS(Tarefas!$F:$F,Produtores!$A:$A,Tarefas!$B:$B,$B$2,Tarefas!$G:$G,"Concluído"))},' +
    '"SELECT Col1,Col2,Col3,Col3/Col2 WHERE Col2>0 LABEL Col1\'\',Col2\'\',Col3\'\',Col3/Col2 \'\'"),"")'
  );
  sheet.getRange(6, 7, 20, 1).setNumberFormat('0%');

  sheet.getRange('D26:G26').merge()
    .setValue('⚠ Tarefas Bloqueadas no Evento')
    .setBackground('#721c24').setFontColor('#ffffff')
    .setFontWeight('bold').setHorizontalAlignment('center');

  sheet.getRange(27, 4, 1, 4)
    .setValues([['Estande', 'Tarefa', 'Produtor', 'Status']])
    .setBackground('#f5c6cb').setFontWeight('bold');

  sheet.getRange('D28').setFormula(
    '=IFERROR(QUERY({Tarefas!$C:$C,Tarefas!$D:$D,Tarefas!$F:$F,Tarefas!$G:$G,Tarefas!$B:$B},' +
    '"SELECT Col1,Col2,Col3,Col4 WHERE Col4=\'Bloqueado\' AND Col5=\'"&$B$2&"\' LABEL Col1\'\',Col2\'\',Col3\'\',Col4 \'\'"),"")'
  );

  sheet.getRange('A17').setValue('───────────────────────────────').setFontColor('#cccccc');
  [
    ['A18', 'Como usar este painel:', true],
    ['A19', '1. Altere a célula B2 para o ID do evento ativo.', false],
    ['A20', '2. Todos os KPIs atualizam automaticamente.', false],
    ['A21', '3. Para análise avançada, conecte ao Looker Studio.', false]
  ].forEach(([cell, text, bold]) => {
    const c = sheet.getRange(cell).setValue(text).setFontColor('#6c757d').setFontSize(9);
    if (bold) c.setFontWeight('bold');
  });

  sheet.setColumnWidth(1, 200);
  sheet.setColumnWidth(2, 120);
  sheet.setColumnWidth(3, 40);
  sheet.setColumnWidth(4, 130);
  sheet.setColumnWidth(5, 230);
  sheet.setColumnWidth(6, 130);
  sheet.setColumnWidth(7, 90);
}
