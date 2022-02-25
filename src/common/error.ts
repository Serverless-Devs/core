export class CatchableError extends Error {
  constructor(tips, message?: string) {
    super(
      JSON.stringify({
        message,
        tips,
      }),
    );
    this.name = 'CatchableError';
  }
}
