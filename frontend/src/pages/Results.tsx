import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { AttemptResult } from '../api/client'

export default function Results() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [result, setResult] = useState<AttemptResult | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    api.getAttempt(id)
      .then(setResult)
      .catch(() => setError('Result not found'))
  }, [id])

  if (error) return <div className="page"><p className="error-msg">{error}</p></div>
  if (!result) return <div className="page"><p className="empty">Loading…</p></div>

  const pct = Math.round((result.score / result.total) * 100)

  return (
    <div className="page">
      <div className="row" style={{ marginBottom: '1.5rem' }}>
        <button className="btn btn-ghost" onClick={() => navigate('/')}>← All Quizzes</button>
        <div className="spacer" />
        <button className="btn btn-primary" onClick={() => navigate(`/quiz/${result.quiz_id}`)}>
          Retry Quiz
        </button>
      </div>

      <div className="card" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div className="score-circle">
          <span className="score-num">{result.score}/{result.total}</span>
          <span className="score-label">{pct}%</span>
        </div>
        <h2 style={{ fontWeight: 700, fontSize: '1.2rem' }}>
          {pct >= 80 ? 'Excellent!' : pct >= 50 ? 'Good effort!' : 'Keep practicing!'}
        </h2>
        <p style={{ color: '#64748b', fontSize: '.9rem', marginTop: '.25rem' }}>
          You got {result.score} out of {result.total} questions correct
        </p>
      </div>

      <h3 style={{ fontWeight: 700, marginBottom: '.75rem' }}>Review</h3>
      {result.questions.map((q, i) => {
        const chosen = result.answers[i]
        const correct = q.correct_index
        const isCorrect = chosen === correct
        return (
          <div key={q.id} className={`review-item ${isCorrect ? 'correct' : 'wrong'}`}>
            <p className="review-q">{i + 1}. {q.text}</p>
            <div className="review-answer">
              {isCorrect ? (
                <span style={{ color: '#16a34a' }}>
                  ✓ {q.options[correct]}
                </span>
              ) : (
                <>
                  <div style={{ color: '#dc2626' }}>✗ Your answer: {q.options[chosen]}</div>
                  <div style={{ color: '#16a34a', marginTop: '.2rem' }}>
                    ✓ Correct: {q.options[correct]}
                  </div>
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
