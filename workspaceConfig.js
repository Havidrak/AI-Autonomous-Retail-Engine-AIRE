export const navItems = [
  { label: 'Data Management', icon: 'database', route: 'data-management' },
  { label: 'Overview', icon: 'grid', route: 'dashboard' },
  { label: 'Forecasting', icon: 'trend', route: 'forecasting' },
  { label: 'Inventory', icon: 'box', route: 'inventory' },
  { label: 'Customers', icon: 'users', route: 'customers' },
  { label: 'Settings', icon: 'gear', route: 'settings' },
]

export const toolboxActions = [
  { title: 'Remove Duplicates', icon: 'duplicate', action: 'removeDuplicates' },
  { title: 'Fill Missing Values', icon: 'fill', action: 'fillMissingValues' },
  { title: 'Format Dates', icon: 'calendar', action: 'formatDates' },
]

export const featureActions = [
  { title: 'Generate Sales Trends', icon: 'spark', tone: 'mint', action: 'salesTrends' },
  {
    title: 'Calculate Customer Metrics',
    icon: 'target',
    tone: 'lavender',
    action: 'customerMetrics',
  },
]

export const defaultUploadMessage = 'Support for .CSV and .JSON formats up to 500MB'

export const initialAuthForm = {
  fullName: '',
  email: '',
  password: '',
  remember: true,
}
