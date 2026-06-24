import { API_URL, BOT_API_SECRET } from '../config/config';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  method: string,
  path: string,
  userId: string,
  username: string,
  body?: object,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Bot-Secret': BOT_API_SECRET,
      'X-Discord-User-Id': userId,
      'X-Discord-Username': username,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({ message: 'Réponse invalide du serveur' }));

  if (!response.ok) {
    throw new ApiError(response.status, (data as { message?: string }).message ?? 'Erreur inconnue');
  }

  return data as T;
}

export const api = {
  get: <T>(path: string, userId: string, username: string) =>
    request<T>('GET', path, userId, username),

  post: <T>(path: string, userId: string, username: string, body?: object) =>
    request<T>('POST', path, userId, username, body),
};
