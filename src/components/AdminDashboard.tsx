import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../context/QuizContext';
import { useAuth } from '../context/AuthContext';
import { QuizStatistics, UserRanking, Subject } from '../types';
import { 
  getAllQuizStatistics, 
  getAllUsersWithDetails, 
  getUserRankings,
  getActiveSessions,
  createUser,
  updateUser,
  deleteUser,
  createSubject,
  updateSubject,
  deleteSubject
} from '../services/adminService';
import './AdminDashboard.css';

const PRESET_AVATARS = [
  { id: 'avatar1', emoji: '👤', color: '#2563eb' },
  { id: 'avatar2', emoji: '🎓', color: '#10b981' },
  { id: 'avatar3', emoji: '🧑', color: '#f59e0b' },
  { id: 'avatar4', emoji: '👨‍🎓', color: '#8b5cf6' },
  { id: 'avatar5', emoji: '👩‍🎓', color: '#ec4899' },
  { id: 'avatar6', emoji: '🧑', color: '#06b6d4' },
  { id: 'avatar7', emoji: '👨‍🏫', color: '#ef4444' },
  { id: 'avatar8', emoji: '👩‍🏫', color: '#14b8a6' },
];

type TabType = 'statistics' | 'users' | 'subjects';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { subjects, questions, addSubject } = useQuiz();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('statistics');
  
  // Estatísticas
  const [statistics, setStatistics] = useState<QuizStatistics[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [userRankings, setUserRankings] = useState<UserRanking[]>([]);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [inactiveUsers, setInactiveUsers] = useState<any[]>([]);
  const [activeSessions, setActiveSessions] = useState<Map<string, string>>(new Map()); // userId -> loginTime
  const [usersWithAvatars, setUsersWithAvatars] = useState<Map<string, { type: 'image' | 'emoji'; value: string; color?: string }>>(new Map());
  
  // Modais do dashboard
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showRankingModal, setShowRankingModal] = useState(false);
  const [showSubjectsStatsModal, setShowSubjectsStatsModal] = useState(false);
  
  // Gerenciamento de Usuários
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [userForm, setUserForm] = useState({ 
    username: '', 
    password: '', 
    role: 'aluno' as 'aluno' | 'admin', 
    avatar: '',
    email: '',
    telefone: ''
  });
  
  // Gerenciamento de Matérias
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectForm, setSubjectForm] = useState({ id: '', name: '', description: '' });
  

  // Função auxiliar para obter avatar
  const getUserAvatar = (userId: string, avatar: string | null | undefined) => {
    if (avatar) {
      // Se for uma imagem (data:image, http/https, blob:), retornar como imagem
      if (avatar.startsWith('data:image') || 
          avatar.startsWith('http://') || 
          avatar.startsWith('https://') || 
          avatar.startsWith('blob:')) {
        return { type: 'image' as const, value: avatar };
      }
      // Se for um ID de avatar preset, buscar o emoji
      const avatarData = PRESET_AVATARS.find((a) => a.id === avatar);
      if (avatarData) {
        return { type: 'emoji' as const, value: avatarData.emoji, color: avatarData.color };
      }
      // Se for uma string longa que parece base64 (sem prefixo), tratar como imagem
      if (avatar.length > 50 && /^[A-Za-z0-9+/=]+$/.test(avatar)) {
        // Pode ser base64 sem prefixo, adicionar prefixo genérico
        return { type: 'image' as const, value: `data:image/png;base64,${avatar}` };
      }
      // Se for uma string curta (provavelmente emoji), tratar como emoji
      if (avatar.length <= 4) {
        return { type: 'emoji' as const, value: avatar, color: '#2563eb' };
      }
      // Para strings médias, verificar se começa com caracteres que indicam imagem
      // Se não começar com letra/número comum de emoji, pode ser base64 truncado
      // Por segurança, tratar como possível imagem se for muito longo
      if (avatar.length > 20) {
        // Pode ser base64, tentar como imagem
        return { type: 'image' as const, value: avatar.startsWith('data:') ? avatar : `data:image/png;base64,${avatar}` };
      }
      // Caso padrão: tratar como emoji
      return { type: 'emoji' as const, value: avatar, color: '#2563eb' };
    }
    return { type: 'emoji' as const, value: '👤', color: '#2563eb' };
  };

  const getSubjectName = (subjectId: string) => {
    return subjects.find((s) => s.id === subjectId)?.name || 'Desconhecida';
  };

  // Carregar dados quando a aba mudar
  useEffect(() => {
    const loadData = async () => {
      if (activeTab === 'statistics') {
        await loadStatistics();
      } else if (activeTab === 'users') {
        await loadUsers();
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentUser]);

  // Carregar estatísticas do Supabase
  const loadStatistics = async () => {
    try {
      console.log('📥 Carregando estatísticas do Supabase...');

      // Carregar estatísticas de quiz
      const statsResult = await getAllQuizStatistics();
      if (statsResult.success && statsResult.statistics) {
        setStatistics(statsResult.statistics);
      }


      // Carregar ranking
      const rankingsResult = await getUserRankings();
      if (rankingsResult.success && rankingsResult.rankings) {
        setUserRankings(rankingsResult.rankings);
      }

      // Carregar sessões ativas (últimas 2 horas)
      const sessionsResult = await getActiveSessions();
      if (sessionsResult.success && sessionsResult.sessions) {
        const sessionsMap = new Map<string, string>();
        sessionsResult.sessions.forEach((s) => {
          // Manter apenas a sessão mais recente de cada usuário
          const existing = sessionsMap.get(s.userId);
          if (!existing || new Date(s.loginTime) > new Date(existing)) {
            sessionsMap.set(s.userId, s.loginTime);
          }
        });
        setActiveSessions(sessionsMap);
      }

      // Carregar todos os usuários
      const usersResult = await getAllUsersWithDetails();
      if (usersResult.success && usersResult.users) {
        // Separar usuários em ativos e inativos (últimos 7 dias)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        const active = usersResult.users
          .filter((u) => {
            if (!u.lastLogin) return false;
            return new Date(u.lastLogin) > sevenDaysAgo;
          })
          .sort((a, b) => a.username.localeCompare(b.username));
        
        const inactive = usersResult.users
          .filter((u) => {
            if (!u.lastLogin) return true;
            return new Date(u.lastLogin) <= sevenDaysAgo;
          })
          .sort((a, b) => a.username.localeCompare(b.username));
        
        setActiveUsers(active);
        setInactiveUsers(inactive);
        
        // Criar mapa de avatares
        const avatarMap = new Map<string, { type: 'image' | 'emoji'; value: string; color?: string }>();
        usersResult.users.forEach((u) => {
          const avatarData = getUserAvatar(u.id, u.avatar);
          avatarMap.set(u.id, avatarData);
          // Debug: log para verificar avatares
          if (avatarData.type === 'image') {
            console.log(`📸 Avatar de imagem encontrado para ${u.username}:`, u.avatar?.substring(0, 50) + '...');
          }
        });
        setUsersWithAvatars(avatarMap);
      }
    } catch (err) {
      console.error('❌ Erro ao carregar estatísticas:', err);
    }
  };

  // Carregar usuários
  const loadUsers = async () => {
    try {
      const usersResult = await getAllUsersWithDetails();
      if (usersResult.success && usersResult.users) {
        // Ordenar usuários alfabeticamente
        const sortedUsers = [...usersResult.users].sort((a, b) => 
          a.username.localeCompare(b.username)
        );
        setAllUsers(sortedUsers);
        // Criar mapa de avatares
        const avatarMap = new Map<string, { type: 'image' | 'emoji'; value: string; color?: string }>();
        sortedUsers.forEach((u) => {
          const avatarData = getUserAvatar(u.id, u.avatar);
          avatarMap.set(u.id, avatarData);
          // Debug: log para verificar avatares
          if (avatarData.type === 'image') {
            console.log(`📸 Avatar de imagem encontrado para ${u.username}:`, u.avatar?.substring(0, 50) + '...');
          }
        });
        setUsersWithAvatars(avatarMap);
      }
    } catch (err) {
      console.error('❌ Erro ao carregar usuários:', err);
    }
  };

  // Funções de gerenciamento de usuários
  const handleCreateUser = async () => {
    if (!userForm.username || !userForm.password) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }
    const result = await createUser(userForm);
    if (result.success) {
      alert('Usuário criado com sucesso!');
      setShowUserModal(false);
      setUserForm({ username: '', password: '', role: 'aluno', avatar: '', email: '', telefone: '' });
      loadUsers();
    } else {
      alert(`Erro: ${result.error}`);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    const result = await updateUser(editingUser.id, userForm);
    if (result.success) {
      alert('Usuário atualizado com sucesso!');
      setShowUserModal(false);
      setEditingUser(null);
      setUserForm({ username: '', password: '', role: 'aluno', avatar: '', email: '', telefone: '' });
      loadUsers();
    } else {
      alert(`Erro: ${result.error}`);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!window.confirm(`Tem certeza que deseja deletar o usuário "${username}"?`)) return;
    const result = await deleteUser(userId);
    if (result.success) {
      alert('Usuário deletado com sucesso!');
      loadUsers();
    } else {
      alert(`Erro: ${result.error}`);
    }
  };

  // Funções de gerenciamento de matérias
  const handleCreateSubject = async () => {
    if (!subjectForm.id || !subjectForm.name) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }
    const result = await createSubject(subjectForm);
    if (result.success) {
      addSubject({ id: subjectForm.id, name: subjectForm.name, description: subjectForm.description });
      alert('Matéria criada com sucesso!');
      setShowSubjectModal(false);
      setSubjectForm({ id: '', name: '', description: '' });
    } else {
      alert(`Erro: ${result.error}`);
    }
  };

  const handleUpdateSubject = async () => {
    if (!editingSubject) return;
    const result = await updateSubject(editingSubject.id, subjectForm);
    if (result.success) {
      alert('Matéria atualizada com sucesso!');
      setShowSubjectModal(false);
      setEditingSubject(null);
      setSubjectForm({ id: '', name: '', description: '' });
      window.location.reload(); // Recarregar para atualizar o contexto
    } else {
      alert(`Erro: ${result.error}`);
    }
  };

  const handleDeleteSubject = async (subjectId: string, subjectName: string) => {
    if (!window.confirm(`Tem certeza que deseja deletar a matéria "${subjectName}"? Todas as questões relacionadas serão deletadas.`)) return;
    const result = await deleteSubject(subjectId);
    if (result.success) {
      alert('Matéria deletada com sucesso!');
      window.location.reload(); // Recarregar para atualizar o contexto
    } else {
      alert(`Erro: ${result.error}`);
    }
  };


  // Calcular matéria mais realizada
  const getMostPopularSubject = () => {
    if (statistics.length === 0) return null;
    const sorted = [...statistics].sort((a, b) => b.totalAttempts - a.totalAttempts);
    return sorted[0];
  };

  const mostPopular = getMostPopularSubject();

  // Funções auxiliares para modais
  const isUserOnline = (user: any) => {
    if (currentUser && user.id === currentUser.id) return true;
    const sessionLoginTime = activeSessions.get(user.id);
    if (!sessionLoginTime) return false;
    const loginDate = new Date(sessionLoginTime);
    const diffMs = Date.now() - loginDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins < 2;
  };

  const formatLastLogin = (loginTime: string | null) => {
    if (!loginTime) return 'Nunca';
    const date = new Date(loginTime);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 2) return 'Online agora';
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays} dias atrás`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Renderizar conteúdo da aba de Estatísticas
  const renderStatisticsTab = () => {
    const allSystemUsers = [...activeUsers, ...inactiveUsers];
    const onlineUsers = allSystemUsers
      .filter(user => isUserOnline(user))
      .sort((a, b) => a.username.localeCompare(b.username));
    const offlineUsers = allSystemUsers
      .filter(user => !isUserOnline(user))
      .sort((a, b) => a.username.localeCompare(b.username));

    return (
      <div className="admin-section">
        <h2>Dashboard</h2>
        
        <div className="dashboard-cards-grid">
          {/* Card Matéria Mais Realizada */}
          <div className="dashboard-card stat-card-success">
            <div className="stat-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 11.08V12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2C16.84 2 20.87 5.38 21.8 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="stat-content">
              <h3>Matéria Mais Realizada</h3>
              <p className="stat-value">
                {mostPopular ? getSubjectName(mostPopular.subjectId) : 'N/A'}
              </p>
              <p className="stat-label">
                {mostPopular ? `${mostPopular.totalAttempts} tentativas` : 'Sem dados'}
              </p>
            </div>
          </div>

          {/* Card Usuários do Sistema */}
          <div 
            className="dashboard-card dashboard-card-clickable"
            onClick={() => setShowUsersModal(true)}
          >
            <div className="dashboard-card-icon dashboard-card-users">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15C10.9391 15 9.92172 15.4214 9.17157 16.1716C8.42143 16.9217 8 17.9391 8 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="dashboard-card-content">
              <h3>👥 Usuários do Sistema</h3>
              <p className="dashboard-card-value">{allSystemUsers.length}</p>
              <p className="dashboard-card-description">
                {onlineUsers.length} online • {offlineUsers.length} offline
              </p>
              <div className="dashboard-card-arrow">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Card Ranking de Usuários */}
          <div 
            className="dashboard-card dashboard-card-clickable"
            onClick={() => setShowRankingModal(true)}
          >
            <div className="dashboard-card-icon dashboard-card-ranking">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="dashboard-card-content">
              <h3>🏆 Ranking de Usuários</h3>
              <p className="dashboard-card-value">{userRankings.length}</p>
              <p className="dashboard-card-description">
                Top {Math.min(3, userRankings.length)} melhores desempenhos
              </p>
              <div className="dashboard-card-arrow">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Card Estatísticas por Matéria */}
          <div 
            className="dashboard-card dashboard-card-clickable"
            onClick={() => setShowSubjectsStatsModal(true)}
          >
            <div className="dashboard-card-icon dashboard-card-stats">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3V21H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 16L12 11L16 15L21 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 10H15V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="dashboard-card-content">
              <h3>📊 Estatísticas por Matéria</h3>
              <p className="dashboard-card-value">{subjects.length}</p>
              <p className="dashboard-card-description">
                {subjects.length} matéria{subjects.length !== 1 ? 's' : ''} cadastrada{subjects.length !== 1 ? 's' : ''}
              </p>
              <div className="dashboard-card-arrow">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Usuários do Sistema */}
        {showUsersModal && (
          <div className="admin-modal-overlay" onClick={() => setShowUsersModal(false)}>
            <div className="admin-modal-content admin-modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h2>👥 Usuários do Sistema</h2>
                <button className="admin-modal-close" onClick={() => setShowUsersModal(false)}>×</button>
              </div>
              <div className="admin-modal-body">
                {(() => {
                  const renderUserCard = (user: any) => {
                    const avatar = usersWithAvatars.get(user.id) || getUserAvatar(user.id, user.avatar);
                    const online = isUserOnline(user);
                    
                    return (
                      <div 
                        key={user.id} 
                        className={`user-system-card ${online ? 'user-online' : 'user-offline'}`}
                      >
                        <div className="user-system-status-indicator">
                          {online ? (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="12" cy="12" r="10" fill="#10b981" stroke="white" strokeWidth="2"/>
                            </svg>
                          ) : (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="12" cy="12" r="10" fill="#94a3b8" stroke="white" strokeWidth="2"/>
                            </svg>
                          )}
                        </div>
                        <div className="user-system-avatar" style={avatar.type === 'emoji' ? { backgroundColor: avatar.color } : {}}>
                          {avatar.type === 'image' ? (
                            <img src={avatar.value} alt={user.username} />
                          ) : (
                            <span>{avatar.value}</span>
                          )}
                        </div>
                        <div className="user-system-info">
                          <div className="user-system-name">{user.username}</div>
                          <div className="user-system-role">{user.role === 'admin' ? '👨‍💼 Admin' : '🎓 Aluno'}</div>
                          <div className="user-system-date">{formatLastLogin(user.lastLogin)}</div>
                        </div>
                      </div>
                    );
                  };
                  
                  return allSystemUsers.length === 0 ? (
                    <p className="users-empty" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                      Nenhum usuário encontrado
                    </p>
                  ) : (
                    <div className="users-system-two-columns">
                      <div className="users-column users-online-column">
                        <div className="users-column-header">
                          <h4>🟢 Online ({onlineUsers.length})</h4>
                        </div>
                        <div className="users-column-list">
                          {onlineUsers.length === 0 ? (
                            <p className="users-empty">Nenhum usuário online</p>
                          ) : (
                            onlineUsers.map(renderUserCard)
                          )}
                        </div>
                      </div>
                      
                      <div className="users-column users-offline-column">
                        <div className="users-column-header">
                          <h4>⚪ Offline ({offlineUsers.length})</h4>
                        </div>
                        <div className="users-column-list">
                          {offlineUsers.length === 0 ? (
                            <p className="users-empty">Nenhum usuário offline</p>
                          ) : (
                            offlineUsers.map(renderUserCard)
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Modal Ranking de Usuários */}
        {showRankingModal && (
          <div className="admin-modal-overlay" onClick={() => setShowRankingModal(false)}>
            <div className="admin-modal-content admin-modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h2>🏆 Ranking de Usuários</h2>
                <button className="admin-modal-close" onClick={() => setShowRankingModal(false)}>×</button>
              </div>
              <div className="admin-modal-body">
                {userRankings.length === 0 ? (
                  <div className="ranking-empty">
                    <p>Nenhum usuário completou quizzes ainda.</p>
                  </div>
                ) : (
                  <div className="ranking-list">
                    {userRankings.map((ranking) => {
                      const avatar = usersWithAvatars.get(ranking.userId) || getUserAvatar(ranking.userId, ranking.avatar);
                      const getMedal = (position: number) => {
                        if (position === 1) return '🥇';
                        if (position === 2) return '🥈';
                        if (position === 3) return '🥉';
                        return `#${position}`;
                      };
                      
                      return (
                        <div 
                          key={ranking.userId} 
                          className={`ranking-item ${ranking.position <= 3 ? 'ranking-top' : ''}`}
                        >
                          <div className="ranking-position">
                            <span className="ranking-medal">{getMedal(ranking.position)}</span>
                          </div>
                          <div className="ranking-avatar" style={avatar.type === 'emoji' ? { backgroundColor: avatar.color } : {}}>
                            {avatar.type === 'image' ? (
                              <img src={avatar.value} alt={ranking.username} />
                            ) : (
                              <span>{avatar.value}</span>
                            )}
                          </div>
                          <div className="ranking-info">
                            <div className="ranking-name">{ranking.username}</div>
                            <div className="ranking-stats">
                              <span className="ranking-stat">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M21 12V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                {ranking.totalQuizzes} quiz{ranking.totalQuizzes !== 1 ? 'zes' : ''}
                              </span>
                              <span className="ranking-stat">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M22 11.08V12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2C16.84 2 20.87 5.38 21.8 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                {ranking.totalFirstAttemptCorrect} acertos de primeira
                              </span>
                              <span className="ranking-stat">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                {ranking.accuracy}% precisão
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Estatísticas por Matéria */}
        {showSubjectsStatsModal && (
          <div className="admin-modal-overlay" onClick={() => setShowSubjectsStatsModal(false)}>
            <div className="admin-modal-content admin-modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h2>📊 Estatísticas por Matéria</h2>
                <button className="admin-modal-close" onClick={() => setShowSubjectsStatsModal(false)}>×</button>
              </div>
              <div className="admin-modal-body">
                <div className="bar-chart-container">
                  {(() => {
                    // Criar dados do gráfico com estatísticas
                    const chartData = subjects.map((subject) => {
                      const subjectStats = statistics.find((s) => s.subjectId === subject.id);
                      const correctAnswers = subjectStats?.correctAnswers || 0;
                      const wrongAnswers = subjectStats?.wrongAnswers || 0;
                      const totalAnswers = correctAnswers + wrongAnswers;
                      return {
                        subject,
                        correctAnswers,
                        wrongAnswers,
                        totalAnswers,
                      };
                    });

                    // Ordenar por total de respostas (mais feita primeiro, menos feita por último)
                    const sortedChartData = [...chartData].sort((a, b) => {
                      // Primeiro ordenar por total de respostas (decrescente)
                      if (b.totalAnswers !== a.totalAnswers) {
                        return b.totalAnswers - a.totalAnswers;
                      }
                      // Se empatar, ordenar por nome da matéria (alfabético)
                      return a.subject.name.localeCompare(b.subject.name);
                    });

                    const maxAnswers = Math.max(...sortedChartData.map(d => d.totalAnswers), 1);

                    return (
                      <div className="bar-chart">
                        {sortedChartData.map(({ subject, correctAnswers, wrongAnswers, totalAnswers }) => {
                          const correctPercentage = maxAnswers > 0 ? (correctAnswers / maxAnswers) * 100 : 0;
                          const wrongPercentage = maxAnswers > 0 ? (wrongAnswers / maxAnswers) * 100 : 0;
                          const totalPercentage = correctPercentage + wrongPercentage;
                          
                          return (
                            <div 
                              key={subject.id}
                              className="bar-chart-item"
                              onClick={() => {
                                setShowSubjectsStatsModal(false);
                                setSelectedSubjectId(subject.id);
                              }}
                              title={`${subject.name}: ${correctAnswers} acertos, ${wrongAnswers} erros`}
                            >
                              <div className="bar-chart-label">
                                <span className="bar-chart-name">{subject.name}</span>
                                <div className="bar-chart-values">
                                  <span className="bar-chart-value bar-chart-correct">
                                    ✓ {correctAnswers}
                                  </span>
                                  <span className="bar-chart-value bar-chart-wrong">
                                    ✗ {wrongAnswers}
                                  </span>
                                </div>
                              </div>
                              <div className="bar-chart-bar-container">
                                {totalAnswers > 0 ? (
                                  <div className="bar-chart-bar-stacked" style={{ width: `${totalPercentage}%` }}>
                                    {correctAnswers > 0 && (
                                      <div 
                                        className="bar-chart-bar-segment bar-chart-correct-segment"
                                        style={{ width: `${(correctAnswers / totalAnswers) * 100}%` }}
                                        title={`${correctAnswers} acertos`}
                                      >
                                        {correctAnswers > 0 && (correctAnswers / totalAnswers) > 0.15 && (
                                          <span className="bar-chart-segment-label">{correctAnswers}</span>
                                        )}
                                      </div>
                                    )}
                                    {wrongAnswers > 0 && (
                                      <div 
                                        className="bar-chart-bar-segment bar-chart-wrong-segment"
                                        style={{ width: `${(wrongAnswers / totalAnswers) * 100}%` }}
                                        title={`${wrongAnswers} erros`}
                                      >
                                        {wrongAnswers > 0 && (wrongAnswers / totalAnswers) > 0.15 && (
                                          <span className="bar-chart-segment-label">{wrongAnswers}</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="bar-chart-bar-empty">
                                    <span className="bar-chart-empty-label">Sem dados</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Renderizar conteúdo da aba de Usuários
  const renderUsersTab = () => {
    const formatLastLogin = (loginTime: string | null) => {
      if (!loginTime) return 'Nunca';
      const date = new Date(loginTime);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 60) return `${diffMins} min atrás`;
      if (diffHours < 24) return `${diffHours}h atrás`;
      if (diffDays < 7) return `${diffDays} dias atrás`;
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    // Separar usuários online e offline
    const sortedUsers = [...allUsers].sort((a, b) => {
      const aOnline = isUserOnline(a);
      const bOnline = isUserOnline(b);
      if (aOnline !== bOnline) return aOnline ? -1 : 1;
      return a.username.localeCompare(b.username);
    });

    return (
      <div className="admin-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2>Gerenciamento de Usuários</h2>
            <p style={{ margin: '8px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
              Total: {allUsers.length} usuário{allUsers.length !== 1 ? 's' : ''} • 
              Online: {allUsers.filter(u => isUserOnline(u)).length} • 
              Offline: {allUsers.filter(u => !isUserOnline(u)).length}
            </p>
          </div>
          <button 
            className="admin-button admin-button-primary"
          onClick={() => {
            setEditingUser(null);
            setUserForm({ username: '', password: '', role: 'aluno', avatar: '', email: '', telefone: '' });
            setShowUserModal(true);
          }}
          >
            + Novo Usuário
          </button>
        </div>
        
        {allUsers.length === 0 ? (
          <div className="users-empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15C10.9391 15 9.92172 15.4214 9.17157 16.1716C8.42143 16.9217 8 17.9391 8 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p>Nenhum usuário encontrado</p>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '8px' }}>
              Clique em "Novo Usuário" para adicionar o primeiro usuário ao sistema
            </p>
          </div>
        ) : (
          <div className="users-management-grid">
            {sortedUsers.map((user) => {
              const avatar = usersWithAvatars.get(user.id) || getUserAvatar(user.id, user.avatar);
              const isOnline = isUserOnline(user);
              
              return (
                <div 
                  key={user.id} 
                  className={`user-management-card ${isOnline ? 'user-online' : 'user-offline'}`}
                >
                  <div className="user-management-status-indicator">
                    {isOnline ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" fill="#10b981" stroke="white" strokeWidth="2"/>
                      </svg>
                    ) : (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" fill="#94a3b8" stroke="white" strokeWidth="2"/>
                      </svg>
                    )}
                  </div>
                  
                  <div className="user-management-avatar" style={avatar.type === 'emoji' ? { backgroundColor: avatar.color } : {}}>
                    {avatar.type === 'image' ? (
                      <img src={avatar.value} alt={user.username} />
                    ) : (
                      <span>{avatar.value}</span>
                    )}
                  </div>
                  
                  <div className="user-management-info">
                    <h3 className="user-management-name">{user.username}</h3>
                    <div className="user-management-role">
                      <span className={`role-badge ${user.role}`}>
                        {user.role === 'admin' ? '👨‍💼 Admin' : '🎓 Aluno'}
                      </span>
                    </div>
                    <div className="user-management-lastlogin">
                      {formatLastLogin(user.lastLogin)}
                    </div>
                    {user.email && (
                      <div className="user-management-contact">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="user-management-contact-text">{user.email}</span>
                      </div>
                    )}
                    {user.telefone && (
                      <div className="user-management-contact">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M3 5C3 3.89543 3.89543 3 5 3H8.27924C8.70967 3 9.09181 3.27543 9.22792 3.68377L10.7257 8.17721C10.8831 8.64932 10.6694 9.16531 10.2243 9.38787L7.96701 10.5165C9.06925 12.9612 11.0388 14.9308 13.4835 16.033L14.6121 13.7757C14.8347 13.3306 15.3507 13.1169 15.8228 13.2743L20.3162 14.7721C20.7246 14.9082 21 15.2903 21 15.7208V19C21 20.1046 20.1046 21 19 21H18C9.71573 21 3 14.2843 3 6V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="user-management-contact-text">{user.telefone}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="user-management-actions">
                    <button
                      className="admin-button admin-button-small admin-button-secondary"
                      onClick={() => {
                        setEditingUser(user);
                        setUserForm({ 
                          username: user.username, 
                          password: '', 
                          role: user.role as 'aluno' | 'admin', 
                          avatar: user.avatar || '',
                          email: user.email || '',
                          telefone: user.telefone || ''
                        });
                        setShowUserModal(true);
                      }}
                      title="Editar usuário"
                    >
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M18.5 2.5C18.8978 2.10218 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10218 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10218 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <button
                      className="admin-button admin-button-small admin-button-danger"
                      onClick={() => handleDeleteUser(user.id, user.username)}
                      title="Deletar usuário"
                    >
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Renderizar conteúdo da aba de Matérias
  const renderSubjectsTab = () => (
    <div className="admin-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2>Gerenciamento de Matérias</h2>
        <button 
          className="admin-button admin-button-primary"
          onClick={() => {
            setEditingSubject(null);
            setSubjectForm({ id: '', name: '', description: '' });
            setShowSubjectModal(true);
          }}
        >
          + Nova Matéria
        </button>
      </div>
      
      <div className="admin-grid">
        {subjects.map((subject) => (
          <div key={subject.id} className="admin-card">
            <div className="admin-card-header">
              <h3>{subject.name}</h3>
              <div className="admin-card-actions">
                <button
                  className="admin-button admin-button-small admin-button-secondary"
                  onClick={() => {
                    setEditingSubject(subject);
                    setSubjectForm({ 
                      id: subject.id, 
                      name: subject.name, 
                      description: subject.description || '' 
                    });
                    setShowSubjectModal(true);
                  }}
                >
                  Editar
                </button>
                <button
                  className="admin-button admin-button-small admin-button-danger"
                  onClick={() => handleDeleteSubject(subject.id, subject.name)}
                >
                  Deletar
                </button>
              </div>
            </div>
            <p className="admin-card-description">{subject.description || 'Sem descrição'}</p>
            <div className="admin-card-footer">
              <span className="admin-card-badge">
                {questions.filter(q => q.subjectId === subject.id).length} questões
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );


  return (
    <div className="admin-dashboard">
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'statistics' ? 'active' : ''}`}
          onClick={() => setActiveTab('statistics')}
        >
          📊 Estatísticas
        </button>
        <button
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Usuários
        </button>
        <button
          className={`admin-tab ${activeTab === 'subjects' ? 'active' : ''}`}
          onClick={() => setActiveTab('subjects')}
        >
          📚 Matérias
        </button>
        <button
          className="admin-tab"
          onClick={() => navigate('/migrate-questions')}
        >
          🔄 Migrar Questões
        </button>
      </div>

      {activeTab === 'statistics' && renderStatisticsTab()}
      {activeTab === 'users' && renderUsersTab()}
      {activeTab === 'subjects' && renderSubjectsTab()}

      {/* Modal de Estatísticas Detalhadas de Matéria */}
      {selectedSubjectId && (() => {
        const subject = subjects.find((s) => s.id === selectedSubjectId);
        const subjectStats = statistics.find((s) => s.subjectId === selectedSubjectId);
        
        if (!subjectStats) {
          return (
            <div className="stat-modal-overlay" onClick={() => setSelectedSubjectId(null)}>
              <div className="stat-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="stat-modal-header">
                  <h2>{subject?.name || 'Estatísticas'}</h2>
                  <button className="stat-modal-close" onClick={() => setSelectedSubjectId(null)}>×</button>
                </div>
                <div className="stat-modal-body">
                  <div className="stat-modal-empty">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <p>Nenhuma estatística disponível para esta matéria ainda.</p>
                    <p className="stat-modal-empty-hint">As estatísticas aparecerão quando os alunos começarem a fazer os quizzes desta matéria.</p>
                  </div>
                </div>
              </div>
            </div>
          );
        }
        
        // Após o early return, TypeScript sabe que subjectStats não é undefined
        // Usar non-null assertion para garantir ao TypeScript
        const stats: QuizStatistics = subjectStats!;
        const totalAnswers = stats.correctAnswers + stats.wrongAnswers;
        const correctPercentage = totalAnswers > 0
          ? Math.round((stats.correctAnswers / totalAnswers) * 100)
          : 0;
        const wrongPercentage = totalAnswers > 0
          ? Math.round((stats.wrongAnswers / totalAnswers) * 100)
          : 0;

        return (
          <div className="stat-modal-overlay" onClick={() => setSelectedSubjectId(null)}>
            <div className="stat-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="stat-modal-header">
                <div className="stat-modal-title-section">
                  <div className="stat-modal-icon-header">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <h2>{subject?.name || 'Estatísticas'}</h2>
                    <p className="stat-modal-subtitle">{subject?.description || ''}</p>
                  </div>
                </div>
                <button 
                  className="stat-modal-close"
                  onClick={() => setSelectedSubjectId(null)}
                  aria-label="Fechar"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              <div className="stat-modal-body">
                <div className="stat-modal-grid">
                  <div className="stat-modal-card">
                    <div className="stat-modal-icon stat-modal-primary">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="stat-modal-card-content">
                      <h3>Total de Tentativas</h3>
                      <p className="stat-modal-value">{stats.totalAttempts}</p>
                      <p className="stat-modal-description">Vezes que o quiz foi realizado</p>
                    </div>
                  </div>

                  <div className="stat-modal-card">
                    <div className="stat-modal-icon stat-modal-success">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22 11.08V12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12C2 6.48 6.48 2 12 2C16.84 2 20.87 5.38 21.8 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="stat-modal-card-content">
                      <h3>Acertos</h3>
                      <p className="stat-modal-value stat-modal-success-text">{stats.correctAnswers}</p>
                      <p className="stat-modal-description">
                        {totalAnswers > 0 ? `${correctPercentage}% das respostas` : 'Nenhuma resposta ainda'}
                      </p>
                    </div>
                  </div>

                  <div className="stat-modal-card">
                    <div className="stat-modal-icon stat-modal-error">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                        <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div className="stat-modal-card-content">
                      <h3>Erros</h3>
                      <p className="stat-modal-value stat-modal-error-text">{stats.wrongAnswers}</p>
                      <p className="stat-modal-description">
                        {totalAnswers > 0 ? `${wrongPercentage}% das respostas` : 'Nenhuma resposta ainda'}
                      </p>
                    </div>
                  </div>
                </div>

                {totalAnswers > 0 && (
                  <div className="stat-modal-progress">
                    <h3>Distribuição de Respostas</h3>
                    <div className="stat-progress-bar-large">
                      <div 
                        className="stat-progress-correct-large" 
                        style={{ width: `${correctPercentage}%` }}
                      >
                        {correctPercentage > 10 && (
                          <span className="stat-progress-label">{correctPercentage}%</span>
                        )}
                      </div>
                      <div 
                        className="stat-progress-wrong-large" 
                        style={{ width: `${wrongPercentage}%` }}
                      >
                        {wrongPercentage > 10 && (
                          <span className="stat-progress-label">{wrongPercentage}%</span>
                        )}
                      </div>
                    </div>
                    <div className="stat-progress-legend">
                      <div className="stat-legend-item">
                        <div className="stat-legend-color stat-legend-correct"></div>
                        <span>Acertos ({stats.correctAnswers})</span>
                      </div>
                      <div className="stat-legend-item">
                        <div className="stat-legend-color stat-legend-wrong"></div>
                        <span>Erros ({stats.wrongAnswers})</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal de Usuário */}
      {showUserModal && (
        <div className="admin-modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h2>
              <button className="admin-modal-close" onClick={() => setShowUserModal(false)}>×</button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-form-group">
                <label>Usuário *</label>
                <input
                  type="text"
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  placeholder="Nome de usuário"
                />
              </div>
              <div className="admin-form-group">
                <label>Senha {editingUser ? '(deixe em branco para não alterar)' : '*'} </label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder="Senha"
                />
              </div>
              <div className="admin-form-group">
                <label>Role *</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value as 'aluno' | 'admin' })}
                >
                  <option value="aluno">Aluno</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="admin-form-group">
                <label>Avatar (ID ou emoji)</label>
                <input
                  type="text"
                  value={userForm.avatar}
                  onChange={(e) => setUserForm({ ...userForm, avatar: e.target.value })}
                  placeholder="Ex: avatar1 ou 👤"
                />
              </div>
              <div className="admin-form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="usuario@exemplo.com"
                />
              </div>
              <div className="admin-form-group">
                <label>Telefone</label>
                <input
                  type="tel"
                  value={userForm.telefone}
                  onChange={(e) => setUserForm({ ...userForm, telefone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-button admin-button-secondary" onClick={() => setShowUserModal(false)}>
                Cancelar
              </button>
              <button 
                className="admin-button admin-button-primary" 
                onClick={editingUser ? handleUpdateUser : handleCreateUser}
              >
                {editingUser ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Matéria */}
      {showSubjectModal && (
        <div className="admin-modal-overlay" onClick={() => setShowSubjectModal(false)}>
          <div className="admin-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{editingSubject ? 'Editar Matéria' : 'Nova Matéria'}</h2>
              <button className="admin-modal-close" onClick={() => setShowSubjectModal(false)}>×</button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-form-group">
                <label>ID *</label>
                <input
                  type="text"
                  value={subjectForm.id}
                  onChange={(e) => setSubjectForm({ ...subjectForm, id: e.target.value })}
                  placeholder="Ex: matematica"
                  disabled={!!editingSubject}
                />
              </div>
              <div className="admin-form-group">
                <label>Nome *</label>
                <input
                  type="text"
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  placeholder="Nome da matéria"
                />
              </div>
              <div className="admin-form-group">
                <label>Descrição</label>
                <textarea
                  value={subjectForm.description}
                  onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                  placeholder="Descrição da matéria"
                  rows={3}
                />
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-button admin-button-secondary" onClick={() => setShowSubjectModal(false)}>
                Cancelar
              </button>
              <button 
                className="admin-button admin-button-primary" 
                onClick={editingSubject ? handleUpdateSubject : handleCreateSubject}
              >
                {editingSubject ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}