# Auditoria do catálogo de criação e alquimia

## Resumo

- 348 itens no catálogo após a ampliação da culinária.
- 104 produtos com receita cadastrada.
- 108 nomes normalizados encontrados nas linhas de receita.
- 49 ingredientes ausentes adicionados ao catálogo, incluindo 23 insumos culinários.
- 5 variações de nomenclatura tratadas como equivalências, sem duplicar itens.
- 1 receita permanece bloqueada por estar incompleta na fonte: **Fissstech** (`?`, `?`, `?`).
- Classificação atual: 32 receitas de armas, 51 de alquimia, 16 de culinária e 5 de materiais. Nenhuma armadura possui receita cadastrada no catálogo atual.

## Ingredientes adicionados

1. Verbena
2. Visco
3. Extrato de Mandrágora
4. Scleroderma
5. Raiz de Mandrágora
6. Fósforo
7. Cal
8. Seiva Branca
9. Sempre-viva Anã
10. Quelidônia
11. Solução de Mercúrio
12. Mel
13. Raiz de Pimenta
14. Raiz de Pimenta Dioica
15. Sangue de Carniçal
16. Sangue de Vampiro
17. Saliva de Lobisomem
18. Saliva de Endriga
19. Veneno de Aracna
20. Hidromel
21. Sebo
22. Saliva de Vampiro
23. Sal Mineral Refinado
24. Salitre
25. Nitrato de Prata
26. Estilhaços de Ferro
27. Cereais
28. Carne Seca
29. Sal
30. Carne
31. Legumes
32. Ervas Culinárias
33. Carne Nobre
34. Água Bruta
35. Lúpulo
36. Levedura
37. Uvas de Toussaint
38. Carne de Coelho
39. Carne de Veado
40. Carne de Porco
41. Batata
42. Cebola
43. Cenoura
44. Alho
45. Cogumelos Comestíveis
46. Farinha
47. Ovos
48. Leite
49. Manteiga

## Nomes consolidados

| Nome encontrado na receita | Item usado pelo sistema |
|---|---|
| Álcool Anão | Espírito Anão (Álcool) |
| Espírito Anão | Espírito Anão (Álcool) |
| Fruta Balisa | Fruta de Bálisa |
| Heleboro / Heléboro | Heléboro (Pétalas) |
| Sangue Carníçal | Sangue de Carniçal |

## Correções e regras adotadas

- A receita de **Pó de Dimerítio** referenciava o próprio produto. O ingrediente foi corrigido para **Dimerítio**.
- Linhas sem quantidade explícita consomem uma unidade do ingrediente.
- Expressões como `1x Ferro cria 10 Flechas` definem tanto o consumo quanto o rendimento do lote.
- **Flecha de Aço**, **Flecha de Ferro** e **Flecha de Prata** produzem 10 unidades por lote.
- **Seta de Aço**, **Seta de Ferro** e **Seta de Prata** produzem 10 unidades por lote e são classificadas como munição de besta.
- **Pó de Prata** produz 6 unidades por lote.
- **Ração de Viagem**, **Ensopado de Estalagem**, **Água Potável**, **Cerveja de Mahakam** e **Vinho de Toussaint** produzem 2 porções por lote.
- **Banquete de Toussaint** produz 4 porções por lote.
- **Pão Rústico** produz 3 porções; **Estufado Real da Caça** produz 4; as demais novas refeições produzem 2 porções por lote.
- **Farinha** pode ser processada a partir de Cereais e **Manteiga** a partir de Leite, formando uma cadeia culinária interna.
- As 16 receitas culinárias não possuem ND obrigatório enquanto a campanha não definir dificuldades próprias; ingredientes só são consumidos quando a produção é confirmada.
- Alimentos e bebidas produzidos preservam seus dados de consumo e são imediatamente compatíveis com o fluxo de Cuidados e Descanso.
- Nenhum ND/CD de criação estava cadastrado no catálogo atual. Números encontrados em descrições de efeitos são resistências do efeito e não foram usados como dificuldade de fabricação.
- O mecanismo aceita `craftingDifficulty`, `craftDifficulty` ou `ND/CD` escrito na linha da receita para futuras inclusões.
- Em uma falha de criação, os ingredientes são preservados. Isso evita perda acidental até que exista uma regra específica de consumo em falha.
