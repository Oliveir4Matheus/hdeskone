# Mockup — Kanban Split View / Centralized View

Visualização lado a lado (split) e centralizada para o Kanban do Hdeskone.
A preferência do usuário (split vs centralizado) é persistida no localStorage.

---

## Toggle de modo

Localizado no cabeçalho do Kanban, ao lado do ViewSwitcher existente.

```
[Table]  [Kanban]  [Gantt]         ⊞ Lado a lado  ⊡ Centralizado
```

- O botão ativo fica highlighted (fundo primário #d70f0a)
- O estado persiste em localStorage como `kanban-panel-mode: "split" | "centered"`

---

## Modo Split — Lado a Lado

Nenhum ticket selecionado:

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Tickets               [Table][Kanban][Gantt]   [⊞ Lado a lado][⊡ Central] │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ABERTO (3)       EM ANDAMENTO (2)   AGUARDANDO (1)   FECHADO (5)          │
│  ┌──────────┐     ┌──────────┐       ┌──────────┐                          │
│  │ #42      │     │ #38      │       │ #41      │                          │
│  │ Deploy   │     │ Config   │       │ VPN      │                          │
│  │ erro prod│     │ nginx    │       │ acesso   │                          │
│  │[urgent]  │     │[high]    │       │[medium]  │                          │
│  │GRU · Ana │     │BSB · Tom │       │GRU · Lia │                          │
│  └──────────┘     └──────────┘       └──────────┘                          │
│  ┌──────────┐     ┌──────────┐                                             │
│  │ #39      │     │ #40      │                                             │
│  │ Login    │     │ Permissão│                                             │
│  │ falha    │     │ sistema  │                                             │
│  │[medium]  │     │[low]     │                                             │
│  │CGH · Bob │     │CGH · Lia │                                             │
│  └──────────┘     └──────────┘                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

Ticket selecionado (card clicado abre painel à direita, board encolhe):

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Tickets               [Table][Kanban][Gantt]   [⊞ Lado a lado][⊡ Central] │
├──────────────────────────────────────────────┬─────────────────────────────┤
│                                              │  #42  Deploy erro prod  [×] │
│  ABERTO (3)    EM ANDAMENTO (2)  AGUARD.(1)  │─────────────────────────────│
│  ┌────────┐    ┌────────┐        ┌────────┐  │  Status     ABERTO          │
│  │ #42 ●  │    │ #38    │        │ #41    │  │  Prioridade urgent          │
│  │ Deploy │    │ Config │        │ VPN    │  │  Base       GRU             │
│  │[urgent]│    │[high]  │        │[medium]│  │  Tipo       Incidente       │
│  │GRU·Ana │    │BSB·Tom │        │GRU·Lia │  │  Solicitante  Ana Silva     │
│  └────────┘    └────────┘        └────────┘  │─────────────────────────────│
│  ┌────────┐    ┌────────┐                    │  Descrição                  │
│  │ #39    │    │ #40    │                    │  Ao realizar o deploy do    │
│  │ Login  │    │ Permis.│                    │  ambiente de produção...    │
│  │[medium]│    │[low]   │                    │─────────────────────────────│
│  │CGH·Bob │    │CGH·Lia │                    │  Mensagens (2)              │
│  └────────┘    └────────┘                    │  ┌─────────────────────┐    │
│                                              │  │ Ana: Acontece desde │    │
│                                              │  │ ontem às 18h        │    │
│                                              │  └─────────────────────┘    │
│                                              │  ┌─────────────────────┐    │
│                                              │  │ Suporte: Verificando│    │
│                                              │  │ os logs agora       │    │
│                                              │  └─────────────────────┘    │
│                                              │─────────────────────────────│
│                                              │  [↗ Abrir em tela cheia]    │
├──────────────────────────────────────────────┴─────────────────────────────┤
│  ● card selecionado fica destacado com borda primária                       │
└────────────────────────────────────────────────────────────────────────────┘
```

**Comportamento do split:**
- O board ocupa ~60% da largura, o painel ~40%
- O card selecionado ganha borda `2px solid #d70f0a`
- O painel abre com animação slide-in da direita
- `[×]` fecha o painel (ticket deselecionado), board volta ao width total
- `[↗ Abrir em tela cheia]` navega para `/tickets/:id`

---

## Modo Centralizado

Nenhum ticket selecionado — board ocupa 100% da largura normalmente.

Ticket selecionado — abre modal centralizado com overlay:

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Tickets               [Table][Kanban][Gantt]   [⊞ Lado a lado][⊡ Central] │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ABERTO (3)       EM ANDAMENTO (2)   AGUARDANDO (1)   FECHADO (5)          │
│  ┌──────────┐  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  │ #42 ●   │  ░ ┌──────────────────────────────────────────────────┐ ░░  │
│  │ Deploy  │  ░ │  #42  Deploy erro prod                      [×]  │ ░░  │
│  │ erro    │  ░ │──────────────────────────────────────────────────│ ░░  │
│  │[urgent] │  ░ │  Status     ABERTO        Prioridade  urgent     │ ░░  │
│  │GRU · Ana│  ░ │  Base       GRU           Tipo        Incidente  │ ░░  │
│  └──────────┘  ░ │  Solicitante  Ana Silva   Atribuído   Bob Lima  │ ░░  │
│  ┌──────────┐  ░ │──────────────────────────────────────────────────│ ░░  │
│  │ #39     │  ░ │  Descrição                                       │ ░░  │
│  │ Login   │  ░ │  Ao realizar o deploy do ambiente de produção,   │ ░░  │
│  │[medium] │  ░ │  o serviço retornou erro 502...                  │ ░░  │
│  │CGH · Bob│  ░ │──────────────────────────────────────────────────│ ░░  │
│  └──────────┘  ░ │  Mensagens (2)                                   │ ░░  │
│               ░ │  Ana: Acontece desde ontem às 18h                │ ░░  │
│               ░ │  Suporte: Verificando os logs agora              │ ░░  │
│               ░ │──────────────────────────────────────────────────│ ░░  │
│               ░ │                    [↗ Abrir em tela cheia]       │ ░░  │
│               ░ └──────────────────────────────────────────────────┘ ░░  │
│               ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
└────────────────────────────────────────────────────────────────────────────┘
   ░ = overlay semi-transparente (rgba 0,0,0,0.4), clique fora fecha o modal
```

**Comportamento do modal centralizado:**
- Overlay escuro cobre o board ao fundo
- Modal com `max-width: 680px`, centralizado horizontal e verticalmente
- Fecha com `[×]`, clique no overlay, ou tecla `Esc`
- Scroll interno quando conteúdo excede a altura da viewport

---

## Componentes novos / modificados

| Componente | Ação | Descrição |
|---|---|---|
| `Kanban.jsx` | Modificar | Adiciona estado `selectedTicket`, `panelMode`, lógica de layout |
| `KanbanPanelToggle.jsx` | Criar | Botão de toggle Split/Centralizado com persistência |
| `KanbanTicketPanel.jsx` | Criar | Painel lateral (split) com detalhe do ticket |
| `KanbanTicketModal.jsx` | Criar | Modal centralizado com detalhe do ticket |
| `TicketPanelContent.jsx` | Criar | Conteúdo reutilizável entre painel e modal |

---

## Fluxo de estado

```
localStorage['kanban-panel-mode']
        ↓ (carrega no mount)
panelMode: 'split' | 'centered'
        ↓ (click no toggle)
atualiza estado + localStorage
        ↓ (click no card)
selectedTicket: { id, ...dados }
        ↓
if panelMode === 'split'  → renderiza KanbanTicketPanel (direita)
if panelMode === 'centered' → renderiza KanbanTicketModal (overlay)
```
