-- ============================================
-- DIAGNÓSTICO DE PROBLEMAS DE LOGIN
-- ============================================
-- Execute este script para diagnosticar problemas de login em produção
-- Execute no SQL Editor do Supabase: https://supabase.com/dashboard/project/_/sql

-- ============================================
-- 1. VERIFICAR VARIÁVEIS DE AMBIENTE (Manual)
-- ============================================
-- ⚠️ Verifique manualmente no Vercel:
-- Settings → Environment Variables
-- - VITE_SUPABASE_URL deve estar configurada
-- - VITE_SUPABASE_ANON_KEY deve estar configurada
-- - Ambas devem estar marcadas para Production, Preview e Development

-- ============================================
-- 2. VERIFICAR USUÁRIOS NO BANCO
-- ============================================
SELECT 
  '=== USUÁRIOS NO BANCO ===' as info;

SELECT 
  id,
  username,
  role,
  LENGTH(password) as tamanho_senha,
  CASE 
    WHEN username = LOWER(username) THEN '✅ Lowercase'
    ELSE '⚠️ Tem maiúsculas'
  END as formato_username,
  created_at
FROM users
ORDER BY created_at DESC;

-- ============================================
-- 3. TESTAR LOGIN MANUALMENTE
-- ============================================
SELECT 
  '=== TESTE DE LOGIN ===' as info;

-- Teste 1: Login do admin (busca exata)
SELECT 
  'Teste 1: Admin (exato)' as teste,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM users 
      WHERE username = 'admin' 
        AND password = 'admin123'
    ) THEN '✅ Login funcionaria'
    ELSE '❌ Login NÃO funcionaria'
  END as resultado;

-- Teste 2: Login do admin (case-insensitive username)
SELECT 
  'Teste 2: Admin (case-insensitive)' as teste,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM users 
      WHERE LOWER(username) = LOWER('admin')
        AND password = 'admin123'
    ) THEN '✅ Login funcionaria'
    ELSE '❌ Login NÃO funcionaria'
  END as resultado;

-- Teste 3: Login do aluno
SELECT 
  'Teste 3: Aluno (exato)' as teste,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM users 
      WHERE username = 'aluno' 
        AND password = 'aluno123'
    ) THEN '✅ Login funcionaria'
    ELSE '❌ Login NÃO funcionaria'
  END as resultado;

-- ============================================
-- 4. VERIFICAR POLÍTICAS RLS
-- ============================================
SELECT 
  '=== POLÍTICAS RLS ===' as info;

SELECT 
  policyname as nome_politica,
  cmd as operacao,
  CASE 
    WHEN cmd = 'SELECT' THEN '🔍 Leitura'
    WHEN cmd = 'INSERT' THEN '➕ Inserção'
    WHEN cmd = 'UPDATE' THEN '✏️ Atualização'
    WHEN cmd = 'DELETE' THEN '🗑️ Deleção'
    ELSE cmd
  END as tipo_operacao,
  CASE 
    WHEN qual IS NOT NULL OR with_check IS NOT NULL THEN '✅ Configurada'
    ELSE '❌ Não configurada'
  END as status
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'users'
ORDER BY cmd, policyname;

-- ============================================
-- 5. VERIFICAR SE RLS ESTÁ HABILITADO
-- ============================================
SELECT 
  '=== STATUS RLS ===' as info;

SELECT 
  tablename,
  rowsecurity as rls_habilitado,
  CASE 
    WHEN rowsecurity THEN '⚠️ RLS HABILITADO - políticas são aplicadas'
    ELSE '✅ RLS DESABILITADO - todas operações permitidas'
  END as status_rls
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'users';

-- ============================================
-- 6. TESTAR QUERY QUE A APLICAÇÃO FAZ
-- ============================================
SELECT 
  '=== SIMULAÇÃO DA QUERY DA APLICAÇÃO ===' as info;

-- Simular query exata que a aplicação faz (busca exata)
SELECT 
  'Query 1: Busca exata (admin/admin123)' as query_teste,
  id,
  username,
  role,
  CASE 
    WHEN password = 'admin123' THEN '✅ Senha correta'
    ELSE '❌ Senha incorreta'
  END as status_senha
FROM users
WHERE username = 'admin' 
  AND password = 'admin123';

