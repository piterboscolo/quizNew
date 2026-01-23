# 🔧 Troubleshooting: Problemas de Conexão com Banco de Dados

Este guia ajuda a resolver problemas de conexão com o Supabase no ambiente de deploy.

## ✅ Checklist Rápido

1. [ ] Variáveis de ambiente configuradas no Vercel
2. [ ] Variáveis com prefixo `VITE_` (não `REACT_APP_`)
3. [ ] Usando ANON KEY (não SERVICE_ROLE KEY)
4. [ ] Políticas RLS configuradas no Supabase
5. [ ] Tabelas criadas no banco de dados
6. [ ] Novo deploy feito após mudanças

---

## 🔴 Problema 1: Variáveis de Ambiente Não Configuradas

**Sintoma:** Erro "Variáveis de ambiente não configuradas" ou conexão falhando.

**Solução:**

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings → Environment Variables**
4. Adicione:

| Nome | Valor | Ambiente |
|------|-------|----------|
| `VITE_SUPABASE_URL` | `https://seu-projeto.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `sua-anon-key` | Production, Preview, Development |

5. **IMPORTANTE:** Faça um novo deploy após adicionar as variáveis!

---

## 🔴 Problema 2: Usando SERVICE_ROLE KEY (Erro Crítico)

**Sintoma:** Erro "ERRO CRÍTICO: Você está usando a SERVICE_ROLE KEY"

**Causa:** A SERVICE_ROLE KEY é uma chave secreta que NÃO pode ser usada no frontend.

**Solução:**

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings → API**
4. Copie a chave **"anon public"** (NÃO a "service_role")
5. Atualize `VITE_SUPABASE_ANON_KEY` no Vercel com a ANON KEY
6. Faça um novo deploy

⚠️ **NUNCA exponha a SERVICE_ROLE KEY no frontend!** Ela dá acesso total ao banco.

---

## 🔴 Problema 3: Políticas RLS Bloqueando Acesso

**Sintoma:** Erro "permission denied" ou código `42501`

**Causa:** Row Level Security (RLS) está bloqueando as requisições.

**Solução:**

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Execute o arquivo `supabase_fix_rls.sql`:

```sql
-- Habilitar RLS nas tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura pública (ajuste conforme necessário)
CREATE POLICY "Permitir leitura pública" ON users
  FOR SELECT USING (true);

CREATE POLICY "Permitir leitura pública" ON subjects
  FOR SELECT USING (true);

CREATE POLICY "Permitir leitura pública" ON questions
  FOR SELECT USING (true);

-- Política para permitir inserção (ajuste conforme necessário)
CREATE POLICY "Permitir inserção" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir inserção" ON subjects
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir inserção" ON questions
  FOR INSERT WITH CHECK (true);
```

**Nota:** Ajuste as políticas conforme sua necessidade de segurança.

---

## 🔴 Problema 4: Tabelas Não Existem

**Sintoma:** Erro "relation does not exist" ou código `42P01`

**Causa:** As tabelas não foram criadas no banco de dados.

**Solução:**

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Execute o arquivo `supabase_schema.sql`
4. Verifique se as tabelas foram criadas em **Table Editor**

---

## 🔴 Problema 5: Erro de CORS

**Sintoma:** Erro "CORS policy" ou "Failed to fetch"

**Causa:** Configurações de CORS no Supabase bloqueando requisições.

**Solução:**

1. Acesse o Supabase Dashboard
2. Vá em **Settings → API**
3. Verifique se a URL do seu site está nas configurações de CORS
4. Adicione o domínio do Vercel (ex: `https://seu-projeto.vercel.app`)

**Nota:** Por padrão, o Supabase permite requisições de qualquer origem. Se você restringiu, adicione o domínio do Vercel.

---

## 🔴 Problema 6: Erro de Autenticação JWT

**Sintoma:** Erro "JWT expired" ou "Invalid JWT" ou código `PGRST301`

**Causa:** A chave ANON está incorreta ou expirada.

**Solução:**

1. Verifique se está usando a ANON KEY correta
2. No Supabase Dashboard → Settings → API, copie novamente a ANON KEY
3. Atualize no Vercel
4. Faça um novo deploy

---

## 🔍 Diagnóstico Automático

A aplicação inclui um sistema de diagnóstico automático:

1. Na tela de login, se houver problemas de conexão, aparecerá um botão
2. Clique em "Problemas de Conexão Detectados"
3. O diagnóstico mostrará:
   - ✅ Testes que passaram
   - ❌ Testes que falharam
   - ⚠️ Avisos
   - 💡 Soluções recomendadas

---

## 🚀 Verificação Passo a Passo

### 1. Verificar Variáveis no Vercel

```bash
# No dashboard do Vercel:
Settings → Environment Variables

# Deve ter:
VITE_SUPABASE_URL = https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Verificar no Supabase

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings → API**
4. Confirme:
   - Project URL está correto
   - ANON KEY está sendo usada (não SERVICE_ROLE)

### 3. Verificar Tabelas

1. No Supabase Dashboard → **Table Editor**
2. Verifique se existem as tabelas:
   - `users`
   - `subjects`
   - `questions`
   - `user_sessions`

### 4. Verificar RLS

1. No Supabase Dashboard → **Authentication → Policies**
2. Verifique se há políticas configuradas para as tabelas

### 5. Testar Localmente

```bash
# Teste localmente primeiro
npm run build
npm run preview

# Se funcionar localmente, o problema é nas variáveis do Vercel
```

---

## 🐛 Erros Comuns e Soluções

### "Failed to fetch"
- **Causa:** Problema de rede ou CORS
- **Solução:** Verifique configurações de CORS no Supabase

### "permission denied for table"
- **Causa:** RLS bloqueando acesso
- **Solução:** Execute `supabase_fix_rls.sql`

### "relation does not exist"
- **Causa:** Tabelas não criadas
- **Solução:** Execute `supabase_schema.sql`

### "JWT expired"
- **Causa:** Chave incorreta
- **Solução:** Atualize a ANON KEY no Vercel

### "Invalid API key"
- **Causa:** Chave incorreta ou usando SERVICE_ROLE
- **Solução:** Use a ANON KEY (chave pública)

---

## 📞 Ainda com Problemas?

1. Verifique os logs do Vercel (Deployments → Build Logs)
2. Verifique o console do navegador (F12)
3. Use o diagnóstico automático na tela de login
4. Verifique se o build local funciona (`npm run build`)

---

## ✅ Após Corrigir

Após resolver os problemas:

1. ✅ Faça um novo deploy no Vercel
2. ✅ Teste a conexão na tela de login
3. ✅ Verifique se o diagnóstico mostra todos os testes passando
4. ✅ Teste login e registro

---

## 📚 Arquivos Relacionados

- `supabase_schema.sql` - Criação das tabelas
- `supabase_fix_rls.sql` - Configuração de RLS
- `src/utils/connectionTest.ts` - Funções de diagnóstico
- `src/components/ConnectionDiagnostic.tsx` - Componente de diagnóstico
