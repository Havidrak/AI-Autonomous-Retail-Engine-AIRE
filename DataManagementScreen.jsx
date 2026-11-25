import {
  IconBadge,
  IconCheck,
  IconChevronRight,
  IconDownload,
  IconFilter,
  IconFilterMini,
  IconHistory,
  IconRocket,
  IconSparkles,
  IconUpload,
  IconTrash,
  NavIcon,
  StatusDot,
} from './Icons.jsx'
import { formatCellValue, getCellClassName, normalizeStatus } from '../lib/workspaceUtils.js'

export default function DataManagementScreen({
  dataset,
  featureActions,
  handleDrop,
  handleFeatureAction,
  handleDeleteHistoryItem,
  handleHistorySelect,
  handleInputChange,
  handleRocketAction,
  handleToolboxAction,
  handleUndoAll,
  hasDataset,
  inputRef,
  isDragging,
  operationLog,
  onPageChange,
  pageHeadingRef,
  previewColumns,
  previewRows,
  qualityMetrics,
  safePage,
  user,
  uploadHistory,
  toolboxActions,
  totalPages,
  uploadCardRef,
  uploadMessage,
  openFilePicker,
  onDragEnter,
  onDragLeave,
  onDragOver,
}) {
  return (
    <div className="content-grid">
      <section className="main-panel">
        <div className="page-heading" ref={pageHeadingRef}>
          <h1>Curate Your Retail Datasets</h1>
          <p>Clean, transform, and engineer features with precision-tuned AI tools.</p>
        </div>

        <section
          ref={uploadCardRef}
          className={`upload-card${isDragging ? ' dragging' : ''}`}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            className="file-input"
            type="file"
            accept=".csv,.json,.xls,.xlsx"
            onChange={handleInputChange}
          />
          <div className="upload-card-inner">
            <div className="upload-icon">
              <IconUpload />
            </div>
            <h2>Drag and drop retail datasets</h2>
            <p>{uploadMessage}</p>
            <button className="primary-button" type="button" onClick={openFilePicker}>
              Browse Files
            </button>
          </div>
        </section>

        {dataset ? (
          <section className="table-card">
            <div className="card-header">
              <div className="card-header-title">
                <span>Dataset Preview: {dataset.fileName}</span>
                <span className="verified-pill">Uploaded</span>
              </div>

              <div className="table-actions">
                <button className="ghost-icon-button" type="button" aria-label="Filter">
                  <IconFilter />
                </button>
                <button className="ghost-icon-button" type="button" aria-label="Download">
                  <IconDownload />
                </button>
              </div>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    {previewColumns.map((column) => (
                      <th key={column}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, index) => (
                    <tr key={`${dataset.fileName}-${index}`}>
                      {previewColumns.map((column) => (
                        <td
                          key={`${column}-${index}`}
                          className={getCellClassName(column, row[column])}
                        >
                          {column.toLowerCase() === 'status' ? (
                            <StatusDot status={normalizeStatus(row[column])} />
                          ) : (
                            formatCellValue(row[column])
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <span>
                Showing {previewRows.length} of {dataset.rows.length} entries
              </span>
              <div className="pagination">
                <button
                  type="button"
                  onClick={() => onPageChange((current) => Math.max(1, current - 1))}
                  disabled={safePage === 1}
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => onPageChange((current) => Math.min(totalPages, current + 1))}
                  disabled={safePage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {user ? (
          <section className="side-card history-card">
            <div className="side-card-header">
              <div className="side-card-title">
                <IconHistory />
                <h3>Upload History</h3>
              </div>
            </div>

            <div className="history-list">
              {uploadHistory.length ? (
                uploadHistory.map((item) => (
                  <div
                    className="history-item"
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleHistorySelect(item)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        handleHistorySelect(item)
                      }
                    }}
                  >
                    <div className="history-item-top">
                      <div className="history-item-copy">
                        <div className="history-file">{item.fileName}</div>
                        <div className="history-meta">
                          {item.rows} rows · {item.columns} columns
                        </div>
                      </div>
                      <div className="history-item-actions">
                        <span className="history-chip">{item.fileType}</span>
                        <button
                          className="history-delete-button"
                          type="button"
                          aria-label={`Delete ${item.fileName} from history`}
                          onClick={(event) => {
                            event.stopPropagation()
                            handleDeleteHistoryItem(item)
                          }}
                        >
                          <IconTrash />
                        </button>
                      </div>
                    </div>

                    <div className="history-item-bottom">
                      <span>{item.fileSizeLabel}</span>
                      <span>{item.uploadedLabel}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="history-empty">
                  Upload a file to save it here for the current account.
                </div>
              )}
            </div>
          </section>
        ) : null}
      </section>

      <aside className="insights-panel">
        <section className="side-card toolbox-card">
          <div className="side-card-title">
            <IconSparkles />
            <h3>Cleaning Toolbox</h3>
          </div>

          <div className="toolbox-list">
            {toolboxActions.map((action) => (
              <button
                className="toolbox-item"
                key={action.title}
                type="button"
                onClick={() => handleToolboxAction(action.action)}
                disabled={!hasDataset}
              >
                <div className="toolbox-item-left">
                  <span className="toolbox-icon">
                    <NavIcon type={action.icon} />
                  </span>
                  <span>{action.title}</span>
                </div>
                <span className="toolbox-trailing">
                  {action.action === 'removeDuplicates' ? (
                    <span className="mini-badge">Smart Scan</span>
                  ) : (
                    <IconChevronRight />
                  )}
                </span>
              </button>
            ))}
          </div>

          <div className="feature-section">
            <div className="feature-label">Feature Engineering</div>
            <div className="feature-list">
              {featureActions.map((action) => (
                <button
                  key={action.title}
                  className={`feature-item ${action.tone}`}
                  type="button"
                  onClick={() => handleFeatureAction(action.action)}
                  disabled={!hasDataset}
                >
                  <span className="feature-icon">
                    <NavIcon type={action.icon} />
                  </span>
                  <span>{action.title}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="side-card log-card">
          <div className="side-card-header">
            <h3>Operation Log</h3>
            <button className="link-button" type="button" onClick={handleUndoAll}>
              Undo All
            </button>
          </div>

          <div className="timeline">
            {operationLog.length ? (
              operationLog.map((item) => (
                <div className="timeline-item" key={item.id}>
                  <div className={`timeline-marker ${item.status}`}>
                    {item.status === 'success' ? <IconCheck /> : <IconFilterMini />}
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-title">{item.title}</div>
                    <div className="timeline-body">{item.body}</div>
                    <div className="timeline-time">{item.time}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="timeline-empty no-line">
                Upload a file and run a toolbox action to populate the log.
              </div>
            )}
          </div>

          <button
            className="floating-help"
            type="button"
            aria-label="Return to overview"
            onClick={handleRocketAction}
          >
            <IconRocket />
          </button>
        </section>

        {qualityMetrics ? (
          <section className="quality-card">
            <div className="quality-label">
              <IconBadge />
              <span>Data Quality Score</span>
            </div>
            <div className="quality-main">
              <span className="quality-score">{qualityMetrics.score}%</span>
              <span className="quality-delta">{qualityMetrics.delta}</span>
            </div>
            <p className="quality-copy">{qualityMetrics.message}</p>
          </section>
        ) : null}
      </aside>
    </div>
  )
}
