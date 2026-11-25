import { Component, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import DataManagementScreen from './components/DataManagementScreen'
import DashboardOverview from './components/DashboardOverview'
import InventoryPage from './components/InventoryPage'
import ForecastingPage from './components/ForecastingPage'
import CustomerPage from './components/CustomerPage'
import SettingsPage from './components/SettingsPage'
import {
  IconArrowSwap,
  IconBell,
  IconChevronLeft,
  IconGoogle,
  IconLock,
  IconMail,
  IconPlus,
  IconSparkSmall,
  IconSignOut,
  IconTrend,
  IconUser,
  IconProjectMark,
  NavIcon,
} from './components/Icons.jsx'
import { isSupabaseConfigured, supabase } from './supabaseClient'

const navItems = [
  { label: 'Data Management', icon: 'database', route: 'data-management' },
  { label: 'Overview', icon: 'grid', route: 'dashboard' },
  { label: 'Forecasting', icon: 'trend', route: 'forecasting' },
  { label: 'Inventory', icon: 'box', route: 'inventory' },
  { label: 'Customers', icon: 'users', route: 'customers' },
  { label: 'Settings', icon: 'gear', route: 'settings' },
]

const toolboxActions = [
  { title: 'Remove Duplicates', icon: 'duplicate', action: 'removeDuplicates' },
  { title: 'Fill Missing Values', icon: 'fill', action: 'fillMissingValues' },
  { title: 'Format Dates', icon: 'calendar', action: 'formatDates' },
]

const featureActions = [
  { title: 'Generate Sales Trends', icon: 'spark', tone: 'mint', action: 'salesTrends' },
  {
    title: 'Calculate Customer Metrics',
    icon: 'target',
    tone: 'lavender',
    action: 'customerMetrics',
  },
]

const maxBrowserExcelBytes = 20 * 1024 * 1024
const defaultUploadMessage =
  'Support for CSV and JSON files, plus Excel workbooks up to 20MB for browser processing'
const uploadHistoryStoragePrefix = 'aire-upload-history-v2'
const forecastModelStoragePrefix = 'aire-forecast-model-v2'
const forecastModelVersion = 'sme-90d-v4'
const uploadHistoryTable = 'upload_history'
const uploadStorageBucket = 'aire-uploads'
const maxUploadHistoryItems = 12

const initialAuthForm = {
  fullName: '',
  email: '',
  password: '',
  remember: true,
}

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidUpdate(previousProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null })
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="app-error-page">
          <div className="app-error-card">
            <span>AIRE</span>
            <h1>This page could not load</h1>
            <p>
              The current workspace data caused this view to stop rendering. Go back to Data
              Management, reload your file, then open the module again.
            </p>
            <pre>{this.state.error.message}</pre>
            <button type="button" onClick={() => navigateTo('data-management')}>
              Back to Data Management
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

