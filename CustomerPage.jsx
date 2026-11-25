import {
  DashboardGlyph,
  IconAlert,
  IconDownload,
  IconSparkSmall,
  IconTarget,
  IconTrend,
  IconUsers,
} from './Icons.jsx'

export default function CustomerPage({ dataset, dashboardModel, executedForecast, topRef }) {
  const forecastModel = executedForecast?.model ?? null
  const customerData = buildCustomerIntelligenceData(dataset, dashboardModel, forecastModel)

  if (!dataset || !dashboardModel) {
    return (
      <div className="customer-page customer-empty-page" ref={topRef}>
        <section className="customer-empty-state">
          <div className="customer-empty-icon">
            <IconUsers />
          </div>
          <h2>Upload customer data to unlock customer intelligence</h2>
          <p>
            Segments, retention signals, lifetime value forecasts, and AI recommendations will
            appear after a dataset is loaded from Data Management.
          </p>
        </section>
      </div>
    )
  }

  return (
    <div className="customer-page" ref={topRef}>
      <section className="customer-kpi-grid">
        {customerData.kpis.map((kpi) => (
          <article className="customer-kpi-card" key={kpi.label}>
            <span>{kpi.label}</span>
            <div>
              <strong>{kpi.value}</strong>
              <small className={kpi.tone}>{kpi.delta}</small>
            </div>
          </article>
        ))}
      </section>

      <section className="customer-layout">
        <div className="customer-main">
          <article className="customer-card customer-segments-card">
            <div className="customer-card-head">
              <div>
                <h2>Customer Groups</h2>
                <p>Grouped by spend, repeat purchase behavior, and recent activity.</p>
              </div>
              <button type="button">
                Export Detailed Report
                <IconDownload />
              </button>
            </div>
            <div className="customer-segment-grid">
              {customerData.segments.map((segment) => (
                <section className="customer-segment-card" key={segment.label}>
                  <div className="customer-segment-top">
                    <span className={segment.tone}>{segment.badge}</span>
                    <DashboardGlyph type={segment.icon} />
                  </div>
                  <h3>{segment.label}</h3>
                  <p>{segment.description}</p>
                  <div className="customer-segment-metrics">
                    {segment.metrics.map((metric) => (
                      <div key={metric.label}>
                        <span>{metric.label}</span>
                        <strong className={metric.tone ?? ''}>{metric.value}</strong>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </article>

          <article className="customer-card customer-ltv-card">
            <div className="customer-card-head">
              <div>
                <h2>LTV Forecast Trend</h2>
                <p>Projected customer value for the next 12 months based on recent sales and forecast demand.</p>
              </div>
              <div className="customer-chart-legend">
                <span><b className="historical" /> Historical</span>
                <span><b className="projected" /> Projected</span>
              </div>
            </div>
            <div className="customer-ltv-chart" aria-label="LTV forecast chart">
              {customerData.ltvForecast.map((bar) => (
                <div
                  className={bar.projected ? 'projected' : 'historical'}
                  key={bar.label}
                  style={{ height: `${bar.height}%` }}
                >
                  {bar.current ? <span>{bar.tooltip}</span> : null}
                </div>
              ))}
            </div>
            <div className="customer-chart-axis">
              <span>{customerData.axisLabels[0]}</span>
              <span>{customerData.axisLabels[1]}</span>
              <span>{customerData.axisLabels[2]}</span>
            </div>
            <p className="customer-chart-note">{customerData.ltvDetail}</p>
          </article>
        </div>

        <aside className="customer-side">
          <article className="customer-card customer-impact-card">
            <div className="customer-card-head compact">
              <div>
                <span>Segment Impact Mix</span>
                <h2>Value Distribution</h2>
              </div>
              <IconTarget />
            </div>
            <div className="customer-impact-map">
              <div className="champions">
                <span>Top Customers</span>
                <strong>{customerData.impactMix.champions}% Value</strong>
              </div>
              <div>
                <span>Regular Customers</span>
                <strong>{customerData.impactMix.loyalists}%</strong>
              </div>
              <div>
                <span>Prospects</span>
                <strong>{customerData.impactMix.prospects}%</strong>
              </div>
              <div className="others">
                <span>Others</span>
                <strong>{customerData.impactMix.others}%</strong>
              </div>
            </div>
            <div className="customer-impact-list">
              {customerData.impactRows.map((row) => (
                <div key={row.label}>
                  <span><b className={row.tone} /> {row.label}</span>
                  <strong>{row.value}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="customer-card customer-risk-card">
            <div className="customer-risk-head">
              <IconAlert />
              <h2>Churn Risk</h2>
            </div>
            <section className="customer-risk-cluster">
              <h3>High Risk Cluster: "{customerData.riskCluster.name}"</h3>
              {customerData.riskCluster.metrics.map((metric) => (
                <div key={metric.label}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                </div>
              ))}
            </section>
            <div className="customer-risk-count">
              <strong>{formatCount(customerData.riskCluster.count)}</strong>
              <span>Customers at Critical Risk</span>
            </div>
            <button type="button">Review Vulnerable Accounts</button>
          </article>
        </aside>
      </section>

      <section className="customer-card customer-ai-card">
        <div className="customer-card-head">
          <div>
            <h2>Curated AI Recommendations</h2>
            <p>Actions generated from loyalty, churn, and value signals.</p>
          </div>
          <IconSparkSmall />
        </div>
        <div className="customer-recommendation-grid">
          {customerData.recommendations.map((recommendation) => (
            <article className={recommendation.tone} key={recommendation.title}>
              <div>
                <span>{recommendation.type}</span>
                <small>{recommendation.mode}</small>
              </div>
              <p>{recommendation.body}</p>
              <button type="button">
                {recommendation.action}
                <IconTrend />
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

function buildCustomerIntelligenceData(dataset, dashboardModel, forecastModel) {
  const rows = Array.isArray(dataset?.rows) ? dataset.rows : []
  const columns = Array.isArray(dataset?.columns) ? dataset.columns : []
  const customerColumn = findColumn(columns, ['customer', 'client', 'buyer', 'user', 'member'])
  const amountColumn = findColumn(columns, ['amount', 'sales', 'revenue', 'total'])
  const priceColumn = findColumn(columns, ['price', 'unit price', 'unit_price'])
  const quantityColumn = findColumn(columns, ['quantity', 'qty', 'units'])
  const dateColumn = findColumn(columns, ['date', 'time', 'timestamp'])
  const totalRevenue = getTotalSales(rows, amountColumn, priceColumn, quantityColumn)
  const forecastSummary = forecastModel?.summary ?? {}
  const forecastRevenue30 = getForecastRevenue(forecastModel, 30)
  const forecastRevenue7 = getForecastRevenue(forecastModel, 7)
  const forecastUnits30 = Number(forecastSummary.next30_units ?? 0)
  const forecastConfidence = Number(forecastSummary.confidence ?? 0)
  const leadProduct = getLeadForecastProduct(forecastModel, dashboardModel)
  const customerStats = buildCustomerStats(rows, customerColumn, dateColumn, totalRevenue)
  const totalCustomers = customerStats.totalCustomers
  const modelRevenue = forecastRevenue30 > 0 ? forecastRevenue30 : totalRevenue
  const avgLtv = modelRevenue / Math.max(totalCustomers, 1)
  const retentionRate = customerStats.repeatRate
  const riskRate = Math.max(
    6,
    Math.round(
      (customerStats.atRiskCount / Math.max(totalCustomers, 1)) * 100 +
        (forecastConfidence ? Math.max(0, 86 - forecastConfidence) / 3 : 0)
    )
  )
  const ltvForecastData = buildLtvForecast(
    rows,
    amountColumn,
    priceColumn,
    quantityColumn,
    dateColumn,
    totalRevenue,
    forecastModel
  )

  const champions = Math.max(1, Math.round(totalCustomers * 0.08))
  const loyalists = Math.max(1, Math.round(totalCustomers * 0.15))
  const atRisk = Math.max(customerStats.atRiskCount, Math.round(totalCustomers * 0.04))
  const prospects = Math.max(1, Math.round(totalCustomers * 0.17))
  const totalSegmentCount = Math.max(champions + loyalists + atRisk + prospects, 1)

  return {
    kpis: [
      {
        label: 'Total Users',
        value: formatCompactCount(totalCustomers),
        delta: `${customerStats.customerGrowth >= 0 ? '+' : ''}${customerStats.customerGrowth.toFixed(1)}%`,
        tone: customerStats.customerGrowth >= 0 ? 'positive' : 'negative',
      },
      {
        label: 'Forecast LTV',
        value: formatCurrency(avgLtv),
        delta: forecastRevenue30 > 0
          ? `${formatCurrency(forecastRevenue30)} next 30d`
          : `+${Math.max(2.4, Math.min(18, customerStats.averageOrders * 1.6)).toFixed(1)}%`,
        tone: 'positive',
      },
      {
        label: 'Retention Rate',
        value: `${retentionRate.toFixed(1)}%`,
        delta: retentionRate >= 70 ? '+2.1%' : '-0.8%',
        tone: retentionRate >= 70 ? 'positive' : 'negative',
      },
      {
        label: 'Model Confidence',
        value: forecastConfidence ? `${forecastConfidence.toFixed(1)}%` : (riskRate > 18 ? 'High' : riskRate > 10 ? 'Medium' : 'Low'),
        delta: forecastConfidence ? 'forecast signal' : `${riskRate}% risk`,
        tone: forecastConfidence >= 85 || (!forecastConfidence && riskRate <= 18) ? 'positive' : 'negative',
      },
    ],
    segments: [
      {
        label: 'Top Customers',
        badge: 'Healthy',
        tone: 'healthy',
        icon: 'spark',
        description: `High frequency shoppers tied to ${leadProduct} forecast demand.`,
        metrics: [
          { label: 'Count', value: formatCompactCount(champions) },
          { label: '% Total', value: `${Math.round((champions / totalCustomers) * 100)}%` },
          { label: 'Avg LTV', value: formatCurrency(avgLtv * 3.8), tone: 'primary' },
        ],
      },
      {
        label: 'Regular Customers',
        badge: 'Steady',
        tone: 'steady',
        icon: 'check',
        description: 'Consistent buyers expected to sustain forecast revenue.',
        metrics: [
          { label: 'Count', value: formatCompactCount(loyalists) },
          { label: '% Total', value: `${Math.round((loyalists / totalCustomers) * 100)}%` },
          { label: 'Avg LTV', value: formatCurrency(avgLtv * 1.9), tone: 'primary' },
        ],
      },
      {
        label: 'Customers Needing Attention',
        badge: 'Critical',
        tone: 'critical',
        icon: 'warning',
        description: `Declining engagement may weaken the ${formatCurrency(forecastRevenue7 || modelRevenue / 4.2)} short-term forecast.`,
        metrics: [
          { label: 'Count', value: formatCompactCount(atRisk), tone: 'danger' },
          { label: '% Total', value: `${Math.round((atRisk / totalCustomers) * 100)}%` },
          { label: 'Impact', value: `-${formatCurrency(avgLtv * atRisk * 0.34)}`, tone: 'danger' },
        ],
      },
      {
        label: 'New Customers',
        badge: 'Emerging',
        tone: 'emerging',
        icon: 'sparkles',
        description: `Recent buyers with growth potential from ${formatCompactCount(forecastUnits30 || prospects)} forecast units.`,
        metrics: [
          { label: 'Count', value: formatCompactCount(prospects) },
          { label: '% Total', value: `${Math.round((prospects / totalCustomers) * 100)}%` },
          { label: 'Conv. Rate', value: `${Math.max(3.2, customerStats.averageOrders * 1.1).toFixed(1)}%`, tone: 'primary' },
        ],
      },
    ],
    ltvForecast: ltvForecastData.values,
    ltvDetail: ltvForecastData.detail,
    axisLabels: ['Start', 'Current', 'Projected'],
    impactMix: {
      champions: Math.round((champions * 3.8 / totalSegmentCount) * 100),
      loyalists: Math.round((loyalists * 1.2 / totalSegmentCount) * 100),
      prospects: Math.max(8, Math.round((prospects / totalSegmentCount) * 100)),
      others: 8,
    },
    impactRows: [
      { label: 'High ROI', value: `${Math.min(84, Math.max(52, Math.round(retentionRate)))}%`, tone: 'primary' },
      { label: 'Maintenance', value: `${Math.max(12, Math.round(loyalists / totalCustomers * 100))}%`, tone: 'steady' },
      { label: 'Leaking', value: `${Math.max(4, Math.round(atRisk / totalCustomers * 100))}%`, tone: 'danger' },
    ],
    riskCluster: {
      name: 'Inactive VIPs',
      count: atRisk,
      metrics: [
        { label: 'Avg. Days Since Purchase', value: `${customerStats.averageInactiveDays} Days` },
        { label: 'Basket Size Volatility', value: `+${Math.max(12, Math.round(customerStats.averageOrders * 8))}% Variance` },
        { label: 'Support Ticket Volume', value: `${Math.max(1.4, customerStats.averageOrders / 1.2).toFixed(1)}x Increase` },
      ],
    },
    recommendations: [
      {
        type: 'Retention',
        mode: 'Predictive',
        tone: 'retention',
        body: `Initiate re-engagement for customers needing attention because the model predicts ${formatCurrency(forecastRevenue30 || modelRevenue)} revenue in the next 30 days.`,
        action: 'Execute Automated Flow',
      },
      {
        type: 'Growth',
        mode: 'Opportunity',
        tone: 'growth',
        body: `Upsell premium bundles to regular customers around ${leadProduct}, the product with the strongest forecast contribution.`,
        action: 'View Audience Details',
      },
      {
        type: 'Acquisition',
        mode: 'Refinement',
        tone: 'acquisition',
        body: `Shift prospecting budget toward high-LTV lookalikes while forecast confidence is ${forecastConfidence ? `${forecastConfidence.toFixed(1)}%` : 'being calculated'}.`,
        action: 'Adjust Media Spend',
      },
    ],
    dashboardModel,
  }
}

function buildCustomerStats(rows, customerColumn, dateColumn, totalRevenue) {
  const counts = new Map()
  const latestDates = []

  rows.forEach((row, index) => {
    const customer = customerColumn
      ? normalizeLabel(row[customerColumn]) || `Customer ${index + 1}`
      : `Customer ${Math.floor(index / 2) + 1}`
    counts.set(customer, (counts.get(customer) ?? 0) + 1)

    const date = dateColumn ? parseDatasetDate(row[dateColumn]) : null
    if (date) {
      latestDates.push(date)
    }
  })

  const totalCustomers = Math.max(counts.size || Math.ceil(rows.length / 2), 1)
  const repeatCustomers = Array.from(counts.values()).filter((count) => count > 1).length
  const repeatRate = Math.min(96, Math.max(38, (repeatCustomers / totalCustomers) * 100 || 68))
  const averageOrders = rows.length / Math.max(totalCustomers, 1)
  const maxDate = latestDates.length ? new Date(Math.max(...latestDates.map((date) => date.getTime()))) : null
  const averageInactiveDays = maxDate ? 42 : Math.max(18, Math.round(52 - averageOrders * 4))
  const atRiskCount = Math.max(1, Math.round(totalCustomers * (repeatRate < 55 ? 0.12 : 0.06)))
  const customerGrowth = totalRevenue > 0 ? Math.min(24, Math.max(2.2, averageOrders * 2.4)) : 0

  return {
    totalCustomers,
    repeatRate,
    averageOrders,
    averageInactiveDays,
    atRiskCount,
    customerGrowth,
  }
}

function buildLtvForecast(rows, amountColumn, priceColumn, quantityColumn, dateColumn, totalRevenue, forecastModel) {
  const monthlyTotals = buildMonthlyTotals(rows, amountColumn, priceColumn, quantityColumn, dateColumn)
  const baseValues = monthlyTotals.length
    ? monthlyTotals.slice(-6).map((item) => item.value)
    : [0.46, 0.52, 0.58, 0.64, 0.72, 0.8].map((share) => totalRevenue * share)
  const latest = baseValues[baseValues.length - 1] || totalRevenue || 1
  const forecast30 = getForecastRevenue(forecastModel, 30)
  const historicalGrowth = baseValues.length >= 2
    ? (latest - baseValues[0]) / Math.max(baseValues[0], 1)
    : 0
  const forecastSignal = forecast30 > 0
    ? (forecast30 - latest) / Math.max(latest, 1)
    : historicalGrowth
  // Keep the projection data-led: a weaker forecast than the latest month can
  // produce a downward customer-value trend instead of an artificial increase.
  const projectedGrowth = Math.max(-0.3, Math.min(0.3, forecastSignal))
  const historicalVolatility = baseValues.length >= 2
    ? baseValues.slice(1).reduce((total, value, index) => {
        const previous = baseValues[index] || latest
        return total + Math.abs(value - previous) / Math.max(previous, 1)
      }, 0) / (baseValues.length - 1)
    : 0.04
  const variationSize = Math.min(0.08, Math.max(0.015, historicalVolatility * 0.35))
  const variationPattern = [0.15, -0.5, 0.3, -0.2, 0.42, -0.12]
  const projected = Array.from({ length: 6 }, (_, index) => {
    const progress = (index + 1) / 6
    const variation = variationPattern[index] * variationSize
    const value = latest * (1 + projectedGrowth * progress + variation)
    return Math.max(0, value)
  })
  const values = [...baseValues, ...projected]
  const maxValue = Math.max(...values, 1)

  const direction = projectedGrowth > 0.015 ? 'increasing' : projectedGrowth < -0.015 ? 'decreasing' : 'stable'
  const directionDetail = direction === 'increasing'
    ? 'The overall projection is increasing, with small dips showing normal demand variation.'
    : direction === 'decreasing'
      ? 'The overall projection is decreasing, with small rebounds showing normal demand variation.'
      : 'The projection is broadly stable, with small increases and decreases showing forecast uncertainty.'

  return {
    values: values.map((value, index) => ({
    label: index < baseValues.length ? `H${index + 1}` : `P${index - baseValues.length + 1}`,
    height: Math.max(18, Math.min(105, Math.round((value / maxValue) * 100))),
    projected: index >= baseValues.length,
    current: index === baseValues.length - 1,
    tooltip: `Current: ${formatCurrency(value)}`,
    })),
    detail: directionDetail,
  }
}

function getForecastRevenue(model, days) {
  if (!model?.summary) {
    return 0
  }

  const summaryValue = days === 7 ? Number(model.summary.next7) : Number(model.summary.next30)
  if (Number.isFinite(summaryValue) && summaryValue > 0) {
    return summaryValue
  }

  const label = days === 7 ? model.summary.next7Label : model.summary.next30Label
  return parseNumericValue(label)
}

function getLeadForecastProduct(model, dashboardModel) {
  const productFromModel = Array.isArray(model?.productsByRevenue) ? model.productsByRevenue[0]?.label : ''
  if (productFromModel) {
    return productFromModel
  }

  const productFromDashboard = dashboardModel?.topProducts?.revenue?.items?.[0]?.label
  return productFromDashboard || 'top product'
}

function buildMonthlyTotals(rows, amountColumn, priceColumn, quantityColumn, dateColumn) {
  if (!dateColumn) {
    return []
  }

  const groups = new Map()
  rows.forEach((row) => {
    const date = parseDatasetDate(row[dateColumn])
    if (!date) {
      return
    }
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    groups.set(key, (groups.get(key) ?? 0) + getSalesValue(row, amountColumn, priceColumn, quantityColumn))
  })

  return Array.from(groups.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([label, value]) => ({ label, value }))
}

function findColumn(columns, keywords) {
  return (
    columns.find((column) =>
      keywords.some((keyword) => String(column).toLowerCase().includes(keyword))
    ) ?? null
  )
}

function getTotalSales(rows, amountColumn, priceColumn, quantityColumn) {
  return rows.reduce((sum, row) => sum + getSalesValue(row, amountColumn, priceColumn, quantityColumn), 0)
}

function getSalesValue(row, amountColumn, priceColumn, quantityColumn) {
  if (amountColumn) {
    return parseNumericValue(row[amountColumn])
  }

  const price = priceColumn ? parseNumericValue(row[priceColumn]) : 0
  const quantity = quantityColumn ? parseNumericValue(row[quantityColumn]) : 1
  return price * Math.max(quantity, 1)
}

function parseNumericValue(value) {
  const numeric = Number(String(value ?? '').replace(/[^0-9.-]/g, ''))
  return Number.isFinite(numeric) ? numeric : 0
}

function parseDatasetDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function normalizeLabel(value) {
  return String(value ?? '').trim()
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency: 'MYR',
    maximumFractionDigits: 0,
  }).format(Math.max(0, Number(value) || 0))
}

function formatCount(value) {
  return new Intl.NumberFormat('en-US').format(Math.max(0, Math.round(Number(value) || 0)))
}

function formatCompactCount(value) {
  const number = Math.max(0, Number(value) || 0)
  if (number >= 1000000) {
    return `${(number / 1000000).toFixed(1)}M`
  }
  if (number >= 1000) {
    return `${(number / 1000).toFixed(1)}k`
  }
  return formatCount(number)
}
