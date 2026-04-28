const debounceTimers = new Map()

export function debounce(key, fn, delay = 1000) {
  return function (...args) {
    if (debounceTimers.has(key)) {
      clearTimeout(debounceTimers.get(key))
    }

    debounceTimers.set(
      key,
      setTimeout(() => {
        fn.apply(this, args)
        debounceTimers.delete(key)
      }, delay)
    )
  }
}

export function cancelDebounce(key) {
  if (debounceTimers.has(key)) {
    clearTimeout(debounceTimers.get(key))
    debounceTimers.delete(key)
  }
}

export function debounceAsync(key, fn, delay = 1000) {
  return async function (...args) {
    if (debounceTimers.has(key)) {
      clearTimeout(debounceTimers.get(key))
    }

    return new Promise((resolve, reject) => {
      debounceTimers.set(
        key,
        setTimeout(async () => {
          try {
            const result = await fn.apply(this, args)
            resolve(result)
          } catch (error) {
            reject(error)
          } finally {
            debounceTimers.delete(key)
          }
        }, delay)
      )
    })
  }
}

export function throttle(key, fn, delay = 1000) {
  let lastCall = 0

  return function (...args) {
    const now = Date.now()
    if (now - lastCall < delay) {
      return
    }
    lastCall = now
    return fn.apply(this, args)
  }
}
