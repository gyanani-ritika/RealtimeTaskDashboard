export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 5,
  baseDelay: number = 1000,
): Promise<T> {
  let attempt = 0;

  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt >= maxRetries) {
        throw err;
      }
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise<void>(resolve => setTimeout(resolve, delay));
    }
  }
}
