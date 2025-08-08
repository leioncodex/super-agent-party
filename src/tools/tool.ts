export interface Tool {
  name: string;
  description: string;
  schema: unknown;
  handler: (input: string) => Promise<string> | string;
}
