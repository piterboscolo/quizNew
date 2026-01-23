# 🔧 Troubleshooting: Tela Branca no Deploy

Se você está vendo uma tela branca após fazer o deploy, siga este guia passo a passo.

## ✅ Checklist Rápido

1. [ ] Variáveis de ambiente configuradas no Vercel
2. [ ] Variáveis com o prefixo correto (`VITE_`)
3. [ ] Novo deploy feito após adicionar variáveis
4. [ ] Console do navegador verificado para erros

---

## 🔴 Problema 1: Variáveis de Ambiente Não Configuradas

**Sintoma:** Tela branca com mensagem de erro sobre variáveis de ambiente.

**Solução:**

1. Acesse o dashboard do Vercel: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings → Environment Variables**
4. Adicione as seguintes variáveis:

| Nome | Valor | Ambiente |
|------|-------|----------|
| `VITE_SUPABASE_URL` | `https://seu-projeto.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `sua-anon-key-aqui` | Production, Preview, Development |

5. **IMPORTANTE:** Após adicionar as variáveis, faça um **novo deploy**:
   - Vá em **Deployments**
   - Clique nos três pontos (⋯) do último deploy
   - Selecione **Redeploy**

⚠️ **NUNCA use a SERVICE_ROLE KEY no frontend!** Use apenas a **ANON KEY** (chave pública).

### Onde encontrar as credenciais do Supabase:

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings → API**
4. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

---

## 🔴 Problema 2: Variáveis com Nome Errado

**Sintoma:** Tela branca mesmo com variáveis configuradas.

**Causa:** Variáveis usando prefixo antigo (`REACT_APP_` em vez de `VITE_`).

**Solução:**

No Vercel, certifique-se de que as variáveis estão com o prefixo correto:
- ✅ `VITE_SUPABASE_URL`
- ✅ `VITE_SUPABASE_ANON_KEY`
- ❌ ~~`REACT_APP_SUPABASE_URL`~~ (errado)
- ❌ ~~`REACT_APP_SUPABASE_ANON_KEY`~~ (errado)

---

## 🔴 Problema 3: Erro no Console do Navegador

**Sintoma:** Tela branca com erros no console (F12 → Console).

**Como verificar:**

1. Abra o site no navegador
2. Pressione **F12** (ou clique com botão direito → Inspecionar)
3. Vá na aba **Console**
4. Procure por erros em vermelho

### Erros comuns:

#### "Cannot read property 'X' of undefined"
- **Causa:** Componente tentando acessar propriedade de objeto undefined
- **Solução:** Verifique se os dados estão sendo carregados corretamente

#### "Failed to fetch" ou erros de CORS
- **Causa:** Problema de conexão com Supabase
- **Solução:** Verifique se a URL do Supabase está correta

#### "JWT expired" ou "Invalid JWT"
- **Causa:** Chave do Supabase incorreta ou expirada
- **Solução:** Verifique se está usando a ANON KEY correta

---

## 🔴 Problema 4: Build Falhando

**Sintoma:** Deploy não completa ou falha no build.

**Como verificar:**

1. No Vercel, vá em **Deployments**
2. Clique no deploy que falhou
3. Veja os logs de build

### Erros comuns no build:

#### "Module not found"
- **Solução:** Execute `npm install` localmente e verifique se todas as dependências estão no `package.json`

#### "TypeScript errors"
- **Solução:** Corrija os erros de TypeScript antes de fazer deploy

---

## 🔍 Verificação Passo a Passo

### 1. Verificar Variáveis no Vercel

```bash
# No dashboard do Vercel:
Settings → Environment Variables

# Deve ter:
VITE_SUPABASE_URL = https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Verificar Build Local

```bash
# Teste o build localmente
npm run build

# Se funcionar, o problema pode ser nas variáveis do Vercel
```

### 3. Verificar Console do Navegador

1. Abra o site em produção
2. F12 → Console
3. Procure por erros

### 4. Verificar Rede (Network)

1. F12 → Network
2. Recarregue a página
3. Verifique se há requisições falhando (vermelho)

---

## 🚀 Solução Rápida

Se nada funcionar, tente:

1. **Limpar cache do Vercel:**
   - Settings → General → Clear Build Cache
   - Faça um novo deploy

2. **Redeploy completo:**
   - Deployments → ⋯ → Redeploy

3. **Verificar se o build local funciona:**
   ```bash
   npm run build
   npm run preview
   ```

---

## 📞 Ainda com Problemas?

Se após seguir todos os passos ainda houver tela branca:

1. Verifique os logs do Vercel (Deployments → Build Logs)
2. Verifique o console do navegador (F12)
3. Verifique se o build local funciona (`npm run build`)
4. Certifique-se de que as variáveis estão configuradas corretamente

---

## ✅ Após Corrigir

Após configurar as variáveis e fazer um novo deploy, você deve ver:
- ✅ Tela de login aparecendo
- ✅ Sem erros no console
- ✅ Aplicação funcionando normalmente
