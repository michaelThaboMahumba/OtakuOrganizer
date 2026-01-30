declare module "voy-search" {
  export class Voy {
    constructor(data?: any);
    search(query: any, limit?: number): any;
    add(data: any): void;
  }
}

declare module "gradient-string" {
  const gradient: any;
  export default gradient;
}
