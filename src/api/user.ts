/**
 * 用户相关 API
 * 
 * 积分、历史记录、资产等
 */

import { get, post } from './client'
import type { PointTransaction } from '@/types/ai.types'

export interface UserProfile {
  id: string
  email?: string
  phone?: string
  displayName?: string
  avatar?: string
  points: number
  createdAt: string
}

export interface HistoryItem {
  id: string
  type: string
  inputImages: string[]
  outputImage: string
  params: Record<string, any>
  createdAt: string
  pointsCost: number
}

/**
 * 获取用户信息
 */
export async function getUserProfile(): Promise<UserProfile> {
  return get<UserProfile>('/api/user/profile')
}

/**
 * 更新用户信息
 */
export async function updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
  return post<UserProfile>('/api/user/profile', data)
}

/**
 * 获取积分历史
 */
export async function getPointsHistory(): Promise<PointTransaction[]> {
  return get<PointTransaction[]>('/api/user/points-history')
}

/**
 * 充值积分
 */
export async function rechargePoints(amount: number): Promise<{ success: boolean; points: number }> {
  return post('/api/user/recharge', { amount })
}

/**
 * 获取历史记录
 */
export async function getHistory(page: number = 1, pageSize: number = 20): Promise<{
  items: HistoryItem[]
  total: number
  hasMore: boolean
}> {
  return get(`/api/user/history?page=${page}&pageSize=${pageSize}`)
}

/**
 * 删除历史记录
 */
export async function deleteHistoryItem(id: string): Promise<{ success: boolean }> {
  return post(`/api/user/history/${id}/delete`)
}

/**
 * 清空历史记录
 */
export async function clearHistory(): Promise<{ success: boolean }> {
  return post('/api/user/history/clear')
}

/**
 * 获取资产列表
 */
export async function getAssets(category?: string): Promise<{
  items: Array<{
    id: string
    name: string
    url: string
    type: string
    createdAt: string
  }>
}> {
  const url = category ? `/api/user/assets?category=${category}` : '/api/user/assets'
  return get(url)
}

/**
 * 删除资产
 */
export async function deleteAsset(id: string): Promise<{ success: boolean }> {
  return post(`/api/user/assets/${id}/delete`)
}
