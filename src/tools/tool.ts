export interface Tool {
  name: string;
  description: string;
  handler: (input: string) => Promise<string> | string;
}
