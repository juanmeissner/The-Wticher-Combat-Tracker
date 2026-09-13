# Auditoria do bestiário — 12/09/2026

## Objetivo e limites

Esta auditoria compara três fontes e registra a implementação aprovada no catálogo do aplicativo:

1. os 21 presets atuais de `js/bestiary.js`;
2. as 52 linhas preenchidas da [aba Monstros da planilha de regras](https://docs.google.com/spreadsheets/d/1o16NpTwXfkGIhhqIE2n2ASwMQLPVlEXihsrbJG33ue8/edit?gid=1696234081#gid=1696234081);
3. as 130 páginas do PDF **Bestiario.pdf**, incluindo inimigos humanos, criaturas e animais;
4. as 20 páginas externas ligadas nas linhas 32–51 da planilha.

O resultado inicial serviu como fila de aprovação. Em 12/09/2026, os lotes A, B e D foram incorporados com os dados mecânicos disponíveis. Em seguida, o lote E recebeu fichas-base adaptadas à escala do aplicativo, preservando a lore pesquisada e deixando os números abertos a ajustes de mesa.

## Regra de precedência recomendada

- **Planilha:** autoridade para os valores personalizados da campanha quando a linha contém valores reais.
- **PDF:** completa atributos, perícias, ataques, habilidades, vulnerabilidades, saque e contexto que faltam na planilha.
- **Links externos:** servem para identidade, lore, comportamento, nomenclatura, aliases e sugestão de imagem; não fornecem ficha compatível completa.
- **Aplicativo:** valores já customizados não devem ser substituídos silenciosamente pelos números do PDF.

Quando houver conflito, a decisão deve ser registrada por monstro. Exemplos: Carniçal (35 HP no app/planilha e 25 no PDF), Demônio da Floresta (150 no app e 110 na planilha/PDF), Leshen (150 no app e 90 no PDF), Basilisco (150 no app e 70 no PDF), Manticora (95 no app e 70 no PDF) e Katakan (95 no app e 80 no PDF).

## Estado atual do aplicativo

O catálogo-base possuía 21 presets antes desta expansão:

1. Soldado Raso Nilfgard
2. Cavaleiro Nilfgaardiano
3. Infantaria Nilfgaardiana
4. Grifo
5. Afogador
6. Carniçal
7. Lâmia
8. Bruxa Sepulcral
9. Lobisomem
10. Sereia
11. Demônio da Floresta
12. Umbrenato
13. Leshen
14. Nevoloso
15. Basilisco
16. Tourovor
17. Kikimora
18. Manticora
19. Rotífero
20. Draugir
21. Katakan

### Normalizações de nome

- **Lâmia** é o nome da criatura regular; **Alpor** é uma variedade separada e mais poderosa.
- `Nevoeiro/Nevoeiros/Foglet` foi normalizado como **Nevoloso**.
- `Kikimora/Kikimore` foi normalizado como **Kikimora**; o link ainda diferencia operária, guerreira e rainha.
- `Democomposto/Rotfiend` corresponde ao atual **Rotífero**.
- `Tourovor/Bullvore` corresponde ao atual **Tourovor**.
- `Ozrel` deve ser normalizado para **Ozzrel**.
- **Sepulcro** é o nome de exibição aprovado para a futura ficha correspondente.
- `Cemetauro` deve ser normalizado para **Cemetaur**.
- `Giant Centipede` deve ser exibido como **Centopeia Gigante**.
- `Greater Mutant` deve ser exibido como **Mutante Superior**.
- “Fracassos” no PDF é um erro de tradução automática de **Fetulho/Botchling**.
- “Gráficos” no PDF é um erro de tradução automática de **Chort**.
- A página visualmente intitulada “Basilisco” nas páginas 37–38 descreve **Cocatriz/Cockatrice**; não deve sobrescrever o Basilisco verdadeiro.
- “Chupetas Gemmerianas” é uma tradução automática inadequada de **Pacificadores Gemmerianos**.

## Resultado quantitativo

| Grupo | Quantidade | Situação |
|---|---:|---|
| Catálogo-base | 21 | preservado, com normalização visível de Lâmia e Kikimora |
| Expansão mecânica implementada | 48 | lotes A, B e D, incluindo Alpor separado e Ulfhedinn |
| Fichas-base adaptadas da lore | 16 | lote E implementado com balanceamento inicial revisável |
| Linhas vazias/ambíguas da planilha | 2 | Mamuna e Mula |
| Total atual no aplicativo | 85 | todos com IDs únicos e no esquema existente do Combat Tracker |

## Implementação aprovada

- Os lotes A, B, D e E ficam em `js/bestiary-expansion.js`, separados do catálogo histórico para facilitar revisão e manutenção.
- Nenhum registro novo recebeu atributos-base do sistema-fonte.
- Todos os novos presets possuem HP, ST, CA, armadura regional, movimento, ameaça, recompensa, vulnerabilidades, habilidades, ataques, saque, perícias e informações descritivas dentro do formato que o app já utiliza.
- O catálogo agora contém **Lâmia** e **Alpor** como criaturas distintas; o Alpor tem ficha superior.
- Os nomes aprovados **Fetulho**, **Chort** e **Pacificadores Gemmerianos** substituem traduções automáticas incorretas.
- O cache offline passou a distribuir a expansão junto do restante do bestiário.

## Lote A — criaturas com ficha mecânica pronta no PDF

Legenda dos atributos originais: `INT/REF/DES/CORPO/VEL/EMP/CRI/VON`. Estes são os atributos do sistema-fonte e não devem ser convertidos automaticamente para os seis atributos da ficha completa sem uma regra aprovada.

| Candidato | HP | Atributos | Ataques principais | Mecânicas principais | PDF |
|---|---:|---|---|---|---:|
| Alpor | 95 na ficha adaptada | não importados | garras 6d6, mordida 7d6, grito sônico | variedade superior de Lâmia; regeneração 10, invisibilidade, drenar sangue | adaptação aprovada |
| Amarok | 50 no PDF; 120 na planilha | —/6/8/5/11/1/1/12 | Mordida 4d6+1, Congelar 50% | incorpóreo, invisível, caça persistente, medo, fraqueza à luz/Yrden | 17–18 |
| Aparição | 25 no PDF; 60 na planilha | 4/6/5/5/5/1/1/6 | Espada 3d6; lanterna 2d6+2 | incorpóreo defensivo, teleporte 10 m, visão noturna, Yrden/Pó de Lua | 23–24 |
| Aparição Diurna | 60 no PDF; 25 na planilha | 5/8/6/7/6/1/1/9 | Garras 5d6 com ablação | incorpórea, Dança do Meio-Dia, fraqueza celestial, Yrden/Pó de Lua | 25–26 |
| Lobo | 20 | 1/4/6/5/7/1/1/4 | Mordida 2d6 | rastrear pelo cheiro, visão noturna, matilha | 27–28 |
| Warg | variante do Lobo | ficha derivada na página de Lobo | mordida melhorada | líder e versão maior/mais resistente | 27–28 |
| Fetulho | 20; 60 transformado | 3/2/7/3/2/3/1/6 | Garras 3d6+3; mordida 4d6+2 | transformação, drenar sangue, espinhos, isca espectral, visão noturna | 33–34 |
| Chort | 90 | —/12/9/12/9/1/1/6 | Garras 5d6+2; mordida 6d6+1; chifres 7d6 | regeneração 3/rodada, investida 8d6, resistente a Aard/queda, audição sensível | 35–36 |
| Cocatriz | 60 | 2/8/9/7/9/1/1/4 | Garras 4d6; bico 5d6 | voo, veneno, hálito tóxico, névoa ácida, gases inflamáveis | 37–38 |
| Ciclope | 110 | 2/8/6/18/5/1/6/4 | Soco 8d8+6; árvore 8d8+2 | força esmagadora, alcance ampliado, varredura, resistência física | 39–40 |
| Dríade | 30 | 6/7/9/6/8/7/5/6 | Arco longo 4d6; lança 3d6 | emboscada florestal, tiro especializado, Mãos Curativas | 41–42 |
| Rainha Endríaga | 35 | 1/6/7/8/7/1/1/6 | Garras 3d6 | salto, veneno, resistência, variantes guerreiro/trabalhador | 45–46 |
| Aracna | 90 | 1/9/6/13/5/1/1/5 | Garras 5d6, Veneno 25% | salto, camuflagem, teia, ponto macio, resistência a dano | 47–48 |
| Golem | 80 | 1/10/6/13/4/1/1/4 | Soco 8d6 com ablação | construto, investida, força esmagadora, dimerítio e eletricidade | 49–50 |
| Nekker | 15 | 2/5/7/3/6/2/2/4 | Garras 2d6 | visão noturna, bando e chefe com bônus de coragem | 53–54 |
| Chefe Nekker | 20 | 2/6/8/4/7/2/2/5 | Garras 2d6 | liderança do bando e ordens complexas | 53–54 |
| Troll de Pedra | 80 | 3/8/7/12/4/6/7/4 | Soco 6d6; pedregulho 5d6/16 m | força esmagadora, ablação dobrada, costas rochosas, resistências | 55–56 |
| Wyvern | 80 | 1/10/10/10/7/1/1/6 | Garras 6d6; mordida 7d6; cauda 5d6+2 | voo, cuspir veneno 3d6/8 m, resistência a corte/perfuração | 57–58 |
| Fleder | 60 | —/7/7/9/7/1/1/4 | Garras 5d6; mordida 6d6+2 | regeneração, saltos, escalada, asas vestigiais, fraqueza ao fogo | 61–62 |
| Gárgula | 70 | —/8/5/10/4/1/1/5 | Soco 6d6 | construto, carga saltada, pedregulhos, hálito venenoso, pisão | 65–66 |
| Guvorag | 50 | —/7/9/6/8/8/1/5 | Garras 4d6; mordida 5d6 | ilusões/invisibilidade, marionetista, teias, escalada, percepção mágica | 67–68 |
| Harpia | 25 | 2/7/7/4/9/2/4/6 | Garras 2d6 ou 2d6+3 no ar | voo, manobras aéreas, ossos ocos, atração por objetos brilhantes | 69–70 |
| Vampiro Superior | cerca de 100 no quadro | 13/12/9/10/9/14/—/10 | Garras 6d6; mordida 8d6+2 | regeneração, ilusão, invisibilidade mágica, imortalidade, poderes variáveis | 71–72 |
| Nereida | 30 | 1/8/7/7/9/7/1/6 | Garras 4d6; variantes 3d6/5d6 | anfíbia, canto, ilusão, constrição, invocação de criatura marinha | 77–78 |
| Ogro | 30 | 4/7/7/8/5/5/4/4 | Arma bruta 4d6+4; dardo 3d6+2 | robusto, golpes fortes, físico poderoso, senciente | 79–80 |
| Pesta | 80 | —/8/7/7/6/3/1/10 | Garras 5d6, Doença 25% | incorpórea, doença amaldiçoada, ratos, enxame, cura como fraqueza | 81–82 |
| Fênix | 50 | 4/7/9/5/7/4/1/6 | Garras 4d6+4; bico 6d6+2 | voo, regeneração, explosão, aura de fogo, renascimento, fraqueza ao frio | 83–84 |
| Preta | 25 | 3/5/7/6/5/1/1/5 | Garras 3d6; mordida 3d6+4 | invisível para alimentados, fome, fúria, fraqueza solar/lunar | 85–86 |
| Estriga | 50 | —/10/8/5/10/1/1/8 | Garras 4d6+2; mordida 5d6 | regeneração, salto, escalada, carga, bônus perto da sepultura | 87–88 |
| Súcubo | 70 | 6/7/8/7/6/12/4/8 | Chute 3d6+2; cabeçada 4d6+2 | sedução, feitiço, imunidade a charme, variante Íncubo | 89–90 |
| Uktena | 70 | 2/9/6/9/4/3/1/6 | Mordida 5d6; constrição 6d6+2 | sufocamento, saliva venenosa, adivinhação, escalada/natação | 95–96 |
| Bruxa da Água | 50 | —/8/10/5/7/3/3/5 | Garras 5d6; mordida 6d6 | lama/cegueira, anfíbia, chão encharcado, comanda afogadores | 97–98 |

### Perícias completas das criaturas novas

- **Amarok:** Atletismo +5, Consciência +5, Coragem +10, Esquiva +2, Resistência +10, Resistir Magia +7, Lançar Feitiços +7, Furtividade +7. A planilha traz uma versão mais forte e acrescenta Briga +6 e Intimidação +10.
- **Aparição:** Esgrima +7, Curta Distância +6, Brigar +6, Atletismo +5, Consciência +8, Furtividade +9, Sobrevivência +6, Resistir Magia +6, Tolerância +7.
- **Aparição Diurna:** Lançar Feitiços +6, Curta Distância +8, Brigar +7, Atletismo +4, Consciência +10, Furtividade +10, Sobrevivência +5, Resistir Magia +7, Tolerância +7.
- **Lobo/Warg:** Curta Distância +6, Brigar +6, Atletismo +6, Consciência +6, Furtividade +6, Sobrevivência +9, Resistir Magia +2, Tolerância +5, Coragem +6.
- **Fetulho:** Atletismo +6, Consciência +5, Coragem +7, Esquiva +6, Resistência +4, Corpo a Corpo +7, Resistir Magia +7, Furtividade +9; a forma transformada usa valores próprios.
- **Chort:** Atletismo +6, Consciência +10, Brigar +4, Coragem +8, Esquiva +6, Resistência +4, Corpo a Corpo +7, Físico +8, Resistir Magia +5, Furtividade +2, Sobrevivência +5.
- **Cocatriz:** Atletismo +7, Consciência +6, Brigar +7, Coragem +4, Esquiva +7, Resistência +6, Corpo a Corpo +7, Resistir Magia +5, Furtividade +5, Sobrevivência +8.
- **Ciclope:** Atletismo +3, Consciência +8, Coragem +7, Esquiva +4, Resistência +10, Corpo a Corpo +7, Físico +10, Resistir Coerção +7, Resistir Magia +8, Armadilhas +6.
- **Dríade:** Arco e Flecha +10, Atletismo +8, Consciência +9, Engano +4, Esquiva +8, Resistência +5, Intimidação +5, Resistir Coerção +5, Resistir Magia +4, Cajado/Lança +7, Furtividade +9, Táticas +3, Armadilhas +5.
- **Rainha Endríaga:** Curta Distância +6, Brigar +5, Atletismo +5, Consciência +5, Furtividade +7, Sobrevivência +6, Resistir Magia +6, Tolerância +6, Coragem +5.
- **Aracna:** Curta Distância +5, Brigar +5, Atletismo +5, Consciência +6, Furtividade +6, Sobrevivência +4, Resistir Magia +9, Tolerância +5, Coragem +10.
- **Golem:** Brigar +6, Atletismo +2, Consciência +8, Furtividade +2, Sobrevivência +4, Resistir Magia +10, Físico +7.
- **Nekker:** Brigar +5, Curta Distância +5, Esquiva +6, Atletismo +7, Consciência +8, Furtividade +8, Sobrevivência +8, Resistir Magia +4, Resistir Coerção +9, Resistência +6, Coragem +6.
- **Troll de Pedra:** Brigar +8, Esquiva +5, Atletismo +3, Consciência +9, Furtividade +3, Sobrevivência +7, Resistir Magia +8, Resistir Coerção +6, Tolerância +8, Coragem +10.
- **Wyvern:** Brigar +7, Curta Distância +8, Esquiva +6, Atletismo +8, Consciência +10, Furtividade +6, Sobrevivência +9, Resistir Magia +8, Tolerância +8, Coragem +8.
- **Fleder:** Atletismo +6, Consciência +5, Coragem +7, Esquiva +6, Resistência +6, Resistir Coerção +6, Resistir Magia +4, Furtividade +7.
- **Gárgula:** Atletismo +5, Consciência +8, Esquiva +6, Resistir Magia +10, Furtividade +5.
- **Guvorag:** Atletismo +5, Consciência +10, Brigar +9, Carisma +6, Engano +6, Esquiva +6, Percepção Humana +10, Intimidação +6, Corpo a Corpo +7, Resistir Magia +10, Sedução +6, Lançar Feitiços +6, Furtividade +5, Sobrevivência +2.
- **Harpia:** Atletismo +8, Consciência +8, Esquiva +6, Resistência +4, Resistir Magia +5, Furtividade +4.
- **Vampiro Superior:** Atletismo +10, Consciência +8, Carisma +10, Coragem +9, Engano +10, Esquiva +10, Etiqueta +10, Percepção Humana +10, Resistir Coerção +10, Resistir Magia +10, Sedução +10, Furtividade +10.
- **Nereida:** Atletismo +7, Consciência +6, Coragem +4, Esquiva +7, Resistência +6, Corpo a Corpo +7, Resistir Magia +5, Furtividade +5; a criatura invocada possui uma ficha reduzida própria.
- **Ogro:** Atletismo +8, Consciência +7, Coragem +6, Esquiva +7, Resistência +6, Resistir Magia +5, Furtividade +6, Esgrima +7.
- **Pesta:** Atletismo +5, Consciência +10, Coragem +6, Esquiva +7, Resistência +6, Intimidação +6, Resistir Coerção +6, Resistir Magia +5, Lançar Feitiços +8, Furtividade +7.
- **Fênix:** Atletismo +8, Consciência +6, Coragem +8, Esquiva +9, Resistência +5, Corpo a Corpo +9, Resistir Coerção +7, Resistir Magia +8, Furtividade +3, Sobrevivência +6.
- **Preta:** Atletismo +7, Consciência +8, Esquiva +6, Resistência +8, Corpo a Corpo +6, Resistir Magia +5, Furtividade +5.
- **Estriga:** Atletismo +9, Consciência +7, Coragem +9, Esquiva +10, Resistência +7, Físico +9, Resistir Magia +7, Furtividade +8, Sobrevivência +4.
- **Súcubo:** Atletismo +6, Consciência +7, Carisma +10, Coragem +7, Engano +8, Esquiva +8, Resistência +8, Percepção Humana +10, Resistir Magia +7, Sedução +10, Furtividade +4.
- **Uktena:** Atletismo +5, Consciência +8, Esquiva +7, Resistência +6, Corpo a Corpo +7, Físico +7, Resistir Magia +5, Lançar Feitiços +8, Furtividade +5.
- **Bruxa da Água:** Atletismo +8, Consciência +7, Coragem +7, Esquiva +6, Resistência +8, Corpo a Corpo +8, Resistir Coerção +10, Resistir Magia +9, Furtividade +8.

## Lote B — inimigos humanos e facções com ficha mecânica pronta

| Candidato | HP | Atributos | Armas/ataques | Diferencial | PDF |
|---|---:|---|---|---|---:|
| Bandido | 20 | 3/6/5/5/4/3/4/4 | espada 2d6+2, adaga 1d6, besta 2d6+2 | preset básico escalável | 3–4 |
| Mago | 30 | 7/7/6/5/5/4/5/8 | cajado 3d6, adaga 1d6 | repertório de feitiços, rituais e hexes; dimerítio | 5–6 |
| Arqueiro Scoia'tael | 25 | 4/6/7/5/7/3/4/6 | falcione 3d6, adaga 1d6, facas 1d6, arco 4d6 | emboscada e munição especial | 7–8 |
| Ladrão de Estrada | 30 | 4/6/7/6/5/6/4/6 | arco 4d6, punhal 1d6+2, espada 2d6+4, lança 3d6 | emboscadas, armadilhas e opção montada | 99–100 |
| Soldado Mercenário | 30 | 4/7/7/6/6/6/4/7 | besta 4d6+2 e armas variadas | paranoia, contrato e equipamento variável | 101–102 |
| Pirata | 25 | 4/6/7/7/7/6/4/4 | arco 3d6+3, punhal 2d6+2, machado 5d6 | fogo rápido, ação naval e pouca honra | 103–104 |
| Agente do Serviço Secreto | 30 | 7/8/8/5/7/8/6/8 | besta 2d6+2, estilete 1d6, soco inglês 2d6 | espionagem, venenos e disfarces | 107–108 |
| Pacificador Gemmeriano | 35 | 3/8/6/8/4/5/2/7 | punhal 2d6+2, malho 6d6+2 | soldado treinado e Juggernaut | 109–110 |
| Soldado dos Reinos do Norte | 30 | 4/7/7/7/6/5/3/6 | arco 3d6+3, espada 4d6+4, maça 5d6 | endurecido pela guerra e equipamento variável | 113–114 |
| Cavalaria Kaedweni | 35 | 3/8/8/8/4/5/2/7 | arco 3d6+2, machado 2d6+1 | escaramuçador e cavalo | 115–116 |
| Listra Azul Temeriano | 30 | 6/9/8/7/7/5/—/6 | besta 4d6+2, espada 5d6, punhal 2d6+2 | emboscada e operações especiais | 117–118 |
| Alabardeiro Redaniano | 35 | —/8/8/7/5/4/3/7 | punhal 2d6+2, alabarda 6d6+3 | formação e arma de longo alcance | 119–120 |
| Saqueador Scoia'tael | 35 | 4/7/6/8/4/6/6/6 | besta 2d6, cutelo 3d6, machado 5d6+3 | ferramentas superiores e ódio racial | 121–122 |
| Veterano Scoia'tael | 30 | 4/7/9/5/8/6/4/7 | arco 4d6, messer 3d6+4, glaive 4d6+3 | escaramuçador montado | 123–124 |
| Defensor de Mahakam | 40 | 4/8/7/9/4/5/4/7 | besta pesada 5d6, cutelo 3d6 | costas fortes e equipamento anão | 125–126 |

As perícias completas desses inimigos estão presentes nas páginas indicadas e cobrem, conforme o perfil: armas, Esquiva, Atletismo, Consciência, Furtividade, Sobrevivência, Resistir Magia, Resistir Coerção, Tolerância, Coragem, Liderança e Táticas. Durante a implementação elas devem ser transcritas integralmente, não substituídas por bônus genéricos.

## Lote C — animais com ficha pronta

| Candidato | HP | Atributos | Ataques | Habilidades | PDF |
|---|---:|---|---|---|---:|
| Gato | 10 | 1/4/6/1/6/3/1/4 | garras 1d6/2; mordida 1d6 | visão noturna, salto, percepção mágica | 127 |
| Cachorro | 20 | 1/3/5/3/5/4/1/5 | mordida 2d6 | rastrear pelo cheiro | 127–128 |
| Cavalo | 40 | 1/4/5/12/12/4/1/4 | cascos 2d6+2 | instinto/selvagem | 129 |
| Cavalo de Guerra | 50 | 1/6/6/14/11/3/1/6 | mordida 4d6+2 | instinto/selvagem | 129–130 |

Esses quatro são úteis como combatentes/aliados, mas Cavalo e Cavalo de Guerra já possuem representação no sistema de montarias. A recomendação é compartilhar a ficha da montaria, evitando criar duas fontes independentes de HP e condições.

## Lote D — candidato mecânico da planilha

### Ulfhedinn

- HP 120; ameaça Alta/Complexa; recompensa 80.
- Vulnerabilidades: Óleo Amaldiçoado e Pó de Lua.
- Habilidades: regeneração de 20 HP por rodada, rastrear pelo cheiro, visão noturna, transformação e desvantagem para bloquear seus ataques.
- Ataques e perícias propostos na planilha: garras 6d6 + Brigar, mordida 7d6 + Brigar, uivo ND 20; Curta Distância +9, Brigar +12, Esquiva +12, Atletismo +8, Consciência +10, Furtividade +9, Sobrevivência +9, Resistir Magia +9, Resistir Coerção +10, Tolerância +8 e Coragem +10.
- Implementação: atributos-base não foram introduzidos; os campos aceitos pelo app foram completados, e a transformação preserva 30% a cada noite e 100% durante a lua cheia.

## Lote E — fichas-base adaptadas de páginas de lore

Esses registros não possuem HP, ST, armadura ou perícias compatíveis nas fontes consultadas. As fichas agora cadastradas usam valores de balanceamento criados para o Combat Tracker; vulnerabilidades, comportamento e identidade de cada encontro seguem as referências pesquisadas. Os números devem ser considerados uma primeira base editável.

| Candidato | Informações confirmadas nos links | Imagem sugerida pela própria página |
|---|---|---|
| Koshchey | constructo mágico gigantesco, muito resistente, suscetível a prata; cegueira aparece como efeito crítico | `Bestiary_Koshchey.png` |
| Bloedzuiger | pântanos; imune a veneno; vulnerável a prata/fogo; explode ácido ao morrer | `Bestiary_Bloedzuiger.png` |
| Mamun | pequena criatura rural que desorienta viajantes; glândulas alucinógenas | `An_mamun.png` |
| Mutante | experimento falho da Salamandra; ágil; suscetível a aço | `Bestiary_Mutant.png` |
| Cemetaur | necrofago muito forte; imune a venenos, resistente a queda/atordoamento; prata e óleo de necrofago | `Bestiary_Cemetaur.png` |
| Dagon | entidade aquática/deidade; não deve ser derrotada como inimigo comum; sua fé/cultistas formam a mecânica do encontro | `Bestiary_Dagon.png` |
| Devorador | necrofago; imune a veneno, resistente a queda; prata/óleo; tenta derrubar e devorar | `Bestiary_Devourer.png` |
| Ozzrel | alghoul nomeado e chefe único; melhor como variante/boss e não espécie genérica | `Gwent_cardart_monsters_ozzrel.png` |
| Echinops | criatura enraizada que dispara espinhos; imune a efeitos mentais, veneno, cegueira, queda e sangramento; vulnerável a prata/fogo | `Bestiary_Echinops.png` |
| Frightener | insectoide mágico quase invulnerável; aço/prata e ruídos altos; usa tamanho e força para derrubar | `Bestiary_Frightener.png` |
| Garkain | vampiro inferior; resistente a atordoamento; prata/óleo; paralisa, atordoa e bebe sangue | `Bestiary_Garkain.png` |
| Centopeia Gigante | insectoide cego que detecta vibrações, envolve e envenena; prata/óleo; várias imunidades físicas | `Bestiary_Giant_Centipede.png` |
| Sepulcro | necrófago maior que carniçal, com veneno de cadáver e ataques de garras/dentes | `Bestiary_Graveir.png` |
| Mutante Superior | experimento da Salamandra lento, muito forte e protegido por pele/músculos; suscetível a aço | `Bestiary_Greater_Mutant.png` |
| Zeugl | monstro de esgoto com tentáculos, enorme boca e resistência extrema a golpes de espada | `Bestiary_Zeugl.png` |
| Kayran | chefe único; imune a veneno; vulnerável a armadilha, Yrden e prata; tentáculos e muco venenoso/pegajoso | `Tw2_journal_kayran.png` |

Links de referência: [Koshchey](https://witcher.fandom.com/wiki/Koshchey), [Bloedzuiger](https://witcher.fandom.com/wiki/Bloedzuiger), [Mamune](https://witcher.fandom.com/wiki/Mamune), [Mutante](https://witcher.fandom.com/wiki/Mutant_(creature)), [Cemetaur](https://witcher.fandom.com/wiki/Cemetaur), [Dagon](https://witcher.fandom.com/wiki/Dagon), [Devorador](https://witcher.fandom.com/wiki/Devourer), [Ozzrel](https://witcher.fandom.com/wiki/King_of_the_Crypt), [Echinops](https://witcher.fandom.com/wiki/Echinops), [Frightener](https://witcher.fandom.com/wiki/Frightener), [Garkain](https://witcher.fandom.com/wiki/Garkain), [Centopeia Gigante](https://witcher.fandom.com/wiki/Giant_centipede), [Graveir](https://witcher.fandom.com/wiki/Graveir), [Mutante Superior](https://witcher.fandom.com/wiki/Greater_mutant), [Zeugl](https://witcher.fandom.com/wiki/Zeugl) e [Kayran](https://witcher.fandom.com/wiki/The_Kayran).

### Decisões de balanceamento do Lote E

- **Chefes de encontro:** Koshchey, Dagon, Frightener, Zeugl e Kayran receberam HP, armadura e perícias acima da média.
- **Fases contextuais:** Dagon depende dos adoradores; Zeugl e Kayran exigem remover tentáculos; o Frightener precisa ser exposto por ruído intenso.
- **Criaturas especializadas:** Echinops tem Movimento 0; a Centopeia Gigante escava e é presa por Yrden; Mamun prioriza desorientação; Bloedzuiger explode ao morrer.
- **Hierarquias:** Cemetaur lidera necrófagos, Ozzrel lidera uma cripta e Garkain pode liderar vampiros inferiores.
- **Nomenclatura aprovada:** a ficha baseada no Graveir é exibida como **Sepulcro**; a criatura rural é exibida como **Mamun**.
- **Escopo atual:** as regras especiais aparecem como habilidades assistidas no card; automações completas de fases podem ser adicionadas depois da aprovação dos valores.

## Registros que continuam sem ficha

### Mamun e Mamuna

A linha **Mamun** aponta para a página Mamune e já originou o preset `mamun`. A linha **Mamuna** permanece vazia. Por isso, nenhum segundo monstro foi inventado até ser definido se Mamuna é:

- aliases da mesma criatura, caso em que deve existir um único preset com nomes alternativos; ou
- criaturas distintas da campanha, caso em que Mamuna precisa de ficha própria.

### Mula

A planilha contém somente o nome. Como o PDF traz Cavalo e Cavalo de Guerra, uma ficha de Mula pode ser derivada, mas ainda exige aprovação de HP, CORPO/capacidade, VEL, temperamento, coice e integração com montarias.

## Saque, imagens e direitos de uso

- Os 48 candidatos do PDF possuem tabelas de saque e arte nas páginas indicadas.
- O cadastro deve transcrever as rolagens de saque, mas não copiar automaticamente as ilustrações do PDF para o app sem verificar licença/permissão.
- As páginas externas fornecem bons nomes de arquivo para busca de imagem, mas a imagem final deve ser escolhida e armazenada localmente no projeto; depender diretamente de URLs de Fandom é frágil e pode quebrar offline.
- Recomenda-se deixar imagem opcional na primeira implementação e fazer uma revisão visual por lote.

## Decisões consolidadas nesta implementação

1. **Esquema do aplicativo:** o catálogo não recebeu `INT/REF/DES/CORPO/VEL/EMP/CRI/VON/SORTE`; somente os campos já utilizados pelo Combat Tracker foram cadastrados.
2. **Conflitos de fontes:** dados mecânicos explícitos da planilha/PDF orientam os lotes A, B e D; páginas de lore orientam somente as bases editáveis do Lote E.
3. **Alpor e Lâmia:** são presets separados; Alpor representa a variedade superior.
4. **Nomes:** foram preservadas as normalizações aprovadas, incluindo Lâmia, Nevoloso, Kikimora, Ozzrel, Sepulcro, Cemetaur e Mutante Superior.
5. **Chefes únicos:** Dagon, Kayran e Ozzrel ficam disponíveis no catálogo comum; sua natureza especial aparece na ameaça e nas habilidades.
6. **Fauna e montarias:** Cavalo e Cavalo de Guerra continuam reutilizando o sistema próprio de montarias.
7. **Estado atual:** lotes A, B, D e E concluídos; imagens próprias e automações completas de fases continuam como melhorias opcionais posteriores.

## Critérios de conclusão futuros

- nenhum preset duplicado por alias;
- nenhum valor atual substituído silenciosamente;
- todas as fichas novas com HP, ST quando aplicável, ameaça, recompensa, armadura, movimento, ataques, perícias, habilidades, vulnerabilidades, saque, habitat e organização;
- regras especiais automatizadas quando o sistema já possui suporte, e exibidas como lembrete quando não possui;
- busca funcionando por nomes alternativos em português e inglês;
- imagens locais opcionais e funcionamento offline preservado;
- testes cobrindo schema, IDs únicos, referências de saque e renderização dos cards.
