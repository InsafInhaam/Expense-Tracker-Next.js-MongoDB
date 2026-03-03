import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/gmail.readonly",
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          // Try to connect to MongoDB, but don't block signin if it fails
          try {
            await connectToDatabase();

            const existingUser = await User.findOne({ email: user.email });

            if (!existingUser) {
              const newUser = await User.create({
                name: user.name,
                email: user.email,
                image: user.image,
              });
              user.id = newUser._id.toString();
            } else {
              user.id = existingUser._id.toString();
            }
          } catch (dbError) {
            console.error(
              "MongoDB connection error (allowing signin anyway):",
              dbError,
            );
            // Generate a temporary ID if database is unavailable
            user.id = `temp-${user.email}`;
          }

          return true;
        } catch (error) {
          console.error("Error during sign in:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // Store user ID in token when user signs in
      if (user) {
        token.id = user.id;
      }

      if (account?.provider === "google") {
        token.accessToken = account.access_token;
      }

      return token;
    },
    async session({ session, token }) {
      // Add user ID from token to session
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }

      if (token.accessToken) {
        session.accessToken = token.accessToken as string;
      }

      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true, // Enable debug mode to see errors
};
