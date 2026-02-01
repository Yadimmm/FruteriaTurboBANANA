import React from 'react'
import { Result, Button } from 'antd'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title="Algo salió mal"
          subTitle="Ha ocurrido un error inesperado. Por favor, recarga la página."
          extra={
            <Button type="primary" onClick={() => window.location.reload()}>
              Recargar página
            </Button>
          }
        />
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
