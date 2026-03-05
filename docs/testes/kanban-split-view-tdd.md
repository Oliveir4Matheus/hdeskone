# TDD — Kanban Split View / Centralized View

Plano de testes para a funcionalidade de visualização lado a lado e centralizada no Kanban.

Ferramenta sugerida: **Vitest + React Testing Library** (alinhado ao Vite já em uso).

---

## Funcionalidade 1: Toggle de modo de visualização (Split vs Centralizado)

teste1 : Renderiza o componente `KanbanPanelToggle` com as duas opções ("Lado a lado" e "Centralizado") visíveis | garante que o usuário sempre vê ambas as opções disponíveis, sem depender de estado externo

teste2 : Clicar em "Lado a lado" define `panelMode` como `"split"` | garante que a interação do usuário altera corretamente o estado de modo de visualização

teste3 : Clicar em "Centralizado" define `panelMode` como `"centered"` | garante a transição inversa de modo, cobrindo ambos os caminhos possíveis

teste4 : Ao clicar em qualquer opção do toggle, o valor é salvo em `localStorage` com a chave `kanban-panel-mode` | garante a persistência da preferência entre sessões e recarregamentos

teste5 : O botão correspondente ao modo ativo recebe a classe CSS de destaque (ex: `active`) | garante feedback visual claro ao usuário sobre o modo selecionado

---

## Funcionalidade 2: Carregamento da preferência persistida

teste6 : Ao montar o Kanban com `localStorage['kanban-panel-mode'] = "split"`, o modo inicial é `"split"` | garante que a preferência salva é restaurada corretamente no próximo acesso

teste7 : Ao montar o Kanban com `localStorage['kanban-panel-mode'] = "centered"`, o modo inicial é `"centered"` | garante restauração para o modo centralizado, cobrindo o segundo valor possível

teste8 : Ao montar o Kanban sem nenhuma entrada no `localStorage`, o modo padrão é `"split"` | define um comportamento determinístico para novos usuários ou sessões limpas

---

## Funcionalidade 3: Painel lateral (modo Split)

teste9 : No modo `"split"`, clicar em um card do Kanban define `selectedTicket` com os dados do ticket clicado | garante que o clique propaga as informações corretas para o painel lateral

teste10 : Após selecionar um ticket no modo `"split"`, o componente `KanbanTicketPanel` é renderizado na tela | garante que o painel aparece após a seleção, confirmando o comportamento de abertura

teste11 : O `KanbanTicketPanel` exibe título, status, prioridade, base, tipo, solicitante e atribuído do ticket selecionado | garante que todas as informações essenciais do ticket estão acessíveis sem navegar para outra página

teste12 : O `KanbanTicketPanel` exibe as mensagens associadas ao ticket selecionado | garante que o histórico de comunicação está disponível no painel, evitando navegação desnecessária

teste13 : Clicar no botão `[×]` do painel define `selectedTicket` como `null` e remove o `KanbanTicketPanel` do DOM | garante que o usuário consegue fechar o painel e retornar ao board completo

teste14 : Após fechar o painel, o board Kanban volta a ocupar 100% da largura (layout sem split) | garante que o estado visual do board é consistente após o fechamento do painel

teste15 : O card selecionado recebe destaque visual (ex: borda `2px solid #d70f0a`) enquanto o painel está aberto | garante feedback visual indicando qual ticket está sendo visualizado no painel

teste16 : Selecionar um segundo card enquanto o painel está aberto substitui o ticket exibido no painel sem fechar e reabrir | garante transição fluida entre tickets sem flicker ou fechamento desnecessário

---

## Funcionalidade 4: Modal centralizado (modo Centralizado)

teste17 : No modo `"centered"`, clicar em um card do Kanban renderiza o componente `KanbanTicketModal` | garante que o modal é aberto ao invés do painel lateral quando o modo correto está ativo

teste18 : O `KanbanTicketModal` exibe título, status, prioridade, base, tipo, solicitante e atribuído do ticket selecionado | mesmas informações essenciais do painel devem estar acessíveis também no modal

teste19 : O `KanbanTicketModal` renderiza um overlay (elemento com papel de bloqueio do fundo) | garante que o fundo é visualmente bloqueado, focando a atenção do usuário no modal

teste20 : Clicar no overlay fora do modal define `selectedTicket` como `null` e remove o modal | garante o padrão de UX "clicar fora para fechar", alinhado à expectativa do usuário

