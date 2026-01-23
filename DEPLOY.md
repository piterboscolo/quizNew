# 🚀 Guia de Deploy - CRB Quiz

Este guia apresenta as melhores opções para fazer deploy da aplicação CRB Quiz.

## 📋 Pré-requisitos

Antes de fazer o deploy, certifique-se de que:

1. ✅ O banco de dados Supabase está configurado e funcionando
2. ✅ As tabelas foram criadas (execute `supabase_schema.sql`)
3. ✅ As questões foram migradas (execute `supabase_migrate_questions_setup.sql` e depois a migração)
4. ✅ Você tem as credenciais do Supabase (URL e ANON KEY)

---

## 🎯 Opção 1: Vercel (RECOMENDADO) ⭐

A **Vercel** é a melhor opção para esta aplicação porque:
- ✅ Já está configurada (`vercel.json` existe)
- ✅ Deploy automático via Git
- ✅ CDN global para performance
- ✅ SSL gratuito
- ✅ Preview de pull requests
- ✅ Variáveis de ambiente fáceis de configurar
- ✅ Gratuito para projetos pessoais

### Passo a Passo:

#### 1. Preparar o Repositório Git

```bash
# Se ainda não tem um repositório Git
git init
git add .
git commit -m "Initial commit"
git branch -M main

# Criar repositório no GitHub/GitLab/Bitbucket
# Depois conectar:
git remote add origin https://github.com/seu-usuario/newQuiz-main.git
git push -u origin main
```

#### 2. Criar Conta na Vercel

1. Acesse: https://vercel.com
2. Faça login com GitHub/GitLab/Bitbucket
3. Clique em "Add New Project"

#### 3. Conectar o Repositório

1. Selecione o repositório `newQuiz-main`
2. A Vercel detectará automaticamente as configurações do `vercel.json`

#### 4. Configurar Variáveis de Ambiente

Na tela de configuração do projeto, adicione:

```
REACT_APP_SUPABASE_URL=https://seu-projeto.supabase.co
REACT_APP_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

**⚠️ IMPORTANTE:**
- Use a **ANON KEY** (chave pública), NÃO a SERVICE_ROLE KEY
- A ANON KEY está em: Supabase Dashboard → Settings → API → anon public

#### 5. Deploy

1. Clique em "Deploy"
2. Aguarde o build (2-3 minutos)
3. Sua aplicação estará online! 🎉

#### 6. Domínio Personalizado (Opcional)

1. Vá em Settings → Domains
2. Adicione seu domínio personalizado
3. Siga as instruções de DNS

### Atualizações Futuras

A Vercel faz deploy automático sempre que você fizer `git push`:
```bash
git add .
git commit -m "Atualização"
git push
```

---

## 🌐 Opção 2: Netlify

A **Netlify** é uma alternativa excelente com recursos similares à Vercel.

### Passo a Passo:

1. Acesse: https://www.netlify.com
2. Faça login com GitHub
3. Clique em "Add new site" → "Import an existing project"
4. Selecione o repositório
5. Configure:
   - **Build command:** `npm run build`
   - **Publish directory:** `build`
6. Adicione as variáveis de ambiente:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`
7. Clique em "Deploy site"

### Arquivo de Configuração (Opcional)

Crie `netlify.toml` na raiz do projeto:

```toml
[build]
  command = "npm run build"
  publish = "build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## ☁️ Opção 3: GitHub Pages

Gratuito, mas requer configuração adicional para React Router.

### Passo a Passo:

1. Instale o pacote:
```bash
npm install --save-dev gh-pages
```

2. Adicione no `package.json`:
```json
{
  "homepage": "https://seu-usuario.github.io/newQuiz-main",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d build"
  }
}
```

3. Configure o HashRouter no `App.tsx` (em vez de BrowserRouter):
```typescript
import { HashRouter } from 'react-router-dom';
```

4. Faça o deploy:
```bash
npm run deploy
```

**⚠️ Limitação:** Variáveis de ambiente precisam ser hardcoded ou usar outra solução.

---

## 🐳 Opção 4: Docker + Servidor VPS

Para controle total e hospedagem própria.

### Criar Dockerfile:

```dockerfile
# Dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Criar nginx.conf:

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Build e Deploy:

```bash
docker build -t crb-quiz .
docker run -d -p 80:80 --env-file .env crb-quiz
```

---

## 🔧 Configuração de Variáveis de Ambiente

### Para Vercel/Netlify:

1. Acesse as configurações do projeto
2. Vá em "Environment Variables"
3. Adicione:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

⚠️ **IMPORTANTE:** No Vite, as variáveis devem começar com `VITE_` (não `REACT_APP_`)

### Para Build Local:

Crie um arquivo `.env`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

---

## ✅ Checklist de Deploy

Antes de fazer o deploy, verifique:

- [ ] Banco de dados Supabase configurado
- [ ] Tabelas criadas (`supabase_schema.sql` executado)
- [ ] Questões migradas (se necessário)
- [ ] Variáveis de ambiente configuradas
- [ ] Build local funciona (`npm run build`)
- [ ] Testado localmente (`npm start`)
- [ ] `.env` não está no repositório (já está no `.gitignore`)

---

## 🐛 Troubleshooting

### Erro: "Variáveis de ambiente não configuradas"

**Solução:** Verifique se as variáveis estão configuradas na plataforma de deploy:
- Vercel: Settings → Environment Variables
- Netlify: Site settings → Environment variables

### Erro: "Cannot GET /dashboard"

**Solução:** Configure o redirect para SPA (já está no `vercel.json`):
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Erro: "Supabase connection failed"

**Solução:** 
1. Verifique se está usando a ANON KEY (não SERVICE_ROLE)
2. Verifique se a URL do Supabase está correta
3. Verifique as políticas RLS no Supabase

### Build falha

**Solução:**
1. Teste localmente: `npm run build`
2. Verifique os logs de erro
3. Certifique-se de que todas as dependências estão no `package.json`

---

## 📊 Comparação de Opções

| Plataforma | Gratuito | Fácil Setup | Deploy Automático | Domínio Custom | Melhor Para |
|------------|----------|-------------|-------------------|----------------|-------------|
| **Vercel** | ✅ Sim | ⭐⭐⭐⭐⭐ | ✅ Sim | ✅ Sim | **Recomendado** |
| **Netlify** | ✅ Sim | ⭐⭐⭐⭐⭐ | ✅ Sim | ✅ Sim | Alternativa |
| **GitHub Pages** | ✅ Sim | ⭐⭐⭐ | ❌ Manual | ✅ Sim | Projetos simples |
| **VPS/Docker** | ❌ Pago | ⭐⭐ | ❌ Manual | ✅ Sim | Controle total |

---

## 🎯 Recomendação Final

**Use Vercel** porque:
1. ✅ Já está configurada no projeto
2. ✅ Deploy em menos de 5 minutos
3. ✅ Performance excelente
4. ✅ Gratuito e sem limites para projetos pessoais
5. ✅ Suporte a preview de branches

---

## 📚 Recursos Adicionais

- [Documentação Vercel](https://vercel.com/docs)
- [Documentação Netlify](https://docs.netlify.com/)
- [Documentação Supabase](https://supabase.com/docs)
- [React Router Deploy](https://reactrouter.com/en/main/start/deploying)

---

## 🆘 Precisa de Ajuda?

Se encontrar problemas durante o deploy:
1. Verifique os logs de build na plataforma
2. Teste o build localmente primeiro
3. Verifique as variáveis de ambiente
4. Consulte a documentação da plataforma escolhida

---

**Boa sorte com o deploy! 🚀**
