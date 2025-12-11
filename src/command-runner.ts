import ora, { Ora } from 'ora';
import chalk from 'chalk';

type FailMessage = string | ((error: unknown) => string);

interface SpinnerOptions {
  failMessage?: FailMessage;
}

/**
 * Wraps command logic with a managed spinner and consistent error handling.
 */
export async function withSpinner<T>(
  message: string,
  action: (spinner: Ora) => Promise<T>,
  options?: SpinnerOptions,
): Promise<T> {
  const spinner = ora(message).start();
  try {
    const result = await action(spinner);
    if (spinner.isSpinning) {
      spinner.stop();
    }
    return result;
  } catch (error) {
    const failureText = resolveFailMessage(error, options?.failMessage);
    if (spinner.isSpinning) {
      spinner.fail(chalk.red(failureText));
    } else {
      console.error(chalk.red(failureText));
    }
    throw error;
  }
}

function resolveFailMessage(error: unknown, failMessage?: FailMessage): string {
  const defaultMessage = error instanceof Error ? error.message : String(error);
  if (!failMessage) {
    return defaultMessage;
  }

  if (typeof failMessage === 'function') {
    return failMessage(error);
  }

  return `${failMessage}: ${defaultMessage}`;
}
