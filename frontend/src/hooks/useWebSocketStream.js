import { useRef, useEffect, useState, useCallback } from 'react'

export function useWebSocketStream(url, options = {}) {
  const { onMessage, onOpen, onClose, onError, reconnect = true, reconnectDelay = 3000 } = options
  const wsRef = useRef(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState(null)
  const reconnectTimeoutRef = useRef(null)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = (e) => {
      setIsConnected(true)
      onOpen?.(e)
    }

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      setLastMessage(data)
      onMessage?.(data)
    }

    ws.onclose = (e) => {
      setIsConnected(false)
      onClose?.(e)
      if (reconnect && !e.wasClean) {
        reconnectTimeoutRef.current = setTimeout(connect, reconnectDelay)
      }
    }

    ws.onerror = (e) => {
      onError?.(e)
    }
  }, [url, onMessage, onOpen, onClose, onError, reconnect, reconnectDelay])

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }, [])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
    wsRef.current?.close(1000, 'Client disconnect')
  }, [])

  useEffect(() => {
    connect()
    return () => disconnect()
  }, [connect, disconnect])

  return { isConnected, lastMessage, send, connect, disconnect }
}