export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
    credentials: "same-origin",
    cache: "no-store",
  });
  const result = await response
    .json()
    .catch(() => ({ error: "The server could not respond. Please try again." }));
  if (!response.ok) throw new ApiError(result.error || "Request failed", response.status);
  return result as T;
}
