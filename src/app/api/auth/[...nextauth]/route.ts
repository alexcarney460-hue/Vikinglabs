import NextAuth from 'next-auth';
import { authOptions } from '@/lib/authjs/options';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
