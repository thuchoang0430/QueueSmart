import RegisterBrandSection from "../../components/auth/RegisterBrandSection";
import RegisterForm from "../../components/auth/RegisterForm";

function Register() {
  return (
    <main className="min-h-screen bg-slate-100 p-5">
      <div className="mx-auto grid w-full max-w-7xl gap-8 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-7 shadow-lg lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
        <RegisterBrandSection />
        <RegisterForm />
      </div>
    </main>
  );
}

export default Register;
