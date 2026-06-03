import type { VideoGenerationTask } from '../types/jewelryPromo.types'

type VideoTaskStatus = VideoGenerationTask['status']

const DEFAULT_DURATION = 8
const DEFAULT_ASPECT_RATIO = '9:16'
const DEFAULT_RESOLUTION = '720p'
const DEFAULT_REFERENCE_WEIGHT = 0.8
const DEFAULT_POLLING_TIMEOUT_MS = 35 * 60 * 1000
const MAX_PROMPT_LENGTH = 2000
const MAX_IMAGE_REFERENCE_COUNT = 9
const SUPPORTED_ASPECT_RATIOS = new Set(['1:1', '16:9', '9:16', '4:3', '3:4', '21:9', '9:21'])
const SUPPORTED_RESOLUTIONS = new Set(['480p', '720p', '1080p', '2k'])
const STABLE_DURATIONS = [4, 8, 12] as const

export interface ImaVideoCreateOptions {
  prompt?: string
  images?: string[]
  duration?: number
  aspectRatio?: string
  resolution?: string
  audio?: boolean
  fixedLens?: boolean
}

export interface ImaVideoClientConfig {
  apiKey: string
  baseUrl: string
  fetchImpl?: typeof fetch
}

function normalizeStatus(status: unknown): VideoTaskStatus {
  const value = String(status || '').trim().toLowerCase()

  if (!value || value === 'not_start' || value === 'pending' || value === 'queued') {
    return 'submitted'
  }

  if (value.includes('succeed') || value.includes('success') || value === 'completed') {
    return 'succeed'
  }

  if (value.includes('fail') || value.includes('error')) {
    return 'failed'
  }

  if (value.includes('progress') || value.includes('running') || value.includes('queue') || value.includes('process')) {
    return 'processing'
  }

  if (value.includes('submit') || value.includes('create')) {
    return 'submitted'
  }

  return 'unknown'
}

function normalizeDuration(value: unknown) {
  const duration = Number(value)
  return Number.isFinite(duration) ? duration : undefined
}

function normalizeRequestDuration(value: unknown) {
  const duration = Number(value)

  if (!Number.isFinite(duration)) {
    return DEFAULT_DURATION
  }

  const [shortDuration, mediumDuration, longDuration] = STABLE_DURATIONS

  if (duration <= shortDuration) {
    return shortDuration
  }

  if (duration <= mediumDuration) {
    return mediumDuration
  }

  return longDuration
}

function normalizeAspectRatio(value: unknown) {
  const aspectRatio = String(value || '').trim()
  return SUPPORTED_ASPECT_RATIOS.has(aspectRatio) ? aspectRatio : DEFAULT_ASPECT_RATIO
}

function normalizeResolution(value: unknown) {
  const resolution = String(value || '').trim().toLowerCase()
  return SUPPORTED_RESOLUTIONS.has(resolution) ? resolution : DEFAULT_RESOLUTION
}

function pickFirstString(values: unknown[]) {
  for (const value of values) {
    const text = typeof value === 'string' ? value.trim() : ''
    if (text) return text
  }

  return undefined
}

function formatSeedanceApiError(payload: any) {
  const code = payload?.code
  const field = pickFirstString([payload?.data?.error_field])
  const detail = pickFirstString([
    payload?.data?.error_details,
    payload?.data?.error_message,
    payload?.error?.message,
    payload?.message,
  ])

  const prefix = code ? `Error ${code}` : 'Video generation failed'
  const fieldPart = field ? `: ${field}` : ''
  const detailPart = detail ? `: ${detail}` : ''

  return `${prefix}${fieldPart}${detailPart}`
}

function extractErrorMessage(payload: any) {
  if (payload?.code && Number(payload.code) !== 200) {
    return formatSeedanceApiError(payload)
  }

  return (
    pickFirstString([
      payload?.data?.error_details,
      payload?.data?.error_message,
      payload?.error?.message,
      payload?.message,
      payload?.metadata?.url,
      payload?.data?.error?.message,
      payload?.data?.message,
    ]) || undefined
  )
}

function extractVideoUrl(payload: any) {
  const data = payload?.data ?? payload

  return pickFirstString([
    data?.response?.[0],
    data?.results?.[0]?.url,
    data?.url,
    data?.video_url,
    data?.videoUrl,
    data?.output?.url,
    data?.output?.video_url,
    data?.output?.videoUrl,
    data?.result?.url,
    data?.result?.video_url,
    data?.result?.videoUrl,
    data?.task_result?.videos?.[0]?.url,
    payload?.results?.[0]?.url,
    payload?.metadata?.url,
    payload?.url,
    payload?.video_url,
    payload?.videoUrl,
  ])
}

