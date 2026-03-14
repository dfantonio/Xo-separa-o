# PRD: Xô Separação

## Introdução

"Xô Separação" é um aplicativo mobile para casais organizarem a rotina doméstica juntos. O casal se conecta por um código compartilhado, divide tarefas por dia da semana, marca o que foi feito e acumula pontos — criando engajamento e leveza na divisão das responsabilidades do lar. O app envia lembretes locais agendados para motivar a conclusão das tarefas, sem depender de infraestrutura de push notifications remoto (não requer Apple Developer License).

---

## Goals

- Permitir que casais se conectem em um espaço compartilhado via código de convite
- Organizar tarefas domésticas por dia da semana com checklists
- Notificar localmente o usuário às 15h e às 20h quando há tarefas pendentes no dia
- Gamificar a rotina com um sistema de pontos e ranking do casal
- Sincronizar dados em tempo real entre os dispositivos do casal
- Funcionar em Android e iOS usando React Native com Expo

---

## User Stories

### US-001: Criar sessão do casal

**Description:** Como usuário novo, quero criar uma sessão para o meu casal para que meu cônjuge possa entrar e compartilharmos as tarefas.

**Acceptance Criteria:**

- [ ] Tela inicial com botões "Criar casal" e "Entrar com código"
- [ ] "Criar casal" gera um código único de 6 caracteres (ex: `XO4F2A`)
- [ ] O código é exibido em destaque e pode ser copiado com um toque
- [ ] A sessão é salva no backend e associada ao dispositivo do criador
- [ ] Typecheck/lint passa

### US-002: Entrar em uma sessão existente

**Description:** Como cônjuge, quero inserir o código gerado pelo meu parceiro para me conectar à sessão compartilhada.

**Acceptance Criteria:**

- [ ] Campo de entrada para o código de 6 caracteres
- [ ] Exibe erro claro se o código for inválido ou já tiver 2 membros
- [ ] Ao entrar, é redirecionado para a tela principal compartilhada
- [ ] Typecheck/lint passa

### US-003: Definir nome de perfil

**Description:** Como usuário, quero definir meu nome no app para que as tarefas e o ranking identifiquem quem é quem.

**Acceptance Criteria:**

- [ ] Campo de nome na tela de onboarding (pós-criação ou entrada na sessão)
- [ ] Nome exibido no ranking e nas tarefas atribuídas
- [ ] Máximo de 20 caracteres
- [ ] Typecheck/lint passa

### US-004: Criar tarefa para um dia da semana

**Description:** Como usuário, quero criar uma tarefa e associá-la a um dia da semana para organizar a rotina do lar.

**Acceptance Criteria:**

- [ ] Formulário com: nome da tarefa, dia da semana (seg a dom), responsável (eu / cônjuge / ambos), nível de dificuldade
- [ ] Nível de dificuldade tem 4 opções selecionáveis com nome, ícone e pontuação correspondente:
  - 🟢 **Fácil** → 5 pts (ex: tirar o lixo)
  - 🟡 **Médio** → 10 pts (ex: lavar louça)
  - 🟠 **Difícil** → 20 pts (ex: limpar banheiro)
  - 🔴 **Heroico** → 40 pts (ex: faxina geral)
- [ ] Tarefa salva no backend e visível para os dois em tempo real
- [ ] Limite de 60 caracteres no nome da tarefa
- [ ] Typecheck/lint passa

### US-005: Visualizar tarefas do dia atual

**Description:** Como usuário, quero ver as tarefas de hoje ao abrir o app para saber o que ainda precisa ser feito.

**Acceptance Criteria:**

- [ ] Tela principal mostra o dia atual com as tarefas pendentes e concluídas
- [ ] Tarefas pendentes aparecem primeiro, concluídas ao final com riscado
- [ ] Indicador visual de responsável (ícone/cor: eu, cônjuge, ambos)
- [ ] Typecheck/lint passa

### US-006: Navegar entre os dias da semana

**Description:** Como usuário, quero navegar entre os dias da semana para ver e planejar tarefas futuras ou passadas.

**Acceptance Criteria:**

