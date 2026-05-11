import { act, renderHook } from '@testing-library/react'
import { createStore, Provider } from 'jotai'
import { createElement } from 'react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'

import { currentPageAtom, useNavigation } from './navigation'

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

describe('useNavigation', () => {
  let store: TestStore

  beforeEach(() => {
    store = createStore()
  })

  describe('Return Value - Hook API Surface', () => {
    it('when called, then returns an object containing a goToUserProfile function', () => {
      // Arrange + Act
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createWrapper(store),
      })

      // Assert
      expect(typeof (result.current as Record<string, unknown>).goToUserProfile).toBe('function')
    })
  })

  describe('Happy Path - goToUserProfile Navigation', () => {
    it('when goToUserProfile is called, then currentPageAtom is set to { name: "user-profile" }', () => {
      // Arrange
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createWrapper(store),
      })

      // Act
      act(() => {
        ;(result.current as Record<string, unknown> & { goToUserProfile: () => void }).goToUserProfile()
      })

      // Assert
      expect(store.get(currentPageAtom)).toEqual({ name: 'user-profile' })
    })

    it('when goToUserProfile is called from app-list page, then currentPageAtom is overwritten to { name: "user-profile" }', () => {
      // Arrange
      store.set(currentPageAtom, { name: 'app-list' })
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createWrapper(store),
      })

      // Act
      act(() => {
        ;(result.current as Record<string, unknown> & { goToUserProfile: () => void }).goToUserProfile()
      })

      // Assert
      expect(store.get(currentPageAtom)).toEqual({ name: 'user-profile' })
    })

    it('when goToUserProfile is called from app-detail page, then currentPageAtom becomes { name: "user-profile" }', () => {
      // Arrange
      store.set(currentPageAtom, { name: 'app-detail', appId: 'app-123' })
      const { result } = renderHook(() => useNavigation(), {
        wrapper: createWrapper(store),
      })

      // Act
      act(() => {
        ;(result.current as Record<string, unknown> & { goToUserProfile: () => void }).goToUserProfile()
      })

      // Assert
      expect(store.get(currentPageAtom)).toEqual({ name: 'user-profile' })
    })
  })
})
