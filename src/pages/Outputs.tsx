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
  MinusOutlined,
  ReloadOutlined,
  ArrowDownOutlined,
  WarningOutlined,
  SearchOutlined
} from '@ant-design/icons'

import MainLayout from '../components/Layout/MainLayout'
import type { Product } from '../types/Product'
import type { Output } from '../types/Output'
import { getProducts } from '../services/products'
import { getOutputs, createOutput } from '../services/outputs'
import { removeStock } from '../services/stock'

const { Title, Text } = Typography
const { Step } = Steps

type OutputRow = Output & { productName?: string }

const KG_STEP = 0.1
const LOW_STOCK_KG = 5

const Outputs = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [outputs, setOutputs] = useState<OutputRow[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [currentStep, setCurrentStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [form] = Form.useForm()

  async function refreshAll() {
    setLoading(true)
    setError(null)
    try {
      const [prods, outs] = await Promise.all([getProducts(), getOutputs()])

      const map = new Map<number, string>()
      prods.forEach((p) => map.set(Number(p.id), p.name))

      const withName: OutputRow[] = outs.map((o) => ({
        ...o,
        productName: map.get(o.productId) ?? `Producto no encontrado (ID: ${o.productId})`
      }))

      setProducts(prods)
      setOutputs(withName)
    } catch {
      setError('No se pudieron cargar las salidas (¿server en :3001?)')
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

  const filteredOutputs = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return outputs
    return outputs.filter((o) => (o.productName ?? '').toLowerCase().includes(q))
  }, [outputs, search])

  const stats = useMemo(() => {
    const totalKgOut = outputs.reduce((acc, o) => acc + Number(o.quantity || 0), 0)
    const unique = new Set(outputs.map((o) => Number(o.productId))).size
    return { totalOutputs: outputs.length, totalKgOut, unique }
  }, [outputs])

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
    return Math.max(0, currentStockKg - (isFinite(q) ? q : 0))
  }, [selectedProduct, currentStockKg, selectedQty])

  const isOverStock = useMemo(() => {
    const q = Number(selectedQty || 0)
    return q > currentStockKg
  }, [selectedQty, currentStockKg])

  async function onSubmit() {
    try {
      const values = await form.validateFields()
      const productId = Number(values.productId)
      const quantity = Number(values.quantity)

      const product = products.find((p) => Number(p.id) === productId)
      const productName = product?.name || `Producto (ID: ${productId})`

      Modal.confirm({
        title: 'Confirmar salida',
        content: (
          <div>
            <p>
              Se restará <b>{quantity.toFixed(1)} kg</b> a <b>{productName}</b>.
            </p>
            <p style={{ marginBottom: 0, opacity: 0.8 }}>
              Stock: {currentStockKg.toFixed(1)} kg → <b>{afterStockKg.toFixed(1)} kg</b>
            </p>
            {afterStockKg < LOW_STOCK_KG && (
              <Alert message="Advertencia: Stock bajo después de la salida" type="warning" showIcon style={{ marginTop: 8 }} />
            )}
          </div>
        ),
        okText: 'Guardar salida',
        cancelText: 'Cancelar',
        async onOk() {
          setSaving(true)
          try {
            await createOutput({ productId, quantity, date: new Date().toISOString() })
            await removeStock(productId, quantity)

            message.success(`✅ Salida registrada: -${quantity.toFixed(1)} kg de "${productName}"`)
            form.resetFields()
            setCurrentStep(0)
            await refreshAll()
          } catch (error) {
            if ((error as Error).message === 'INSUFFICIENT_STOCK') {
              message.error('❌ No hay suficiente stock para realizar la salida')
            } else {
              message.error('❌ No se pudo registrar la salida')
            }
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

  const columns: ColumnsType<OutputRow> = [
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
            Salidas
          </Title>
          <Text type="secondary">Registra salidas y actualiza automáticamente el stock (kg).</Text>
        </div>

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

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card hoverable onClick={() => setSearch('')}>
              <Statistic title="Salidas Totales" value={stats.totalOutputs} prefix={<ArrowDownOutlined />} valueStyle={{ color: '#1890ff' }} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card hoverable onClick={() => setSearch('filtrar por kg')}>
              <Tooltip title="Suma de kg de todas las salidas registradas">
                <Statistic title="Kg Salidos" value={Number(stats.totalKgOut.toFixed(1))} suffix="kg" prefix={<WarningOutlined />} valueStyle={{ color: '#faad14' }} />
              </Tooltip>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic title="Productos con salidas" value={stats.unique} valueStyle={{ color: '#722ed1' }} />
            </Card>
          </Col>
        </Row>

        <Card>
          <Space wrap style={{ justifyContent: 'space-between', width: '100%' }}>
            <Space wrap>
              <Tooltip title="Registra una nueva salida de stock">
                <Button type="primary" icon={<MinusOutlined />} onClick={() => setCurrentStep(0)} loading={saving}>
                  Nueva salida
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
              placeholder="Buscar en salidas (producto, fecha, cantidad)..."
              style={{ width: 260 }}
              aria-label="Buscar salidas por producto, fecha o cantidad"
            />
          </Space>

          <Divider style={{ margin: '16px 0' }} />

          <Card title="Registrar Salida" style={{ transition: 'opacity 0.3s ease' }}>
            <Steps current={currentStep} size="small" style={{ marginBottom: 16 }}>
              <Step title="Producto" />
              <Step title="Cantidad" />
              <Step title="Confirmar" />
            </Steps>
            <Form form={form} layout="vertical">
              <Row gutter={16}>
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
                          if (n > currentStockKg) throw new Error(`No hay suficiente stock (${currentStockKg.toFixed(1)} kg disponible)`)
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

                {currentStep === 2 && (
                  <Col xs={24}>
                    <Space>
                      <Button onClick={() => setCurrentStep(1)}>Atrás</Button>
                      <Tooltip title={isOverStock ? 'Cantidad supera el stock disponible' : ''}>
                        <Button type="primary" onClick={onSubmit} loading={saving} disabled={isOverStock}>
                          Guardar salida
                        </Button>
                      </Tooltip>
                    </Space>
                  </Col>
                )}
              </Row>

              {selectedProduct && (
                <Space direction="vertical" style={{ width: '100%', marginTop: 16 }}>
                  <Text>Stock Actual</Text>
                  <Progress percent={(currentStockKg / 100) * 100} status="active" strokeColor="#1890ff" />
                  <Text>Stock Después</Text>
                  <Progress
                    percent={(afterStockKg / 100) * 100}
                    status={afterStockKg < LOW_STOCK_KG ? "exception" : "normal"}
                    strokeColor={afterStockKg < LOW_STOCK_KG ? "#ff4d4f" : "#faad14"}
                  />
                </Space>
              )}
            </Form>
          </Card>
        </Card>

        <Card title="Salidas recientes" style={{ transition: 'opacity 0.3s ease' }}>
          {filteredOutputs.length === 0 ? (
            <Empty description="No hay salidas registradas" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <Table
              rowKey="id"
              columns={columns}
              dataSource={filteredOutputs}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50'],
                showTotal: (total) => `Total: ${total} salidas`
              }}
            />
          )}
        </Card>
      </Space>
    </MainLayout>
  )
}

export default Outputs