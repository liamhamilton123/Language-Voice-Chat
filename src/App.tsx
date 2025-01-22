// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import VoiceChatPage from './pages/VoiceChatPage';
import Header from './components/Header';

function App() {
  return (
    <Router>
      <div className="min-h-screen min-w-screen flex flex-col">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<VoiceChatPage />} />
            {/* Add more routes as needed */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;