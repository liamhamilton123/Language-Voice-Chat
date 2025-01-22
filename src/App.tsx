// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import VoiceChatPage from './pages/VoiceChatPage';
import Header from './components/Header';
import { ThemeProvider } from "./components/theme/theme-provider.tsx"


function App() {
  return (
    <Router>
          <ThemeProvider defaultTheme="system" storageKey="app-theme">
      <div className="min-h-screen min-w-screen flex flex-col">
        <Header />
        <main className="bg-background flex-grow">
          <Routes>
            <Route path="/" element={<VoiceChatPage />} />
            {/* Add more routes as needed */}
          </Routes>
        </main>
      </div>
      </ThemeProvider>
    </Router>
  );
}

export default App;