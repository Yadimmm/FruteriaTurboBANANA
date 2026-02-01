import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Button,
  Card,
  Col,
  DatePicker,
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
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { InputRef } from 'antd'
import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  AppstoreOutlined,
} from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'

import MainLayout from '../components/Layout/MainLayout'
import type { Product } from '../types/Product'
import { createProduct, deleteProduct, getProducts, updateProduct } from '../services/products'
import { daysUntil, getExpirationStatus } from '../utils/expiration'

type Mode = 'create' | 'edit'
type ExpFilter = 'all' | 'vigente' | 'por_caducar' | 'caducado'
type StockFilter = 'all' | 'low' | 'mid' | 'high'

const STOCK_LOW_MAX = 5
const STOCK_MID_MAX = 15

const { Title, Text } = Typography

function stockLevel(stock: number): StockFilter {
  if (stock <= STOCK_LOW_MAX) return 'low'
  if (stock <= STOCK_MID_MAX) return 'mid'
  return 'high'
}

function formatMoneyMXN(value: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(value)
}

function escapeCsv(value: unknown): string {
  const s = String(value ?? '')
  const needsQuotes = /[",\n]/.test(s)
  const escaped = s.replace(/"/g, '""')
  return needsQuotes ? `"${escaped}"` : escaped
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((r) => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

const Products = () => {
  const [data, setData] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('create')
  const [editing, setEditing] = useState<Product | null>(null)

  const [search, setSearch] = useState('')
  const [expFilter, setExpFilter] = useState<ExpFilter>('all')
  const [stockFilter, setStockFilter] = useState<StockFilter>('all')

  const [form] = Form.useForm()

  // 🔑 Accesibilidad
  const lastTriggerRef = useRef<HTMLElement | null>(null)
  const nameInputRef = useRef<InputRef | null>(null)

  async function refresh() {
    setLoading(true)
    try {
      const products = await getProducts()
      setData(products)
    } catch {
      message.error('No se pudieron cargar los productos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  function closeModal() {
    setOpen(false)
    setTimeout(() => {
      lastTriggerRef.current?.focus()
    }, 0)
  }

  function openCreate(e?: React.MouseEvent<HTMLElement>) {
    lastTriggerRef.current = e?.currentTarget ?? null
    setMode('create')
    setEditing(null)
    form.resetFields()
    setOpen(true)
  }

  function openEdit(record: Product, e?: React.MouseEvent<HTMLElement>) {
    lastTriggerRef.current = e?.currentTarget ?? null
    setMode('edit')
    setEditing(record)
    form.setFieldsValue({
      name: record.name,
      price: record.price,
      stock: record.stock,
      expirationDate: dayjs(record.expirationDate, 'YYYY-MM-DD'),
    })
    setOpen(true)
  }

  // Autofocus en Nombre
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => {
      nameInputRef.current?.focus()
    }, 0)
    return () => clearTimeout(t)
  }, [open])

  async function onSubmit() {
    try {
      const values = await form.validateFields()
      const exp: Dayjs = values.expirationDate

      const payload = {
        name: String(values.name).trim(),
        price: Number(values.price),
        stock: Number(values.stock),
        expirationDate: exp.format('YYYY-MM-DD'),
      }

      if (mode === 'create') {
        await createProduct(payload)
        message.success(`✅ Producto "${payload.name}" creado correctamente`)
      } else if (editing) {
        await updateProduct(editing.id, payload)
        message.success(`✅ Producto "${payload.name}" actualizado correctamente`)
      }

      closeModal()
      await refresh()
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'errorFields' in err) return
      message.error('Ocurrió un error al guardar')
    }
  }

  async function onDelete(record: Product) {
    Modal.confirm({
      title: '⚠️ Eliminar producto',
      content: (
        <div>
          <p>
            ¿Seguro que deseas eliminar <strong>"{record.name}"</strong>?
          </p>
          <p style={{ color: '#8c8c8c', fontSize: '12px' }}>
            Stock actual: {record.stock} kg | Valor:{' '}
            {formatMoneyMXN(Number(record.price) * Number(record.stock))}
          </p>
          <p style={{ color: '#ff4d4f', fontSize: '12px' }}>Esta acción no se puede deshacer.</p>
        </div>
      ),
      okType: 'danger',
      okText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      async onOk() {
        try {
          await deleteProduct(record.id)
          message.success(`✅ Producto "${record.name}" eliminado correctamente`)
          await refresh()
        } catch {
          message.error('❌ No se pudo eliminar el producto')
        }
      },
    })
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return data.filter((p) => {
      const matchesSearch = !q || p.name.toLowerCase().includes(q)
      const matchesExp = expFilter === 'all' || getExpirationStatus(p.expirationDate) === expFilter
      const matchesStock = stockFilter === 'all' || stockLevel(Number(p.stock)) === stockFilter
      return matchesSearch && matchesExp && matchesStock
    })
  }, [data, search, expFilter, stockFilter])

  function exportFilteredCsv() {
    if (!filtered.length) {
      message.warning('No hay datos para exportar')
      return
    }

    const rows = [
      ['id', 'name', 'price', 'stock_kg', 'inventory_value', 'expirationDate'],
      ...filtered.map((p) => [
        escapeCsv(p.id),
        escapeCsv(p.name),
        escapeCsv(p.price),
        escapeCsv(p.stock),
        escapeCsv(Number(p.price) * Number(p.stock)),
        escapeCsv(p.expirationDate),
      ]),
    ]

    downloadCsv(`productos_${dayjs().format('YYYY-MM-DD_HH-mm')}.csv`, rows)
  }

  const columns: ColumnsType<Product> = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: 'Producto', dataIndex: 'name' },
    {
      title: 'Precio',
      dataIndex: 'price',
      render: (v: number) => formatMoneyMXN(Number(v)),
    },
    {
      title: 'Cantidad (kg)',
      dataIndex: 'stock',
      render: (v: number) => {
        if (v <= STOCK_LOW_MAX) return <Tag color="red">{v} kg bajo</Tag>
        if (v <= STOCK_MID_MAX) return <Tag color="orange">{v} kg medio</Tag>
        return <Tag color="green">{v} kg alto</Tag>
      },
    },
    {
      title: 'Caducidad',
      dataIndex: 'expirationDate',
      render: (_, r) => {
        const status = getExpirationStatus(r.expirationDate)
        const color =
        status === 'caducado' ? 'red' :
        status === 'por_caducar' ? 'orange' :
        'green'

        const label =
          status === 'caducado' ? 'Caducado' : status === 'por_caducar' ? 'Por caducar' : 'Vigente'

        return (
          <Space>
            <Tag color={color}>{label}</Tag>
            <span>{daysUntil(r.expirationDate)} días</span>
          </Space>
        )
      },
    },
    {
      title: 'Acciones',
      render: (_, r) => (
        <Space>
          <Tooltip title="Editar">
            <Button icon={<EditOutlined />} onClick={(e) => openEdit(r, e)} />
          </Tooltip>
          <Tooltip title="Eliminar">
            <Button danger icon={<DeleteOutlined />} onClick={() => onDelete(r)} />
          </Tooltip>
        </Space>
      ),
    },
  ]

  const inventoryValue = useMemo(() => {
    return filtered.reduce((acc, p) => acc + Number(p.price) * Number(p.stock), 0)
  }, [filtered])

  return (
    <MainLayout>
      <Title level={2}>Gestión de Productos</Title>
      <Text type="secondary">Administra inventario y caducidad</Text>
      <Divider />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Productos Filtrados"
              value={filtered.length}
              suffix={`/ ${data.length}`}
              prefix={<AppstoreOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Stock Filtrado"
              value={filtered.reduce((acc, p) => acc + Number(p.stock), 0)}
              suffix="kg"
              prefix={<AppstoreOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Tooltip title="Valor total del inventario filtrado">
              <Statistic
                title="Valor Inventario"
                value={inventoryValue}
                formatter={(value) => formatMoneyMXN(Number(value))}
                valueStyle={{ color: '#1890ff' }}
              />
            </Tooltip>
          </Card>
        </Col>
      </Row>

      <Space wrap style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={(e) => openCreate(e)}>
          Nuevo
        </Button>
        <Button icon={<ReloadOutlined />} onClick={refresh} loading={loading}>
          Recargar
        </Button>
        <Button icon={<DownloadOutlined />} onClick={exportFilteredCsv}>
          Exportar CSV
        </Button>

        <Input
          prefix={<SearchOutlined />}
          placeholder="Buscar producto"
          allowClear
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 200 }}
        />

        <Tooltip title="Filtrar por estado de caducidad">
          <Select
            placeholder="Filtrar por caducidad"
            value={expFilter}
            onChange={setExpFilter}
            style={{ width: 180 }}
            options={[
              { label: '📋 Todos', value: 'all' },
              { label: '✅ Vigente', value: 'vigente' },
              { label: '⚠️ Por caducar', value: 'por_caducar' },
              { label: '❌ Caducado', value: 'caducado' },
            ]}
          />
        </Tooltip>

        <Tooltip title="Filtrar por nivel de stock">
          <Select
            placeholder="Filtrar por stock"
            value={stockFilter}
            onChange={setStockFilter}
            style={{ width: 160 }}
            options={[
              { label: '📋 Todos', value: 'all' },
              { label: '🔴 Stock bajo', value: 'low' },
              { label: '🟠 Stock medio', value: 'mid' },
              { label: '🟢 Stock alto', value: 'high' },
            ]}
          />
        </Tooltip>
      </Space>

      {loading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : filtered.length === 0 ? (
        <Empty
          description={
            data.length === 0
              ? 'No hay productos registrados. ¡Crea el primero!'
              : 'No hay productos con esos filtros'
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} productos`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
        />
      )}

      <Modal
        open={open}
        title={mode === 'create' ? 'Nuevo producto' : 'Editar producto'}
        onOk={onSubmit}
        onCancel={closeModal}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Nombre" rules={[{ required: true }]}>
            <Input ref={nameInputRef} />
          </Form.Item>

          <Form.Item name="price" label="Precio" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="stock"
            label="Cantidad (kg)"
            rules={[{ required: true, message: 'La cantidad es obligatoria' }]}
          >
            <InputNumber
              min={0}
              step={0.1}
              precision={2}
              style={{ width: '100%' }}
              placeholder="Ej: 2.5"
            />
          </Form.Item>

          <Form.Item name="expirationDate" label="Caducidad" rules={[{ required: true }]}>
            <DatePicker
              format="YYYY-MM-DD"
              disabledDate={(d) => d && d < dayjs().startOf('day')}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </MainLayout>
  )
}

export default Products