- [ ] Abas ou seletor horizontal com os 7 dias da semana
- [ ] Dia atual destacado visualmente
- [ ] Ao selecionar um dia, lista as tarefas daquele dia
- [ ] Typecheck/lint passa

### US-007: Marcar tarefa como concluída (checklist)

**Description:** Como usuário, quero marcar uma tarefa como concluída para registrar o que já foi feito e ganhar os pontos correspondentes ao nível da tarefa.

**Acceptance Criteria:**

- [ ] Checkbox ao lado de cada tarefa
- [ ] Ao marcar, a tarefa recebe animação de conclusão e fica riscada
- [ ] O membro que marcou recebe os pontos do nível da tarefa (5 / 10 / 20 / 40)
- [ ] O badge de pontos ganhos aparece brevemente na tela (ex: "+20 pts!")
- [ ] Estado sincronizado em tempo real no app do cônjuge
- [ ] É possível desmarcar (os pontos são subtraídos)
- [ ] Typecheck/lint passa

### US-008: Editar ou excluir tarefa

**Description:** Como usuário, quero editar ou excluir uma tarefa que criei para manter a lista atualizada.

**Acceptance Criteria:**

- [ ] Swipe na tarefa ou botão de opções revela ações: Editar / Excluir
- [ ] Excluir exibe confirmação antes de remover
- [ ] Edição abre o mesmo formulário de criação pré-preenchido
- [ ] Qualquer membro do casal pode editar/excluir qualquer tarefa
- [ ] Typecheck/lint passa

### US-009: Receber notificação local às 15h e 20h

**Description:** Como usuário, quero receber lembretes automáticos às 15h e às 20h quando houver tarefas pendentes no dia para não esquecer de completá-las.

**Acceptance Criteria:**

- [ ] Ao abrir o app pela primeira vez, solicitar permissão de notificações
- [ ] Se houver tarefas pendentes no dia, agendar notificação local para 15h e 20h usando `expo-notifications`
- [ ] Notificação exibe texto: "Você ainda tem tarefas pendentes hoje! Abra o Xô Separação."
- [ ] Se não houver tarefas pendentes, nenhuma notificação é enviada naquele horário
- [ ] Notificações são reagendadas diariamente (ex: ao abrir o app ou via task em background)
- [ ] Funciona em Android e iOS sem necessidade de servidor de push remoto
- [ ] Typecheck/lint passa

### US-010: Ver pontuação e ranking do casal

**Description:** Como usuário, quero ver minha pontuação e a do meu cônjuge para acompanhar quem está contribuindo mais com a casa.

**Acceptance Criteria:**

- [ ] Tela de ranking exibe nome + pontuação de cada membro
- [ ] Exibe pontuação do mês atual e indica quando será o próximo reset (1º do mês seguinte)
- [ ] Líder do ranking tem destaque visual (troféu ou coroa)
- [ ] Pontuação atualiza em tempo real após marcar tarefa
- [ ] Typecheck/lint passa

### US-010b: Reset mensal de pontuação

**Description:** Como usuário, quero que a pontuação seja resetada todo mês para que o jogo se renove e mantenha o engajamento.

**Acceptance Criteria:**

- [ ] No primeiro dia de cada mês, as pontuações de ambos os membros são zeradas automaticamente
- [ ] O reset é feito no backend (Firestore) via verificação de data ao abrir o app ou via Cloud Function agendada
- [ ] Após o reset, a tela de ranking exibe "0 pts" para ambos
- [ ] Typecheck/lint passa

### US-011: Sincronização em tempo real

**Description:** Como casal, queremos que as alterações feitas por um apareçam imediatamente no app do outro para evitar conflitos e duplicidade.

**Acceptance Criteria:**

- [ ] Tarefa criada por um aparece no app do outro em menos de 3 segundos
- [ ] Marcação de conclusão reflete em tempo real no outro dispositivo
- [ ] Pontuação atualiza em tempo real
- [ ] Se offline, as ações ficam em fila e sincronizam ao reconectar
- [ ] Typecheck/lint passa

---

## Functional Requirements

