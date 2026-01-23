import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Variáveis de ambiente do Supabase não configuradas!');
  console.error('Verifique se VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão configuradas');
  console.error('No Vercel: Settings → Environment Variables');
  console.error('Localmente: arquivo .env na raiz do projeto');
  
  // Em produção, não quebrar a aplicação, apenas logar o erro
  if (import.meta.env.PROD) {
    console.error('❌ Aplicação não pode funcionar sem as variáveis de ambiente!');
  }
}

// Verificar se está usando a chave errada (service_role)
if (supabaseAnonKey.startsWith('sb_secret_') || supabaseAnonKey.includes('service_role')) {
  console.error('❌ ERRO CRÍTICO: Você está usando a SERVICE_ROLE KEY (chave secreta)!');
  console.error('❌ Esta chave NÃO pode ser usada no navegador!');
  console.error('✅ Solução: Use a ANON KEY (chave pública) no arquivo .env');
  console.error('📖 Veja o arquivo CORRIGIR_CHAVE_SUPABASE.md para instruções');
  console.error('🔗 Acesse: Settings → API no Supabase e copie a chave "anon" (não a "service_role")');
}

// Criar cliente Supabase mesmo com variáveis vazias para evitar erros
// O ErrorBoundary vai capturar e mostrar mensagem apropriada
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: false, // Não usar sessão do Supabase Auth, vamos gerenciar manualmente
    },
    // Configurações adicionais para melhor diagnóstico
    global: {
      headers: {
        'x-client-info': 'crb-quiz@1.0.0',
      },
    },
  }
);

// Função auxiliar para verificar conexão
export async function checkSupabaseConnection(): Promise<{
  connected: boolean;
  error?: string;
}> {
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      connected: false,
      error: 'Variáveis de ambiente não configuradas',
    };
  }
  
  try {
    const { error } = await supabase
      .from('users')
      .select('count')
      .limit(0);
    
    if (error) {
      return {
        connected: false,
        error: error.message,
      };
    }
    
    return { connected: true };
  } catch (err: any) {
    return {
      connected: false,
      error: err.message || 'Erro desconhecido',
    };
  }
}
