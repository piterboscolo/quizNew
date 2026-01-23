import { supabase } from '../lib/supabase';
import { QuizStatistics, UserRanking, UserQuizStats } from '../types';

/**
 * Busca todas as estatísticas de quiz
 */
export async function getAllQuizStatistics(): Promise<{
  success: boolean;
  statistics?: QuizStatistics[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('quiz_statistics')
      .select('*')
      .order('last_attempt_date', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar estatísticas:', error);
      return { success: false, error: error.message };
    }

    const statistics: QuizStatistics[] = (data || []).map((s: any) => ({
      subjectId: s.subject_id,
      totalAttempts: s.total_attempts || 0,
      correctAnswers: s.correct_answers || 0,
      wrongAnswers: s.wrong_answers || 0,
      lastAttemptDate: s.last_attempt_date || undefined,
    }));

    return { success: true, statistics };
  } catch (err: any) {
    console.error('❌ Erro ao buscar estatísticas:', err);
    return { success: false, error: err.message || 'Erro desconhecido' };
  }
}

/**
 * Busca todas as estatísticas de usuários
 */
export async function getAllUserQuizStats(): Promise<{
  success: boolean;
  stats?: UserQuizStats[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('user_quiz_stats')
      .select('*')
      .order('total_quizzes', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar estatísticas de usuários:', error);
      return { success: false, error: error.message };
    }

    const stats: UserQuizStats[] = (data || []).map((s: any) => ({
      userId: s.user_id,
      username: s.username,
      totalQuizzes: s.total_quizzes || 0,
      totalFirstAttemptCorrect: s.total_first_attempt_correct || 0,
      totalQuestions: s.total_questions || 0,
      lastQuizDate: s.last_quiz_date || undefined,
    }));

    return { success: true, stats };
  } catch (err: any) {
    console.error('❌ Erro ao buscar estatísticas de usuários:', err);
    return { success: false, error: err.message || 'Erro desconhecido' };
  }
}

/**
 * Busca sessões ativas (últimas 24 horas)
 */
export async function getActiveSessions(): Promise<{
  success: boolean;
  sessions?: Array<{ userId: string; username: string; loginTime: string }>;
  error?: string;
}> {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('user_sessions')
      .select('user_id, username, login_time')
      .eq('is_active', true)
      .gte('login_time', oneDayAgo)
      .order('login_time', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar sessões ativas:', error);
      return { success: false, error: error.message };
    }

    // Remover duplicatas (manter apenas a mais recente por usuário)
    const uniqueSessions = new Map<string, { userId: string; username: string; loginTime: string }>();
    (data || []).forEach((s: any) => {
      const existing = uniqueSessions.get(s.user_id);
      if (!existing || new Date(s.login_time) > new Date(existing.loginTime)) {
        uniqueSessions.set(s.user_id, {
          userId: s.user_id,
          username: s.username,
          loginTime: s.login_time,
        });
      }
    });

    return { success: true, sessions: Array.from(uniqueSessions.values()) };
  } catch (err: any) {
    console.error('❌ Erro ao buscar sessões ativas:', err);
    return { success: false, error: err.message || 'Erro desconhecido' };
  }
}

/**
 * Busca todos os usuários com suas últimas sessões e perfis
 */
