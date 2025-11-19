import { Routes, Route } from "react-router-dom";
import Landing from "./components/pages/Landing";
import Authentication from "./components/pages/Authentication";
import { AuthProvider } from "./components/contexts/AuthContext";
import VideoMeet from "./components/pages/VideoMeet";
import HomeComponent from './components/pages/Home'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Authentication />} />
        <Route path="/home" element={<HomeComponent />} />

        <Route path="/:url" element={<VideoMeet />}/>
      </Routes>
    </AuthProvider>
  );
}

export default App;
