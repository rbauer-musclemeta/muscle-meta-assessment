/**
 * Convex + Clerk Authentication Configuration
 * This tells Convex to validate JWTs issued by Clerk.
 * Replace CLERK_JWT_ISSUER_DOMAIN with your actual Clerk domain
 * found at: Clerk Dashboard → API Keys → JWT Templates
 */
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
