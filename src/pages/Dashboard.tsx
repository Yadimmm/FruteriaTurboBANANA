import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Row,
  Skeleton,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  AppstoreOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons'

import MainLayout from '../components/Layout/MainLayout'
import type { Product } from '../types/Product'
import type { Entry } from '../types/Entry'
import type { Output } from '../types/Output'
import { getProducts } from '../services/products'
import { getEntries } from '../services/entries'
import { getOutputs } from '../services/outputs'
import { getExpirationStatus, daysUntil } from '../utils/expiration'

const { Title, Text } = Typography

type EntryRow = Entry & { productName?: string }
type OutputRow = Output & { productName?: string }

const Dashboard = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [entries, setEntries] = useState<EntryRow[]>([])
  const [outputs, setOutputs] = useState<OutputRow[]>([])
  const [loading, setLoading] = useState(false)

  async function refresh() {
    setLoading(true)
    try {
      const [prods, ents, outs] = await Promise.all([getProducts(), getEntries(), getOutputs()])

      const nameMap = new Map<number, string>()
      prods.forEach((p) => nameMap.set(Number(p.id), p.name))

      const entsNamed: EntryRow[] = ents.map((e) => ({
        ...e,
        productName: nameMap.get(e.productId) ?? `Producto no encontrado (ID: ${e.productId})`,
      }))

      const outsNamed: OutputRow[] = outs.map((o) => ({
        ...o,
        productName: nameMap.get(o.productId) ?? `Producto no encontrado (ID: ${o.productId})`,
      }))

      setProducts(prods)
      setEntries(entsNamed)
      setOutputs(outsNamed)
    } catch {
      message.error('No se pudo cargar el dashboard (¿server en :3001?)')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const stockTotalKg = useMemo(() => {
    return products.reduce((acc, p) => acc + Number(p.stock || 0), 0)
  }, [products])

  const porCaducar = useMemo(() => {
    return products.filter((p) => getExpirationStatus(p.expirationDate) === 'por_caducar')
  }, [products])

  const caducados = useMemo(() => {
    return products.filter((p) => getExpirationStatus(p.expirationDate) === 'caducado')
  }, [products])

  const latestEntries = useMemo(() => entries.slice(0, 8), [entries])
  const latestOutputs = useMemo(() => outputs.slice(0, 8), [outputs])

  const columnsMov: ColumnsType<EntryRow | OutputRow> = [
    { title: 'Producto', dataIndex: 'productName' },
    {
      title: 'Cantidad (kg)',
      dataIndex: 'quantity',
      width: 130,
      render: (v: number) => `${Number(v)} kg`,
    },
    {
      title: 'Fecha',
      dataIndex: 'date',
      width: 200,
      render: (v: string) => new Date(v).toLocaleString(),
    },
  ]

  const columnsExpire: ColumnsType<Product> = [
    { title: 'Producto', dataIndex: 'name' },
    {
      title: 'Stock (kg)',
      dataIndex: 'stock',
      width: 120,
      render: (v: number) => `${Number(v)} kg`,
    },
    { title: 'Caducidad', dataIndex: 'expirationDate', width: 140 },
    {
      title: 'Días',
      key: 'days',
      width: 90,
      render: (_, r) => daysUntil(r.expirationDate),
    },
    {
      title: 'Estado',
      key: 'status',
      width: 130,
      render: (_, r) => {
        const s = getExpirationStatus(r.expirationDate)
        if (s === 'por_caducar') return <Tag color="orange">Por caducar</Tag>
        if (s === 'caducado') return <Tag color="red">Caducado</Tag>
        return <Tag color="green">Vigente</Tag>
      },
    },
  ]

  const totalValue = useMemo(() => {
    return products.reduce((acc, p) => acc + Number(p.price || 0) * Number(p.stock || 0), 0)
  }, [products])

  const lossData = useMemo(() => {
    const expiredProducts = products.filter(
      (p) => getExpirationStatus(p.expirationDate) === 'caducado'
    )
    const totalLoss = expiredProducts.reduce(
      (acc, p) => acc + Number(p.price || 0) * Number(p.stock || 0),
      0
    )
    const expiredCount = expiredProducts.length

    const aboutToExpire = products.filter(
      (p) => getExpirationStatus(p.expirationDate) === 'por_caducar'
    )
    const riskValue = aboutToExpire.reduce(
      (acc, p) => acc + Number(p.price || 0) * Number(p.stock || 0),
      0
    )
    const riskCount = aboutToExpire.length

    return { totalLoss, expiredCount, riskValue, riskCount }
  }, [products])

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value)
  }

  if (loading) {
    return (
      <MainLayout>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Skeleton.Input active size="large" style={{ width: 200 }} />
            <Skeleton active paragraph={{ rows: 1 }} />
          </div>

          <Divider />

          <Row gutter={[16, 16]}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Col key={i} xs={24} sm={12} lg={8}>
                <Card>
                  <Skeleton active />
                </Card>
              </Col>
            ))}
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title={<Skeleton.Input active size="small" />}>
                <Skeleton active paragraph={{ rows: 4 }} />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title={<Skeleton.Input active size="small" />}>
                <Skeleton active paragraph={{ rows: 4 }} />
              </Card>
            </Col>
          </Row>

          <Card title={<Skeleton.Input active size="small" />}>
            <Skeleton active paragraph={{ rows: 6 }} />
          </Card>
        </Space>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <Title level={2}>Dashboard</Title>
          <Text type="secondary">Resumen general del inventario</Text>
        </div>

        <Divider />

        <Space>
          <Button icon={<ReloadOutlined />} onClick={refresh}>
            Actualizar datos
          </Button>
        </Space>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card aria-label="Total de productos">
              <Statistic
                title="Total de Productos"
                value={products.length}
                prefix={<AppstoreOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card aria-label="Stock total en inventario">
              <Tooltip title="Suma de todos los kg en inventario">
                <Statistic
                  title="Stock Total"
                  value={stockTotalKg}
                  prefix={<AppstoreOutlined />}
                  suffix="kg"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Tooltip>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card aria-label="Productos por caducar">
              <Tooltip title="Productos que caducan en 0-7 días">
                <Statistic
                  title="Por Caducar"
                  value={porCaducar.length}
                  prefix={<WarningOutlined />}
                  valueStyle={{ color: porCaducar.length > 0 ? '#faad14' : '#52c41a' }}
                />
              </Tooltip>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card aria-label="Productos caducados">
              <Tooltip title="Productos ya caducados">
                <Statistic
                  title="Caducados"
                  value={caducados.length}
                  prefix={<CloseCircleOutlined />}
                  valueStyle={{ color: caducados.length > 0 ? '#ff4d4f' : '#52c41a' }}
                />
              </Tooltip>
            </Card>
          </Col>
        </Row>

        {/* Tarjetas de pérdida/riesgo (sin lints) */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card style={{ background: '#fff7e6', borderColor: '#ffe7ba' }}>
              <Statistic
                title="Pérdida por Productos Caducados"
                value={lossData.totalLoss}
                formatter={(v) => formatMoney(Number(v))}
                valueStyle={{ color: '#d46b08', fontWeight: 700 }}
                suffix={
                  <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                    {lossData.expiredCount} producto{lossData.expiredCount !== 1 ? 's' : ''}
                  </span>
                }
              />
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card style={{ background: '#e6f7ff', borderColor: '#bae7ff' }}>
              <Statistic
                title="Valor en Riesgo (Por Caducar)"
                value={lossData.riskValue}
                formatter={(v) => formatMoney(Number(v))}
                valueStyle={{ color: '#096dd9', fontWeight: 700 }}
                suffix={
                  <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                    {lossData.riskCount} en riesgo
                  </span>
                }
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card>
              <Statistic
                title="Valor Total del Inventario"
                value={totalValue}
                formatter={(v) => formatMoney(Number(v))}
                valueStyle={{ color: '#1890ff', fontSize: 28 }}
              />
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card>
                  <Statistic
                    title="Entradas Totales"
                    value={entries.length}
                    prefix={<ArrowUpOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card>
                  <Statistic
                    title="Salidas Totales"
                    value={outputs.length}
                    prefix={<ArrowDownOutlined />}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <ArrowUpOutlined style={{ color: '#52c41a' }} />
                  <span>Entradas Recientes</span>
                </Space>
              }
            >
              {latestEntries.length === 0 ? (
                <Empty description="No hay entradas registradas" />
              ) : (
                <Table
                  rowKey="id"
                  columns={columnsMov as ColumnsType<EntryRow>}
                  dataSource={latestEntries}
                  pagination={false}
                  size="small"
                />
              )}
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <ArrowDownOutlined style={{ color: '#ff4d4f' }} />
                  <span>Salidas Recientes</span>
                </Space>
              }
            >
              {latestOutputs.length === 0 ? (
                <Empty description="No hay salidas registradas" />
              ) : (
                <Table
                  rowKey="id"
                  columns={columnsMov as ColumnsType<OutputRow>}
                  dataSource={latestOutputs}
                  pagination={false}
                  size="small"
                />
              )}
            </Card>
          </Col>
        </Row>

        <Card
          title={
            <Space>
              <WarningOutlined style={{ color: '#faad14' }} />
              <span>Productos Críticos (Por Caducar y Caducados)</span>
            </Space>
          }
        >
          {[...porCaducar, ...caducados].length === 0 ? (
            <Empty
              description="¡Excelente! No hay productos críticos"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <Table
              rowKey="id"
              columns={columnsExpire}
              dataSource={[...porCaducar, ...caducados].sort((a, b) =>
                a.expirationDate.localeCompare(b.expirationDate)
              )}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (t) => `Total: ${t} productos`,
              }}
            />
          )}
        </Card>
      </Space>
    </MainLayout>
  )
}

export default Dashboard
