export function getRouteFromHash() {
  if (window.location.hash === '#/signin') {
    return 'signin'
  }

  if (window.location.hash === '#/signup') {
    return 'signup'
  }

  if (window.location.hash === '#/dashboard') {
    return 'dashboard'
  }

  return 'data-management'
}

export function navigateTo(route) {
  if (route === 'data-management') {
    window.location.hash = ''
    return
  }

  window.location.hash = `#/${route}`
}

export function parseCsv(text, fileName) {
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

export function parseJson(text, fileName) {
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

export function removeDuplicateRows(dataset) {
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

export function fillMissingValues(dataset) {
  let updatedCount = 0
  const rows = dataset.rows.map((row) => {
    const nextRow = { ...row }
    dataset.columns.forEach((column) => {
      if (isMissingValue(nextRow[column])) {
        nextRow[column] = column.toLowerCase() === 'status' ? 'success' : 'Filled Value'
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

export function formatDateColumns(dataset) {
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

export function isMissingValue(value) {
  const normalized = String(value ?? '').trim().toLowerCase()
  return (
    normalized === '' ||
    normalized === '--' ||
    normalized === '-- missing --' ||
    normalized === 'null' ||
    normalized === 'n/a'
  )
}

export function normalizeStatus(value) {
  return String(value ?? '').toLowerCase().includes('error') ? 'error' : 'success'
}

export function getCellClassName(column, value) {
  const normalizedColumn = column.toLowerCase()

  if (normalizedColumn.includes('amount')) {
    return 'amount'
  }

  if (
    normalizedColumn.includes('transaction') &&
    String(value ?? '').toUpperCase().includes('88220')
  ) {
    return 'transaction error'
  }

  return ''
}

export function formatCellValue(value) {
  if (value === null || value === undefined || value === '') {
    return '--'
  }

  return String(value)
}

export function createLogEntry(title, body, status) {
  return {
    id: `${title}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    body,
    status,
    time: formatClockTime(),
  }
}

export function createNotificationEntry(title, body, tone) {
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

export function cloneDataset(dataset) {
  return {
    ...dataset,
    rows: dataset.rows.map((row) => ({ ...row })),
  }
}

export function findColumn(columns, keywords) {
  return (
    columns.find((column) =>
      keywords.some((keyword) => column.toLowerCase().includes(keyword))
    ) ?? null
  )
}

export function parseNumericValue(value) {
  const numeric = Number(String(value ?? '').replace(/[^0-9.-]/g, ''))
  return Number.isFinite(numeric) ? numeric : 0
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value)
}

export function calculateQualityMetrics(dataset) {
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

export function buildDashboardModel(dataset, options = {}) {
  const rows = dataset.rows
  const columns = dataset.columns
  const query = String(options.query ?? '').trim().toLowerCase()
  const view = options.view ?? 'global-view'
  const range = options.range ?? '7d'
  const completedActionIds = options.completedActionIds ?? []

  const amountColumn = findColumn(columns, ['amount', 'sales', 'revenue', 'total', 'price'])
  const dateColumn = findColumn(columns, ['date', 'time', 'timestamp'])
  const regionColumn = findColumn(columns, ['region', 'market', 'location', 'country'])
  const categoryColumn = findColumn(columns, ['category', 'product', 'sku', 'item'])
  const customerColumn = findColumn(columns, ['customer', 'client', 'buyer'])
  const statusColumn = findColumn(columns, ['status', 'state'])
  const stockColumn = findColumn(columns, ['stock', 'inventory', 'qty', 'quantity', 'units'])

  const quality = calculateQualityMetrics(dataset)
  const qualityScore = Number(quality.score) || 0
  const totalSales = getTotalDatasetValue(rows, amountColumn)
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
  const categoryStats = summarizeByColumn(rows, categoryColumn, amountColumn, 'Core Portfolio')
  const topRegion = regionStats[0] ?? { label: 'Global', value: totalSales, share: 100, count: rows.length }
  const topCategory =
    categoryStats[0] ?? {
      label: 'Core Portfolio',
      value: totalSales,
      share: 100,
      count: rows.length,
    }
  const growthPercent = calculateGrowthRate(rows, amountColumn, dateColumn, range)
  const weeklyTrend = buildWeeklyTrend(rows, amountColumn, dateColumn, range)
  const inventory = buildInventoryModel(dataset, statusColumn, stockColumn)
  const potentialImpact = Math.max(
    totalSales * 0.043,
    averageValue * Math.max(2, Math.round(rows.length * 0.08))
  )
  const topInitials = [topRegion.label, topCategory.label]
    .map((label) => getLabelInitials(label))
    .filter(Boolean)

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
      label: 'Total Sales',
      icon: 'money',
      tone: 'primary',
      value: formatCurrency(totalSales),
      delta: `${growthPercent >= 0 ? '+' : ''}${growthPercent.toFixed(1)}%`,
      deltaTone: growthPercent >= 0 ? 'positive' : 'negative',
      progress: clamp(topRegion.share, 18, 96),
    },
    {
      label: view === 'market-trends' ? 'Market Velocity' : 'Forecast Growth',
      icon: 'trend',
      tone: 'indigo',
      value: `${growthPercent >= 0 ? '+' : ''}${growthPercent.toFixed(1)}%`,
      delta: `${topCategory.share}% share`,
      deltaTone: 'positive',
      bars: weeklyTrend.map((point) => Math.max(14, point.height)),
    },
    {
      label: 'Stock Health Index',
      icon: 'health',
      tone: 'emerald',
      value: `${Math.round(qualityScore)}/100`,
      delta: qualityScore >= 85 ? 'Stable' : 'Watch',
      deltaTone: qualityScore >= 85 ? 'positive' : 'negative',
      footnote: `Optimized across ${columns.length} columns`,
    },
    {
      label: 'Profit Impact',
      icon: 'target',
      tone: 'rose',
      value: formatCurrency(potentialImpact),
      delta: `${duplicateCount || missingCount ? '-' : '+'}${Math.max(1.2, Math.abs(growthPercent) / 2).toFixed(1)}% signal`,
      deltaTone: duplicateCount || missingCount ? 'negative' : 'positive',
      avatars: topInitials.slice(0, 2),
      footnote: `${customerCount} tracked customer records`,
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
      id: 'duplicates',
      label:
        duplicateCount > 0
          ? `${duplicateCount} duplicate record${duplicateCount === 1 ? '' : 's'} detected`
          : 'Duplicate pressure under control',
      tone: duplicateCount > 0 ? 'critical' : 'good',
      icon: duplicateCount > 0 ? 'arrow' : 'check',
    },
    {
      id: 'quality',
      label:
        missingCount > 0
          ? `${missingCount} missing field${missingCount === 1 ? '' : 's'} need attention`
          : `Quality score steady at ${quality.score}%`,
      tone: missingCount > 0 ? 'warning' : 'good',
      icon: missingCount > 0 ? 'schedule' : 'check',
    },
    {
      id: 'concentration',
      label:
        topRegion.share >= 55
          ? `Revenue concentration in ${topRegion.label}`
          : `${topCategory.label} is the lead growth engine`,
      tone: topRegion.share >= 55 ? 'warning' : 'good',
      icon: topRegion.share >= 55 ? 'arrow' : 'check',
    },
  ]

  const riskDetails = {
    duplicates: {
      title:
        duplicateCount > 0
          ? `${duplicateCount} duplicate record${duplicateCount === 1 ? '' : 's'} detected`
          : 'Duplicate pressure under control',
      eyebrow: 'Data quality risk',
      tone: duplicateCount > 0 ? 'critical' : 'good',
      summary:
        duplicateCount > 0
          ? `Your upload contains repeated row${duplicateCount === 1 ? '' : 's'}. Cleaning them will keep the overview and downstream actions sharper.`
          : 'No duplicate rows were detected in the uploaded file.',
      stats: [
        { label: 'Duplicate rows', value: String(duplicateCount) },
        { label: 'Records scanned', value: String(rows.length) },
        {
          label: 'Duplicate rate',
          value: `${Math.round((duplicateCount / Math.max(rows.length, 1)) * 100)}%`,
        },
      ],
      recommendation:
        duplicateCount > 0
          ? 'Run Remove Duplicates from Data Management before the next analysis.'
          : 'No duplicate cleanup is required right now.',
      actionLabel: duplicateCount > 0 ? 'Run cleanup' : 'Review quality',
    },
    quality: {
      title:
        missingCount > 0
          ? `${missingCount} missing field${missingCount === 1 ? '' : 's'} need attention`
          : `Quality score steady at ${quality.score}%`,
      eyebrow: 'Readiness risk',
      tone: missingCount > 0 ? 'warning' : 'good',
      summary:
        missingCount > 0
          ? `There are ${missingCount} incomplete cell${missingCount === 1 ? '' : 's'} across the dataset. Filling gaps will improve trust in the overview.`
          : `The dataset quality score is ${quality.score}%, which is healthy for the current workflow.`,
      stats: [
        { label: 'Quality score', value: `${quality.score}/100` },
        { label: 'Missing cells', value: String(missingCount) },
        { label: 'Columns checked', value: String(columns.length) },
      ],
      recommendation:
        missingCount > 0
          ? 'Use Fill Missing Values before opening a deeper analysis.'
          : 'The dataset is already in a strong state.',
      actionLabel: missingCount > 0 ? 'Fill gaps' : 'Review readiness',
    },
    concentration: {
      title:
        topRegion.share >= 55
          ? `Revenue concentration in ${topRegion.label}`
          : `${topCategory.label} is the lead growth engine`,
      eyebrow: 'Concentration risk',
      tone: topRegion.share >= 55 ? 'warning' : 'good',
      summary:
        topRegion.share >= 55
          ? `${topRegion.label} accounts for ${topRegion.share}% of tracked value, so the overview leans heavily on one lane.`
          : `${topCategory.label} is currently the strongest growth engine with ${topCategory.share}% share.`,
      stats: [
        { label: 'Top region', value: topRegion.label },
        { label: 'Top category', value: topCategory.label },
        { label: 'Lead share', value: `${Math.max(topRegion.share, topCategory.share)}%` },
      ],
      recommendation:
        topRegion.share >= 55
          ? 'Spread focus into secondary regions to reduce concentration risk.'
          : 'The spread is balanced enough for the current overview.',
      actionLabel: topRegion.share >= 55 ? 'Review spread' : 'Review growth',
    },
  }

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

  const matchesQuery = (value) => !query || String(value ?? '').toLowerCase().includes(query)

  const filteredActions = actions.filter((action) =>
    [action.title, action.summary, action.category].some(matchesQuery)
  )
  const filteredRisks = risks.filter((risk) => matchesQuery(risk.label))
  const filteredQueue = queue.filter((item) =>
    [item.title, item.subtitle, item.priorityLabel].some(matchesQuery)
  )

  return {
    hero,
    metrics,
    weeklyTrend,
    inventory,
    actions: filteredActions,
    risks: filteredRisks,
    riskDetails,
    queue: filteredQueue,
  }
}

function getTotalDatasetValue(rows, amountColumn) {
  if (!amountColumn) {
    return rows.length * 180
  }

  const total = rows.reduce((sum, row) => sum + parseNumericValue(row[amountColumn]), 0)
  return total > 0 ? total : rows.length * 180
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
  if (!dateColumn || range === '30d') {
    return rows
  }

  const datedRows = rows
    .map((row) => ({ row, date: parseDatasetDate(row[dateColumn]) }))
    .filter((entry) => entry.date)
    .sort((left, right) => left.date - right.date)

  if (!datedRows.length) {
    return rows.slice(-Math.min(rows.length, 7))
  }

  return datedRows.slice(-7).map((entry) => entry.row)
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

function getLabelInitials(label) {
  return String(label ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function parseDatasetDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}
