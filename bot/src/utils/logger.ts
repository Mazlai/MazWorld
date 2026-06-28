type LogLevel = 'info' | 'warn' | 'error' | 'command';

const EMOJI: Record<LogLevel, string> = {
  info:    '📋',
  warn:    '⚠️ ',
  error:   '❌',
  command: '⚡',
};

function ts(): string {
  return new Date().toISOString();
}

function fmt(level: LogLevel, message: string, data?: Record<string, unknown>): string {
  const suffix = data ? ` | ${JSON.stringify(data)}` : '';
  return `[${ts()}] ${EMOJI[level]} ${message}${suffix}`;
}

export const logger = {
  info(message: string, data?: Record<string, unknown>): void {
    console.log(fmt('info', message, data));
  },

  warn(message: string, data?: Record<string, unknown>): void {
    console.warn(fmt('warn', message, data));
  },

  error(message: string, error?: unknown, data?: Record<string, unknown>): void {
    const errData: Record<string, unknown> = { ...data };
    if (error instanceof Error) {
      errData.error = error.message;
      errData.name = error.name;
    } else if (error !== undefined) {
      errData.error = String(error);
    }
    console.error(fmt('error', message, Object.keys(errData).length ? errData : undefined));
  },

  command(
    name: string,
    userId: string,
    username: string,
    guildId: string | null,
    success: boolean,
    ms?: number,
  ): void {
    console.log(fmt('command', `/${name}`, {
      userId,
      username,
      guildId,
      success,
      ...(ms !== undefined ? { ms } : {}),
    }));
  },
};
