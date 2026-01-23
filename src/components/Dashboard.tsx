import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AlunoDashboard } from './AlunoDashboard';
import AdminDashboard from './AdminDashboard';
import { Profile } from './Profile';
import './Dashboard.css';

const PRESET_AVATARS = [
  { id: 'avatar1', emoji: '👤', color: '#2563eb' },
  { id: 'avatar2', emoji: '🎓', color: '#10b981' },
  { id: 'avatar3', emoji: '🧑‍💻', color: '#f59e0b' },
  { id: 'avatar4', emoji: '👨‍🎓', color: '#8b5cf6' },
  { id: 'avatar5', emoji: '👩‍🎓', color: '#ec4899' },
  { id: 'avatar6', emoji: '🧑‍🔬', color: '#06b6d4' },
  { id: 'avatar7', emoji: '👨‍🏫', color: '#ef4444' },
  { id: 'avatar8', emoji: '👩‍🏫', color: '#14b8a6' },
];

export function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Logout automático após 10 minutos de inatividade
  useEffect(() => {
    if (!user) return;

    const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutos em milissegundos

    const resetTimer = () => {
      lastActivityRef.current = Date.now();
      
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      inactivityTimerRef.current = setTimeout(async () => {
        const timeSinceLastActivity = Date.now() - lastActivityRef.current;
        if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
          await logout();
          navigate('/');
        }
      }, INACTIVITY_TIMEOUT);
    };

    // Eventos que indicam atividade do usuário
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    activityEvents.forEach(event => {
      window.addEventListener(event, resetTimer, true);
    });

    resetTimer();

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetTimer, true);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [user, logout, navigate]);

  // Buscar avatar do perfil quando o usuário mudar ou quando o perfil for fechado
  useEffect(() => {
    const loadUserAvatar = async () => {
      if (!user?.id) return;

      try {
        // Buscar perfil para obter uploaded_image (prioridade)
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('uploaded_image, avatar')
          .eq('user_id', user.id)
          .maybeSingle();

        // Priorizar uploaded_image do perfil sobre avatar da tabela users
        const profileData = profile as { uploaded_image?: string | null; avatar?: string | null } | null;
        const finalAvatar = profileData?.uploaded_image || profileData?.avatar || user.avatar || null;
        setUserAvatar(finalAvatar);
      } catch (err) {
        console.error('❌ Erro ao buscar avatar do perfil:', err);
        // Fallback para avatar do usuário
        setUserAvatar(user.avatar || null);
      }
    };

    loadUserAvatar();
  }, [user, showProfile]);

  if (!user) {
    return null;
  }

  const getUserAvatar = () => {
    // Priorizar avatar do perfil (uploaded_image)
    const avatar = userAvatar || user.avatar;
    
    if (avatar) {
      // Se for uma imagem (data:image), retornar diretamente
      if (avatar.startsWith('data:image')) {
        return avatar;
      }
      // Se for um ID de avatar preset, buscar o emoji
      const presetAvatar = PRESET_AVATARS.find(a => a.id === avatar);
      return presetAvatar ? presetAvatar.emoji : avatar;
    }
    return '👤';
  };

  const avatar = getUserAvatar();
  const isImage = avatar.startsWith('data:image');

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-logo-section">
          <div className="header-logo">
            <img 
              src="/images/logo.png"
              alt="CRB Quiz Logo" 
              className="header-logo-image"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.parentElement?.querySelector('.header-logo-fallback') as HTMLElement;
                if (fallback) {
                  fallback.style.display = 'flex';
                }
              }}
              onLoad={(e) => {
                const target = e.target as HTMLImageElement;
                const fallback = target.parentElement?.querySelector('.header-logo-fallback') as HTMLElement;
                if (fallback) {
                  fallback.style.display = 'none';
                }
              }}
            />
            <div className="header-logo-fallback" style={{ display: 'none' }}>
              <div className="header-logo-text-container">
                <div className="header-logo-text-crb">CRB</div>
                <div className="header-logo-text-quiz">QUIZ</div>
              </div>
            </div>
          </div>
        </div>
        <div className="user-info">
          <button 
            onClick={() => setShowProfile(!showProfile)} 
            className="user-avatar-button"
            title="Meu Perfil"
          >
            {isImage ? (
              <img src={avatar} alt="Avatar" className="header-avatar-image" />
            ) : (
              <div className="header-avatar-emoji">{avatar}</div>
            )}
          </button>
          <span>Olá, {user.username}</span>
          <span className="user-role">({user.role === 'admin' ? 'Administrador' : 'Aluno'})</span>
          <button onClick={handleLogout} className="logout-button">
            Sair
          </button>
        </div>
      </header>
      <main className="dashboard-main">
        {showProfile ? (
          <Profile onBack={() => {
            setShowProfile(false);
            // O useEffect já vai recarregar o avatar quando showProfile mudar
          }} />
        ) : (
          user.role === 'admin' ? (
            <AdminDashboard />
          ) : (
            <AlunoDashboard />
          )
        )}
      </main>
    </div>
  );
}