-- Simular query com case-insensitive
SELECT 
  'Query 2: Case-insensitive (admin/admin123)' as query_teste,
  id,
  username,
  role,
  CASE 
    WHEN password = 'admin123' THEN '✅ Senha correta'
    ELSE '❌ Senha incorreta'
  END as status_senha
FROM users
WHERE LOWER(username) = LOWER('admin')
  AND password = 'admin123';

-- ============================================
-- 7. VERIFICAR PROBLEMAS COMUNS
-- ============================================
SELECT 
  '=== DIAGNÓSTICO DE PROBLEMAS ===' as info;

-- Problema 1: Usuários com username em maiúsculas
SELECT 
  'Problema 1: Usuários com maiúsculas' as problema,
  COUNT(*) as quantidade,
  CASE 
    WHEN COUNT(*) > 0 THEN '⚠️ Encontrado - pode causar problemas'
    ELSE '✅ Nenhum problema'
  END as status
FROM users
WHERE username != LOWER(username);

-- Problema 2: Senhas com espaços
SELECT 
  'Problema 2: Senhas com espaços' as problema,
  COUNT(*) as quantidade,
  CASE 
    WHEN COUNT(*) > 0 THEN '⚠️ Encontrado - pode causar problemas'
    ELSE '✅ Nenhum problema'
  END as status
FROM users
WHERE password != TRIM(password);

-- Problema 3: Usuários padrão não existem
SELECT 
  'Problema 3: Usuários padrão ausentes' as problema,
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin') 
      OR NOT EXISTS (SELECT 1 FROM users WHERE username = 'aluno')
    THEN '⚠️ Usuários padrão não encontrados'
    ELSE '✅ Usuários padrão existem'
  END as status;

-- ============================================
-- 8. CORREÇÕES AUTOMÁTICAS (OPCIONAL)
-- ============================================
-- Descomente as linhas abaixo para aplicar correções automáticas

-- Normalizar usernames para lowercase
-- UPDATE users SET username = LOWER(TRIM(username)) WHERE username != LOWER(TRIM(username));

-- Normalizar senhas (remover espaços)
-- UPDATE users SET password = TRIM(password) WHERE password != TRIM(password);

-- Criar usuários padrão se não existirem
-- INSERT INTO users (username, password, role) 
-- SELECT 'admin', 'admin123', 'admin'
-- WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin')
-- ON CONFLICT (username) DO UPDATE SET password = 'admin123', role = 'admin';

-- INSERT INTO users (username, password, role) 
-- SELECT 'aluno', 'aluno123', 'aluno'
-- WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'aluno')
-- ON CONFLICT (username) DO UPDATE SET password = 'aluno123', role = 'aluno';

-- ============================================
-- 9. RESUMO E RECOMENDAÇÕES
-- ============================================
SELECT 
  '=== RESUMO ===' as info;

SELECT 
  'Total de usuários' as metrica,
  COUNT(*)::text as valor
FROM users
UNION ALL
SELECT 
  'Usuários com RLS bloqueando',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'users' 
        AND cmd = 'SELECT' 
        AND (qual IS NULL OR qual = 'false')
    ) THEN '⚠️ Sim'
    ELSE '✅ Não'
  END
UNION ALL
SELECT 
  'RLS habilitado',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE tablename = 'users' 
        AND rowsecurity = true
    ) THEN '⚠️ Sim - verifique políticas'
    ELSE '✅ Não - sem restrições'
  END;

-- ============================================
-- FIM DO DIAGNÓSTICO
-- ============================================
-- 
-- INTERPRETAÇÃO DOS RESULTADOS:
-- 
-- 1. Se "Login funcionaria" = ❌:
--    - Execute supabase_fix_login.sql para criar usuários
--    - Verifique se as senhas estão corretas
-- 
-- 2. Se RLS está bloqueando:
--    - Execute supabase_fix_rls.sql para corrigir políticas
-- 
-- 3. Se usuários têm maiúsculas ou espaços:
--    - Descomente as correções automáticas na seção 8
--    - Ou execute manualmente as queries de UPDATE
-- 
-- 4. Se variáveis de ambiente não estão configuradas:
--    - Configure no Vercel: Settings → Environment Variables
--    - Veja VERCEL_DEPLOY.md para instruções
-- 
-- ============================================
