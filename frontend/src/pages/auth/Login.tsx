import LoginBrandSection from "../../components/auth/LoginBrandSection";
import LoginForm from "../../components/auth/LoginForm";

function Login() {
  return (
    <main className="min-h-screen bg-slate-100 p-5">
      <div className="mx-auto grid max-w-7xl gap-8 rounded-2xl bg-white p-8 shadow-lg lg:grid-cols-2">
        <LoginBrandSection />
        <LoginForm />
      </div>
    </main>
  );
}

export default Login;
