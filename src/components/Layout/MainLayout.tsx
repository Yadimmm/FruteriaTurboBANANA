import { Layout, Menu, Typography } from 'antd'
import {
  DashboardOutlined,
  ShoppingOutlined,
  PlusCircleOutlined,
  MinusCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import type { MenuProps } from 'antd'

const { Sider, Content } = Layout
const { Text } = Typography

const items: MenuProps['items'] = [
  {
    key: '/',
    icon: <DashboardOutlined />,
    label: 'Dashboard',
  },
  {
    key: '/productos',
    icon: <ShoppingOutlined />,
    label: 'Productos',
  },
  {
    key: '/entradas',
    icon: <PlusCircleOutlined />,
    label: 'Entradas',
  },
  {
    key: '/salidas',
    icon: <MinusCircleOutlined />,
    label: 'Salidas',
  },
  {
    key: '/caducidad',
    icon: <ClockCircleOutlined />,
    label: 'Caducidad',
  },
]

interface Props {
  children: React.ReactNode
}

const MainLayout = ({ children }: Props) => {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        style={{
          background: 'linear-gradient(180deg, #001529 0%, #002140 100%)',
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
        }}
      >
        {/* Logo Container */}
        <div
          style={{
            height: 140,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px 12px 12px 12px',
            marginBottom: '16px',
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative background */}
          <div
            style={{
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: 'radial-gradient(circle, rgba(255,193,7,0.1) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          <img
            src="/FruteriaTurboBanana.png"
            alt="Frutería Turbobanana"
            style={{
              width: '100%',
              maxWidth: '110px',
              height: 'auto',
              objectFit: 'contain',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
              transition: 'transform 0.3s ease',
              cursor: 'pointer',
              position: 'relative',
              zIndex: 1,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05) rotate(2deg)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1) rotate(0deg)'
            }}
            onClick={() => navigate('/')}
          />

          <Text
            style={{
              color: 'rgba(255,255,255,0.85)',
              fontSize: '11px',
              marginTop: '8px',
              fontWeight: 500,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              position: 'relative',
              zIndex: 1,
            }}
          >
            Sistema de Gestión
          </Text>
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={items}
          onClick={({ key }) => navigate(key)}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '14px',
          }}
          aria-label="Navegación principal"
        />
      </Sider>

      <Layout>
        <Content
          style={{
            margin: 16,
            background: 'transparent',
            minHeight: 'calc(100vh - 32px)',
          }}
          role="main"
          aria-label="Contenido principal"
        >
          <div
            style={{
              background: '#fff',
              padding: 32,
              borderRadius: 16,
              boxShadow: '0 4px 12px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)',
              minHeight: '100%',
              animation: 'fadeInUp 0.5s ease-out',
            }}
          >
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
