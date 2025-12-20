import React, { useEffect, useState } from "react";
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Card, 
  Space, 
  Tag, 
  Row, 
  Col,
  Statistic,
  Typography,
  Avatar,
  Divider,
  theme,
  App,
  Tooltip
} from "antd";
import { useNavigate } from "react-router-dom";
import { 
  TeamOutlined, 
  SolutionOutlined, 
  UserOutlined,
  CrownOutlined,
  SafetyCertificateOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  StopOutlined,
  SettingOutlined
} from "@ant-design/icons";
import http from "../api/http";

const { Option } = Select;
const { Title, Text } = Typography;
const { useToken } = theme;

const roleConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  USER: { color: "blue", label: "普通用户", icon: <UserOutlined /> },
  ADMIN: { color: "gold", label: "管理员", icon: <SettingOutlined /> },
  SUPER_ADMIN: { color: "magenta", label: "超级管理员", icon: <CrownOutlined /> },
};

const statusConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  PENDING: { color: "gold", label: "待审核", icon: <ClockCircleOutlined /> },
  APPROVED: { color: "green", label: "已通过", icon: <CheckCircleOutlined /> },
  REJECTED: { color: "red", label: "已拒绝", icon: <CloseCircleOutlined /> },
  DISABLED: { color: "default", label: "已禁用", icon: <StopOutlined /> },
};

const renderRoleTag = (role: string) => {
  const info = roleConfig[role] || { color: "default", label: role || "未知", icon: <UserOutlined /> };
  return <Tag color={info.color} icon={info.icon}>{info.label}</Tag>;
};

const renderStatusTag = (status: string) => {
  const info = statusConfig[status] || { color: "default", label: status || "未知", icon: <UserOutlined /> };
  return <Tag color={info.color} icon={info.icon}>{info.label}</Tag>;
};

