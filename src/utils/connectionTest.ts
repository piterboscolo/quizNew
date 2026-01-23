import { supabase } from '../lib/supabase';

export interface ConnectionTestResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

/**
 * Testa a conexão com o Supabase e retorna diagnóstico detalhado
 */
export async function testSupabaseConnection(): Promise<ConnectionTestResult[]> {
  const results: ConnectionTestResult[] = [];
  
  // Teste 1: Verificar variáveis de ambiente
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    results.push({
      test: 'Variáveis de Ambiente',
      status: 'error',
      message: 'Variáveis de ambiente não configuradas',
      details: {
        VITE_SUPABASE_URL: supabaseUrl ? '✅ Configurada' : '❌ Não configurada',
        VITE_SUPABASE_ANON_KEY: supabaseKey ? '✅ Configurada' : '❌ Não configurada',
        ambiente: import.meta.env.MODE,
        producao: import.meta.env.PROD,
      }
    });
    return results; // Não pode continuar sem variáveis
  }
  
  results.push({
    test: 'Variáveis de Ambiente',
    status: 'success',
    message: 'Variáveis de ambiente configuradas',
    details: {
      url: supabaseUrl.substring(0, 30) + '...',
      keyLength: supabaseKey.length,
      ambiente: import.meta.env.MODE,
    }
  });
  
  // Teste 2: Verificar formato da URL
  try {
    new URL(supabaseUrl);
    results.push({
      test: 'Formato da URL',
      status: 'success',
      message: 'URL do Supabase válida',
    });
  } catch (error) {
    results.push({
      test: 'Formato da URL',
      status: 'error',
      message: 'URL do Supabase inválida',
      details: { error: String(error) }
    });
    return results;
  }
  
  // Teste 3: Verificar se é ANON KEY (não service_role)
  if (supabaseKey.startsWith('sb_secret_') || supabaseKey.includes('service_role')) {
    results.push({
      test: 'Tipo de Chave',
      status: 'error',
      message: 'ERRO CRÍTICO: Usando SERVICE_ROLE KEY (não pode ser usada no frontend!)',
      details: {
        solucao: 'Use a ANON KEY (chave pública) no Vercel',
        onde: 'Supabase Dashboard → Settings → API → anon public key'
      }
    });
    return results;
  }
  
  results.push({
    test: 'Tipo de Chave',
    status: 'success',
    message: 'Usando ANON KEY (correto para frontend)',
  });
  
  // Teste 4: Testar conexão básica (health check)
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(0);
    
    if (error) {
      // Analisar o tipo de erro
      if (error.code === 'PGRST301' || error.message?.includes('JWT')) {
        results.push({
          test: 'Autenticação',
          status: 'error',
          message: 'Erro de autenticação JWT',
          details: {
            code: error.code,
            message: error.message,
            solucao: 'Verifique se a ANON KEY está correta no Vercel'
          }
        });
      } else if (error.code === '42501' || error.message?.includes('permission')) {
        results.push({
          test: 'Permissões (RLS)',
          status: 'error',
          message: 'Política RLS bloqueando acesso',
          details: {
            code: error.code,
            message: error.message,
            solucao: 'Execute supabase_fix_rls.sql no Supabase SQL Editor'
          }
        });
      } else if (error.message?.includes('CORS') || error.message?.includes('network')) {
        results.push({
          test: 'Conexão de Rede',
          status: 'error',
          message: 'Erro de CORS ou rede',
          details: {
            code: error.code,
            message: error.message,
            solucao: 'Verifique as configurações de CORS no Supabase Dashboard'
          }
        });
      } else {
        results.push({
          test: 'Conexão com Banco',
          status: 'error',
          message: 'Erro ao conectar com o banco de dados',
          details: {
            code: error.code,
            message: error.message,
            hint: error.hint,
            details: error.details
          }
        });
      }
    } else {
      results.push({
        test: 'Conexão com Banco',
        status: 'success',
        message: 'Conexão com Supabase estabelecida com sucesso',
      });
    }
  } catch (networkError: any) {
    // Erro de rede (CORS, timeout, etc)
    if (networkError.message?.includes('fetch') || networkError.message?.includes('network')) {
      results.push({
        test: 'Conexão de Rede',
        status: 'error',
        message: 'Erro de rede ao conectar com Supabase',
        details: {
          error: networkError.message,
          solucao: [
            '1. Verifique se a URL do Supabase está correta',
            '2. Verifique configurações de CORS no Supabase',
            '3. Verifique se não há firewall bloqueando',
            '4. Tente acessar a URL do Supabase diretamente no navegador'
          ]
        }
      });
    } else {
      results.push({
        test: 'Conexão',
        status: 'error',
        message: 'Erro inesperado ao testar conexão',
        details: { error: String(networkError) }
      });
    }
  }
  
  // Teste 5: Verificar se as tabelas existem
  try {
    const { error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (usersError && usersError.code === '42P01') {
      results.push({
        test: 'Tabelas do Banco',
        status: 'error',
        message: 'Tabela "users" não existe',
        details: {
          solucao: 'Execute supabase_schema.sql no Supabase SQL Editor'
        }
      });
    } else if (usersError) {
      results.push({
        test: 'Tabelas do Banco',
        status: 'warning',
        message: 'Erro ao acessar tabela users',
        details: { error: usersError.message }
      });
    } else {
      results.push({
        test: 'Tabelas do Banco',
        status: 'success',
        message: 'Tabelas do banco acessíveis',
      });
    }
  } catch (err) {
    results.push({
      test: 'Tabelas do Banco',
      status: 'warning',
      message: 'Não foi possível verificar tabelas',
      details: { error: String(err) }
    });
  }
  
  return results;
}

/**
 * Testa conexão e retorna resumo simples
 */
export async function quickConnectionTest(): Promise<{
  connected: boolean;
  error?: string;
  details?: string;
}> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return {
        connected: false,
        error: 'Variáveis de ambiente não configuradas',
        details: 'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no Vercel'
      };
    }
    
    const { error } = await supabase
      .from('users')
      .select('count')
      .limit(0);
    
    if (error) {
      return {
        connected: false,
        error: error.message,
        details: `Código: ${error.code || 'N/A'}`
      };
    }
    
    return { connected: true };
  } catch (err: any) {
    return {
      connected: false,
      error: 'Erro de rede',
      details: err.message || String(err)
    };
  }
}
