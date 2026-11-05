import React, { useState } from 'react';
import { WORKSHOP_TEMPLATES, LEGO_COLORS } from '../data/lspMethodology';
import { Blocks, Users, Crown, Sparkles, ArrowRight, ShieldCheck, Globe, Languages } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function LobbyModal({ onJoinRoom }) {
  const { language, setLanguage, t } = useLanguage();
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('ONU2026');
  const [role, setRole] = useState('facilitator'); // 'facilitator' | 'participant'
  const [avatarColor, setAvatarColor] = useState(LEGO_COLORS[0].hex);
  const [templateId, setTemplateId] = useState(WORKSHOP_TEMPLATES[0].id);

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanName = name.trim() || (role === 'facilitator' ? (language === 'en' ? 'LSP Facilitator' : 'Facilitador LSP') : (language === 'en' ? 'Participant' : 'Participante'));
    const cleanRoom = roomCode.trim().toUpperCase() || 'ONU2026';
    onJoinRoom({
      name: cleanName,
      roomCode: cleanRoom,
      role,
      avatarColor,
      templateId,
    });
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background LEGO accents */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Language switcher top bar */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-full shadow-lg backdrop-blur">
        <Languages className="w-4 h-4 text-amber-400" />
        <span className="text-xs text-slate-400 font-medium">Language:</span>
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`text-xs px-2 py-0.5 rounded font-bold transition ${
            language === 'en' ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          EN
        </button>
        <span className="text-slate-700">|</span>
        <button
          type="button"
          onClick={() => setLanguage('es')}
          className={`text-xs px-2 py-0.5 rounded font-bold transition ${
            language === 'es' ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          ES
        </button>
      </div>

      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Left column: Brand & Methodology overview */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-8 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 bg-amber-400/15 border border-amber-400/30 text-amber-300 px-3 py-1 rounded-full text-xs font-bold mb-5">
              <Blocks className="w-4 h-4" />
              {t('methodologyBadge')}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              LSP Virtual Studio <span className="text-amber-400">3D</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-3 leading-relaxed">
              {t('lobbyTagline')}
            </p>

            <div className="mt-6 space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-2.5 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">{t('lobbyFeature1Title')}</strong>
                  {t('lobbyFeature1Desc')}
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                <Globe className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">{t('lobbyFeature2Title')}</strong>
                  {t('lobbyFeature2Desc')}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>WebSockets real-time sync</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Room ready
            </span>
          </div>
        </div>

        {/* Right column: Join / Create Session Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 p-8 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-white">{t('lobbyEnterTitle')}</h2>
            <p className="text-xs text-slate-400">
              {t('lobbyEnterSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t('yourName')}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('yourNamePlaceholder')}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t('roomCode')}
              </label>
              <input
                type="text"
                required
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder={t('roomCodePlaceholder')}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-amber-400 uppercase focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Role selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {t('selectRole')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('facilitator')}
                className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                  role === 'facilitator'
                    ? 'bg-amber-400/15 border-amber-400 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Crown className={`w-5 h-5 shrink-0 ${role === 'facilitator' ? 'text-amber-400' : 'text-slate-500'}`} />
                <div>
                  <div className="text-xs font-bold">{t('roleFacilitator')}</div>
                  <div className="text-[11px] text-slate-400">
                    {t('facilitatorRoleDesc')}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('participant')}
                className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                  role === 'participant'
                    ? 'bg-sky-400/15 border-sky-400 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Users className={`w-5 h-5 shrink-0 ${role === 'participant' ? 'text-sky-400' : 'text-slate-500'}`} />
                <div>
                  <div className="text-xs font-bold">{t('roleParticipant')}</div>
                  <div className="text-[11px] text-slate-400">
                    {t('participantRoleDesc')}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Workshop Template Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {t('workshopTemplate')}
            </label>
            <div className="space-y-2">
              {WORKSHOP_TEMPLATES.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => setTemplateId(tpl.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition ${
                    templateId === tpl.id
                      ? 'bg-slate-800/90 border-amber-400/80'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      {language === 'en' && tpl.nameEn ? tpl.nameEn : tpl.name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-amber-300 font-semibold">
                      {language === 'en' && tpl.badgeEn ? tpl.badgeEn : tpl.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {language === 'en' && tpl.summaryEn ? tpl.summaryEn : tpl.summary}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Avatar Color Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {t('avatarColor')}
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {LEGO_COLORS.slice(0, 8).map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setAvatarColor(c.hex)}
                  className={`w-7 h-7 rounded-full border-2 transition ${
                    avatarColor === c.hex ? 'border-white scale-110' : 'border-transparent opacity-80'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={language === 'en' && c.nameEn ? c.nameEn : c.name}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition"
          >
            {t('joinStudioBtn')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
