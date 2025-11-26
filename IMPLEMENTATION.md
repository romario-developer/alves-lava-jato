# Alves Lava a Jato – Gestão: Progresso Atual

Resumo do que já foi implementado até agora (backend + frontend).

## Backend (NestJS + Prisma)
- **Autenticação**: login/refresh sem exigir companyId (opcional quando email único); register-owner; JWT; guard + decorators `@CurrentUser`/`@CurrentCompany`.
- **Empresas**: CRUD básico (`/companies`), dados cadastrais e tema.
- **Usuários**: CRUD com papéis (OWNER/MANAGER/OPERATOR), filtro/paginação.
- **Clientes & Veículos**: CRUD de clientes, veículos vinculados, busca e paginação.
- **Serviços**: CRUD com flag de pós-venda (follow-up) e dias de retorno.
- **Agenda**: Agendamentos com serviços, status, filtro por período.
- **Ordens de Serviço (OS)**: criação com itens/serviços, pagamentos, sequencial por empresa, follow-up automático ao concluir.
- **Financeiro**: Contas a pagar/receber (listar/criar/atualizar), fluxo de caixa resumido.
- **Follow-ups**: listar por período/status, atualizar status (pós-venda).
- **Onboarding**: coleta rápida de perfil da empresa (ramo, equipe, faturamento, prioridade, origem).
- **Infra**: Swagger em `/api/docs`, validação global, Prisma configurado com multi-tenant por `companyId`.

## Frontend (Vite + React + Tailwind)
- **Autenticação**: tela de login (email/senha), Zustand para tokens, refresh automático no Axios.
- **Layout**: navegação protegida, AppLayout com menu (Home, Dashboard, Clientes, Serviços, OS, Financeiro).
- **Home**: painel rápido (ações, resumos de orçamentos, vagas, pós-venda, financeiro do dia, agenda e calendário mensal estilo CERA).
- **Dashboard**: visão recente de OS e agenda do dia, modal de onboarding se não concluído.
- **Clientes**: listagem com busca, veículos básicos.
- **Serviços**: listagem simples.
- **OS**: listagem básica com status e totais.
- **Financeiro**: resumo de caixa, listas de pagar/receber com filtros; modais de criação/edição; alertas de pós-venda.
- **Onboarding**: wizard de 5 perguntas (abre só se não estiver completo).

## Endpoints Principais
- Auth: `POST /auth/login`, `POST /auth/refresh`, `POST /auth/register-owner`, `GET /auth/me`
- Companies: `GET /companies/me`, `PATCH /companies/me`, `POST /companies`
- Users: `GET /users`, `POST /users`, `PATCH /users/:id`, `GET /users/:id`
- Clients: `GET /clients`, `POST /clients`, `PATCH /clients/:id`, veículos em `/clients/:id/vehicles`
- Services: `GET/POST/PATCH /services`
- Appointments: `GET/POST/PATCH /appointments`
- Work Orders: `GET/POST /work-orders`, `GET /work-orders/:id`, `PATCH /work-orders/:id/status`, `POST /work-orders/:id/payments`
- Financeiro: `GET/POST/PATCH /financial/payables`, `GET/POST/PATCH /financial/receivables`, `GET /financial/cashflow`
- Follow-ups: `GET /follow-ups`, `PATCH /follow-ups/:id/status`
- Onboarding: `GET /onboarding/me`, `POST /onboarding`

## Observações
- Prisma já migrado com `CompanyOnboarding`; se necessário, rodar `npm run prisma:migrate`.
- Vite alerta que prefere Node 22.12+ ou 20.19+, mas build funciona na versão atual.***
