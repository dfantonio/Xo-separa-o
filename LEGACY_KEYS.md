# Legacy Keys - Completions

## Contexto

Em março/2026, o formato das chaves de completion para tarefas recorrentes foi alterado de **por semana** para **por dia+semana**, para suportar o acúmulo de tarefas e completions independentes por dia agendado.

- **Formato antigo (legacy):** `"2026-W12"` (apenas weekKey)
- **Formato novo:** `"2026-W12-1"` (weekKey + dia agendado, ex: `-1` = segunda)

## Onde estão os fallbacks

O código mantém compatibilidade com o formato antigo nos seguintes locais:

### 1. `src/screens/HomeScreen.tsx` (linha ~56)
```ts
// isCompletedForDay(): checa dayKey primeiro, depois weekKey como fallback
if (weekKey in (task.completions ?? {})) return true; // legacy
```

### 2. `src/screens/HomeScreen.tsx` (linha ~157)
```ts
// handleToggle optimistic update: ao desmarcar, tenta deletar ambas as chaves
delete newCompletions[weekKey]; // Also try legacy key
```

### 3. `src/services/taskService.ts` (linha ~98)
```ts
// deleteTask(): ao excluir tarefa completada, checa dayKey e depois weekKey
const entry = completions[dayKey] ?? completions[weekKey]; // legacy compat
```

### 4. `src/services/taskService.ts` (linha ~148)
```ts
// toggleTaskComplete(): ao desmarcar, busca chave existente (nova ou legacy)
const existingKey = completions[dayKey] ? dayKey : completions[weekKey] ? weekKey : null;
```

### 5. `src/utils/taskAccumulation.ts` (linha ~16)
```ts
// isCompletedForDay(): fallback para chave sem sufixo de dia
if (weekKey in (task.completions ?? {})) return true; // Legacy compat
```

## Quando remover

É seguro remover esses fallbacks quando:
1. Todas as tarefas recorrentes que tinham completions no formato antigo forem concluídas ou excluídas
2. Ou após ~2 meses de uso (as chaves antigas ficam irrelevantes pois são de semanas passadas)

Para remover, basta apagar as linhas de fallback marcadas com `// legacy` nos arquivos listados acima.
