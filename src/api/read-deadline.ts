/** Settle even when a platform storage/read promise never responds. Late results are ignored. */
export async function readWithDeadline<T>(read: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([read, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), timeoutMs);
    })]);
  } finally { clearTimeout(timer); }
}
