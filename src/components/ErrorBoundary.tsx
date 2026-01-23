import React, { Component, ErrorInfo, ReactNode } from 'react';
import { testSupabaseConnection } from '../utils/connectionTest';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('❌ Erro capturado pelo ErrorBoundary:', error);
    console.error('📋 Detalhes do erro:', errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const missingEnvVars = !supabaseUrl || !supabaseKey;
      
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          backgroundColor: '#f8f9fa',
        }}>
          <div style={{
            maxWidth: '600px',
            backgroundColor: 'white',
            padding: '40px',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}>
            <h1 style={{ color: '#dc3545', marginTop: 0 }}>
              ⚠️ Erro na Aplicação
            </h1>
            
            {missingEnvVars ? (
              <div>
                <h2 style={{ color: '#856404' }}>🔧 Variáveis de Ambiente Não Configuradas</h2>
                <p>As variáveis de ambiente do Supabase não estão configuradas no Vercel.</p>
                <div style={{
                  backgroundColor: '#fff3cd',
                  padding: '15px',
                  borderRadius: '4px',
                  marginTop: '20px',
                }}>
                  <h3 style={{ marginTop: 0 }}>Como corrigir:</h3>
                  <ol>
                    <li>Acesse o dashboard do Vercel</li>
                    <li>Vá em <strong>Settings → Environment Variables</strong></li>
                    <li>Adicione as seguintes variáveis:</li>
                    <ul>
                      <li><code>VITE_SUPABASE_URL</code> = sua URL do Supabase</li>
                      <li><code>VITE_SUPABASE_ANON_KEY</code> = sua chave anon do Supabase</li>
                    </ul>
                    <li>Faça um novo deploy após adicionar as variáveis</li>
                  </ol>
                </div>
                <div style={{
                  backgroundColor: '#f8d7da',
                  padding: '15px',
                  borderRadius: '4px',
                  marginTop: '20px',
                }}>
                  <strong>⚠️ Importante:</strong> Use a <strong>ANON KEY</strong> (chave pública), 
                  nunca a SERVICE_ROLE KEY no frontend!
                </div>
              </div>
            ) : (
              <div>
                <h2 style={{ color: '#856404' }}>Erro inesperado</h2>
                <p>Ocorreu um erro inesperado na aplicação.</p>
                {import.meta.env.DEV && this.state.error && (
                  <details style={{
                    marginTop: '20px',
                    padding: '15px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                  }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                      Detalhes do erro (modo desenvolvimento)
                    </summary>
                    <pre style={{
                      overflow: 'auto',
                      marginTop: '10px',
                      fontSize: '12px',
                    }}>
                      {this.state.error.toString()}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}
            
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '20px',
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
