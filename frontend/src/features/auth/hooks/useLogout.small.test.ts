import { act, renderHook } from '@testing-library/react'
import { createStore, Provider } from 'jotai'
import { createElement } from 'react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'

import { authAtom } from '../../../shared/auth'
import { currentPageAtom } from '../../../shared/navigation'
import { useLogout } from './useLogout'

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

type TestStore = ReturnType<typeof createStore>

/** Wraps renderHook in a Jotai Provider that uses the given store. */
function createWrapper(store: TestStore) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(Provider, { store }, children)
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useLogout', () => {
  let store: TestStore

  beforeEach(() => {
    store = createStore()
    // atomWithStorage syncs to localStorage; clear between tests to prevent leakage.
    localStorage.clear()
  })

  describe('Return Value - Hook API Surface', () => {
    it('when called, then returns an object containing a logout function', () => {
      // Arrange + Act
      const { result } = renderHook(() => useLogout(), {
        wrapper: createWrapper(store),
      })

      // Assert
      expect(typeof result.current.logout).toBe('function')
    })
  })

  describe('Happy Path - Logout Clears Auth State', () => {
    it('when logout is called with an existing auth state, then authAtom is set to null', () => {
      // Arrange
      store.set(authAtom, {
        token: 'test-token',
        user: { id: 'user-1', email: 'test@example.com' },
      })
      const { result } = renderHook(() => useLogout(), {
        wrapper: createWrapper(store),
      })

      // Act
      act(() => {
        result.current.logout()
      })

      // Assert
      expect(store.get(authAtom)).toBeNull()
    })

    it('when logout is called with an existing auth state, then currentPageAtom is set to { name: "login" }', () => {
      // Arrange
      store.set(authAtom, {
        token: 'test-token',
        user: { id: 'user-1', email: 'test@example.com' },
      })
      store.set(currentPageAtom, { name: 'app-list' })
      const { result } = renderHook(() => useLogout(), {
        wrapper: createWrapper(store),
      })

      // Act
      act(() => {
        result.current.logout()
      })

      // Assert
      expect(store.get(currentPageAtom)).toEqual({ name: 'login' })
    })
  })

  describe('State Transitions - Navigation Page After Logout', () => {
    it('when logout is called from the app-detail page, then currentPageAtom becomes { name: "login" }', () => {
      // Arrange
      store.set(authAtom, {
        token: 'test-token',
        user: { id: 'user-1', email: 'test@example.com' },
      })
      store.set(currentPageAtom, { name: 'app-detail', appId: 'app-123' })
      const { result } = renderHook(() => useLogout(), {
        wrapper: createWrapper(store),
      })

      // Act
      act(() => {
        result.current.logout()
      })

      // Assert
      expect(store.get(currentPageAtom)).toEqual({ name: 'login' })
    })

    it('when logout is called from the app-create page, then currentPageAtom becomes { name: "login" }', () => {
      // Arrange
      store.set(authAtom, {
        token: 'test-token',
        user: { id: 'user-1', email: 'test@example.com' },
      })
      store.set(currentPageAtom, { name: 'app-create' })
      const { result } = renderHook(() => useLogout(), {
        wrapper: createWrapper(store),
      })

      // Act
      act(() => {
        result.current.logout()
      })

      // Assert
      expect(store.get(currentPageAtom)).toEqual({ name: 'login' })
    })
  })

  describe('Boundary Case - authAtom Already Null', () => {
    it('when logout is called and authAtom is already null, then authAtom remains null', () => {
      // Arrange – authAtom starts as null (no prior auth)
      const { result } = renderHook(() => useLogout(), {
        wrapper: createWrapper(store),
      })

      // Act
      act(() => {
        result.current.logout()
      })

      // Assert
      expect(store.get(authAtom)).toBeNull()
    })

    it('when logout is called and authAtom is already null, then currentPageAtom still becomes { name: "login" }', () => {
      // Arrange
      store.set(currentPageAtom, { name: 'landing' })
      const { result } = renderHook(() => useLogout(), {
        wrapper: createWrapper(store),
      })

      // Act
      act(() => {
        result.current.logout()
      })

      // Assert
      expect(store.get(currentPageAtom)).toEqual({ name: 'login' })
    })
  })
})
