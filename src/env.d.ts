/// <reference types="astro/client" />
/// <reference path="../worker-configuration.d.ts" />

type UserRole = "admin" | "client";

interface UserRecord {
  id: string;
  email: string;
  role: UserRole;
}

interface SessionRecord {
  id: string;
  userId: string;
  expiresAt: number;
  impersonatingClientId: string | null;
}

interface ClientRecord {
  id: string;
  userId: string;
  companyName: string;
  contactName: string | null;
  phone: string | null;
}

declare namespace App {
  interface Locals {
    user: UserRecord | null;
    session: SessionRecord | null;
    impersonatedClient: ClientRecord | null;
  }
}
