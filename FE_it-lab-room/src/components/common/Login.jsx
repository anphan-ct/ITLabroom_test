import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import {
  login,
  loginWithGoogle,
  saveAuthSession,
  resolveHomePath,
} from "../../services/auth.service";

export default function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));

    setErrorMessage("");
  };

  const enterDashboard = (authData) => {
    const role = authData?.user?.role?.role_name;

    saveAuthSession(role, authData);
    navigate(resolveHomePath(role), { replace: true });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await login(formData);
      enterDashboard(response.data);
    } catch (error) {
      setErrorMessage(error.message || "Đăng nhập thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setErrorMessage("");

      const response = await loginWithGoogle(
        credentialResponse.credential
      );

      if (response.status) {
        enterDashboard(response.data);
      }
    } catch (error) {
      setErrorMessage(error.message || "Đăng nhập Google thất bại.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F7FB] px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">

        <div className="mb-8 text-center">
          <img
            src="img/logo.png"
            alt="Logo"
            className="mx-auto mb-4 h-20 w-auto"
          />

          <h1 className="text-3xl font-bold text-[#193D87]">
            Đăng nhập
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {errorMessage}
            </div>
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-[#193D87] focus:ring-4 focus:ring-[#193D87]/20"
          />

          <input
            type="password"
            name="password"
            placeholder="Mật khẩu"
            value={formData.password}
            onChange={handleChange}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-[#193D87] focus:ring-4 focus:ring-[#193D87]/20"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-[#193D87] py-3 font-semibold text-white transition hover:bg-[#163774] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        {/* <div className="my-6 flex items-center">
          <div className="h-px flex-1 bg-gray-300"></div>
          <span className="mx-4 text-sm text-gray-500">Hoặc</span>
          <div className="h-px flex-1 bg-gray-300"></div>
        </div>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() =>
              setErrorMessage(
                "Đăng nhập Google thất bại. Vui lòng thử lại."
              )
            }
            theme="outline"
            shape="rectangular"
            useOneTap
          />
        </div> */}
      </div>
    </div>
  );
}