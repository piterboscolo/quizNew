-- ============================================
-- ADICIONAR CAMPOS EMAIL E TELEFONE À TABELA USERS
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- https://supabase.com/dashboard/project/_/sql

-- Adicionar coluna email
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Adicionar coluna telefone
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS telefone VARCHAR(20);

-- Criar índices para busca rápida
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_telefone ON users(telefone);

-- Comentários nas colunas
COMMENT ON COLUMN users.email IS 'Email do usuário';
COMMENT ON COLUMN users.telefone IS 'Telefone do usuário';
