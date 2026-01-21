import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { migrateQuestions } from '../scripts/migrateQuestions';
import './MigrateQuestions.css';

export function MigrateQuestions() {
  const navigate = useNavigate();
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    inserted: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  const handleMigrate = async () => {
    if (!window.confirm('Deseja migrar todas as questões do mockData.ts para o banco de dados?\n\nIsso pode demorar alguns minutos.')) {
      return;
    }

    setMigrating(true);
    setResult(null);

    try {
      const migrationResult = await migrateQuestions();
      setResult(migrationResult);
    } catch (err: any) {
      setResult({
        success: false,
        inserted: 0,
        skipped: 0,
        errors: [err.message || 'Erro desconhecido'],
      });
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="migrate-questions-container">
      <div className="migrate-questions-card">
        <h2>🔄 Migração de Questões</h2>
        <p className="migrate-description">
          Este processo irá migrar todas as questões do arquivo <code>mockData.ts</code> para a tabela <code>questions</code> do Supabase.
        </p>
        <p className="migrate-warning">
          ⚠️ <strong>Atenção:</strong> Questões que já existem no banco serão puladas (não serão duplicadas).
        </p>

        <div className="migrate-buttons">
          <button
            className="migrate-button migrate-button-back"
            onClick={() => navigate('/dashboard')}
            disabled={migrating}
          >
            ← Voltar ao Dashboard
          </button>
          <button
            className="migrate-button"
            onClick={handleMigrate}
            disabled={migrating}
          >
            {migrating ? '🔄 Migrando...' : '🚀 Iniciar Migração'}
          </button>
        </div>

        {result && (
          <div className={`migrate-result ${result.success ? 'success' : 'warning'}`}>
            <h3>{result.success ? '✅ Migração Concluída!' : '⚠️ Migração Concluída com Erros'}</h3>
            <div className="migrate-stats">
              <div className="stat-item">
                <span className="stat-label">Inseridas:</span>
                <span className="stat-value success">{result.inserted}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Puladas:</span>
                <span className="stat-value info">{result.skipped}</span>
              </div>
              {result.errors.length > 0 && (
                <div className="stat-item">
                  <span className="stat-label">Erros:</span>
                  <span className="stat-value error">{result.errors.length}</span>
                </div>
              )}
            </div>

            {result.errors.length > 0 && (
              <div className="migrate-errors">
                <h4>Detalhes dos Erros:</h4>
                <ul>
                  {result.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
