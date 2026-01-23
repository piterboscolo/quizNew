# CRB Quiz - Sistema de Quiz Educacional

Aplicação de quiz com sistema de autenticação, áreas separadas para alunos e administradores, e seleção de matérias.

## 🚀 Deploy

**📖 Para instruções completas de deploy, consulte o arquivo [DEPLOY.md](./DEPLOY.md)**

### Opção Recomendada: Vercel

A aplicação já está configurada para deploy na Vercel. Basta:

1. Conectar seu repositório Git à Vercel
2. Configurar as variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Fazer o deploy!

Veja o guia completo em [DEPLOY.md](./DEPLOY.md)

## ✨ Funcionalidades

- **Sistema de Login**: Autenticação com usuário e senha
- **Área do Aluno**: 
  - Seleção de matérias
  - Realização de quizzes
  - Visualização de resultados
  - Perfil personalizado
- **Área do Administrador**:
  - Dashboard com estatísticas
  - Gerenciamento de usuários
  - Gerenciamento de matérias
  - Migração de questões do mockData para o banco
  - Estatísticas por matéria
  - Ranking de usuários

## 👥 Usuários de Teste

- **Admin**: 
  - Usuário: `admin`
  - Senha: `admin123`

- **Aluno**: 
  - Usuário: `aluno`
  - Senha: `aluno123`

## 📦 Instalação Local

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/newQuiz-main.git
cd newQuiz-main
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o arquivo .env com suas credenciais do Supabase
```

4. Execute o servidor de desenvolvimento:
```bash
npm start
```

5. Acesse a aplicação em `http://localhost:3000`

## 🗄️ Configuração do Banco de Dados

1. Execute o script SQL no Supabase:
   - `supabase_schema.sql` - Cria todas as tabelas
   - `supabase_migrate_questions_setup.sql` - Prepara a tabela de questões

2. Migre as questões:
   - Acesse `/migrate-questions` como admin
   - Clique em "Iniciar Migração"

## 🛠️ Tecnologias

- **Frontend:**
  - React 18
  - TypeScript
  - React Router DOM
  - Vite (Build Tool)

- **Backend:**
  - Supabase (PostgreSQL)
  - Row Level Security (RLS)

- **Deploy:**
  - Vercel (configurado)
  - Alternativas: Netlify, GitHub Pages

## 📁 Estrutura do Projeto

```
src/
├── components/       # Componentes React
│   ├── AdminDashboard.tsx
│   ├── AlunoDashboard.tsx
│   ├── Dashboard.tsx
│   ├── Login.tsx
│   ├── Quiz.tsx
│   └── Profile.tsx
├── context/          # Contextos (Auth, Quiz)
├── data/            # Dados mockados (mockData.ts)
├── lib/             # Configurações (Supabase)
├── scripts/          # Scripts de migração
├── services/        # Serviços de API
├── types/           # Definições TypeScript
└── App.tsx          # Componente principal
```

## 📚 Scripts Disponíveis

- `npm run dev` ou `npm start` - Inicia o servidor de desenvolvimento (Vite)
- `npm run build` - Cria build de produção
- `npm run preview` - Preview do build de produção

## 🔐 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

⚠️ **IMPORTANTE:** 
- Use sempre a ANON KEY (chave pública), nunca a SERVICE_ROLE KEY no frontend!
- No Vite, as variáveis de ambiente devem começar com `VITE_` (não `REACT_APP_`)

## 📖 Documentação Adicional

- [Guia de Deploy](./DEPLOY.md) - Instruções completas de deploy
- [Supabase Schema](./supabase_schema.sql) - Estrutura do banco de dados
- [Migração de Questões](./supabase_migrate_questions_setup.sql) - Script de preparação

## 🐛 Troubleshooting

### Erro de conexão com Supabase
- Verifique se as variáveis de ambiente estão configuradas
- Confirme que está usando a ANON KEY (não SERVICE_ROLE)
- Verifique as políticas RLS no Supabase

### Build falha
- Execute `npm install` novamente
- Limpe o cache: `npm cache clean --force`
- Delete `node_modules` e reinstale

## 📝 Licença

Este projeto é privado e de uso educacional.

---

**Desenvolvido com ❤️ para CRB Quiz**

