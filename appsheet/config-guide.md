# AppSheet — Guia de Configuração Completo
## USET Brasil · Cronograma de Montagem

> **Pré-requisito:** Execute `google-sheets/setup.gs` primeiro para ter a planilha montada.

---

## ETAPA 1 — Criar o App

1. Acesse [appsheet.com](https://appsheet.com) com a conta Google da USET.
2. **"Create" → "App" → "Start with your own data"**
3. Selecione **Google Sheets** → escolha o arquivo `DB_Cronograma_USET`
4. O AppSheet importará as 5 abas automaticamente.
5. Clique em **"Customize your app"** para abrir o editor.

---

## ETAPA 2 — Configuração das Tabelas (Data › Tables)

### Tabela: `Tarefas`

Navegue em **Data → Tables → Tarefas → View Columns**.

| Coluna | Type | Key? | Editable? | Valor Inicial (Initial Value) |
|---|---|---|---|---|
| `ID_Tarefa` | Text | **SIM** | Não | `CONCATENATE("TAR-", TEXT(MAX(Tarefas[ID_Tarefa])+1,"0000"))` |
| `ID_Evento` | Ref (→ Eventos) | Não | Sim | — |
| `ID_Estande` | Ref (→ Estandes) | Não | Sim | — |
| `Nome_Tarefa` | Text | Não | Sim | — |
| `Categoria` | Enum | Não | Sim | — |
| `ID_Produtor` | Ref (→ Produtores) | Não | Sim | — |
| `Status` | Enum | Não | **Não** | `"Pendente"` |
| `Prioridade` | Enum | Não | Sim | `"Média"` |
| `Data_Prevista` | Date | Não | Sim | — |
| `Data_Inicio_Real` | DateTime | Não | **Não** | — |
| `Data_Conclusao_Real` | DateTime | Não | **Não** | — |
| `Observacoes` | Text | Não | Sim | — |
| `Foto_Evidencia` | Image | Não | Sim | — |
| `Criado_Em` | DateTime | Não | **Não** | `NOW()` |

**Enum values para `Status`:** `Pendente`, `Em Andamento`, `Concluído`, `Bloqueado`  
**Enum values para `Categoria`:** `Estrutura`, `Elétrica`, `Marcenaria`, `Acabamento`, `Limpeza`, `Vistoria`  
**Enum values para `Prioridade`:** `Alta`, `Média`, `Baixa`

---

### Tabela: `Estandes`

| Coluna | Type | Editable? |
|---|---|---|
| `ID_Estande` | Text (Key) | Não |
| `ID_Evento` | Ref (→ Eventos) | Sim |
| `Numero_Estande` | Text | Sim |
| `Nome_Expositor` | Text | Sim |
| `Metros_Quadrados` | Number | Sim |
| `ID_Produtor_Responsavel` | Ref (→ Produtores) | Sim |
| `Status_Estande` | Enum | Sim |
| `Tarefas_Concluidas` | Number | **Não** |
| `Total_Tarefas` | Number | **Não** |
| `Percentual_Conclusao` | Percent | **Não** |
| `Observacoes_Gerais` | Text | Sim |

---

### Tabela: `Produtores`

| Coluna | Type | Observação |
|---|---|---|
| `ID_Produtor` | Text (Key) | — |
| `Nome` | Name | — |
| `Email` | Email | **Campo de autenticação** |
| `Telefone` | Phone | — |
| `Ativo` | Yes/No | — |

---

### Tabela: `Log_Atualizacoes`

| Coluna | Type | Initial Value |
|---|---|---|
| `ID_Log` | Text (Key) | `UNIQUEID()` |
| `ID_Tarefa` | Ref (→ Tarefas) | — |
| `Email_Usuario` | Email | `USEREMAIL()` |
| `Status_Anterior` | Text | — |
| `Status_Novo` | Text | — |
| `Timestamp` | DateTime | `NOW()` |
| `Dispositivo` | Text | `CONTEXT("Device")` |

> Marque todas as colunas como **Editable: Não**. Somente as Actions escrevem nesta tabela.

---

## ETAPA 3 — Segurança e Autenticação (Security)

1. **Security → Require Sign-In:** `ON`
2. **Authentication provider:** `Google`
3. **Manage Users → Use a user table:** `ON`
   - **User table:** `Produtores`
   - **User email column:** `Email`
4. Em **User settings → User identity**, defina:
   - **User identity expression:** `USEREMAIL()`

---

## ETAPA 4 — Views / Telas (UX › Views)

### View 1: `Minhas Tarefas` (tela principal do produtor)

| Campo | Valor |
|---|---|
| View name | `Minhas Tarefas` |
| For this data | `Tarefas` |
| View type | `Deck` |
| Position | `Left most` (ícone principal) |
| Row filter condition | *ver expressão abaixo* |
| Sort | `Prioridade` ASC, `Data_Prevista` ASC |

**Row filter condition:**
```
AND(
  [ID_Produtor] = LOOKUP(USEREMAIL(), "Produtores", "Email", "ID_Produtor"),
  [Status] <> "Concluído"
)
```

**Display settings:**
- Primary header: `Nome_Tarefa`
- Secondary header: `[ID_Estande].[Nome_Expositor]`
- Summary column: `Status`

---

### View 2: `Meus Estandes`

| Campo | Valor |
|---|---|
| View name | `Meus Estandes` |
| For this data | `Estandes` |
| View type | `Gallery` |
| Row filter condition | *ver expressão abaixo* |

**Row filter condition:**
```
[ID_Produtor_Responsavel] = LOOKUP(USEREMAIL(), "Produtores", "Email", "ID_Produtor")
```

**Display settings:**
- Primary header: `Nome_Expositor`
- Secondary header: `Numero_Estande`
- Image/badge: `Percentual_Conclusao`

---

### View 3: `Detalhe da Tarefa` (form view)

O AppSheet gera automaticamente. Para personalizar:

1. **UX → Views → Tarefas_Detail**
2. Reordene as colunas para que `Status` apareça **no topo**
3. Mova `Foto_Evidencia` para a segunda posição
4. Agrupe campos opcionais (`Observacoes`, timestamps) no final

---

### View 4: `Histórico` (visão do log — opcional)

| Campo | Valor |
|---|---|
| View name | `Histórico` |
| For this data | `Log_Atualizacoes` |
| View type | `Table` |
| Row filter condition | `[Email_Usuario] = USEREMAIL()` |
| Sort | `Timestamp` DESC |

---

## ETAPA 5 — Actions (Behavior › Actions)

### Action 1: `✅ Marcar como Concluído`

| Campo | Valor |
|---|---|
| Action name | `✅ Marcar como Concluído` |
| For a record of this table | `Tarefas` |
| Do this | `Data: set the values of some columns in this row` |
| Only if this condition | `[Status] <> "Concluído"` |
| **Prominence** | `Display prominently` ← crítico para UX mobile |
| Icon | `check-circle` |

**Set these columns:**

| Coluna | Valor |
|---|---|
| `Status` | `"Concluído"` |
| `Data_Conclusao_Real` | `NOW()` |

---

### Action 2: `▶ Iniciar Tarefa`

| Campo | Valor |
|---|---|
| Action name | `▶ Iniciar Tarefa` |
| Only if this condition | `[Status] = "Pendente"` |
| Prominence | `Display prominently` |
| Icon | `play` |

**Set these columns:**

| Coluna | Valor |
|---|---|
| `Status` | `"Em Andamento"` |
| `Data_Inicio_Real` | `NOW()` |

---

### Action 3: `🔴 Reportar Bloqueio`

| Campo | Valor |
|---|---|
| Action name | `🔴 Reportar Bloqueio` |
| Only if this condition | `OR([Status] = "Pendente", [Status] = "Em Andamento")` |
| Prominence | `Display prominently` |
| Icon | `alert-circle` |

**Step 1 — Set column:**

| Coluna | Valor |
|---|---|
| `Status` | `"Bloqueado"` |

**Step 2 — Send notification (adicione via "Add linked action"):**

```
To:       "operacoes@uset.com.br"
Subject:  CONCATENATE("⚠ BLOQUEIO: ", [ID_Estande], " — ", [Nome_Tarefa])
Body:     CONCATENATE("Reportado por: ", USEREMAIL(), 
          " | Estande: ", [ID_Estande].[Nome_Expositor],
          " | ", TEXT(NOW(), "dd/MM HH:mm"))
```

---

### Action 4: `📝 Registrar Log` (auditoria — encadeada)

| Campo | Valor |
|---|---|
| Action name | `📝 Registrar Log` |
| For a record of this table | `Tarefas` |
| Do this | `Data: add a new row to another table using values from this row` |
| Table to add to | `Log_Atualizacoes` |

**Set these columns in `Log_Atualizacoes`:**

| Coluna | Valor |
|---|---|
| `ID_Log` | `UNIQUEID()` |
| `ID_Tarefa` | `[ID_Tarefa]` |
| `Email_Usuario` | `USEREMAIL()` |
| `Status_Novo` | `[Status]` |
| `Timestamp` | `NOW()` |
| `Dispositivo` | `CONTEXT("Device")` |

**Encadear às outras actions:**

Para cada action (Concluído, Iniciar, Bloqueio), vá em **"Linked action"** e adicione `📝 Registrar Log`.

---

## ETAPA 6 — Modo Offline (Settings)

1. **Settings → Offline & Sync**
2. **"Offline mode":** `ON`
3. **"Automatically sync on app start":** `ON`
4. **"Automatically sync on data change":** `ON`
5. **Sync interval:** `Every 5 minutes`
6. **"Sync only when on Wi-Fi":** `OFF` (produtores podem usar dados móveis)

---

## ETAPA 7 — Branding Mobile

1. **UX → Brand**
2. **App name:** `USET Montagem`
3. **Primary color:** `#1a1a2e` (azul escuro USET)
4. **Accent color:** `#ff6b35` (laranja de ação)
5. **Logo:** faça upload da logo USET
6. **Background:** `White`

---

## ETAPA 8 — Deploy e Publicação

1. **"Save"** no editor (Ctrl+S)
2. Clique em **"Deploy" → "Move app to deployed state"**
3. Confirme: **"Deploy"**
4. Compartilhe o link do app com os produtores via WhatsApp ou e-mail
5. Os produtores instalam como **PWA** (Android: "Adicionar à tela inicial" no Chrome) ou baixam o **AppSheet app** na Play Store/App Store e fazem login com o e-mail cadastrado em `Produtores`.

---

## Expressões de Referência Rápida

```
// Filtrar pelo usuário logado
USEREMAIL() = [Email]

// Lookup do ID do produtor pelo email
LOOKUP(USEREMAIL(), "Produtores", "Email", "ID_Produtor")

// % de conclusão calculado no app (alternativo à fórmula do Sheets)
COUNTIF(SELECT(Tarefas[Status], [ID_Estande] = [_THISROW].[ID_Estande] AND [Status] = "Concluído"), TRUE)
/ COUNT(SELECT(Tarefas[ID_Tarefa], [ID_Estande] = [_THISROW].[ID_Estande]))

// Timestamp atual
NOW()

// ID único para log
UNIQUEID()

// Dispositivo do usuário
CONTEXT("Device")
```

---

## Troubleshooting Comum

| Problema | Causa | Solução |
|---|---|---|
| Produtor não vê suas tarefas | E-mail na aba `Produtores` diferente do e-mail Google | Verificar e corrigir o campo `Email` na planilha |
| Botão de ação não aparece | Condition da action sempre `FALSE` | Revisar a expressão `Only if this condition` |
| Offline não funciona | `Offline mode` desativado | Settings → Offline & Sync → ativar |
| % conclusão sempre 0 | `ID_Estande` na aba `Tarefas` não bate com `Estandes` | Verificar se são Refs ou Texts puros (devem ser Refs) |
| Log não é gravado | Action `Registrar Log` não encadeada | Verificar `Linked action` em cada action |