export async function getAllUsersWithDetails(): Promise<{
  success: boolean;
  users?: Array<{
    id: string;
    username: string;
    role: string;
    avatar: string | null;
    lastLogin: string | null;
    isActive: boolean;
    email?: string | null;
    telefone?: string | null;
  }>;
  error?: string;
}> {
  try {
    // Buscar usuários - tentar incluir email e telefone se existirem
    // Se os campos não existirem, o Supabase pode retornar erro, então vamos tratar
    let selectFields = 'id, username, role, avatar';
    let { data: users, error: usersError } = await supabase
      .from('users')
      .select(selectFields);

    // Se der erro e for relacionado a campos não encontrados, tentar sem email/telefone
    if (usersError && (usersError.message.includes('email') || usersError.message.includes('telefone') || usersError.message.includes('column'))) {
      console.log('⚠️ Campos email/telefone não encontrados, buscando sem eles...');
      const retry = await supabase
        .from('users')
        .select('id, username, role, avatar');
      users = retry.data;
      usersError = retry.error;
    }

    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError);
      return { success: false, error: usersError.message };
    }

    // Buscar perfis dos usuários para obter uploaded_image
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, uploaded_image, avatar');

    // Não tratar erro de perfis como fatal, pode não existir perfis para todos
    if (profilesError && profilesError.code !== 'PGRST116') {
      console.warn('⚠️ Erro ao buscar perfis (continuando sem eles):', profilesError);
    }

    // Criar mapa de perfis (priorizar uploaded_image sobre avatar)
    const profilesMap = new Map<string, string | null>();
    (profiles || []).forEach((p: any) => {
      // Priorizar uploaded_image (foto carregada pelo usuário), depois avatar do perfil
      // uploaded_image tem prioridade porque é a foto escolhida pelo usuário
      const imageValue = p.uploaded_image || p.avatar || null;
      if (imageValue) {
        profilesMap.set(p.user_id, imageValue);
        console.log(`📸 Perfil encontrado para usuário ${p.user_id}:`, {
          hasUploadedImage: !!p.uploaded_image,
          hasAvatar: !!p.avatar,
          finalValue: imageValue.substring(0, 50) + '...'
        });
      }
    });

    // Buscar últimas sessões
    const { data: sessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select('user_id, login_time, is_active')
      .order('login_time', { ascending: false });

    if (sessionsError) {
      console.error('❌ Erro ao buscar sessões:', sessionsError);
      return { success: false, error: sessionsError.message };
    }

    // Criar mapa de últimas sessões
    const lastLoginMap = new Map<string, { loginTime: string; isActive: boolean }>();
    (sessions || []).forEach((s: any) => {
      const existing = lastLoginMap.get(s.user_id);
      if (!existing || new Date(s.login_time) > new Date(existing.loginTime)) {
        lastLoginMap.set(s.user_id, {
          loginTime: s.login_time,
          isActive: s.is_active || false,
        });
      }
    });

    // Combinar dados - priorizar uploaded_image do perfil sobre avatar da tabela users
    const usersWithDetails = (users || []).map((u: any) => {
      const session = lastLoginMap.get(u.id);
      // Priorizar uploaded_image do perfil, depois avatar da tabela users
      const finalAvatar = profilesMap.get(u.id) || u.avatar || null;
      
      return {
        id: u.id,
        username: u.username,
        role: u.role,
        avatar: finalAvatar,
        lastLogin: session?.loginTime || null,
        isActive: session?.isActive || false,
        email: u.email || null,
        telefone: u.telefone || null,
      };
    });

    return { success: true, users: usersWithDetails };
  } catch (err: any) {
    console.error('❌ Erro ao buscar usuários:', err);
    return { success: false, error: err.message || 'Erro desconhecido' };
  }
}

/**
 * Calcula ranking de usuários
 */
