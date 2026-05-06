
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 to-slate-900">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
            <div className="relative z-10 w-full max-w-md p-4">
                <LoginForm />
            </div>
        </div>
    );
}
