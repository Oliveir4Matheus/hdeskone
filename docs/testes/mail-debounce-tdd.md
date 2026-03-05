# TDD — Debounce de Notificações por E-mail

Plano de testes para o módulo `mailDebounce.js` e a integração com as rotas de tickets.

Ferramenta sugerida: **Jest** (backend Node.js, sem Vite).
Instalar: `npm install --save-dev jest` no diretório `backend/`.

---

## Contexto

Antes do debounce, cada `PUT /tickets/:id` e cada `POST /tickets/:id/messages` disparava um e-mail imediato.
O módulo `lib/mailDebounce.js` acumula eventos por ticket numa janela deslizante de **5 minutos** (trailing-edge) e envia **um único e-mail** ao final.

Arquivos envolvidos:
- `backend/src/lib/mailDebounce.js` — módulo de debounce (mock de `../lib/mailer`)
- `backend/src/routes/tickets.js` — rotas que chamam `debouncedNotify`

---

## Funcionalidade 1: Agendamento do timer

teste1 : Chamar `debouncedNotify` uma vez agenda um timer interno para o ticket | garante que o primeiro evento cria uma entrada no mapa de pendentes

teste2 : Chamar `debouncedNotify` uma única vez e avançar o tempo em 5 minutos chama `sendTicketUpdated` exatamente uma vez | garante que o e-mail é disparado após o período de inatividade

teste3 : Chamar `debouncedNotify` uma única vez e verificar antes dos 5 minutos — `sendTicketUpdated` não deve ter sido chamado ainda | garante que o e-mail não é enviado antecipadamente

teste4 : Chamar `debouncedNotify` para dois tickets diferentes e avançar o tempo — `sendTicketUpdated` é chamado uma vez para cada ticket | garante que os timers de tickets distintos são independentes e não interferem entre si

---

## Funcionalidade 2: Reinício do timer (trailing-edge debounce)

teste5 : Chamar `debouncedNotify` duas vezes para o mesmo ticket com intervalo menor que 5 minutos — o timer é reiniciado e `sendTicketUpdated` é chamado apenas uma vez após 5 minutos do segundo evento | garante que múltiplos eventos próximos resultam em um único e-mail

teste6 : Chamar `debouncedNotify` três vezes consecutivas para o mesmo ticket — `sendTicketUpdated` é chamado apenas uma vez ao final | garante que N eventos geram apenas 1 e-mail, independente do número de chamadas

teste7 : Chamar `debouncedNotify` duas vezes, avançar exatamente 5 minutos após o primeiro evento mas antes do segundo — `sendTicketUpdated` não deve ter sido chamado (timer foi reiniciado) | garante que o timer desliza corretamente com cada novo evento

---

## Funcionalidade 3: Acumulação de mensagens de chat

teste8 : Dois eventos com `chatMessage` para o mesmo ticket — o e-mail enviado contém ambas as mensagens concatenadas no campo `chatMessage` | garante que nenhuma mensagem do período se perde no resumo

teste9 : Três eventos com `chatMessage` para o mesmo ticket — o e-mail enviado contém as três mensagens no campo `chatMessage` | garante acumulação para N mensagens

teste10 : Evento com `chatMessage: "-"` não adiciona conteúdo ao campo de mensagens do e-mail | garante que o valor sentinela `"-"` não gera lixo no corpo do e-mail

teste11 : Evento sem `chatMessage` (campo ausente) não gera erro e não adiciona conteúdo ao campo de mensagens | garante robustez do módulo contra payloads parciais

---

## Funcionalidade 4: Seleção do campo mais significativo

teste12 : Eventos com `changeField` "Status" e "Nova mensagem no chat" para o mesmo ticket — o e-mail usa "Status" como `changeField` principal | garante que mudanças de estado têm prioridade sobre mensagens de chat

teste13 : Eventos com `changeField` "Responsável" e "Nova mensagem no chat" — o e-mail usa "Responsável" como `changeField` principal | garante a segunda prioridade da hierarquia

teste14 : Eventos com `changeField` "Prioridade" e "Nova mensagem no chat" — o e-mail usa "Prioridade" como `changeField` principal | garante a terceira prioridade da hierarquia

teste15 : Eventos com `changeField` "Status" e "Responsável" para o mesmo ticket — o e-mail usa "Status" como `changeField` principal | garante que Status vence Responsável quando ambos mudam na mesma janela

teste16 : Apenas eventos com `changeField` "Nova mensagem no chat" — o e-mail usa "Nova mensagem no chat" como `changeField` | garante comportamento correto quando não há mudanças de campo, apenas mensagens

