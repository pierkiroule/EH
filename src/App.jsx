import { HashRouter, Routes, Route } from "react-router-dom";
import Experience from "./routes/Experience.jsx";
import Scene from "./routes/Scene.jsx";
import Admin from "./routes/Admin.jsx";

/**
 * App — Router minimal EchoHypno
 * HashRouter = safe mobile / Vercel / file://
 */
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Experience />} />
        <Route path="/scene/:id" element={<Scene />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </HashRouter>
  );
}