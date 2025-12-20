import React, { useEffect, useState } from "react";
import { 
  Card, 
  Descriptions, 
  Badge, 
  Row, 
  Col, 
  Image, 
  Alert, 
  Tabs, 
  Typography, 
  Avatar, 
  Statistic,
  Divider,
  theme,
  App
} from "antd";
import { 
  UserOutlined, 
  AppstoreOutlined, 
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  StopOutlined
} from "@ant-design/icons";
import http from "../api/http";

const { Title, Text } = Typography;
const { useToken } = theme;

type BadgeStatus = "success" | "processing" | "default" | "error" | "warning";

const statusMap: Record<string, { text: string; status: BadgeStatus; icon: React.ReactNode; color: string }> = {
  PENDING: { text: "待审核", status: "processing", icon: <ClockCircleOutlined />, color: "#faad14" },
  APPROVED: { text: "已通过", status: "success", icon: <CheckCircleOutlined />, color: "#52c41a" },
  REJECTED: { text: "已拒绝", status: "error", icon: <CloseCircleOutlined />, color: "#ff4d4f" },
  DISABLED: { text: "已禁用", status: "warning", icon: <StopOutlined />, color: "#d9d9d9" },
};

const IMAGE_BASE_URL = "http://localhost:3000/uploads/";

