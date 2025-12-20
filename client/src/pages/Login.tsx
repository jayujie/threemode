import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  Upload,
  Card,
  Typography,
  Row,
  Col,
  Divider,
  App,
  theme,
  ConfigProvider,
  Checkbox
} from "antd";
import { 
  UserOutlined, 
  LockOutlined, 
  UploadOutlined, 
  LoginOutlined, 
  SafetyCertificateOutlined 
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import http from "../api/http";

const { Title, Text } = Typography;
const { useToken } = theme;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();
  const [files, setFiles] = useState<Record<string, any[]>>({});
  const { token } = useToken();

  const handleLogin = async (values: any) => {
    const formData = new FormData();
    formData.append("username", values.username);
    formData.append("password", values.password);
    if (files.fingerprint?.length) {
      formData.append("fingerprint", files.fingerprint[0].originFileObj);
    }
    if (files.vein?.length) {
      formData.append("vein", files.vein[0].originFileObj);
    }
    if (files.knuckle?.length) {
      formData.append("knuckle", files.knuckle[0].originFileObj);
    }

    try {
      setLoading(true);
      const res = await http.post("/api/auth/login", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const { token, user } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      message.success("登录成功");
      if (user.role === "USER") navigate("/dashboard");
      else if (user.role === "ADMIN") navigate("/admin");
      else navigate("/super-admin");
    } catch (e: any) {
      message.error(e?.response?.data?.message || "登录失败");
    } finally {
      setLoading(false);
    }
  };

  const uploadProps = (field: string) => ({
    beforeUpload: () => false,
    fileList: files[field] || [],
    maxCount: 1,
    onChange: ({ fileList }: any) =>
      setFiles((prev) => ({ ...prev, [field]: fileList })),
    showUploadList: { showPreviewIcon: false, showRemoveIcon: true },
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 0",
      }}
    >
      <Card
        variant="borderless"
        style={{
          width: 1000,
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          padding: 0,
        }}
        styles={{ body: { padding: 0 } }}
      >
        <Row>
          {/* 左侧视觉区 */}
          <Col xs={0} md={10} style={{ position: 'relative', background: '#001529' }}>
            <div style={{
              position: 'absolute',
              top: 0, left: 0, width: '100%', height: '100%',
              backgroundImage: 'url(https://picsum.photos/2070/1380?random=1)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.6,
              mixBlendMode: 'overlay'
            }} />
            <div style={{
              position: 'relative',
              zIndex: 1,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: 40,
              background: 'linear-gradient(180deg, rgba(24,144,255,0.8) 0%, rgba(0,21,41,0.9) 100%)',
            }}>
              <SafetyCertificateOutlined style={{ fontSize: 48, color: '#fff', marginBottom: 24 }} />
              <Title level={2} style={{ color: '#fff', margin: '0 0 16px' }}>
                安全可靠的<br />身份认证系统
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, lineHeight: 1.8 }}>
                集成指纹、静脉、指节纹等多模态生物特征识别技术，为您提供金融级的安全防护。
              </Text>
            </div>
          </Col>

          {/* 右侧表单区 */}
          <Col xs={24} md={14}>
            <div style={{ padding: '50px 60px' }}>
              <div style={{ marginBottom: 32 }}>
                <Title level={3} style={{ marginBottom: 8 }}>账号登录</Title>
                <Text type="secondary">欢迎回来，请验证您的身份</Text>
              </div>

              <Form
                layout="vertical"
                size="large"
                onFinish={handleLogin}
                requiredMark={false}
              >
                <Form.Item
                  name="username"
                  rules={[{ required: true, message: "请输入用户名" }]}
                >
                  <Input 
                    prefix={<UserOutlined style={{ color: token.colorTextQuaternary }} />} 
                    placeholder="用户名 / 手机号 / 邮箱" 
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  rules={[{ required: true, message: "请输入密码" }]}
                >
                  <Input.Password 
                    prefix={<LockOutlined style={{ color: token.colorTextQuaternary }} />} 
                    placeholder="密码" 
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                   <Checkbox>记住我</Checkbox>
                   <a style={{ color: token.colorPrimary }}>忘记密码？</a>
                </div>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    block
                    style={{ 
                      height: 48, 
                      borderRadius: 8, 
                      fontSize: 16, 
                      fontWeight: 600,
                      boxShadow: '0 4px 14px 0 rgba(24, 144, 255, 0.3)'
                    }}
                  >
                    立即登录
                  </Button>
                </Form.Item>

                <div style={{ marginTop: 24, textAlign: 'center' }}>
                  <Text type="secondary">还没有账号？ </Text>
                  <a onClick={() => navigate('/register')} style={{ fontWeight: 500 }}>立即注册</a>
                </div>
              </Form>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default LoginPage;