teste21 : Pressionar a tecla `Escape` enquanto o modal está aberto fecha o modal (define `selectedTicket` como `null`) | garante acessibilidade via teclado e segue convenção universal de fechamento de modais

teste22 : Clicar no botão `[×]` interno do modal fecha o modal | garante que sempre há um controle explícito visível para fechar, independente do teclado ou clique no overlay

teste23 : O modal não fecha ao clicar dentro da área de conteúdo do modal (apenas o overlay reage) | previne fechamento acidental ao interagir com o conteúdo do modal

---

## Funcionalidade 5: Conteúdo compartilhado (TicketPanelContent)

teste24 : `TicketPanelContent` renderiza corretamente quando recebe um objeto de ticket com todas as propriedades | garante que o componente reutilizável funciona isolado, sem dependência de contexto externo

teste25 : `TicketPanelContent` renderiza o campo `base` apenas quando o ticket possui `base` definido | garante que campos opcionais não geram erros ou espaços em branco desnecessários na UI

teste26 : `TicketPanelContent` renderiza o campo `assignedTo.name` apenas quando o ticket possui atribuído | mesmo motivo do teste anterior aplicado ao campo de responsável

teste27 : O link `[↗ Abrir em tela cheia]` dentro de `TicketPanelContent` aponta para `/tickets/:id` com o id correto | garante que o usuário pode navegar para o detalhe completo do ticket a partir do painel/modal

---

## Funcionalidade 6: Consistência do board durante a interação

teste28 : O drag-and-drop do Kanban continua funcional enquanto o painel lateral (split) está aberto | garante que abrir o painel não quebra a principal funcionalidade do board

teste29 : Mover um ticket por drag-and-drop atualiza o status exibido no painel lateral se o ticket movido for o selecionado | garante que o painel reflete o estado atual do ticket, evitando dados desatualizados

teste30 : No modo `"split"`, o Kanban não navega para `/tickets/:id` ao clicar em um card (comportamento substituído pelo painel) | garante que o clique tem comportamento diferente por modo, sem conflito com a navegação original

teste31 : No modo `"centered"`, o Kanban não navega para `/tickets/:id` ao clicar em um card (comportamento substituído pelo modal) | mesmo que o teste anterior, aplicado ao modo centralizado

---

---

## Funcionalidade 7: Controle de acesso por role no painel/modal

> **Regras de negócio confirmadas no backend:**
> - `PUT /tickets/:id` → `staffRequired` → colaborador **não pode** editar campos do ticket
> - `POST /tickets/:id/messages` → `authRequired` + verificação de ownership → colaborador **pode** enviar mensagens em seus próprios tickets
> - `POST /tickets/:id/attachments` → `authRequired` sem restrição adicional → colaborador **pode** anexar arquivos

teste32 : Quando `user.role === "colaborador"`, o painel/modal não renderiza a seção "Editar chamado" (dropdowns de status, prioridade e atribuído) | `PUT /tickets/:id` usa `staffRequired`; colaborador não possui permissão para alterar campos gerenciais do ticket

teste33 : Quando `user.role === "colaborador"`, o painel/modal renderiza a seção "Nova mensagem" (textarea + botão enviar) | `POST /tickets/:id/messages` usa `authRequired` com verificação de ownership; colaborador pode e deve comunicar-se com o suporte em seus próprios chamados

teste34 : Quando `user.role === "colaborador"`, o painel/modal renderiza o botão "Anexar arquivo" na área de composição | `POST /tickets/:id/attachments` usa apenas `authRequired`; colaborador pode enviar arquivos como parte da comunicação do chamado

teste35 : Quando `user.role === "support"` ou `"admin"`, a seção "Editar chamado" é renderizada no painel/modal | garante que o staff vê os controles de edição disponíveis para gerenciar o ticket

teste36 : Quando `user.role === "support"` ou `"admin"`, a seção "Nova mensagem" é renderizada com textarea e botão enviar | garante que o staff pode se comunicar com o solicitante diretamente do painel

teste37 : Quando `user.role === "support"` ou `"admin"`, o botão "Anexar arquivo" é renderizado na seção de composição | garante que o staff pode incluir arquivos junto às suas mensagens

---

## Funcionalidade 8: Atualização de campos do ticket (staff)

teste38 : Alterar o dropdown de status e clicar em "Salvar" chama `PUT /tickets/:id` com o novo valor de status | garante que a mudança de status é persistida no backend imediatamente após confirmação

teste39 : Alterar o dropdown de prioridade e clicar em "Salvar" chama `PUT /tickets/:id` com o novo valor de prioridade | garante que a alteração de prioridade é salva e refletida no servidor

