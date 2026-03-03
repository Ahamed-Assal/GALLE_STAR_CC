import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "admin" | "team_owner" | "scorer" | "public";
    } & DefaultSession["user"];
  }

  interface User {
    role: "admin" | "team_owner" | "scorer" | "public";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "admin" | "team_owner" | "scorer" | "public";
  }
}
