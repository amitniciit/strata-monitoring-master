import { useState } from 'react'
import Create from './components/Create'
import Add from './components/Add'
import View from './components/View'
import Search from './components/Search'
import { Link } from 'react-router-dom'
import { ToastContainer } from 'react-toastify';
import './App.css'

const App = () => {
  const [isOpenCreate, setIsOpenCreate] = useState(false)
  const [isOpenAdd, setIsOpenAdd] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(true)

  return (
    <>
      <ToastContainer position="bottom-right" autoClose={5000} theme="light" />

      <div className="app-shell">
        <header className="topbar">
          <div className="brand">
            <div className="brand-icon">⛏</div>
            MineTrack
          </div>

          <nav className="topbar-actions">
            <button className="btn" onClick={() => { setIsOpenCreate(true); setIsOpenAdd(false); setIsViewOpen(false) }}>
              + Create
            </button>
            <button className="btn" onClick={() => { setIsOpenAdd(true); setIsOpenCreate(false); setIsViewOpen(false) }}>
              + Add
            </button>
            <button className={`btn ${isViewOpen ? 'btn-active' : ''}`} onClick={() => { setIsOpenAdd(false); setIsOpenCreate(false); setIsViewOpen(true) }}>
              ⊞ View
            </button>
            <Link to="/upload/panel" className="btn btn-primary">↑ Upload panel</Link>
            <Link to="/all/panel" className="btn">All panels</Link>
            <Link to="/" className="btn btn-icon">⌂</Link>
          </nav>
        </header>

        <main className="content">
          <Search />
          {isOpenCreate && <Create />}
          {isOpenAdd && <Add />}
          {isViewOpen && <View />}
        </main>
      </div>
    </>
  )
}

export default App