teste40 : Alterar o dropdown de atribuído e clicar em "Salvar" chama `PUT /tickets/:id` com o novo `assignedId` | garante que a reatribuição de responsável é persistida corretamente

teste41 : Após salvar com sucesso, os badges de status e prioridade na seção de informações do painel/modal são atualizados com o novo valor e cor correspondente | garante que a UI reflete imediatamente o estado salvo sem necessidade de recarregar

teste42 : Após salvar com sucesso, o card no board Kanban atualiza visualmente o badge de prioridade | garante consistência visual entre o painel e o board sem reload da página

teste43 : Após salvar com sucesso, é exibido um toast de confirmação "Chamado atualizado com sucesso" | garante feedback positivo claro ao usuário após a ação

teste44 : Se a requisição de salvar falhar (ex: erro 500), é exibida mensagem de erro e os campos editáveis mantêm o valor tentado | evita que o usuário perca o que digitou e deixa claro que a operação não foi concluída

---

## Funcionalidade 9: Envio de mensagem (staff)

teste45 : A área de composição renderiza um `textarea` com placeholder "Escreva uma atualização ou resposta..." | garante que o campo é identificável e sugere o uso correto ao staff

teste46 : Clicar em "Enviar" com o textarea vazio não dispara a requisição `POST /tickets/:id/messages` | evita criação de mensagens vazias no banco e garante validação client-side

teste47 : Clicar em "Enviar" com textarea vazio exibe feedback visual de erro no campo (ex: borda vermelha) | garante que o usuário entende imediatamente o que está faltando

teste48 : Clicar em "Enviar" com texto preenchido chama `POST /tickets/:id/messages` com o conteúdo correto | garante que a mensagem é enviada ao servidor com o payload esperado

teste49 : Após envio com sucesso, a nova mensagem aparece no final da lista de mensagens do painel/modal | garante que o staff vê imediatamente a mensagem que acabou de enviar sem recarregar

teste50 : Após envio com sucesso, o textarea é limpo e o chip de arquivo pendente é removido | garante que o campo volta ao estado inicial para a próxima mensagem, sem lixo visual

teste51 : O contador de mensagens na seção (ex: "Mensagens (2)") é incrementado após envio com sucesso | garante que o contagem reflete o estado real sem reload

---

## Funcionalidade 10: Upload de arquivo (staff)

teste52 : Clicar no botão "Anexar arquivo" aciona o input `type="file"` nativo do browser | garante que o seletor de arquivos é aberto ao clicar no botão, respeitando a UX padrão do OS

teste53 : Após selecionar um arquivo, o nome do arquivo é exibido como chip visual abaixo da área de composição antes do envio | garante feedback visual claro de que um arquivo está pendente de envio

teste54 : O chip de arquivo exibe um botão `×` que, ao ser clicado, remove o arquivo selecionado sem fechar o painel/modal | garante que o staff pode desfazer a seleção de arquivo sem perder o contexto

teste55 : Ao clicar em "Enviar" com texto E arquivo selecionado, a requisição de upload `POST /tickets/:id/attachments` é chamada junto com a mensagem | garante envio conjunto de mensagem e anexo em uma única ação do usuário

teste56 : Arquivo com extensão não permitida (ex: `.exe`, `.sh`) exibe toast de erro sem chamar a API | garante que a validação de tipo de arquivo ocorre no cliente antes de qualquer requisição

teste57 : Arquivo com tamanho superior a 10MB exibe toast de erro sem chamar a API | garante que o limite de tamanho definido no backend é também respeitado no cliente, evitando requisições inúteis

---

## Resumo de cobertura

| # | Componente alvo | Tipo |
|---|---|---|
| 1–5 | `KanbanPanelToggle` | Unit |
| 6–8 | `Kanban` (mount + localStorage) | Integration |
| 9–16 | `Kanban` + `KanbanTicketPanel` | Integration |
| 17–23 | `Kanban` + `KanbanTicketModal` | Integration |
| 24–27 | `TicketPanelContent` | Unit |
| 28–31 | `Kanban` (interações combinadas) | Integration |
| 32–37 | `TicketPanelContent` (controle por role) | Unit |
| 38–44 | `TicketPanelContent` + API (edição staff) | Integration |
| 45–51 | `TicketPanelContent` + API (mensagem) | Integration |
| 52–57 | `TicketPanelContent` + API (upload) | Integration |

Total: **57 testes**
