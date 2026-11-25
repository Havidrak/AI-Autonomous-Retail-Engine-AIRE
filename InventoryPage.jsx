import { useEffect, useMemo, useState } from 'react'
import {
  DashboardGlyph,
  IconAlert,
  IconCalendar,
  IconDownload,
  IconSparkSmall,
  IconTrend,
  IconUsers,
} from './Icons.jsx'

export default function InventoryPage({
  dataset,
  dashboardModel,
  executedForecast,
  decisionPanelOpen,
  onDecisionPanelOpenChange,
  topRef,
}) {
  const [selectedRecommendationId, setSelectedRecommendationId] = useState('')
  const [explanationRow, setExplanationRow] = useState(null)
  const [filters, setFilters] = useState({
    category: 'All Categories',
    supplier: 'All Suppliers',
    risk: 'All Risk Levels',
    range: 'Last 30 Days',
  })
  const [simulator, setSimulator] = useState({
    orderingCost: 14,
    holdingCost: 4.5,
    leadTime: 4,
    safetyStock: 120,
  })
  const [simulationApplied, setSimulationApplied] = useState(false)
  const forecastModel = executedForecast?.model ?? null
  const inventoryData = useMemo(
    () => buildInventoryPageData(dataset, dashboardModel, forecastModel),
    [dataset, dashboardModel, forecastModel]
  )

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setFilters({
        category: 'All Categories',
        supplier: 'All Suppliers',
        risk: 'All Risk Levels',
        range: 'Last 30 Days',
      })
      setSelectedRecommendationId('')
      onDecisionPanelOpenChange?.(false)
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [dataset?.sourceSignature, executedForecast?.generatedAt, onDecisionPanelOpenChange])

  const filteredInventoryData = useMemo(
    () => applyInventoryFilters(inventoryData, filters),
    [inventoryData, filters]
  )

  const selectedRecommendation =
    filteredInventoryData.recommendationRows.find((item) => item.id === selectedRecommendationId) ??
    filteredInventoryData.recommendationRows[0] ??
    null

  const simulatorResult = useMemo(
    () => buildSimulatorResult(simulator, filteredInventoryData),
    [simulator, filteredInventoryData]
  )

  const eoqAnalysis = useMemo(
    () => buildEoqAnalysis(simulator, selectedRecommendation, filteredInventoryData),
    [simulator, selectedRecommendation, filteredInventoryData]
  )

  if (!dataset || !dashboardModel) {
    return (
      <div className="inventory-page inventory-empty-page" ref={topRef}>
        <section className="inventory-empty-state">
          <div className="inventory-empty-icon">
            <DashboardGlyph type="box" />
          </div>
          <h2>Upload a dataset to unlock inventory intelligence</h2>
          <p>
            Inventory health, reorder recommendations, supplier analysis, and trend guidance will
            appear after you upload a CSV, JSON, or Excel file from Data Management.
          </p>
        </section>
      </div>
    )
  }

  function downloadTextFile(filename, content) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  async function downloadWorkbook(filename) {
    const XLSX = await import('xlsx')
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(filteredInventoryData.recommendationRows),
      'Decision Matrix'
    )
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(filteredInventoryData.demandRows),
      'Demand Forecast'
    )
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(filteredInventoryData.supplierRows),
      'Suppliers'
    )
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  function handleDownloadReport() {
    downloadTextFile('inventory-report.txt', filteredInventoryData.reportText)
  }

  async function handleDownloadMatrix() {
    await downloadWorkbook('inventory-decision-matrix.xlsx')
  }

  function handleDownloadRecommendation() {
    downloadTextFile('inventory-recommendation.txt', filteredInventoryData.recommendationText)
  }

  return (
    <div className="inventory-page" ref={topRef}>
      {decisionPanelOpen ? (
        <div className="inventory-decision-overlay" role="presentation" onClick={() => onDecisionPanelOpenChange?.(false)}>
          <section
            className="inventory-decision-popover"
            role="dialog"
            aria-modal="true"
            aria-labelledby="inventory-decision-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="inventory-decision-popover-head">
              <div>
                <h2 id="inventory-decision-title">AI Decision Recommendations</h2>
                <p>Priority actions from forecast demand and stock position.</p>
              </div>
              <button
                type="button"
                className="inventory-decision-close"
                aria-label="Close recommendations"
                onClick={() => onDecisionPanelOpenChange?.(false)}
              >
                &times;
              </button>
            </div>
            <ol>
              {forecastModel ? filteredInventoryData.decisionRecommendations.map((item) => (
                <li key={item}>{item}</li>
              )) : <li>Generate a forecast to receive reorder recommendations.</li>}
            </ol>
          </section>
        </div>
      ) : null}

      <section className="inventory-filter-bar" aria-label="Inventory filters">
        {inventoryData.filterOptions.map((filter) => (
          <label key={filter.key}>
            <span>{filter.label}</span>
            <select
              value={filters[filter.key]}
              onChange={(event) =>
                setFilters((current) => ({ ...current, [filter.key]: event.target.value }))
              }
            >
              {filter.options.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </label>
        ))}
      </section>

      <section className="inventory-summary-grid">
        {filteredInventoryData.summaryCards.map((card) => (
          <article className="inventory-summary-card" key={card.label}>
            <div className="inventory-summary-head">
              <span>{card.label}</span>
              <div className={`inventory-summary-icon ${card.tone}`}>
                <DashboardGlyph type={card.icon} />
              </div>
            </div>
            <strong>{card.value}</strong>
            <small>{card.note}</small>
          </article>
        ))}
      </section>

      <article className="inventory-card inventory-reorder-card">
            <div className="inventory-card-head">
              <div>
                <h2>AI Reorder Recommendations</h2>
                <p>Current stock, forecast, safety stock, and suggested order.</p>
              </div>
              <DashboardGlyph type="box" />
            </div>

            <div className="inventory-table">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Current</th>
                    <th>Forecast</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Days Left</th>
                    <th>Suggested Order</th>
                    <th>Est. Cost</th>
                    <th>Supplier</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filteredInventoryData.recommendationRows.map((row) => (
                    <tr key={row.id} className={row.statusTone}>
                      <td className="inventory-table-sku">{row.sku}</td>
                      <td>{formatOptionalCount(row.currentStock)}</td>
                      <td>{formatCount(row.forecastDemand)}</td>
                      <td>
                        <span className={`inventory-status-pill ${row.statusTone}`}>{row.currentStatus}</span>
                      </td>
                      <td>
                        <span className={`inventory-priority-pill ${row.priorityTone}`}>{row.priority}</span>
                      </td>
                      <td>{formatOptionalDays(row.daysUntilStockout)}</td>
                      <td className="inventory-table-order">{formatCount(row.suggestedOrder)}</td>
                      <td>{row.estimatedCost === null ? 'Unavailable' : formatCurrency(row.estimatedCost)}</td>
                      <td>{row.supplier || 'Unavailable'}</td>
                      <td>
                        <button
                          className="inventory-reason-button"
                          type="button"
                          onClick={() => {
                            setSelectedRecommendationId(row.id)
                            setExplanationRow(row)
                          }}
                        >
                          View AI Explanation
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!filteredInventoryData.recommendationRows.length ? (
                    <tr>
                      <td className="inventory-table-empty" colSpan="10">
                        No inventory records match the selected filters.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            {selectedRecommendation ? (
              <div className="inventory-explanation">
                <strong>Why this recommendation?</strong>
                <p>{selectedRecommendation.explanation}</p>
              </div>
            ) : null}
      </article>

      <section className="inventory-layout">
        <div className="inventory-main">

          <section className="inventory-visual-grid">
            <article className="inventory-card inventory-trend-card">
              <div className="inventory-card-head">
                <div>
                  <h2>Current Stock and Forecast Demand</h2>
                  <p>Stock movement with forecast, safety stock, and reorder thresholds.</p>
                </div>
                <IconTrend />
              </div>
              {filteredInventoryData.trendSeries.available ? (
                <InventoryTrendChart series={filteredInventoryData.trendSeries} />
              ) : (
                <InventoryUnavailable message="Add dated current-stock records to display the inventory trend." />
              )}
            </article>

            <article className="inventory-card inventory-health-card">
              <div className="inventory-card-head">
                <div>
                  <h2>Inventory Health</h2>
                  <p>Healthy, low stock, and overstock distribution.</p>
                </div>
                <DashboardGlyph type="health" />
              </div>
              {filteredInventoryData.healthBreakdown.available ? (
                <InventoryHealthDonut health={filteredInventoryData.healthBreakdown} />
              ) : (
                <InventoryUnavailable message="Generate a forecast and provide current stock to calculate inventory health." />
              )}
            </article>

          </section>

        </div>

        <aside className="inventory-side">
          <article className="inventory-card inventory-alert-card">
            <div className="inventory-card-head">
              <div>
                <h2>AI Alerts</h2>
                <p>Items that need attention before stock pressure becomes costly.</p>
              </div>
              <IconAlert />
            </div>
            <div className="inventory-alert-list">
              {filteredInventoryData.alerts.map((alert) => (
                <div className={`inventory-alert-row ${alert.tone}`} key={alert.title}>
                  <span>{alert.marker}</span>
                  <div>
                    <strong>{alert.title}</strong>
                    <p>{alert.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

        </aside>

        <section className="inventory-utility-grid">
          <article className="inventory-card inventory-demand-card">
            <div className="inventory-card-head">
              <div>
                <h2>Predicted Demand Next 7 Days</h2>
                <p>Connects inventory to the forecast module.</p>
              </div>
              <IconCalendar />
            </div>
            <div className="inventory-side-list inventory-demand-list">
              {filteredInventoryData.demandRows.map((row) => (
                <div className="inventory-demand-row" key={row.product}>
                  <div>
                    <strong>{row.product}</strong>
                    <small>{row.note}</small>
                  </div>
                  <span>{row.forecastLabel}</span>
                </div>
              ))}
              {!filteredInventoryData.demandRows.length ? (
                <div className="inventory-demand-row">
                  <div>
                    <strong>No matching demand rows</strong>
                    <small>Change the filters to view forecast demand.</small>
                  </div>
                  <span>0 units</span>
                </div>
              ) : null}
            </div>
          </article>

          <article className="inventory-card inventory-logistics-card">
            <div className="inventory-card-head">
              <div>
                <h2>Logistics Metrics</h2>
                <p>Support the reorder decision with operational metrics.</p>
              </div>
              <IconAlert />
            </div>
            <div className="inventory-metrics-list">
              {filteredInventoryData.logisticsMetrics.map((metric) => (
                <div className="inventory-metric-row" key={metric.label}>
                  <div>
                    <span>{metric.label}</span>
                    <small>{metric.note}</small>
                  </div>
                  <strong>{metric.value}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="inventory-card inventory-export-card">
            <div className="inventory-card-head">
              <div>
                <h2>Export Analysis</h2>
                <p>Download the inventory summary and decision outputs.</p>
              </div>
              <IconDownload />
            </div>
            <div className="inventory-export-list">
              <button type="button" onClick={handleDownloadReport}>
                <span>Download Report</span>
                <IconDownload />
              </button>
              <button type="button" onClick={handleDownloadMatrix}>
                <span>Download Excel Report</span>
                <IconDownload />
              </button>
              <button type="button" onClick={handleDownloadRecommendation}>
                <span>Download Recommendation</span>
                <IconDownload />
              </button>
            </div>
          </article>
        </section>

      </section>

      <section className="inventory-lower-grid">
        <section className="inventory-supplier-grid">
          <article className="inventory-card inventory-supplier-card">
            <div className="inventory-card-head">
              <div>
                <h2>Supplier Analysis</h2>
                <p>Delivery speed and reliability indicators for planning.</p>
              </div>
              <IconUsers />
            </div>
            <div className="inventory-supplier-list">
              {filteredInventoryData.supplierRows.map((supplier) => (
                <div className="inventory-supplier-row" key={supplier.label}>
                  <strong>{supplier.label}</strong>
                  <span>{supplier.deliveryLabel}</span>
                  <span>{supplier.deliveryRateLabel}</span>
                  <span>{supplier.reliabilityLabel}</span>
                  <b className={supplier.reliabilityTone}>{supplier.reliabilityLevel}</b>
                </div>
              ))}
              {!filteredInventoryData.supplierRows.length ? (
                <InventoryUnavailable message="Add supplier, lead-time, and reliability fields to compare suppliers." />
              ) : null}
            </div>
            <div className="inventory-supplier-recommendation">
              <strong>Supplier recommendation</strong>
              <p>{filteredInventoryData.supplierRecommendation}</p>
            </div>
          </article>
        </section>

      <details className="inventory-simulator inventory-simulator-section">
        <summary>
          <span>
            <strong>Profit Impact Simulator</strong>
            <small>Optional scenario planning. It does not change current stock or submit an order.</small>
          </span>
          <IconSparkSmall />
        </summary>
        <div className="inventory-simulator-content">
            <div className="inventory-simulator-controls">
              <label>
                <span>Ordering Cost</span>
                <strong>RM {simulator.orderingCost.toFixed(0)}</strong>
                <input
                  type="range"
                  min="5"
                  max="40"
                  value={simulator.orderingCost}
                  onChange={(event) =>
                    setSimulator((current) => ({ ...current, orderingCost: Number(event.target.value) }))
                  }
                />
              </label>
              <label>
                <span>Holding Cost</span>
                <strong>RM {simulator.holdingCost.toFixed(1)}</strong>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={simulator.holdingCost}
                  onChange={(event) =>
                    setSimulator((current) => ({ ...current, holdingCost: Number(event.target.value) }))
                  }
                />
              </label>
              <label>
                <span>Lead Time</span>
                <strong>{simulator.leadTime.toFixed(1)} days</strong>
                <input
                  type="range"
                  min="1"
                  max="12"
                  step="0.5"
                  value={simulator.leadTime}
                  onChange={(event) =>
                    setSimulator((current) => ({ ...current, leadTime: Number(event.target.value) }))
                  }
                />
              </label>
              <label>
                <span>Safety Stock</span>
                <strong>{formatCount(simulator.safetyStock)} units</strong>
                <input
                  type="range"
                  min="40"
                  max="260"
                  step="5"
                  value={simulator.safetyStock}
                  onChange={(event) =>
                    setSimulator((current) => ({ ...current, safetyStock: Number(event.target.value) }))
                  }
                />
              </label>
            </div>

            <div className="inventory-simulator-output">
              <div>
                <span>Current Profit</span>
                <strong>{simulatorResult.available ? formatCurrency(simulatorResult.currentProfit) : 'Unavailable'}</strong>
              </div>
              <div>
                <span>Estimated Profit</span>
                <strong>{simulatorResult.available ? formatCurrency(simulatorResult.estimatedProfit) : 'Unavailable'}</strong>
              </div>
              <div>
                <span>Estimated Savings</span>
                <strong>{simulatorResult.available ? formatCurrency(simulatorResult.estimatedSavings) : 'Unavailable'}</strong>
              </div>
              <div>
                <span>ROI</span>
                <strong>{simulatorResult.available ? `+${simulatorResult.roi}%` : 'Unavailable'}</strong>
              </div>
            </div>
            <article className="inventory-card inventory-eoq-card inventory-simulator-eoq">
              <div className="inventory-card-head">
                <div>
                  <h2>Order Quantity Cost Guide</h2>
                  <p>Economic Order Quantity (EOQ) estimates the order size that balances ordering and storage costs.</p>
                </div>
                <DashboardGlyph type="trend" />
              </div>
              {eoqAnalysis.available ? (
                <EoqCostCurve analysis={eoqAnalysis} />
              ) : (
                <InventoryUnavailable message="Generate a forecast before calculating the Economic Order Quantity (EOQ)." />
              )}
            </article>
            <button
              className="inventory-apply-button"
              type="button"
              disabled={!simulatorResult.available}
              onClick={() => setSimulationApplied(true)}
            >
              Apply Simulation
            </button>
            {simulationApplied ? (
              <p className="inventory-simulation-note">
                Simulation applied to this scenario. Review reorder priorities before purchasing.
              </p>
            ) : null}
        </div>
      </details>
      </section>

      {explanationRow ? (
        <div className="inventory-modal-backdrop" role="presentation" onClick={() => setExplanationRow(null)}>
          <section
            className="inventory-explanation-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="inventory-explanation-title"
            onClick={(event) => event.stopPropagation()}
          >
            <span>AI Explanation</span>
            <h2 id="inventory-explanation-title">{explanationRow.sku}</h2>
            <p>{explanationRow.explanation}</p>
            <div className="inventory-modal-metrics">
              <div>
                <span>Demand Gap</span>
                <strong>{explanationRow.demandGapLabel}</strong>
              </div>
              <div>
                <span>Days Left</span>
                <strong>{formatOptionalDays(explanationRow.daysUntilStockout)}</strong>
              </div>
              <div>
                <span>Budget</span>
                <strong>{explanationRow.estimatedCost === null ? 'Unavailable' : formatCurrency(explanationRow.estimatedCost)}</strong>
              </div>
              <div>
                <span>Recommended Supplier</span>
                <strong>{explanationRow.supplier || 'Unavailable'}</strong>
              </div>
            </div>
            <p className="inventory-supplier-reason">{explanationRow.supplierReason}</p>
            <button type="button" onClick={() => setExplanationRow(null)}>
              Close
            </button>
          </section>
        </div>
      ) : null}
    </div>
  )
}

function applyInventoryFilters(data, filters) {
  const recommendationRows = data.recommendationRows.filter((row) => {
    const categoryMatch = filters.category === 'All Categories' || row.category === filters.category
    const supplierMatch = filters.supplier === 'All Suppliers' || row.supplier === filters.supplier
    const riskMatch = filters.risk === 'All Risk Levels' || row.priority === filters.risk
    return categoryMatch && supplierMatch && riskMatch
  })
  const visibleProducts = new Set(recommendationRows.map((row) => row.product))
  const demandRows = data.demandRows.filter((row) => visibleProducts.has(row.product))
  const supplierRows = data.supplierRows.filter((supplier) =>
    filters.supplier === 'All Suppliers' ? true : supplier.label === filters.supplier
  )
  const lowStockItems = recommendationRows.filter((row) => row.currentStatus === 'Low Stock').length
  const overstockItems = recommendationRows.filter((row) => row.currentStatus === 'Overstock').length
  const healthyItems = recommendationRows.filter((row) => row.currentStatus === 'Healthy').length
  const predictedDemand = demandRows.reduce((sum, row) => sum + row.forecast, 0)
  const totalInventoryValue = recommendationRows.reduce((sum, row) => {
    if (row.currentStock === null || row.unitCost === null) return sum
    return sum + row.currentStock * row.unitCost
  }, 0)
  const expectedSavings = recommendationRows.reduce((sum, row) => {
    if (row.currentStatus !== 'Overstock' || row.unitCost === null || row.currentStock === null) return sum
    return sum + Math.max(0, row.currentStock - row.forecastDemand - row.safetyStock) * row.unitCost * 0.18
  }, 0)
  const totalProducts = recommendationRows.length
  const healthBreakdown = buildHealthBreakdown({ healthyItems, lowStockItems, overstockItems, totalProducts })
  const summaryCards = data.summaryCards.map((card) => {
    if (card.label === 'Total Inventory Value') {
      return { ...card, value: totalInventoryValue > 0 ? formatCurrency(totalInventoryValue) : card.value }
    }
    if (card.label === 'Total Products') {
      return { ...card, value: formatCount(recommendationRows.length), note: 'Products matching current filters' }
    }
    if (card.label === 'Low Stock Items') {
      return { ...card, value: formatCount(lowStockItems) }
    }
    if (card.label === 'Overstock Items') {
      return { ...card, value: formatCount(overstockItems) }
    }
    if (card.label === 'Predicted Demand') {
      return data.forecastModel
        ? { ...card, value: `${formatCount(predictedDemand)} units`, note: 'Next 7 days from the executed model' }
        : card
    }
    if (card.label === 'Expected Savings') {
      return data.forecastModel && expectedSavings > 0 ? { ...card, value: formatCurrency(expectedSavings) } : card
    }
    return card
  })
  const alerts = buildInventoryAlerts(recommendationRows, demandRows, supplierRows, data.forecastModel)
  const decisionRecommendations = buildDecisionRecommendations(recommendationRows, supplierRows, data.forecastModel)
  const logisticsMetrics = buildLogisticsMetrics({
    recommendationRows,
    supplierRows,
    demandRows,
  })
  const supplierRecommendation = buildSupplierRecommendation(supplierRows.length ? supplierRows : data.supplierRows)
  const reportText = buildInventoryReportText({
    summaryCards,
    demandRows,
    recommendationRows,
    supplierRows,
    logisticsMetrics,
    trendSeries: data.trendSeries,
  })
  const recommendationText = buildRecommendationText(recommendationRows)

  return {
    ...data,
    alerts,
    decisionRecommendations,
    demandRows,
    healthBreakdown,
    logisticsMetrics,
    recommendationRows,
    recommendationText,
    reportText,
    summaryCards,
    supplierRecommendation,
    supplierRows,
  }
}

function InventoryTrendChart({ series }) {
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const width = 800
  const height = 280
  const padding = { top: 18, right: 28, bottom: 38, left: 54 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  const values = [...series.actual, ...series.forecast, ...series.safety]
  const maxValue = Math.max(...values, 1) * 1.1
  const minValue = Math.max(0, Math.min(...values, 0))
  const totalPoints = series.labels.length

  const toPoint = (value, index) => {
    const x = padding.left + (chartWidth * index) / Math.max(totalPoints - 1, 1)
    const y =
      padding.top +
      chartHeight -
      ((value - minValue) / Math.max(maxValue - minValue, 1)) * chartHeight
    return { x, y }
  }

  const actualPoints = series.actual.map((value, index) => ({ ...toPoint(value, index), value }))
  const forecastStart = Math.max(series.forecastStartIndex ?? series.actual.length - 4, 1)
  const forecastPoints = series.forecast
    .slice(forecastStart - 1)
    .map((value, index) => ({ ...toPoint(value, index + forecastStart - 1), value }))
  const safetyPoints = series.safety.map((value, index) => ({ ...toPoint(value, index), value }))
  const reorderPoints = series.reorder.map((value, index) => ({ ...toPoint(value, index), value }))
  const criticalPoints = series.critical.map((value, index) => ({ ...toPoint(value, index), value }))
  const hoveredPoint = hoveredIndex !== null ? { ...actualPoints[hoveredIndex], forecast: series.forecast[hoveredIndex], safety: series.safety[hoveredIndex] } : null

  const buildPath = (points) =>
    points
      .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)},${point.y.toFixed(2)}`)
      .join(' ')

  const tickValues = Array.from({ length: 5 }, (_, index) => maxValue * (index / 4)).reverse()

  return (
    <div className="inventory-chart-shell">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="inventory-chart-svg"
        role="img"
        aria-label="Inventory trend chart"
        onMouseMove={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect()
          if (!bounds.width || !bounds.height) {
            return
          }

          const offsetX = event.clientX - bounds.left
          const relativeX = (offsetX / bounds.width) * width
          const nextIndex = clamp(
            Math.round(((relativeX - padding.left) / Math.max(chartWidth, 1)) * Math.max(totalPoints - 1, 1)),
            0,
            actualPoints.length - 1
          )

          if (Number.isFinite(nextIndex) && nextIndex !== hoveredIndex) {
            setHoveredIndex(nextIndex)
          }
        }}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {tickValues.map((tickValue) => {
          const y = padding.top + chartHeight - ((tickValue - minValue) / Math.max(maxValue - minValue, 1)) * chartHeight
          return (
            <g key={tickValue.toFixed(2)}>
              <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} className="inventory-chart-grid" />
              <text x={padding.left - 10} y={y + 4} className="inventory-chart-y-label">
                {formatCount(Math.round(tickValue))}
              </text>
            </g>
          )
        })}

        <path
          d={`M${padding.left},${height - padding.bottom} L${width - padding.right},${height - padding.bottom} L${width - padding.right},${criticalPoints[0]?.y ?? height - padding.bottom} L${padding.left},${criticalPoints[0]?.y ?? height - padding.bottom} Z`}
          className="inventory-chart-critical-zone"
        />

        <path d={buildPath(actualPoints)} className="inventory-chart-actual" fill="none" />
        <path d={buildPath(forecastPoints)} className="inventory-chart-forecast" fill="none" strokeDasharray="7 6" />
        <path d={buildPath(safetyPoints)} className="inventory-chart-safety" fill="none" strokeDasharray="6 6" />
        <path d={buildPath(reorderPoints)} className="inventory-chart-reorder" fill="none" strokeDasharray="8 6" />

        {actualPoints.map((point, index) => (
          <circle
            key={`${series.labels[index]}-actual`}
            cx={point.x}
            cy={point.y}
            r={index === hoveredIndex ? 5.2 : 4.2}
            className={`inventory-chart-point${index >= forecastStart ? ' forecast' : ''}`}
            onMouseEnter={() => setHoveredIndex(index)}
          />
        ))}

        {series.labels.map((label, index) => (
          <text
            key={`${label}-axis`}
            x={actualPoints[index]?.x ?? 0}
            y={height - 12}
            className="inventory-chart-x-label"
            textAnchor={index === 0 ? 'start' : index === series.labels.length - 1 ? 'end' : 'middle'}
          >
            {label}
          </text>
        ))}
      </svg>

      {hoveredPoint ? (
        <div
          className="inventory-chart-tooltip"
          style={{
            left: `${(hoveredPoint.x / width) * 100}%`,
            top: `${(hoveredPoint.y / height) * 100}%`,
          }}
        >
          <strong>{series.labels[hoveredIndex]}</strong>
          <span>Actual inventory</span>
          <b>{formatCount(hoveredPoint.value)}</b>
          <small>Forecast {formatCount(hoveredPoint.forecast)}</small>
          <small>Safety {formatCount(hoveredPoint.safety)}</small>
        </div>
      ) : null}

      <div className="inventory-chart-legend">
        <div>
          <span className="actual" />
          <strong>Actual inventory</strong>
        </div>
        <div>
          <span className="forecast" />
          <strong>Forecast inventory</strong>
        </div>
        <div>
          <span className="safety" />
          <strong>Safety threshold</strong>
        </div>
        <div>
          <span className="reorder" />
          <strong>Reorder point</strong>
        </div>
        <div>
          <span className="critical" />
          <strong>Critical zone</strong>
        </div>
      </div>
    </div>
  )
}

function InventoryHealthDonut({ health }) {
  const healthy = clamp(Number(health.healthyPercent ?? 0), 0, 100)
  const low = clamp(Number(health.lowPercent ?? 0), 0, 100)
  const overstock = clamp(Number(health.overPercent ?? 0), 0, 100)

  return (
    <div className="inventory-health-body">
      <div
        className="inventory-health-donut"
        style={{
          background: `conic-gradient(#006c49 0 ${healthy}%, #7c0020 ${healthy}% ${healthy + low}%, #0b28a6 ${healthy + low}% ${healthy + low + overstock}%, #edf1fb ${healthy + low + overstock}% 100%)`,
        }}
      >
        <div>
          <strong>{healthy}%</strong>
          <span>Healthy</span>
        </div>
      </div>
      <div className="inventory-health-legend">
        <div>
          <span className="healthy" />
          <strong>Healthy</strong>
          <small>{healthy}%</small>
        </div>
        <div>
          <span className="low" />
          <strong>Low Stock</strong>
          <small>{low}%</small>
        </div>
        <div>
          <span className="overstock" />
          <strong>Overstock</strong>
          <small>{overstock}%</small>
        </div>
      </div>
    </div>
  )
}

function InventoryUnavailable({ message }) {
  return (
    <div className="inventory-unavailable-state">
      <IconAlert />
      <p>{message}</p>
    </div>
  )
}

function EoqCostCurve({ analysis }) {
  const width = 820
  const height = 290
  const padding = { top: 18, right: 22, bottom: 44, left: 64 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  const allCosts = analysis.points.flatMap((point) => [
    point.orderingCost,
    point.holdingCost,
    point.totalCost,
  ])
  const maxCost = Math.max(...allCosts, 1) * 1.08
  const minQuantity = Math.min(...analysis.points.map((point) => point.quantity))
  const maxQuantity = Math.max(...analysis.points.map((point) => point.quantity))

  const toPoint = (quantity, cost) => {
    const x =
      padding.left +
      ((quantity - minQuantity) / Math.max(maxQuantity - minQuantity, 1)) * chartWidth
    const y = padding.top + chartHeight - (cost / Math.max(maxCost, 1)) * chartHeight
    return { x, y }
  }

  const buildPath = (key) =>
    analysis.points
      .map((point, index) => {
        const chartPoint = toPoint(point.quantity, point[key])
        return `${index === 0 ? 'M' : 'L'}${chartPoint.x.toFixed(2)},${chartPoint.y.toFixed(2)}`
      })
      .join(' ')

  const eoqPoint = toPoint(analysis.eoq, analysis.minimumTotalCost)
  const ticks = Array.from({ length: 5 }, (_, index) => maxCost * (index / 4)).reverse()

  return (
    <div className="inventory-eoq-body">
      <div className="inventory-eoq-stats">
        <div>
          <span>Optimal EOQ</span>
          <strong>{formatCount(analysis.eoq)} units</strong>
        </div>
        <div>
          <span>Forecast Demand</span>
          <strong>{formatCount(analysis.annualDemand)} units/year</strong>
        </div>
        <div>
          <span>Minimum Total Cost</span>
          <strong>{formatCurrency(analysis.minimumTotalCost)}</strong>
        </div>
      </div>

      <div className="inventory-eoq-chart-shell">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="inventory-eoq-chart"
          role="img"
          aria-label="EOQ cost curve chart"
        >
          {ticks.map((tickValue) => {
            const y = padding.top + chartHeight - (tickValue / Math.max(maxCost, 1)) * chartHeight
            return (
              <g key={tickValue.toFixed(2)}>
                <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} className="inventory-chart-grid" />
                <text x={padding.left - 10} y={y + 4} className="inventory-chart-y-label">
                  {formatCompactCurrency(tickValue)}
                </text>
              </g>
            )
          })}

          <path d={buildPath('orderingCost')} className="inventory-eoq-ordering" fill="none" />
          <path d={buildPath('holdingCost')} className="inventory-eoq-holding" fill="none" />
          <path d={buildPath('totalCost')} className="inventory-eoq-total" fill="none" />

          <line
            x1={eoqPoint.x}
            x2={eoqPoint.x}
            y1={padding.top}
            y2={height - padding.bottom}
            className="inventory-eoq-marker-line"
          />
          <circle cx={eoqPoint.x} cy={eoqPoint.y} r="6" className="inventory-eoq-marker" />
          <text x={eoqPoint.x + 10} y={eoqPoint.y - 12} className="inventory-eoq-label">
            EOQ {formatCount(analysis.eoq)}
          </text>

          {[minQuantity, analysis.eoq, maxQuantity].map((quantity) => {
            const point = toPoint(quantity, 0)
            return (
              <text key={quantity} x={point.x} y={height - 14} className="inventory-chart-x-label">
                {formatCount(quantity)}
              </text>
            )
          })}
        </svg>
      </div>

      <div className="inventory-eoq-legend">
        <div>
          <span className="ordering" />
          <strong>Ordering cost</strong>
        </div>
        <div>
          <span className="holding" />
          <strong>Holding cost</strong>
        </div>
        <div>
          <span className="total" />
          <strong>Total cost</strong>
        </div>
      </div>
      <p className="inventory-eoq-note">
        Based on {analysis.productLabel}: EOQ balances ordering cost against holding cost using
        forecast demand from the executed model.
      </p>
    </div>
  )
}

function buildInventoryPageData(dataset, dashboardModel, forecastModel) {
  const rows = Array.isArray(dataset?.rows) ? dataset.rows : []
  const columns = Array.isArray(dataset?.columns) ? dataset.columns : []
  const productColumn = findColumn(columns, ['product', 'item', 'sku', 'name'])
  const stockColumn = findColumn(columns, ['current stock', 'stock on hand', 'inventory level', 'stock'])
  const priceColumn = findColumn(columns, ['unit cost', 'cost price', 'unit price', 'price'])
  const categoryColumn = findColumn(columns, ['category', 'department', 'segment', 'type'])
  const dateColumn = findColumn(columns, ['date', 'time', 'timestamp'])
  const supplierColumn = findColumn(columns, ['supplier', 'vendor', 'shipper', 'partner'])
  const leadTimeColumn = findColumn(columns, ['supplier lead time', 'lead time', 'delivery days'])
  const reliabilityColumn = findColumn(columns, ['supplier reliability', 'reliability', 'delivery rate'])

  const forecastProductRows = Array.isArray(forecastModel?.productsByUnits)
    ? forecastModel.productsByUnits
    : []
  const forecastProductRevenueRows = Array.isArray(forecastModel?.productsByRevenue)
    ? forecastModel.productsByRevenue
    : []
  const topProductRows = forecastProductRows.length
    ? forecastProductRows
    : Array.isArray(dashboardModel?.topProducts?.units?.items)
    ? dashboardModel.topProducts.units.items
    : []
  const topProductRevenueRows = forecastProductRevenueRows.length
    ? forecastProductRevenueRows
    : Array.isArray(dashboardModel?.topProducts?.revenue?.items)
    ? dashboardModel.topProducts.revenue.items
    : []

  const productLabels = productColumn
    ? uniqueLabels(rows.map((row) => normalizeLabel(row[productColumn])))
    : topProductRows.map((item) => item.label)
  const productMeta = buildProductMetadata(rows, productColumn, categoryColumn, supplierColumn)
  const inventoryProductRows = mergeInventoryProductRows(
    topProductRows.length ? topProductRows : topProductRevenueRows,
    rows,
    productLabels,
    productColumn,
    stockColumn,
    priceColumn
  )
  const totalProducts = Math.max(productLabels.length, topProductRows.length)
  const stockSummary = buildStockSummary(rows, productColumn, stockColumn)
  const totalInventoryValue = calculateInventoryValue(rows, productColumn, stockColumn, priceColumn)
  const demandRows = buildDemandRows(inventoryProductRows, forecastModel)
  const predictedDemand = demandRows.reduce((sum, row) => sum + row.forecast, 0)
  const supplierRows = buildSupplierRows(rows, supplierColumn, leadTimeColumn, reliabilityColumn)
  const recommendationRows = buildRecommendationRows(
    demandRows,
    productLabels,
    forecastModel,
    productMeta,
    supplierRows
  )
  const lowStockItems = recommendationRows.filter((row) => row.currentStatus === 'Low Stock').length
  const overstockItems = recommendationRows.filter((row) => row.currentStatus === 'Overstock').length
  const healthyItems = recommendationRows.filter((row) => row.currentStatus === 'Healthy').length
  const estimatedCostSavings = recommendationRows.reduce((sum, row) => {
    if (row.currentStatus !== 'Overstock' || row.unitCost === null || row.currentStock === null) {
      return sum
    }
    const surplus = Math.max(0, row.currentStock - row.forecastDemand - row.safetyStock)
    return sum + surplus * row.unitCost * 0.18
  }, 0)

  const summaryCards = [
    {
      label: 'Total Inventory Value',
      value: totalInventoryValue === null ? 'Unavailable' : formatCurrency(totalInventoryValue),
      note: totalInventoryValue === null ? 'Add current stock and unit cost fields' : 'Current stock value from the selected dataset',
      icon: 'money',
      tone: 'primary',
    },
    {
      label: 'Total Products',
      value: totalProducts ? formatCount(totalProducts) : 'Unavailable',
      note: 'Unique SKUs or tracked line items',
      icon: 'box',
      tone: 'primary',
    },
    {
      label: 'Low Stock Items',
      value: formatCount(lowStockItems),
      note: 'Needs reorder attention first',
      icon: 'warning',
      tone: 'rose',
    },
    {
      label: 'Overstock Items',
      value: formatCount(overstockItems),
      note: 'Cash tied in extra stock',
      icon: 'trend',
      tone: 'indigo',
    },
    {
      label: 'Predicted Demand',
      value: forecastModel ? `${formatCount(predictedDemand)} units` : 'Run forecast',
      note: forecastModel ? 'Next 7 days from the executed model' : 'No executed forecasting result',
      icon: 'target',
      tone: 'emerald',
    },
    {
      label: 'Expected Savings',
      value: forecastModel && stockColumn && priceColumn ? formatCurrency(estimatedCostSavings) : 'Unavailable',
      note: forecastModel && stockColumn && priceColumn ? 'Estimated carrying-cost reduction from excess stock' : 'Requires forecast, current stock, and unit cost',
      icon: 'spark',
      tone: 'amber',
    },
  ]

  const logisticsMetrics = buildLogisticsMetrics({
    recommendationRows,
    supplierRows,
    demandRows,
  })
  const trendSeries = buildInventoryTrendSeries(dataset, dashboardModel, stockSummary, dateColumn, stockColumn)
  const healthBreakdown = buildHealthBreakdown({ healthyItems, lowStockItems, overstockItems, totalProducts: recommendationRows.length })
  const supplierRecommendation = buildSupplierRecommendation(supplierRows)
  const alerts = buildInventoryAlerts(recommendationRows, demandRows, supplierRows, forecastModel)
  const decisionRecommendations = buildDecisionRecommendations(recommendationRows, supplierRows, forecastModel)
  const filterOptions = buildInventoryFilterOptions(rows, categoryColumn, supplierColumn, recommendationRows, supplierRows)
  const reportText = buildInventoryReportText({
    summaryCards,
    demandRows,
    recommendationRows,
    supplierRows,
    logisticsMetrics,
    trendSeries,
  })
  const recommendationText = buildRecommendationText(recommendationRows)

  return {
    summaryCards,
    demandRows,
    recommendationRows,
    supplierRows,
    logisticsMetrics,
    trendSeries,
    healthBreakdown,
    supplierRecommendation,
    alerts,
    decisionRecommendations,
    forecastModel,
    filterOptions,
    reportText,
    recommendationText,
  }
}

function buildStockSummary(rows, productColumn, stockColumn) {
  if (rows.length && productColumn && stockColumn) {
    const groups = new Map()

    rows.forEach((row) => {
      const label = normalizeLabel(row[productColumn])
      if (!label) {
        return
      }

      const value = parseNumericValue(row[stockColumn])
      const current = groups.get(label) ?? { label, stock: 0 }
      if (Number.isFinite(value)) current.stock = value
      groups.set(label, current)
    })

    const inventoryRows = Array.from(groups.values())
    const healthyCount = inventoryRows.filter((entry) => entry.stock > 120 && entry.stock < 620).length
    const lowCount = inventoryRows.filter((entry) => entry.stock <= 120).length
    const overCount = inventoryRows.filter((entry) => entry.stock >= 620).length

    return { healthyCount, lowCount, overCount }
  }

  return { healthyCount: 0, lowCount: 0, overCount: 0, available: false }
}

function buildProductMetadata(rows, productColumn, categoryColumn, supplierColumn) {
  const metadata = new Map()

  rows.forEach((row) => {
    const label = productColumn ? normalizeLabel(row[productColumn]) : ''
    if (!label) {
      return
    }

    if (metadata.has(label)) {
      return
    }

    metadata.set(label, {
      category: categoryColumn ? normalizeLabel(row[categoryColumn]) || 'Unassigned' : 'Unassigned',
      supplier: supplierColumn ? normalizeLabel(row[supplierColumn]) : '',
    })
  })

  return metadata
}

function mergeInventoryProductRows(sourceProducts, rows, productLabels, productColumn, stockColumn, priceColumn) {
  const productMap = new Map()

  sourceProducts.forEach((product) => {
    const label = normalizeLabel(product.label)
    if (label) {
      productMap.set(label, { ...product, label })
    }
  })

  const rowTotals = new Map()

  if (rows.length && productColumn) {
    rows.forEach((row) => {
      const label = normalizeLabel(row[productColumn])
      if (!label) {
        return
      }

      const stock = stockColumn ? parseNumericValue(row[stockColumn]) : null
      const unitCost = priceColumn ? parseNumericValue(row[priceColumn]) : null
      const current = rowTotals.get(label) ?? { label, stock: 0, costTotal: 0, costCount: 0, count: 0 }
      if (stock !== null && Number.isFinite(stock)) current.stock = stock
      if (unitCost !== null && Number.isFinite(unitCost) && unitCost > 0) {
        current.costTotal += unitCost
        current.costCount += 1
      }
      current.count += 1
      rowTotals.set(label, current)
    })
  }

  productLabels.forEach((label) => {
    const cleanLabel = normalizeLabel(label)
    if (!cleanLabel || productMap.has(cleanLabel)) {
      return
    }

    const totals = rowTotals.get(cleanLabel) ?? { stock: 0, costTotal: 0, costCount: 0, count: 0 }
    productMap.set(cleanLabel, {
      label: cleanLabel,
      units: 0,
      metricValue: 0,
      currentStock: stockColumn ? Math.max(0, Math.round(totals.stock)) : null,
      unitCost: totals.costCount ? totals.costTotal / totals.costCount : null,
      badge: 'Dataset product',
    })
  })

  productMap.forEach((product, label) => {
    const totals = rowTotals.get(label)
    product.currentStock = stockColumn && totals ? Math.max(0, Math.round(totals.stock)) : null
    product.unitCost = totals?.costCount ? totals.costTotal / totals.costCount : null
  })

  return Array.from(productMap.values())
}

function buildDemandRows(products, forecastModel) {
  if (!forecastModel || !products.length) {
    return []
  }

  const source = products
  const forecastTotal7 = Number(forecastModel?.summary?.next7_units ?? 0)
  const totalUnits = source.reduce((sum, item) => sum + Number(item.units ?? item.metricValue ?? item.forecast ?? 0), 0)

  return source.map((item) => {
    const latestUnits = Array.isArray(item.monthlySeries) && item.monthlySeries.length
      ? Number(item.monthlySeries[item.monthlySeries.length - 1]?.units ?? item.metricValue ?? 0)
      : Number(item.metricValue ?? item.forecast ?? 0)
    const productUnits = Number(item.units ?? latestUnits)
    const forecastShare = forecastTotal7 > 0 && totalUnits > 0
      ? productUnits / totalUnits
      : 0
    const forecast = forecastShare > 0
      ? Math.max(1, Math.round(forecastTotal7 * forecastShare))
      : 0
    return {
      product: item.label,
      forecast,
      forecastLabel: `${formatCount(forecast)} units`,
      note: forecastModel
        ? `From ${forecastModel.modelInfo?.method ?? 'forecast model'}`
        : 'Forecast unavailable',
      trendLabel: `${Math.round((forecast / Math.max(latestUnits || forecast, 1) - 1) * 100)}%`,
      currentStock: item.currentStock ?? null,
      unitCost: item.unitCost ?? null,
    }
  })
}

function buildRecommendationRows(demandRows, productLabels, forecastModel, productMeta, supplierRows) {
  const modelStockRisks = Array.isArray(forecastModel?.stockRisks) ? forecastModel.stockRisks : []
  return demandRows.map((item, index) => {
    const modelRisk = modelStockRisks.find((risk) => normalizeLabel(risk.label) === normalizeLabel(item.product))
    const currentStock = Number.isFinite(item.currentStock) ? item.currentStock : null
    const unitCost = Number.isFinite(item.unitCost) && item.unitCost > 0 ? item.unitCost : null
    const safetyStock = Math.max(1, Math.round(item.forecast * 0.18))
    const suggestedOrder = currentStock === null ? 0 : Math.max(0, item.forecast + safetyStock - currentStock)
    const demandGap = currentStock === null ? null : item.forecast + safetyStock - currentStock
    const demandGapPercent = currentStock === null ? null : Math.round((demandGap / Math.max(currentStock, 1)) * 100)
    const dailyDemand = Math.max(1, Math.round(item.forecast / 7))
    const daysUntilStockout = currentStock === null ? null : Math.max(0, Math.round(currentStock / dailyDemand))
    const currentStatus = currentStock === null
      ? 'Data Needed'
      : currentStock < item.forecast + safetyStock
        ? 'Low Stock'
        : currentStock > (item.forecast + safetyStock) * 1.5
          ? 'Overstock'
          : 'Healthy'
    const priority = modelRisk?.level === 'High' || (daysUntilStockout !== null && daysUntilStockout <= 5) || currentStatus === 'Low Stock'
      ? 'High'
      : modelRisk?.level === 'Medium' || currentStatus === 'Data Needed' || (daysUntilStockout !== null && daysUntilStockout <= 10)
        ? 'Medium'
        : 'Low'
    const priorityTone = priority === 'High' ? 'high' : priority === 'Medium' ? 'medium' : 'low'
    const estimatedCost = unitCost === null || currentStock === null ? null : Math.max(0, suggestedOrder * unitCost)
    const statusTone = currentStatus === 'Low Stock' ? 'critical' : currentStatus === 'Overstock' ? 'overstock' : currentStatus === 'Healthy' ? 'positive' : 'neutral'
    const linkedSupplier = productMeta.get(item.product)?.supplier ?? ''
    const recommendedSupplier = linkedSupplier || supplierRows[0]?.label || ''
    const supplierData = supplierRows.find((supplier) => supplier.label === recommendedSupplier)
    const supplierReason = recommendedSupplier
      ? supplierData?.deliveryDays !== null
        ? `${recommendedSupplier} is linked to this product and has a recorded lead time of ${supplierData.deliveryLabel}.`
        : `${recommendedSupplier} is linked to this product. Add lead-time and reliability fields to compare suppliers.`
      : 'No supplier is available in the selected dataset.'
    const explanation = currentStock === null
      ? `The ${formatCount(item.forecast)}-unit forecast is available, but current stock is missing. Add a Current Stock field before AIRE calculates days until stockout, reorder quantity, and cost.`
      : currentStatus === 'Low Stock'
        ? `Current stock is below forecast demand plus a ${formatCount(safetyStock)}-unit safety buffer. AIRE recommends ordering ${formatCount(suggestedOrder)} units.`
        : currentStatus === 'Overstock'
          ? `Current stock is more than 150% of forecast demand plus safety stock. Pause or reduce the next order.`
          : `Current stock covers forecast demand and the safety buffer. Continue monitoring before placing another order.`

    return {
      id: `${item.product}-${index}`,
      sku: productLabels[index] ?? item.product,
      product: item.product,
      category: productMeta.get(item.product)?.category ?? 'Unassigned',
      supplier: recommendedSupplier,
      supplierReason,
      currentStock,
      unitCost,
      forecastDemand: item.forecast,
      currentStatus,
      priority,
      priorityTone,
      daysUntilStockout,
      safetyStock,
      suggestedOrder,
      estimatedCost,
      demandGapLabel: demandGapPercent === null ? 'Unavailable' : `${Math.max(0, demandGapPercent)}%`,
      statusTone,
      explanation,
    }
  })
}

function buildSupplierRows(rows, supplierColumn, leadTimeColumn, reliabilityColumn) {
  if (!rows.length || !supplierColumn) {
    return []
  }

  const groups = new Map()
  rows.forEach((row) => {
    const label = normalizeLabel(row[supplierColumn])
    if (!label) {
      return
    }
    const current = groups.get(label) ?? { label, leadTimes: [], reliabilityValues: [] }
    const leadTime = leadTimeColumn ? parseNumericValue(row[leadTimeColumn]) : null
    const reliability = reliabilityColumn ? parseNumericValue(row[reliabilityColumn]) : null
    if (Number.isFinite(leadTime) && leadTime > 0) current.leadTimes.push(leadTime)
    if (Number.isFinite(reliability) && reliability > 0) current.reliabilityValues.push(reliability)
    groups.set(label, current)
  })

  return Array.from(groups.values())
    .map((supplier) => ({
      label: supplier.label,
      deliveryDays: supplier.leadTimes.length ? average(supplier.leadTimes) : null,
      reliability: supplier.reliabilityValues.length ? average(supplier.reliabilityValues) : null,
    }))
    .map(formatSupplierRow)
}

function formatSupplierRow(supplier) {
  const reliabilityLevel = supplier.reliability === null ? 'Not rated' : supplier.reliability >= 90 ? 'High' : supplier.reliability >= 80 ? 'Medium' : 'Low'
  const reliabilityTone = reliabilityLevel === 'High' ? 'high' : reliabilityLevel === 'Medium' ? 'medium' : 'low'

  return {
    label: supplier.label,
    deliveryDays: supplier.deliveryDays,
    reliability: supplier.reliability,
    deliveryLabel: supplier.deliveryDays === null ? 'Lead time unavailable' : `${Number(supplier.deliveryDays).toFixed(1)} days`,
    deliveryRateLabel: 'From selected dataset',
    reliabilityLabel: supplier.reliability === null ? 'Reliability unavailable' : `${Number(supplier.reliability).toFixed(0)}% reliability`,
    reliabilityLevel,
    reliabilityTone,
  }
}

function buildLogisticsMetrics({ recommendationRows, supplierRows, demandRows }) {
  const topForecast = demandRows.reduce((sum, row) => sum + row.forecast, 0)
  const safetyStock = recommendationRows.reduce((sum, row) => sum + row.safetyStock, 0)
  const reorderPoint = topForecast + safetyStock
  const leadTimes = supplierRows.map((supplier) => supplier.deliveryDays).filter(Number.isFinite)
  const reorderCost = recommendationRows.reduce((sum, row) => sum + (row.estimatedCost ?? 0), 0)

  return [
    {
      label: 'Reorder Point',
      value: topForecast ? `${formatCount(reorderPoint)} units` : 'Unavailable',
      note: 'When inventory should trigger a reorder',
    },
    {
      label: 'Safety Stock',
      value: topForecast ? `${formatCount(safetyStock)} units` : 'Unavailable',
      note: 'Buffer against forecast variability',
    },
    {
      label: 'Supplier Lead Time',
      value: leadTimes.length ? `${average(leadTimes).toFixed(1)} days` : 'Unavailable',
      note: 'Average recorded delivery time',
    },
    {
      label: 'Estimated Reorder Cost',
      value: reorderCost > 0 ? formatCurrency(reorderCost) : 'Unavailable',
      note: 'Suggested order quantity multiplied by unit cost',
    },
  ]
}

function buildInventoryTrendSeries(dataset, dashboardModel, stockSummary, dateColumn, stockColumn) {
  const rows = Array.isArray(dataset?.rows) ? dataset.rows : []

  if (rows.length && dateColumn) {
    const groups = new Map()
    rows.forEach((row) => {
      const date = parseDatasetDate(row[dateColumn])
      if (!date) {
        return
      }

      const key = formatMonthKey(date)
      const current = groups.get(key) ?? {
        date: new Date(date.getFullYear(), date.getMonth(), 1),
        label: formatMonthLabel(date),
        value: 0,
      }
      const value = stockColumn ? parseNumericValue(row[stockColumn]) : 1
      current.value += value > 0 ? value : 1
      groups.set(key, current)
    })

    const ordered = Array.from(groups.values()).sort((left, right) => left.date - right.date)
    if (ordered.length >= 4) {
      const recent = ordered.slice(-8)
      const actual = recent.map((entry) => Math.round(entry.value))
      const actualAverage = average(actual)
      const trendPercent = calculateTrend(actual)
      const forecastStartIndex = Math.max(actual.length - 4, 2)
      const forecast = actual.map((value, index) => {
        if (index < forecastStartIndex) {
          return Math.round(value)
        }

        const baseline = average(actual.slice(Math.max(0, index - 2), index + 1)) || value
        return Math.max(0, Math.round(baseline * (1 + trendPercent * 0.25)))
      })
      const safety = actual.map(() => Math.max(0, Math.round(actualAverage * 0.82)))
      const reorder = actual.map(() => Math.max(0, Math.round(actualAverage * 0.68)))
      const critical = actual.map(() => Math.max(0, Math.round(actualAverage * 0.42)))

      return {
        available: true,
        labels: recent.map((entry) => entry.label),
        actual,
        forecast,
        safety,
        reorder,
        critical,
        forecastStartIndex,
      }
    }
  }

  return {
    available: false,
    labels: [],
    actual: [],
    forecast: [],
    safety: [],
    reorder: [],
    critical: [],
    forecastStartIndex: 0,
  }
}

function buildSimulatorResult(simulator, inventoryData) {
  const inventoryValue = parseCurrencyValue(inventoryData.summaryCards[0]?.value)
  if (!inventoryValue || !inventoryData.forecastModel) {
    return { available: false, currentProfit: 0, estimatedProfit: 0, estimatedSavings: 0, roi: 0 }
  }

  const baselineSavings = parseCurrencyValue(inventoryData.summaryCards[5]?.value)
  const currentProfit = Math.round(inventoryValue * 0.28)
  const inputPressure =
    simulator.safetyStock * 28 +
    simulator.leadTime * 320 -
    simulator.orderingCost * 58 -
    simulator.holdingCost * 120

  const estimatedSavings = Math.max(0, Math.round(baselineSavings + inputPressure))
  const estimatedProfit = currentProfit + estimatedSavings
  const roi = clamp(Math.round((estimatedSavings / Math.max(currentProfit, 1)) * 100), 1, 80)

  return {
    available: true,
    currentProfit,
    estimatedProfit,
    estimatedSavings,
    roi,
  }
}

function buildEoqAnalysis(simulator, selectedRecommendation, inventoryData) {
  const leadRow =
    selectedRecommendation ??
    inventoryData.recommendationRows?.[0] ??
    inventoryData.demandRows?.[0] ??
    null
  const monthlyDemand =
    Number(leadRow?.forecastDemand ?? leadRow?.forecast ?? 0) ||
    Number(inventoryData.summaryCards?.[4]?.value?.replace(/[^0-9.-]/g, '') ?? 0)
  if (!monthlyDemand || !inventoryData.forecastModel) {
    return { available: false, points: [] }
  }
  const annualDemand = Math.max(1, Math.round(monthlyDemand * 12))
  const orderingCost = Math.max(1, Number(simulator.orderingCost) || 1)
  const holdingCost = Math.max(0.1, Number(simulator.holdingCost) || 0.1)
  const eoq = Math.max(1, Math.round(Math.sqrt((2 * annualDemand * orderingCost) / holdingCost)))
  const minQuantity = Math.max(1, Math.round(eoq * 0.25))
  const maxQuantity = Math.max(minQuantity + 10, Math.round(eoq * 2.2))
  const pointCount = 26
  const points = Array.from({ length: pointCount }, (_, index) => {
    const quantity = Math.max(
      1,
      Math.round(minQuantity + ((maxQuantity - minQuantity) * index) / Math.max(pointCount - 1, 1))
    )
    const orderingCostValue = (annualDemand / quantity) * orderingCost
    const holdingCostValue = (quantity / 2) * holdingCost
    return {
      quantity,
      orderingCost: orderingCostValue,
      holdingCost: holdingCostValue,
      totalCost: orderingCostValue + holdingCostValue,
    }
  })
  const minimumTotalCost = (annualDemand / eoq) * orderingCost + (eoq / 2) * holdingCost

  return {
    available: true,
    annualDemand,
    eoq,
    holdingCost,
    minimumTotalCost,
    orderingCost,
    points,
    productLabel: leadRow?.sku ?? leadRow?.product ?? 'selected product',
  }
}

function calculateInventoryValue(rows, productColumn, stockColumn, priceColumn) {
  if (rows.length && productColumn && stockColumn && priceColumn) {
    const latestByProduct = new Map()
    rows.forEach((row) => {
      const product = normalizeLabel(row[productColumn])
      if (!product) return
      latestByProduct.set(product, {
        stock: Math.max(0, parseNumericValue(row[stockColumn])),
        price: Math.max(0, parseNumericValue(row[priceColumn])),
      })
    })
    const value = Array.from(latestByProduct.values()).reduce(
      (sum, item) => sum + item.stock * item.price,
      0
    )

    if (value > 0) {
      return value
    }
  }

  return null
}

function buildHealthBreakdown({ healthyItems, lowStockItems, overstockItems, totalProducts }) {
  if (!totalProducts) {
    return { available: false, healthyPercent: 0, lowPercent: 0, overPercent: 0 }
  }

  const safeTotal = Math.max(healthyItems + lowStockItems + overstockItems, totalProducts, 1)
  const lowPercent = clamp(Math.round((lowStockItems / safeTotal) * 100), 0, 100)
  const overPercent = clamp(Math.round((overstockItems / safeTotal) * 100), 0, 100)
  const healthyPercent = clamp(100 - lowPercent - overPercent, 0, 100)

  return {
    available: true,
    healthyPercent,
    lowPercent,
    overPercent,
  }
}

function buildSupplierRecommendation(supplierRows) {
  const bestSupplier = [...supplierRows].sort((left, right) => {
    const rightScore = (right.reliability ?? 0) * 2 - (right.deliveryDays ?? 999) * 4
    const leftScore = (left.reliability ?? 0) * 2 - (left.deliveryDays ?? 999) * 4
    return rightScore - leftScore
  })[0]

  return bestSupplier
    ? bestSupplier.deliveryDays !== null || bestSupplier.reliability !== null
      ? `${bestSupplier.label} is recommended from available supplier records: ${bestSupplier.deliveryLabel} and ${bestSupplier.reliabilityLabel}.`
      : `${bestSupplier.label} is available for the selected products, but lead-time and reliability fields are needed for comparison.`
    : 'No supplier recommendation is available because the dataset has no supplier field.'
}

function buildInventoryAlerts(recommendationRows, demandRows, supplierRows, forecastModel) {
  if (!forecastModel) {
    return [{
      title: 'Forecast required',
      body: 'Generate a forecast before AIRE creates inventory alerts.',
      marker: '!',
      tone: 'info',
    }]
  }

  if (!recommendationRows.length) {
    return [{
      title: 'Inventory fields required',
      body: 'The forecast is ready. Add product and current-stock fields to calculate stock alerts.',
      marker: '!',
      tone: 'warning',
    }]
  }

  const urgentRow = recommendationRows.find((row) => row.priority === 'High') ?? recommendationRows[0]
  const growthRow = demandRows[0]
  const overstockRow = recommendationRows.find((row) => row.currentStatus === 'Overstock')
  const supplierRisk = supplierRows.find((supplier) => supplier.reliabilityLevel === 'Low')
  const confidence = forecastModel?.summary?.confidence

  return [
    {
      title: urgentRow.daysUntilStockout === null
        ? `${urgentRow.sku} needs current-stock data`
        : `${urgentRow.sku} stock may run out in ${urgentRow.daysUntilStockout} days`,
      body: confidence
        ? `Forecast confidence is ${confidence}%, so review reorder quantity before inventory drops below safety stock.`
        : 'Review reorder quantity before inventory drops below the safety threshold.',
      marker: '!',
      tone: 'warning',
    },
    {
      title: `${growthRow.product} demand changed by ${growthRow.trendLabel}`,
      body: 'Compare the new forecast with current stock before changing the next order.',
      marker: '+',
      tone: 'info',
    },
    overstockRow ? {
      title: `${overstockRow.sku} inventory exceeds expected demand`,
      body: 'Consider reducing reorder volume or applying promotional movement.',
      marker: '-',
      tone: 'success',
    } : null,
    supplierRisk ? {
      title: `${supplierRisk.label} delivery delay risk`,
      body: 'Supplier reliability is lower than preferred for urgent reorder items.',
      marker: '!',
      tone: 'critical',
    } : null,
  ].filter(Boolean)
}

function buildDecisionRecommendations(recommendationRows, supplierRows, forecastModel) {
  if (!forecastModel || !recommendationRows.length) {
    return []
  }

  const highPriority = recommendationRows.find((row) => row.priority === 'High') ?? recommendationRows[0]
  const overstock = recommendationRows.find((row) => row.currentStatus === 'Overstock')
  const bestSupplier = supplierRows.find((supplier) => supplier.reliabilityLevel === 'High') ?? supplierRows[0]
  const safetyTarget = recommendationRows.find((row) => row.priority !== 'Low') ?? recommendationRows[1]
  const modelReorderTitle = forecastModel?.reorder?.title

  return [
    modelReorderTitle ?? `Review ${highPriority.sku} reorder requirement`,
    overstock ? `Pause the next ${overstock.sku} order and review excess stock` : null,
    bestSupplier ? `Review ${bestSupplier.label} for urgent replenishment` : null,
    safetyTarget ? `Maintain ${formatCount(safetyTarget.safetyStock)} safety units for ${safetyTarget.sku}` : null,
  ].filter(Boolean)
}

function buildInventoryFilterOptions(rows, categoryColumn, supplierColumn, recommendationRows = [], supplierRows = []) {
  const rowCategories = categoryColumn
    ? uniqueLabels(rows.map((row) => normalizeLabel(row[categoryColumn])))
    : []
  const recommendationCategories = uniqueLabels(recommendationRows.map((row) => row.category))
  const categories = uniqueLabels([...recommendationCategories, ...rowCategories]).slice(0, 12)

  const rowSuppliers = supplierColumn
    ? uniqueLabels(rows.map((row) => normalizeLabel(row[supplierColumn])))
    : []
  const recommendationSuppliers = uniqueLabels(recommendationRows.map((row) => row.supplier))
  const supplierLabels = uniqueLabels(supplierRows.map((row) => row.label))
  const suppliers = uniqueLabels([...recommendationSuppliers, ...supplierLabels, ...rowSuppliers]).slice(0, 12)

  return [
    {
      key: 'category',
      label: 'Product Category',
      options: ['All Categories', ...categories],
    },
    {
      key: 'supplier',
      label: 'Supplier',
      options: ['All Suppliers', ...suppliers],
    },
    { key: 'risk', label: 'Risk Level', options: ['All Risk Levels', 'High', 'Medium', 'Low'] },
  ]
}

function buildInventoryReportText({ summaryCards, demandRows, recommendationRows, supplierRows, logisticsMetrics, trendSeries }) {
  const summary = summaryCards
    .map((card) => `${card.label}: ${card.value} (${card.note})`)
    .join('\n')
  const demand = demandRows.map((row) => `${row.product}: ${row.forecastLabel}`).join('\n')
  const recommendations = recommendationRows
    .map((row) => `${row.sku} | Current ${formatCount(row.currentStock)} | Forecast ${formatCount(row.forecastDemand)} | Suggested ${formatCount(row.suggestedOrder)} | ${row.status}`)
    .join('\n')
  const suppliers = supplierRows.map((row) => `${row.label} | ${row.deliveryLabel} | ${row.reliabilityLabel}`).join('\n')
  const metrics = logisticsMetrics.map((metric) => `${metric.label}: ${metric.value} (${metric.note})`).join('\n')

  return [
    'Inventory Intelligence Report',
    '',
    'Summary',
    summary,
    '',
    'Predicted Demand Next 7 Days',
    demand,
    '',
    'Decision Matrix',
    recommendations,
    '',
    'Supplier Analysis',
    suppliers,
    '',
    'Logistics Metrics',
    metrics,
    '',
    `Trend points: ${trendSeries.labels.join(', ')}`,
  ].join('\n')
}

function buildRecommendationText(recommendationRows) {
  return [
    'SKU,Current Stock,Forecast Demand,Safety Stock,Suggested Order,Status',
    ...recommendationRows.map(
      (row) =>
        `${row.sku},${row.currentStock},${row.forecastDemand},${row.safetyStock},${row.suggestedOrder},${row.status}`
    ),
  ].join('\n')
}

function findColumn(columns, keywords) {
  return columns.find((column) => {
    const normalized = String(column).toLowerCase().replace(/[_-]+/g, ' ')
    return keywords.some((keyword) => normalized.includes(keyword))
  })
}

function normalizeLabel(value) {
  return String(value ?? '').trim()
}

function uniqueLabels(values) {
  return Array.from(new Set(values.filter(Boolean)))
}

function parseNumericValue(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  const cleaned = String(value ?? '').replace(/[^0-9.-]/g, '')
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : 0
}

function parseCurrencyValue(value) {
  return parseNumericValue(String(value ?? '').replace(/RM/gi, '').replace(/,/g, ''))
}

function parseDatasetDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value
  }

  if (typeof value === 'number' && Number.isFinite(value) && value > 1000 && value < 70000) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30))
    excelEpoch.setUTCDate(excelEpoch.getUTCDate() + Math.round(value))
    return excelEpoch
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function formatMonthKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function formatMonthLabel(date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date)
}

function average(values) {
  if (!values.length) {
    return 0
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function calculateTrend(values) {
  if (!values.length) {
    return 0
  }

  const first = values[0]
  const last = values[values.length - 1]
  if (!first) {
    return last > 0 ? 0.18 : 0
  }

  return clamp((last - first) / Math.max(first, 1), -0.22, 0.22)
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function formatCurrency(value) {
  const safeValue = Number.isFinite(Number(value)) ? Number(value) : 0
  return `RM ${Math.round(safeValue).toLocaleString('en-US')}`
}

function formatCompactCurrency(value) {
  const safeValue = Number.isFinite(Number(value)) ? Number(value) : 0
  if (safeValue >= 1000000) {
    return `RM ${(safeValue / 1000000).toFixed(1)}m`
  }
  if (safeValue >= 1000) {
    return `RM ${(safeValue / 1000).toFixed(1)}k`
  }
  return `RM ${Math.round(safeValue).toLocaleString('en-US')}`
}

function formatCount(value) {
  const safeValue = Number.isFinite(Number(value)) ? Number(value) : 0
  if (safeValue >= 1000) {
    return `${(safeValue / 1000).toFixed(safeValue >= 10000 ? 0 : 1)}k`
  }
  return Math.round(safeValue).toLocaleString('en-US')
}

function formatOptionalCount(value) {
  return value === null || value === undefined ? 'Unavailable' : formatCount(value)
}

function formatOptionalDays(value) {
  return value === null || value === undefined ? 'Unavailable' : `${formatCount(value)} days`
}
