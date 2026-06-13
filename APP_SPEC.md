Nome da app

[NOME DA APP]

Objetivo

Esta aplicação serve para registar receitas(de todo o tipo, prato principal, entradas, sobremesas etc), fazer plano de receitas por um período definido pelo utilizador cumprindo regras definidas pelo utilizador na app, criar lista de compras para o plano, fazer uma gestão de inventário e permitir adicionar ou remover produtos.
A app deve ir buscar receitas novas à internet, mas não as deve criar, se o utilizador pedir.
A app diferencia-se porque irá ter um assistente IA que pode atuar em qualquer sitio da app e permite ajudar o utilizador a fazer melhores decisões e facilitar o uso da app.


Utilizadores principais

* [eu]

⸻

Fluxo principal
Não há um fluxo único pois o utilizador pode atuar em vários sítios da app unicamente.

⸻

Funcionalidades essenciais do MVP:
- Adição de receitas automática à página receitas provenientes da internet.
-Criação personalizada de receitas pelo utilizador
- Criação automática e manual de planos de receitas com base nas regras definidas na app
- Criação de lista de compras a partir do plano criado com opção para adicionar /remover manualmente e opção para confirmar compra e quantidade
- gestão de inventário: adicao automática de acordo com o confirmado na lista de compras e manual , remoção automática e manual. A adição deve ser sempre por lotes
- definição por estimativa automática ou introdução manual da data de validade do ingrediente no inventário 
- sítio para definir regras como intolerâncias, preferências alimentares, instruções etc 

⸻

Fora do MVP

Não implementar nesta fase:
- integração do assistente IA
- integração de mais utilizadores

⸻

Regras de produto

* A app deve ser simples de usar.
* O fluxo principal deve ter o menor número possível de passos.
* A primeira versão deve funcionar mesmo que visualmente ainda seja básica.
* Funcionalidades secundárias só devem ser adicionadas depois do MVP estar estável.

⸻

Regras de dados

Entidades principais previstas:

* Receita: prato registado manualmente ou importado da internet, com categoria, estado, tempos, notas, imagem e origem.
* Ingrediente da receita: ingrediente associado a uma receita, com quantidade, unidade, categoria e indicação de opcional.
* Plano de receitas: conjunto de refeições planeadas para um período definido pelo utilizador.
* Refeição planeada: ligação entre uma data, um momento da refeição e uma receita.
* Lista de compras: lista gerada a partir do plano ou editada manualmente, com estado e período.
* Item da lista de compras: produto/ingrediente a comprar, com quantidade prevista, unidade, estado de compra e quantidade confirmada.
* Entrada de inventário: lote de ingrediente/produto disponível, com quantidade inicial, quantidade restante, unidade, origem, local de armazenamento e data de validade.
* Regra familiar: intolerância, preferência alimentar, instrução ou restrição usada para orientar planos e sugestões.
* Feedback de receita: avaliação ou notas depois de experimentar uma receita, para decidir se deve ser repetida, melhorada ou rejeitada.

Notas:


⸻

Prioridades

1. Fazer a app arrancar sem erros.
2. Completar o fluxo principal.
3. Garantir que os dados são guardados corretamente.
4. Melhorar a experiência de utilização.
5. Preparar deploy/publicação.

⸻

Ideias futuras
