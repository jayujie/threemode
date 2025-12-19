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
  Steps
} from "antd";
import { 
  UploadOutlined, 
  UserOutlined, 
  LockOutlined, 
  MailOutlined, 
  PhoneOutlined, 
  IdcardOutlined,
  SafetyCertificateOutlined,
  ArrowLeftOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import http from "../api/http";

const { Title, Text } = Typography;
const { useToken } = theme;

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<Record<string, any[]>>({});
  const { message } = App.useApp();
  const { token } = useToken();
  const [currentStep, setCurrentStep] = useState(0);

  const handleSubmit = async (values: any) => {
    const requiredFields = [
      "fingerprint",
      "vein_aug", 
      "vein_bin",
      "knuckle",
    ];
    for (const field of requiredFields) {
      if (!files[field] || !files[field].length) {
        message.warning("请上传四种手指模态图片");
        return;
      }
    }

    const formData = new FormData();
    Object.entries(values).forEach(([k, v]) => formData.append(k, v as any));
    requiredFields.forEach((field) => {
      formData.append(field, files[field][0].originFileObj);
    });

    try {
      setLoading(true);
      const res = await http.post("/api/auth/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      message.success(res.data?.message || "注册成功，等待审核");
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
          <Col xs={0} md={9} style={{ position: 'relative', background: '#001529' }}>
            <div style={{
              position: 'absolute',
              top: 0, left: 0, width: '100%', height: '100%',
              backgroundImage: 'url(https://picsum.photos/2070/1380?random=2)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.5,
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
              background: 'linear-gradient(180deg, rgba(24,144,255,0.85) 0%, rgba(0,21,41,0.95) 100%)',
            }}>
              <IdcardOutlined style={{ fontSize: 48, color: '#fff', marginBottom: 24 }} />
              <Title level={2} style={{ color: '#fff', margin: '0 0 16px' }}>
                加入我们<br />开启安全之旅
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, lineHeight: 1.8 }}>
                注册成为新用户，体验多模态生物识别技术。
              </Text>
              
              <div style={{ marginTop: 48 }}>
                 <Steps 
                   direction="vertical" 
                   size="small"
                   current={currentStep}
                   items={[
                     { title: <span style={{ color: '#fff' }}>基本信息</span>, description: <span style={{ color: 'rgba(255,255,255,0.6)' }}>填写个人账号资料</span> },
                     { title: <span style={{ color: '#fff' }}>生物特征</span>, description: <span style={{ color: 'rgba(255,255,255,0.6)' }}>上传手指模态图片</span> },
                     { title: <span style={{ color: '#fff' }}>提交审核</span>, description: <span style={{ color: 'rgba(255,255,255,0.6)' }}>等待管理员确认</span> },
                   ]}
                 />
              </div>
            </div>
          </Col>

          {/* 右侧表单区 */}
          <Col xs={24} md={15}>
            <div style={{ padding: '40px 50px', maxHeight: '800px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                  <Title level={3} style={{ marginBottom: 8 }}>创建账号</Title>
                  <Text type="secondary">请填写以下信息完成注册</Text>
                </div>
                <Button 
                  type="text" 
                  icon={<ArrowLeftOutlined />} 
                  onClick={() => navigate('/login')}
                  style={{ color: token.colorTextSecondary }}
                >
                  返回登录
                </Button>
              </div>

              <Form
                layout="vertical"
                size="large"
                onFinish={handleSubmit}
                onValuesChange={(_, allValues) => {
                   // 简单的步骤判断逻辑
                   if (allValues.username && allValues.password && allValues.realName) {
                     setCurrentStep(1);
                   }
                }}
              >
                <Divider orientation="left" style={{ borderColor: token.colorBorderSecondary }}>
                  <Text strong style={{ fontSize: 14, color: token.colorPrimary }}>01. 基本资料</Text>
                </Divider>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="username"
                      rules={[{ required: true, message: "请输入用户名" }]}
                    >
                      <Input prefix={<UserOutlined style={{ color: token.colorTextQuaternary }} />} placeholder="用户名" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="password"
                      rules={[{ required: true, message: "请输入密码" }]}
                    >
                      <Input.Password prefix={<LockOutlined style={{ color: token.colorTextQuaternary }} />} placeholder="密码" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="realName" rules={[{ required: true, message: "请输入姓名" }]}>
                      <Input prefix={<IdcardOutlined style={{ color: token.colorTextQuaternary }} />} placeholder="真实姓名" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="phone">
                      <Input prefix={<PhoneOutlined style={{ color: token.colorTextQuaternary }} />} placeholder="手机号码" />
                    </Form.Item>
                  </Col>
                </Row>
                
                <Form.Item name="email">
                  <Input prefix={<MailOutlined style={{ color: token.colorTextQuaternary }} />} placeholder="电子邮箱地址" />
                </Form.Item>

                <Divider orientation="left" style={{ borderColor: token.colorBorderSecondary, marginTop: 32 }}>
                   <Text strong style={{ fontSize: 14, color: token.colorPrimary }}>02. 生物特征采集</Text>
                </Divider>
                <Text type="secondary" style={{ display: 'block', marginBottom: 16, fontSize: 13 }}>
                  请上传清晰的手指模态图片，这将作为您的身份识别凭证。
                </Text>

                <Row gutter={[16, 16]}>
                  {['fingerprint', 'vein_aug', 'vein_bin', 'knuckle'].map((field) => (
                    <Col span={12} key={field}>
                      <div style={{ 
                        background: token.colorFillAlter, 
                        padding: 12, 
                        borderRadius: 8,
                        border: `1px dashed ${token.colorBorder}`
                      }}>
                        <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 500 }}>
                          {field === 'fingerprint' ? '指纹图片' :
                           field === 'vein_aug' ? '指静脉增强' :
                           field === 'vein_bin' ? '指静脉二值' : '指节纹图片'}
                        </div>
                        <Upload {...uploadProps(field)}>
                          <Button 
                            icon={<UploadOutlined />} 
                            block 
                            size="middle"
                            style={{ 
                              background: '#fff',
                              borderColor: files[field]?.length ? token.colorSuccess : token.colorBorder
                            }}
                          >
                            {files[field]?.length ? '已选择' : '点击上传'}
                          </Button>
                        </Upload>
                      </div>
                    </Col>
                  ))}
                </Row>

                <Form.Item style={{ marginTop: 40 }}>
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
                    提交注册申请
                  </Button>
                </Form.Item>
              </Form>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default RegisterPage;
