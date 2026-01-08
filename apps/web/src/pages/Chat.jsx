/**
 * Chat Page
 * Full-page AI chat experience
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChatWindow } from '../components/AI'
import { useAuth } from '../hooks/useAuth'

export default function Chat() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Update page title
  useEffect(() => {
    document.title = 'AI Chat | SaveBucks'
    return () => {
      document.title = 'SaveBucks - Best Deals & Coupons'
    }
  }, [])

  return (
    <div className="chat-page">
      <div className="chat-container">
        <ChatWindow
          onNewConversation={() => {
            // Clear URL params when starting new chat
            navigate('/chat', { replace: true })
          }}
        />
      </div>

      <style jsx>{`
        .chat-page {
          min-height: 100vh;
          background: var(--bg, #f9fafb);
          display: flex;
          flex-direction: column;
        }
        
        .chat-container {
          flex: 1;
          max-width: 900px;
          width: 100%;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
        }
        
        @media (max-width: 900px) {
          .chat-container {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  )
}
