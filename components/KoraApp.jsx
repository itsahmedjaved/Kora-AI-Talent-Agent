'use client'

import { useState, useRef } from 'react'

const COLORS = ['#2563eb', '#0ea5a0', '#7c3aed', '#d97706', '#dc2626', '#059669']

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function getColor(index) {
  return COLORS[index % COLORS.length]
}

function KoraLogo({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34">
      <g opacity="0.5">
        {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg, i) => (
          <rect key={i} x="15.5" y="1" width="3" height="3" rx="0.8"
            fill={i < 4 ? '#60a5fa' : i < 8 ? '#93c5fd' : '#bfdbfe'}
            transform={`rotate(${deg},17,17)`} />
        ))}
      </g>
      <g>
        {[0,45,90,135,180,225,270,315].map((deg, i) => (
          <rect key={i} x="15" y="6" width="4" height="4" rx="1"
            fill={i % 3 === 0 ? '#3b82f6' : i % 3 === 1 ? '#2563eb' : '#1d4ed8'}
            transform={`rotate(${deg},17,17)`} />
        ))}
      </g>
      <circle cx="17" cy="17" r="4" fill="#1a2454" />
    </svg>
  )
}

function ScoreRing({ score }) {
  const r = 34
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = score >= 75 ? '#16a34a' : score >= 55 ? '#d97706' : '#dc2626'
  return (
    <svg width="80" height="80" viewBox="0 0 80 80">
      <circle cx="40" cy="40" r={r} fill="none" stroke="#f0f3f8" strokeWidth="6" />
      <circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={circ.toFixed(1)} strokeDashoffset={offset.toFixed(1)}
        strokeLinecap="round" transform="rotate(-90 40 40)" />
      <text x="40" y="36" textAnchor="middle" fontSize="15" fontWeight="600"
        fill="#0f172a" fontFamily="Inter,sans-serif">{score}%</text>
      <text x="40" y="49" textAnchor="middle" fontSize="8" fill="#94a3b8"
        fontFamily="Inter,sans-serif" letterSpacing="0.06em">FIT SCORE</text>
    </svg>
  )
}

