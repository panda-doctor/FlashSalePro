import { http } from '@/http/client'

export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

export interface AiChatRequest {
  /** @Size(max = 500) */
  message: string
  /** 按时间正序的历史消息 */
  history?: ChatTurn[]
}

export interface ChatReplyVO {
  reply: string
}

/** 公开接口，无鉴权；后端未配置 API Key 时返回 50300 */
export function sendChat(payload: AiChatRequest): Promise<ChatReplyVO> {
  return http.post<ChatReplyVO>('/api/support/chat', payload, { timeout: 30000 })
}
