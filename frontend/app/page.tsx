import Link from 'next/link';
import GoogleButton from '@/components/GoogleButton';
import AuthShell, { authPrimaryBtn, authSecondaryBtn, OrDivider } from '@/components/AuthShell';

export default function Home() {
  return (
    <AuthShell>
      <h1 className="text-2xl font-bold text-fg sm:text-3xl">Welcome</h1>
      <p className="mt-2 text-muted">Sign in to see what your friends are up to.</p>

      <div className="mt-8 flex flex-col gap-3">
        <Link href="/Login" className={authPrimaryBtn}>
          Sign in
        </Link>
        <Link href="/Register" className={authSecondaryBtn}>
          Create an account
        </Link>
        <OrDivider />
        <GoogleButton />
      </div>
    </AuthShell>
  );
}
