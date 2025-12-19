import React, { useState, useEffect } from "react";
import { Layout, Menu, ConfigProvider, theme } from "antd";
import { UserOutlined, LoginOutlined, FormOutlined, ScanOutlined, LogoutOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import PythonLogin from "./pages/PythonLogin";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import SearchViewPage from "./pages/SearchViewPage";
import "antd/dist/reset.css";

const { Header, Content, Footer } = Layout;

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 检查用户登录状态
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    const loggedIn = !!token && !!user;
    setIsLoggedIn(loggedIn);
    
    // 如果已登录且访问认证页面，自动跳转到对应仪表板
    if (loggedIn && (location.pathname === "/" || location.pathname === "/login" || location.pathname === "/register" || location.pathname === "/python-login")) {
      try {
        const userData = JSON.parse(user || "{}");
        const userRole = userData.role;
        switch (userRole) {
          case 'SUPER_ADMIN':
            navigate('/super-admin');
            break;
          case 'ADMIN':
            navigate('/admin');
            break;
          default:
            navigate('/dashboard');
        }
      } catch (error) {
        console.error('用户数据解析失败:', error);
        navigate('/dashboard');
      }
    }
    
    // 如果未登录且访问受保护页面，跳转到登录页
    if (!loggedIn && !["/", "/login", "/register", "/python-login"].includes(location.pathname)) {
      navigate('/login');
    }
  }, [location.pathname, navigate]);

  const isAuthPage = !isLoggedIn && (
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    location.pathname === "/python-login" ||
    location.pathname === "/"
  );

  const selectedMenuKey = React.useMemo(() => {
    if (!isAuthPage) return "";
    if (location.pathname.startsWith("/register")) return "register";
    if (location.pathname.startsWith("/python-login")) return "python-login";
    return "login";
  }, [location.pathname, isAuthPage]);

  const menuItems = React.useMemo(
    () =>
      isAuthPage
        ? [
            { key: "login", label: "账号登录", icon: <LoginOutlined /> },
            { key: "python-login", label: "模态识别登录", icon: <ScanOutlined /> },
            { key: "register", label: "账号注册", icon: <FormOutlined /> },
          ]
        : [
            { key: "back", label: "返回", icon: <ArrowLeftOutlined /> },
            { key: "logout", label: "退出登录", icon: <LogoutOutlined /> },
          ],
    [isAuthPage]
  );

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#1890ff",
          borderRadius: 6,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
        },
        algorithm: theme.defaultAlgorithm,
      }}
    >
      <Layout
        style={{
          minHeight: "100vh",
          background: "#f0f2f5",
        }}
      >
        <Header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 1,
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingInline: 24,
            background: "#ffffff",
            boxShadow: "0 1px 4px rgba(0, 21, 41, 0.08)",
            height: 64,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              color: "#1890ff",
              fontSize: 20,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.3s",
            }}
            onClick={() => navigate("/")}
          >
            <div style={{
              background: "linear-gradient(135deg, #1890ff 0%, #36cfc9 100%)",
              width: 32,
              height: 32,
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff"
            }}>
              <UserOutlined style={{ fontSize: 18 }} />
            </div>
            <span style={{ color: "#001529", letterSpacing: 0.5 }}>BioAuth<span style={{ color: "#1890ff" }}>System</span></span>
          </div>
          <Menu
            mode="horizontal"
            selectedKeys={isAuthPage ? [selectedMenuKey] : []}
            items={menuItems}
            style={{ 
              background: "transparent", 
              borderBottom: "none",
              minWidth: 400,
              justifyContent: "flex-end",
              fontSize: 15,
              fontWeight: 500
            }}
            onClick={(info) => {
              if (isAuthPage) {
                if (info.key === "login") navigate("/login");
                if (info.key === "python-login") navigate("/python-login");
                if (info.key === "register") navigate("/register");
              } else {
                if (info.key === "back") {
                  if (window.history.length > 1) {
                    navigate(-1);
                  } else {
                    navigate("/login");
                  }
                }
                if (info.key === "logout") {
                  localStorage.removeItem("token");
                  navigate("/login");
                }
              }
            }}
          />
        </Header>
        <Content
          style={{
            backgroundColor: "#f6f7f9",
            minHeight: "calc(100vh - 64px)",
            overflow: "auto",
            transition: "all 0.3s ease-in-out",
          }}
        >
          <div 
            style={{ 
              padding: "24px",
              animation: "fadeIn 0.6s ease-in-out",
            }}
          >
            <Routes>
              <Route path="/" element={<LoginPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/python-login" element={<PythonLogin />} />
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/super-admin" element={<SuperAdminDashboard />} />
              <Route path="/search" element={<SearchViewPage />} />
              <Route path="*" element={<LoginPage />} />
            </Routes>
          </div>
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            
            .ant-card {
              transition: all 0.3s ease;
            }
            
            .ant-card:hover {
              transform: translateY(-2px);
              box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
            }
            
            .ant-btn {
              transition: all 0.2s ease;
            }
            
            .ant-btn:hover {
              transform: translateY(-1px);
            }
            
            .ant-upload-list-item {
              transition: all 0.3s ease;
            }
            
            .ant-table-row {
              transition: background-color 0.2s ease;
            }
            
            .ant-modal {
              animation: modalFadeIn 0.3s ease-out;
            }
            
            @keyframes modalFadeIn {
              from { opacity: 0; transform: scale(0.95); }
              to { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </Content>
        <Footer style={{ textAlign: 'center', color: '#8c8c8c', background: 'transparent' }}>
          BioAuth System {new Date().getFullYear()} Created by HIT Team | 
          <span style={{ marginLeft: 8 }}>多模态生物特征识别</span>
        </Footer>
      </Layout>
    </ConfigProvider>
  );
};

export default App;