function App() {
  const [session, setSession] = useState(null)
  const [route, setRoute] = useState(() => getRouteFromHash())

  useEffect(() => {
    const handleHashChange = () => setRoute(getRouteFromHash())
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      return
    }

    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (nextSession?.user && ['#/signin', '#/signup'].includes(window.location.hash)) {
        navigateTo('data-management')
      } else if (!nextSession?.user && ['#/dashboard', '#/forecasting', '#/inventory', '#/customers'].includes(window.location.hash)) {
        navigateTo('data-management')
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  if (!isSupabaseConfigured) {
    return <SupabaseSetupScreen />
  }

  if (route === 'signin' || route === 'signup') {
    return (
      <AuthPage
        mode={route}
        onSwitchMode={(nextMode) => navigateTo(nextMode)}
        onBack={() => navigateTo('data-management')}
      />
    )
  }

  return (
    <AppErrorBoundary resetKey={route}>
      <DashboardScreen user={session?.user ?? null} route={route} />
    </AppErrorBoundary>
  )
}

function DashboardScreen({ user, route }) {
  const inputRef = useRef(null)
  const pageHeadingRef = useRef(null)
  const uploadCardRef = useRef(null)
  const dashboardTopRef = useRef(null)
  const [dataset, setDataset] = useState(null)
  const [datasetHistory, setDatasetHistory] = useState([])
  const [operationLog, setOperationLog] = useState([])
  const [page, setPage] = useState(1)
  const [uploadMessage, setUploadMessage] = useState(defaultUploadMessage)
  const [isDragging, setIsDragging] = useState(false)
  const [authMenuOpen, setAuthMenuOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [activeToast, setActiveToast] = useState(null)
  const [authError, setAuthError] = useState('')
  const [dashboardSearch, setDashboardSearch] = useState('')
  const [dashboardTab, setDashboardTab] = useState('global-view')
  const [trendRange, setTrendRange] = useState('7d')
  const [completedDashboardActions, setCompletedDashboardActions] = useState([])
  const [dashboardViewKey, setDashboardViewKey] = useState(0)
  const [uploadHistory, setUploadHistory] = useState([])
  const [historyReady, setHistoryReady] = useState(false)
  const [analysisReady, setAnalysisReady] = useState(false)
  const [overviewScope, setOverviewScope] = useState('current')
  const [executedForecast, setExecutedForecast] = useState(null)
  const [forecastExecutionStatus, setForecastExecutionStatus] = useState('idle')
  const [inventoryDecisionPanelOpen, setInventoryDecisionPanelOpen] = useState(false)
  const [forecastGenerateRequest, setForecastGenerateRequest] = useState(0)
  const [forecastPageStatus, setForecastPageStatus] = useState('idle')
  const previousSavedUploadCountRef = useRef(0)
  const dashboardInventoryRef = useRef(null)
  const dashboardCustomerRef = useRef(null)

  const rowsPerPage = 4
  const previewColumns = dataset ? dataset.columns.slice(0, 6) : []
  const totalRows = dataset ? dataset.rows.length : 0
  const totalPages = dataset ? Math.max(1, Math.ceil(totalRows / rowsPerPage)) : 1
  const safePage = Math.min(page, totalPages)
  const startIndex = (safePage - 1) * rowsPerPage
  const previewRows = dataset
    ? dataset.rows.slice(startIndex, startIndex + rowsPerPage)
    : []
  const savedUploadsOverview = useMemo(
    () => buildSavedUploadsOverviewDataset(uploadHistory, dataset),
    [uploadHistory, dataset]
  )
  const hasDataset = Boolean(dataset)
  const analyticsUnlocked = Boolean(user && analysisReady && hasDataset)
  const normalizedRoute =
    (route === 'dashboard' || route === 'forecasting' || route === 'inventory' || route === 'customers') && !analyticsUnlocked
      ? 'data-management'
      : route
  const canUseAllSavedMonths = Boolean(savedUploadsOverview?.dataset && savedUploadsOverview.count > 1)
  const effectiveOverviewScope =
    (overviewScope === 'all' || !dataset) && savedUploadsOverview?.dataset ? 'all' : 'current'
  const overviewDataset =
    effectiveOverviewScope === 'all' && savedUploadsOverview?.dataset
      ? savedUploadsOverview.dataset
      : dataset
  const overviewDatasetKey = getDatasetExecutionKey(overviewDataset)
  const executedForecastForDataset =
    executedForecast?.datasetKey === overviewDatasetKey ? executedForecast : null
  const displayName = user
    ? user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
    : 'Guest'
  const avatarUrl = user
    ? user.user_metadata?.avatar_url || user.user_metadata?.picture || ''
    : ''
  const qualityMetrics = dataset ? calculateQualityMetrics(dataset) : null
  const hasOpenOverlay = authMenuOpen || accountMenuOpen || notificationCenterOpen
  const isDashboardRoute = normalizedRoute === 'dashboard'
  const isForecastingRoute = normalizedRoute === 'forecasting'
  const isInventoryRoute = normalizedRoute === 'inventory'
  const isCustomerRoute = normalizedRoute === 'customers'
  const isSettingsRoute = normalizedRoute === 'settings'
  const forecastingHeaderText = overviewDataset?.fileName
    ? `Forecast uses ${overviewDataset.fileName} and your saved sales history.`
    : 'Upload a sales file and start analysis to unlock live forecast outputs.'
  const inventoryRefreshLabel =
    forecastExecutionStatus === 'running'
      ? 'Training...'
      : executedForecastForDataset?.model
        ? 'Refresh Data'
        : 'Generate Forecast'
  const forecastActionLabel =
    forecastPageStatus === 'loading'
      ? 'Generating...'
      : forecastPageStatus === 'ready'
        ? 'Refresh Forecast'
        : forecastPageStatus === 'fallback'
          ? 'Retry Forecast'
          : 'Generate Forecast'
  const dashboardModel = useMemo(
    () =>
      analysisReady && overviewDataset
        ? buildDashboardModel(overviewDataset, {
            query: dashboardSearch,
            view: dashboardTab,
            range: trendRange,
            scope: effectiveOverviewScope,
            savedUploadCount: savedUploadsOverview?.count ?? 0,
            completedActionIds: completedDashboardActions,
            forecastModel: executedForecastForDataset?.model ?? null,
            forecastGeneratedAt: executedForecastForDataset?.generatedAt ?? '',
            forecastStatus: forecastExecutionStatus,
          })
        : null,
    [
      overviewDataset,
      analysisReady,
      dashboardSearch,
      dashboardTab,
      trendRange,
      effectiveOverviewScope,
      savedUploadsOverview?.count,
      completedDashboardActions,
      executedForecastForDataset?.model,
      executedForecastForDataset?.generatedAt,
      forecastExecutionStatus,
    ]
  )

  const handleForecastModelReady = useCallback((model, generatedAt) => {
    if (!model || !overviewDatasetKey) {
      setExecutedForecast(null)
      setForecastExecutionStatus('idle')
      return
    }

    const forecastRecord = {
      datasetKey: overviewDatasetKey,
      generatedAt,
      model,
    }

    setExecutedForecast(forecastRecord)
    writeStoredForecastModel(user?.id, forecastRecord)
    setForecastExecutionStatus('ready')
  }, [overviewDatasetKey, user?.id])

  const handleForecastRefresh = useCallback(() => {
    if (!overviewDatasetKey) {
      return
    }

    removeStoredForecastModel(user?.id, overviewDatasetKey)
    setExecutedForecast(null)
    setForecastExecutionStatus('idle')
  }, [overviewDatasetKey, user?.id])

  useEffect(() => {
    if (!analysisReady || !overviewDatasetKey || !overviewDataset?.rows?.length) {
      setForecastExecutionStatus('idle')
      return undefined
    }

    if (executedForecast?.datasetKey === overviewDatasetKey) {
      setForecastExecutionStatus('ready')
      return undefined
    }

    const cachedForecast = readStoredForecastModel(user?.id, overviewDatasetKey)
    if (cachedForecast) {
      setExecutedForecast(cachedForecast)
      setForecastExecutionStatus('ready')
      return undefined
    }

    const controller = new AbortController()
    const runStartedAt = Date.now()
    setForecastExecutionStatus('running')

    async function executeForecastForActiveDataset() {
      const result = await requestForecastModel(overviewDataset, controller.signal)

      if (controller.signal.aborted) {
        return
      }

      if (result.ok) {
        const generatedAt = formatHistoryTimestamp(runStartedAt)
        const forecastRecord = {
          datasetKey: overviewDatasetKey,
          generatedAt,
          model: result.model,
        }

        setExecutedForecast(forecastRecord)
        writeStoredForecastModel(user?.id, forecastRecord)
        setForecastExecutionStatus('ready')
        publishNotification(
          'Forecast model executed',
          'Dashboard, Inventory, and Customer KPIs now use the latest forecast model output.',
          'success',
          false
        )
        return
      }

      setForecastExecutionStatus('error')
      publishNotification(
        'Forecast model unavailable',
        `${result.error}. Start the backend on port 8000, then run the analysis again.`,
        'warning'
      )
    }

    void executeForecastForActiveDataset()

    return () => controller.abort()
  }, [analysisReady, overviewDataset, overviewDatasetKey, executedForecast?.datasetKey, user?.id])

  useEffect(() => {
    if (!activeToast) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      setActiveToast(null)
    }, 3400)

    return () => window.clearTimeout(timeoutId)
  }, [activeToast])

  useEffect(() => {
    let cancelled = false

    setHistoryReady(false)

    async function loadUploadHistory() {
      const localHistory = readStoredUploadHistory(user?.id)

      if (!user?.id) {
        if (!cancelled) {
          setUploadHistory(localHistory)
          setHistoryReady(true)
        }
        return
      }

      try {
        const remoteHistory = await readSupabaseUploadHistory(user.id)
        if (!cancelled) {
          setUploadHistory(remoteHistory.length ? remoteHistory : localHistory)
          setHistoryReady(true)
        }
      } catch {
        if (!cancelled) {
          setUploadHistory(localHistory)
          setHistoryReady(true)
        }
      }
    }

    void loadUploadHistory()

    return () => {
      cancelled = true
    }
  }, [user?.id])

  useEffect(() => {
    if (!historyReady) {
      return
    }

    writeStoredUploadHistory(user?.id, uploadHistory)
  }, [historyReady, uploadHistory, user?.id])

  useEffect(() => {
    if ((route === 'dashboard' || route === 'forecasting' || route === 'inventory' || route === 'customers') && !analyticsUnlocked) {
      navigateTo('data-management')
    }
  }, [analyticsUnlocked, route])

  useEffect(() => {
    const savedUploadCount = savedUploadsOverview?.count ?? 0

    if (savedUploadCount > 1 && previousSavedUploadCountRef.current !== savedUploadCount) {
      setOverviewScope('all')
    }

    if (savedUploadCount <= 1 && overviewScope === 'all' && dataset) {
      setOverviewScope('current')
    }

    previousSavedUploadCountRef.current = savedUploadCount
  }, [dataset, overviewScope, savedUploadsOverview?.count])

  function publishNotification(title, body, tone = 'info', showToast = true) {
    const entry = createNotificationEntry(title, body, tone)
    setNotifications((current) => [entry, ...current].slice(0, 8))
    if (showToast) {
      setActiveToast(entry)
    }
  }

  function commitUploadHistory(updater) {
    setUploadHistory((current) => {
      const nextHistory = typeof updater === 'function' ? updater(current) : updater
      return nextHistory
    })
  }

  function closeMenus() {
    setAuthMenuOpen(false)
    setAccountMenuOpen(false)
    setNotificationCenterOpen(false)
    setInventoryDecisionPanelOpen(false)
  }

  function handleNavSelect(item) {
    const isAnalyticsItem =
      item.route === 'dashboard' ||
      item.route === 'forecasting' ||
      item.route === 'inventory' ||
      item.route === 'customers'

    if (isAnalyticsItem && !analyticsUnlocked) {
      closeMenus()
      navigateTo('data-management')
      window.requestAnimationFrame(() => {
        uploadCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
      setUploadMessage('Sign in, upload a file, and run analysis to unlock the overview sections.')
      publishNotification(
        'Analytics locked',
        'Sign in, upload a file, and run analysis before opening Overview, Forecasting, Inventory, or Customers.',
        'warning'
      )
      return
    }

    if (item.route) {
      closeMenus()
      if (item.route === 'dashboard' && getSavedUploadDatasetCount(uploadHistory, dataset) > 1) {
        setOverviewScope('all')
      }
      navigateTo(item.route)
      window.requestAnimationFrame(() => {
        if (item.route === 'dashboard') {
          dashboardTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        } else if (item.route === 'forecasting') {
          dashboardTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        } else if (item.route === 'inventory' || item.route === 'customers' || item.route === 'settings') {
          window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
        } else if (item.route === 'data-management') {
          uploadCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      })
      return
    }

    publishNotification(
      `${item.label} is not ready yet`,
      `${item.label} will be connected after the core overview workflow is complete.`,
      'info'
    )
  }

  function openFilePicker() {
    inputRef.current?.click()
  }

  async function loadDataset(file) {
    const extension = file.name.split('.').pop()?.toLowerCase()
    const signature = getFileSignature(file)

    if (
      (extension === 'xls' || extension === 'xlsx') &&
      file.size > maxBrowserExcelBytes
    ) {
      const sizeLabel = formatBytes(file.size)
      const errorMessage =
        `${file.name} is ${sizeLabel}. Large Excel workbooks can freeze the browser. ` +
        'Use a CSV extract containing about 5,000 to 20,000 rows, or split the workbook by year.'
      setUploadMessage(errorMessage)
      publishNotification('Excel file is too large', errorMessage, 'warning')
      return
    }

    const cachedHistoryItem = uploadHistory.find(
      (item) => item.signature === signature && item.datasetSnapshot
    )

    if (cachedHistoryItem?.datasetSnapshot) {
      const restoredDataset = attachDatasetSourceMeta(
        cloneDataset(cachedHistoryItem.datasetSnapshot),
        cachedHistoryItem.signature
      )

      setDataset(restoredDataset)
      setDatasetHistory([])
      setPage(1)
      setCompletedDashboardActions([])
      setDashboardSearch('')
      setAnalysisReady(false)
      setOverviewScope(getSavedUploadDatasetCount(uploadHistory, restoredDataset) > 1 ? 'all' : 'current')
      setOperationLog([
        createLogEntry(
          'Loaded from History',
          `Restored ${file.name} from your saved uploads.`,
          'success'
        ),
      ])
      setUploadMessage(`Loaded ${restoredDataset.rows.length} rows from ${file.name} history`)
      setDashboardViewKey((current) => current + 1)
      commitUploadHistory((current) =>
        upsertUploadHistoryItem(current, {
          ...cachedHistoryItem,
          uploadedAt: Date.now(),
          uploadedLabel: formatHistoryTimestamp(Date.now()),
        })
      )
      publishNotification(
        'History restored',
        `${file.name} opened from your saved upload history.`,
        'success'
      )
      return
    }

    try {
      let parsed

      if (extension === 'csv') {
        const text = await file.text()
        parsed = parseCsv(text, file.name)
      } else if (extension === 'json') {
        const text = await file.text()
        parsed = parseJson(text, file.name)
      } else if (extension === 'xls' || extension === 'xlsx') {
        const workbookBuffer = await file.arrayBuffer()
        parsed = await parseExcelWorkbook(workbookBuffer, file.name)
      } else {
        throw new Error('Please upload a CSV, JSON, XLS, or XLSX file.')
      }

      const parsedDataset = attachDatasetSourceMeta(parsed, signature)
      const historyItem = createUploadHistoryItem(file, parsedDataset)

      setDataset(parsedDataset)
      setDatasetHistory([])
      setPage(1)
      setCompletedDashboardActions([])
      setDashboardSearch('')
      setAnalysisReady(false)
      setOverviewScope(
        getSavedUploadDatasetCount(
          upsertUploadHistoryItem(uploadHistory, historyItem),
          parsedDataset
        ) > 1
          ? 'all'
          : 'current'
      )
      setOperationLog([
        createLogEntry(
          'Data Import Successful',
          `Loaded ${parsed.rows.length} rows from ${file.name}.`,
          'success'
        ),
      ])
      setUploadMessage(`Loaded ${parsed.rows.length} rows from ${file.name}`)
      setDashboardViewKey((current) => current + 1)
      commitUploadHistory((current) => upsertUploadHistoryItem(current, historyItem))
      publishNotification(
        'Dataset ready',
        `${file.name} is ready with ${parsed.rows.length} rows. Run analysis when you are ready to forecast.`,
        'success'
      )

      if (user?.id) {
        window.setTimeout(async () => {
          try {
            const savedItem = await saveUploadHistoryToSupabase(user.id, file, historyItem)
            commitUploadHistory((current) => upsertUploadHistoryItem(current, savedItem))
          } catch {
            publishNotification(
              'Saved in browser only',
              `${file.name} is ready, but cloud upload could not be completed.`,
              'warning'
            )
          }
        }, 0)
      }
    } catch (error) {
      setUploadMessage(error.message)
      publishNotification('Upload failed', error.message, 'warning')
    }
  }

  async function handleInputChange(event) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }
    await loadDataset(file)
    event.target.value = ''
  }

  function handleDrop(event) {
    event.preventDefault()
    setIsDragging(false)

    const file = event.dataTransfer.files?.[0]
    if (file) {
      void loadDataset(file)
    }
  }

  function handleToolboxAction(action) {
    if (!dataset) {
      setUploadMessage('Upload a file first to use the cleaning toolbox.')
      publishNotification(
        'Upload your files',
        'Upload a CSV, JSON, or Excel file before using the cleaning toolbox.',
        'warning'
      )
      return
    }

    const previousDataset = cloneDataset(dataset)
    let nextDataset = previousDataset
    let logEntry = null

    if (action === 'removeDuplicates') {
      const result = removeDuplicateRows(previousDataset)
      nextDataset = result.dataset
      logEntry = createLogEntry(
        'Removed Duplicates',
        result.removedCount > 0
          ? `Removed ${result.removedCount} duplicate row${result.removedCount === 1 ? '' : 's'}.`
          : 'No duplicate rows were found.',
        'filter'
      )
    }

    if (action === 'fillMissingValues') {
      const result = fillMissingValues(previousDataset)
      nextDataset = result.dataset
      logEntry = createLogEntry(
        'Filled Missing Values',
        result.updatedCount > 0
          ? `Filled ${result.updatedCount} missing field${result.updatedCount === 1 ? '' : 's'}.`
          : 'No missing values were found.',
        'success'
      )
    }

    if (action === 'formatDates') {
      const result = formatDateColumns(previousDataset)
      nextDataset = result.dataset
      logEntry = createLogEntry(
        'Formatted Dates',
        result.updatedCount > 0
          ? `Standardized ${result.updatedCount} date value${result.updatedCount === 1 ? '' : 's'}.`
          : 'No date values needed formatting.',
        'success'
      )
    }

    const nextDatasetWithMeta = attachDatasetSourceMeta(
      nextDataset,
      dataset.sourceSignature ?? dataset.fileName
    )

    setDatasetHistory((current) => [...current, cloneDataset(dataset)])
    setDataset(nextDatasetWithMeta)
    commitUploadHistory((current) => syncUploadHistorySnapshot(nextDatasetWithMeta, current))
    if (user?.id) {
      void updateSupabaseUploadSnapshot(user.id, nextDatasetWithMeta).catch(() => {
        publishNotification(
          'History saved in browser only',
          'The cleaned workspace is ready, but its cloud history snapshot could not be updated.',
          'warning'
        )
      })
    }
    setPage(1)
    setOperationLog((current) => [logEntry, ...current])
    publishNotification(
      logEntry.title,
      logEntry.body,
      logEntry.status === 'success' ? 'success' : 'info'
    )
  }

  function handleFeatureAction(action) {
    if (!dataset) {
      setUploadMessage('Upload a file first to use feature engineering.')
      publishNotification(
        'Upload your files',
        'Upload a CSV, JSON, or Excel file before running feature engineering.',
        'warning'
      )
      return
    }

    if (action === 'salesTrends') {
      const amountColumn = findColumn(dataset.columns, ['amount', 'sales', 'revenue'])
      const total = amountColumn
        ? dataset.rows.reduce((sum, row) => sum + parseNumericValue(row[amountColumn]), 0)
        : 0

      const logEntry = createLogEntry(
        'Generated Sales Trends',
        amountColumn
          ? `Scanned ${dataset.rows.length} rows and summarized ${formatCurrency(total)} in total volume.`
          : 'Scanned the dataset and prepared a trend summary without a numeric sales column.',
        'success'
      )

      setOperationLog((current) => [
        logEntry,
        ...current,
      ])
      publishNotification(logEntry.title, logEntry.body, 'success')
      return
    }

    if (action === 'customerMetrics') {
      const customerColumn = findColumn(dataset.columns, ['customer', 'client', 'buyer'])
      const uniqueCustomers = customerColumn
        ? new Set(
            dataset.rows
              .map((row) => String(row[customerColumn] ?? '').trim())
              .filter(Boolean)
          ).size
        : 0

      const logEntry = createLogEntry(
        'Calculated Customer Metrics',
        customerColumn
          ? `Detected ${uniqueCustomers} unique customer record${uniqueCustomers === 1 ? '' : 's'}.`
          : 'Prepared customer metrics, but no customer column was detected in the uploaded file.',
        'filter'
      )

      setOperationLog((current) => [
        logEntry,
        ...current,
      ])
      publishNotification(logEntry.title, logEntry.body, 'info')
    }
  }

  function handleUndoAll() {
    if (!datasetHistory.length) {
      const logEntry = createLogEntry(
        'Undo Skipped',
        'There are no cleaning actions to undo yet.',
        'filter'
      )

      setOperationLog((current) => [
        logEntry,
        ...current,
      ])
      publishNotification(logEntry.title, logEntry.body, 'info')
      return
    }

    const originalDataset = datasetHistory[0]
    const restoredDataset = attachDatasetSourceMeta(
      originalDataset,
      dataset?.sourceSignature ?? originalDataset.fileName
    )

    setDataset(restoredDataset)
    setDatasetHistory([])
    commitUploadHistory((current) => syncUploadHistorySnapshot(restoredDataset, current))
    if (user?.id) {
      void updateSupabaseUploadSnapshot(user.id, restoredDataset).catch(() => {
        publishNotification(
          'History saved in browser only',
          'The restored workspace is ready, but its cloud history snapshot could not be updated.',
          'warning'
        )
      })
    }
    setPage(1)
    const logEntry = createLogEntry(
      'Undo Complete',
      'Restored the dataset to its originally uploaded state.',
      'success'
    )

    setOperationLog((current) => [
      logEntry,
      ...current,
    ])
    publishNotification(logEntry.title, logEntry.body, 'success')
  }

  async function handleHistorySelect(item) {
    let storedDataset = item?.datasetSnapshot

    if (!storedDataset && item?.storagePath) {
      try {
        setUploadMessage(`Loading ${item.fileName} from saved storage...`)
        storedDataset = await downloadSupabaseHistoryDataset(item)
      } catch (error) {
        setUploadMessage(error.message)
        publishNotification('History unavailable', error.message, 'warning')
        return
      }
    }

    if (!storedDataset) {
      setUploadMessage('This history item only saved metadata.')
      publishNotification(
        'History unavailable',
        'Upload this file again because no browser snapshot or cloud file is available.',
        'warning'
      )
      return
    }

    closeMenus()
    const latestSnapshot =
      dataset?.sourceSignature === item.signature ? dataset : storedDataset
    setAnalysisReady(true)
    setDataset(attachDatasetSourceMeta(latestSnapshot, item.signature))
    setDatasetHistory([])
    setPage(1)
    setCompletedDashboardActions([])
    setDashboardSearch('')
    setOverviewScope(getSavedUploadDatasetCount(uploadHistory, latestSnapshot) > 1 ? 'all' : 'current')
    setOperationLog([
      createLogEntry(
        'Loaded from History',
        `Restored ${item.fileName} from your saved uploads.`,
        'success'
      ),
    ])
    setUploadMessage(`Loaded ${item.rows} rows from ${item.fileName} history`)
    setDashboardViewKey((current) => current + 1)
    commitUploadHistory((current) =>
      upsertUploadHistoryItem(current, {
        ...item,
        uploadedAt: Date.now(),
        uploadedLabel: formatHistoryTimestamp(Date.now()),
      })
    )

    navigateTo('dashboard')
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
        dashboardTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    })

    publishNotification(
      'History restored',
      `${item.fileName} opened from your saved upload history.`,
      'success'
    )
  }

  async function handleDeleteHistoryItem(item) {
    if (!item?.id) {
      return
    }

    commitUploadHistory((current) => current.filter((entry) => entry.id !== item.id))

    let deleteError = null
    if (user?.id) {
      try {
        await deleteSupabaseUploadHistoryItem(user.id, item)
      } catch (error) {
        deleteError = error
      }
    }

    publishNotification(
      deleteError ? 'Deleted locally' : 'History deleted',
      deleteError
        ? `${item.fileName} was removed from this browser. Check Supabase setup if it still appears after refresh.`
        : `${item.fileName} was removed from your upload history.`,
      deleteError ? 'warning' : 'info'
    )
  }

  function handleRocketAction() {
    closeMenus()

    if (dataset) {
      setAnalysisReady(true)
      if (getSavedUploadDatasetCount(uploadHistory, dataset) > 1) {
        setOverviewScope('all')
      }
      navigateTo('dashboard')
      window.requestAnimationFrame(() => {
        dashboardTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
      return
    }

    navigateTo('data-management')
    window.requestAnimationFrame(() => {
      uploadCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
    setUploadMessage('Upload your files to open the overview preview and tools.')
    publishNotification(
      'Upload your files',
      'Sign in and upload a CSV, JSON, or Excel file first, then the rocket button will bring you back to the overview.',
      'warning'
    )
  }

  function handleNewAnalysis() {
    closeMenus()
    setAnalysisReady(false)
    navigateTo('data-management')
    setDataset(null)
    setDatasetHistory([])
    setOperationLog([])
    setPage(1)
    setUploadMessage(defaultUploadMessage)
    setDashboardSearch('')
    setDashboardTab('global-view')
    setTrendRange('7d')
    setOverviewScope('current')
    setCompletedDashboardActions([])
    setDashboardViewKey((current) => current + 1)
    setActiveToast(null)
    setNotifications([])

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      uploadCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })

    publishNotification(
      'New analysis ready',
      'Upload a new CSV, JSON, or Excel file to start another dataset review.',
      'info'
    )
  }

  async function handleGoogleSignIn() {
    setAuthError('')

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      })

      if (error) {
        throw error
      }
    } catch (error) {
      if (error.message?.toLowerCase().includes('provider is not enabled')) {
        setAuthError(
          'Google sign in is not enabled in Supabase yet. Enable Google in Authentication > Providers.'
        )
      } else {
        setAuthError(error.message || 'Google sign in failed.')
      }
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setAccountMenuOpen(false)
    setAuthMenuOpen(false)
    setNotificationCenterOpen(false)
    setAnalysisReady(false)
    setDataset(null)
    setDatasetHistory([])
    setOperationLog([])
    setPage(1)
    setUploadMessage(defaultUploadMessage)
    setDashboardSearch('')
    setDashboardTab('global-view')
    setTrendRange('7d')
    setOverviewScope('current')
    setCompletedDashboardActions([])
    setDashboardViewKey((current) => current + 1)
    setActiveToast(null)
    setNotifications([])
    navigateTo('data-management')
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
      uploadCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  function handleDashboardDecision(action, decision) {
    const actionLabel =
      decision === 'approve'
        ? action.primaryAction
        : decision === 'secondary'
          ? action.secondaryAction || 'Review action'
          : 'Open action'

    if (decision === 'approve') {
      setCompletedDashboardActions((current) =>
        current.includes(action.id) ? current : [...current, action.id]
      )
    }

    const logEntry = createLogEntry(
      actionLabel,
      `${action.title} was triggered from the overview ${decision === 'approve' ? 'action queue' : 'insight card'}.`,
      decision === 'approve' ? 'success' : 'filter'
    )

    setOperationLog((current) => [logEntry, ...current])
    publishNotification(logEntry.title, logEntry.body, decision === 'approve' ? 'success' : 'info')
  }

  function handleDashboardQueueAction(item) {
    const logEntry = createLogEntry(
      `Queued ${item.title}`,
      `${item.title} was reviewed from the ranked action queue.`,
      'filter'
    )

    setOperationLog((current) => [logEntry, ...current])
    publishNotification(logEntry.title, logEntry.body, 'info')
  }

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <IconProjectMark />
          </div>
          <div>
            <div className="brand-title">AIRE</div>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Primary">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={`nav-item${item.route === normalizedRoute ? ' active' : ''}`}
              type="button"
              disabled={
                (item.route === 'data-management' && Boolean(dataset)) ||
                (!analyticsUnlocked &&
                  (item.route === 'dashboard' ||
                    item.route === 'forecasting' ||
                    item.route === 'inventory' ||
                    item.route === 'customers'))
              }
              onClick={() => handleNavSelect(item)}
            >
              <span className="nav-icon">
                <NavIcon type={item.icon} />
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="workspace">
        {hasOpenOverlay ? (
          <button
            className="menu-backdrop"
            type="button"
            aria-label="Close overlay"
            onClick={closeMenus}
          />
        ) : null}

        {activeToast ? (
          <div className={`workspace-toast ${activeToast.tone}`} role="status" aria-live="polite">
            <div className="workspace-toast-title">{activeToast.title}</div>
            <div className="workspace-toast-body">{activeToast.body}</div>
          </div>
        ) : null}

        <header className={`topbar${isDashboardRoute || isForecastingRoute || isInventoryRoute || isCustomerRoute ? ' dashboard-mode' : ''}${isForecastingRoute ? ' forecasting-mode' : ''}`}>
          {isDashboardRoute && dashboardModel?.hero ? (
            <div
              className="topbar-insight"
              title={`${dashboardModel.hero.prefix} ${dashboardModel.hero.highlight} ${dashboardModel.hero.suffix}`}
            >
              <span>{dashboardModel.hero.prefix}</span>{' '}
              <strong>{dashboardModel.hero.highlight}</strong>{' '}
              <span>{dashboardModel.hero.suffix}</span>
            </div>
          ) : null}
          {isForecastingRoute ? (
            <div className="topbar-insight topbar-insight-forecast" title={forecastingHeaderText}>
              <span className="topbar-insight-eyebrow">Forecasting</span>
              <span>{forecastingHeaderText}</span>
            </div>
          ) : null}
          {isCustomerRoute ? (
            <div className="topbar-insight topbar-insight-customer">
              <span className="topbar-insight-eyebrow">Customer Intelligence</span>
              <span>
                Synthesizing behavioral patterns into <strong>actionable loyalty strategies</strong>.
              </span>
            </div>
          ) : null}
          {isInventoryRoute ? (
            <div className="topbar-insight topbar-insight-inventory">
              <span className="topbar-insight-eyebrow">Inventory Intelligence</span>
              <span>
                Turn stock movement, predicted demand, supplier reliability, and cost impact into
                clear inventory decisions for SME retail operations.
              </span>
            </div>
          ) : null}
          <div className="topbar-actions">
            {isForecastingRoute ? (
              <>
                {forecastPageStatus === 'ready' ? (
                  <span className="topbar-forecast-status ready" role="status">Forecast ready</span>
                ) : forecastPageStatus === 'fallback' ? (
                  <span className="topbar-forecast-status fallback" role="status">Using fallback view</span>
                ) : null}
                <button
                  className={`topbar-refresh-button${forecastPageStatus === 'loading' ? ' is-loading' : ''}`}
                  type="button"
                  disabled={forecastPageStatus === 'loading'}
                  onClick={() => {
                    setForecastPageStatus('loading')
                    setForecastGenerateRequest((value) => value + 1)
                  }}
                >
                  <IconTrend />
                  <span>{forecastActionLabel}</span>
                </button>
              </>
            ) : null}
            {isInventoryRoute ? (
              <button
                className="topbar-refresh-button"
                type="button"
                disabled={forecastExecutionStatus === 'running'}
                onClick={handleForecastRefresh}
              >
                <IconTrend />
                <span>{inventoryRefreshLabel}</span>
              </button>
            ) : null}
            {isInventoryRoute ? (
              <button
                className="icon-button inventory-decision-topbar-button"
                type="button"
                aria-label="Open AI decision recommendations"
                title="AI decision recommendations"
                onClick={() => {
                  setInventoryDecisionPanelOpen(true)
                  setNotificationCenterOpen(false)
                  setAuthMenuOpen(false)
                  setAccountMenuOpen(false)
                }}
              >
                <IconSparkSmall />
              </button>
            ) : null}
            <div className="notification-menu">
              <button
                className="icon-button"
                type="button"
                aria-label="Notifications"
                onClick={() => {
                  setNotificationCenterOpen((current) => !current)
                  setAuthMenuOpen(false)
                  setAccountMenuOpen(false)
                }}
              >
                <IconBell />
                {notifications.length ? (
                  <span className="icon-badge">{Math.min(notifications.length, 9)}</span>
                ) : null}
              </button>

              {notificationCenterOpen ? (
                <div className="notification-popover">
                  <div className="notification-popover-header">
                    <div>
                      <div className="notification-popover-title">Notifications</div>
                      <div className="notification-popover-copy">
                        Recent updates from your overview actions.
                      </div>
                    </div>
                    {notifications.length ? (
                      <button
                        className="link-button"
                        type="button"
                        onClick={() => setNotifications([])}
                      >
                        Clear
                      </button>
                    ) : null}
                  </div>

                  <div className="notification-list">
                    {notifications.length ? (
                      notifications.map((item) => (
                        <div className="notification-item" key={item.id}>
                          <div className={`notification-dot ${item.tone}`} />
                          <div className="notification-copy">
                            <div className="notification-title">{item.title}</div>
                            <div className="notification-body">{item.body}</div>
                          </div>
                          <div className="notification-time">{item.time}</div>
                        </div>
                      ))
                    ) : (
                      <div className="notification-empty">
                        Upload a file or run a tool action to create notifications.
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
            <div className="profile-menu">
              <button
                className="avatar-button"
                type="button"
                aria-label={user ? 'Account' : 'Sign in'}
                onClick={() => {
                  if (user) {
                    setAccountMenuOpen((current) => !current)
                    setAuthMenuOpen(false)
                    setNotificationCenterOpen(false)
                  } else {
                    setAuthMenuOpen((current) => !current)
                    setAccountMenuOpen(false)
                    setNotificationCenterOpen(false)
                  }
                }}
              >
                <div className="avatar">
                  <AvatarImage avatarUrl={avatarUrl} />
                </div>
              </button>

              {!user && authMenuOpen ? (
                <div className="profile-popover guest-popover">
                  <div className="guest-popover-title">Continue to your workspace</div>
                  <div className="guest-popover-copy">
                    Sign in with email or continue with Google.
                  </div>
                  {authError ? <div className="auth-alert error compact">{authError}</div> : null}
                  <button
                    className="popover-primary"
                    type="button"
                    onClick={() => navigateTo('signin')}
                  >
                    Sign In
                  </button>
                  <button
                    className="popover-secondary"
                    type="button"
                    onClick={handleGoogleSignIn}
                  >
                    <IconGoogle />
                    <span>Continue with Google</span>
                  </button>
                </div>
              ) : null}

              {user && accountMenuOpen ? (
                <div className="profile-popover account-popover">
                  <div className="account-email">{user.email}</div>
                  <button
                    className="popover-close"
                    type="button"
                    onClick={() => setAccountMenuOpen(false)}
                    aria-label="Close"
                  >
                    &times;
                  </button>
                  <div className="account-avatar-large">
                    <AvatarImage avatarUrl={avatarUrl} large />
                  </div>
                  <div className="account-greeting">Hi, {displayName}!</div>
                  <a
                    className="account-manage"
                    href="https://myaccount.google.com/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Manage your Google Account
                  </a>
                  <div className="account-actions-row">
                    <button className="account-action" type="button" onClick={() => navigateTo('signin')}>
                      <IconPlus />
                      <span>Add account</span>
                    </button>
                    <button className="account-action" type="button" onClick={handleSignOut}>
                      <IconSignOut />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        {isDashboardRoute ? (
        <DashboardOverview
          key={
            overviewDataset
              ? `${effectiveOverviewScope}-${overviewDataset.fileName}-${overviewDataset.rows.length}-${overviewDataset.columns.length}-${dashboardModel?.categoryOverview?.totalLabel ?? ''}-${dashboardModel?.topProducts?.revenue?.totalLabel ?? ''}-${dashboardViewKey}`
              : 'empty'
          }
          topRef={dashboardTopRef}
          inventoryRef={dashboardInventoryRef}
          customerRef={dashboardCustomerRef}
          dataset={overviewDataset}
          dashboardModel={dashboardModel}
          weeklyTrendRange={trendRange}
          onWeeklyTrendRangeChange={setTrendRange}
          onDecisionAction={handleDashboardDecision}
          onQueueAction={handleDashboardQueueAction}
        />
        ) : isForecastingRoute ? (
        <ForecastingPage
          dataset={overviewDataset ?? dataset}
          dashboardModel={dashboardModel}
          executedForecast={executedForecastForDataset}
          topRef={dashboardTopRef}
          onForecastModelReady={handleForecastModelReady}
          generateRequest={forecastGenerateRequest}
          onForecastStatusChange={setForecastPageStatus}
        />
      ) : isInventoryRoute ? (
        <InventoryPage
          dataset={overviewDataset ?? dataset}
          dashboardModel={dashboardModel}
          executedForecast={executedForecastForDataset}
          decisionPanelOpen={inventoryDecisionPanelOpen}
          onDecisionPanelOpenChange={setInventoryDecisionPanelOpen}
          topRef={dashboardTopRef}
        />
      ) : isCustomerRoute ? (
        <CustomerPage
          dataset={overviewDataset ?? dataset}
          dashboardModel={dashboardModel}
          executedForecast={executedForecastForDataset}
          topRef={dashboardTopRef}
        />
      ) : isSettingsRoute ? (
        <SettingsPage
          dataset={overviewDataset ?? dataset}
          executedForecast={executedForecastForDataset}
          user={user}
          topRef={dashboardTopRef}
        />
        ) : (
          <DataManagementScreen
            dataset={dataset}
            featureActions={featureActions}
            handleDrop={handleDrop}
            handleFeatureAction={handleFeatureAction}
            handleDeleteHistoryItem={handleDeleteHistoryItem}
            handleInputChange={handleInputChange}
            handleRocketAction={handleRocketAction}
            handleToolboxAction={handleToolboxAction}
            handleHistorySelect={handleHistorySelect}
            handleUndoAll={handleUndoAll}
            hasDataset={hasDataset}
            inputRef={inputRef}
            isDragging={isDragging}
            openFilePicker={openFilePicker}
            operationLog={operationLog}
            onPageChange={setPage}
            pageHeadingRef={pageHeadingRef}
            previewColumns={previewColumns}
            previewRows={previewRows}
            qualityMetrics={qualityMetrics}
            user={user}
            uploadHistory={uploadHistory}
            safePage={safePage}
            toolboxActions={toolboxActions}
            totalPages={totalPages}
            uploadCardRef={uploadCardRef}
            uploadMessage={uploadMessage}
            onDragEnter={() => setIsDragging(true)}
            onDragLeave={() => setIsDragging(false)}
            onDragOver={(event) => event.preventDefault()}
          />
        )}
      </main>

      <button className="analysis-button" type="button" onClick={handleNewAnalysis}>
        <span className="analysis-plus">+</span>
        <span>New Analysis</span>
      </button>
    </div>
  )
}

function AuthPage({ mode, onSwitchMode, onBack }) {
  const [form, setForm] = useState(initialAuthForm)
  const [authError, setAuthError] = useState('')
  const [authMessage, setAuthMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function updateField(event) {
    const { name, type, checked, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setAuthError('')
    setAuthMessage('')

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            data: {
              full_name: form.fullName.trim(),
            },
            emailRedirectTo: window.location.origin,
          },
        })

        if (error) {
          throw error
        }

        setAuthMessage(
          'Account created. Check your email to confirm your account if email verification is enabled.'
        )
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        })

        if (error) {
          throw error
        }
      }
    } catch (error) {
      setAuthError(error.message || 'Authentication failed.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGoogleSignIn() {
    setSubmitting(true)
    setAuthError('')
    setAuthMessage('')

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      })

      if (error) {
        throw error
      }
    } catch (error) {
      if (error.message?.toLowerCase().includes('provider is not enabled')) {
        setAuthError(
          'Google sign in is not enabled in Supabase yet. Enable Google in Authentication > Providers.'
        )
      } else {
        setAuthError(error.message || 'Google sign in failed.')
      }
      setSubmitting(false)
    }
  }

  return (
    <div className="signin-page">
      <button className="signin-back" type="button" onClick={onBack}>
        <IconChevronLeft />
        <span>Back</span>
      </button>

      <div className="signin-card">
        <div className="signin-header">
          <h1>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</h1>
          <p>Architectural intelligence at your fingertips.</p>
        </div>

        <form className="signin-form" onSubmit={handleSubmit}>
          {mode === 'signup' ? (
            <label className="signin-field">
              <span>Full Name</span>
              <div className="signin-input-wrap">
                <IconUser />
                <input
                  name="fullName"
                  type="text"
                  value={form.fullName}
                  onChange={updateField}
                  placeholder="Your full name"
                  required
                />
              </div>
            </label>
          ) : null}

          <label className="signin-field">
            <span>Email Address</span>
            <div className="signin-input-wrap">
              <IconMail />
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={updateField}
                placeholder="name@studio.com"
                required
              />
            </div>
          </label>

          <div className="signin-password-row">
            <span>Password</span>
            {mode === 'signin' ? <button className="forgot-link" type="button">Forgot Password?</button> : null}
          </div>
          <label className="signin-field">
            <div className="signin-input-wrap">
              <IconLock />
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={updateField}
                placeholder="At least 6 characters"
                minLength={6}
                required
              />
            </div>
          </label>

          <label className="remember-row">
            <input
              name="remember"
              type="checkbox"
              checked={form.remember}
              onChange={updateField}
            />
            <span>Remember this device for 30 days</span>
          </label>

          {authError ? <div className="auth-alert error">{authError}</div> : null}
          {authMessage ? <div className="auth-alert success">{authMessage}</div> : null}

          <button className="signin-submit" type="submit" disabled={submitting}>
            {submitting
              ? 'Please wait...'
              : mode === 'signin'
                ? 'Sign In'
                : 'Create Account'}
          </button>

          <div className="signin-divider">
            <span>or continue with</span>
          </div>

          <div className="signin-socials">
            <button className="social-button" type="button" onClick={handleGoogleSignIn}>
              <IconGoogle />
              <span>Google</span>
            </button>
            <button
              className="social-button"
              type="button"
              onClick={() => onSwitchMode(mode === 'signin' ? 'signup' : 'signin')}
            >
              <IconArrowSwap />
              <span>{mode === 'signin' ? 'Create Account' : 'Back to Sign In'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SupabaseSetupScreen() {
  return (
    <div className="signin-page">
      <div className="signin-card">
        <div className="signin-header">
          <h1>Supabase setup required</h1>
          <p>Connect your real project keys before opening the auth flow.</p>
        </div>
        <div className="setup-code">
          <code>VITE_SUPABASE_URL=https://your-project-id.supabase.co</code>
          <code>VITE_SUPABASE_ANON_KEY=your-supabase-anon-key</code>
        </div>
      </div>
    </div>
  )
}

function AvatarImage({ avatarUrl, large = false }) {
  if (avatarUrl) {
    return (
      <div className={`avatar-ring${large ? ' large' : ''}`}>
        <img
          className={`avatar-photo${large ? ' large' : ''}`}
          src={avatarUrl}
          alt="Profile"
          referrerPolicy="no-referrer"
        />
      </div>
    )
  }

  return (
    <div className={`avatar-ring${large ? ' large' : ''}`}>
      <div className={`avatar-core${large ? ' large' : ''}`} />
    </div>
  )
}

function getRouteFromHash() {
  if (window.location.hash === '#/signin') {
    return 'signin'
  }

  if (window.location.hash === '#/signup') {
    return 'signup'
  }

  if (window.location.hash === '#/dashboard') {
    return 'dashboard'
  }

  if (window.location.hash === '#/forecasting') {
    return 'forecasting'
  }

  if (window.location.hash === '#/inventory') {
    return 'inventory'
  }

  if (window.location.hash === '#/customers') {
    return 'customers'
  }

  if (window.location.hash === '#/settings') {
    return 'settings'
  }

  return 'data-management'
}

function getDatasetExecutionKey(dataset) {
  if (!dataset?.rows?.length) {
    return ''
  }

  return [
    forecastModelVersion,
    dataset.sourceSignature || dataset.fileName || 'dataset',
    dataset.rows.length,
    dataset.columns?.length ?? 0,
  ].join(':')
}

async function requestForecastModel(dataset, signal) {
  const baseUrl = (import.meta.env.VITE_FORECAST_API_URL || '/api').replace(/\/$/, '')
  const endpoint = `${baseUrl}/forecast/analyze`

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: dataset?.fileName ?? 'uploaded dataset',
        columns: dataset?.columns ?? [],
        rows: dataset?.rows ?? [],
      }),
      signal,
    })

    if (!response.ok) {
      let errorMessage = 'Forecast API request failed'
      try {
        const errorBody = await response.json()
        errorMessage = errorBody?.detail || errorBody?.error || errorMessage
      } catch {
        // Keep the generic error message when the backend returns non-JSON.
      }
      return { ok: false, error: errorMessage }
    }

    return { ok: true, model: await response.json() }
  } catch (error) {
    if (error.name === 'AbortError') {
      return { ok: false, error: 'Forecast request cancelled' }
    }

    return {
      ok: false,
      error: error.message || 'Forecast API request failed',
    }
  }
}

