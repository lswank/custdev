/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    user?: {
      username: string;
      email: string;
      role: 'admin' | 'editor' | 'contributor';
    };
    session?: {
      user: App.Locals['user'];
      expiresAt: Date;
    };
  }
}