export function buildImaVideoCreateBody(options: ImaVideoCreateOptions) {
  const prompt = String(options.prompt || '').trim().slice(0, MAX_PROMPT_LENGTH)
  const images = (options.images || []).map((item) => String(item || '').trim()).filter(Boolean)
  const duration = normalizeRequestDuration(options.duration)

  if (!prompt) {
    throw new Error('Seedance 2.0 requires a non-empty prompt')
  }

  if (images.length > MAX_IMAGE_REFERENCE_COUNT) {
    throw new Error(`Seedance 2.0 supports at most ${MAX_IMAGE_REFERENCE_COUNT} image references`)
  }

  const references = images.map((url, index) => ({
    type: 'image',
    url,
    weight: DEFAULT_REFERENCE_WEIGHT,
    role: index === 0 ? 'subject' : 'environment',
  }))

  return {
    model: 'ima-pro',
    prompt,
    aspect_ratio: normalizeAspectRatio(options.aspectRatio),
    resolution: normalizeResolution(options.resolution),
    duration,
    generate_audio: Boolean(options.audio),
    fixed_lens: Boolean(options.fixedLens),
    ...(references.length ? { references } : {}),
  }
}

export function parseImaVideoTask(payload: any): VideoGenerationTask {
  const data = payload?.data ?? payload
  const id = String(data?.task_id ?? data?.id ?? payload?.task_id ?? payload?.id ?? '')
  const status = normalizeStatus(data?.status ?? payload?.status)
  const videoUrl = extractVideoUrl(payload)
  const duration = normalizeDuration(
    data?.request?.duration ??
      data?.results?.[0]?.duration ??
      data?.duration ??
      data?.output?.duration ??
      data?.result?.duration ??
      data?.task_result?.videos?.[0]?.duration ??
      payload?.results?.[0]?.duration ??
      payload?.duration
  )

  return {
    id,
    status,
    videoUrl,
    duration,
    raw: payload,
  }
}

export class ImaVideoClient {
  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly fetchImpl: typeof fetch

  constructor(config: ImaVideoClientConfig) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl.replace(/\/+$/, '')

    const runtimeFetch = config.fetchImpl ?? globalThis.fetch?.bind(globalThis)

    if (!runtimeFetch) {
      throw new Error('Current runtime does not support fetch')
    }

    this.fetchImpl = runtimeFetch
  }

  async createVideoTask(options: ImaVideoCreateOptions): Promise<VideoGenerationTask> {
    const response = await this.fetchImpl(`${this.baseUrl}/v1/videos`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'X-Seedance-Version': '2.0',
      },
      body: JSON.stringify(buildImaVideoCreateBody(options)),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Video generation create task failed: ${response.status} ${errorText}`)
    }

    const payload = await response.json()

    if (payload?.code && Number(payload.code) !== 200) {
      throw new Error(formatSeedanceApiError(payload))
    }

    const task = parseImaVideoTask(payload)

    if (!task.id) {
      throw new Error('Video generation did not return a task id')
    }

    return {
      ...task,
      status: task.status === 'unknown' ? 'submitted' : task.status,
    }
  }

  async getVideoTask(taskId: string): Promise<VideoGenerationTask> {
    const response = await this.fetchImpl(`${this.baseUrl}/v1/videos/${taskId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'X-Seedance-Version': '2.0',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Video generation query task failed: ${response.status} ${errorText}`)
    }

    const payload = await response.json()

    if (payload?.code && Number(payload.code) !== 200) {
      throw new Error(formatSeedanceApiError(payload))
    }

    return parseImaVideoTask(payload)
  }

  async fetchVideoContent(taskId: string) {
    const response = await this.fetchImpl(`${this.baseUrl}/v1/videos/${taskId}/content`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: 'video/mp4, video/*, */*',
        'X-Seedance-Version': '2.0',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Video generation fetch video failed: ${response.status} ${errorText}`)
    }

    const videoBlob = await response.blob()

    if (!videoBlob.size) {
      throw new Error('Video generation returned an empty video payload')
    }

    return URL.createObjectURL(videoBlob)
  }

  async waitForVideo(
    taskId: string,
    options?: {
      intervalMs?: number
      timeoutMs?: number
    }
  ): Promise<VideoGenerationTask> {
    const intervalMs = options?.intervalMs ?? 5000
    const timeoutMs = options?.timeoutMs ?? DEFAULT_POLLING_TIMEOUT_MS
    const startTime = Date.now()
    let lastTask: VideoGenerationTask | null = null

    while (Date.now() - startTime < timeoutMs) {
      const task = await this.getVideoTask(taskId)
      lastTask = task

      if (task.status === 'succeed') {
        if (task.videoUrl) {
          return task
        }

        const contentUrl = await this.fetchVideoContent(taskId)
        return {
          ...task,
          videoUrl: contentUrl,
        }
      }

      if (task.status === 'failed') {
        throw new Error(extractErrorMessage(task.raw) || 'Video generation failed')
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs))
    }

    const lastStatus = lastTask?.status || 'unknown'
    throw new Error(`Video generation polling timed out after ${Math.round(timeoutMs / 1000)}s (last status: ${lastStatus})`)
  }
}