function navigateTo(route) {
  if (route === 'data-management') {
    window.location.hash = ''
    return
  }

  window.location.hash = `#/${route}`
}

function parseCsv(text, fileName) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) {
    throw new Error('CSV file needs a header row and at least one data row.')
  }

  const columns = splitCsvLine(lines[0])
  const rows = lines.slice(1).map((line) => {
    const values = splitCsvLine(line)
    const row = {}

    columns.forEach((column, index) => {
      row[column] = values[index] ?? ''
    })

    return row
  })

  return {
    fileName,
    sourceType: 'uploaded',
    columns,
    rows,
  }
}

function splitCsvLine(line) {
  const values = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]
    const nextCharacter = line[index + 1]

    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        current += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (character === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
    } else {
      current += character
    }
  }

  values.push(current.trim())
  return values
}

function parseJson(text, fileName) {
  const parsed = JSON.parse(text)
  const rows = Array.isArray(parsed) ? parsed : Array.isArray(parsed.data) ? parsed.data : []

  if (!rows.length || typeof rows[0] !== 'object' || rows[0] === null) {
    throw new Error('JSON file must contain an array of objects.')
  }

  const columns = Object.keys(rows[0]).slice(0, 6)

  return {
    fileName,
    sourceType: 'uploaded',
    columns,
    rows,
  }
}

