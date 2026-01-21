/**
 * Script de Migração de Questões
 * 
 * Este script migra todas as questões do arquivo mockData.ts para a tabela questions do Supabase
 * 
 * Como usar:
 * 1. Certifique-se de que as matérias já existem no banco (execute migrateSubjects.ts primeiro)
 * 2. Execute este script no console do navegador ou crie um componente temporário para executá-lo
 * 
 * Exemplo de uso no console do navegador:
 * import { migrateQuestions } from './scripts/migrateQuestions';
 * migrateQuestions();
 */

import { questions } from '../data/mockData';
import { supabase } from '../lib/supabase';

export async function migrateQuestions(): Promise<{
  success: boolean;
  inserted: number;
  skipped: number;
  errors: string[];
}> {
  console.log('🚀 Iniciando migração de questões...');
  console.log(`📊 Total de questões a migrar: ${questions.length}`);

  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  // Verificar quais questões já existem
  const { data: existingQuestions } = await supabase
    .from('questions')
    .select('id');

  const existingIds = new Set((existingQuestions || []).map((q: any) => q.id));

  // Processar questões em lotes para evitar sobrecarga
  const batchSize = 50;
  for (let i = 0; i < questions.length; i += batchSize) {
    const batch = questions.slice(i, i + batchSize);
    
    console.log(`📦 Processando lote ${Math.floor(i / batchSize) + 1} de ${Math.ceil(questions.length / batchSize)}...`);

    const insertData = batch
      .filter((q) => !existingIds.has(q.id)) // Pular questões que já existem
      .map((q) => ({
        id: q.id,
        subject_id: q.subjectId,
        question: q.question,
        options: q.options, // Será convertido para JSON automaticamente pelo Supabase
        correct_answer: q.correctAnswer,
        fun_fact: q.funFact || null,
      }));

    if (insertData.length === 0) {
      console.log(`⏭️  Lote ${Math.floor(i / batchSize) + 1}: Todas as questões já existem, pulando...`);
      skipped += batch.length;
      continue;
    }

    try {
      const { data, error } = await supabase
        .from('questions')
        .insert(insertData as never)
        .select('id');

      if (error) {
        console.error(`❌ Erro no lote ${Math.floor(i / batchSize) + 1}:`, error);
        errors.push(`Lote ${Math.floor(i / batchSize) + 1}: ${error.message}`);
        skipped += insertData.length;
      } else {
        inserted += data?.length || 0;
        skipped += batch.length - (data?.length || 0);
        console.log(`✅ Lote ${Math.floor(i / batchSize) + 1}: ${data?.length || 0} questões inseridas`);
      }
    } catch (err: any) {
      console.error(`❌ Erro ao inserir lote ${Math.floor(i / batchSize) + 1}:`, err);
      errors.push(`Lote ${Math.floor(i / batchSize) + 1}: ${err.message || 'Erro desconhecido'}`);
      skipped += insertData.length;
    }
  }

  console.log('\n📊 Resumo da migração:');
  console.log(`✅ Inseridas: ${inserted}`);
  console.log(`⏭️  Puladas (já existiam): ${skipped}`);
  console.log(`❌ Erros: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\n⚠️  Erros encontrados:');
    errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  }

  return {
    success: errors.length === 0,
    inserted,
    skipped,
    errors,
  };
}

// Função auxiliar para executar a migração (pode ser chamada do console do navegador)
export async function runMigration() {
  const result = await migrateQuestions();
  
  if (result.success) {
    alert(`✅ Migração concluída!\n\nInseridas: ${result.inserted}\nPuladas: ${result.skipped}`);
  } else {
    alert(`⚠️ Migração concluída com erros!\n\nInseridas: ${result.inserted}\nPuladas: ${result.skipped}\nErros: ${result.errors.length}`);
  }
  
  return result;
}
