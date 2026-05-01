import Sidebar from './components/Sidebar'
import ChatPanel from './components/ChatPanel'
import PreviewPanel from './components/PreviewPanel'

function App() {
  return (
    <div className="flex h-screen min-w-[1024px]">
      <Sidebar />
      <ChatPanel />
      <PreviewPanel />
    </div>
  )
}

export default App