export async function getUserRankings(): Promise<{
  success: boolean;
  rankings?: UserRanking[];
  error?: string;
}> {
  try {
    // Buscar estatísticas de usuários
    const statsResult = await getAllUserQuizStats();
    if (!statsResult.success || !statsResult.stats) {
      return { success: false, error: statsResult.error };
    }

    // Buscar usuários para obter avatares
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, avatar');

    if (usersError) {
      console.error('❌ Erro ao buscar usuários para ranking:', usersError);
      return { success: false, error: usersError.message };
    }

    // Buscar perfis dos usuários para obter uploaded_image
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, uploaded_image, avatar');

    // Não tratar erro de perfis como fatal
    if (profilesError && profilesError.code !== 'PGRST116') {
      console.warn('⚠️ Erro ao buscar perfis para ranking (continuando sem eles):', profilesError);
    }

    // Criar mapa de perfis (priorizar uploaded_image)
    const profilesMap = new Map<string, string | null>();
    (profiles || []).forEach((p: any) => {
      const imageValue = p.uploaded_image || p.avatar || null;
      if (imageValue) {
        profilesMap.set(p.user_id, imageValue);
      }
    });

    // Criar mapa de avatares (priorizar uploaded_image do perfil sobre avatar da tabela users)
    const userMap = new Map<string, string | null>();
    (users || []).forEach((u: any) => {
      // Priorizar uploaded_image do perfil, depois avatar da tabela users
      const finalAvatar = profilesMap.get(u.id) || u.avatar || null;
      userMap.set(u.id, finalAvatar);
    });

    // Calcular ranking
    const rankings: UserRanking[] = statsResult.stats
      .map((stat) => {
        const accuracy = stat.totalQuestions > 0
          ? Math.round((stat.totalFirstAttemptCorrect / stat.totalQuestions) * 100)
          : 0;

        return {
          position: 0, // Será calculado após ordenação
          userId: stat.userId,
          username: stat.username,
          totalQuizzes: stat.totalQuizzes,
          totalFirstAttemptCorrect: stat.totalFirstAttemptCorrect,
          accuracy: accuracy,
          avatar: userMap.get(stat.userId) || undefined,
        };
      })
      .sort((a, b) => {
        // Ordenar por: 1) Total de quizzes, 2) Acertos de primeira, 3) Precisão
        if (b.totalQuizzes !== a.totalQuizzes) {
          return b.totalQuizzes - a.totalQuizzes;
        }
        if (b.totalFirstAttemptCorrect !== a.totalFirstAttemptCorrect) {
          return b.totalFirstAttemptCorrect - a.totalFirstAttemptCorrect;
        }
        return b.accuracy - a.accuracy;
      })
      .map((ranking, index) => ({
        ...ranking,
        position: index + 1,
      }));

    return { success: true, rankings };
  } catch (err: any) {
    console.error('❌ Erro ao calcular ranking:', err);
    return { success: false, error: err.message || 'Erro desconhecido' };
  }
}

/**
 * CRUD de Usuários
 */
export async function createUser(userData: {
  username: string;
  password: string;
  role: 'aluno' | 'admin';
  avatar?: string;
  email?: string;
  telefone?: string;
}): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    // Construir objeto de inserção apenas com campos que existem
    const insertData: any = {
      username: userData.username,
      password: userData.password,
      role: userData.role,
      avatar: userData.avatar || null,
    };
    
    // Adicionar email e telefone apenas se fornecidos (e se as colunas existirem)
    // O Supabase ignorará campos que não existem na tabela
    if (userData.email !== undefined) {
      insertData.email = userData.email || null;
    }
    if (userData.telefone !== undefined) {
      insertData.telefone = userData.telefone || null;
    }

    const { data, error } = await supabase
      .from('users')
      .insert(insertData as never)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar usuário:', error);
      return { success: false, error: error.message };
    }

    return { success: true, user: data };
  } catch (err: any) {
    console.error('❌ Erro ao criar usuário:', err);
    return { success: false, error: err.message || 'Erro desconhecido' };
  }
}

