# 🚀 Migração para Vite - Guia Completo

Este documento descreve a migração da aplicação de **Create React App** para **Vite**.

## ✅ O que foi alterado

### 1. **package.json**
- ❌ Removido: `react-scripts`
- ✅ Adicionado: `vite`, `@vitejs/plugin-react`
- ✅ Scripts atualizados:
  - `npm start` → `npm run dev` (Vite dev server)
  - `npm run build` → Build com Vite
  - `npm run preview` → Preview do build

### 2. **vite.config.ts** (NOVO)
- Configuração do Vite
- Plugin React
- Porta padrão: 3000
- Output: `dist/`

### 3. **index.html**
- ✅ Movido de `public/index.html` para raiz
- ✅ Adicionado `<script type="module" src="/src/index.tsx"></script>`
- ✅ Removido `%PUBLIC_URL%` (não necessário no Vite)

### 4. **src/index.tsx**
- ✅ Simplificado (Vite gerencia o root automaticamente)

### 5. **tsconfig.json**
- ✅ Atualizado para configuração moderna do Vite
- ✅ Target: ES2020 (mais moderno)
- ✅ Module resolution: bundler

### 6. **tsconfig.node.json** (NOVO)
- ✅ Configuração separada para arquivos Node.js (vite.config.ts)

### 7. **src/lib/supabase.ts**
- ✅ `process.env.REACT_APP_*` → `import.meta.env.VITE_*`
- ⚠️ **IMPORTANTE:** Variáveis de ambiente mudaram de nome!

### 8. **vercel.json**
- ✅ `outputDirectory`: `build` → `dist`
- ✅ `framework`: `create-react-app` → `vite`

## ⚠️ MUDANÇA CRÍTICA: Variáveis de Ambiente

### Antes (Create React App):
```env
REACT_APP_SUPABASE_URL=https://seu-projeto.supabase.co
REACT_APP_SUPABASE_ANON_KEY=sua-anon-key
```

### Agora (Vite):
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

**⚠️ ATENÇÃO:** Você precisa atualizar seu arquivo `.env`!

## 📦 Instalação

Após a migração, execute:

```bash
# Remover node_modules e package-lock.json antigos
rm -rf node_modules package-lock.json

# Instalar novas dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

## 🚀 Comandos Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento (porta 3000) |
| `npm run build` | Cria build de produção em `dist/` |
| `npm run preview` | Preview do build de produção |
| `npm start` | Alias para `npm run dev` |

## ✨ Benefícios do Vite

1. **⚡ Desenvolvimento Ultra-Rápido**
   - HMR (Hot Module Replacement) instantâneo
   - Build inicial muito mais rápido

2. **📦 Build Otimizado**
   - Usa Rollup para produção
   - Code splitting automático
   - Tree shaking melhorado

3. **🔧 Configuração Simples**
   - Menos configuração necessária
   - TypeScript nativo
   - Suporte a CSS Modules

4. **📈 Performance**
   - Builds mais rápidos
   - Bundle menor
   - Melhor otimização

## 🔄 Próximos Passos

1. ✅ Atualizar arquivo `.env` com novos nomes de variáveis
2. ✅ Executar `npm install`
3. ✅ Testar localmente: `npm run dev`
4. ✅ Fazer build: `npm run build`
5. ✅ Atualizar variáveis de ambiente na Vercel

## 🐛 Troubleshooting

### Erro: "Cannot find module 'vite'"
**Solução:** Execute `npm install`

### Erro: "Variable is not defined" (variáveis de ambiente)
**Solução:** Renomeie as variáveis no `.env` de `REACT_APP_*` para `VITE_*`

### Erro: "Cannot GET /dashboard"
**Solução:** Verifique se o `vercel.json` está atualizado com `outputDirectory: "dist"`

### Build falha
**Solução:** 
1. Limpe o cache: `rm -rf node_modules .vite dist`
2. Reinstale: `npm install`
3. Tente novamente: `npm run build`

## 📚 Recursos

- [Documentação Vite](https://vitejs.dev/)
- [Vite + React](https://vitejs.dev/guide/features.html#react)
- [Variáveis de Ambiente no Vite](https://vitejs.dev/guide/env-and-mode.html)

---

**Migração concluída! 🎉**
