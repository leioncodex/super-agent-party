export interface Tool {
  name: string;
  description: string;
  schema: unknown;
  handler: (input: string) => Promise<string> | string;

  schema: object;
  handler: (input: any) => Promise<any> | any;
}
