import { betterAuth } from "better-auth"
import { MongoClient } from "mongodb"
import { mongodbAdapter } from "@better-auth/mongo-adapter"

const client = new MongoClient(process.env.MONGO_URI as string)
const db = client.db("WedPlan")

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
  },
  //   socialProviders: {
  //     google: {
  //       clientId: process.env.GOOGLE_CLIENT_ID as string,
  //       clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
  //     },
  //   },
  database: mongodbAdapter(db, {
    client,
  }),
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
  //   plugins: [jwt()],
  //   session: {
  //     cookieCache: {
  //       enabled: true,
  //       strategy: "jwt",
  //       maxAge: 7 * 24 * 60 * 60,
  //     },
  //   },
})
