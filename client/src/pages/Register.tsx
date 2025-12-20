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
} from "antd";
import { 
  UserOutlined, 
  LockOutlined, 
  UploadOutlined, 
  MailOutlined,
  PhoneOutlined,
  IdcardOutlined,
  SafetyCertificateOutlined 
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import http from "../api/http";

const { Title, Text } = Typography;
const { useToken } = theme;

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();
  const [files, setFiles] = useState<Record<string, any[]>>({});
  const { token } = useToken();

  const handleRegister = async (values: any) => {
    const formData = new FormData();
    formData.append("username", values.username);
    formData.append("password", values.password);
    if (values.realName) formData.append("realName", values.realName);
    if (values.email) formData.append("email", values.email);
    if (values.phone) formData.append("phone", values.phone);
    
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
      await http.post("/api/auth/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      message.success("注册成功，请等待管理员审核");
      navigate("/login");
    } catch (e: any) {
      message.error(e?.response?.data?.message || "注册失败");
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
              backgroundImage: 'url(https://picsum.photos/2070/1380?random=2)',
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
              background: 'linear-gradient(180deg, rgba(82,196,26,0.8) 0%, rgba(0,21,41,0.9) 100%)',
            }}>
              <SafetyCertificateOutlined style={{ fontSize: 48, color: '#fff', marginBottom: 24 }} />
              <Title level={2} style={{ color: '#fff', margin: '0 0 16px' }}>
                创建您的<br />安全账户
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, lineHeight: 1.8 }}>
                注册后可享受多模态生物特征识别带来的便捷与安全体验。
              </Text>
            </div>
          </Col>

          {/* 右侧表单区 */}
          <Col xs={24} md={14}>
            <div style={{ padding: '40px 60px' }}>
              <div style={{ marginBottom: 24 }}>
                <Title level={3} style={{ marginBottom: 8 }}>账号注册</Title>
                <Text type="secondary">填写信息，创建您的专属账户</Text>
              </div>

              <Form
                form={form}
                layout="vertical"
                size="large"
                onFinish={handleRegister}
                requiredMark={false}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="username"
                      rules={[{ required: true, message: "请输入用户名" }]}
                    >
                      <Input 
                        prefix={<UserOutlined style={{ color: token.colorTextQuaternary }} />} 
                        placeholder="用户名" 
                        style={{ borderRadius: 8 }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="realName"
                    >
                      <Input 
                        prefix={<IdcardOutlined style={{ color: token.colorTextQuaternary }} />} 
                        placeholder="真实姓名（选填）" 
                        style={{ borderRadius: 8 }}
                      />
                    </Form.Item>
                  </Col>
                </Row>

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

                <Form.Item
                  name="confirmPassword"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: "请确认密码" },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('两次输入的密码不一致'));
                      },
                    }),
                  ]}
                >
                  <Input.Password 
                    prefix={<LockOutlined style={{ color: token.colorTextQuaternary }} />} 
                    placeholder="确认密码" 
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="email">
                      <Input 
                        prefix={<MailOutlined style={{ color: token.colorTextQuaternary }} />} 
                        placeholder="邮箱（选填）" 
                        style={{ borderRadius: 8 }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="phone">
                      <Input 
                        prefix={<PhoneOutlined style={{ color: token.colorTextQuaternary }} />} 
                        placeholder="手机号（选填）" 
                        style={{ borderRadius: 8 }}
                      />
                    </Form.Item>
                  </Col>
                </Row>

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
                      background: 'linear-gradient(90deg, #52c41a 0%, #1890ff 100%)',
                      border: 'none',
                      boxShadow: '0 4px 14px 0 rgba(82, 196, 26, 0.3)'
                    }}
                  >
                    立即注册
                  </Button>
                </Form.Item>

                <Divider plain style={{ color: token.colorTextQuaternary, fontSize: 13 }}>
                  必填：上传生物特征图片
                </Divider>

                <Row gutter={[16, 16]}>
                  {['fingerprint', 'vein', 'knuckle'].map((field) => (
                    <Col span={8} key={field}>
                      <Upload {...uploadProps(field)}>
                        <Button 
                          icon={<UploadOutlined />} 
                          block 
                          size="large"
                          style={{ 
                            height: 48,
                            fontSize: 15, 
                            borderRadius: 8,
                            borderColor: files[field]?.length ? token.colorPrimary : token.colorBorder 
                          }}
                        >
                          {field === 'fingerprint' ? '指纹' :
                           field === 'vein' ? '指静脉' : '指节纹'}
                        </Button>
                      </Upload>
                    </Col>
                  ))}
                </Row>
                
                <div style={{ marginTop: 24, textAlign: 'center' }}>
                  <Text type="secondary">已有账号？ </Text>
                  <a onClick={() => navigate('/login')} style={{ fontWeight: 500 }}>立即登录</a>
                </div>
              </Form>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default RegisterPage;
