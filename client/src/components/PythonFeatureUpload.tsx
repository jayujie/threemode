import React, { useState, useEffect } from 'react';
import { Form, Upload, Button, Card, message, Row, Col, Typography, Space, Image, Spin, theme, Empty, Modal } from 'antd';
import { 
  UploadOutlined, 
  DeleteOutlined, 
  CheckCircleOutlined, 
  CloudUploadOutlined,
  ScanOutlined,
  SafetyCertificateOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Title, Text } = Typography;
const { Dragger } = Upload;
const { useToken } = theme;

interface PythonFeatures {
  fingerprintPath?: string;
  veinAugPath?: string;
  veinBinPath?: string;
  knucklePath?: string;
  createdAt?: string;
  updatedAt?: string;
}

const PythonFeatureUpload: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [existingFeatures, setExistingFeatures] = useState<PythonFeatures | null>(null);
  const { token } = useToken();
  const [files, setFiles] = useState<Record<string, any[]>>({});

  useEffect(() => {
    fetchExistingFeatures();
  }, []);

  const fetchExistingFeatures = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get('/api/python-auth/features', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setExistingFeatures(response.data);
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('获取已有特征失败:', error);
      }
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    
    try {
      const formData = new FormData();
      
      // 检查是否所有文件都已上传
      if (!values.fingerprint?.[0] || !values.vein_aug?.[0] || 
          !values.vein_bin?.[0] || !values.knuckle?.[0]) {
        message.error('请上传所有四种手指模态图片');
        setLoading(false);
        return;
      }
      
      formData.append('fingerprint', values.fingerprint[0].originFileObj);
      formData.append('vein_aug', values.vein_aug[0].originFileObj);
      formData.append('vein_bin', values.vein_bin[0].originFileObj);
      formData.append('knuckle', values.knuckle[0].originFileObj);

      const token = localStorage.getItem('token');
      const response = await axios.post('/api/python-auth/register-features', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });

      message.success(response.data.message);
      form.resetFields();
      setFiles({});
      await fetchExistingFeatures(); // 重新获取特征
    } catch (error: any) {
      console.error('模态特征注册失败:', error);
      
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('注册失败，请检查网络连接');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Modal.confirm({
      title: '确认删除特征数据?',
      icon: <ExclamationCircleOutlined />,
      content: '删除后将无法使用模态识别登录，需要重新上传特征数据。',
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const token = localStorage.getItem('token');
          await axios.delete('/api/python-auth/features', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          message.success('模态特征删除成功');
          setExistingFeatures(null);
        } catch (error: any) {
          console.error('删除失败:', error);
          message.error(error.response?.data?.message || '删除失败');
        }
      },
    });
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
    showUploadList: false
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
           height={120}
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

  const FeaturePreview = ({ title, src }: { title: string, src?: string }) => (
    <div style={{ 
      background: '#fafafa', 
      borderRadius: 8, 
      padding: 12, 
      border: `1px solid ${token.colorBorderSecondary}`,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <div style={{ 
        width: '100%', 
        height: 140, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#fff',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8
      }}>
        <Image
          src={src}
          alt={title}
          style={{ objectFit: 'contain', maxHeight: 140, maxWidth: '100%' }}
          fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        />
      </div>
      <Text style={{ fontSize: 13, fontWeight: 500 }}>{title}</Text>
    </div>
  );

  if (fetchLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">正在加载已有特征...</Text>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      {existingFeatures ? (
        <Card 
          variant="borderless"
          style={{ boxShadow: 'none', background: 'transparent' }}
          styles={{ body: { padding: 0 } }}
        >
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 24,
            background: '#f6ffed',
            border: '1px solid #b7eb8f',
            padding: '12px 24px',
            borderRadius: 8
          }}>
             <Space>
               <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />
               <div>
                 <Text strong style={{ color: '#1f1f1f' }}>已注册模态特征</Text>
                 <div style={{ fontSize: 12, color: '#666' }}>
                   注册时间: {existingFeatures.createdAt ? new Date(existingFeatures.createdAt).toLocaleString() : '-'}
                 </div>
               </div>
             </Space>
             <Button 
                danger 
                type="text"
                icon={<DeleteOutlined />} 
                onClick={handleDelete}
             >
               删除数据
             </Button>
          </div>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <FeaturePreview title="指纹" src={existingFeatures.fingerprintPath} />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <FeaturePreview title="静脉增强" src={existingFeatures.veinAugPath} />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <FeaturePreview title="静脉二值" src={existingFeatures.veinBinPath} />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <FeaturePreview title="指节纹" src={existingFeatures.knucklePath} />
            </Col>
          </Row>
        </Card>
      ) : (
        <Card
          variant="borderless"
          style={{ boxShadow: 'none' }}
        >
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <CloudUploadOutlined style={{ fontSize: 48, color: token.colorPrimary, marginBottom: 16 }} />
            <Title level={4} style={{ margin: 0 }}>上传模态特征数据</Title>
            <Text type="secondary">请上传您的四种手指模态图片以启用高级识别功能</Text>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            size="large"
            requiredMark={false}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <UploadCard field="fingerprint" label="指纹" icon={<UploadOutlined />} />
              </Col>
              <Col xs={24} sm={12}>
                <UploadCard field="vein_aug" label="静脉增强" icon={<ScanOutlined />} />
              </Col>
              <Col xs={24} sm={12}>
                <UploadCard field="vein_bin" label="静脉二值" icon={<ScanOutlined />} />
              </Col>
              <Col xs={24} sm={12}>
                <UploadCard field="knuckle" label="指节纹" icon={<SafetyCertificateOutlined />} />
              </Col>
            </Row>

            <Form.Item style={{ marginTop: 32, textAlign: 'center' }}>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                icon={<CloudUploadOutlined />}
                style={{ height: 40, padding: '0 32px', borderRadius: 20 }}
              >
                {loading ? '上传处理中...' : '提交特征数据'}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )}
    </div>
  );
};

export default PythonFeatureUpload;
