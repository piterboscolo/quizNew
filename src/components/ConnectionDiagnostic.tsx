import { useState, useEffect } from 'react';
import { testSupabaseConnection, ConnectionTestResult } from '../utils/connectionTest';
import './ConnectionDiagnostic.css';

export function ConnectionDiagnostic() {
  const [results, setResults] = useState<ConnectionTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [autoCheck, setAutoCheck] = useState(true);

  useEffect(() => {
    if (autoCheck) {
      runDiagnostic();
    }
  }, [autoCheck]);

  const runDiagnostic = async () => {
    setIsRunning(true);
    const testResults = await testSupabaseConnection();
    setResults(testResults);
    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      default:
        return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return '#10b981';
      case 'error':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const hasErrors = results.some(r => r.status === 'error');
  const hasWarnings = results.some(r => r.status === 'warning');

  if (results.length === 0 && !isRunning) {
    return null;
  }

  return (
    <div className="connection-diagnostic">
      <div className="diagnostic-header">
        <h3>🔍 Diagnóstico de Conexão com Banco de Dados</h3>
        <button
          onClick={runDiagnostic}
          disabled={isRunning}
          className="diagnostic-button"
        >
          {isRunning ? '🔄 Testando...' : '🔄 Testar Novamente'}
        </button>
      </div>

      {isRunning && (
        <div className="diagnostic-loading">
          <p>Executando testes de conexão...</p>
        </div>
      )}

      {results.length > 0 && (
        <>
          {hasErrors && (
            <div className="diagnostic-alert error">
              <strong>❌ Problemas Encontrados</strong>
              <p>Há erros que impedem a conexão com o banco de dados. Veja os detalhes abaixo.</p>
            </div>
          )}

          {!hasErrors && hasWarnings && (
            <div className="diagnostic-alert warning">
              <strong>⚠️ Avisos</strong>
              <p>Alguns avisos foram encontrados, mas a conexão pode funcionar.</p>
            </div>
          )}

          {!hasErrors && !hasWarnings && (
            <div className="diagnostic-alert success">
              <strong>✅ Conexão OK</strong>
              <p>Todos os testes passaram! A conexão com o banco está funcionando.</p>
            </div>
          )}

          <div className="diagnostic-results">
            {results.map((result, index) => (
              <div
                key={index}
                className="diagnostic-result"
                style={{ borderLeftColor: getStatusColor(result.status) }}
              >
                <div className="result-header">
                  <span className="result-icon">{getStatusIcon(result.status)}</span>
                  <span className="result-test">{result.test}</span>
                  <span
                    className="result-status"
                    style={{ color: getStatusColor(result.status) }}
                  >
                    {result.status === 'success' ? 'OK' : result.status === 'error' ? 'ERRO' : 'AVISO'}
                  </span>
                </div>
                <div className="result-message">{result.message}</div>
                {result.details && (
                  <details className="result-details">
                    <summary>Detalhes</summary>
                    <pre>{JSON.stringify(result.details, null, 2)}</pre>
                  </details>
                )}
              </div>
            ))}
          </div>

          {hasErrors && (
            <div className="diagnostic-solutions">
              <h4>💡 Soluções Recomendadas:</h4>
              <ul>
                {results
                  .filter(r => r.status === 'error' && r.details?.solucao)
                  .map((result, index) => (
                    <li key={index}>
                      <strong>{result.test}:</strong> {result.details?.solucao}
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
