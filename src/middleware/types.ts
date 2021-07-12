export type GeneralRequest = {
  method: string;
  url: string;
  headers: Record<string, string>;
  text: () => Promise<string>;
};

export type GeneralResponse = {
  status: number;
  headers?: Record<string, string>;
  text?: string;
};

export type HandlerOptions = {
  pathPrefix?: string;
};
