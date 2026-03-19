export type JwtPayload = {
  id: string;
  email: string;
};

export type Context = {
  user: JwtPayload | null;
};
