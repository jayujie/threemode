import React, { useEffect, useState } from "react";
import {
  Card,
  Input,
  Table,
  Space,
  Image,
  Descriptions,
  Row,
  Col,
  Modal,
  Button,
  Divider,
  Select,
  Typography,
  Avatar,
  Tag,
  theme,
  App,
  Tooltip,
  Empty
} from "antd";
import { 
  SearchOutlined, 
  FileImageOutlined, 
  UserOutlined,
  ArrowLeftOutlined,
  EyeOutlined,
  TeamOutlined,
  FilterOutlined
} from "@ant-design/icons";
import http from "../api/http";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;
const { useToken } = theme;

const IMAGE_BASE_URL = "http://localhost:3000/uploads/";

const SearchViewPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [detailVisible, setDetailVisible] = useState(false);
  const [detail, setDetail] = useState<any | null>(null);
  const [searchMode, setSearchMode] = useState<
    "all" | "username" | "realName" | "email" | "phone" | "id"
  >("all");
  const { message } = App.useApp();
  const { token } = useToken();

  const loadUsers = async (kw?: string) => {
    const q = (kw ?? keyword).trim();
    setKeyword(q);

    try {
      setLoading(true);
      const params: any = {};
      if (q) {
        params.q = q;
      }
      if (searchMode && searchMode !== "all") {
        params.mode = searchMode;
      }

      const res = await http.get("/api/admin/users", { params });
      setUsers(res.data || []);
    } catch (e: any) {
      if (e?.response?.status === 403) {
        message.error("没有访问权限，请使用管理员或超级管理员登录");
      } else {
        message.error("获取用户列表失败");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 初次进入时，加载全部用户（按注册时间排序）
    loadUsers("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDetail = async (id: number) => {
    try {
      const res = await http.get(`/api/admin/users/${id}`);
      setDetail(res.data);
      setDetailVisible(true);
    } catch (e) {
      message.error("获取用户详情失败");
    }
  };

  const closeDetail = () => {
    setDetailVisible(false);
    setDetail(null);
  };

  const renderStatusTag = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      PENDING: { color: "processing", label: "待审核" },
      APPROVED: { color: "success", label: "已通过" },
      REJECTED: { color: "error", label: "已拒绝" },
      DISABLED: { color: "default", label: "已禁用" },
    };
    const info = statusConfig[status] || { color: "default", label: status };
    return <Tag color={info.color}>{info.label}</Tag>;
  };

  const renderRoleTag = (role: string) => {
    const roleConfig: Record<string, { color: string; label: string }> = {
      USER: { color: "blue", label: "普通用户" },
      ADMIN: { color: "gold", label: "管理员" },
      SUPER_ADMIN: { color: "magenta", label: "超级管理员" },
    };
    const info = roleConfig[role] || { color: "default", label: role };
    return <Tag color={info.color}>{info.label}</Tag>;
  };

  const renderFingerImages = () => {
    if (!detail || !detail.fingerFeatures) {
      return (
        <div style={{ 
          textAlign: "center", 
          padding: 60,
          background: '#fafafa',
          borderRadius: 8,
          color: token.colorTextSecondary
        }}>
          <FileImageOutlined style={{ fontSize: 48, marginBottom: 16 }} />
          <div>该用户暂未上传手指模态图片</div>
        </div>
      );
    }

    const f = detail.fingerFeatures;
    const images = [
      { title: "指纹", path: f.fingerprint_path },
      { title: "指节纹", path: f.finger_joint_path },
      { title: "指静脉", path: f.finger_vein_path },
      { title: "指静脉二值", path: f.vein_bin_path }
    ].filter(img => img.path);

    return (
      <Image.PreviewGroup>
        <Row gutter={[16, 16]}>
          {images.map((img, index) => (
            <Col xs={24} sm={12} md={6} key={index}>
              <Card
                hoverable
                cover={
                  <div style={{ height: 180, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
                    <Image
                      height={180}
                      src={`${IMAGE_BASE_URL}${img.path}`}
                      alt={img.title}
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                }
                bodyStyle={{ padding: 12, textAlign: 'center' }}
              >
                <Card.Meta title={img.title} />
              </Card>
            </Col>
          ))}
        </Row>
      </Image.PreviewGroup>
    );
  };

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
      title: "姓名", 
      dataIndex: "realName",
      render: (text: string) => text || <Text type="secondary">-</Text>
    },
    { 
      title: "联系方式", 
      render: (_: any, record: any) => (
        <div>
          <div>{record.email || <Text type="secondary">-</Text>}</div>
          <div style={{ fontSize: 12, color: token.colorTextSecondary }}>
            {record.phone || <Text type="secondary">-</Text>}
          </div>
        </div>
      )
    },
    { 
      title: "角色", 
      dataIndex: "role",
      render: (role: string) => renderRoleTag(role)
    },
    { 
      title: "状态", 
      dataIndex: "status",
      render: (status: string) => renderStatusTag(status)
    },
    { 
      title: "注册时间", 
      dataIndex: "createdAt",
      render: (text: string) => text ? new Date(text).toLocaleDateString() : "-"
    },
    {
      title: "操作",
      key: "action",
      render: (_: any, record: any) => (
        <Tooltip title="查看模态特征图片">
          <Button 
            type="primary" 
            ghost 
            icon={<EyeOutlined />}
            onClick={() => openDetail(record.id)}
          >
            查看图片
          </Button>
        </Tooltip>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* 页面头部 */}
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
                <Title level={2} style={{ color: '#fff', margin: 0 }}>
                  <TeamOutlined style={{ marginRight: 12 }} />
                  用户搜索与查看
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, display: 'block', marginTop: 8 }}>
                  查询系统中的用户信息，查看生物特征图片数据
                </Text>
              </Col>
              <Col>
                <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.2)', padding: '12px 24px', borderRadius: 8 }}>
                  <div style={{ fontSize: 32, fontWeight: 700, lineHeight: 1 }}>{users.length}</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>用户总数</div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 搜索区域 */}
      <Card
        variant="borderless"
        style={{
          borderRadius: 16,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
          marginBottom: 24
        }}
        styles={{ body: { padding: '24px 32px' } }}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <div>
            <Title level={4} style={{ margin: 0, marginBottom: 8 }}>
              <FilterOutlined style={{ marginRight: 8, color: token.colorPrimary }} />
              搜索条件
            </Title>
            <Text type="secondary">
              支持按用户名、姓名、手机号、邮箱等字段模糊搜索，输入为空时将显示全部用户
            </Text>
          </div>

          <Space style={{ width: "100%" }} size="middle">
            <Select
              value={searchMode}
              style={{ width: 180 }}
              onChange={(v) => setSearchMode(v)}
              options={[
                { label: "全部字段", value: "all" },
                { label: "按用户名", value: "username" },
                { label: "按姓名", value: "realName" },
                { label: "按邮箱", value: "email" },
                { label: "按手机号", value: "phone" },
                { label: "按账号ID", value: "id" },
              ]}
            />

            <Space.Compact style={{ flex: 1 }}>
              <Input
                prefix={<SearchOutlined />}
                placeholder="请输入搜索关键字，支持模糊搜索"
                allowClear
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onPressEnter={() => loadUsers()}
                style={{ flex: 1 }}
                size="large"
              />
              <Button 
                type="primary" 
                loading={loading} 
                onClick={() => loadUsers()}
                size="large"
                style={{ minWidth: 100 }}
              >
                搜索
              </Button>
            </Space.Compact>
          </Space>
        </Space>
      </Card>

      {/* 用户列表 */}
      <Card
        variant="borderless"
        title={
          <Space>
            <UserOutlined style={{ color: token.colorPrimary }} />
            <span style={{ fontSize: 16, fontWeight: 600 }}>用户列表</span>
            <Text type="secondary">({users.length} 条记录)</Text>
          </Space>
        }
        extra={
          <Button 
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
          >
            返回上级
          </Button>
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
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 用户详情弹窗 */}
      <Modal
        open={detailVisible}
        title={
          <Space>
            <FileImageOutlined style={{ color: token.colorPrimary }} />
            <span>用户详情与模态特征</span>
          </Space>
        }
        footer={
          <Button type="primary" onClick={closeDetail}>
            关闭
          </Button>
        }
        width={1000}
        onCancel={closeDetail}
        style={{ top: 20 }}
      >
        {detail && (
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            <Card
              size="small"
              title="基本信息"
              style={{ background: token.colorFillAlter }}
            >
              <Descriptions
                column={{ xxl: 3, xl: 3, lg: 2, md: 2, sm: 1, xs: 1 }}
                size="small"
              >
                <Descriptions.Item label="用户名">
                  <Space>
                    <Avatar size="small" style={{ backgroundColor: token.colorPrimary }}>
                      {detail.user.username[0]?.toUpperCase()}
                    </Avatar>
                    {detail.user.username}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="真实姓名">
                  {detail.user.realName || <Text type="secondary">-</Text>}
                </Descriptions.Item>
                <Descriptions.Item label="角色">
                  {renderRoleTag(detail.user.role)}
                </Descriptions.Item>
                <Descriptions.Item label="邮箱">
                  {detail.user.email || <Text type="secondary">-</Text>}
                </Descriptions.Item>
                <Descriptions.Item label="手机号">
                  {detail.user.phone || <Text type="secondary">-</Text>}
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  {renderStatusTag(detail.user.status)}
                </Descriptions.Item>
                <Descriptions.Item label="注册时间" span={3}>
                  {detail.user.createdAt ? new Date(detail.user.createdAt).toLocaleString() : "-"}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card size="small" title="生物特征图片">
              {renderFingerImages()}
            </Card>
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default SearchViewPage;

