# OrçaFácil — modelo de custos e hipóteses de preço

**Última revisão:** 09/10/2026  
**Status:** simulação para MVP; não é uma tabela comercial aprovada.

## Decisão executiva

Não tratar os preços de R$ 19,90 / R$ 39,90 / R$ 79,90 como definitivos. São hipóteses de posicionamento já registradas no README, mas o preço final precisa cobrir infraestrutura, processamento de pagamento, tributos aplicáveis, suporte, manutenção, aquisição de clientes e eventuais perdas por inadimplência/estornos.

A planilha editável **ORVEXA_Modelo_Custos_Precos_OrcaFacil.xlsx** contém as premissas, as fórmulas de custo variável por plano, o ponto de equilíbrio e um cenário misto. Atualize os dados em azul/amarelo antes de tomar decisões.

## Premissas iniciais utilizadas

| Premissa | Valor do cenário | Como interpretar |
|---|---:|---|
| Supabase Pro | US$ 25/mês | Valor público inicial indicado na página de preços; revisar no momento da contratação. |
| Câmbio de planejamento | R$ 5,02/US$ | Referência aproximada observada para 08/10/2026, usada apenas para o cálculo. |
| Folga cambial/cartão | 12% | Margem de planejamento editável para variações e encargos; não é uma tarifa confirmada. |
| Domínio | R$ 60/ano | Estimativa editável, ainda não cotada. |
| Tempo de manutenção | 8 h/mês × R$ 20/h | Valor econômico do tempo do fundador; pode não representar desembolso de caixa. |
| Marketing | R$ 100/mês | Orçamento hipotético; substitua por um custo real ou por zero se a validação for orgânica. |
| Reserva tributária | 6% da receita | Somente hipótese de sensibilidade. Não representa enquadramento tributário nem orientação fiscal. |
| Processamento de pagamento | 2,99% + R$ 0,49/cobrança | Referência divulgada pelo Asaas para cartão de crédito à vista; condições promocionais e cobranças recorrentes podem diferir. Confirmar na conta antes de escolher o provedor. |
| Estornos/inadimplência | 1% da receita | Reserva de modelagem, sem histórico real por enquanto. |
| Suporte | 10 min/cliente/mês × R$ 20/h | Hipótese editável de custo de atendimento. |

## Resultado do cenário atual da planilha

A planilha começa com 10 clientes no Essencial, 5 no Profissional e 2 no MAX, apenas para demonstrar como o cálculo funciona.

- Receita bruta mensal do cenário: **R$ 338,30**
- Custos variáveis estimados: **R$ 120,77**
- Custos fixos mensais estimados: **R$ 405,56**
- Resultado operacional estimado: **–R$ 188,03**

Esse resultado negativo não prova que os preços são inviáveis. Mostra que uma base de 17 assinantes, nesse mix e com esses custos, ainda não cobre a estrutura modelada. Ele também pode mudar significativamente quando o custo real de hospedagem, taxas, contabilidade, suporte e aquisição for conhecido.

## Contribuição estimada por assinante

| Plano | Preço hipotético | Custo variável estimado | Contribuição antes de custos fixos | Margem de contribuição | Assinantes para cobrir R$ 405,56 de custos fixos se todos comprarem esse plano |
|---|---:|---:|---:|---:|---:|
| Essencial | R$ 19,90 | R$ 5,81 | R$ 14,09 | 70,8% | 29 |
| Profissional | R$ 39,90 | R$ 7,81 | R$ 32,09 | 80,4% | 13 |
| MAX | R$ 79,90 | R$ 11,81 | R$ 68,09 | 85,2% | 6 |

**Atenção:** contribuição não é lucro líquido. A margem acima desconta as variáveis incluídas na planilha, mas só será útil se as hipóteses estiverem próximas da realidade. O ponto de equilíbrio é simplificado e presume que todos os assinantes estejam no mesmo plano.

## Infraestrutura: uma condição antes da monetização

- **Supabase Free:** apropriado para desenvolvimento e validação inicial, com limites e possibilidade de pausa após período de baixa atividade. Não presumir que será suficiente para um serviço pago que precisa permanecer disponível.
- **Supabase Pro:** usar US$ 25/mês como referência inicial de planejamento, não como cotação garantida.
- **Hospedagem do frontend:** ainda precisa ser escolhida e cotada. A documentação do GitHub informa que GitHub Pages não se destina a hospedar SaaS comercial. A URL atual deve ser considerada ambiente de desenvolvimento/demonstração, e a migração para uma hospedagem compatível é requisito antes de vender acesso ao produto.
- **Domínio e e-mail:** comprar o domínio mais adiante, como planejado, mas obter uma cotação real e decidir o e-mail profissional antes do lançamento público.
- **Cobrança recorrente:** o provedor ainda não foi selecionado. Comparar custo real, suporte a assinaturas, inadimplência, cancelamento, emissão de comprovantes, webhooks e exigências de cadastro. Não integrar a cobrança até escolher o provedor.

## Regras para decidir o preço

1. Cotar a hospedagem de produção, domínio, e-mail e contabilidade antes de declarar o custo mensal definitivo.
2. Confirmar as taxas do meio de pagamento escolhido, especialmente em assinatura recorrente; não assumir que uma taxa promocional será permanente.
3. Validar com clientes em entrevistas ou um piloto manual antes de definir preço final. Não usar as respostas de poucos conhecidos como prova suficiente de demanda.
4. Medir tempo real de suporte, cancelamentos e custos de aquisição.
5. Só então ajustar preço e limites dos planos para que recursos caros não sejam incluídos no preço de entrada por padrão.
6. Não anunciar cobrança de assinatura enquanto pagamentos recorrentes, controle de acesso aos planos, cancelamento, termos e política de privacidade não estiverem implementados e testados.

## Fontes públicas consultadas

- Supabase — preços e limites: https://supabase.com/pricing
- Supabase — pausa automática de projetos Free: https://supabase.com/docs/guides/platform/free-project-pausing
- GitHub — limites e restrições do Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- Asaas — preços e taxas: https://www.asaas.com/precos-e-taxas
- Câmbio USD/BRL consultado para referência em 08/10/2026: https://br.investing.com/currencies/usd-brl-historical-data

## Próximos passos comerciais

1. Corrigir e testar o app e o PDF em dispositivos reais.
2. Decidir hospedagem compatível e custo total mensal.
3. Conversar com potenciais clientes, observar uso real e testar disposição a pagar.
4. Confirmar com adulto responsável e profissional contábil/jurídico a estrutura adequada para contratar serviços, receber assinaturas e cumprir obrigações, considerando que o fundador ainda é menor de idade.
5. Só depois publicar a tabela final de preços e habilitar cobrança recorrente.
