# 🚀 Guia Rápido de Deploy na Vercel

Este guia mostra como fazer deploy da aplicação CRB Quiz na Vercel em poucos minutos.

## ✅ Pré-requisitos

- [ ] Conta no GitHub/GitLab/Bitbucket
- [ ] Repositório Git criado e código commitado
- [ ] Conta na Vercel (gratuita)
- [ ] Projeto Supabase configurado
- [ ] Credenciais do Supabase (URL e ANON KEY)

---

## 📝 Passo a Passo

### 1. Preparar o Repositório Git

```bash
# Se ainda não inicializou o Git
git init
git add .
git commit -m "Preparando para deploy na Vercel"

# Criar repositório no GitHub e conectar
git remote add origin https://github.com/seu-usuario/newQuiz-main.git
git branch -M main
git push -u origin main
```

### 2. Criar Conta na Vercel

1. Acesse: https://vercel.com
2. Clique em "Sign Up"
3. Faça login com sua conta do GitHub/GitLab/Bitbucket

### 3. Importar Projeto

1. No dashboard da Vercel, clique em **"Add New Project"**
2. Selecione o repositório `newQuiz-main`
3. A Vercel detectará automaticamente:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

### 4. Configurar Variáveis de Ambiente

**⚠️ IMPORTANTE:** Configure antes de fazer o deploy!

Na tela de configuração do projeto, role até **"Environment Variables"** e adicione:

| Nome | Valor | Ambiente |
|------|-------|----------|
| `VITE_SUPABASE_URL` | `https://seu-projeto.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `sua-anon-key-aqui` | Production, Preview, Development |

⚠️ **IMPORTANTE:** No Vite, as variáveis devem começar com `VITE_` (não `REACT_APP_`)

**Onde encontrar as credenciais:**
1. Acesse seu projeto no Supabase: https://supabase.com/dashboard
2. Vá em **Settings → API**
3. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

⚠️ **NUNCA use a SERVICE_ROLE KEY no frontend!**

### 5. Fazer o Deploy

1. Clique em **"Deploy"**
2. Aguarde o build (2-3 minutos)
3. ✅ Sua aplicação estará online!

A Vercel fornecerá uma URL como: `https://newquiz-main.vercel.app`

---

## 🔄 Deploy Automático

A partir de agora, **toda vez que você fizer `git push`**, a Vercel fará deploy automático:

```bash
git add .
git commit -m "Nova funcionalidade"
git push
```

A Vercel criará:
- ✅ **Production**: Deploy da branch `main`
- ✅ **Preview**: Deploy de outras branches e pull requests

---

## 🌐 Domínio Personalizado (Opcional)

1. No dashboard da Vercel, vá em **Settings → Domains**
2. Clique em **"Add Domain"**
3. Digite seu domínio (ex: `quiz.crb.com`)
4. Siga as instruções para configurar o DNS

---

## 🔧 Configurações Avançadas

### Build Command Customizado

Se necessário, você pode ajustar no `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "framework": "create-react-app"
}
```

### Variáveis de Ambiente por Ambiente

Você pode ter valores diferentes para Production, Preview e Development:

1. Vá em **Settings → Environment Variables**
2. Ao adicionar uma variável, selecione os ambientes desejados

---

## 🐛 Troubleshooting

### Erro: "Build failed"

**Solução:**
1. Verifique os logs de build na Vercel
2. Teste localmente: `npm run build`
3. Verifique se todas as dependências estão no `package.json`

### Erro: "Variáveis de ambiente não configuradas"

**Solução:**
1. Vá em **Settings → Environment Variables**
2. Verifique se `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão configuradas
3. Certifique-se de que estão marcadas para "Production"
4. ⚠️ **IMPORTANTE:** No Vite, use `VITE_` ao invés de `REACT_APP_`

### Erro: "Cannot GET /dashboard"

**Solução:**
O `vercel.json` já está configurado com rewrites para SPA. Se ainda não funcionar:
1. Verifique se o arquivo `vercel.json` está na raiz do projeto
2. Certifique-se de que está usando `BrowserRouter` (não `HashRouter`)

### Erro: "Supabase connection failed"

**Solução:**
1. Verifique se está usando a **ANON KEY** (não SERVICE_ROLE)
2. Verifique se a URL do Supabase está correta
3. Verifique as políticas RLS no Supabase

---

## 📊 Monitoramento

A Vercel fornece:
- ✅ Logs de build em tempo real
- ✅ Analytics de performance
- ✅ Relatórios de erros
- ✅ Histórico de deploys

Acesse em: **Dashboard → Seu Projeto → Deployments**

---

## 🔐 Segurança

### Variáveis de Ambiente

- ✅ Nunca commite o arquivo `.env`
- ✅ Use apenas ANON KEY no frontend
- ✅ SERVICE_ROLE KEY deve ser usada apenas no backend (se houver)

### Políticas RLS

Certifique-se de que as políticas RLS no Supabase estão configuradas corretamente:
- Execute `supabase_schema.sql` no Supabase
- Verifique as políticas de acesso

---

## 📚 Recursos Adicionais

- [Documentação Vercel](https://vercel.com/docs)
- [Documentação Supabase](https://supabase.com/docs)
- [React Router Deploy](https://reactrouter.com/en/main/start/deploying)

---

## ✅ Checklist Final

Antes de fazer o deploy, verifique:

- [ ] Código commitado no Git
- [ ] Repositório conectado à Vercel
- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados Supabase configurado
- [ ] Tabelas criadas (`supabase_schema.sql`)
- [ ] Build local funciona (`npm run build`)
- [ ] Testado localmente (`npm start`)

---

**Pronto para fazer deploy! 🚀**

Se tiver dúvidas, consulte a [documentação completa](./DEPLOY.md) ou os logs de build na Vercel.