const UserDashboard: React.FC = () => {
  const [user, setUser] = useState<any>();
  const [features, setFeatures] = useState<any | null>(null);
  const { message } = App.useApp();
  const { token } = useToken();

  useEffect(() => {
    http
      .get("/api/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => message.error("获取用户信息失败"));

    http
      .get("/api/auth/my-features")
      .then((res) => setFeatures(res.data))
      .catch((err) => {
        // 如果没有找到特征（例如管理员账号），就不提示错误
        if (!(err && err.response && err.response.status === 404)) {
          message.error("获取手指模态特征失败");
        }
      });
  }, []);

  if (!user) return null;

  const statusInfo = statusMap[user.status] || {
    text: user.status,
    status: "default" as BadgeStatus,
    icon: <UserOutlined />,
    color: token.colorTextSecondary
  };

  const tabItems = [
    {
      key: "info",
      label: (
        <span>
          <UserOutlined /> 个人信息
        </span>
      ),
      children: (
        <Card variant="borderless" style={{ boxShadow: 'none' }}>
          <Descriptions 
            column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }} 
            bordered 
            size="middle"
            labelStyle={{ width: '120px', backgroundColor: '#fafafa' }}
          >
            <Descriptions.Item label="用户名">{user.username}</Descriptions.Item>
            <Descriptions.Item label="真实姓名">{user.realName}</Descriptions.Item>
            <Descriptions.Item label="电子邮箱">{user.email}</Descriptions.Item>
            <Descriptions.Item label="手机号码">{user.phone}</Descriptions.Item>
            <Descriptions.Item label="账号状态">
              <Badge status={statusInfo.status} text={statusInfo.text} />
            </Descriptions.Item>
            <Descriptions.Item label="注册时间">{new Date().toLocaleDateString()}</Descriptions.Item> 
          </Descriptions>
        </Card>
      ),
    },
    {
      key: "features",
      label: (
        <span>
          <AppstoreOutlined /> 模态特征
        </span>
      ),
      children: (
        <div style={{ padding: '24px 0' }}>
          {features ? (
            <Row gutter={[24, 24]}>
              <Col xs={24} sm={6}>
                <Card 
                  hoverable 
                  cover={
                    <div style={{ height: 180, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
                      <Image
                        height={180}
                        src={`${IMAGE_BASE_URL}${features.fingerprintPath}`}
                        alt="指纹"
                        style={{ objectFit: 'contain' }}
                      />
                    </div>
                  }
                  styles={{ body: { padding: 12, textAlign: 'center' } }}
                >
                  <Card.Meta title="指纹特征" description="Fingerprint" />
                </Card>
              </Col>
              <Col xs={24} sm={6}>
                <Card 
                  hoverable 
                  cover={
                    <div style={{ height: 180, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
                      <Image
                        height={180}
                        src={`${IMAGE_BASE_URL}${features.fingerVeinPath}`}
                        alt="指静脉"
                        style={{ objectFit: 'contain' }}
                      />
                    </div>
                  }
                  styles={{ body: { padding: 12, textAlign: 'center' } }}
                >
                  <Card.Meta title="指静脉特征" description="Finger Vein" />
                </Card>
              </Col>
              <Col xs={24} sm={6}>
                <Card 
                  hoverable 
                  cover={
                    <div style={{ height: 180, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
                      <Image
                        height={180}
                        src={`${IMAGE_BASE_URL}${features.veinBinPath}`}
                        alt="指静脉二值化"
                        style={{ objectFit: 'contain' }}
                      />
                    </div>
                  }
                  styles={{ body: { padding: 12, textAlign: 'center' } }}
                >
                  <Card.Meta title="指静脉二值化" description="Vein Binarized" />
                </Card>
              </Col>
              <Col xs={24} sm={6}>
                <Card 
                  hoverable 
                  cover={
                    <div style={{ height: 180, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
                      <Image
                        height={180}
                        src={`${IMAGE_BASE_URL}${features.fingerJointPath}`}
                        alt="指节纹"
                        style={{ objectFit: 'contain' }}
                      />
                    </div>
                  }
                  styles={{ body: { padding: 12, textAlign: 'center' } }}
                >
                  <Card.Meta title="指节纹特征" description="Finger Joint" />
                </Card>
              </Col>
            </Row>
          ) : (
            <div style={{ padding: 40, textAlign: "center", background: '#f5f5f5', borderRadius: 8 }}>
              <SafetyCertificateOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
              <div style={{ color: "#999" }}>暂未获取到手指模态图片</div>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {user.status === "PENDING" && (
        <Alert
          type="warning"
          showIcon
          message="当前账号正在审核中"
          description="管理员审核通过后，状态将从待审核变为已通过。审核期间部分功能可能受限。"
          style={{ marginBottom: 24, borderRadius: 8 }}
        />
      )}
      
      {/* 个人资料头部 */}
      <Card 
        variant="borderless" 
        style={{ 
          marginBottom: 24, 
          borderRadius: 16,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' 
        }}
        styles={{
          body: {
            background: `linear-gradient(120deg, ${token.colorPrimary} 0%, #36cfc9 100%)`,
            padding: '32px 40px'
          }
        }}
      >
        <Row gutter={24} align="middle">
          <Col flex="100px">
            <Avatar 
              size={100} 
              icon={<UserOutlined />} 
              style={{ backgroundColor: token.colorPrimary, fontSize: 48 }}
            />
          </Col>
          <Col flex="auto">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <Title level={2} style={{ margin: 0 }}>{user.realName || user.username}</Title>
              <span style={{ 
                background: statusInfo.color, 
                color: '#fff', 
                padding: '4px 12px', 
                borderRadius: 20, 
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}>
                {statusInfo.icon} {statusInfo.text}
              </span>
            </div>
            <div style={{ color: token.colorTextSecondary, fontSize: 16 }}>
              {user.email} | {user.phone}
            </div>
          </Col>
          <Col flex="none">
             <Row gutter={32}>
               <Col>
                 <Statistic title="模态特征" value={features ? 4 : 0} prefix={<AppstoreOutlined />} />
               </Col>
             </Row>
          </Col>
        </Row>
      </Card>

      <Card
        variant="borderless"
        style={{
          borderRadius: 16,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
        }}
        styles={{ body: { padding: 0 } }}
      >
        <Tabs
          defaultActiveKey="info"
          items={tabItems}
          size="large"
          tabBarStyle={{ padding: '0 24px', margin: 0 }}
          style={{ padding: '16px 24px' }}
        />
      </Card>
    </div>
  );
};

export default UserDashboard;