export async function updateUser(
  userId: string,
  userData: {
    username?: string;
    password?: string;
    role?: 'aluno' | 'admin';
    avatar?: string;
    email?: string;
    telefone?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: any = {};
    if (userData.username !== undefined) updateData.username = userData.username;
    if (userData.password !== undefined) updateData.password = userData.password;
    if (userData.role !== undefined) updateData.role = userData.role;
    if (userData.avatar !== undefined) updateData.avatar = userData.avatar;
    
    // Adicionar email e telefone apenas se fornecidos
    // Se as colunas não existirem, o Supabase retornará um erro que será tratado
    if (userData.email !== undefined) {
      updateData.email = userData.email || null;
    }
    if (userData.telefone !== undefined) {
      updateData.telefone = userData.telefone || null;
    }

    // Se não houver nada para atualizar, retornar sucesso
    if (Object.keys(updateData).length === 0) {
      return { success: true };
    }

    const { error } = await supabase
      .from('users')
      .update(updateData as never)
      .eq('id', userId);

    if (error) {
      console.error('❌ Erro ao atualizar usuário:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('❌ Erro ao atualizar usuário:', err);
    return { success: false, error: err.message || 'Erro desconhecido' };
  }
}

export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('❌ Erro ao deletar usuário:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('❌ Erro ao deletar usuário:', err);
    return { success: false, error: err.message || 'Erro desconhecido' };
  }
}

/**
 * CRUD de Matérias
 */
export async function createSubject(subjectData: {
  id: string;
  name: string;
  description?: string;
}): Promise<{ success: boolean; subject?: any; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('subjects')
      .insert({
        id: subjectData.id,
        name: subjectData.name,
        description: subjectData.description || null,
      } as never)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar matéria:', error);
      return { success: false, error: error.message };
    }

    return { success: true, subject: data };
  } catch (err: any) {
    console.error('❌ Erro ao criar matéria:', err);
    return { success: false, error: err.message || 'Erro desconhecido' };
  }
}

export async function updateSubject(
  subjectId: string,
  subjectData: {
    name?: string;
    description?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: any = {};
    if (subjectData.name !== undefined) updateData.name = subjectData.name;
    if (subjectData.description !== undefined) updateData.description = subjectData.description;

    const { error } = await supabase
      .from('subjects')
      .update(updateData as never)
      .eq('id', subjectId);

    if (error) {
      console.error('❌ Erro ao atualizar matéria:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('❌ Erro ao atualizar matéria:', err);
    return { success: false, error: err.message || 'Erro desconhecido' };
  }
}

export async function deleteSubject(subjectId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', subjectId);

    if (error) {
      console.error('❌ Erro ao deletar matéria:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('❌ Erro ao deletar matéria:', err);
    return { success: false, error: err.message || 'Erro desconhecido' };
  }
}

/**
 * CRUD de Questões
 */
export async function createQuestion(questionData: {
  id: string;
  subjectId: string;
  question: string;
  options: string[];
  correctAnswer: number;
  funFact?: string;
}): Promise<{ success: boolean; question?: any; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('questions')
      .insert({
        id: questionData.id,
        subject_id: questionData.subjectId,
        question: questionData.question,
        options: questionData.options,
        correct_answer: questionData.correctAnswer,
        fun_fact: questionData.funFact || null,
      } as never)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar questão:', error);
      return { success: false, error: error.message };
    }

    return { success: true, question: data };
  } catch (err: any) {
    console.error('❌ Erro ao criar questão:', err);
    return { success: false, error: err.message || 'Erro desconhecido' };
  }
}

export async function updateQuestion(
  questionId: string,
  questionData: {
    subjectId?: string;
    question?: string;
    options?: string[];
    correctAnswer?: number;
    funFact?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: any = {};
    if (questionData.subjectId !== undefined) updateData.subject_id = questionData.subjectId;
    if (questionData.question !== undefined) updateData.question = questionData.question;
    if (questionData.options !== undefined) updateData.options = questionData.options;
    if (questionData.correctAnswer !== undefined) updateData.correct_answer = questionData.correctAnswer;
    if (questionData.funFact !== undefined) updateData.fun_fact = questionData.funFact || null;

    const { error } = await supabase
      .from('questions')
      .update(updateData as never)
      .eq('id', questionId);

    if (error) {
      console.error('❌ Erro ao atualizar questão:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('❌ Erro ao atualizar questão:', err);
    return { success: false, error: err.message || 'Erro desconhecido' };
  }
}

export async function deleteQuestion(questionId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', questionId);

    if (error) {
      console.error('❌ Erro ao deletar questão:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('❌ Erro ao deletar questão:', err);
    return { success: false, error: err.message || 'Erro desconhecido' };
  }
}
