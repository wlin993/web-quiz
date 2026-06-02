import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import type { QuizSummary } from '../api/client'

export default function Home() {
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    api.listQuizzes()
      .then(setQuizzes)
      .catch(() => setError('Failed to load quizzes'))
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    if (!confirm('Delete this quiz?')) return
    await api.deleteQuiz(id)
    setQuizzes(q => q.filter(x => x.id !== id))
  }

  return (
    <div className="page">
      <div className="row" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Quizzes</h1>
          <p className="page-subtitle">Pick a quiz to get started</p>
        </div>
        <div className="spacer" />
        <button className="btn btn-primary" onClick={() => navigate('/create')}>
          + New Quiz
        </button>
      </div>

      {loading && <p className="empty">Loading...</p>}
      {error && <p className="error-msg">{error}</p>}
      {!loading && quizzes.length === 0 && (
        <p className="empty">No quizzes yet — create one!</p>
      )}

      {quizzes.map(q => (
        <div key={q.id} className="card quiz-card" onClick={() => navigate(`/quiz/${q.id}`)}>
          <div className="quiz-card-info">
            <h3>{q.title}</h3>
            {q.description && <p>{q.description}</p>}
          </div>
          <div className="row">
            <span className="quiz-card-meta">{q.question_count} questions</span>
            <span className="badge badge-indigo">Take Quiz</span>
            <button
              className="btn btn-danger"
              style={{ padding: '.35rem .7rem', fontSize: '.8rem' }}
              onClick={e => handleDelete(e, q.id)}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
