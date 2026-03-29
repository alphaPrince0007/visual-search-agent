import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Development Bypass: Provide a guest user if OAuth is not configured/reachable
    if (process.env.NODE_ENV === "development") {
      user = {
        openId: "dev-guest-id",
        name: "Local Developer",
        email: "dev@localhost",
        role: "admin",
        lastSignedIn: new Date(),
        loginMethod: "local",
        createdAt: new Date(),
      } as User;
    } else {
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
