import { Navigate, useLocation } from "react-router-dom";
import { getAuthSession } from "../../services/auth.service";

const loginPaths = {
  admin: "/admin/login",
  teacher: "/teacher/login",
  student: "/student/login",
};

const homePaths = {
  admin: "/admin/users",
  teacher: "/teacher",
  student: "/student",
};

export function ProtectedRoute({ role, children }) {
  const location = useLocation();
  const session = getAuthSession();

  if (!session?.accessToken || session.role !== role) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
}

// Dùng cho trang /login chung: nếu đã đăng nhập rồi (bất kể role nào)
// thì tự chuyển thẳng vào dashboard tương ứng, không cho xem lại trang login.
export function PublicOnlyAnyRoute({ children }) {
  const session = getAuthSession();

  if (session?.accessToken && session.role) {
    return <Navigate to={homePaths[session.role] || "/login"} replace />;
  }

  return children;
}
