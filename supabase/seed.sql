insert into recipes (code, name, category, status, prep_time_min, cook_time_min, cost_level, blw_summary, separation_moment, notes) values
('RF001', 'Arroz de feijao com cenoura e couve', 'Vegetariana', 'por_testar', 10, 25, 'baixo', 'Feijao bem cozido e esmagado; cenoura e arroz macios; sem sal.', 'Antes de salgar.', 'Base portuguesa, economica e simples.'),
('RF002', 'Massa com molho de abobora e lentilhas', 'Vegan', 'por_testar', 10, 20, 'baixo', 'Massa bem cozida; molho espesso; sem sal.', 'Depois de envolver no molho sem sal.', 'Boa proteina vegetal sem tofu.'),
('RF003', 'Bacalhau espiritual adaptado sem leite', 'Peixe', 'por_testar', 20, 25, 'medio', 'Bacalhau bem demolhado; textura macia.', 'Antes de salgar e gratinar.', 'Conta como refeicao de peixe.'),
('RF004', 'Gratinado de batata, brocolos e grao', 'Vegan', 'por_testar', 15, 25, 'baixo', 'Batata macia; grao esmagado; brocolos bem cozidos.', 'Antes de salgar e gratinar.', 'Comfort food e boa para sobras.'),
('RF005', 'Almondegas de lentilhas com arroz de tomate', 'Vegan', 'por_testar', 25, 25, 'baixo', 'Almondegas macias e grandes; arroz bem cozido.', 'Antes de salgar o molho.', 'Cebola opcional triturada ou omitida.'),
('RF006', 'Sopa rica de grao, cenoura e batata-doce', 'Vegan', 'por_testar', 10, 25, 'baixo', 'Legumes muito bem cozidos; grao esmagado ou triturado.', 'Antes de triturar/salgar a sopa dos adultos.', 'Boa para jantar simples.'),
('RF007', 'Massa espiral com ervilhas e molho de tomate suave', 'Vegan', 'por_testar', 10, 15, 'baixo', 'Massa bem cozida; ervilhas esmagadas; molho sem sal.', 'Depois de cozer e envolver em molho sem sal.', 'Muito rapida.'),
('RF008', 'Feijoada vegetariana suave com arroz', 'Vegan', 'por_testar', 15, 30, 'baixo', 'Feijao muito macio e esmagado; arroz humido.', 'Antes de salgar e antes de juntar temperos fortes.', 'Boa para cozinhar em quantidade.'),
('RF009', 'Empadao de lentilhas e batata', 'Vegetariana', 'por_testar', 20, 30, 'baixo', 'Batata macia; lentilhas bem cozidas.', 'Antes de salgar o recheio e antes de gratinar.', 'Boa para congelar.'),
('RF010', 'Arroz de pescada com cenoura e ervilhas', 'Peixe', 'por_testar', 10, 25, 'medio', 'Pescada sem espinhas; arroz muito macio; ervilhas esmagadas.', 'Antes de salgar a panela dos adultos.', 'Peixe baixo em mercurio.'),
('RF011', 'Tortilha de batata, ervilhas e cenoura no forno', 'Vegetariana', 'por_testar', 15, 25, 'baixo', 'Tiras grossas e macias; ovo bem cozinhado.', 'Antes de temperar a mistura final dos adultos.', 'Boa para marmitas.'),
('RF012', 'Estufado de grao com abobora e couscous', 'Vegan', 'por_testar', 10, 25, 'baixo', 'Grao esmagado; abobora macia; couscous humido.', 'Antes de salgar o estufado.', 'Mediterranico simples.'),
('RF013', 'Massa de forno com lentilhas vermelhas e couve-flor', 'Vegan', 'por_testar', 15, 30, 'baixo', 'Massa bem cozida; molho espesso; couve-flor macia.', 'Antes de salgar e gratinar.', 'Boa para 2 dias.'),
('RF014', 'Hamburgueres de feijao preto e batata-doce', 'Vegan', 'por_testar', 20, 25, 'baixo', 'Formato grande e macio; feijao bem esmagado.', 'Antes de salgar a massa dos adultos.', 'Bom para congelar.'),
('RF015', 'Acorda suave de grao e ovo com couve', 'Vegetariana', 'por_testar', 10, 20, 'baixo', 'Textura humida; grao esmagado; ovo bem cozinhado.', 'Antes de salgar e antes de alho forte nos adultos.', 'Aproveitamento de pao.')
on conflict (code) do nothing;

insert into family_rules (rule_key, rule_value) values
('family', '2 adultos e 1 bebe de 6 meses em BLW'),
('no_meat', 'Nao usar carne'),
('fish_limit', 'Peixe no maximo 2 refeicoes por semana'),
('dairy', 'Evitar leite e derivados tradicionais; preferir alternativas vegetais adequadas'),
('blw_salt_sugar', 'Nunca adicionar sal ou acucar a preparacao principal da bebe'),
('preferences', 'Evitar cogumelos, cebola, curgete, beringela e tofu visiveis; usar triturado ou removivel')
on conflict (rule_key) do nothing;
