import type { NextAuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID ?? '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
      // `repo` is required to read commits from private repos; `read:user`
      // gives us a stable numeric id for history association.
      authorization: { params: { scope: 'read:user repo' } },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      if (profile) {
        // GitHub numeric id — stable key for the changelogs.user_id column.
        token.githubId = String((profile as { id: number }).id);
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.githubId = token.githubId as string | undefined;
      return session;
    },
  },
};
