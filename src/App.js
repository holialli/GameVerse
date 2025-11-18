import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Home from './pages/Home/Home';
import Genres from './pages/Genres/Genres';
import Popular from './pages/Popular/Popular';
import News from './pages/News/News';
import Events from './pages/Events/Events';
import Contact from './pages/Contact/Contact';
import Gallery from './pages/Gallery/Gallery'; 

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/genres" element={<Genres />} />
        <Route path="/popular" element={<Popular />} />
        <Route path="/news" element={<News />} />
        <Route path="/events" element={<Events />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/gallery" element={<Gallery />} />
      </Routes>
    </Layout>
  );
}

export default App;