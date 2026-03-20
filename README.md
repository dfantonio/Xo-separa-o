<p align="center">
  <img src="assets/icon.png" alt="Xô Separação" width="120" />
</p>

<h1 align="center">Xô Separação</h1>

<p align="center">App de organização de tarefas domésticas para casais. Divida as responsabilidades do lar, acompanhe quem fez o quê e compita num ranking mensal de pontuação.</p>

## Funcionalidades

- **Criar casal** — um membro cria a sessão e compartilha um código de 6 dígitos para o outro entrar
- **Tarefas recorrentes** — crie tarefas que se repetem toda semana automaticamente
- **Múltiplos dias** — uma tarefa pode ser agendada para vários dias da semana (ex: Seg, Qua e Sex)
- **Acúmulo de tarefas** — tarefas não concluídas acumulam para o dia seguinte (dentro da mesma semana)
- **Pontuação por dificuldade** — tarefas fáceis (5 pts), médias (10 pts), difíceis (20 pts) e heroicas (40 pts)
- **Divisão de pontos** — tarefas atribuídas a "Ambos" podem dividir pontos igualmente ou dar tudo para quem completou
- **Ranking mensal** — veja quem está ganhando no mês, com reset automático no dia 1
- **Notificações locais** — lembretes às 06:30 (motivacional) e 20:00 (tarefas pendentes)
- **Swipe para editar/excluir** — deslize uma tarefa para ver as ações

## Tech Stack

- **React Native** com **Expo** (SDK 55)
- **TypeScript**
- **Firebase Firestore** — banco de dados em tempo real
- **Expo Secure Store** — armazenamento seguro de sessão
- **Expo Notifications** — notificações locais agendadas
- **React Navigation** (Stack) — navegação entre telas

## Estrutura do Projeto

```
src/
  components/
    CreateTask/       # Componentes da tela de criação de tarefa
    Home/             # TaskItem (item de tarefa com swipe)
    Ranking/          # MemberCard (card de pontuação)
  screens/
    OnboardingScreen  # Tela inicial (criar casal / entrar com código)
    CreateSessionScreen # Criar sessão e gerar código
    JoinSessionScreen # Entrar com código do parceiro
    HomeScreen        # Tela principal com tarefas por dia
    CreateTaskScreen  # Criar/editar tarefa
    RankingScreen     # Ranking mensal do casal
  services/
    taskService       # CRUD de tarefas + toggle de conclusão
    sessionService    # Reset mensal de pontuação
    notificationService # Agendamento de notificações locais
  utils/
    weekKey           # Geração de chave ISO de semana
    taskAccumulation  # Lógica de acúmulo de tarefas pendentes
    taskStatus        # Verificação de conclusão por dia
  types/
    task              # Tipos TypeScript (Task, DayOfWeek, etc.)
  config/
    firebase          # Configuração do Firebase
  constants/
    difficulty        # Configuração de dificuldade e pontos
  navigation/
    types             # Tipos de navegação (RootStackParamList)
```

## Como Rodar

### Pré-requisitos

- Node.js 18+
- Yarn
- Expo CLI (`npm install -g expo-cli`)
- [Android Studio](https://developer.android.com/studio) (para emulador Android) ou dispositivo físico
- [Xcode](https://developer.apple.com/xcode/) (para simulador iOS, apenas macOS)

### Setup

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/xo-separacao.git
cd xo-separacao
```

2. Instale as dependências:
```bash
yarn install
```

3. Configure o Firebase:
```bash
cp .env.example .env
```
Edite o `.env` com as credenciais do seu projeto Firebase. Você precisa:
- Criar um projeto no [Firebase Console](https://console.firebase.google.com)
- Registrar um app Web e copiar as credenciais
- Criar um banco Firestore (pode começar em modo de teste)

4. Inicie o app:
```bash
# Expo Go (para testar sem build nativo)
npx expo start

# Development build Android
npx expo run:android

# Development build iOS (requer macOS + Xcode)
npx expo run:ios
```

### Scripts Disponíveis

| Comando | Descrição |
|---|---|
| `yarn start` | Inicia o Metro bundler |
| `yarn android` | Build + instala no Android |
| `yarn ios` | Build + instala no iOS |
| `yarn lint` | Verifica erros com ESLint |
| `yarn lint:fix` | Corrige erros automaticamente |
| `yarn format` | Formata código com Prettier |
| `yarn format:check` | Verifica formatação |

## Regras do Firestore

Para desenvolvimento, use regras abertas:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

> **Importante:** restrinja as regras antes de ir para produção.

## Variáveis de Ambiente

| Variável | Descrição |
|---|---|
| `EXPO_PUBLIC_FIREBASE_API_KEY` | API Key do Firebase |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Auth domain |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Project ID |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage bucket |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Messaging sender ID |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | App ID |

## Licença

MIT
