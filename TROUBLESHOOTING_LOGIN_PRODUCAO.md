# 🔐 Troubleshooting: Login não funciona em produção (Vercel)

## Problema
A aplicação funciona perfeitamente no localhost, mas no deploy do Vercel (com GitHub e banco Supabase), a aplicação diz que o usuário e senha não foram encontrados.

## 🔍 Possíveis Causas

### 1. Variáveis de Ambiente não Configuradas no Vercel
**Sintoma:** Login falha silenciosamente ou retorna erro genérico.

**Solução:**
1. Acesse o dashboard da Vercel: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings → Environment Variables**
4. Adicione as seguintes variáveis:
   - `VITE_SUPABASE_URL` = URL do seu projeto Supabase
   - `VITE_SUPABASE_ANON_KEY` = Chave anon (pública) do Supabase
5. ⚠️ **IMPORTANTE:** Marque para **Production**, **Preview** e **Development**
6. Após adicionar, faça um novo deploy (ou aguarde o redeploy automático)

**Como encontrar as credenciais:**
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings → API**
4. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

⚠️ **NUNCA use a SERVICE_ROLE KEY no frontend!**

---

### 2. Case Sensitivity (Maiúsculas/Minúsculas)
**Sintoma:** Login funciona localmente mas não em produção.

**Causa:** O PostgreSQL no Supabase pode ter configuração diferente de collation que o banco local.

**Solução:**
- A aplicação agora normaliza o username para lowercase antes de buscar
- Certifique-se de que os usuários no banco estão com username em lowercase
- Execute o script `supabase_fix_login.sql` para garantir que os usuários padrão existem

---

### 3. Políticas RLS (Row Level Security) Bloqueando
**Sintoma:** Erro de permissão ou usuário não encontrado mesmo existindo.

**Solução:**
1. Acesse o SQL Editor no Supabase: https://supabase.com/dashboard/project/_/sql
2. Execute o script `supabase_fix_rls.sql` que está na raiz do projeto
3. Isso criará políticas RLS que permitem leitura e escrita na tabela `users`

**Verificar se RLS está bloqueando:**
```sql
-- Verificar políticas RLS
SELECT 
  policyname,
  cmd as operacao,
  qual as condicao
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'users';

-- Verificar se RLS está habilitado
SELECT 
  tablename,
  rowsecurity as rls_habilitado
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'users';
```

---

### 4. Usuários não Existem no Banco de Produção
**Sintoma:** Login retorna "usuário não encontrado".

**Solução:**
1. Acesse o SQL Editor no Supabase
2. Execute o script `supabase_fix_login.sql`
3. Isso criará os usuários padrão:
   - Username: `admin`, Senha: `admin123`
   - Username: `aluno`, Senha: `aluno123`

**Verificar usuários existentes:**
```sql
SELECT id, username, role, created_at
FROM users
ORDER BY created_at DESC;
```

---

### 5. Diferença entre Banco Local e Produção
**Sintoma:** Dados diferentes entre localhost e produção.

**Causa:** Você pode estar usando bancos diferentes (local vs Supabase cloud).

**Solução:**
- Certifique-se de que está usando o mesmo banco Supabase em ambos os ambientes
- Ou migre os dados do banco local para o Supabase de produção
- Execute os scripts SQL necessários no Supabase de produção

---

### 6. Espaços em Branco ou Caracteres Especiais
**Sintoma:** Login funciona às vezes mas não sempre.

**Solução:**
- A aplicação agora remove espaços em branco automaticamente
- Certifique-se de que não há espaços extras no banco de dados

---

## 🔧 Verificação Passo a Passo

### Passo 1: Verificar Variáveis de Ambiente no Vercel
```bash
# No console do navegador (F12) na aplicação em produção, verifique:
console.log(import.meta.env.VITE_SUPABASE_URL);
console.log(import.meta.env.VITE_SUPABASE_ANON_KEY);
```

Se retornar `undefined`, as variáveis não estão configuradas.

### Passo 2: Verificar Conexão com Supabase
1. Abra o console do navegador (F12)
2. Tente fazer login
3. Veja os logs no console
4. Procure por mensagens de erro específicas

### Passo 3: Verificar Políticas RLS
Execute no SQL Editor do Supabase:
```sql
-- Ver todas as políticas
SELECT * FROM pg_policies WHERE tablename = 'users';

-- Testar query manualmente
SELECT * FROM users WHERE username = 'admin' AND password = 'admin123';
```

### Passo 4: Verificar Usuários no Banco
Execute no SQL Editor do Supabase:
```sql
SELECT id, username, role, LENGTH(password) as password_length
FROM users
ORDER BY created_at DESC;
```

---

## 🚀 Solução Rápida (Checklist)

Execute na ordem:

- [ ] **1. Configurar variáveis de ambiente no Vercel**
  - [ ] `VITE_SUPABASE_URL` configurada
  - [ ] `VITE_SUPABASE_ANON_KEY` configurada
  - [ ] Variáveis marcadas para Production, Preview e Development
  - [ ] Fazer novo deploy após configurar

- [ ] **2. Executar scripts SQL no Supabase**
  - [ ] Executar `supabase_fix_rls.sql` (corrigir políticas RLS)
  - [ ] Executar `supabase_fix_login.sql` (criar usuários padrão)

- [ ] **3. Verificar dados no banco**
  - [ ] Confirmar que usuários existem
  - [ ] Confirmar que senhas estão corretas
  - [ ] Confirmar que políticas RLS permitem leitura

- [ ] **4. Testar login**
  - [ ] Abrir aplicação em produção
  - [ ] Abrir console do navegador (F12)
  - [ ] Tentar fazer login
  - [ ] Verificar logs no console

---

## 📝 Logs Úteis para Debug

A aplicação agora gera logs detalhados no console. Ao tentar fazer login, você verá:

```
🔐 Tentando fazer login: admin
🔑 Senha fornecida: ad***
🌍 Ambiente: production
🔗 Supabase URL configurada: true
🔍 Buscando usuário no banco...
```

Se houver erro, você verá mensagens específicas indicando o problema.

---

## 🆘 Ainda não funciona?

1. **Verifique os logs do console do navegador** - Eles indicam o problema específico
2. **Verifique os logs de build no Vercel** - Pode haver erro no build
3. **Teste a conexão manualmente** - Use o SQL Editor do Supabase para testar queries
4. **Compare ambiente local vs produção** - Verifique se há diferenças

---

## 📚 Arquivos Relacionados

- `src/context/AuthContext.tsx` - Lógica de autenticação
- `src/lib/supabase.ts` - Configuração do cliente Supabase
- `supabase_fix_rls.sql` - Script para corrigir políticas RLS
- `supabase_fix_login.sql` - Script para criar usuários padrão
- `VERCEL_DEPLOY.md` - Guia de deploy na Vercel

---

**Última atualização:** Corrigido para normalizar username (lowercase) e password (trim), melhorar logs e verificação de variáveis de ambiente.
