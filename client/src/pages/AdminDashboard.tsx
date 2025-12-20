import React, { useEffect, useState } from "react";
import { Table, Button, Card, Typography, Space, Tag, Avatar, Row, Col, theme, App, Modal, Input } from "antd";
import { useNavigate } from "react-router-dom";
import { 
  AuditOutlined, 
  SearchOutlined, 
  UserOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  ClockCircleOutlined 
} from "@ant-design/icons";
import http from "../api/http";

const { Title, Text } = Typography;
const { useToken } = theme;

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectingUserId, setRejectingUserId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const { message, modal } = App.useApp();
  const { token } = useToken();

  const loadPending = async () => {
    try {
      setLoading(true);
      const res = await http.get("/api/admin/users/pending");
      setUsers(res.data || []);
    } catch (e) {
      message.error("获取待审核用户失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const audit = async (id: number, action: "APPROVE" | "REJECT", reason?: string) => {
    try {
      await http.post(`/api/admin/users/${id}/audit`, { action, reason });
      message.success(action === "APPROVE" ? "已通过该用户审核" : "已拒绝该用户申请");
      loadPending();
    } catch (e) {
      message.error("审核操作失败");
    }
  };

  const openRejectModal = (id: number) => {
    setRejectingUserId(id);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  const handleReject = async () => {
    if (rejectingUserId) {
      await audit(rejectingUserId, "REJECT", rejectReason);
      setRejectModalVisible(false);
      setRejectingUserId(null);
      setRejectReason('');
    }
  };

  const columns = [
    {
      title: "申请用户",
      dataIndex: "username",
      key: "username",
      render: (text: string, record: any) => (
        <Space>
          <Avatar style={{ backgroundColor: token.colorPrimary }}>{text[0]?.toUpperCase()}</Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>{text}</div>
            <div style={{ fontSize: 12, color: token.colorTextSecondary }}>ID: {record.id}</div>
          </div>
        </Space>
      ),
    },
    { 
      title: "真实姓名", 
      dataIndex: "realName", 
      key: "realName",
      render: (text: string) => text || <Text type="secondary">-</Text>
    },
    { 
      title: "联系方式", 
      dataIndex: "phone", 
      key: "phone",
      render: (text: string, record: any) => (
        <div>
          <div>{text || "-"}</div>
          <div style={{ fontSize: 12, color: token.colorTextSecondary }}>{record.email}</div>
        </div>
      )
    },
    {
      title: "申请时间",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text: string) => text ? new Date(text).toLocaleString() : "-"
    },
    {
      title: "状态",
      key: "status",
      render: () => <Tag icon={<ClockCircleOutlined />} color="processing">待审核</Tag>
    },
    {
      title: "操作",
      key: "action",
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button
            type="primary"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => audit(record.id, "APPROVE")}
            style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
          >
            通过
          </Button>
          <Button
            type="primary"
            size="small"
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => openRejectModal(record.id)}
          >
            拒绝
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col span={24}>
           <Card
             variant="borderless"
             style={{
               background: `linear-gradient(120deg, ${token.colorPrimary} 0%, #36cfc9 100%)`,
               borderRadius: 16,
               color: '#fff'
             }}
             styles={{ body: { padding: '32px 40px' } }}
           >
             <Row align="middle" justify="space-between">
               <Col>
                 <Title level={2} style={{ color: '#fff', margin: 0 }}>审核管理工作台</Title>
                 <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, display: 'block', marginTop: 8 }}>
                   您好，管理员。当前共有 {users.length} 位新用户等待您的审核。
                 </Text>
               </Col>
               <Col>
                  <Space size="large">
                    <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.2)', padding: '12px 24px', borderRadius: 8 }}>
                      <div style={{ fontSize: 32, fontWeight: 700, lineHeight: 1 }}>{users.length}</div>
                      <div style={{ fontSize: 12, opacity: 0.8 }}>待审核申请</div>
                    </div>
                  </Space>
               </Col>
             </Row>
           </Card>
        </Col>
      </Row>

      <Card
        variant="borderless"
        title={
          <Space>
            <AuditOutlined style={{ color: token.colorPrimary }} />
            <span style={{ fontSize: 16, fontWeight: 600 }}>待审核用户列表</span>
          </Space>
        }
        extra={
          <Space>
            <Button 
              icon={<UserOutlined />} 
              onClick={() => navigate("/dashboard")}
            >
              个人信息
            </Button>
            <Button 
              type="primary" 
              ghost
              icon={<SearchOutlined />} 
              onClick={() => navigate("/search")}
            >
              用户查询
            </Button>
          </Space>
        }
        style={{
          borderRadius: 16,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
        }}
      >
        <Table
          rowKey="id"
          dataSource={users}
          columns={columns}
          loading={loading}
          pagination={{ 
            pageSize: 10,
            showTotal: (total) => `共 ${total} 条记录`,
            showQuickJumper: true
          }}
        />
      </Card>

      <Modal
        title="拒绝申请"
        open={rejectModalVisible}
        onOk={handleReject}
        onCancel={() => setRejectModalVisible(false)}
        okText="确认拒绝"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <div style={{ marginBottom: 12 }}>
          <Text type="secondary">请输入拒绝原因（可选），用户登录时将看到此信息：</Text>
        </div>
        <Input.TextArea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="请输入拒绝原因"
          rows={3}
        />
      </Modal>
    </div>
  );
};

export default AdminDashboard;
