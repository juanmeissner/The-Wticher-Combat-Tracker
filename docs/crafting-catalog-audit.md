# Auditoria do catálogo de criação e alquimia

## Resumo

- 308 itens no catálogo após a normalização.
- 85 produtos com receita cadastrada.
- 108 nomes distintos encontrados nas linhas de receita.
- 26 ingredientes ausentes adicionados ao catálogo.
- 5 variações de nomenclatura tratadas como equivalências, sem duplicar itens.
- 1 receita permanece bloqueada por estar incompleta na fonte: **Fissstech** (`?`, `?`, `?`).
- Classificação atual: 29 receitas de armas, 51 de alquimia e 5 de materiais. Nenhuma armadura possui receita cadastrada no catálogo atual.

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
- **Pó de Prata** produz 6 unidades por lote.
- Nenhum ND/CD de criação estava cadastrado no catálogo atual. Números encontrados em descrições de efeitos são resistências do efeito e não foram usados como dificuldade de fabricação.
- O mecanismo aceita `craftingDifficulty`, `craftDifficulty` ou `ND/CD` escrito na linha da receita para futuras inclusões.
- Em uma falha de criação, os ingredientes são preservados. Isso evita perda acidental até que exista uma regra específica de consumo em falha.
