begin;

update recipes set notes = $$
1. Tempera o frango com azeite, sal e malagueta laminada.
2. Aquece um wok com azeite e salteia o frango.
3. Junta os alhos laminados e o vinho branco.
4. Adiciona os brocolos, o feijao verde e o gengibre ralado.
5. Quando os vegetais estiverem al dente, junta o molho de soja e retifica temperos.
6. Termina com cajus, cebolinho picado e sementes de sesamo.
$$ where code = 'RF001';

update recipes set notes = $$
1. Faz um refogado com azeite, cebola picada, alho frances laminado e alho laminado.
2. Acrescenta as tranches de pescada, a mostarda e a folha de louro.
3. Tempera com sal e piri-piri, junta o vinho branco e deixa cozinhar alguns minutos.
4. Adiciona a farinha, junta o leite e mistura tudo.
5. Acrescenta o camarao e os espinafres, envolve e reserva.
6. Coze as batatas em agua com sal e transforma-as em pure com manteiga, leite e noz moscada.
7. Forra um pirex com parte do pure, coloca o recheio de pescada e camarao e cobre com o restante pure.
8. Finaliza com queijo ralado e leva ao forno pre-aquecido a 200 C ate dourar.
$$ where code = 'RF002';

update recipes set notes = $$
1. Coze a massa penne ate ficar al dente.
2. Numa frigideira com azeite, junta alho laminado e os lombos de salmao.
3. Tempera com sal, noz moscada, pimenta preta e sumo de limao.
4. Vai mexendo enquanto lascas o salmao.
5. Acrescenta espinafres, tomates cherry e natas.
6. Junta a massa cozida e envolve tudo.
7. Termina com sementes de sesamo e cebolinho picado.
$$ where code = 'RF003';

update recipes set notes = $$
1. Descasca e pica a cebola e os dentes de alho.
2. Leva um tacho ao lume com azeite, cebola e alho e deixa refogar.
3. Junta a polpa de tomate e deixa cozinhar ate ficar macia.
4. Adiciona as lentilhas escorridas e o vinho branco.
5. Tempera com sal e pimenta e deixa cozinhar cerca de 10 minutos.
6. Junta ervas aromaticas e retifica os temperos.
7. Coze o esparguete em agua com sal durante cerca de 10 minutos.
8. Serve o esparguete com a bolonhesa, ervas aromaticas e queijo.
$$ where code = 'RF004';

update recipes set notes = $$
1. Aquece o caldo de legumes para o arroz.
2. Pica a cebola e o alho e aloura-os num fio de azeite.
3. Corta os espargos em pedacos pequenos, junta ao refogado e deixa cozinhar brevemente.
4. Junta ervilhas, arroz e vinho branco; tempera com sal e pimenta.
5. Vai adicionando caldo aos poucos, mexendo, ate o arroz ficar cremoso.
6. Pre-aquece o forno a 180 C e coloca os lombos de bacalhau numa travessa.
7. Tempera o bacalhau com azeite, pimenta, alho esmagado e louro; leva ao forno 15 a 20 minutos.
8. Finaliza o arroz com parmesao e manteiga.
9. Serve o arroz com os lombos de bacalhau e raspa de limao.
$$ where code = 'RF005';

update recipes set notes = $$
1. Lamina a cebola e os alhos e refoga-os em azeite.
2. Junta tomate picado e pimentos em juliana.
3. Tempera e acrescenta salsa, coentros e folha de louro.
4. Distribui as sardinhas no tacho, rega com azeite e refresca com vinho branco.
5. Tapa e deixa cozinhar cerca de 10 minutos.
6. Retira as sardinhas e reserva.
7. Adiciona agua quente ao tacho e, quando ferver, junta o arroz.
8. Tapa e deixa cozinhar cerca de 10 minutos, retificando temperos.
9. Serve o arroz com as sardinhas e termina com ervas picadas e tomate seco.
$$ where code = 'RF006';

update recipes set notes = $$
1. Lava e descasca todos os legumes.
2. Coloca num tacho a cebola, o alho, o alho frances, a curgete, a cenoura e os brocolos.
3. Cobre com agua, tempera com sal e junta azeite.
4. Deixa cozer cerca de 30 minutos, ate os legumes estarem cozidos.
5. Tritura com a varinha magica ate obter um creme.
6. Serve com um fio de azeite.
$$ where code = 'RF007';

update recipes set notes = $$
1. Desfaz um cubo de caldo de galinha num pouco de azeite.
2. Envolve os cubos de frango nessa mistura e deixa repousar cerca de 10 minutos.
3. Aquece uma frigideira antiaderente e doura os cubos de frango; retira e reserva.
4. Na mesma frigideira, salteia os espargos cortados em pedacos durante alguns minutos.
5. Coze as quinoas em agua e junta o outro cubo de caldo quando levantar fervura.
6. Cozinha em lume brando, escorre e deixa arrefecer.
7. Junta cebola roxa, pimento, espargos e tomate cortado.
8. Envolve os legumes e o frango na quinoa e tempera com azeite e oregaos.
$$ where code = 'RF008';

update recipes set notes = $$
1. Tempera os lombos de salmao com sal.
2. Refoga o alho frances numa frigideira com azeite durante alguns minutos.
3. Junta agua e a sopa de espargos, misturando bem.
4. Deixa ferver e adiciona os espinafres.
5. Envolve e junta os lombos de salmao.
6. Cozinha em lume brando durante alguns minutos.
7. Polvilha com pimenta rosa e leva ao forno a 190 C durante cerca de 10 minutos.
8. Serve de imediato.
$$ where code = 'RF009';

update recipes set notes = $$
1. Coloca num tacho a batata e a curgete cortadas em cubos.
2. Junta cebola e alho e cobre com agua.
3. Deixa ferver, adiciona o caldo de legumes e mistura.
4. Cozinha cerca de 20 minutos.
5. Retira do lume, tritura e volta a colocar no tacho.
6. Junta a couve e as rodelas de chourico.
7. Deixa ferver mais alguns minutos.
8. Serve com um fio de azeite.
$$ where code = 'RF010';

commit;
