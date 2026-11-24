import { renderHook, act } from '@testing-library/react';
import { usePersistedState } from './index';

const quotaExceeded = () => {
  throw new DOMException('Setting the value exceeded the quota.', 'QuotaExceededError');
};

describe('usePersistedState', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
  });

  it('persists the value to localStorage', () => {
    const { result } = renderHook(() => usePersistedState({ key: 'scroll', default: 0 }));

    act(() => result.current[1](120));

    expect(result.current[0]).toBe(120);
    expect(localStorage.getItem('scroll')).toBe('120');
  });

  it('keeps the in-memory value when localStorage is full', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(quotaExceeded);
    const { result } = renderHook(() => usePersistedState({ key: 'scroll', default: 0 }));

    expect(() => act(() => result.current[1](120))).not.toThrow();
    expect(result.current[0]).toBe(120);
  });

  it('keeps the in-memory value from a functional update when localStorage is full', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(quotaExceeded);
    const { result } = renderHook(() => usePersistedState({ key: 'count', default: 1 }));

    expect(() => act(() => result.current[1]((prev) => prev + 1))).not.toThrow();
    expect(result.current[0]).toBe(2);
  });
});
