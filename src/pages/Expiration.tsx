import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Input,
  Row,
  Segmented,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  Alert,
  notification
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  ReloadOutlined,
  SearchOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined
} from '@ant-design/icons'

import MainLayout from '../components/Layout/MainLayout'
import type { Product } from '../types/Product'
import { getProducts } from '../services/products'
import { daysUntil, getExpirationStatus } from '../utils/expiration'

const { Title, Text } = Typography

type ExpView = 'todos' | 'vigentes' | 'por_caducar' | 'caducados'

function statusMeta(status: ReturnType<typeof getExpirationStatus>) {
  if (status === 'caducado') return { color: 'red', label: 'Caducado', icon: <CloseCircleOutlined /> }
  if (status === 'por_caducar') return { color: 'orange', label: 'Por caducar', icon: <WarningOutlined /> }
  return { color: 'green', label: 'Vigente', icon: <CheckCircleOutlined /> }
}

function daysLabel(expirationDate: string) {
  const d = daysUntil(expirationDate)
  const s = getExpirationStatus(expirationDate)
  if (s === 'caducado') return `hace ${Math.abs(d)} día(s)`
  return `en ${d} día(s)`
}

const NOTIFICATION_KEY = 'near-expiration-warning'

const Expiration = () => {
  const [data, setData] = useState<Product[]>([])
  const [view, setView] = useState<ExpView>('todos')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const products = await getProducts()
      setData(products)
      const nearCount = products.filter(p => getExpirationStatus(p.expirationDate) === 'por_caducar').length
      if (nearCount > 0) {
        notification.warning({
          key: NOTIFICATION_KEY,
          message: 'Productos por caducar',
          description: `Tienes ${nearCount} productos con fecha próxima de caducidad.`,
          duration: 6
        })
      }
      // No llamamos a notification.close o notification.destroy para evitar error de método inexistente
    } catch {
      setError('No se pudieron cargar los productos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const bySearch = q ? data.filter((p) => p.name.toLowerCase().includes(q)) : data

    if (view === 'todos') return bySearch
    if (view === 'vigentes') return bySearch.filter((p) => getExpirationStatus(p.expirationDate) === 'vigente')
    if (view === 'por_caducar') return bySearch.filter((p) => getExpirationStatus(p.expirationDate) === 'por_caducar')
    return bySearch.filter((p) => getExpirationStatus(p.expirationDate) === 'caducado')
  }, [data, view, search])

  const stats = useMemo(() => {
    const vig = data.filter((p) => getExpirationStatus(p.expirationDate) === 'vigente')
    const por = data.filter((p) => getExpirationStatus(p.expirationDate) === 'por_caducar')
    const cad = data.filter((p) => getExpirationStatus(p.expirationDate) === 'caducado')

    const kg = (arr: Product[]) => arr.reduce((acc, p) => acc + Number(p.stock || 0), 0)

    return {
      total: data.length,
      vigCount: vig.length,
      porCount: por.length,
      cadCount: cad.length,
      vigKg: kg(vig),
      porKg: kg(por),
      cadKg: kg(cad)
    }
  }, [data])

  const columns: ColumnsType<Product> = [
    { title: 'ID', dataIndex: 'id', width: 80 },

    { title: 'Producto', dataIndex: 'name' },

    {
      title: 'Cantidad',
      dataIndex: 'stock',
      width: 140,
      render: (v: number) => <b>{Number(v).toFixed(1)} kg</b>
    },

    {
      title: 'Caducidad',
      dataIndex: 'expirationDate',
      width: 150,
      render: (v: string) => (
        <Space>
          <CalendarOutlined style={{ opacity: 0.65 }} />
          <span>{v}</span>
        </Space>
      )
    },

    {
      title: 'Días',
      key: 'days',
      width: 140,
      render: (_, record) => {
        const s = getExpirationStatus(record.expirationDate)
        const { color } = statusMeta(s)
        return (
          <Tag color={color}>
            {daysLabel(record.expirationDate)}
          </Tag>
        )
      }
    },

    {
      title: 'Estado',
      key: 'status',
      width: 160,
      render: (_, record) => {
        const s = getExpirationStatus(record.expirationDate)
        const meta = statusMeta(s)
        return (
          <Tag color={meta.color} icon={meta.icon}>
            {meta.label}
          </Tag>
        )
      }
    }
  ]

  return (
    <MainLayout>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={2} style={{ marginBottom: 0 }}>
            Caducidad
          </Title>
          <Text type="secondary">
            Controla vigentes, por caducar y caducados con filtros y búsqueda.
          </Text>
        </div>

        <Divider />

        {error && (
          <Alert
            type="error"
            message="Error"
            description={error}
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        {/* KPIs */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card hoverable onClick={() => setView('vigentes')}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text type="secondary">Vigentes</Text>
                <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                  <Tag color="green">{stats.vigCount} productos</Tag>
                  <b>{stats.vigKg.toFixed(1)} kg</b>
                </Space>
              </Space>
            </Card>
          </Col>

          <Col xs={24} sm={8}>
            <Card hoverable onClick={() => setView('por_caducar')}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text type="secondary">Por caducar</Text>
                <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                  <Tag color="orange">{stats.porCount} productos</Tag>
                  <b>{stats.porKg.toFixed(1)} kg</b>
                </Space>
              </Space>
            </Card>
          </Col>

          <Col xs={24} sm={8}>
            <Card hoverable onClick={() => setView('caducados')}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text type="secondary">Caducados</Text>
                <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                  <Tag color="red">{stats.cadCount} productos</Tag>
                  <b>{stats.cadKg.toFixed(1)} kg</b>
                </Space>
              </Space>
            </Card>
          </Col>
        </Row>

        <Divider />

        {/* Filtros & búsqueda */}
        <Card>
          <Space wrap style={{ justifyContent: 'space-between', width: '100%' }}>
            <Space wrap>
              <Segmented
                value={view}
                onChange={v => setView(v as ExpView)}
                options={[
                  { label: 'Todos', value: 'todos' },
                  { label: 'Vigentes', value: 'vigentes' },
                  { label: 'Por caducar', value: 'por_caducar' },
                  { label: 'Caducados', value: 'caducados' }
                ]}
              />

              <Input
                allowClear
                value={search}
                onChange={e => setSearch(e.target.value)}
                prefix={<SearchOutlined />}
                placeholder="Buscar producto..."
                style={{ width: 260 }}
                aria-label="Buscar producto por nombre"
              />
            </Space>

            <Space wrap>
              <Tooltip title="Recargar datos">
                <Button icon={<ReloadOutlined />} onClick={refresh} loading={loading}>
                  Recargar
                </Button>
              </Tooltip>

              <Button onClick={() => { setView('todos'); setSearch('') }}>
                Limpiar filtros
              </Button>

              <Tag color="blue">
                Mostrando <b>{filtered.length}</b> / {data.length}
              </Tag>
            </Space>
          </Space>
        </Card>

        {/* Tabla */}
        {filtered.length === 0 && !loading ? (
          <Empty description="No hay productos para mostrar con estos filtros" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={filtered}
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
              showTotal: total => `Total: ${total} productos`
            }}
            scroll={{ x: 'max-content' }}
          />
        )}
      </Space>
    </MainLayout>
  )
}

export default Expiration