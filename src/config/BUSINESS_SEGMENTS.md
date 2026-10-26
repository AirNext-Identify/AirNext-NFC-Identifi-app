# Segmentos Business

**Onde é salvo:** `products.profile_data` (JSONB) nas chaves `__segment` (id do ramo) e
`__segmentOutro` (texto livre quando o ramo é "outro"). Não há migração de banco: o
`profile_data` já é gravado por inteiro (`setupProfile` / `updateProfile`) e lido por
`getPublicProfile`. Os campos específicos de cada ramo (ex.: `registroProfissional`,
`culinaria`, `oab`) também ficam em `profile_data`.

**Perfis antigos:** sem `__segment`, tudo continua com os textos e a ordem padrão.
Trocar de ramo não apaga campos do ramo anterior; só deixam de ser exibidos.
`__segment` é ignorado fora da categoria BUSINESS.

**Como adicionar um ramo:** novo item em `SEGMENTS` (`businessSegments.ts`) apontando para
um `preset` existente. Para um jeito novo de apresentar, crie um preset em `PRESETS`.

**Regra:** presets só renomeiam e reorganizam recursos que já existem. Não criam
funcionalidade nova.

**Ordem dos blocos:** a ordem salva pelo dono vence sempre. Sem ordem salva, a página
pública usa a sugerida do ramo. No editor, o botão "Aplicar ordem sugerida" é opcional.

**Agendamento:** o campo `linkAgendamento` (já existia no editor) agora aparece como botão
no perfil público Business. Clique registrado como ação `agendamento` em `visits`.