export default function KoraApp() {
  const [view, setView] = useState('candidates')
  const [candidates, setCandidates] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [analysisCache, setAnalysisCache] = useState({})
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [search, setSearch] = useState('')
  const [jd, setJd] = useState(
    'We are looking for a Senior React Developer with experience in Next.js, TypeScript, and GraphQL. The ideal candidate has led frontend teams, built design systems, and is comfortable with performance optimization and CI/CD.'
  )
  const [jobs] = useState([
    { id: 1, title: 'Senior React Developer', dept: 'Engineering', count: 0, status: 'active', date: 'Apr 26, 2026' },
    { id: 2, title: 'Full Stack Engineer', dept: 'Product', count: 0, status: 'draft', date: 'Apr 26, 2026' },
  ])
  const [toggles, setToggles] = useState({ ai: true, score: true, tech: true })
  const fileInputRef = useRef()

  const navItems = [
    { key: 'candidates', label: 'Candidates', badge: candidates.length },
    { key: 'jobs', label: 'Jobs', badge: null },
    { key: 'settings', label: 'Settings', badge: null },
  ]

  async function handleFile(file) {
    if (!file || !file.name.endsWith('.pdf')) {
      setUploadError('Please upload a PDF file.')
      return
    }
    setUploading(true)
    setUploadError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      const nameGuess = file.name.replace('.pdf', '').replace(/[-_]/g, ' ')
      const newCandidate = {
        id: Date.now(),
        name: nameGuess,
        role: 'Candidate',
        color: getColor(candidates.length),
        resumeText: data.text,
        filename: data.filename,
        pages: data.pages,
      }
      setCandidates(prev => [...prev, newCandidate])
      setSelectedId(newCandidate.id)
      setView('candidates')
    } catch (err) {
      setUploadError(err.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  async function runAnalysis(candidateId) {
    const c = candidates.find(x => x.id === candidateId)
    if (!c) return
    setAnalyzing(true)
    setAnalyzeError(null)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: c.resumeText, jobDescription: jd })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setCandidates(prev => prev.map(x => x.id === candidateId ? {
        ...x,
        role: data.topSkills?.[0] ? `${data.topSkills[0]} Developer` : x.role
      } : x))
      setAnalysisCache(prev => ({ ...prev, [candidateId]: data }))
    } catch (err) {
      setAnalyzeError(err.message || 'Analysis failed.')
    } finally {
      setAnalyzing(false)
    }
  }

  const filtered = candidates.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.role.toLowerCase().includes(search.toLowerCase())
  )

  const selected = candidates.find(x => x.id === selectedId)
  const analysis = selectedId ? analysisCache[selectedId] : null

  const S = {
    root: { display: 'flex', height: '100vh', background: '#f4f6fb', fontFamily: "'Inter', sans-serif" },
    sb: { width: 210, background: '#1a2454', display: 'flex', flexDirection: 'column', flexShrink: 0 },
    sbLogoArea: { padding: '22px 18px 18px', borderBottom: '0.5px solid rgba(255,255,255,0.08)' },
    sbLogoRow: { display: 'flex', alignItems: 'center', gap: 10 },
    sbLogoText: { color: '#fff', fontSize: 15, fontWeight: 600, letterSpacing: '-0.4px' },
    sbLogoSub: { color: 'rgba(255,255,255,0.35)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' },
    sbNav: { padding: '14px 10px', flex: 1 },
    sbNavLabel: { fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0 8px', marginBottom: 6 },
    sbNavItem: (active) => ({
      display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8,
      cursor: 'pointer', fontSize: 13, marginBottom: 2, transition: 'all 0.15s',
      color: active ? '#fff' : 'rgba(255,255,255,0.55)',
      background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
      fontWeight: active ? 500 : 400,
    }),
    sbBadge: { marginLeft: 'auto', background: '#2563eb', color: '#fff', fontSize: 10, padding: '1px 7px', borderRadius: 20, fontWeight: 500 },
    sbFooter: { padding: '12px 10px', borderTop: '0.5px solid rgba(255,255,255,0.08)' },
    sbUser: { display: 'flex', alignItems: 'center', gap: 9, padding: '7px 8px', borderRadius: 8 },
    sbAvatar: { width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#fff', flexShrink: 0 },
    main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    topbar: { padding: '0 22px', height: 56, background: '#fff', borderBottom: '0.5px solid #e4e8ef', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
    content: { flex: 1, overflow: 'auto', padding: '20px 22px' },
    btn: (variant) => ({
      padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: 'pointer',
      border: 'none', fontFamily: "'Inter', sans-serif", transition: 'all 0.15s',
      background: variant === 'cta' ? '#2563eb' : '#f1f5f9',
      color: variant === 'cta' ? '#fff' : '#475569',
    }),
    card: { background: '#fff', border: '0.5px solid #e4e8ef', borderRadius: 10 },
    panel: { background: '#fff', border: '0.5px solid #e4e8ef', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
    panelHdr: { padding: '11px 15px', borderBottom: '0.5px solid #f0f3f8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
    panelBody: { padding: 16, overflow: 'auto', flex: 1 },
    tag: (ready) => ({ fontSize: 10, padding: '3px 9px', borderRadius: 20, fontWeight: 500, background: ready ? '#dcfce7' : '#f1f5f9', color: ready ? '#166534' : '#64748b' }),
    secLabel: { fontSize: 10, fontWeight: 600, color: '#8a94a6', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 },
    skillTag: { padding: '4px 11px', borderRadius: 6, fontSize: 11, fontWeight: 500, background: '#dbeafe', color: '#1d4ed8' },
    qItem: { padding: '10px 12px', background: '#f8fafc', borderRadius: 7, borderLeft: '2.5px solid #2563eb', marginBottom: 8 },
    uploadZone: (drag) => ({
      border: `1.5px dashed ${drag ? '#2563eb' : '#cbd5e1'}`,
      borderRadius: 10, padding: '36px 20px', textAlign: 'center', cursor: 'pointer',
      background: drag ? '#eff6ff' : '#fafbfd', transition: 'all 0.2s', marginBottom: 16
    }),
    input: { flex: 1, padding: '8px 12px', border: '0.5px solid #e4e8ef', borderRadius: 7, fontSize: 12, fontFamily: "'Inter', sans-serif", outline: 'none', color: '#334155' },
    jdArea: { width: '100%', border: '0.5px solid #e4e8ef', borderRadius: 8, padding: '11px 13px', fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#334155', resize: 'none', height: 80, lineHeight: 1.6, outline: 'none', background: '#fff' },
    toggle: (on) => ({ width: 36, height: 20, background: on ? '#2563eb' : '#e2e8f0', borderRadius: 20, position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0 }),
    toggleDot: (on) => ({ position: 'absolute', width: 14, height: 14, background: '#fff', borderRadius: '50%', top: 3, left: on ? 19 : 3, transition: 'left 0.2s' }),
    scoreChip: (score) => {
      if (score >= 75) return { background: '#dcfce7', color: '#166534', padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 500, display: 'inline-flex' }
      if (score >= 55) return { background: '#fef3c7', color: '#d97706', padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 500, display: 'inline-flex' }
      return { background: '#fee2e2', color: '#dc2626', padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 500, display: 'inline-flex' }
    },
  }

  const icons = {
    candidates: <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor"><path d="M8 8a3 3 0 100-6 3 3 0 000 6zm-5 6a5 5 0 0110 0H3z"/></svg>,
    jobs: <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor"><path d="M6 2a1 1 0 00-1 1v1H3a1 1 0 00-1 1v9a1 1 0 001 1h10a1 1 0 001-1V5a1 1 0 00-1-1h-2V3a1 1 0 00-1-1H6zm0 2h4v1H6V4zm-3 2h10v8H3V6z"/></svg>,
    settings: <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor"><path d="M8 5a3 3 0 100 6A3 3 0 008 5zm0 1.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM6.5 1l-.3 1.5a5.5 5.5 0 00-1.3.75L3.5 2.8l-1.5 2.4 1.2.9a5.5 5.5 0 000 1.8l-1.2.9 1.5 2.4 1.4-.45a5.5 5.5 0 001.3.75L6.5 13h3l.3-1.5a5.5 5.5 0 001.3-.75l1.4.45 1.5-2.4-1.2-.9a5.5 5.5 0 000-1.8l1.2-.9-1.5-2.4-1.4.45a5.5 5.5 0 00-1.3-.75L9.5 1h-3z"/></svg>,
  }

  function renderCandidatesView() {
    if (selected && view === 'candidates') return renderAnalysisView()
    return (
      <div>
        <div
          style={S.uploadZone(dragging)}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} type="file" accept=".pdf" style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files[0])} />
          <div style={{ fontSize: 24, marginBottom: 8 }}>📄</div>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', marginBottom: 4 }}>
            {uploading ? 'Reading PDF…' : 'Drop a resume PDF here'}
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            or <span style={{ color: '#2563eb', fontWeight: 500 }}>browse to upload</span>
          </div>
        </div>
        {uploadError && (
          <div style={{ background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 12, marginBottom: 12 }}>
            {uploadError}
          </div>
        )}
        <div style={{ marginBottom: 16 }}>
          <div style={{ ...S.secLabel, marginBottom: 6 }}>Job Description Context</div>
          <textarea style={S.jdArea} value={jd} onChange={e => setJd(e.target.value)}
            placeholder="Paste the job requirements here…" />
        </div>
        {candidates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#1e293b', marginBottom: 6 }}>No candidates yet</div>
            <div style={{ fontSize: 12 }}>Upload a PDF resume above to get started</div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input style={S.input} placeholder="Search candidates…" value={search}
                onChange={e => setSearch(e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: 10 }}>
              {filtered.map((c) => {
                const a = analysisCache[c.id]
                return (
                  <div key={c.id} style={{ ...S.card, padding: '14px 13px', cursor: 'pointer' }}
                    onClick={() => { setSelectedId(c.id); setAnalyzeError(null) }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 10 }}>
                      {getInitials(c.name)}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', marginBottom: 2 }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10 }}>{c.role}</div>
                    {a
                      ? <span style={S.scoreChip(a.fitScore)}>{a.fitScore}% · {a.fitScore >= 75 ? 'Strong Fit' : a.fitScore >= 55 ? 'Potential' : 'Low Fit'}</span>
                      : <span style={{ fontSize: 11, color: '#94a3b8' }}>Not analyzed</span>
                    }
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    )
  }

  function renderAnalysisView() {
    const c = selected
    const a = analysisCache[c.id]
    return (
      <div>
        <button style={{ ...S.btn('ghost'), display: 'flex', alignItems: 'center', gap: 5, marginBottom: 14, fontSize: 12, color: '#64748b' }}
          onClick={() => setSelectedId(null)}>
          ← Back to candidates
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 600, color: '#fff' }}>
            {getInitials(c.name)}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{c.name}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{c.filename} · {c.pages} page{c.pages !== 1 ? 's' : ''}</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={S.panel}>
            <div style={S.panelHdr}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>Resume</span>
              <span style={S.tag(false)}>PDF Extracted</span>
            </div>
            <div style={{ ...S.panelBody, maxHeight: 440 }}>
              <pre style={{ fontSize: 11.5, color: '#475569', lineHeight: 1.75, whiteSpace: 'pre-wrap', fontFamily: "'Inter', sans-serif" }}>
                {c.resumeText}
              </pre>
            </div>
          </div>
          <div style={S.panel}>
            <div style={S.panelHdr}>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>AI Analysis</span>
              <span style={S.tag(!!a)}>{a ? 'Ready' : analyzing ? 'Analyzing…' : 'Pending'}</span>
            </div>
            <div style={{ ...S.panelBody, maxHeight: 440 }}>
              {analyzing ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 160, gap: 12 }}>
                  <div style={{ width: 24, height: 24, border: '2px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>Kora is analyzing the resume…</div>
                </div>
              ) : analyzeError ? (
                <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px 14px', borderRadius: 8, fontSize: 12 }}>
                  {analyzeError}
                  <div style={{ marginTop: 10 }}>
                    <button style={S.btn('cta')} onClick={() => runAnalysis(c.id)}>Try Again</button>
                  </div>
                </div>
              ) : a ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18, paddingBottom: 16, borderBottom: '0.5px solid #f0f3f8' }}>
                    <ScoreRing score={a.fitScore} />
                    <div>
                      <div style={{ fontSize: 10, color: '#8a94a6', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Candidate Fit</div>
                      <div style={{ fontSize: 30, fontWeight: 600, color: '#0f172a', lineHeight: 1 }}>{a.fitScore}%</div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                        {a.fitScore >= 75 ? 'Strong match for this role' : a.fitScore >= 55 ? 'Moderate match — worth a conversation' : 'Notable gaps with role requirements'}
                      </div>
                    </div>
                  </div>
                  {a.summary && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={S.secLabel}>Summary</div>
                      <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.6 }}>{a.summary}</div>
                    </div>
                  )}
                  <div style={{ marginBottom: 16 }}>
                    <div style={S.secLabel}>Top Skills Identified</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {a.topSkills?.map((skill, i) => (
                        <span key={i} style={S.skillTag}>{skill}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={S.secLabel}>Tailored Interview Questions</div>
                    {a.questions?.map((q, i) => (
                      <div key={i} style={S.qItem}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: '#2563eb', marginBottom: 3 }}>Q{q.num}</div>
                        <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.55 }}>{q.q}</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 180, textAlign: 'center' }}>
                  <div style={{ width: 46, height: 46, background: '#f1f5f9', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#0f172a', marginBottom: 6 }}>Not analyzed yet</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', maxWidth: 200, lineHeight: 1.55, marginBottom: 16 }}>
                    Click below to generate the AI candidate profile and interview questions.
                  </div>
                  <button style={S.btn('cta')} onClick={() => runAnalysis(c.id)}>Run AI Analysis</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  function renderJobsView() {
    const statusStyle = {
      active: { bg: '#dcfce7', color: '#166534' },
      draft: { bg: '#f1f5f9', color: '#64748b' },
      closed: { bg: '#fee2e2', color: '#991b1b' }
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {jobs.map(j => {
          const ss = statusStyle[j.status]
          return (
            <div key={j.id} style={{ ...S.card, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', marginBottom: 3 }}>{j.title}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{j.dept} · Posted {j.date}</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 9px', borderRadius: 20, background: ss.bg, color: ss.color }}>
                  {j.status.charAt(0).toUpperCase() + j.status.slice(1)}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', paddingTop: 10, borderTop: '0.5px solid #f0f3f8' }}>
                <span style={{ fontSize: 12, color: '#64748b' }}>{candidates.length} candidate{candidates.length !== 1 ? 's' : ''} uploaded</span>
                <button style={{ ...S.btn('ghost'), marginLeft: 'auto', fontSize: 11, padding: '5px 10px' }}
                  onClick={() => setView('candidates')}>View Candidates →</button>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  function renderSettingsView() {
    const Toggle = ({ k }) => (
      <div style={S.toggle(toggles[k])} onClick={() => setToggles(prev => ({ ...prev, [k]: !prev[k] }))}>
        <div style={S.toggleDot(toggles[k])} />
      </div>
    )
    return (
      <div>
        <div style={{ ...S.card, padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', marginBottom: 12, paddingBottom: 10, borderBottom: '0.5px solid #f0f3f8' }}>AI Configuration</div>
          {[
            { k: 'ai', label: 'Auto-analyze on upload', sub: 'Generate profile immediately after PDF upload' },
            { k: 'score', label: 'Fit scoring', sub: 'Score candidates against active job description' },
            { k: 'tech', label: 'Prioritize technical depth', sub: 'Over culture-fit questions' },
          ].map(row => (
            <div key={row.k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '0.5px solid #f7f8fa' }}>
              <div>
                <div style={{ fontSize: 13, color: '#334155' }}>{row.label}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{row.sub}</div>
              </div>
              <Toggle k={row.k} />
            </div>
          ))}
        </div>
        <div style={{ ...S.card, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#0f172a', marginBottom: 12, paddingBottom: 10, borderBottom: '0.5px solid #f0f3f8' }}>Workspace</div>
          {[
            { label: 'Product name', val: 'Kora' },
            { label: 'Agency', val: 'Bridging Bits' },
            { label: 'Founder', val: 'Salman B.' }
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '0.5px solid #f7f8fa' }}>
              <div style={{ fontSize: 13, color: '#334155' }}>{row.label}</div>
              <input defaultValue={row.val} style={{ border: '0.5px solid #e4e8ef', borderRadius: 6, padding: '5px 10px', fontSize: 12, fontFamily: "'Inter',sans-serif", outline: 'none', color: '#334155', width: 150 }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const topbarMeta = {
    candidates: { title: 'Candidates', sub: `${candidates.length} profile${candidates.length !== 1 ? 's' : ''} · ${Object.keys(analysisCache).length} analyzed` },
    jobs: { title: 'Job Postings', sub: `${jobs.length} postings` },
    settings: { title: 'Settings', sub: 'Workspace preferences' },
  }

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={S.root}>
        <div style={S.sb}>
          <div style={S.sbLogoArea}>
            <div style={S.sbLogoRow}>
              <KoraLogo size={34} />
              <div>
                <div style={S.sbLogoText}>Kora</div>
                <div style={S.sbLogoSub}>Talent Agent</div>
              </div>
            </div>
          </div>
          <nav style={S.sbNav}>
            <div style={S.sbNavLabel}>Workspace</div>
            {navItems.map(item => (
              <div key={item.key} style={S.sbNavItem(view === item.key)}
                onClick={() => { setView(item.key); if (item.key !== 'candidates') setSelectedId(null) }}>
                {icons[item.key]}
                {item.label}
                {item.badge != null && item.badge > 0 && <span style={S.sbBadge}>{item.badge}</span>}
              </div>
            ))}
          </nav>
          <div style={S.sbFooter}>
            <div style={S.sbUser}>
              <div style={S.sbAvatar}>SB</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>Salman B.</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Founder · Kora</div>
              </div>
            </div>
          </div>
        </div>
        <div style={S.main}>
          <div style={S.topbar}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{topbarMeta[view].title}</div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>{topbarMeta[view].sub}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={S.btn('ghost')} onClick={() => fileInputRef.current?.click()}>↑ Upload Resume</button>
              <button style={S.btn('cta')} onClick={() => setView('jobs')}>+ New Job</button>
            </div>
          </div>
          <div style={S.content}>
            {view === 'candidates' && renderCandidatesView()}
            {view === 'jobs' && renderJobsView()}
            {view === 'settings' && renderSettingsView()}
          </div>
        </div>
      </div>
    </>
  )
}
