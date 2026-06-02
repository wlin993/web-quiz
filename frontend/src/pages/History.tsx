import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import type { AttemptSummary } from '../api/client'

export default function History() {
  const navigate = useNavigate()
  const [attempts, setAttempts] = useState<AttemptSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.listAttempts()
      .then(setAttempts)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page">
      <h1 className="page-title">My History</h1>

      {loading && <p className="empty">Loading…</p>}
      {!loading && attempts.length === 0 && (
        <p className="empty">No attempts yet — take a quiz!</p>
      )}

      {attempts.map(a => {
        const pct = Math.round((a.score / a.total) * 100)
        const badgeClass = pct >= 80 ? 'badge-green' : pct >= 50 ? 'badge-indigo' : 'badge-red'
        return (
          <div key={a.id} className="attempt-row" onClick={() => navigate(`/results/${a.id}`)}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '.95rem' }}>{a.quiz_title}</div>
              <div style={{ fontSize: '.8rem', color: '#94a3b8', marginTop: '.15rem' }}>
                {new Date(a.taken_at).toLocaleString()}
              </div>
            </div>
            <span className={`badge ${badgeClass}`}>
              {a.score}/{a.total} ({pct}%)
            </span>
          </div>
        )
      })}
    </div>
  )
}
