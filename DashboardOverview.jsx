import { useState } from 'react'
import { DashboardGlyph, IconChevronLeft, IconGrid } from './Icons.jsx'

export default function DashboardOverview({
  dataset,
  dashboardModel,
  weeklyTrendRange,
  onWeeklyTrendRangeChange,
  customerRef,
  inventoryRef,
  onDecisionAction,
  onQueueAction,
  topRef,
}) {
  const [productMetric, setProductMetric] = useState('revenue')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedRisk, setSelectedRisk] = useState(null)
  const [hoveredProduct, setHoveredProduct] = useState(null)
  const [hoveredProductPoint, setHoveredProductPoint] = useState(null)

  const categoryOverview = dashboardModel.categoryOverview ?? {
    totalLabel: '-',
    totalCaption: 'No category data available',
    segments: [],
    donutStops: '#dfe7fb 0 100%',
    details: {},
  }
  const selectedCategoryDetail = selectedCategory
    ? categoryOverview.details?.[selectedCategory] ?? null
    : null
  const topProductsView =
    dashboardModel.topProducts?.[productMetric] ??
    dashboardModel.topProducts?.revenue ?? {
      totalLabel: '-',
      totalCaption: 'No product data available',
      items: [],
      details: {},
    }
  const selectedProductDetail = selectedProduct
    ? selectedProduct
    : null
  const selectedProductSeries = selectedProductDetail?.monthlySeries?.slice(-12) ?? []
  const selectedProductSeriesMax = Math.max(
    ...selectedProductSeries.map((entry) => entry.revenue),
    1
  )
  const weeklyTrendPeak = Math.max(
    ...((dashboardModel.weeklyTrend ?? []).map((point) => point.height)),
    1
  )
  const selectedRiskDetail = selectedRisk ? dashboardModel.riskDetails?.[selectedRisk] ?? null : null

  if (!dataset || !dashboardModel) {
    return (
      <div className="dashboard-page" ref={topRef}>
        <section className="dashboard-empty-state">
          <div className="dashboard-empty-icon">
            <IconGrid />
          </div>
          <h2>Upload a dataset to unlock your overview</h2>
          <p>
            Strategic metrics, action queues, and risk indicators will appear here after you
            upload a CSV, JSON, or Excel file from Data Management.
          </p>
        </section>
      </div>
    )
  }

  return (
    <div className="dashboard-page" ref={topRef}>
      <section className="dashboard-kpi-grid">
        {dashboardModel.metrics.map((metric) => (
          <article className="dashboard-kpi-card" key={metric.label}>
            <div className="dashboard-kpi-header">
              <span>{metric.label}</span>
            <div className={`dashboard-kpi-icon ${metric.tone}`}>
              <DashboardGlyph type={metric.icon} />
            </div>
          </div>
            <div className="dashboard-kpi-value-stack">
              <div className="dashboard-kpi-value-row">
                <strong>{metric.value}</strong>
              </div>
              {metric.delta ? (
                <span className={`dashboard-kpi-delta ${metric.deltaTone}`}>{metric.delta}</span>
              ) : null}
            </div>
            {metric.meta ? <p>{metric.meta}</p> : null}
            {metric.progress ? (
              <div className="dashboard-kpi-progress">
                <div style={{ width: `${metric.progress}%` }} />
              </div>
            ) : null}
            {metric.bars ? (
              <div className="dashboard-mini-bars" aria-hidden="true">
                {metric.bars.map((height, index) => (
                  <span key={`${metric.label}-${index}`} style={{ height: `${height}%` }} />
                ))}
              </div>
            ) : null}
            {metric.footnote ? <div className="dashboard-kpi-footnote">{metric.footnote}</div> : null}
            {metric.avatars?.length ? (
              <div className="dashboard-kpi-monitoring">
                <div className="dashboard-kpi-avatars">
                  {metric.avatars.map((label) => (
                    <span key={label}>{label}</span>
                  ))}
                </div>
                <small>Monitoring active</small>
              </div>
            ) : null}
          </article>
        ))}
      </section>

      <section className="dashboard-bento-grid">
        <article className="dashboard-strategy-panel" ref={customerRef}>
          <div className="dashboard-panel-header">
            <h2>
              <DashboardGlyph type="sparkles" />
              <span>AI Strategy Summary</span>
            </h2>
            <span className="dashboard-panel-badge">
              {dashboardModel.actions.length} actions pending
            </span>
          </div>

          <div className="dashboard-action-list">
            {dashboardModel.actions.length ? (
              dashboardModel.actions.map((action) => (
                <div className={`dashboard-action-card ${action.tone}`} key={action.id}>
                  <div className="dashboard-action-icon">
                    <DashboardGlyph type={action.icon} />
                  </div>
                  <div className="dashboard-action-content">
                    <div className="dashboard-action-heading">
                      <h3>{action.title}</h3>
                      <span>{action.priorityLabel}</span>
                    </div>
                    <p>{action.summary}</p>
                    <div className="dashboard-action-buttons">
                      <button type="button" onClick={() => onDecisionAction(action, 'approve')}>
                        {action.completed ? 'Approved' : action.primaryAction}
                      </button>
                      {action.secondaryAction ? (
                        <button
                          className="secondary"
                          type="button"
                          onClick={() => onDecisionAction(action, 'secondary')}
                        >
                          {action.secondaryAction}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="dashboard-empty-card">
                No strategy cards match the current dashboard search.
              </div>
            )}
          </div>
        </article>

        <div className="dashboard-side-grid">
          <article className="dashboard-chart-card dashboard-chart-card-compact">
            <div className="dashboard-chart-header">
              <h2>Weekly Sales Trend</h2>
              <select
                className="dashboard-chart-range"
                value={weeklyTrendRange}
                onChange={(event) => onWeeklyTrendRangeChange?.(event.target.value)}
                aria-label="Weekly trend range"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
            <div className="dashboard-trend-bars" aria-label="Weekly sales trend chart">
              {dashboardModel.weeklyTrend.map((point) => (
                <div
                  className={`dashboard-trend-bar${
                    point.height === weeklyTrendPeak
                      ? ' is-peak'
                      : ''
                  }`}
                  key={point.label}
                  title={point.tooltip}
                  aria-label={`${point.label} ${point.tooltip}`}
                >
                  <div className="dashboard-trend-tooltip">{point.tooltip}</div>
                  <span style={{ height: `${point.height}%` }} />
                </div>
              ))}
            </div>
            <div className="dashboard-trend-labels">
              {dashboardModel.weeklyTrend.map((point) => (
                <span key={`${point.label}-axis`}>{point.label}</span>
              ))}
            </div>
          </article>

          <article className="dashboard-inventory-card" ref={inventoryRef}>
            <h2>Inventory Status Breakdown</h2>
            <div className="dashboard-inventory-content">
              <div className="dashboard-inventory-ring">
                <div className="dashboard-inventory-ring-track" />
                <div
                  className="dashboard-inventory-ring-primary"
                  style={{ transform: `rotate(${dashboardModel.inventory.primaryAngle}deg)` }}
                />
                <div
                  className="dashboard-inventory-ring-secondary"
                  style={{ transform: `rotate(${dashboardModel.inventory.secondaryAngle}deg)` }}
                />
                <div className="dashboard-inventory-center">
                  <strong>{dashboardModel.inventory.totalLabel}</strong>
                  <span>{dashboardModel.inventory.totalCaption}</span>
                </div>
              </div>
              <div className="dashboard-inventory-legend">
                {dashboardModel.inventory.segments.map((segment) => (
                  <div className="dashboard-inventory-row" key={segment.label}>
                    <div>
                      <span className={`dashboard-inventory-dot ${segment.tone}`} />
                      <span>{segment.label}</span>
                    </div>
                    <strong>{segment.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </article>

        </div>
      </section>

      <section className="dashboard-insight-grid">
        <article className="dashboard-category-card">
          <div className="dashboard-panel-header">
            <h2>
              <DashboardGlyph type="spark" />
              <span>Sales by Category</span>
            </h2>
            <div className="dashboard-category-total">
              <span>Total Sales</span>
              <strong>{categoryOverview.totalLabel}</strong>
            </div>
          </div>

          {selectedCategoryDetail ? (
            <div className="dashboard-drill-view">
              <button
                className="dashboard-drill-back"
                type="button"
                onClick={() => setSelectedCategory(null)}
              >
                <IconChevronLeft />
                <span>Back</span>
              </button>

              <div className="dashboard-drill-summary">
                <div>
                  <div className="dashboard-drill-eyebrow">Category breakdown</div>
                  <h3>{selectedCategoryDetail.label}</h3>
                </div>
                <div className="dashboard-drill-total">
                  <strong>{selectedCategoryDetail.totalLabel}</strong>
                  <span>{selectedCategoryDetail.totalCaption}</span>
                </div>
              </div>

              <div className="dashboard-category-detail-list">
                {selectedCategoryDetail.items.length ? (
                  selectedCategoryDetail.items.map((item) => (
                    <div className="dashboard-category-detail-row" key={item.label}>
                      <div className="dashboard-category-detail-name">
                        <strong>{item.label}</strong>
                        <small>{item.detailValue}</small>
                      </div>
                      <div className="dashboard-category-detail-track">
                        <span style={{ width: `${item.barWidth}%` }} />
                      </div>
                      <div className="dashboard-category-detail-value">
                        <span>{item.revenueLabel}</span>
                        <small>{item.share}%</small>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="dashboard-empty-card">No items found for this category.</div>
                )}
              </div>
            </div>
          ) : (
            <div className="dashboard-category-body">
              <div
                className="dashboard-category-donut"
                aria-label="Sales by category breakdown"
                style={{ background: `conic-gradient(${categoryOverview.donutStops})` }}
              >
                <div className="dashboard-category-center">
                  <strong>{categoryOverview.totalLabel}</strong>
                  <span>{categoryOverview.totalCaption}</span>
                </div>
              </div>

              <div className="dashboard-category-legend">
                {categoryOverview.segments.map((segment) => (
                  <button
                    className="dashboard-category-row dashboard-category-row-button"
                    key={segment.label}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(segment.label)
                    }}
                  >
                    <div className="dashboard-category-row-label">
                      <span
                        className="dashboard-category-dot"
                        style={{ background: segment.color }}
                      />
                      <div>
                        <strong>{segment.label}</strong>
                        <small className={segment.growthTone === 'negative' ? 'negative' : ''}>
                          {segment.growthLabel}
                        </small>
                      </div>
                    </div>
                    <div className="dashboard-category-row-value">
                      <span>{segment.value}</span>
                      <small>{segment.share}%</small>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </article>

        <article className="dashboard-product-card">
          <div className="dashboard-panel-header">
            <h2>
              <DashboardGlyph type="box" />
              <span>Top Products</span>
            </h2>
            <div className="dashboard-product-toggle" role="tablist" aria-label="Top products metric">
              <button
                className={productMetric === 'revenue' ? 'active' : ''}
                type="button"
                onClick={() => setProductMetric('revenue')}
              >
                Revenue
              </button>
              <button
                className={productMetric === 'units' ? 'active' : ''}
                type="button"
                onClick={() => setProductMetric('units')}
              >
                Units
              </button>
            </div>
          </div>

          {selectedProductDetail ? (
            <div className="dashboard-drill-view">
              <button
                className="dashboard-drill-back"
                type="button"
                onClick={() => setSelectedProduct(null)}
              >
                <IconChevronLeft />
                <span>Back</span>
              </button>

              <div className="dashboard-drill-summary">
                <div>
                  <div className="dashboard-drill-eyebrow">Monthly sales performance</div>
                  <h3>{selectedProductDetail.label}</h3>
                </div>
                <div className="dashboard-drill-total">
                  <strong>{selectedProductDetail.totalLabel}</strong>
                  <span>{selectedProductDetail.totalCaption}</span>
                </div>
              </div>

              <div className="dashboard-product-chart-wrap">
                {selectedProductSeries.length ? (
                  <>
                    <div className="dashboard-product-chart" aria-label="Monthly sales performance">
                      {selectedProductSeries.map((point) => {
                        const barHeight =
                          point.revenue > 0
                            ? Math.max(12, Math.round((point.revenue / selectedProductSeriesMax) * 100))
                            : 6
                        return (
                          <div
                            className={`dashboard-product-chart-bar${
                              hoveredProductPoint === point.key ? ' is-active' : ''
                            }`}
                            key={point.key}
                            tabIndex={0}
                            title={point.tooltip}
                            aria-label={point.tooltip}
                            onMouseEnter={() => setHoveredProductPoint(point.key)}
                            onMouseLeave={() => setHoveredProductPoint(null)}
                            onFocus={() => setHoveredProductPoint(point.key)}
                            onBlur={() => setHoveredProductPoint(null)}
                          >
                            <div className="dashboard-product-chart-tooltip">{point.tooltip}</div>
                            <span style={{ height: `${barHeight}%` }} />
                          </div>
                        )
                      })}
                    </div>
                    <div className="dashboard-product-chart-labels">
                      {selectedProductSeries.map((point) => (
                        <span key={`${point.key}-label`}>{point.label}</span>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="dashboard-empty-card">
                    Monthly sales data is not available for this product.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="dashboard-product-summary">
                <strong>{topProductsView.totalLabel}</strong>
                <span>{topProductsView.totalCaption}</span>
              </div>

              <div className="dashboard-product-list">
                {topProductsView.items.map((item) => (
                  <button
                    className="dashboard-product-row dashboard-product-row-button"
                    key={item.id}
                    type="button"
                    onMouseEnter={() => setHoveredProduct(item.label)}
                    onMouseLeave={() => setHoveredProduct(null)}
                    onFocus={() => setHoveredProduct(item.label)}
                    onBlur={() => setHoveredProduct(null)}
                    onClick={() => {
                      setSelectedProduct(item)
                    }}
                  >
                    <div className="dashboard-product-name">
                      <strong>{item.label}</strong>
                      <small>{item.badge}</small>
                    </div>
                    <div className="dashboard-product-meter">
                      <div
                        className={`dashboard-product-tooltip${
                          hoveredProduct === item.label ? ' is-active' : ''
                        }`}
                      >
                        {item.displayValue}
                      </div>
                      <div className="dashboard-product-track">
                        <span style={{ width: `${item.barWidth}%` }} />
                      </div>
                    </div>
                    <div className="dashboard-product-value">
                      <span>{item.displayValue}</span>
                      <small>{item.detailValue}</small>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </article>
      </section>

      <section className="dashboard-bottom-grid">
        <div className="dashboard-risk-stack">
          <article className="dashboard-risk-card">
            <h2>Risk Indicators</h2>
            {selectedRiskDetail ? (
              <div className="dashboard-risk-drill">
                <button
                  className="dashboard-drill-back"
                  type="button"
                  onClick={() => setSelectedRisk(null)}
                >
                  <IconChevronLeft />
                  <span>Back</span>
                </button>

                <div className="dashboard-drill-summary">
                  <div>
                    <div className="dashboard-drill-eyebrow">{selectedRiskDetail.eyebrow}</div>
                    <h3>{selectedRiskDetail.title}</h3>
                  </div>
                  <div className={`dashboard-risk-badge ${selectedRiskDetail.tone}`}>
                    {selectedRiskDetail.tone === 'critical'
                      ? 'Critical'
                      : selectedRiskDetail.tone === 'warning'
                        ? 'Watch'
                        : 'Healthy'}
                  </div>
                </div>

                <p className="dashboard-risk-summary">{selectedRiskDetail.summary}</p>

                <div className="dashboard-risk-stat-grid">
                  {selectedRiskDetail.stats.map((stat) => (
                    <div className="dashboard-risk-stat" key={stat.label}>
                      <span>{stat.label}</span>
                      <strong>{stat.value}</strong>
                    </div>
                  ))}
                </div>

                <div className="dashboard-risk-note">
                  <small>Recommended next step</small>
                  <p>{selectedRiskDetail.recommendation}</p>
                </div>

                <div className="dashboard-risk-actions">
                  <button
                    type="button"
                    onClick={() => {
                      onQueueAction({ title: selectedRiskDetail.title })
                    }}
                  >
                    {selectedRiskDetail.actionLabel}
                  </button>
                </div>
              </div>
            ) : (
              <div className="dashboard-risk-list">
                {dashboardModel.risks.length ? (
                  dashboardModel.risks.map((risk) => (
                    <button
                      className={`dashboard-risk-item ${risk.tone}`}
                      key={risk.id}
                      type="button"
                      onClick={() => setSelectedRisk(risk.id)}
                    >
                      <div>
                        <span className={`dashboard-risk-dot ${risk.tone}`} />
                        <span>{risk.label}</span>
                      </div>
                      <DashboardGlyph type={risk.icon} />
                    </button>
                  ))
                ) : (
                  <div className="dashboard-empty-card">
                    No risk indicators match the current dashboard search.
                  </div>
                )}
              </div>
            )}
          </article>

          <article className="dashboard-recommendation-chart-card">
            <div className="dashboard-chart-header">
              <h2>Recommendation Summary</h2>
              <span className="dashboard-panel-badge">Engine Output</span>
            </div>
            <div className="dashboard-recommendation-bars" aria-label="Recommendation summary bar chart">
              {dashboardModel.recommendationSummary.map((item) => (
                <div className="dashboard-recommendation-bar-row" key={item.label}>
                  <div className="dashboard-recommendation-bar-label">
                    <span>{item.label}</span>
                    <small>{item.note}</small>
                  </div>
                  <div className="dashboard-recommendation-bar-track">
                    <span className={item.tone} style={{ width: `${item.width}%` }} />
                  </div>
                  <strong>{item.valueLabel}</strong>
                </div>
              ))}
            </div>
          </article>
        </div>

        <article className="dashboard-queue-card">
          <div className="dashboard-queue-header">
            <h2>Action Queue Ranking</h2>
            <span>Priority Sort</span>
          </div>
          <div className="dashboard-queue-table">
            <div className="dashboard-queue-head">
              <span>Rank</span>
              <span>Action Required</span>
              <span>Est. Impact</span>
              <span>Priority</span>
            </div>
            {dashboardModel.queue.length ? (
              dashboardModel.queue.map((item) => (
                <div className="dashboard-queue-row" key={item.id}>
                  <span className="dashboard-queue-rank">{item.rank}</span>
                  <div className="dashboard-queue-title">
                    <span>{item.title}</span>
                    <small>{item.subtitle}</small>
                  </div>
                  <span className="dashboard-queue-impact">{item.impact}</span>
                  <span className={`dashboard-queue-priority ${item.priorityTone}`}>
                    {item.priorityLabel}
                  </span>
                  <button type="button" onClick={() => onQueueAction(item)} aria-label={`Review ${item.title}`}>
                    <DashboardGlyph type="more" />
                  </button>
                </div>
              ))
            ) : (
              <div className="dashboard-empty-row">
                No ranked actions match the current dashboard search.
              </div>
            )}
          </div>
        </article>
      </section>
    </div>
  )
}