teste17 : Um único evento sem nenhum `changeField` reconhecido — o e-mail usa "Atualização" como fallback em `changeField` | garante que o módulo não quebra com eventos inesperados e sempre envia um campo legível

---

## Funcionalidade 5: Dados do e-mail enviado

teste18 : O `updatedBy` no e-mail corresponde ao ator do **último** evento da janela, não do primeiro | garante que o nome exibido no e-mail é do responsável pela ação mais recente

teste19 : O `oldValue` e `newValue` no e-mail correspondem ao evento de maior prioridade selecionado | garante que os valores exibidos são coerentes com o `changeField` reportado

teste20 : O objeto `ticket` passado a `sendTicketUpdated` é o do **último** evento recebido (dado mais recente) | garante que o e-mail usa os dados atualizados do ticket, não os do primeiro evento da janela

teste21 : Após `sendTicketUpdated` ser chamado, a entrada do ticket é removida do mapa de pendentes | garante que não há vazamento de memória e que um novo evento após o e-mail inicia um novo ciclo de debounce

---

## Funcionalidade 6: Integração com `PUT /tickets/:id`

> Setup: mockar `debouncedNotify` e chamar a rota diretamente via supertest.

teste22 : `PUT /tickets/:id` com mudança de `status` chama `debouncedNotify` com `changeField: "Status"`, `oldValue` e `newValue` corretos | garante que a rota de atualização propaga o evento correto para o módulo de debounce

teste23 : `PUT /tickets/:id` com mudança de `priority` chama `debouncedNotify` com `changeField: "Prioridade"` | garante cobertura do segundo campo rastreado

teste24 : `PUT /tickets/:id` com mudança de `assignedId` chama `debouncedNotify` com `changeField: "Responsável"` | garante cobertura do terceiro campo rastreado

teste25 : `PUT /tickets/:id` sem mudança real de valor (mesmo status, mesma prioridade) não chama `debouncedNotify` | garante que atualizações sem alteração significativa não geram e-mail desnecessário

teste26 : `PUT /tickets/:id` quando o ticket não possui `requesterEmail` não chama `debouncedNotify` | garante que tickets anônimos (sem destinatário) não disparam o fluxo de e-mail

---

## Funcionalidade 7: Integração com `POST /tickets/:id/messages`

teste27 : `POST /tickets/:id/messages` por um usuário `admin` chama `debouncedNotify` com `changeField: "Nova mensagem no chat"` e o conteúdo da mensagem em `chatMessage` | garante que mensagens de staff acionam o debounce corretamente

teste28 : `POST /tickets/:id/messages` por um usuário `support` chama `debouncedNotify` | garante que o papel support também aciona o debounce (não só admin)

teste29 : `POST /tickets/:id/messages` por um usuário `colaborador` **não** chama `debouncedNotify` | garante que mensagens do próprio solicitante não geram notificação de "atualização de staff"

---

## Funcionalidade 8: Robustez e isolamento

teste30 : Se `sendTicketUpdated` lançar uma exceção, o erro é capturado e logado sem derrubar o processo | garante que falhas na API de e-mail não propagam para o servidor

teste31 : Depois de um flush bem-sucedido, chamar `debouncedNotify` novamente para o mesmo ticket inicia um novo ciclo independente | garante que o estado do módulo é limpo após o envio

teste32 : Dois tickets com actividade intercalada (A → B → A → B) resultam em dois e-mails independentes, um para cada ticket | garante ausência de contaminação entre entradas do mapa de pendentes

---

## Resumo de cobertura

| #      | Módulo / camada                          | Tipo        |
|--------|------------------------------------------|-------------|
| 1–4    | `mailDebounce` — agendamento             | Unit        |
| 5–7    | `mailDebounce` — trailing-edge           | Unit        |
| 8–11   | `mailDebounce` — acumulação de mensagens | Unit        |
| 12–17  | `mailDebounce` — hierarquia de campos    | Unit        |
| 18–21  | `mailDebounce` — payload do e-mail       | Unit        |
| 22–26  | `tickets.js PUT` + debounce              | Integration |
| 27–29  | `tickets.js POST messages` + debounce    | Integration |
| 30–32  | `mailDebounce` — robustez e isolamento   | Unit        |

Total: **32 testes**

---

## Notas de setup

```js
// Controlar timers com Jest fake timers
beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

// Avançar o tempo do debounce
jest.advanceTimersByTime(5 * 60 * 1000);

// Mock do mailer
jest.mock('../lib/mailer', () => ({
  sendTicketUpdated: jest.fn().mockResolvedValue(),
}));
```
