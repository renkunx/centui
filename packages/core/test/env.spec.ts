import { afterEach, describe, expect, it, vi } from 'vitest'
import { warn } from '../src/debug'
import { inBrowser, isAndroid, isIOS, isProd } from '../src/env'

describe('env (node 环境)', () => {
  it('detects non-browser environment safely', () => {
    expect(inBrowser).toBe(false)
    expect(isAndroid).toBeFalsy()
    expect(isIOS).toBeFalsy()
  })

  it('isProd follows NODE_ENV', () => {
    expect(isProd).toBe(false)
  })
})

describe('warn', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('logs with Mand-Mobile prefix in non-production', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    warn('something wrong')
    expect(error).toHaveBeenCalledWith('[Mand-Mobile]: something wrong')
  })

  it('supports console method override', () => {
    const w = vi.spyOn(console, 'warn').mockImplementation(() => {})
    warn('be careful', 'warn')
    expect(w).toHaveBeenCalledWith('[Mand-Mobile]: be careful')
  })

  it('stays silent in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.resetModules()
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { warn: warnInProd } = await import('../src/debug')
    warnInProd('should be silent')
    expect(error).not.toHaveBeenCalled()
  })
})