async function parseExcelWorkbook(buffer, fileName) {
  const XLSX = await import('xlsx')
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheetName = workbook.SheetNames[0]

  if (!sheetName) {
    throw new Error('Excel file does not contain any worksheets.')
  }

  const sheet = workbook.Sheets[sheetName]
  const table = XLSX.utils
    .sheet_to_json(sheet, {
      header: 1,
      defval: '',
      raw: false,
      blankrows: false,
    })
    .filter((row) => row.some((cell) => String(cell ?? '').trim()))

  if (table.length < 2) {
    throw new Error('Excel file needs a header row and at least one data row.')
  }

  const columns = buildExcelColumns(table[0])
  const rows = table.slice(1).map((values) => {
    const row = {}

    columns.forEach((column, index) => {
      row[column] = values[index] ?? ''
    })

    return row
  })

  return {
    fileName,
    sourceType: 'uploaded',
    columns,
    rows,
  }
}

function buildExcelColumns(headerRow) {
  const seen = new Map()

  return headerRow.map((cell, index) => {
    const baseName = String(cell ?? '').trim() || `Column ${index + 1}`
    const currentCount = seen.get(baseName) ?? 0
    seen.set(baseName, currentCount + 1)

    return currentCount ? `${baseName} ${currentCount + 1}` : baseName
  })
}

function removeDuplicateRows(dataset) {
  const seen = new Set()
  const rows = dataset.rows.filter((row) => {
    const key = JSON.stringify(row)
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })

  return {
    dataset: { ...dataset, rows },
    removedCount: dataset.rows.length - rows.length,
  }
}

function fillMissingValues(dataset) {
  let updatedCount = 0
  const productColumn = findColumn(dataset.columns, ['product', 'item', 'description', 'name'])
  const rows = dataset.rows.map((row) => {
    const nextRow = { ...row }
    dataset.columns.forEach((column) => {
      if (isMissingValue(nextRow[column])) {
        const normalizedColumn = column.toLowerCase()
        if (normalizedColumn.includes('status')) {
          nextRow[column] = 'success'
        } else if (normalizedColumn.includes('category')) {
          nextRow[column] = resolveCanonicalCategory(
            productColumn ? nextRow[productColumn] : '',
            ''
          )
        } else if (
          /(quantity|qty|units|price|revenue|amount|sales|stock|inventory|cost|rate|reliability|lead time)/.test(
            normalizedColumn
          )
        ) {
          nextRow[column] = 0
        } else if (/(customer|client|buyer)/.test(normalizedColumn)) {
          nextRow[column] = 'Unknown Customer'
        } else if (/(product|item|description|name)/.test(normalizedColumn)) {
          nextRow[column] = 'Unassigned Product'
        } else {
          nextRow[column] = 'Unknown'
        }
        updatedCount += 1
      }
    })
    return nextRow
  })

  return {
    dataset: { ...dataset, rows },
    updatedCount,
  }
}

function formatDateColumns(dataset) {
  const dateColumns = dataset.columns.filter(
    (column) => column.toLowerCase().includes('date') || column.toLowerCase().includes('time')
  )

  let updatedCount = 0
  const rows = dataset.rows.map((row) => {
    const nextRow = { ...row }
    dateColumns.forEach((column) => {
      const formatted = normalizeDateValue(nextRow[column])
      if (formatted !== nextRow[column]) {
        nextRow[column] = formatted
        updatedCount += 1
      }
    })
    return nextRow
  })

  return {
    dataset: { ...dataset, rows },
    updatedCount,
  }
}

function normalizeDateValue(value) {
  if (!value) {
    return value
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}`
}

function isMissingValue(value) {
  const normalized = String(value ?? '').trim().toLowerCase()
  return (
    normalized === '' ||
    normalized === '--' ||
    normalized === '-- missing --' ||
    normalized === 'null' ||
    normalized === 'n/a'
  )
}

function createLogEntry(title, body, status) {
  return {
    id: `${title}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    body,
    status,
    time: formatClockTime(),
  }
}

