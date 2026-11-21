import { betterAuth } from "better-auth"
import { jwt } from "better-auth/plugins"
import { MongoClient } from "mongodb"
import { mongodbAdapter } from "@better-auth/mongo-adapter"

const client = new MongoClient(process.env.MONGO_URI as string)
const db = client.db("WedPlan")

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  database: mongodbAdapter(db, {
    client,
  }),
  // Defence in depth: a public request can only create a customer or vendor,
  // and can never promote itself to admin. Admins are assigned directly in the
  // database, as required by the assignment brief.
  databaseHooks: {
    user: {
      create: {
        before: async (user) => ({
          data: {
            ...user,
            role: user.role === "vendor" ? "vendor" : "customer",
            isBlocked: false,
            subscriptionPlan: "free",
          },
        }),
      },
      update: {
        before: async (user) => {
          if (
            user.role !== undefined &&
            user.role !== "customer" &&
            user.role !== "vendor"
          ) {
            const sanitized = { ...user }
            delete sanitized.role
            return { data: sanitized }
          }
          return { data: user }
        },
      },
    },
  },
  user: {
    additionalFields: {
      // Role drives dashboards and server authorization. Public sign-up only
      // ever provides "customer" or "vendor"; admins are assigned directly in
      // the database, never through public registration.
      role: {
        type: "string",
        required: false,
        defaultValue: "customer",
        input: true,
      },
      isBlocked: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
      businessName: {
        type: "string",
        required: false,
        input: true,
      },
      subscriptionPlan: {
        type: "string",
        required: false,
        defaultValue: "free",
        input: false,
      },
      subscriptionExpiresAt: {
        type: "date",
        required: false,
        input: false,
      },
    },
  },
  plugins: [
    // Issues short-lived, asymmetric JWTs from the current session. The Express
    // API verifies these tokens against the public JWKS endpoint, so every API
    // call is authenticated independently of the browser cookie.
    jwt({
      jwt: {
        issuer: process.env.BETTER_AUTH_URL,
        audience: "wedplan-api",
        expirationTime: "10m",
        definePayload: ({ user }) => ({
          name: user.name,
          email: user.email,
          role: user.role ?? "customer",
          isBlocked: Boolean(user.isBlocked),
          subscriptionPlan: user.subscriptionPlan ?? "free",
        }),
      },
    }),
  ],
})
