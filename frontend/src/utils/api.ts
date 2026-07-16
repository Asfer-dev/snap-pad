// frontend/src/utils/api.ts
export async function secureFetch(url: string, options: RequestInit = {}) {
  const defaultOptions: RequestInit = {
    ...options,
    credentials: 'include', // This makes the browser send the HttpOnly cookie automatically
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  return fetch(url, defaultOptions);
}