function createNotificationEntry(title, body, tone) {
  return {
    id: `${title}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    body,
    tone,
    time: formatClockTime(),
  }
}

function formatClockTime() {
  return new Date().toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function cloneDataset(dataset) {
  return {
    ...dataset,
    rows: dataset.rows.map((row) => ({ ...row })),
  }
}

function attachDatasetSourceMeta(dataset, sourceSignature) {
  return {
    ...dataset,
    sourceSignature,
  }
}

function buildSavedUploadsOverviewDataset(history, activeDataset = null) {
  const snapshots = history.filter((item) => item?.datasetSnapshot?.rows?.length)

  if (activeDataset?.rows?.length) {
    return {
      count: Math.max(history.length, 1),
      dataset: activeDataset,
    }
  }

  const latestSnapshot = snapshots[0]?.datasetSnapshot

  if (!latestSnapshot?.rows?.length) {
    return null
  }

  return {
    count: history.length,
    dataset: latestSnapshot,
  }
}

function getSavedUploadDatasetCount(history, activeDataset = null) {
  return Math.max(history.length, activeDataset?.rows?.length ? 1 : 0)
}

function getUniqueColumnName(columns, baseName) {
  const existing = new Set(columns)
  let candidate = baseName
  let suffix = 2

  while (existing.has(candidate)) {
    candidate = `${baseName} ${suffix}`
    suffix += 1
  }

  return candidate
}

function syncUploadHistorySnapshot(dataset, history) {
  if (!dataset?.sourceSignature) {
    return history
  }

  const uploadedAt = Date.now()
  return history.map((item) =>
    item.signature === dataset.sourceSignature
      ? {
          ...item,
          fileName: dataset.fileName,
          rows: dataset.rows.length,
          columns: dataset.columns.length,
          uploadedAt,
          uploadedLabel: formatHistoryTimestamp(uploadedAt),
          datasetSnapshot: cloneDataset(dataset),
        }
      : item
  )
}

function getFileSignature(file) {
  return `${file.name}::${file.size}::${file.lastModified}`
}

function createUploadHistoryItem(file, dataset) {
  const uploadedAt = Date.now()

  return {
    id: `${file.name}-${uploadedAt}-${Math.random().toString(36).slice(2, 8)}`,
    signature: getFileSignature(file),
    fileName: file.name,
    fileType: file.name.split('.').pop()?.toUpperCase() || 'FILE',
    fileSize: file.size,
    fileSizeLabel: formatBytes(file.size),
    rows: dataset.rows.length,
    columns: dataset.columns.length,
    uploadedAt,
    uploadedLabel: formatHistoryTimestamp(uploadedAt),
    datasetSnapshot: cloneDataset(dataset),
  }
}

function upsertUploadHistoryItem(history, item) {
  return [item, ...history.filter((entry) => entry.signature !== item.signature)].slice(
    0,
    maxUploadHistoryItems
  )
}

function readStoredUploadHistory(userId) {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const raw = window.localStorage.getItem(getUploadHistoryStorageKey(userId))
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .filter((item) => item && item.signature && item.fileName)
      .map((item) => ({
        ...item,
        fileType: item.fileType || item.fileName.split('.').pop()?.toUpperCase() || 'FILE',
        fileSizeLabel: item.fileSizeLabel || formatBytes(item.fileSize ?? 0),
        uploadedLabel: item.uploadedLabel || formatHistoryTimestamp(item.uploadedAt ?? Date.now()),
        datasetSnapshot: item.datasetSnapshot ? cloneDataset(item.datasetSnapshot) : null,
      }))
      .slice(0, maxUploadHistoryItems)
  } catch {
    return []
  }
}

function writeStoredUploadHistory(userId, history) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const lightweightHistory = history.map((item, index) => ({
      ...item,
      datasetSnapshot:
        index === 0 && item.datasetSnapshot?.rows?.length <= 1000
          ? item.datasetSnapshot
          : null,
    }))
    window.localStorage.setItem(
      getUploadHistoryStorageKey(userId),
      JSON.stringify(lightweightHistory)
    )
  } catch {
    // Ignore storage quota and availability errors.
  }
}

function readStoredForecastModel(userId, datasetKey) {
  if (typeof window === 'undefined' || !datasetKey) {
    return null
  }

  try {
    const raw = window.localStorage.getItem(getForecastModelStorageKey(userId, datasetKey))
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw)
    if (parsed?.datasetKey !== datasetKey || !parsed?.model) {
      return null
    }

    return {
      datasetKey,
      generatedAt: parsed.generatedAt || '',
      model: parsed.model,
    }
  } catch {
    return null
  }
}

function writeStoredForecastModel(userId, forecastRecord) {
  if (typeof window === 'undefined' || !forecastRecord?.datasetKey || !forecastRecord?.model) {
    return
  }

  try {
    window.localStorage.setItem(
      getForecastModelStorageKey(userId, forecastRecord.datasetKey),
      JSON.stringify(forecastRecord)
    )
  } catch {
    // Ignore storage quota and private browsing errors.
  }
}

function removeStoredForecastModel(userId, datasetKey) {
  if (typeof window === 'undefined' || !datasetKey) {
    return
  }

  try {
    window.localStorage.removeItem(getForecastModelStorageKey(userId, datasetKey))
  } catch {
    // Ignore storage availability errors.
  }
}

function getForecastModelStorageKey(userId, datasetKey) {
  return `${forecastModelStoragePrefix}:${userId || 'guest'}:${datasetKey}`
}

function getUploadHistoryStorageKey(userId) {
  return `${uploadHistoryStoragePrefix}:${userId || 'guest'}`
}

async function readSupabaseUploadHistory(userId) {
  if (!supabase || !userId) {
    return []
  }

  const { data, error } = await supabase
    .from(uploadHistoryTable)
    .select(
      'id, signature, file_name, file_type, file_size, rows, columns, storage_bucket, storage_path, created_at, updated_at'
    )
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(maxUploadHistoryItems)

  if (error) {
    throw error
  }

  return (data ?? []).map(mapSupabaseUploadHistoryItem)
}

async function saveUploadHistoryToSupabase(userId, file, item) {
  if (!supabase || !userId) {
    return item
  }

  const storagePath = item.storagePath || buildUploadStoragePath(userId, item.signature, file.name)
  const { error: uploadError } = await supabase.storage
    .from(uploadStorageBucket)
    .upload(storagePath, file, {
      cacheControl: '3600',
      contentType: file.type || undefined,
      upsert: true,
    })

  if (uploadError) {
    throw uploadError
  }

  const { data, error } = await supabase
    .from(uploadHistoryTable)
    .upsert(
      {
        user_id: userId,
        signature: item.signature,
        file_name: item.fileName,
        file_type: item.fileType,
        file_size: item.fileSize,
        rows: item.rows,
        columns: item.columns,
        storage_bucket: uploadStorageBucket,
        storage_path: storagePath,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,signature' }
    )
    .select(
      'id, signature, file_name, file_type, file_size, rows, columns, storage_bucket, storage_path, created_at, updated_at'
    )
    .single()

  if (error) {
    throw error
  }

  return mapSupabaseUploadHistoryItem(data)
}

async function updateSupabaseUploadSnapshot(userId, dataset) {
  if (!supabase || !userId || !dataset?.sourceSignature) {
    return
  }

  const file = await createDatasetSnapshotFile(dataset)
  const storagePath = buildWorkspaceStoragePath(
    userId,
    dataset.sourceSignature,
    dataset.fileName
  )
  const { error: uploadError } = await supabase.storage
    .from(uploadStorageBucket)
    .upload(storagePath, file, {
      cacheControl: '3600',
      contentType: file.type || undefined,
      upsert: true,
    })

  if (uploadError) {
    throw uploadError
  }

  const { error } = await supabase
    .from(uploadHistoryTable)
    .update({
      file_name: dataset.fileName,
      file_type: dataset.fileName.split('.').pop()?.toUpperCase() || 'FILE',
      file_size: file.size,
      rows: dataset.rows.length,
      columns: dataset.columns.length,
      storage_bucket: uploadStorageBucket,
      storage_path: storagePath,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('signature', dataset.sourceSignature)

  if (error) {
    throw error
  }
}

async function createDatasetSnapshotFile(dataset) {
  const fileName = dataset.fileName || 'cleaned_dataset.json'
  const extension = fileName.split('.').pop()?.toLowerCase()

  if (extension === 'csv') {
    const csv = [
      dataset.columns.map(escapeCsvValue).join(','),
      ...dataset.rows.map((row) =>
        dataset.columns.map((column) => escapeCsvValue(row[column])).join(',')
      ),
    ].join('\n')
    return new File([csv], fileName, { type: 'text/csv;charset=utf-8' })
  }

  if (extension === 'json') {
    return new File([JSON.stringify(dataset.rows)], fileName, {
      type: 'application/json',
    })
  }

  if (extension === 'xls' || extension === 'xlsx') {
    const XLSX = await import('xlsx')
    const worksheet = XLSX.utils.json_to_sheet(dataset.rows, {
      header: dataset.columns,
    })
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Cleaned Data')
    const buffer = XLSX.write(workbook, {
      bookType: extension === 'xls' ? 'biff8' : 'xlsx',
      type: 'array',
    })
    return new File([buffer], fileName, {
      type:
        extension === 'xls'
          ? 'application/vnd.ms-excel'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
  }

  return new File([JSON.stringify(dataset.rows)], `${fileName}.json`, {
    type: 'application/json',
  })
}

function escapeCsvValue(value) {
  const text = value == null ? '' : String(value)
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

async function deleteSupabaseUploadHistoryItem(userId, item) {
  if (!supabase || !userId) {
    return
  }

  if (item.storagePath) {
    const { error: storageError } = await supabase.storage
      .from(item.storageBucket || uploadStorageBucket)
      .remove([item.storagePath])

    if (storageError) {
      throw storageError
    }
  }

  const { error } = await supabase
    .from(uploadHistoryTable)
    .delete()
    .eq('user_id', userId)
    .eq('id', item.id)

  if (error) {
    throw error
  }
}

function mapSupabaseUploadHistoryItem(row) {
  const uploadedAt = getTimestamp(row.updated_at || row.created_at)

  return {
    id: row.id,
    signature: row.signature,
    fileName: row.file_name,
    fileType: row.file_type || row.file_name?.split('.').pop()?.toUpperCase() || 'FILE',
    fileSize: Number(row.file_size) || 0,
    fileSizeLabel: formatBytes(Number(row.file_size) || 0),
    rows: Number(row.rows) || 0,
    columns: Number(row.columns) || 0,
    uploadedAt,
    uploadedLabel: formatHistoryTimestamp(uploadedAt),
    storageBucket: row.storage_bucket || uploadStorageBucket,
    storagePath: row.storage_path || '',
    datasetSnapshot: null,
  }
}

async function downloadSupabaseHistoryDataset(item) {
  if (!supabase || !item?.storagePath) {
    throw new Error('The saved file is not available in cloud storage.')
  }

  const { data, error } = await supabase.storage
    .from(item.storageBucket || uploadStorageBucket)
    .download(item.storagePath)

  if (error || !data) {
    throw new Error(error?.message || 'The saved file could not be downloaded.')
  }

  const extension = item.fileName.split('.').pop()?.toLowerCase()
  if (extension === 'csv') {
    return parseCsv(await data.text(), item.fileName)
  }
  if (extension === 'json') {
    return parseJson(await data.text(), item.fileName)
  }
  if (extension === 'xls' || extension === 'xlsx') {
    return parseExcelWorkbook(await data.arrayBuffer(), item.fileName)
  }

  throw new Error('The saved file format is not supported.')
}

function buildUploadStoragePath(userId, signature, fileName) {
  const signatureSegment = makeSafeStorageSegment(signature).slice(0, 72) || 'upload'
  const fileSegment = makeSafeStorageSegment(fileName) || 'dataset'
  return `${userId}/${signatureSegment}/${fileSegment}`
}

function buildWorkspaceStoragePath(userId, signature, fileName) {
  const signatureSegment = makeSafeStorageSegment(signature).slice(0, 72) || 'upload'
  const fileSegment = makeSafeStorageSegment(fileName) || 'dataset'
  return `${userId}/${signatureSegment}/workspace-${fileSegment}`
}

function makeSafeStorageSegment(value) {
  return String(value ?? '')
    .trim()
    .replace(/[^a-z0-9._-]+/gi, '_')
    .replace(/^_+|_+$/g, '')
}

function getTimestamp(value) {
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? timestamp : Date.now()
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB']
  const unitIndex = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)))
  const value = bytes / 1024 ** unitIndex
  const digits = unitIndex === 0 || value >= 10 ? 0 : 1
  return `${value.toFixed(digits)} ${units[unitIndex]}`
}

function formatHistoryTimestamp(value) {
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function findColumn(columns, keywords) {
  return (
    columns.find((column) =>
      keywords.some((keyword) => column.toLowerCase().includes(keyword))
    ) ?? null
  )
}

function parseNumericValue(value) {
  const numeric = Number(String(value ?? '').replace(/[^0-9.-]/g, ''))
  return Number.isFinite(numeric) ? numeric : 0
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    maximumFractionDigits: 2,
  }).format(value)
}

function calculateQualityMetrics(dataset) {
  const totalCells = dataset.rows.length * dataset.columns.length

  if (!totalCells) {
    return {
      score: '0.0',
      delta: '+0.0% uplift',
      message: 'Upload more structured data to calculate dataset readiness.',
    }
  }

  let completeCells = 0

  dataset.rows.forEach((row) => {
    dataset.columns.forEach((column) => {
      if (!isMissingValue(row[column])) {
        completeCells += 1
      }
    })
  })

  const completeness = (completeCells / totalCells) * 100
  const score = Math.min(99.9, Math.max(12, completeness))
  const uplift = Math.max(0, Math.min(24.9, (score - 70) * 0.55))

  let message = 'Your dataset is ready for baseline forecasting workflows.'

  if (score >= 92) {
    message = 'Your dataset is approaching peak readiness for AI forecasting models.'
  } else if (score >= 80) {
    message = 'Your dataset is in strong shape and ready for advanced modeling.'
  } else if (score >= 60) {
    message = 'Your dataset is usable, but cleaning a few gaps will improve results.'
  } else {
    message = 'Your dataset needs more cleanup before it is ready for reliable modeling.'
  }

  return {
    score: score.toFixed(1),
    delta: `+${uplift.toFixed(1)}% uplift`,
    message,
  }
}

function buildDashboardModel(dataset, options = {}) {
  const rows = dataset.rows
  const columns = dataset.columns
  const query = String(options.query ?? '').trim().toLowerCase()
  const view = options.view ?? 'global-view'
  const range = options.range ?? '7d'
  const useAllSavedRows = false
  const completedActionIds = options.completedActionIds ?? []
  const forecastModel = options.forecastModel ?? null
  const forecastStatus = options.forecastStatus ?? 'idle'

  const amountColumn = findColumn(columns, ['amount', 'sales', 'revenue', 'total'])
  const priceColumn = findColumn(columns, ['price', 'unit price', 'unit_price'])
  const quantityColumn = findColumn(columns, ['quantity', 'qty', 'units'])
  const dateColumn = findColumn(columns, ['date', 'time', 'timestamp'])
  const regionColumn = findColumn(columns, ['region', 'market', 'location', 'country'])
  const categoryColumn = findColumn(columns, ['category', 'type', 'class'])
  const productColumn = findColumn(columns, ['product', 'item', 'sku', 'name'])
  const customerColumn = findColumn(columns, ['customer', 'client', 'buyer'])
  const statusColumn = findColumn(columns, ['status', 'state'])
  const stockColumn = findColumn(columns, ['stock', 'inventory', 'qty', 'quantity', 'units'])

  const quality = calculateQualityMetrics(dataset)
  const qualityScore = Number(quality.score) || 0
  const totalSales = getTotalDatasetValue(rows, amountColumn, priceColumn, quantityColumn)
  const averageValue = totalSales / Math.max(rows.length, 1)
  const missingCount = countMissingCells(dataset)
  const duplicateCount = countDuplicateRows(rows)
  const customerCount = customerColumn
    ? new Set(
        rows
          .map((row) => String(row[customerColumn] ?? '').trim())
          .filter(Boolean)
      ).size
    : rows.length

  const regionStats = summarizeByColumn(rows, regionColumn, amountColumn, 'Global')
  const topRegion = regionStats[0] ?? { label: 'Global', value: totalSales, share: 100, count: rows.length }
  const categoryOverview = buildSalesByCategoryOverview(
    rows,
    productColumn || categoryColumn,
    amountColumn,
    priceColumn,
    quantityColumn,
    dateColumn,
    categoryColumn,
    { useAllRows: useAllSavedRows }
  )
  const topCategory = categoryOverview.segments[0] ?? {
    label: 'Other',
    value: formatCurrency(totalSales),
    share: 100,
    count: rows.length,
  }
  const topProducts = buildTopProductsOverview(
    rows,
    productColumn || categoryColumn,
    amountColumn,
    priceColumn,
    quantityColumn,
    dateColumn,
    { useAllRows: useAllSavedRows }
  )
  const growthPercent = calculateGrowthRate(rows, amountColumn, dateColumn, range)
  const weeklyTrend = buildWeeklyTrend(rows, amountColumn, dateColumn, range)
  const inventory = buildInventoryModel(dataset, statusColumn, stockColumn)
  const todaySales = buildTodaySalesKpi(rows, amountColumn, priceColumn, quantityColumn, dateColumn)
  const weekSales = buildWeekSalesKpi(rows, amountColumn, priceColumn, quantityColumn, dateColumn)
  const forecastTomorrow = buildForecastTomorrowKpi(
    rows,
    amountColumn,
    priceColumn,
    quantityColumn,
    dateColumn,
    forecastModel,
    forecastStatus,
    options.forecastGeneratedAt
  )
  const bestSellerMonth = buildBestSellerMonthKpi(
    rows,
    productColumn || categoryColumn,
    amountColumn,
    priceColumn,
    quantityColumn,
    dateColumn
  )

  const hero =
    view === 'market-trends'
      ? {
          title: 'Strategic Intelligence',
          prefix: 'Analysis shows',
          highlight: `${topCategory.label} drives ${topCategory.share}% of tracked volume`,
          suffix: 'with the strongest market momentum in your uploaded dataset.',
        }
      : {
          title: 'Strategic Intelligence',
          prefix: 'Analysis identifies a',
          highlight: `${Math.max(4, Math.round(Math.abs(growthPercent) || qualityScore / 8))}% efficiency gap`,
          suffix: `in ${topRegion.label}. Deployment recommended.`,
        }

  const metrics = [
    {
      label: "Today's Sales",
      icon: 'money',
      tone: 'primary',
      value: formatCurrency(todaySales.value),
      delta: `${todaySales.delta >= 0 ? '+' : ''}${todaySales.delta.toFixed(1)}% vs yesterday`,
      deltaTone: todaySales.delta >= 0 ? 'positive' : 'negative',
      footnote: todaySales.caption,
    },
    {
      label: 'Best Seller Month',
      icon: 'box',
      tone: 'indigo',
      value: bestSellerMonth.value,
      delta: bestSellerMonth.share ? `${bestSellerMonth.share}% share` : '',
      deltaTone: 'positive',
      footnote: bestSellerMonth.caption,
    },
    {
      label: 'This Week vs Last Week',
      icon: 'schedule',
      tone: 'emerald',
      value: formatCurrency(weekSales.value),
      delta: `${weekSales.delta >= 0 ? '+' : ''}${weekSales.delta.toFixed(1)}% vs last week`,
      deltaTone: weekSales.delta >= 0 ? 'positive' : 'negative',
      footnote: weekSales.caption,
    },
    {
      label: 'Sales Forecast Tomorrow',
      icon: 'target',
      tone: 'rose',
      value:
        forecastTomorrow.source === 'model'
          ? formatCurrency(forecastTomorrow.value)
          : forecastTomorrow.displayValue,
      delta:
        forecastTomorrow.source === 'model'
          ? 'Model Breakdown ->'
          : forecastStatus === 'running'
            ? 'Training Model...'
            : forecastStatus === 'error'
              ? 'Backend Offline'
              : 'Waiting Model ->',
      deltaTone: 'positive',
      footnote: forecastTomorrow.caption,
    },
  ]

  const actions = [
    {
      id: 'quality-recovery',
      icon: missingCount > 0 ? 'warning' : 'check',
      tone: missingCount > 0 ? 'urgent' : 'opportunity',
      title:
        missingCount > 0
          ? `Repair ${missingCount} incomplete field${missingCount === 1 ? '' : 's'}`
          : 'Preserve data quality momentum',
      summary:
        missingCount > 0
          ? `Detected incomplete records inside ${dataset.fileName}. Closing those gaps will improve strategic confidence immediately.`
          : `The current upload is highly structured. Keep the same schema discipline to protect model accuracy.`,
      priorityLabel: missingCount > 0 ? 'Urgent' : 'Healthy',
      primaryAction: missingCount > 0 ? 'Start Cleanup' : 'Review Quality',
      secondaryAction: 'View Analytics',
      category: 'Data Quality',
      completed: completedActionIds.includes('quality-recovery'),
    },
    {
      id: 'regional-acceleration',
      icon: view === 'market-trends' ? 'spark' : 'box',
      tone: 'optimization',
      title:
        view === 'market-trends'
          ? `Scale ${topCategory.label} demand`
          : `Accelerate ${topRegion.label} execution`,
      summary:
        view === 'market-trends'
          ? `${topCategory.label} currently leads with ${topCategory.share}% of tracked volume. Expanding this lane should unlock the fastest upside.`
          : `${topRegion.label} accounts for ${topRegion.share}% of detected activity. Focused deployment here will tighten efficiency first.`,
      priorityLabel: 'Optimization',
      primaryAction: view === 'market-trends' ? 'Apply Logic' : 'Approve Plan',
      secondaryAction: 'View Analytics',
      category: view === 'market-trends' ? 'Market Trends' : 'Regional Ops',
      completed: completedActionIds.includes('regional-acceleration'),
    },
    {
      id: 'customer-retention',
      icon: 'users',
      tone: 'opportunity',
      title: customerColumn ? `Mobilize ${customerCount} customer records` : 'Expand customer intelligence',
      summary: customerColumn
        ? `Your uploaded file exposes ${customerCount} unique customer record${customerCount === 1 ? '' : 's'}. Activation campaigns can be personalized immediately.`
        : `Add customer-level attributes to unlock segmentation, retention targeting, and more precise recommendation logic.`,
      priorityLabel: 'Opportunity',
      primaryAction: customerColumn ? 'Activate Playbook' : 'Draft Strategy',
      secondaryAction: customerColumn ? 'Details' : null,
      category: 'Customer Intelligence',
      completed: completedActionIds.includes('customer-retention'),
    },
  ]

  const risks = [
    {
      label:
        duplicateCount > 0
          ? `${duplicateCount} duplicate record${duplicateCount === 1 ? '' : 's'} detected`
          : 'Duplicate pressure under control',
      tone: duplicateCount > 0 ? 'critical' : 'good',
      icon: duplicateCount > 0 ? 'arrow' : 'check',
    },
    {
      label:
        missingCount > 0
          ? `${missingCount} missing field${missingCount === 1 ? '' : 's'} need attention`
          : `Quality score steady at ${quality.score}%`,
      tone: missingCount > 0 ? 'warning' : 'good',
      icon: missingCount > 0 ? 'schedule' : 'check',
    },
    {
      label:
        topRegion.share >= 55
          ? `Revenue concentration in ${topRegion.label}`
          : `${topCategory.label} is the lead growth engine`,
      tone: topRegion.share >= 55 ? 'warning' : 'good',
      icon: topRegion.share >= 55 ? 'arrow' : 'check',
    },
  ]

  const queue = actions.map((action, index) => ({
    id: action.id,
    rank: `#${index + 1}`,
    title: action.title,
    subtitle: action.category,
    impact:
      index === 0
        ? formatCurrency(Math.max(totalSales * 0.06, averageValue * 4))
        : index === 1
          ? formatCurrency(Math.max(totalSales * 0.035, averageValue * 2.2))
          : formatCurrency(Math.max(totalSales * 0.018, averageValue * 1.4)),
    priorityLabel: action.priorityLabel.toUpperCase(),
    priorityTone:
      action.priorityLabel === 'Urgent'
        ? 'critical'
        : action.priorityLabel === 'Optimization'
          ? 'high'
          : 'medium',
  }))

  const matchesQuery = (value) =>
    !query || String(value ?? '').toLowerCase().includes(query)

  const filteredActions = actions.filter((action) =>
    [action.title, action.summary, action.category].some(matchesQuery)
  )
  const filteredRisks = risks.filter((risk) => matchesQuery(risk.label))
  const filteredQueue = queue.filter((item) =>
    [item.title, item.subtitle, item.priorityLabel].some(matchesQuery)
  )
  const recommendationSummary = buildRecommendationSummary({
    actions,
    risks,
    inventory,
    forecastModel,
    customerColumn,
    customerCount,
  }).filter((item) => [item.label, item.note].some(matchesQuery))

  return {
    hero,
    metrics,
    weeklyTrend,
    inventory,
    recommendationSummary,
    categoryOverview,
    topProducts,
    actions: filteredActions,
    risks: filteredRisks,
    queue: filteredQueue,
  }
}

