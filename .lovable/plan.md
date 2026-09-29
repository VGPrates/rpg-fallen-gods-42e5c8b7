# Remover o código da mesa

## Objetivo
Eliminar completamente o mecanismo de código de convite, sem remover as mesas nem alterar as demais funções do jogo.

## Alterações
- Remover do topo da tela do Mestre o texto e o valor “Código da mesa”.
- Remover o código dos dados de perfil e das ações de criação de Mestre/Jogador.
- Remover geração, consulta, validação e mensagens relacionadas ao código.
- Manter `game_tables` e a associação automática dos jogadores à mesa existente, pois elas organizam fichas e permissões.
- Remover a coluna de código do banco por uma alteração segura, preservando mesas, personagens e contas existentes.

## Validação
- Confirmar que Mestre e Jogador continuam entrando normalmente.
- Confirmar que criar mesa/ficha e abrir os painéis continua funcionando.
- Verificar compilação, erros do navegador e ausência de referências ao código da mesa.

## Detalhes técnicos
- Atualizar os tipos e contratos internos para não aceitarem ou retornarem `inviteCode`.
- Simplificar a escolha da mesa do jogador para usar a mesa existente, sem busca por convite.
- Aplicar uma migração que remove somente `game_tables.invite_code`; a tabela `game_tables` permanece.