const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const { token } = useToken();

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await http.get("/api/super/users");
      setUsers(res.data || []);
    } catch (e) {
      message.error("获取用户列表失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setVisible(true);
  };

  const openEdit = (record: any) => {
    setEditing(record);
    form.setFieldsValue({
      realName: record.realName,
      email: record.email,
      phone: record.phone,
      role: record.role,
      status: record.status,
      rejectReason: record.rejectReason,
    });
    setVisible(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        await http.put(`/api/super/users/${editing.id}`, values);
        message.success("用户信息更新成功");
      } else {
        await http.post("/api/super/users", values);
        message.success("用户创建成功");
      }
      setVisible(false);
      loadUsers();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error("操作失败");
    }
  };

  const remove = async (record: any) => {
    Modal.confirm({
      title: '确认删除用户?',
      content: `确定要删除用户 "${record.username}" 吗？此操作不可撤销。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await http.delete(`/api/super/users/${record.id}`);
          message.success("用户删除成功");
          loadUsers();
        } catch (e) {
          message.error("删除失败");
        }
      },
    });
  };

  // 统计数据
  const totalUsers = users.length;
  const adminCount = users.filter(u => u.role === 'ADMIN').length;
  const superAdminCount = users.filter(u => u.role === 'SUPER_ADMIN').length;
  const pendingCount = users.filter(u => u.status === 'PENDING').length;

  const columns = [
    {
      title: "用户",
      dataIndex: "username",
      key: "username",
      render: (text: string, record: any) => (
        <Space>
          <Avatar style={{ backgroundColor: token.colorPrimary }}>
            {text[0]?.toUpperCase()}
          </Avatar>
          <div>
            <div style={{ fontWeight: 500 }}>{text}</div>
            <div style={{ fontSize: 12, color: token.colorTextSecondary }}>
              ID: {record.id}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: "角色",
      dataIndex: "role",
      key: "role",
      render: (value: string) => renderRoleTag(value),
      filters: [
        { text: '普通用户', value: 'USER' },
        { text: '管理员', value: 'ADMIN' },
        { text: '超级管理员', value: 'SUPER_ADMIN' },
      ],
      onFilter: (value: any, record: any) => record.role === value,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (value: string) => renderStatusTag(value),
      filters: [
        { text: '待审核', value: 'PENDING' },
        { text: '已通过', value: 'APPROVED' },
        { text: '已拒绝', value: 'REJECTED' },
        { text: '已禁用', value: 'DISABLED' },
      ],
      onFilter: (value: any, record: any) => record.status === value,
    },
    {
      title: "基本信息",
      key: "info",
      render: (_: any, record: any) => (
        <div>
          <div>{record.realName || <Text type="secondary">-</Text>}</div>
          <div style={{ fontSize: 12, color: token.colorTextSecondary }}>
            {record.email || <Text type="secondary">-</Text>}
          </div>
          <div style={{ fontSize: 12, color: token.colorTextSecondary }}>
            {record.phone || <Text type="secondary">-</Text>}
          </div>
        </div>
      ),
    },
    {
      title: "注册时间",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text: string) => text ? new Date(text).toLocaleDateString() : "-",
      sorter: (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: "操作",
      key: "action",
      render: (_: any, record: any) => (
        <Space>
          <Tooltip title="编辑用户">
            <Button type="text" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          </Tooltip>
          <Tooltip title="删除用户">
            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(record)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* 概览统计 */}
      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card
            variant="borderless"
            style={{
              background: `linear-gradient(135deg, ${token.colorPrimary} 0%, #722ed1 100%)`,
              borderRadius: 16,
              color: '#fff'
            }}
            styles={{ body: { padding: '40px' } }}
          >
            <Row align="middle" justify="space-between">
              <Col>
                <Title level={1} style={{ color: '#fff', margin: 0, fontSize: 28 }}>
                  <CrownOutlined style={{ marginRight: 12 }} />
                  系统管理中心
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 18, display: 'block', marginTop: 12 }}>
                  全平台用户与权限管理
                </Text>
              </Col>
              <Col>
                <Row gutter={24}>
                  <Col>
                    <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.15)', padding: '16px 24px', borderRadius: 12 }}>
                      <div style={{ fontSize: 36, fontWeight: 700, lineHeight: 1 }}>{totalUsers}</div>
                      <div style={{ fontSize: 14, opacity: 0.9, marginTop: 4 }}>总用户数</div>
                    </div>
                  </Col>
                  <Col>
                    <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.15)', padding: '16px 24px', borderRadius: 12 }}>
                      <div style={{ fontSize: 36, fontWeight: 700, lineHeight: 1 }}>{pendingCount}</div>
                      <div style={{ fontSize: 14, opacity: 0.9, marginTop: 4 }}>待审核</div>
                    </div>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 快速统计 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <Statistic
              title="普通用户"
              value={users.filter(u => u.role === 'USER').length}
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <Statistic
              title="管理员"
              value={adminCount}
              prefix={<SettingOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <Statistic
              title="超级管理员"
              value={superAdminCount}
              prefix={<CrownOutlined style={{ color: '#f5222d' }} />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <Statistic
              title="已通过审核"
              value={users.filter(u => u.status === 'APPROVED').length}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 用户管理表格 */}
      <Card
        variant="borderless"
        title={
          <Space>
            <TeamOutlined style={{ color: token.colorPrimary }} />
            <span style={{ fontSize: 18, fontWeight: 600 }}>用户管理</span>
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
              icon={<SearchOutlined />}
              onClick={() => navigate("/search")}
            >
              用户查询
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={openCreate}
            >
              创建用户
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
            pageSize: 12,
            showTotal: (total, range) => `显示 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
            showQuickJumper: true,
            showSizeChanger: true
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* 用户编辑/创建弹窗 */}
      <Modal
        open={visible}
        title={
          <Space>
            {editing ? <EditOutlined /> : <PlusOutlined />}
            {editing ? "编辑用户" : "创建用户"}
          </Space>
        }
        onOk={handleOk}
        onCancel={() => setVisible(false)}
        width={600}
        okText="确认"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
          {!editing && (
            <>
              <Form.Item
                label="用户名"
                name="username"
                rules={[{ required: true, message: "请输入用户名" }]}
              >
                <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
              </Form.Item>
              <Form.Item
                label="密码"
                name="password"
                rules={[{ required: true, message: "请输入密码" }]}
              >
                <Input.Password prefix={<SafetyCertificateOutlined />} placeholder="请输入初始密码" />
              </Form.Item>
              <Divider />
            </>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="真实姓名" name="realName">
                <Input placeholder="请输入真实姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="手机号码" name="phone">
                <Input placeholder="请输入手机号码" />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item label="电子邮箱" name="email">
            <Input placeholder="请输入电子邮箱" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="用户角色"
                name="role"
                rules={[{ required: true, message: "请选择用户角色" }]}
              >
                <Select placeholder="请选择角色">
                  <Option value="USER">
                    <Space><UserOutlined />普通用户</Space>
                  </Option>
                  <Option value="ADMIN">
                    <Space><SettingOutlined />管理员</Space>
                  </Option>
                  <Option value="SUPER_ADMIN">
                    <Space><CrownOutlined />超级管理员</Space>
                  </Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="账号状态" name="status">
                <Select allowClear placeholder="请选择状态">
                  <Option value="PENDING">
                    <Space><ClockCircleOutlined />待审核</Space>
                  </Option>
                  <Option value="APPROVED">
                    <Space><CheckCircleOutlined />已通过</Space>
                  </Option>
                  <Option value="REJECTED">
                    <Space><CloseCircleOutlined />已拒绝</Space>
                  </Option>
                  <Option value="DISABLED">
                    <Space><StopOutlined />已禁用</Space>
                  </Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item 
            noStyle 
            shouldUpdate={(prevValues, currentValues) => prevValues.status !== currentValues.status}
          >
            {({ getFieldValue }) => {
              const status = getFieldValue('status');
              if (status === 'REJECTED' || status === 'DISABLED') {
                return (
                  <Form.Item 
                    label={status === 'REJECTED' ? '拒绝原因' : '禁用原因'} 
                    name="rejectReason"
                  >
                    <Input.TextArea 
                      placeholder={`请输入${status === 'REJECTED' ? '拒绝' : '禁用'}原因，用户登录时将看到此信息`}
                      rows={3}
                    />
                  </Form.Item>
                );
              }
              return null;
            }}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SuperAdminDashboard;