function buildRecommendationSummary({
  actions,
  risks,
  inventory,
  forecastModel,
  customerColumn,
  customerCount,
}) {
  const inventoryCounts = inventory?.counts ?? {}
  const reorderCount = Math.max(
    Number(inventoryCounts.watch ?? 0) + Number(inventoryCounts.critical ?? 0),
    forecastModel?.reorder ? 1 : 0
  )
  const forecastAlertCount = Array.isArray(forecastModel?.stockRisks)
    ? forecastModel.stockRisks.length
    : risks.filter((risk) => risk.tone !== 'good').length
  const qualityCount = risks.filter((risk) => risk.tone === 'critical' || risk.tone === 'warning').length
  const customerRecommendationCount = customerColumn
    ? Math.max(1, Math.ceil(customerCount * 0.04))
    : actions.some((action) => action.category === 'Customer Intelligence')
      ? 1
      : 0
  const strategyCount = actions.filter((action) =>
    ['optimization', 'opportunity', 'urgent'].includes(action.tone)
  ).length
  const values = [
    {
      label: 'Reorder',
      value: reorderCount,
      note: 'Stock actions',
      tone: 'critical',
    },
    {
      label: 'Forecast Alerts',
      value: forecastAlertCount,
      note: 'Demand warnings',
      tone: 'warning',
    },
    {
      label: 'Customer',
      value: customerRecommendationCount,
      note: 'Retention targets',
      tone: 'customer',
    },
    {
      label: 'Optimization',
      value: strategyCount,
      note: 'Strategy actions',
      tone: 'optimization',
    },
    {
      label: 'Data Quality',
      value: qualityCount,
      note: 'Cleanup tasks',
      tone: 'quality',
    },
  ]
  const maxValue = Math.max(...values.map((item) => item.value), 1)

  return values.map((item) => ({
    ...item,
    width: Math.max(item.value > 0 ? 8 : 2, Math.round((item.value / maxValue) * 100)),
    valueLabel: formatCompactCount(item.value),
  }))
}

function getTotalDatasetValue(rows, amountColumn, priceColumn, quantityColumn) {
  const total = rows.reduce(
    (sum, row) => sum + getSalesValue(row, amountColumn, priceColumn, quantityColumn),
    0
  )
  return total > 0 ? total : rows.length * 180
}

function getSalesValue(row, amountColumn, priceColumn, quantityColumn) {
  if (amountColumn) {
    return parseNumericValue(row[amountColumn])
  }

  if (priceColumn) {
    const price = parseNumericValue(row[priceColumn])
    const quantity = quantityColumn ? parseNumericValue(row[quantityColumn]) : 1
    return price * Math.max(quantity, 1)
  }

  return 1
}

