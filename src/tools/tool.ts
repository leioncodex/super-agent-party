export interface Tool {
  name: string;
  description: string;
  schema: object;
  handler: (input: any) => Promise<any> | any;
}
