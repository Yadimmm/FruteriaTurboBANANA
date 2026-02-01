import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Skeleton,
  Space,
  Statistic,
  Table,
  Tooltip,
  Typography,
  message,
  Steps,
  Alert,
  Progress
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  PlusOutlined,
  ReloadOutlined,
  ArrowUpOutlined,
  CheckCircleOutlined,
  SearchOutlined
} from '@ant-design/icons'

import MainLayout from '../components/Layout/MainLayout'
import type { Product } from '../types/Product'
import type { Entry } from '../types/Entry'
import { getProducts } from '../services/products'
import { getEntries, createEntry } from '../services/entries'
import { addStock } from '../services/stock'

const { Title, Text } = Typography
const { Step } = Steps

type EntryRow = Entry & { productName?: string }

const KG_STEP = 0.1

const Entries = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [entries, setEntries] = useState<EntryRow[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [currentStep, setCurrentStep] = useState(0) // Para Steps
  const [error, setError] = useState<string | null>(null) // Para Alert de errores
  const [form] = Form.useForm()

  async function refreshAll() {
    setLoading(true)
    setError(null) // Limpiar errores previos
    try {
      const [prods, ents] = await Promise.all([getProducts(), getEntries()])

      const map = new Map<number, string>()
      prods.forEach((p) => map.set(Number(p.id), p.name))

      const withName: EntryRow[] = ents.map((e) => ({
        ...e,
        productName: map.get(e.productId) ?? `Producto no encontrado (ID: ${e.productId})`
      }))

      setProducts(prods)
      setEntries(withName)
    } catch {
      setError('No se pudieron cargar las entradas (¿server en :3001?)')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshAll()
  }, [])

  const productOptions = useMemo(
    () =>
      products.map((p) => ({
        label: `${p.name} (stock: ${Number(p.stock).toFixed(1)} kg)`,
        value: Number(p.id)
      })),
    [products]
  )

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return entries
    return entries.filter((e) => (e.productName ?? '').toLowerCase().includes(q))
  }, [entries, search])

  const stats = useMemo(() => {
    const totalKgIn = entries.reduce((acc, e) => acc + Number(e.quantity || 0), 0)
    const unique = new Set(entries.map((e) => Number(e.productId))).size
    return { totalEntries: entries.length, totalKgIn, unique }
  }, [entries])

  const selectedProductId = Form.useWatch('productId', form)
  const selectedQty = Form.useWatch('quantity', form)

  const selectedProduct = useMemo(() => {
    if (!selectedProductId) return null
    return products.find((p) => Number(p.id) === Number(selectedProductId)) ?? null
  }, [products, selectedProductId])

  const currentStockKg = useMemo(() => (selectedProduct ? Number(selectedProduct.stock || 0) : 0), [selectedProduct])

  const afterStockKg = useMemo(() => {
    const q = Number(selectedQty || 0)
    if (!selectedProduct) return 0
    return currentStockKg + (isFinite(q) ? q : 0)
  }, [selectedProduct, currentStockKg, selectedQty])

  async function onSubmit() {
    try {
      const values = await form.validateFields()
      const productId = Number(values.productId)
      const quantity = Number(values.quantity)

      const product = products.find((p) => Number(p.id) === productId)
      const productName = product?.name || `Producto (ID: ${productId})`

      Modal.confirm({
        title: 'Confirmar entrada',
        content: (
          <div>
            <p>
              Se agregará <b>{quantity.toFixed(1)} kg</b> a <b>{productName}</b>.
            </p>
            <p style={{ marginBottom: 0, opacity: 0.8 }}>
              Stock: {currentStockKg.toFixed(1)} kg → <b>{afterStockKg.toFixed(1)} kg</b>
            </p>
          </div>
        ),
        okText: 'Guardar entrada',
        cancelText: 'Cancelar',
        async onOk() {
          setSaving(true)
          try {
            await createEntry({ productId, quantity, date: new Date().toISOString() })
            await addStock(productId, quantity)

            message.success(`✅ Entrada registrada: +${quantity.toFixed(1)} kg de "${productName}"`)
            form.resetFields()
            setCurrentStep(0) // Resetear Steps
            await refreshAll()
          } catch {
            message.error('❌ No se pudo registrar la entrada')
          } finally {
            setSaving(false)
          }
        }
      })
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'errorFields' in err) return
      message.error('Ocurrió un error al validar el formulario')
    }
  }

  const columns: ColumnsType<EntryRow> = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: 'Producto', dataIndex: 'productName' },
    {
      title: 'Cantidad (kg)',
      dataIndex: 'quantity',
      width: 150,
      align: 'right',
      render: (v: number) => <b>{Number(v).toFixed(1)} kg</b>
    },
    {
      title: 'Fecha',
      dataIndex: 'date',
      width: 220,
      render: (v: string) =>
        new Date(v).toLocaleString('es-MX', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
    }
  ]

  if (loading) {
    return (
      <MainLayout>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Skeleton.Input active size="large" style={{ width: 240 }} />
          <Skeleton active paragraph={{ rows: 6 }} />
          <Row gutter={[16, 16]}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Col key={i} xs={24} sm={8}>
                <Card>
                  <Skeleton active />
                </Card>
              </Col>
            ))}
          </Row>
          <Card>
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
          <Title level={2} style={{ marginBottom: 0 }}>
            Entradas
          </Title>
          <Text type="secondary">Registra entradas y actualiza automáticamente el stock (kg).</Text>
        </div>

        {/* Alert para errores */}
        {error && (
          <Alert
            message="Error de carga"
            description={error}
            type="error"
            closable
            onClose={() => setError(null)}
            style={{ marginBottom: 16 }}
          />
        )}

        <Divider />

        {/* KPIs Interactivos */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card hoverable onClick={() => setSearch('')}> {/* Click para resetear búsqueda */}
              <Statistic title="Entradas Totales" value={stats.totalEntries} prefix={<ArrowUpOutlined />} valueStyle={{ color: '#1890ff' }} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card hoverable onClick={() => setSearch('filtrar por kg')}> {/* Click para filtrar por cantidad */}
              <Tooltip title="Suma de kg de todas las entradas registradas">
                <Statistic title="Kg Ingresados" value={Number(stats.totalKgIn.toFixed(1))} suffix="kg" prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} />
              </Tooltip>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic title="Productos con entradas" value={stats.unique} valueStyle={{ color: '#722ed1' }} />
            </Card>
          </Col>
        </Row>

        {/* Acciones + búsqueda */}
        <Card>
          <Space wrap style={{ justifyContent: 'space-between', width: '100%' }}>
            <Space wrap>
              <Tooltip title="Registra una nueva entrada de stock">
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setCurrentStep(0)} loading={saving}>
                  Nueva entrada
                </Button>
              </Tooltip>

              <Button icon={<ReloadOutlined />} onClick={refreshAll}>
                Recargar
              </Button>

              <Button onClick={() => { form.resetFields(); setCurrentStep(0) }} disabled={saving}>
                Limpiar formulario
              </Button>
            </Space>

            <Input
              allowClear
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              prefix={<SearchOutlined />}
              placeholder="Buscar en entradas (producto, fecha, cantidad)..."
              style={{ width: 260 }}
              aria-label="Buscar entradas por producto, fecha o cantidad"
            />
          </Space>

          <Divider style={{ margin: '16px 0' }} />

          {/* Formulario con Steps */}
          <Card title="Registrar Entrada" style={{ transition: 'opacity 0.3s ease' }}>
            <Steps current={currentStep} size="small" style={{ marginBottom: 16 }}>
              <Step title="Producto" />
              <Step title="Cantidad" />
              <Step title="Confirmar" />
            </Steps>
            <Form form={form} layout="vertical">
              <Row gutter={16}>
                {/* Campo Producto - Siempre renderizado, oculto si no es el paso */}
                <Col xs={24} md={14} style={{ display: currentStep === 0 ? 'block' : 'none' }}>
                  <Form.Item label="Producto" name="productId" rules={[{ required: true, message: 'Selecciona un producto' }]}>
                    <Select
                      showSearch
                      placeholder="Selecciona un producto"
                      options={productOptions}
                      optionFilterProp="label"
                      onChange={() => setCurrentStep(1)}
                      aria-label="Seleccionar producto"
                    />
                  </Form.Item>
                </Col>

                {/* Campo Cantidad - Siempre renderizado, oculto si no es el paso */}
                <Col xs={24} md={10} style={{ display: currentStep === 1 ? 'block' : 'none' }}>
                  <Form.Item
                    label="Cantidad (kg)"
                    name="quantity"
                    validateTrigger="onChange"
                    rules={[
                      { required: true, message: 'Ingresa la cantidad' },
                      {
                        validator: async (_, value) => {
                          const n = Number(value)
                          if (!isFinite(n) || n <= 0) throw new Error('Debe ser mayor a 0')
                        }
                      }
                    ]}
                  >
                    <InputNumber min={0} step={KG_STEP} precision={1} style={{ width: '100%' }} placeholder="Ej: 2.5" />
                  </Form.Item>
                  <Space style={{ marginTop: 8 }}>
                    <Button onClick={() => setCurrentStep(0)}>Atrás</Button>
                    <Button type="primary" onClick={() => setCurrentStep(2)}>Siguiente</Button>
                  </Space>
                </Col>

                {/* Botón Confirmar - Solo visible en paso 2 */}
                {currentStep === 2 && (
                  <Col xs={24}>
                    <Space>
                      <Button onClick={() => setCurrentStep(1)}>Atrás</Button>
                      <Button type="primary" onClick={onSubmit} loading={saving}>
                        Guardar entrada
                      </Button>
                    </Space>
                  </Col>
                )}
              </Row>

              {/* Indicadores de Stock con Progress */}
              {selectedProduct && (
                <Space direction="vertical" style={{ width: '100%', marginTop: 16 }}>
                  <Text>Stock Actual</Text>
                  <Progress percent={(currentStockKg / 100) * 100} status="active" strokeColor="#1890ff" />
                  <Text>Stock Después</Text>
                  <Progress
                    percent={(afterStockKg / 100) * 100}
                    status={afterStockKg > currentStockKg ? "success" : "normal"}
                    strokeColor={afterStockKg > currentStockKg ? "#52c41a" : "#faad14"}
                  />
                </Space>
              )}
            </Form>
          </Card>
        </Card>

        {/* Tabla con fade-in */}
        <Card title="Entradas recientes" style={{ transition: 'opacity 0.3s ease' }}>
          {filteredEntries.length === 0 ? (
            <Empty description="No hay entradas registradas" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <Table
              rowKey="id"
              columns={columns}
              dataSource={filteredEntries}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50'],
                showTotal: (total) => `Total: ${total} entradas`
              }}
            />
          )}
        </Card>
      </Space>
    </MainLayout>
  )
}

export default Entries