function buildSalesByCategoryOverview(
  rows,
  productColumn,
  amountColumn,
  priceColumn,
  quantityColumn,
  dateColumn,
  sourceCategoryColumn = null,
  options = {}
) {
  const useAllRows = Boolean(options.useAllRows)
  const currentRows = useAllRows ? rows : getWindowRows(rows, dateColumn, 30)
  const previousRows = useAllRows ? [] : getWindowRows(rows, dateColumn, 30, 30)
  const activeRows = currentRows.length ? currentRows : rows
  const currentCatalog = groupRowsByCategory(
    activeRows,
    productColumn,
    sourceCategoryColumn,
    amountColumn,
    priceColumn,
    quantityColumn
  )
  const previousCatalog = groupRowsByCategory(
    previousRows,
    productColumn,
    sourceCategoryColumn,
    amountColumn,
    priceColumn,
    quantityColumn
  )

  const totalRevenue = currentCatalog.categories.reduce((sum, item) => sum + item.revenue, 0)
  const palette = ['#6b7de8', '#ea4c9a', '#ffb300', '#12b886', '#8b5cf6']

  const segments = currentCatalog.categories.map((category, index) => {
    const previousRevenue = previousCatalog.byLabel.get(category.label)?.revenue ?? 0
    const growth = calculatePercentDelta(category.revenue, previousRevenue)

    return {
      label: category.label,
      value: formatCurrency(category.revenue),
      share: totalRevenue > 0 ? Math.max(1, Math.round((category.revenue / totalRevenue) * 100)) : 0,
      growth: useAllRows || category.label === 'Other' ? 0 : growth,
      growthTone:
        useAllRows || category.label === 'Other' ? 'muted' : growth >= 0 ? 'positive' : 'negative',
      growthLabel:
        useAllRows
          ? 'All saved'
          : category.label === 'Other'
          ? 'Unmapped products'
          : `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`,
      color: palette[index % palette.length],
      tone: 'default',
    }
  })

  const donutStops = segments.length
    ? segments
        .map((segment, index) => {
          const start = segments.slice(0, index).reduce((sum, part) => sum + part.share, 0)
          const end = start + segment.share
          return `${segment.color} ${start}% ${end}%`
        })
        .join(', ')
    : '#dfe7fb 0 100%'

  const details = Object.fromEntries(
    currentCatalog.categories.map((category) => {
      const maxItemRevenue = Math.max(...category.items.map((item) => item.revenue), 1)
      const detailItems = category.items.map((item) => ({
        label: item.label,
        revenue: item.revenue,
        revenueLabel: formatCurrency(item.revenue),
        units: item.units,
        share: category.revenue > 0 ? Math.round((item.revenue / category.revenue) * 100) : 0,
        barWidth: Math.max(18, Math.round((item.revenue / maxItemRevenue) * 100)),
        detailValue: `${formatCompactCount(item.units)} units`,
      }))

      return [
        category.label,
        {
          label: category.label,
          totalLabel: formatCurrency(category.revenue),
          totalCaption: `${formatCompactCount(category.count)} records`,
          items: detailItems,
        },
      ]
    })
  )

  return {
    totalLabel: formatCurrency(totalRevenue),
    totalCaption: useAllRows ? 'All saved months' : currentRows.length ? 'Latest 30 days' : 'All-time total',
    segments,
    donutStops,
    details,
  }
}

function buildTopProductsOverview(
  rows,
  productColumn,
  amountColumn,
  priceColumn,
  quantityColumn,
  dateColumn,
  options = {}
) {
  const useAllRows = Boolean(options.useAllRows)
  const currentRows = useAllRows ? rows : getWindowRows(rows, dateColumn, 30)
  const activeRows = currentRows.length ? currentRows : rows
  const currentCatalog = groupRowsByProduct(
    activeRows,
    productColumn,
    amountColumn,
    priceColumn,
    quantityColumn,
    dateColumn
  )
  const allCatalog = groupRowsByProduct(
    rows,
    productColumn,
    amountColumn,
    priceColumn,
    quantityColumn,
    dateColumn
  )
  const monthlySeriesByProduct = buildMonthlySeriesByProduct(
    rows,
    productColumn,
    amountColumn,
    priceColumn,
    quantityColumn,
    dateColumn
  )

  const buildSeries = (metric) => {
    const items = currentCatalog.products
      .map((item) => ({
        ...item,
        metricValue: metric === 'units' ? item.units : item.revenue,
      }))
      .sort((left, right) => right.metricValue - left.metricValue)
      .slice(0, 5)

    const total = items.reduce((sum, item) => sum + item.metricValue, 0)
    const maxValue = Math.max(...items.map((item) => item.metricValue), 1)

    return {
      totalLabel: metric === 'units' ? formatCompactCount(total) : formatCurrency(total),
      totalCaption:
        metric === 'units'
          ? useAllRows
            ? 'Units sold across saved months'
            : currentRows.length
            ? 'Units sold in latest 30 days'
            : 'Units sold in all records'
          : useAllRows
            ? 'Revenue across saved months'
            : currentRows.length
            ? 'Revenue in latest 30 days'
            : 'Revenue in all records',
      items: items.map((item, index) => ({
        id: `${metric}-${item.label}-${index}`,
        label: item.label,
        metricValue: item.metricValue,
        displayValue:
          metric === 'units'
            ? formatCompactCount(item.metricValue)
            : formatCurrency(item.metricValue),
        detailValue:
          metric === 'units'
            ? `${formatCurrency(item.revenue)} revenue`
            : `${formatCompactCount(item.units)} units`,
        barWidth: Math.max(18, Math.round((item.metricValue / maxValue) * 100)),
        monthlySeries: monthlySeriesByProduct[item.label] ?? [],
        badge:
          index === 0
            ? 'Best Seller'
            : item.metricValue >= (total / Math.max(items.length, 1)) * 1.5
              ? 'High Demand'
              : item.metricValue <= (total / Math.max(items.length, 1)) * 0.5
                ? 'Slow Moving'
                : 'Stable',
        tone:
          index === 0
            ? 'top'
            : item.metricValue >= (total / Math.max(items.length, 1)) * 1.5
              ? 'positive'
              : item.metricValue <= (total / Math.max(items.length, 1)) * 0.5
                ? 'warning'
                : 'default',
      })),
    }
  }

  const details = Object.fromEntries(
    allCatalog.products.map((product) => [
      product.label,
      {
        label: product.label,
        totalLabel: formatCurrency(product.revenue),
        totalCaption: `${formatCompactCount(product.units)} units sold`,
        totalRevenue: product.revenue,
        totalUnits: product.units,
        monthlySeries: monthlySeriesByProduct[product.label] ?? [],
      },
    ])
  )

  return {
    revenue: buildSeries('revenue'),
    units: buildSeries('units'),
    details,
  }
}

function groupRowsByCategory(
  rows,
  productColumn,
  sourceCategoryColumn,
  amountColumn,
  priceColumn,
  quantityColumn
) {
  const groups = new Map()

  rows.forEach((row) => {
    const product = normalizeGroupLabel(row[productColumn], 'Unassigned')
    const sourceCategory = sourceCategoryColumn ? row[sourceCategoryColumn] : ''
    const categoryLabel = resolveCanonicalCategory(product, sourceCategory)
    const revenue = getSalesValue(row, amountColumn, priceColumn, quantityColumn)
    const units = quantityColumn ? Math.max(parseNumericValue(row[quantityColumn]), 1) : 1

    const current =
      groups.get(categoryLabel) ?? { label: categoryLabel, revenue: 0, units: 0, count: 0, items: new Map() }
    current.revenue += revenue
    current.units += units
    current.count += 1

    const item = current.items.get(product) ?? { label: product, revenue: 0, units: 0, count: 0 }
    item.revenue += revenue
    item.units += units
    item.count += 1
    current.items.set(product, item)

    groups.set(categoryLabel, current)
  })

  const categories = Array.from(groups.values())
    .map((group) => ({
      label: group.label,
      revenue: group.revenue,
      units: group.units,
      count: group.count,
      items: Array.from(group.items.values()).sort((left, right) => right.revenue - left.revenue),
    }))
    .sort((left, right) => right.revenue - left.revenue)

  return {
    categories,
    byLabel: new Map(categories.map((item) => [item.label, item])),
  }
}

function groupRowsByProduct(
  rows,
  productColumn,
  amountColumn,
  priceColumn,
  quantityColumn,
  dateColumn
) {
  const groups = new Map()

  rows.forEach((row) => {
    const label = normalizeGroupLabel(row[productColumn], 'Unassigned')
    const revenue = getSalesValue(row, amountColumn, priceColumn, quantityColumn)
    const units = quantityColumn ? Math.max(parseNumericValue(row[quantityColumn]), 1) : 1
    const current = groups.get(label) ?? { label, revenue: 0, units: 0, count: 0, months: new Map() }

    current.revenue += revenue
    current.units += units
    current.count += 1

    if (dateColumn) {
      const date = parseDatasetDate(row[dateColumn])
      if (date) {
        const key = formatMonthKey(date)
        const monthDate = new Date(date.getFullYear(), date.getMonth(), 1)
        const month =
          current.months.get(key) ?? { key, label: formatMonthLabel(monthDate), date: monthDate, revenue: 0, units: 0, count: 0 }
        month.revenue += revenue
        month.units += units
        month.count += 1
        current.months.set(key, month)
      }
    }

    groups.set(label, current)
  })

  const products = Array.from(groups.values())
    .map((group) => ({
      label: group.label,
      revenue: group.revenue,
      units: group.units,
      count: group.count,
      months: Array.from(group.months.values()).sort((left, right) => left.date - right.date),
    }))
    .sort((left, right) => right.revenue - left.revenue)

  return {
    products,
    byLabel: new Map(products.map((item) => [item.label, item])),
  }
}

function buildMonthlySeriesByProduct(
  rows,
  productColumn,
  amountColumn,
  priceColumn,
  quantityColumn,
  dateColumn
) {
  const grouped = new Map()

  rows.forEach((row) => {
    const label = normalizeGroupLabel(row[productColumn], 'Unassigned')
    const date = parseDatasetDate(row[dateColumn])
    if (!date) {
      return
    }

    const revenue = getSalesValue(row, amountColumn, priceColumn, quantityColumn)
    const units = quantityColumn ? Math.max(parseNumericValue(row[quantityColumn]), 1) : 1
    const key = formatMonthKey(date)
    const monthDate = new Date(date.getFullYear(), date.getMonth(), 1)

    const productMonths = grouped.get(label) ?? new Map()
    const current =
      productMonths.get(key) ?? { key, label: formatMonthLabel(monthDate), date: monthDate, revenue: 0, units: 0, count: 0 }
    current.revenue += revenue
    current.units += units
    current.count += 1
    productMonths.set(key, current)
    grouped.set(label, productMonths)
  })

  const output = {}
  grouped.forEach((monthMap, productLabel) => {
    const ordered = Array.from(monthMap.values()).sort((left, right) => left.date - right.date)
    if (!ordered.length) {
      output[productLabel] = []
      return
    }

    const filledSeries = []
    const cursor = new Date(ordered[0].date)
    const endDate = new Date(ordered[ordered.length - 1].date)

    while (cursor <= endDate) {
      const key = formatMonthKey(cursor)
      const existing = monthMap.get(key)
      filledSeries.push(
        existing ?? {
          key,
          label: formatMonthLabel(cursor),
          date: new Date(cursor),
          revenue: 0,
          units: 0,
          count: 0,
        }
      )
      cursor.setMonth(cursor.getMonth() + 1)
    }

    output[productLabel] = filledSeries.map((entry) => ({
      ...entry,
      revenueLabel: formatCurrency(entry.revenue),
      unitsLabel: `${formatCompactCount(entry.units)} units`,
      tooltip: `${entry.label}: ${formatCurrency(entry.revenue)}`,
    }))
  })

  return output
}

function resolveCanonicalCategory(productLabel, sourceCategory) {
  const product = String(productLabel ?? '').trim().toLowerCase()
  const source = String(sourceCategory ?? '').trim()
  const sourceNormalized = source.toLowerCase()

  const canonicalProductMap = {
    phone: 'Electronics',
    tablet: 'Electronics',
    monitor: 'Electronics',
    laptop: 'Electronics',
    computer: 'Electronics',
    desktop: 'Electronics',
    keyboard: 'Electronics',
    mouse: 'Electronics',
    headset: 'Electronics',
    headphones: 'Electronics',
    camera: 'Electronics',
    printer: 'Office Supplies',
    electronics: 'Electronics',
    chair: 'Furniture',
    desk: 'Furniture',
    table: 'Furniture',
    sofa: 'Furniture',
    cabinet: 'Furniture',
    bookshelf: 'Furniture',
    paper: 'Office Supplies',
    notebook: 'Office Supplies',
    pen: 'Office Supplies',
    pencil: 'Office Supplies',
    stapler: 'Office Supplies',
    folder: 'Office Supplies',
    beauty: 'Other',
    clothing: 'Other',
  }

  if (canonicalProductMap[product]) {
    return canonicalProductMap[product]
  }

  if (
    source &&
    !isPlaceholderValue(source) &&
    ['electronics', 'electronic', 'furniture', 'office supplies', 'office supply', 'other'].includes(sourceNormalized)
  ) {
    if (sourceNormalized.startsWith('electronic')) return 'Electronics'
    if (sourceNormalized.startsWith('furniture')) return 'Furniture'
    if (sourceNormalized.startsWith('office')) return 'Office Supplies'
    return 'Other'
  }

  return 'Other'
}

function normalizeGroupLabel(value, fallbackLabel) {
  if (isPlaceholderValue(value) || isMissingValue(value)) {
    return fallbackLabel
  }

  return String(value ?? '').trim() || fallbackLabel
}

function isPlaceholderValue(value) {
  const normalized = String(value ?? '').trim().toLowerCase()
  return normalized === 'filled value' || normalized === 'filled values' || normalized === 'filled_value'
}

function getWindowRows(rows, dateColumn, days, offsetDays = 0) {
  if (!dateColumn) {
    const endIndex = Math.max(0, rows.length - offsetDays)
    const startIndex = Math.max(0, endIndex - days)
    return rows.slice(startIndex, endIndex)
  }

  const datedRows = rows
    .map((row) => ({ row, date: parseDatasetDate(row[dateColumn]) }))
    .filter((entry) => entry.date)
    .sort((left, right) => left.date - right.date)

  if (!datedRows.length) {
    const endIndex = Math.max(0, rows.length - offsetDays)
    const startIndex = Math.max(0, endIndex - days)
    return rows.slice(startIndex, endIndex)
  }

  const latestDate = new Date(datedRows[datedRows.length - 1].date)
  latestDate.setHours(0, 0, 0, 0)
  latestDate.setDate(latestDate.getDate() - offsetDays)

  const startDate = new Date(latestDate)
  startDate.setDate(startDate.getDate() - (days - 1))

  return datedRows
    .filter((entry) => entry.date >= startDate && entry.date <= latestDate)
    .map((entry) => entry.row)
}

