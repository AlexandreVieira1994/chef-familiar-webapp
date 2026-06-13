# Project Instructions

Contexto da aplicação
Esta app chama-se [NOME DA APP].
Objetivo:[Explicar em 1-3 frases o que a app faz e que problema resolve.]
O foco inicial é criar um MVP simples, funcional e fácil de evoluir.
Para detalhes completos de produto, consultar APP_SPEC.md, se existir.

⸻

Regras gerais de trabalho
Em qualquer tarefa neste projeto, o Codex deve:
1. Ler o estado atual do projeto antes de alterar ficheiros.
2. Respeitar este AGENTS.md, o README.md e a documentação interna.
3. Entender o impacto da tarefa antes de implementar.
4. Fazer alterações pequenas, seguras e testáveis.
5. Evitar overengineering.
6. Evitar refactors grandes sem confirmação.
7. Não mudar stack, arquitetura ou dependências sem justificar.
8. Não remover funcionalidades existentes sem confirmação.
9. Não implementar funcionalidades fora do pedido.
10. Priorizar uma app funcional antes de melhorias visuais.

⸻

Quando propor plano antes de implementar
Antes de alterar código, o Codex deve propor um plano quando a tarefa:
* for ambígua;
* tocar em arquitetura;
* tocar em base de dados;
* tocar em autenticação;
* tocar em routing/navegação;
* tocar em estado global;
* tocar em deploy;
* envolver migração de dados;
* puder quebrar funcionalidades existentes.
Para tarefas pequenas e claras, pode implementar diretamente.

⸻

Regras de código
* Manter o código simples e legível.
* Usar nomes claros.
* Evitar duplicação.
* Separar UI, lógica e dados quando fizer sentido.
* Não criar abstrações prematuras.
* Não adicionar bibliotecas sem justificar.
* Não esconder erros silenciosamente.
* Validar inputs importantes.

⸻

Segurança
* Nunca colocar API keys, passwords ou tokens no código.
* Usar variáveis de ambiente para segredos.
* Não expor dados privados no frontend.
* Pedir confirmação antes de alterar autenticação, permissões ou dados persistentes.

⸻

Definição de tarefa concluída
Uma tarefa só está concluída quando:
* a app continua a arrancar;
* a funcionalidade pedida funciona;
* não foram adicionadas funcionalidades extra;
* os checks possíveis foram executados;
* foi explicado como testar manualmente.

⸻

Resposta esperada no final de cada tarefa
No final de cada tarefa, o Codex deve responder com:
* resumo do que foi feito;
* ficheiros criados ou alterados;
* comandos executados;
* resultado dos testes/checks;
* como testar manualmente;
* riscos ou pendências;
* próximo passo recomendado.





- The primary app is the Expo mobile project in `mobile/`.
- Keep the mobile project compatible with Expo Go SDK 54 until this instruction
  is changed, because the target iPhone currently uses Expo Go SDK 54.
- Use Apple's Human Interface Guidelines as the default UX/UI guide for
  navigation, controls, layout density, feedback, copy, and interaction
  patterns:
  `https://developer.apple.com/design/human-interface-guidelines`.
- Before changing Expo, React Native, Expo Router, or native-module
  dependencies, read the exact versioned docs at
  `https://docs.expo.dev/versions/v54.0.0/`.
- Prefer Expo Go-compatible libraries. Do not add custom native modules that
  require a development build unless the user explicitly approves that change.
- After code or content changes, commit the work and push it to GitHub.
- Do not reintroduce Next.js/Vercel web app files unless explicitly requested.
- If local tooling is unavailable, record that limitation clearly and still
  verify with the available GitHub/Expo tooling when possible.
