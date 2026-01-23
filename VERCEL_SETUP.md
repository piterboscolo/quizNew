# ✅ Checklist de Preparação para Deploy na Vercel

Use este checklist para garantir que tudo está pronto antes de fazer o deploy.

## 📋 Pré-Deploy

### 1. Configuração do Código
- [x] `App.tsx` usa `BrowserRouter` (não `HashRouter`)
- [x] `package.json` limpo (sem configurações do GitHub Pages)
- [x] `vercel.json` configurado corretamente
- [x] `.gitignore` inclui `.env` e arquivos sensíveis
- [x] Build local funciona: `npm run build`
- [x] Aplicação testada localmente: `npm start`

### 2. Repositório Git
- [ ] Código commitado no Git
- [ ] Repositório criado no GitHub/GitLab/Bitbucket
- [ ] Código enviado para o repositório remoto

### 3. Banco de Dados Supabase
- [ ] Projeto Supabase criado
- [ ] Script `supabase_schema.sql` executado
- [ ] Script `supabase_migrate_questions_setup.sql` executado (se necessário)
- [ ] Credenciais do Supabase anotadas:
  - [ ] Project URL
  - [ ] ANON KEY (chave pública)

### 4. Variáveis de Ambiente
- [ ] Arquivo `.env.example` criado (template)
- [ ] Arquivo `.env` local criado (não commitado)
- [ ] Variáveis prontas para configurar na Vercel:
  - [ ] `REACT_APP_SUPABASE_URL`
  - [ ] `REACT_APP_SUPABASE_ANON_KEY`

## 🚀 Deploy na Vercel

### 5. Configuração na Vercel
- [ ] Conta Vercel criada
- [ ] Projeto importado do repositório Git
- [ ] Variáveis de ambiente configuradas:
  - [ ] `REACT_APP_SUPABASE_URL` (Production, Preview, Development)
  - [ ] `REACT_APP_SUPABASE_ANON_KEY` (Production, Preview, Development)
- [ ] Deploy iniciado

### 6. Pós-Deploy
- [ ] Deploy concluído com sucesso
- [ ] Aplicação acessível na URL fornecida
- [ ] Login funcionando
- [ ] Dashboard funcionando
- [ ] Conexão com Supabase funcionando

## 🐛 Se algo der errado

### Build falha
1. Verifique os logs na Vercel
2. Teste localmente: `npm run build`
3. Verifique erros de TypeScript: `npm run build` novamente

### Variáveis de ambiente não funcionam
1. Vá em Settings → Environment Variables na Vercel
2. Verifique se estão marcadas para "Production"
3. Faça um novo deploy após adicionar variáveis

### Rotas não funcionam (404)
1. Verifique se `vercel.json` está na raiz
2. Confirme que usa `BrowserRouter` (não `HashRouter`)
3. Verifique os rewrites no `vercel.json`

### Erro de conexão com Supabase
1. Verifique se está usando ANON KEY (não SERVICE_ROLE)
2. Confirme que a URL está correta
3. Verifique as políticas RLS no Supabase

## 📝 Comandos Úteis

```bash
# Testar build local
npm run build

# Testar localmente
npm start

# Verificar se .env está no .gitignore
git check-ignore .env

# Verificar status do Git
git status
```

## ✅ Quando tudo estiver pronto

1. Faça commit final:
```bash
git add .
git commit -m "Preparado para deploy na Vercel"
git push
```

2. Na Vercel, clique em "Deploy"
3. Aguarde o build (2-3 minutos)
4. Acesse sua aplicação! 🎉

---

**Última atualização:** Verifique se todos os itens estão marcados antes de fazer o deploy.
