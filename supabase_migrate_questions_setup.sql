-- ============================================
-- SCRIPT DE PREPARAÇÃO PARA MIGRAÇÃO DE QUESTÕES
-- ============================================
-- Execute este script no SQL Editor do Supabase ANTES de executar a migração
-- https://supabase.com/dashboard/project/_/sql
--
-- Este script garante que a tabela questions esteja criada e configurada
-- corretamente para receber as questões do mockData.ts
-- ============================================

-- ============================================
-- 1. CRIAR TABELA questions (se não existir)
-- ============================================
CREATE TABLE IF NOT EXISTS questions (
  id VARCHAR(50) PRIMARY KEY,
  subject_id VARCHAR(50) NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- Array de strings: ["opção1", "opção2", ...]
  correct_answer INTEGER NOT NULL CHECK (correct_answer >= 0),
  fun_fact TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. CRIAR FOREIGN KEY (se não existir)
-- ============================================
-- Verificar se a foreign key já existe antes de criar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'questions_subject_id_fkey'
  ) THEN
    ALTER TABLE questions
    ADD CONSTRAINT questions_subject_id_fkey
    FOREIGN KEY (subject_id) 
    REFERENCES subjects(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================
-- 3. CRIAR ÍNDICES (se não existirem)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_questions_subject_id ON questions(subject_id);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at);

-- ============================================
-- 4. CRIAR FUNÇÃO DE TRIGGER (se não existir)
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. CRIAR TRIGGER PARA updated_at (se não existir)
-- ============================================
DROP TRIGGER IF EXISTS update_questions_updated_at ON questions;
CREATE TRIGGER update_questions_updated_at 
  BEFORE UPDATE ON questions
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. CONFIGURAR RLS (Row Level Security)
-- ============================================
-- Habilitar RLS na tabela
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- NOTA: Como o sistema usa autenticação manual (não Supabase Auth),
-- as políticas são mais permissivas. Em produção, considere implementar
-- autenticação adequada ou usar service_role key para operações administrativas.

-- Remover políticas antigas que possam estar usando auth.uid() (não funciona com autenticação manual)
DROP POLICY IF EXISTS "Questions are viewable by authenticated users" ON questions;
DROP POLICY IF EXISTS "Only admins can insert questions" ON questions;
DROP POLICY IF EXISTS "Only admins can update questions" ON questions;
DROP POLICY IF EXISTS "Only admins can delete questions" ON questions;

-- Política: Permitir leitura para todos (todos podem ver questões)
DROP POLICY IF EXISTS "Everyone can view questions" ON questions;
CREATE POLICY "Everyone can view questions"
  ON questions
  FOR SELECT
  USING (true);

-- Política: Permitir inserção para todos (a aplicação valida permissões)
-- Em produção, considere usar service_role key ou implementar validação no backend
DROP POLICY IF EXISTS "Everyone can insert questions" ON questions;
CREATE POLICY "Everyone can insert questions"
  ON questions
  FOR INSERT
  WITH CHECK (true);

-- Política: Permitir atualização para todos (a aplicação valida permissões)
DROP POLICY IF EXISTS "Everyone can update questions" ON questions;
CREATE POLICY "Everyone can update questions"
  ON questions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Política: Permitir deleção para todos (a aplicação valida permissões)
DROP POLICY IF EXISTS "Everyone can delete questions" ON questions;
CREATE POLICY "Everyone can delete questions"
  ON questions
  FOR DELETE
  USING (true);

-- ============================================
-- 7. VERIFICAR SE AS MATÉRIAS EXISTEM
-- ============================================
-- Este script verifica se as matérias do mockData.ts existem
-- Se não existirem, você precisará criá-las primeiro

DO $$
DECLARE
  missing_subjects TEXT[];
BEGIN
  SELECT ARRAY_AGG(subject_id)
  INTO missing_subjects
  FROM (
    SELECT DISTINCT subject_id
    FROM (VALUES 
      ('1'), ('2'), ('3'), ('4'), ('5'), ('6'), ('7'), ('8')
    ) AS t(subject_id)
  ) AS all_subjects
  WHERE NOT EXISTS (
    SELECT 1 FROM subjects WHERE id = all_subjects.subject_id
  );

  IF missing_subjects IS NOT NULL AND array_length(missing_subjects, 1) > 0 THEN
    RAISE NOTICE '⚠️ ATENÇÃO: As seguintes matérias não existem no banco: %', array_to_string(missing_subjects, ', ');
    RAISE NOTICE 'Execute o script de migração de matérias primeiro ou crie-as manualmente.';
  ELSE
    RAISE NOTICE '✅ Todas as matérias necessárias existem no banco.';
  END IF;
END $$;

-- ============================================
-- 8. VERIFICAR ESTRUTURA DA TABELA
-- ============================================
-- Este comando mostra a estrutura atual da tabela
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'questions'
ORDER BY ordinal_position;

-- ============================================
-- FIM DO SCRIPT
-- ============================================
-- Após executar este script, você pode:
-- 1. Executar a migração através da interface web em /migrate-questions
-- 2. Ou executar o script migrateQuestions.ts diretamente
-- ============================================
