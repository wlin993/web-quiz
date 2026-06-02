import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { QuizDetail } from '../api/client'

export default function TakeQuiz() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [quiz, setQuiz] = useState<QuizDetail | null>(null)
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [current, setCurrent] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    api.getQuiz(id)
      .then(q => {
        setQuiz(q)
        setAnswers(new Array(q.questions.length).fill(null))
      })
      .catch(() => setError('Quiz not found'))
  }, [id])

  if (error) return <div className="page"><p className="error-msg">{error}</p></div>
  if (!quiz) return <div className="page"><p className="empty">Loading…</p></div>

  const question = quiz.questions[current]
  const total = quiz.questions.length
  const selectedAnswer = answers[current]

  function select(idx: number) {
    setAnswers(a => a.map((v, i) => i === current ? idx : v))
  }

  function goNext() {
    if (current < total - 1) {
      setCurrent(c => c + 1)
    }
  }

  function goPrev() {
    if (current > 0) setCurrent(c => c - 1)
  }

  async function handleSubmit() {
    if (answers.some(a => a === null)) {
      setError('Please answer all questions before submitting')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const result = await api.submitQuiz(id!, answers as number[])
      navigate(`/results/${result.id}`)
    } catch {
      setError('Failed to submit quiz')
      setSubmitting(false)
    }
  }

  const isLast = current === total - 1
  const allAnswered = answers.every(a => a !== null)

  return (
    <div className="page">
      <div className="row" style={{ marginBottom: '1.5rem' }}>
        <button className="btn btn-ghost" onClick={() => navigate('/')}>← Back</button>
        <h2 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{quiz.title}</h2>
      </div>

      <div className="card">
        <div className="question-header">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${((current + 1) / total) * 100}%` }} />
          </div>
          <span style={{ fontSize: '.85rem', color: '#64748b' }}>
            Question {current + 1} of {total}
          </span>
        </div>

        <p className="question-text">{question.text}</p>

        <div className="options">
          {question.options.map((opt, i) => (
            <button
              key={i}
              className={`option-btn${selectedAnswer === i ? ' selected' : ''}`}
              onClick={() => select(i)}
            >
              <span style={{ opacity: .5, marginRight: '.5rem', fontSize: '.85rem' }}>
                {String.fromCharCode(65 + i)}.
              </span>
              {opt}
            </button>
          ))}
        </div>

        {error && <p className="error-msg" style={{ marginTop: '1rem' }}>{error}</p>}

        <div className="row" style={{ marginTop: '1.5rem' }}>
          <button className="btn btn-ghost" onClick={goPrev} disabled={current === 0}>
            ← Prev
          </button>
          <div className="spacer" />
          {/* answered dot indicators */}
          <div className="row" style={{ gap: '.35rem' }}>
            {answers.map((a, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                style={{
                  width: 10, height: 10, borderRadius: '50%', border: 'none', cursor: 'pointer',
                  background: i === current ? '#4f46e5' : a !== null ? '#a5b4fc' : '#e2e8f0',
                }}
              />
            ))}
          </div>
          <div className="spacer" />
          {isLast ? (
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={submitting || !allAnswered}
            >
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
          ) : (
            <button className="btn btn-primary" onClick={goNext} disabled={selectedAnswer === null}>
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