- FR-1: O app deve ser desenvolvido em React Native com Expo, suportando Android e iOS
- FR-2: O sistema de sessão do casal deve usar um código de 6 caracteres para conexão
- FR-3: Cada sessão suporta exatamente 2 membros
- FR-4: Tarefas devem ser associadas a um dia da semana (recorrência semanal automática)
- FR-5: Cada tarefa tem um responsável: Membro A, Membro B, ou Ambos
- FR-6: Cada tarefa tem um nível de dificuldade obrigatório: Fácil (5 pts), Médio (10 pts), Difícil (20 pts), Heroico (40 pts)
- FR-7: Ao concluir uma tarefa, o membro que marcou recebe os pontos correspondentes ao nível da tarefa
- FR-8: Ao desmarcar uma tarefa, os pontos correspondentes são subtraídos do membro que a havia marcado
- FR-9: Tarefas do tipo "Ambos" são consideradas concluídas quando qualquer um dos dois membros marcar — apenas esse membro recebe os pontos
- FR-10: Notificações locais devem ser agendadas diariamente para 15h e 20h usando `expo-notifications`
- FR-11: Notificações só são enviadas se houver tarefas pendentes no dia atual do usuário
- FR-12: A pontuação reseta automaticamente no primeiro dia de cada mês para ambos os membros
- FR-13: Dados do casal (tarefas, pontos, nomes) devem ser sincronizados em tempo real via backend (Firebase Firestore recomendado)
- FR-14: O app deve funcionar offline com sincronização ao reconectar (Firestore offline persistence)
- FR-15: A pontuação é individual, mensal, e visível para ambos os membros

---

## Non-Goals (Fora do Escopo)

- Notificações push remotas (APNs / FCM) — o app usa apenas notificações locais agendadas
- Login com e-mail/senha ou redes sociais — a sessão é identificada pelo código do casal
- Mais de 2 membros por sessão
- Organização por cômodo da casa (ex: cozinha, quarto) — apenas por dia da semana
- Chat ou mensagens entre o casal dentro do app
- Histórico de semanas anteriores (tarefas são semanais e recorrentes)
- Modo escuro
- Publicação na App Store (requer Apple Developer License — fora do escopo desta versão)

---

## Design Considerations

- **Tom visual:** Leve, colorido, acolhedor — evitar aparência corporativa ou clínica
- **Cores sugeridas:** Tons de coral/rosa e azul suave para representar o casal
- **Tela principal:** Lista de tarefas do dia com abas de navegação por dia da semana
- **Ranking:** Destaque visual com troféu para o líder
- **Checklist:** Animação de confete ou check animado ao concluir tarefa para reforço positivo; badge "+X pts!" aparece brevemente
- **Nível de dificuldade:** Badge colorido visível em cada tarefa na lista (🟢🟡🟠🔴) para identificar o peso da tarefa de relance
- **Ícones de responsável:** Iniciais ou avatares coloridos para identificar quem é quem

---

## Technical Considerations

- **Framework:** React Native com Expo SDK (managed workflow)
- **Notificações:** `expo-notifications` para notificações locais agendadas — não requer Apple Developer License para funcionar em modo de desenvolvimento ou builds via Expo Go; para distribuição em produção no Android (APK/AAB) funciona normalmente
- **Backend/Sync:** Firebase Firestore (tempo real, offline persistence integrada) ou Supabase como alternativa
- **Armazenamento local:** `expo-secure-store` para salvar o código da sessão e nome do usuário no dispositivo
- **Navegação:** `expo-router` ou `react-navigation`
- **Background tasks:** `expo-task-manager` + `expo-background-fetch` para reagendar notificações locais diariamente sem abrir o app

---

## Success Metrics

- O casal consegue se conectar em menos de 2 minutos após instalar o app
- Criar e atribuir uma tarefa leva menos de 30 segundos
- Notificações disparam corretamente às 15h e 20h quando há tarefas pendentes
- Alterações de um membro aparecem no dispositivo do outro em menos de 3 segundos
- Ambos os membros conseguem ver o ranking atualizado após marcar uma tarefa

---

## Open Questions

- O app deve ter um avatar customizável (foto ou emoji) além do nome, para o ranking ficar mais visual?
- Os nomes dos níveis (Fácil / Médio / Difícil / Heroico) e as pontuações (5/10/20/40) estão bons ou quer ajustar?
