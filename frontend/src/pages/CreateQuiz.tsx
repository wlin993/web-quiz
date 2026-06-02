import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'

interface QuestionDraft {
  text: string
  options: string[]
  correct_index: number
}

const emptyQuestion = (): QuestionDraft => ({
  text: '',
  options: ['', '', '', ''],
  correct_index: 0,
})

export default function CreateQuiz() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState<QuestionDraft[]>([emptyQuestion()])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function updateQuestion(idx: number, patch: Partial<QuestionDraft>) {
    setQuestions(qs => qs.map((q, i) => i === idx ? { ...q, ...patch } : q))
  }

  function updateOption(qIdx: number, oIdx: number, value: string) {
    setQuestions(qs => qs.map((q, i) => {
      if (i !== qIdx) return q
      const options = [...q.options]
      options[oIdx] = value
      return { ...q, options }
    }))
  }

  function addOption(qIdx: number) {
    setQuestions(qs => qs.map((q, i) =>
      i === qIdx ? { ...q, options: [...q.options, ''] } : q
    ))
  }

  function removeOption(qIdx: number, oIdx: number) {
    setQuestions(qs => qs.map((q, i) => {
      if (i !== qIdx) return q
      const options = q.options.filter((_, j) => j !== oIdx)
      const correct_index = q.correct_index >= oIdx && q.correct_index > 0
        ? q.correct_index - 1
        : q.correct_index
      return { ...q, options, correct_index }
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    for (const [i, q] of questions.entries()) {
      if (!q.text.trim()) { setError(`Question ${i + 1} text is required`); return }
      const filled = q.options.filter(o => o.trim())
      if (filled.length < 2) { setError(`Question ${i + 1} needs at least 2 options`); return }
    }
    setSaving(true)
    try {
      const quiz = await api.createQuiz({
        title,
        description,
        questions: questions.map(q => ({
          ...q,
          options: q.options.filter(o => o.trim()),
        })),
      })
      navigate(`/quiz/${quiz.id}`)
    } catch {
      setError('Failed to save quiz')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <div className="row" style={{ marginBottom: '1.5rem' }}>
        <button className="btn btn-ghost" onClick={() => navigate('/')}>← Back</button>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Create Quiz</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="form-group">
            <label>Title *</label>
            <input
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. JavaScript Basics"
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optional description"
            />
          </div>
        </div>

        {questions.map((q, qi) => (
          <div className="card" key={qi} style={{ marginBottom: '1rem' }}>
            <div className="row" style={{ marginBottom: '1rem' }}>
              <span style={{ fontWeight: 600 }}>Question {qi + 1}</span>
              <div className="spacer" />
              {questions.length > 1 && (
                <button
                  type="button"
                  className="btn btn-danger"
                  style={{ padding: '.3rem .65rem', fontSize: '.8rem' }}
                  onClick={() => setQuestions(qs => qs.filter((_, i) => i !== qi))}
                >
                  Remove
                </button>
              )}
            </div>

            <div className="form-group">
              <label>Question text *</label>
              <textarea
                required
                value={q.text}
                onChange={e => updateQuestion(qi, { text: e.target.value })}
                placeholder="e.g. What does typeof null return?"
              />
            </div>

            <div style={{ marginBottom: '.75rem' }}>
              <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.4rem' }}>
                Options — select the correct one
              </label>
              {q.options.map((opt, oi) => (
                <div key={oi} className="row" style={{ marginBottom: '.4rem' }}>
                  <input
                    type="radio"
                    name={`correct-${qi}`}
                    checked={q.correct_index === oi}
                    onChange={() => updateQuestion(qi, { correct_index: oi })}
                    style={{ accentColor: '#4f46e5', width: 16, height: 16, cursor: 'pointer' }}
                  />
                  <input
                    style={{ flex: 1 }}
                    value={opt}
                    onChange={e => updateOption(qi, oi, e.target.value)}
                    placeholder={`Option ${oi + 1}`}
                  />
                  {q.options.length > 2 && (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ padding: '.3rem .5rem', fontSize: '.8rem', color: '#ef4444' }}
                      onClick={() => removeOption(qi, oi)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {q.options.length < 6 && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ marginTop: '.25rem', fontSize: '.85rem' }}
                  onClick={() => addOption(qi)}
                >
                  + Add option
                </button>
              )}
            </div>
          </div>
        ))}

        <button
          type="button"
          className="btn btn-ghost"
          style={{ marginBottom: '1.5rem' }}
          onClick={() => setQuestions(qs => [...qs, emptyQuestion()])}
        >
          + Add question
        </button>

        {error && <p className="error-msg" style={{ marginBottom: '.75rem' }}>{error}</p>}

        <div className="row">
          <div className="spacer" />
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save Quiz'}
          </button>
        </div>
      </form>
    </div>
  )
}
