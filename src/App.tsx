import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Entries from './pages/Entries'
import Outputs from './pages/Outputs'
import Expiration from './pages/Expiration'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/productos" element={<Products />} />
        <Route path="/entradas" element={<Entries />} />
        <Route path="/salidas" element={<Outputs />} />
        <Route path="/caducidad" element={<Expiration />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
