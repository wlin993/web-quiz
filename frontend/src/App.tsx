import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import Home from './pages/Home'
import CreateQuiz from './pages/CreateQuiz'
import TakeQuiz from './pages/TakeQuiz'
import Results from './pages/Results'
import History from './pages/History'
import './index.css'

export default function App() {
  return (
    <BrowserRouter>
      <header className="app-header">
        <NavLink to="/" className="logo">QuizApp</NavLink>
        <nav>
          <NavLink to="/" end>Quizzes</NavLink>
          <NavLink to="/history">History</NavLink>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateQuiz />} />
        <Route path="/quiz/:id" element={<TakeQuiz />} />
        <Route path="/results/:id" element={<Results />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </BrowserRouter>
  )
}
