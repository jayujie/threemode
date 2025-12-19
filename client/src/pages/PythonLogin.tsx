import React, { useState } from 'react';
import { 
  Form, 
  Input, 
  Upload, 
  Button, 
  Card, 
  Row, 
  Col, 
  Typography, 
  Space, 
  App,
  theme,
  Divider,
  Tag
} from 'antd';
import { 
  UploadOutlined, 
  LockOutlined, 
  UserOutlined, 
  ScanOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined,
  ArrowLeftOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Title, Text } = Typography;
const { Dragger } = Upload;
const { useToken } = theme;

interface PythonLoginForm {
  username: string;
  password: string;
  fingerprint: any[];
  vein_aug: any[];
  vein_bin: any[];
  knuckle: any[];
}

const PythonLogin: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { token } = useToken();
  const [files, setFiles] = useState<Record<string, any[]>>({});

  const handleSubmit = async (values: PythonLoginForm) => {
    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('username', values.username);
      formData.append('password', values.password);
      
      // 检查是否所有文件都已上传
      if (!values.fingerprint?.[0]?.originFileObj || !values.vein_aug?.[0]?.originFileObj || 
          !values.vein_bin?.[0]?.originFileObj || !values.knuckle?.[0]?.originFileObj) {
        message.error('请上传所有四种手指模态图片');
        setLoading(false);
        return;
      }
      
      formData.append('fingerprint', values.fingerprint[0].originFileObj);
      formData.append('vein_aug', values.vein_aug[0].originFileObj);
      formData.append('vein_bin', values.vein_bin[0].originFileObj);
      formData.append('knuckle', values.knuckle[0].originFileObj);

      const response = await axios.post('/api/python-auth/login', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user)); // 确保保存用户信息
        
        // 显示详细的识别结果
        const recognition = response.data.recognition;
        const matchRate = (recognition.matchProbability * 100).toFixed(1);
        const confidence = (recognition.confidence * 100).toFixed(1);
        
        message.success({
          content: (
            <div>
              <div style={{ fontWeight: 'bold', color: '#52c41a', fontSize: 16, marginBottom: 8 }}>
                <CheckCircleOutlined /> 模态认证通过
              </div>
              <div style={{ fontSize: '13px', color: '#666' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                   <span>匹配概率:</span>
                   <span style={{ fontWeight: 600 }}>{matchRate}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                   <span>置信度:</span>
                   <span style={{ fontWeight: 600 }}>{confidence}%</span>
                </div>
              </div>
            </div>
          ),
          duration: 5,
        });
        
        // 根据用户角色跳转
        const userRole = response.data.user.role;
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
      }
    } catch (error: any) {
      console.error('模态登录失败:', error);
      
      if (error.response?.data?.details) {
        const details = error.response.data.details;
        const matchRate = (details.matchProbability * 100).toFixed(1);
        const confidence = (details.confidence * 100).toFixed(1);
        
        message.error({
          content: (
            <div>
              <div style={{ fontWeight: 'bold', color: '#ff4d4f', fontSize: 16, marginBottom: 8 }}>
                 认证失败
              </div>
              <div style={{ fontSize: '13px', color: '#666' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                   <span>匹配概率:</span>
                   <span>{matchRate}%</span>
                </div>
                {details.reason && (
                  <div style={{ color: '#ff4d4f', marginTop: 8 }}>
                    原因: {details.reason}
                  </div>
                )}
              </div>
            </div>
          ),
          duration: 8,
        });
      } else if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('登录失败，请检查网络连接');
      }
    } finally {
      setLoading(false);
    }
  };

  const uploadProps = (field: string) => ({
    maxCount: 1,
    accept: 'image/*',
    beforeUpload: () => false,
    onRemove: () => {
      setFiles((prev) => {
        const newFiles = { ...prev };
        delete newFiles[field];
        return newFiles;
      });
      return true;
    },
    onChange: (info: any) => {
       if (info.fileList.length > 0) {
         setFiles((prev) => ({ ...prev, [field]: info.fileList }));
       } else {
         setFiles((prev) => {
            const newFiles = { ...prev };
            delete newFiles[field];
            return newFiles;
         });
       }
    },
    showUploadList: false // 自定义显示已上传状态
  });

  const UploadCard = ({ field, label, icon }: { field: string; label: string; icon: React.ReactNode }) => {
    const hasFile = files[field]?.length > 0;
    
    return (
       <Form.Item
          name={field}
          valuePropName="fileList"
          getValueFromEvent={(e) => e?.fileList}
          style={{ marginBottom: 0 }}
       >
         <Dragger 
           {...uploadProps(field)} 
           style={{ 
             padding: 16, 
             background: hasFile ? 'rgba(82, 196, 26, 0.04)' : '#fafafa',
             border: hasFile ? `1px solid ${token.colorSuccess}` : `1px dashed ${token.colorBorder}`,
             borderRadius: 8,
             transition: 'all 0.3s'
           }}
           height={110}
         >
           <div style={{ color: hasFile ? token.colorSuccess : token.colorTextSecondary }}>
             <div style={{ fontSize: 24, marginBottom: 8 }}>
               {hasFile ? <CheckCircleOutlined /> : icon}
             </div>
             <div style={{ fontSize: 13, fontWeight: 500 }}>
               {hasFile ? `${label}已就绪` : `上传${label}`}
             </div>
             {!hasFile && (
               <div style={{ fontSize: 12, marginTop: 4, opacity: 0.6 }}>
                 点击或拖拽
               </div>
             )}
           </div>
         </Dragger>
       </Form.Item>
    );
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '40px 0'
    }}>
      <Card 
        variant="borderless"
        style={{ 
          width: 1000, 
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          padding: 0
        }}
        styles={{ body: { padding: 0 } }}
      >
        <Row>
          {/* 左侧视觉区 */}
          <Col xs={0} md={9} style={{ position: 'relative', background: '#001529' }}>
            <div style={{
              position: 'absolute',
              top: 0, left: 0, width: '100%', height: '100%',
              backgroundImage: 'url(https://picsum.photos/2070/1380?random=3)',
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
              <ScanOutlined style={{ fontSize: 48, color: '#fff', marginBottom: 24 }} />
              <Title level={2} style={{ color: '#fff', margin: '0 0 16px' }}>
                生物模态<br />智能识别
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, lineHeight: 1.8 }}>
                基于深度学习的多特征融合验证算法，提供精准的认证体验。
              </Text>
              
              <div style={{ marginTop: 48, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Tag color="blue" style={{ padding: '4px 10px' }}>准确率高</Tag>
                <Tag color="cyan" style={{ padding: '4px 10px' }}>安全性好</Tag>
                {/* <Tag color="geekblue" style={{ padding: '4px 10px' }}>智能</Tag> */}
              </div>
            </div>
          </Col>

          {/* 右侧表单区 */}
          <Col xs={24} md={15}>
            <div style={{ padding: '40px 50px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                   <Title level={3} style={{ marginBottom: 8 }}>模态认证</Title>
                   <Text type="secondary">请上传您的手指模态图片以验证身份</Text>
                </div>
                <Button 
                   type="text" 
                   icon={<ArrowLeftOutlined />} 
                   onClick={() => navigate('/login')}
                   style={{ color: token.colorTextSecondary }}
                >
                   返回
                </Button>
              </div>

              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                size="large"
                requiredMark={false}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="username"
                      rules={[{ required: true, message: '请输入用户名' }]}
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
                      name="password"
                      rules={[{ required: true, message: '请输入密码' }]}
                    >
                      <Input.Password 
                        prefix={<LockOutlined style={{ color: token.colorTextQuaternary }} />}
                        placeholder="密码" 
                        style={{ borderRadius: 8 }}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Divider plain style={{ margin: '16px 0 24px' }}>
                   <Space style={{ fontSize: 13, color: token.colorTextSecondary }}>
                     <ThunderboltOutlined style={{ color: token.colorPrimary }} /> 
                     生物特征上传
                   </Space>
                </Divider>
                
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <UploadCard field="fingerprint" label="指纹" icon={<UploadOutlined />} />
                  </Col>
                  <Col span={12}>
                    <UploadCard field="vein_aug" label="静脉增强" icon={<ScanOutlined />} />
                  </Col>
                  <Col span={12}>
                    <UploadCard field="vein_bin" label="静脉二值" icon={<ScanOutlined />} />
                  </Col>
                  <Col span={12}>
                    <UploadCard field="knuckle" label="指节纹" icon={<SafetyCertificateOutlined />} />
                  </Col>
                </Row>

                <Form.Item style={{ marginTop: 32, marginBottom: 0 }}>
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
                      background: 'linear-gradient(90deg, #1890ff 0%, #096dd9 100%)',
                      border: 'none',
                      boxShadow: '0 4px 14px 0 rgba(24, 144, 255, 0.3)'
                    }}
                  >
                    {loading ? '正在智能识别...' : '开始认证'}
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

export default PythonLogin;