function buildTodaySalesKpi(rows, amountColumn, priceColumn, quantityColumn, dateColumn) {
  const datedGroups = groupSalesByDate(rows, amountColumn, priceColumn, quantityColumn, dateColumn)

  if (datedGroups.length) {
    const latest = datedGroups[datedGroups.length - 1]
    const previous = datedGroups[datedGroups.length - 2]?.value ?? 0

    return {
      value: latest.value,
      delta: calculatePercentDelta(latest.value, previous),
      caption: `Latest day: ${latest.label}`,
    }
  }

  const latestRows = rows.slice(-1)
  const previousRows = rows.slice(-2, -1)
  const latestValue = sumSales(latestRows, amountColumn, priceColumn, quantityColumn)
  const previousValue = sumSales(previousRows, amountColumn, priceColumn, quantityColumn)

  return {
    value: latestValue,
    delta: calculatePercentDelta(latestValue, previousValue),
    caption: 'Based on latest record',
  }
}

function buildWeekSalesKpi(rows, amountColumn, priceColumn, quantityColumn, dateColumn) {
  const datedGroups = groupSalesByDate(rows, amountColumn, priceColumn, quantityColumn, dateColumn)

  if (datedGroups.length) {
    const currentWeek = datedGroups.slice(-7)
    const previousWeek = datedGroups.slice(-14, -7)
    const currentValue = currentWeek.reduce((sum, day) => sum + day.value, 0)
    const previousValue = previousWeek.reduce((sum, day) => sum + day.value, 0)

    return {
      value: currentValue,
      delta: calculatePercentDelta(currentValue, previousValue),
      caption: 'Latest 7 sales days',
    }
  }

  const currentRows = rows.slice(-7)
  const previousRows = rows.slice(-14, -7)
  const currentValue = sumSales(currentRows, amountColumn, priceColumn, quantityColumn)
  const previousValue = sumSales(previousRows, amountColumn, priceColumn, quantityColumn)

  return {
    value: currentValue,
    delta: calculatePercentDelta(currentValue, previousValue),
    caption: 'Latest 7 records',
  }
}

function buildForecastTomorrowKpi(
  rows,
  amountColumn,
  priceColumn,
  quantityColumn,
  dateColumn,
  forecastModel,
  forecastStatus,
  forecastGeneratedAt
) {
  const modelForecastValue = getModelForecastTomorrowValue(forecastModel)

  if (modelForecastValue !== null) {
    const method = forecastModel?.modelInfo?.method ?? 'forecast'
    const generatedLabel = forecastGeneratedAt ? ` at ${forecastGeneratedAt}` : ''

    return {
      value: modelForecastValue,
      caption: `From executed ${method} model${generatedLabel}`,
      source: 'model',
    }
  }

  return {
    value: 0,
    displayValue:
      forecastStatus === 'running'
        ? 'Training'
        : forecastStatus === 'error'
          ? 'Unavailable'
          : 'Not Ready',
    caption:
      forecastStatus === 'running'
        ? 'Forecast model is executing from the active dataset'
        : forecastStatus === 'error'
          ? 'Start the backend, then run the forecast model again'
          : 'Upload or select a dataset to execute the forecast model',
    source: 'pending',
  }
}

function getModelForecastTomorrowValue(model) {
  if (!model?.summary) {
    return null
  }

  const dailyAverage = Number(model.summary.next7DailyAverage)
  if (Number.isFinite(dailyAverage) && dailyAverage > 0) {
    return dailyAverage
  }

  const next7 = Number(model.summary.next7)
  if (Number.isFinite(next7) && next7 > 0) {
    return next7 / 7
  }

  const parsedNext7 = parseNumericValue(model.summary.next7Label)
  if (parsedNext7 > 0) {
    return parsedNext7 / 7
  }

  const targetMetric = String(model.modelInfo?.targetMetric ?? '').toLowerCase()
  const predicted = model.ranges?.['7d']?.series?.predicted
  const tomorrow = Array.isArray(predicted) ? Number(predicted[1]) : 0

  if (targetMetric === 'revenue' && Number.isFinite(tomorrow) && tomorrow > 0) {
    return tomorrow
  }

  return null
}

function buildBestSellerMonthKpi(
  rows,
  categoryColumn,
  amountColumn,
  priceColumn,
  quantityColumn,
  dateColumn
) {
  if (!categoryColumn) {
    return {
      value: 'No product data',
      share: 0,
      caption: 'Add a product column',
    }
  }

  const monthlyRows = getLatestMonthRows(rows, dateColumn)
  const groups = new Map()

  monthlyRows.forEach((row) => {
    const label = String(row[categoryColumn] ?? '').trim() || 'Unassigned'
    const value = getSalesValue(row, amountColumn, priceColumn, quantityColumn)
    const current = groups.get(label) ?? { label, value: 0 }
    current.value += value
    groups.set(label, current)
  })

  const sorted = Array.from(groups.values()).sort((left, right) => right.value - left.value)
  const winner = sorted[0] ?? { label: 'No sales', value: 0 }
  const total = sorted.reduce((sum, item) => sum + item.value, 0) || 1

  return {
    value: winner.label,
    share: Math.round((winner.value / total) * 100),
    caption: dateColumn ? 'Top product in latest month' : 'Top product in dataset',
  }
}

function groupSalesByDate(rows, amountColumn, priceColumn, quantityColumn, dateColumn) {
  if (!dateColumn) {
    return []
  }

  const groups = new Map()

  rows.forEach((row) => {
    const date = parseDatasetDate(row[dateColumn])

    if (!date) {
      return
    }

    const key = formatDateKey(date)
    const current = groups.get(key) ?? { label: key, date, value: 0 }
    current.value += getSalesValue(row, amountColumn, priceColumn, quantityColumn)
    groups.set(key, current)
  })

  return Array.from(groups.values()).sort((left, right) => left.date - right.date)
}

function getLatestMonthRows(rows, dateColumn) {
  if (!dateColumn) {
    return rows
  }

  const datedRows = rows
    .map((row) => ({ row, date: parseDatasetDate(row[dateColumn]) }))
    .filter((entry) => entry.date)

  if (!datedRows.length) {
    return rows
  }

  const latest = datedRows.reduce((max, entry) => (entry.date > max ? entry.date : max), datedRows[0].date)
  const latestYear = latest.getFullYear()
  const latestMonth = latest.getMonth()

  return datedRows
    .filter((entry) => entry.date.getFullYear() === latestYear && entry.date.getMonth() === latestMonth)
    .map((entry) => entry.row)
}

function sumSales(rows, amountColumn, priceColumn, quantityColumn) {
  return rows.reduce(
    (sum, row) => sum + getSalesValue(row, amountColumn, priceColumn, quantityColumn),
    0
  )
}

function calculatePercentDelta(currentValue, previousValue) {
  if (!previousValue) {
    return currentValue > 0 ? 100 : 0
  }

  return clamp(((currentValue - previousValue) / previousValue) * 100, -99, 199)
}

function formatDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatMonthKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')

  return `${year}-${month}`
}

function formatMonthLabel(date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function countMissingCells(dataset) {
  let missingCount = 0

  dataset.rows.forEach((row) => {
    dataset.columns.forEach((column) => {
      if (isMissingValue(row[column])) {
        missingCount += 1
      }
    })
  })

  return missingCount
}

function countDuplicateRows(rows) {
  const seen = new Set()
  let duplicates = 0

  rows.forEach((row) => {
    const key = JSON.stringify(row)
    if (seen.has(key)) {
      duplicates += 1
      return
    }
    seen.add(key)
  })

  return duplicates
}

function summarizeByColumn(rows, column, valueColumn, fallbackLabel) {
  if (!rows.length) {
    return []
  }

  const groups = new Map()

  rows.forEach((row) => {
    const label = column ? String(row[column] ?? '').trim() || fallbackLabel : fallbackLabel
    const value = valueColumn ? parseNumericValue(row[valueColumn]) : 1
    const current = groups.get(label) ?? { label, value: 0, count: 0 }
    current.value += value > 0 ? value : 1
    current.count += 1
    groups.set(label, current)
  })

  const total = Array.from(groups.values()).reduce((sum, item) => sum + item.value, 0) || 1

  return Array.from(groups.values())
    .map((item) => ({
      ...item,
      share: Math.max(1, Math.round((item.value / total) * 100)),
    }))
    .sort((left, right) => right.value - left.value)
}

function calculateGrowthRate(rows, amountColumn, dateColumn, range) {
  const scopedRows = getScopedRows(rows, dateColumn, range)
  const values = scopedRows.map((row) => (amountColumn ? parseNumericValue(row[amountColumn]) : 1))

  if (!values.length) {
    return 0
  }

  const midpoint = Math.max(1, Math.floor(values.length / 2))
  const firstHalf = values.slice(0, midpoint).reduce((sum, value) => sum + value, 0)
  const secondHalf = values.slice(midpoint).reduce((sum, value) => sum + value, 0)

  if (!firstHalf) {
    return secondHalf > 0 ? 100 : 0
  }

  return clamp(((secondHalf - firstHalf) / firstHalf) * 100, -99, 199)
}

function buildWeeklyTrend(rows, amountColumn, dateColumn, range) {
  const labels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
  const buckets = labels.map((label) => ({ label, value: 0, count: 0 }))
  const scopedRows = getScopedRows(rows, dateColumn, range)

  if (dateColumn) {
    scopedRows.forEach((row) => {
      const date = parseDatasetDate(row[dateColumn])
      const bucketIndex = date ? (date.getDay() + 6) % 7 : 0
      const value = amountColumn ? parseNumericValue(row[amountColumn]) : 1
      buckets[bucketIndex].value += value > 0 ? value : 1
      buckets[bucketIndex].count += 1
    })
  } else {
    scopedRows.forEach((row, index) => {
      const value = amountColumn ? parseNumericValue(row[amountColumn]) : 1
      const bucketIndex = index % 7
      buckets[bucketIndex].value += value > 0 ? value : 1
      buckets[bucketIndex].count += 1
    })
  }

  const values = buckets.map((bucket) => (bucket.value > 0 ? bucket.value : bucket.count))
  const maxValue = Math.max(...values, 1)

  return buckets.map((bucket, index) => {
    const rawValue = values[index]
    return {
      label: bucket.label,
      height: Math.max(14, Math.round((rawValue / maxValue) * 100)),
      tooltip: amountColumn ? formatCurrency(rawValue) : `${bucket.count} records`,
    }
  })
}

function getScopedRows(rows, dateColumn, range) {
  const datedRows = rows
    .map((row) => ({ row, date: parseDatasetDate(row[dateColumn]) }))
    .filter((entry) => entry.date)
    .sort((left, right) => left.date - right.date)

  if (!datedRows.length) {
    return rows.slice(-Math.min(rows.length, range === '30d' ? 30 : 7))
  }

  const days = range === '30d' ? 30 : 7
  const latestDate = datedRows[datedRows.length - 1].date
  const cutoff = new Date(latestDate)
  cutoff.setHours(0, 0, 0, 0)
  cutoff.setDate(cutoff.getDate() - (days - 1))

  return datedRows
    .filter((entry) => entry.date >= cutoff)
    .map((entry) => entry.row)
}

function buildInventoryModel(dataset, statusColumn, stockColumn) {
  const counts = { primary: 0, secondary: 0, tertiary: 0 }

  dataset.rows.forEach((row) => {
    if (stockColumn) {
      const value = parseNumericValue(row[stockColumn])
      if (value <= 0) {
        counts.tertiary += 1
      } else if (value <= 10) {
        counts.secondary += 1
      } else {
        counts.primary += 1
      }
      return
    }

    if (statusColumn) {
      const status = String(row[statusColumn] ?? '').toLowerCase()
      if (/(error|out|fail|critical)/.test(status)) {
        counts.tertiary += 1
      } else if (/(pending|review|missing|low)/.test(status)) {
        counts.secondary += 1
      } else {
        counts.primary += 1
      }
      return
    }

    const missingFields = dataset.columns.reduce(
      (sum, column) => sum + (isMissingValue(row[column]) ? 1 : 0),
      0
    )

    if (missingFields >= 2) {
      counts.tertiary += 1
    } else if (missingFields === 1) {
      counts.secondary += 1
    } else {
      counts.primary += 1
    }
  })

  const total = Math.max(dataset.rows.length, 1)
  const primaryPercent = Math.round((counts.primary / total) * 100)
  const secondaryPercent = Math.round((counts.secondary / total) * 100)
  const tertiaryPercent = Math.max(0, 100 - primaryPercent - secondaryPercent)

  return {
    totalLabel: formatCompactCount(dataset.rows.length),
    totalCaption: 'records tracked',
    primaryAngle: 45 + primaryPercent * 1.8,
    secondaryAngle: 210 + secondaryPercent * 1.4,
    counts: {
      healthy: counts.primary,
      watch: counts.secondary,
      critical: counts.tertiary,
    },
    segments: [
      { label: 'Healthy', tone: 'primary', value: `${primaryPercent}%` },
      { label: 'Watch', tone: 'secondary', value: `${secondaryPercent}%` },
      { label: 'Critical', tone: 'tertiary', value: `${tertiaryPercent}%` },
    ],
  }
}

function formatCompactCount(value) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`
  }

  return String(value)
}

function parseDatasetDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return excelSerialToDate(value)
  }

  const text = String(value ?? '').trim()
  if (!text) {
    return null
  }

  const numeric = Number(text)
  if (Number.isFinite(numeric) && /^[+-]?\d+(\.\d+)?$/.test(text) && numeric > 10000) {
    return excelSerialToDate(numeric)
  }

  const date = new Date(text)
  return Number.isNaN(date.getTime()) ? null : date
}

function excelSerialToDate(serial) {
  const milliseconds = Math.round(serial * 24 * 60 * 60 * 1000)
  return new Date(Date.UTC(1899, 11, 30) + milliseconds)
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export default App
