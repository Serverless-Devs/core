import ora, { Ora } from 'ora';

export default function spinner(message: any): Ora {
  return ora({ text: message, stream: process.stdout }).start();
}
